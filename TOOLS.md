# Tool Contract

This is the integration seam between the four roles. Changes to anything in this file go through a 2-minute standup — everyone needs to know.

## Level JSON schema

```ts
type TileType = "ground" | "brick" | "pipe" | "coin" | "flag" | "empty";
type EnemyType = "goomba" | "koopa" | "piranha";

interface Level {
  id: string;
  theme: "overworld" | "underground" | "castle" | "ice" | "spooky";
  width: number;          // tile units
  height: number;         // tile units (usually 15)
  tiles: TileType[][];    // [y][x], origin top-left
  enemies: { x: number; y: number; type: EnemyType }[];
  playerStart: { x: number; y: number };
}
```

All coordinates are **tile units**, not pixels. The renderer converts (suggest 32px tiles).

## Game state schema

What `get_game_state` returns to Claude when it's playing:

```ts
interface GameState {
  player: { x: number; y: number; vx: number; vy: number; grounded: boolean; alive: boolean };
  enemies: { id: string; x: number; y: number; type: EnemyType; alive: boolean }[];
  camera: { x: number; y: number };
  score: number;
  timeLeft: number;
  levelId: string;
  finished: boolean;
}
```

## Tools

### Authoring

| Tool | Inputs | Returns | Notes |
|---|---|---|---|
| `generate_level` | `theme`, `difficulty` (1-5), `length` (tiles) | `level_id` | Composes chunks from `world/chunks/` |
| `place_tile` | `level_id`, `x`, `y`, `type` | `ok` | Errors if out of bounds |
| `spawn_enemy` | `level_id`, `x`, `y`, `type` | `enemy_id` | |
| `set_player_start` | `level_id`, `x`, `y` | `ok` | |
| `load_level` | `level_id` | `ok` | Tells the running game to switch level |

### Playing

| Tool | Inputs | Returns | Notes |
|---|---|---|---|
| `get_game_state` | — | `GameState` | Snapshot at call time |
| `press_button` | `button` ("left" \| "right" \| "jump" \| "run"), `duration_ms` | `ok` | Queued, applied next frame |
| `reset_level` | — | `ok` | Restart current level |

### Inspection

| Tool | Inputs | Returns |
|---|---|---|
| `list_levels` | — | `level_id[]` |
| `describe_level` | `level_id` | `Level` |

## Engine API (internal, between Persons 1 & 2)

The browser-side `Game` object Person 1 exposes. Person 2's tool implementations call into this via the WebSocket bridge:

```ts
interface Game {
  loadLevel(level: Level): void;
  getState(): GameState;
  pressButton(button: string, durationMs: number): void;
  reset(): void;
  onTick(cb: (state: GameState) => void): void;
}
```

## Error shape

All tools return either `{ ok: true, data: ... }` or `{ ok: false, error: string }`. The MCP server translates `ok: false` into an MCP error response.
