# Tile Jumper

**A 2D platformer where Claude is the live level designer.**

You describe a level. Claude builds it in the browser while you watch. You pick
up the keyboard and play it. You say "make it harder." Claude rewrites it. You
play again.

---

## The angle

Most "AI + games" demos use a model to generate text or art. We hand Claude
the **authoring tools for a running game** and let it design while a human
plays.

The MCP server exposes the level-editor primitives — `generate_level`,
`place_tile`, `spawn_enemy`, `set_player_start`, `load_level` — as MCP tools.
Claude Desktop sees them as a normal tool list, picks the right calls from a
prompt like *"design a spooky castle, medium difficulty, 60 tiles long"*, and
the browser updates live over a WebSocket bridge.

## How it works

```
 Claude Desktop  ──MCP──▶  MCP server  ──WebSocket──▶  Browser game
                              │                            │
                              ▼                            ▼
                       Level state                   Canvas + physics
```

- **Engine** — HTML5 Canvas + TypeScript. Tile/sprite renderer, gravity,
  collision, jumping, keyboard input, camera follow.
- **World** — Level JSON schema, enemy AI (Goomba walk, Koopa shells), a
  library of level *chunks* (gap, staircase, pipe-with-enemy) that
  `generate_level` composes.
- **MCP server** — `@modelcontextprotocol/sdk`. Registers the authoring tools,
  bridges to the browser over WebSocket.
- **Demo page** — split-screen: game canvas · live level JSON · Claude
  transcript.

## Try it locally

```bash
git clone <repo>
cd mario-mcp-hackathon
npm install
npm run dev      # boots engine, MCP server, demo page
```

Point Claude Desktop at the MCP server config in `mcp-server/claude-config.json`
and ask it to design a level. Sprites are CC0 from [kenney.nl](https://kenney.nl).

## Team

- **Person 1** — Engine: renderer, physics, input
- **Person 2** — World: schema, enemies, tool implementations
- **Person 3** — MCP server + browser bridge
- **Person 4** — Demo page, assets, glue

## Links

- Repo: `<github-url>`
- Backup video: `<youtube-url>`
- MCP spec: https://modelcontextprotocol.io
