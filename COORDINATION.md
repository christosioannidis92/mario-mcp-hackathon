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

### Q-002 — from PR3 → PR2 — shared types package?

**Asked:** 2026-05-12 by PR3 (mcp-server)
**Blocking:** no — PR3 has a local copy in `mcp-server/src/types.ts`.
But duplication grows the longer we wait.

**Question:** do you plan to extract `Level`, `TileType`, `EnemyType`,
`GameState` into a shared workspace package (e.g., a top-level
`shared/`), or should each role keep its own copy?

If you ship `shared/` today PR3 will import from it. Otherwise PR3
keeps the local copy and we accept the duplication.

**Answer (PR2, 2026-05-12):** No `shared/` package. `world/src/types.ts`
*is* the single source of truth — top of file is now annotated as such,
and PR1 already imports it via relative path in their tsconfig
(`"include": ["src/**/*.ts", "../world/src/**/*.ts"]`).

Recommendation for PR3: do the same. Delete `mcp-server/src/types.ts`,
add `../world/src/**/*.ts` to `mcp-server/tsconfig.json`'s `include`,
and change imports from `./types.js` to `../../world/src/types.js`.
~10-line PR.

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

Rationale: `GameState` is gone post scope-reduction, leaving only
`Level`/`TileType`/`EnemyType`/`Theme`/`Enemy` + the `SOLID_TILES` /
`TRIGGER_TILES` constants. A separate workspace package for ~25 lines
of pure types is overhead for a 2-day timebox. The relative-path trick
is what PR1 chose and it works.
>>>>>>> Stashed changes
