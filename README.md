# Mario MCP Hackathon

A 2D platformer where an **MCP server is the level designer and player AI**. Claude generates levels live, then plays them.

## The angle

The MCP server exposes tools that both *author* and *play* the game:

- **Authoring**: `generate_level`, `place_tile`, `spawn_enemy`
- **Playing**: `get_game_state`, `press_button`, `reset_level`

This gives a single demo arc that's hard to forget: empty level → Claude designs it → Claude plays through it → "make it harder" → Claude adds enemies.

## Stack

- **Engine**: HTML5 Canvas + TypeScript (or Phaser if you want a head start)
- **MCP server**: TypeScript SDK (`@modelcontextprotocol/sdk`)
- **Bridge**: WebSocket between MCP server and browser (so tool calls mutate the live game)
- **Client**: Claude Desktop for the demo

## Repo layout

```
ai-hackathon/
├── engine/              # Person 1 - game loop, physics, renderer
├── world/               # Person 2 - level schema, enemies, tool implementations
├── mcp-server/          # Person 3 - MCP protocol server + browser bridge
├── demo/                # Person 4 - split-screen demo page, assets, demo script
├── fixtures/            # shared sample data so everyone can work in parallel
├── TOOLS.md             # the integration contract (read this first)
└── PLAN.md              # roles + hour-by-hour plan
```

## Where to start

1. Whole team reads [TOOLS.md](TOOLS.md) and [PLAN.md](PLAN.md).
2. Agree the tool list and level JSON schema in hour 0 — these are the only things that need to stay in sync.
3. Everyone codes against [fixtures/sample-level.json](fixtures/sample-level.json) until real integrations land.

## Assets

Use CC0 platformer sprites (Kenney.nl has a good pack). Do not ship actual Nintendo IP — call it something like "Tile Jumper" for the demo title screen.
