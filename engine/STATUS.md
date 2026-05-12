# engine status (PR1)

PR1 is **done** for v1. Working notes below; the team-facing surface is
`README.md` and `SPEC.md`.

## What works

- `new Game(canvas, assets?).loadLevel(level)`, `.reset()`,
  `.setAssets(bundle)`, `.destroy()` — full public API, stable.
- Fixed-timestep loop, per-axis AABB collision against the tile grid,
  run/jump with variable height, coyote time, jump buffer.
- Win on touching `flag`; die on enemy contact or fall-off; 0.6 s
  freeze then respawn. `R` resets.
- Camera follow with horizontal deadzone, clamped to level.
- `Bridge` client connecting to `ws://localhost:8787`, sending
  `{ type: "ready" }` on open, calling `loadLevel` on incoming
  `{ type: "loadLevel", level }`. Exponential reconnect 1 s → 10 s.
  Unknown message types ignored.
- Library bundle build (`engine/lib/engine.iife.js`) exposing
  `window.TileJumper = { Game, Bridge, preloadAssets }` for any
  static-HTML consumer.
- Colored-rect fallbacks throughout so the engine runs before sprites
  land. `setAssets` swaps to images at runtime.

## Run locally

```sh
# Engine dev page (playable):
cd engine
npm install
npm run dev                  # http://localhost:5173

# Engine + bridge integration smoke (spawns mcp-server, 19 checks):
cd mcp-server && npm install && npm run build
cd ../engine
npm run smoke

# Library bundle for static consumers (e.g. demo/):
cd engine
npm run build:lib            # → engine/lib/engine.iife.js
```

## Demo-day playbook

1. `cd mcp-server && npm start` first so the bridge is up.
2. `cd engine && npm run dev` next — the `bridge:` badge should turn
   green within a second.
3. Claude Desktop authoring tools should appear under the `mario`
   server. Tool calls produce live tile/enemy changes in the engine
   canvas.
4. Failure rehearsal: kill mcp-server mid-demo → badge goes red → 
   restart → engine reconnects within 10 s and gets a fresh snapshot.

## Integration verified

- End-to-end protocol smoke against PR3's real server passes 19/19
  checks (`engine/npm run smoke`). Covers ready handshake, schema
  validation, tool-mutation broadcasts, error-path silence,
  disconnect+reconnect with state preservation.
- Live two-server check (`mcp-server` on `:8787` + `engine` on
  `:5173`) confirms HTTP serves the engine page with bridge wiring
  and the WebSocket handshake returns `loadLevel` for `sample-1`.

## Cross-team contracts

- `world/src/types.ts` is the single source of truth for `Level`,
  `TileType`, `EnemyType`, `Theme`, `Enemy`, `SOLID_TILES`,
  `TRIGGER_TILES`. Engine and mcp-server both import from there.
- WebSocket contract is locked in COORDINATION.md Q-001 (resolved).
- Demo integration was resolved Q-003 as "C by action" — PR4 wired
  their own bridge inline in `demo/index.html`. Library bundle is
  available if anyone wants to swap demo to playable later.

## Out of scope (not done; not blocking v1)

- Enemy AI (goomba walk, koopa shells, piranha animation) — enemies
  are static one-tile AABBs in v1. Stretch in SPEC §1.
- Stomp mechanic. Enemy contact always kills.
- Coin collection counter. Coins render as triggers but consume nothing.
- Sound playback inside the engine. The demo page has its own
  `demoSound` helper for now.
- Sprite hot-reload across `loadLevel` — `setAssets` is the manual
  hook; no automatic asset discovery.

## Files

```
engine/
├── SPEC.md                       precise spec for this work
├── STATUS.md                     this file
├── README.md                     team-facing overview
├── index.html                    dev page (Vite root)
├── package.json                  dev / build / build:lib / smoke / typecheck
├── tsconfig.json                 includes ../world/src for shared types
├── vite.config.ts                dev + app build
├── vite.lib.config.ts            IIFE library bundle build
├── scripts/
│   └── smoke-bridge.mjs          cross-team protocol smoke (19 checks)
└── src/
    ├── index.ts                  public API: Game, Bridge, preloadAssets
    ├── types.ts                  re-exports world/src/types.ts
    ├── constants.ts              all tunables (gravity, jump, sizes, …)
    ├── loop.ts                   fixed-timestep accumulator
    ├── input.ts                  keyboard with edge events
    ├── physics.ts                integration + per-axis AABB resolution
    ├── entities.ts               Player struct + factory
    ├── camera.ts                 deadzone follow + level clamp
    ├── render.ts                 tiles, enemies, player, HUD; sprite fallbacks
    ├── assets.ts                 AssetBundle + preloadAssets helper
    ├── bridge.ts                 WebSocket client (Q-001 contract)
    └── main.ts                   dev entry: fixture + bridge bootstrap
```
