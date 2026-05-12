# engine/ — Spec

Owner: Person 1. Stack: vanilla TypeScript + HTML5 Canvas 2D. No engine, no framework.

This spec is precise on purpose. If something here is wrong, fix the spec first, then the code.

## 1. Scope

The engine renders a `Level` (see [../TOOLS.md](../TOOLS.md)), simulates the player and enemies under deterministic physics, reads keyboard input, follows the player with a camera, and exposes a tiny imperative API to the WebSocket bridge.

### In scope (must-have for 1.5h demo)

- Render a level from JSON: tiles, enemies (static sprite), player, flag.
- Player physics: gravity, run, jump, AABB tile collision, fall-off death.
- Enemy collision: contact from the side = player dies; (stomp is stretch).
- Keyboard input: ←/→ or A/D move, Space jump, R reset.
- Camera: horizontal follow with deadzone, clamped to level.
- Win on touching `flag`. Death on falling off bottom or enemy contact.
- `loadLevel(level)` is hot-swappable mid-play: replaces world, respawns player at `playerStart`.

### Non-goals

- No sound, no particles, no animation frames (single sprite per entity).
- No stomp / shells / piranha behavior (enemies are static obstacles in v1; if time allows, goomba walks).
- No score, no coins-collected counter (coins render but do nothing).
- No save state, no pause menu.
- No mobile/touch input.
- No DPI scaling beyond `devicePixelRatio` on the canvas backing store.

## 2. Public API

The single entry point the rest of the project depends on. Do not add to this without updating [../TOOLS.md](../TOOLS.md).

```ts
// engine/src/index.ts
export class Game {
  constructor(canvas: HTMLCanvasElement, assets: AssetBundle);
  loadLevel(level: Level): void;   // hot-swap; respawns player at level.playerStart
  reset(): void;                   // restart current level (also bound to 'R')
  destroy(): void;                 // cancel RAF, detach listeners (for HMR safety)
}

export interface AssetBundle {
  // Sprite images keyed by name. Engine does not load them — caller does.
  tiles: Record<TileType, HTMLImageElement | null>;
  enemies: Record<EnemyType, HTMLImageElement | null>;
  player: HTMLImageElement | null;
  background?: HTMLImageElement | null;
}
```

The engine **never** exposes input hooks, game state, or per-frame callbacks. The bridge calls `loadLevel`; everything else happens inside.

### Behavior of `loadLevel` mid-play

- The new level replaces the current one immediately at the start of the next frame.
- Player is respawned at `level.playerStart` with zero velocity, regardless of prior state.
- Camera snaps (no interpolation) to the new player position.
- This is the integration moment with Claude — it must feel instant.

### Bridge client (added 2026-05-12, see COORDINATION.md Q-001)

The engine ships a thin WebSocket client at `engine/src/bridge.ts` so every
consumer doesn't reimplement it. Contract:

```ts
new Bridge({
  url?: string,                          // default ws://localhost:8787
  onLevel: (level: Level) => void,       // wire to game.loadLevel
  onStatus?: (s: BridgeStatus) => void,  // optional for UI badges
});
```

The bridge owns reconnect (exponential backoff 1s → 10s), sends
`{ type: "ready" }` on every open, and ignores unknown message types
for forward-compat. It is *optional* — the engine works fine without it.

## 3. Module layout

```
engine/
├── SPEC.md                  ← this file
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts             ← Game class, public API
│   ├── types.ts             ← Level, TileType, EnemyType (re-exported from world/ if possible)
│   ├── constants.ts         ← TILE_SIZE, GRAVITY, JUMP_V0, etc. (see §5)
│   ├── loop.ts              ← fixed-timestep loop driver
│   ├── input.ts             ← keyboard state, edge-triggered events
│   ├── physics.ts           ← integration + AABB-vs-tile resolution
│   ├── entities.ts          ← Player, Enemy structs + update functions
│   ├── camera.ts            ← follow with deadzone, clamp to level
│   ├── render.ts            ← draws everything for one frame
│   └── assets.ts            ← AssetBundle type + a helper to preload from URLs
└── test/
    └── physics.spec.ts      ← unit tests for collision resolution (if time)
```

One concern per file. No circular imports. `types.ts` and `constants.ts` are leaves.

## 4. Coordinate systems

Three coordinate spaces. Convert at boundaries; never mix.

