# engine/ — Person 1

Game loop, renderer, physics, input.

## Responsibilities

- Render a level from a `Level` JSON (see [../TOOLS.md](../TOOLS.md))
- Tile + sprite rendering on Canvas (32px tiles suggested)
- Physics: gravity, collision, jumping, running
- Keyboard input: arrow keys / WASD to move, space to jump, R to reset
- Camera follow
- Win/lose conditions (touch flag = win, fall off / enemy contact = lose)

## Public API (what you expose to the rest of the project)

```ts
class Game {
  constructor(canvas: HTMLCanvasElement);
  loadLevel(level: Level): void;  // called by the WebSocket bridge on every Claude edit
  reset(): void;                  // also bound to keyboard 'R'
}
```

Keyboard input is handled internally — the bridge never injects player input.

## First deliverable (hour 4)

`new Game(canvas).loadLevel(sampleLevelJson)` renders the fixture with a stationary player sprite. No physics yet.

## Stretch

- Variable jump height (hold-to-jump-higher)
- Particle effects on coin collect
- Screen shake on death
