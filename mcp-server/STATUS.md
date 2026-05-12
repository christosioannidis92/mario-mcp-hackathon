# mcp-server status (PR3 branch)

Working notes for the P3 work-in-progress. The team-facing doc is `README.md`.

## What works now

- MCP server boots over **stdio** (the transport Claude Desktop uses).
- Loads `fixtures/sample-level.json` into an in-memory `currentLevel`.
- Registered tools:
  - `describe_level` — returns the current level JSON.
  - `place_tile(x, y, type)` — mutates `tiles[y][x]`.
  - `spawn_enemy(x, y, type)` — pushes to `enemies[]`.
  - `set_player_start(x, y)` — moves player spawn.
- Out-of-bounds calls return `isError: true` with a readable message.
- After every authoring mutation, the **stub bridge** logs `[bridge:stub] would send to browser: <payload>` to stderr — placeholder for the real WebSocket bridge.

## Run locally

```sh
cd mcp-server
npm install
npm run build
npm start            # boots over stdio; press Ctrl+C to stop
```

## Wire up Claude Desktop

Copy the contents of `claude_desktop_config.snippet.json` into
`%APPDATA%\Claude\claude_desktop_config.json` (merge with any existing
`mcpServers` map). Restart Claude Desktop. The `mario` server should
appear and expose all four tools.

## Smoke test without Claude Desktop

```sh
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}\n{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n' | node dist/index.js
```

## Still TODO (needs coordination)

- **Real WebSocket bridge** — needs P1 to confirm message names and port. Stub message shape: `{ type: "loadLevel", level }`, `{ type: "pressButton", button, durationMs }`, `{ type: "reset" }`, `{ type: "requestState" }`. Suggested port: `localhost:8787`.
- **`get_game_state` / `press_button` / `reset_level`** — stretch goal; requires the browser to be running and sending back `state` snapshots.
- **`generate_level` / `load_level` / `list_levels`** — depend on P2 building chunks/registry.
- **Swap inline mutation for P2's `tools.ts`** — when P2 ships pure functions, replace the logic in `src/level-store.ts` with imports.
- **System prompt for Claude Desktop** — write after tool list is final.
