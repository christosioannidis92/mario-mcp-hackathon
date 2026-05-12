# world/ — Person 2

Level schema, enemy behaviours, and the implementations of every MCP tool.

## Responsibilities

- TypeScript types for `Level`, `Tile`, `Enemy`, `GameState` (see [../TOOLS.md](../TOOLS.md))
- Enemy logic: Goomba (walks, falls off ledges), Koopa (walks, becomes shell when stomped), Piranha (rises/falls from pipes)
- Library of **level chunks** that `generate_level` composes:
  - `flat-ground`, `gap`, `staircase-up`, `staircase-down`, `pipe-with-piranha`, `floating-platforms`, `enemy-cluster`
- Pure-function implementations of every tool — no DOM, no globals
- Round-trip tests: serialise a level, mutate via tools, assert expected state

## Public API

```ts
// authoring
generateLevel(theme: Theme, difficulty: 1|2|3|4|5, length: number): Level;
placeTile(level: Level, x: number, y: number, type: TileType): Level;
spawnEnemy(level: Level, x: number, y: number, type: EnemyType): Level;
setPlayerStart(level: Level, x: number, y: number): Level;

// inspection
describeLevel(level: Level): string;  // human-readable summary for Claude
```

## First deliverable (hour 4)

`tools.ts` exports all functions as stubs that satisfy the contract and pass a round-trip test. Real generation/composition can come later — for hour 4 it's enough that the MCP server can call these without errors.

## Notes on `generate_level`

Don't try to be clever. Concatenate 4-6 random chunks weighted by difficulty. Hardcode a few hand-tuned chunks per theme. Claude will tell you which ones look good.
