// Dev entry. Loads the sample level fixture so the engine has something
// to render even when the MCP server isn't running, then opens the
// WebSocket bridge. The first `loadLevel` message from the server takes
// over from the fixture.

import { Game } from "./index";
import { Bridge, type BridgeStatus } from "./bridge";
import type { Level } from "./types";
import sampleLevel from "../../fixtures/sample-level.json";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game canvas not found");
}

const game = new Game(canvas);
game.loadLevel(sampleLevel as Level);

const statusEl = document.getElementById("bridge-status");
const setStatus = (s: BridgeStatus) => {
  if (!statusEl) return;
  statusEl.textContent = `bridge: ${s}`;
  statusEl.dataset.state = s;
};
setStatus("idle");

const bridge = new Bridge({
  onLevel: (level) => game.loadLevel(level),
  onStatus: setStatus,
});

// Expose for browser-console poking during development.
(window as unknown as { game: Game; bridge: Bridge }).game = game;
(window as unknown as { game: Game; bridge: Bridge }).bridge = bridge;
