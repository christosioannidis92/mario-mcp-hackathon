import { WebSocketServer, WebSocket } from "ws";
import type { Level } from "../../world/src/types.js";
import { store } from "./store.js";

type OutboundMessage = { type: "loadLevel"; level: Level };
type InboundMessage = { type: "ready" } | { type: string };

const PORT = 8787;
const clients = new Set<WebSocket>();
let server: WebSocketServer | null = null;

export function startBridge(): void {
  if (server) return;

  server = new WebSocketServer({ port: PORT });

  server.on("listening", () => {
    log(`listening on ws://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    log(`server error: ${(err as Error).message}`);
  });

  server.on("connection", (ws) => {
    clients.add(ws);
    log(`client connected (${clients.size} total)`);

    ws.on("message", (raw) => {
      let msg: InboundMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        log("dropped malformed message");
        return;
      }
      if (msg.type === "ready") {
        const level = store.current();
        if (level) {
          ws.send(JSON.stringify({ type: "loadLevel", level }));
        }
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      log(`client disconnected (${clients.size} remaining)`);
    });

    ws.on("error", (err) => {
      log(`socket error: ${(err as Error).message}`);
    });
  });
}

export function sendToBrowser(msg: OutboundMessage): void {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function log(line: string): void {
  process.stderr.write(`[bridge] ${line}\n`);
}
