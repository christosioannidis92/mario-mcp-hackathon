# engine/ — Person 1

Game loop, renderer, physics, input.

## Responsibilities

- Render a level from a `Level` JSON (see [../TOOLS.md](../TOOLS.md))
- Tile + sprite rendering on Canvas (32px tiles suggested)
- Physics: gravity, collision, jumping, running
- Input queue — keyboard *and* programmatic input go through the same path
- Camera follow
- Win/lose conditions (touch flag = win, fall off / enemy contact = lose)

## Public API (what you expose to the rest of the project)

```ts
class Game {
  constructor(canvas: HTMLCanvasElement);
  loadLevel(level: Level): void;
  getState(): GameState;
  pressButton(button: "left" | "right" | "jump" | "run", durationMs: number): void;
  reset(): void;
  onTick(cb: (state: GameState) => void): void;  // called every frame
}
```

## First deliverable (hour 4)

`new Game(canvas).loadLevel(sampleLevelJson)` renders the fixture with a stationary player sprite. No physics yet.

## Stretch

- Variable jump height (hold-to-jump-higher)
- Particle effects on coin collect
- Screen shake on death
