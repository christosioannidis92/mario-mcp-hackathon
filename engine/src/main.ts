// Dev entry. Loads the sample level fixture and starts the game.
// In production, the WebSocket bridge will call game.loadLevel() instead.

import { Game } from "./index";
import type { Level } from "./types";
import sampleLevel from "../../fixtures/sample-level.json";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game canvas not found");
}

const game = new Game(canvas);
game.loadLevel(sampleLevel as Level);

// Expose for browser console poking during development.
(window as unknown as { game: Game }).game = game;
