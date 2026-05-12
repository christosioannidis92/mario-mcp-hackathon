# Tool Contract

This is the integration seam between the four roles. Changes to anything in this file go through a 2-minute standup — everyone needs to know.

## Level JSON schema

```ts
type TileType = "ground" | "brick" | "pipe" | "coin" | "flag" | "empty";
type EnemyType = "goomba" | "koopa" | "piranha" | "kiosk";

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

## Tools

### Authoring

| Tool | Inputs | Returns | Notes |
|---|---|---|---|
| `generate_level` | `theme`, `difficulty` (1-5), `length` (tiles) | `level_id` | Composes chunks from `world/chunks/` |
| `place_tile` | `level_id`, `x`, `y`, `type` | `ok` | Errors if out of bounds |
| `spawn_enemy` | `level_id`, `x`, `y`, `type` | `enemy_id` | |
| `set_player_start` | `level_id`, `x`, `y` | `ok` | |
| `load_level` | `level_id` | `ok` | Tells the running game to switch to this level |

### Inspection

| Tool | Inputs | Returns |
|---|---|---|
| `list_levels` | — | `level_id[]` |
| `describe_level` | `level_id` | `Level` |

## Engine API (internal, between Persons 1 & 2)

The browser-side `Game` object Person 1 exposes. The WebSocket bridge calls `loadLevel` whenever Claude authors changes; the engine handles keyboard input and physics on its own.

```ts
interface Game {
  loadLevel(level: Level): void;   // called by the bridge on every edit
  reset(): void;                   // restart current level (keyboard 'R')
}
```

## Error shape

All tools return either `{ ok: true, data: ... }` or `{ ok: false, error: string }`. The MCP server translates `ok: false` into an MCP error response.