| Space  | Units            | Origin            | Used for                          |
|--------|------------------|-------------------|-----------------------------------|
| Tile   | tiles (integer)  | top-left of level | `Level.tiles[y][x]`, enemy spawns |
| World  | pixels (float)   | top-left of level | physics, entity positions         |
| Screen | pixels (float)   | top-left of canvas| rendering                         |

Conversions:
- `world = tile * TILE_SIZE`
- `screen = world - camera`

Y increases downward in all three. There is no Y flip anywhere.

## 5. Constants

In `src/constants.ts`. All physics in pixels and seconds. Tune by feel during the 1.5h, but start here.

```ts
export const TILE_SIZE = 32;          // px
export const CANVAS_W  = 800;         // px (25 tiles)
export const CANVAS_H  = 480;         // px (15 tiles — matches Level.height)

export const GRAVITY     = 1800;      // px/s² downward
export const MAX_FALL_V  = 900;       // px/s terminal velocity

export const RUN_SPEED   = 180;       // px/s horizontal max
export const RUN_ACCEL   = 1200;      // px/s² when key held
export const RUN_FRICTION= 1500;      // px/s² decel when no key

export const JUMP_V0     = 620;       // px/s upward at jump press
export const JUMP_CUT_V  = 200;       // px/s — if releasing space while rising, cap upward v at this
export const COYOTE_MS   = 90;        // ms after leaving ground where jump still works
export const JUMP_BUFFER_MS = 90;     // ms — pressing jump before landing still jumps on land

export const PLAYER_W    = 24;        // px (smaller than tile so corners forgive)
export const PLAYER_H    = 28;        // px

export const FIXED_DT    = 1 / 60;    // s — simulation step
export const MAX_FRAME_MS= 100;       // clamp huge frame gaps (tab refocus)

export const CAMERA_DEADZONE_W = 160; // px — player free movement inside this band
```

Tunable. Do not hardcode these elsewhere.

## 6. Game loop

Fixed-timestep accumulator. Decouples physics from frame rate so collision stays predictable.

```
loop(now):
  dtMs = min(now - lastNow, MAX_FRAME_MS)
  accumulator += dtMs / 1000
  while accumulator >= FIXED_DT:
    step(FIXED_DT)        // updates input edges, physics, entities, camera
    accumulator -= FIXED_DT
  render()                // interpolation optional; not needed for hackathon
  requestAnimationFrame(loop)
```

State machine inside `step`:

```
PLAYING --(touch flag)-->     WON --(R or any key)--> PLAYING(reset)
PLAYING --(fall off / enemy)--> DEAD --(after 0.6s)--> PLAYING(reset)
```

`WON` and `DEAD` freeze player physics; enemies and rendering continue. Reset re-applies `playerStart`.

## 7. Physics

### Integration

Semi-implicit Euler. Per fixed step:

```
vy += GRAVITY * dt;  vy = clamp(vy, -INF, MAX_FALL_V)
if (left)  vx -= RUN_ACCEL * dt
if (right) vx += RUN_ACCEL * dt
if (!left && !right) vx = approach(vx, 0, RUN_FRICTION * dt)
vx = clamp(vx, -RUN_SPEED, RUN_SPEED)

move(dx = vx*dt, dy = vy*dt)
```

### Collision (the only tricky bit)

Resolve **per-axis**, X then Y. For each axis:

1. Move the player AABB by that axis's delta.
2. Compute the integer tile range the AABB overlaps.
3. For each solid tile in range, push the AABB out along the axis of motion.
4. On collision, zero that axis's velocity. If Y collision and we were moving down, set `onGround = true`.

Solid tiles: `ground`, `brick`, `pipe`. Non-solid: `empty`, `coin`, `flag` (flag is a *trigger*, not solid).

Triggers are handled in a second pass after collision: any tile the AABB overlaps that is a trigger fires its effect (`flag` → WON). Do not consume coins in v1.

### Jump

- On jump key press: if `onGround` OR `coyoteTimer < COYOTE_MS` → `vy = -JUMP_V0`; clear coyote.
- If jump pressed while airborne and unresolved: store in `jumpBuffer = JUMP_BUFFER_MS`. On landing, consume.
- On jump key release: if `vy < -JUMP_CUT_V`, set `vy = -JUMP_CUT_V`. (Variable jump height.)

### Enemies

- Static sprite at `(x, y)` in tile coords, AABB of one tile.
- Contact with player AABB → DEAD (skip stomp logic for v1).
- Stretch: goomba walks left at 60 px/s, reverses on wall or ledge.

### Death

