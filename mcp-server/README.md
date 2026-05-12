# mcp-server/ — Person 3

MCP protocol server + WebSocket bridge to the browser game.

## Responsibilities

- MCP server using `@modelcontextprotocol/sdk` (stdio transport for Claude Desktop)
- Register every tool from [../TOOLS.md](../TOOLS.md), backed by Person 2's pure functions
- WebSocket bridge: when an authoring tool runs, push the updated level to the browser
- Claude Desktop config (`claude_desktop_config.json` snippet)
- System prompt that teaches Claude the level vocabulary, with 1-2 example levels

## Architecture

```
Claude Desktop  <-stdio->  MCP server  <-ws->  Browser game (human plays via keyboard)
                              |
                              +-- in-memory level store (Person 2's functions)
```

The level store lives in the MCP server, not the browser. The browser is a one-way "view" — it gets told what to render. Claude authors; humans play.

## First deliverable (hour 4)

- MCP server boots
- Claude Desktop shows all tools in the tool list
- `describe_level("sample-1")` returns the fixture level
- Stub WebSocket bridge that logs "would send to browser: ..."

## Claude Desktop config

Add to `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mario": {
      "command": "node",
      "args": ["D:/ClaudeTests/Training/mario-mcp-hackathon/mcp-server/dist/index.js"]
    }
  }
}
```

## System prompt notes

Things to put in the system prompt:
- The level coordinate system (tiles, origin top-left, y increases downward)
- The standard ground height (y=14)
- A worked example: "to make a gap, set tiles 20-23 of row 14 to empty"
- A reminder to always call `set_player_start` after `generate_level`
- Two example level JSONs labelled "easy" and "hard"
