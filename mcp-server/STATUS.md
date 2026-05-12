# mcp-server status (PR3 branch)

Working notes for the P3 work-in-progress. The team-facing doc is `README.md`.

## What works now

- MCP server boots over **stdio** (the transport Claude Desktop uses).
- Loads `fixtures/sample-level.json` into an in-memory `currentLevel`.
- Types come from `world/src/types.ts` (single source of truth, per Q-002 resolution).
- A Claude Desktop system prompt is shipped via the server's `instructions` field — covers tile coords, the four authoring tools, design rules and a worked "make it harder" example.
- Backed by PR2's `LevelStore` from `world/src/tools.js`: multi-level
  store with `generate`, `load`, `mutate`, `list` and a `subscribe`
  hook that the bridge consumes.
- Registered tools (each authoring tool accepts an optional
  `level_id`; if omitted, edits the current level):
  - `generate_level(theme, difficulty, length, seed?)` — composes chunks via PR2's pipeline; returns the new id and makes it current.
  - `list_levels` — returns every id in the store plus the current.
  - `load_level(level_id)` — switches the current level.
  - `describe_level(level_id?)` — human-readable summary (tile/enemy counts, ground gaps, flag).
  - `place_tile(x, y, type, level_id?)`
  - `spawn_enemy(x, y, type, level_id?)` — refuses to spawn inside a solid tile.
  - `set_player_start(x, y, level_id?)` — refuses to spawn the player inside a solid tile.
- Errors (out of bounds, unknown id, invalid spawn) come back as `isError: true` with a readable message.
- **Real WebSocket bridge** on `ws://localhost:8787` (per Q-001 resolution): replies to `{type:"ready"}` with a `loadLevel` snapshot and broadcasts `loadLevel` to all connected clients after every authoring mutation.

## Run locally

```sh
cd mcp-server
npm install
npm run build
npm start            # boots over stdio + ws://localhost:8787; Ctrl+C to stop
npm run smoke        # integrated smoke test of the WebSocket bridge
```

## Wire up Claude Desktop

Copy the contents of `claude_desktop_config.snippet.json` into
`%APPDATA%\Claude\claude_desktop_config.json` (merge with any existing
`mcpServers` map). Restart Claude Desktop. The `mario` server should
appear and expose all four tools.

## Smoke test without Claude Desktop

```sh
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}\n{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n' | node dist/mcp-server/src/index.js
```

For the integrated bridge test (spawns the server, connects a WS client,
asserts mutations propagate): `npm run smoke`.

## Still TODO

- **Live test with Claude Desktop** — wire the config, restart Claude Desktop, run through the demo arc end-to-end: generate → describe → edit → load fixture → edit.
- **System prompt tuning** — once we see how Claude uses the tools in practice, tighten the prompt (especially the "make it harder" example, which is still hand-written against the fixture).

## Out of scope (per `Reduce scope` commit on main)

`get_game_state`, `press_button`, `reset_level` and the `GameState`
schema are dropped — humans play with the keyboard, Claude only
authors. PR3 never registered these tools, so nothing to remove from
code; just keeping the note here for context.
