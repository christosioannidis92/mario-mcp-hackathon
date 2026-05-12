# Team coordination

Async Q&A board for cross-role coordination. Use this when you need a
decision from another role that would otherwise block you.

## How to use

- Each open question lives under `## Open` with a stable ID (`Q-001`,
  `Q-002`, …, monotonic).
- Header is always `from PRn → PRm` so it's obvious who's asking and
  who owns the answer.
- The addressee edits `**Answer:**` inline and moves the whole block to
  `## Resolved`. History stays in the file.
- If a question turns into a decision, leave it in `## Resolved` — this
  doubles as our decision log.

## Open

### Q-004 — from PR4 → PR3 — bridge handshake test before demo day

**Asked:** 2026-05-12 by PR4 (demo)
**Blocking:** no — PR4 has a local dry-run harness that exercises
`handleBridgeMessage` directly, so the demo page works without your
server. But the *real* round-trip (Claude → MCP → WebSocket → browser)
has never been tested.

**Question:** when your bridge is wired up for real, can you:

1. Ping me so I can hard-reload the demo page and watch the
   `bridge: connecting… → online` transition.
2. Manually send one `{ "type": "loadLevel", "level": <any fixture> }`
   message from the server side (no Claude in the loop) so we confirm
   the round trip works end-to-end before adding the LLM.
3. Confirm port `8787` and message shape match Q-001 exactly — my
   client is hardcoded against that contract.

Catches we want to find early: CORS, serialization quirks, port
collisions, `ready` handshake timing.

**Answer:** _pending_

## Resolved

### Q-001 — from PR3 → PR1 — WebSocket message contract

**Asked:** 2026-05-12 by PR3 (mcp-server)
**Resolved:** 2026-05-12 by PR1 (engine)

**Question:** post scope-reduction the bridge is one-way (server →
browser) with a single message. PR3 proposes:

- **server → browser**
  - `{ "type": "loadLevel", "level": Level }` — sent after every
    authoring tool call (`place_tile`, `spawn_enemy`,
    `set_player_start`, `load_level`)
- **browser → server**
  - `{ "type": "ready" }` on connect → PR3 replies with a `loadLevel`
    snapshot of the current in-memory level
- **port:** `localhost:8787`

OK as-is, or do you want a different message name / port / extra
fields?

**Answer:** Accept the proposal as-is. Concretely on the engine side:

- Engine treats `{ "type": "loadLevel", "level": Level }` as the sole
  authoritative message and calls `game.loadLevel(level)`. The existing
  `validateLevel` check in `engine/src/index.ts` is a defensive
  backstop: invalid payloads are dropped with a `console.warn` and the
  current level is preserved (so a bad tool call from Claude won't
  blank the screen mid-demo).
- Engine sends `{ "type": "ready" }` exactly once on `onopen`. No
  periodic pings, no acks.
- Engine connects to `ws://localhost:8787`. Hardcoded for v1; can lift
  to a query param or env var later if we ever need to retarget.
- Engine owns its own reconnect on `onclose` / `onerror`: exponential
  backoff `1s → 2s → 4s → 10s` cap, `console.warn` only — no on-screen
  UI. Once reconnected, re-emits `ready` so the server resends a
  `loadLevel` snapshot.
- Unknown `type` values are ignored silently (forward-compat).

Two non-blocking notes for later iterations:

1. If you ever need a force-reset without changing the level (e.g.,
   from a hypothetical `reset_player` tool), send
   `{ "type": "reset" }` — semantically clearer than re-sending the
   same `loadLevel`. Not needed for v1.
2. No receipt ack today. If debugging or replay ever needs one, add
   `{ "type": "ack", "id": string }` with a per-message id on the
   server side and the engine will echo back. Skip for v1.

---

### Q-002 — from PR3 → PR2 — shared types package?

**Asked:** 2026-05-12 by PR3 (mcp-server)
**Resolved:** 2026-05-12 by PR2 (world)

**Question:** do you plan to extract `Level`, `TileType`, `EnemyType`,
`GameState` into a shared workspace package (e.g., a top-level
`shared/`), or should each role keep its own copy?

If you ship `shared/` today PR3 will import from it. Otherwise PR3
keeps the local copy and we accept the duplication.

**Answer:** No `shared/` package. `world/src/types.ts` *is* the single
source of truth — top of file is now annotated as such, and PR1
already imports it via relative path in their tsconfig
(`"include": ["src/**/*.ts", "../world/src/**/*.ts"]`).

Recommendation for PR3: do the same. Delete `mcp-server/src/types.ts`,
add `../world/src/**/*.ts` to `mcp-server/tsconfig.json`'s `include`,
and change imports from `./types.js` to `../../world/src/types.js`.
~10-line PR.

Rationale: `GameState` is gone post scope-reduction, leaving only
`Level`/`TileType`/`EnemyType`/`Theme`/`Enemy` + the `SOLID_TILES` /
`TRIGGER_TILES` constants. A separate workspace package for ~25 lines
of pure types is overhead for a 2-day timebox. The relative-path trick
is what PR1 chose and it works.

---

### Q-003 — from PR1 → PR4 — how should `demo/` consume the engine?

**Asked:** 2026-05-12 by PR1 (engine)
**Resolved:** 2026-05-12 — by action (PR4 chose C)

**Question:** how should `demo/` integrate the engine? Options:

- **A.** Library bundle: `engine/lib/engine.iife.js` exposes
  `window.TileJumper = { Game, Bridge, preloadAssets }`. Demo adds
  `<script src="../engine/lib/engine.iife.js">` and replaces
  `renderLevel` with `new Game(canvas)` + `new Bridge({...})`.
- **B.** Demo becomes its own Vite project that imports
  `../engine/src/index.ts` directly. Cleanest dev loop; demo adopts a
  build toolchain.
- **C.** Demo stays a static viewer. Engine has its own dev server.
  Demo pane shows JSON re-rendering on each `loadLevel`, but isn't
  playable; we play from `engine/`'s page.

**Answer:** Resolved as **C** by code. PR4 wired their own WebSocket
client inline in `demo/index.html` (commit `df7d48f`, lines 549+),
matching the Q-001 contract (port 8787, `ready` message,
`loadLevel` handler, exponential backoff capped at 15s instead of my
10s — fine), and kept `renderLevel` for the demo pane. The static
viewer behaviour is intentional: Claude authors → JSON pane updates →
canvas re-renders without physics. Playable demo runs from the
engine's own dev server (`cd engine && npm run dev`).

The library bundle from option A was built speculatively and remains
available if we ever want to swap the demo to playable later:

- `cd engine && npm install && npm run build:lib` produces
  `engine/lib/engine.iife.js` (~10 KB raw / ~4 KB gzipped). `lib/` is
  gitignored; rebuild after engine changes.
- Exposes `window.TileJumper = { Game, Bridge, preloadAssets }`.
- `Game` gained `setAssets(bundle)` so callers can construct
  immediately and hydrate sprites later via `preloadAssets(...).then(setAssets)`.

Drop-in upgrade path if anyone wants it post-hackathon — replace
`renderLevel` with `new TileJumper.Game(canvas)` and feed the existing
`handleBridgeMessage` into `game.loadLevel`.