- Player Y > `level.height * TILE_SIZE + 64` → DEAD (fell off).
- Enemy overlap → DEAD.
- DEAD → freeze 600 ms → reset.

## 8. Input

`src/input.ts` owns a singleton bound to `window`. Tracks held state + edge events for one frame.

```ts
export interface Input {
  left: boolean; right: boolean; jump: boolean;
  jumpPressed: boolean;   // edge: true for one step only
  jumpReleased: boolean;  // edge: true for one step only
  resetPressed: boolean;
}
```

Key mapping:

| Action  | Keys                        |
|---------|-----------------------------|
| left    | ArrowLeft, KeyA             |
| right   | ArrowRight, KeyD            |
| jump    | Space, ArrowUp, KeyW        |
| reset   | KeyR                        |

`preventDefault` on these so the page doesn't scroll. `keydown` repeats are ignored for edge events.

## 9. Rendering

Single 2D context. Draw order per frame:

1. Clear (background fill or background image stretched to canvas).
2. Tiles in the visible tile range (camera-culled). Skip `empty`.
3. Enemies in the visible range.
4. Player.
5. HUD overlay: "WON!" / "you died" text when in those states.

Sprite fallback: if `assets.tiles[type]` is `null`, draw a colored rect (so we can run before P4's sprites land).

Pixel-snapping: floor screen coords before drawing to avoid sub-pixel sprite shimmer.

Backing-store: `canvas.width = CANVAS_W * dpr; canvas.height = CANVAS_H * dpr; ctx.scale(dpr, dpr);` Set CSS size to `CANVAS_W × CANVAS_H`. Disable image smoothing (`ctx.imageSmoothingEnabled = false`) — sprites are pixel art.

## 10. Camera

Horizontal follow with a deadzone of `CAMERA_DEADZONE_W` centered on the canvas. The player can move freely inside the deadzone; outside it, the camera moves to keep the player at the edge.

Clamp camera X to `[0, level.width * TILE_SIZE - CANVAS_W]`.

Vertical camera is fixed at 0 for v1 (levels are 15 tiles tall == canvas height — no vertical scroll needed).

## 11. Assets

The engine takes preloaded `HTMLImageElement`s via `AssetBundle`. It does **not** fetch. Person 4 owns asset paths and loading; engine exposes a helper `preloadAssets(manifest)` for convenience but works fine with all-nulls (colored-rect fallback).

This decoupling means the engine can run from hour 1, before any sprites exist.

## 12. Error handling

- `loadLevel` validates: `tiles.length === height`, every row `length === width`, `playerStart` in bounds. On failure, log and keep the previous level.
- Out-of-bounds enemies are dropped silently with a warn.
- No exceptions thrown across the API boundary.

## 13. Testing

Pragmatic. For 1.5h, do not block on tests. If time:

- `physics.spec.ts` — one test per collision case: floor stop, ceiling bonk, wall slide, corner clip.
- Integration smoke: instantiate `Game` against `fixtures/sample-level.json` in a headless canvas (jsdom or skip if painful).

## 14. Order of work (suggested, 1.5h budget)

| Slice | Time | Done when… |
|---|---|---|
| Scaffold + types + constants | 10m | `npm run dev` opens blank canvas |
| Tile + player rendering from JSON | 15m | sample-level visible, player at start, no motion |
| Game loop + input + horizontal move | 15m | player slides left/right, no gravity |
| Gravity + ground collision | 15m | player falls and stands on ground |
| Jump + wall/ceiling collision | 15m | full platforming feels right |
| Camera follow | 5m | scrolling works |
| Flag = win, fall/enemy = die + reset | 10m | win/lose loop closes |
| `loadLevel` hot-swap + 'R' reset | 5m | bridge integration ready |

Cut order if behind: stretch goomba walk, then variable jump, then coyote/buffer, then enemy sprites (use colored rects).

## 15. Open questions

These are decisions to make in hour 0, not in code:

- Do we depend on a build tool (Vite) or compile-and-serve? **Recommend Vite** for HMR and zero-config TS — saves 20 minutes.
- Package layout: workspace or per-folder `package.json`? **Recommend per-folder** for 1.5h; less to debug.
- Does `world/` export the `Level` type, or does `engine/` re-declare it? **Recommend single source in `world/types.ts`, engine imports.**

## 16. Out of scope, explicit

Anything not listed in §1 "in scope." If it isn't here, it isn't built today. Add to backlog, do not stretch the demo.
