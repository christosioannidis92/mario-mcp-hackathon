import type { Level } from "./types.js";

type OutboundMessage =
  | { type: "loadLevel"; level: Level }
  | { type: "pressButton"; button: string; durationMs: number }
  | { type: "reset" }
  | { type: "requestState" };

export function sendToBrowser(msg: OutboundMessage): void {
  process.stderr.write(
    `[bridge:stub] would send to browser: ${JSON.stringify(msg)}\n`,
  );
}
