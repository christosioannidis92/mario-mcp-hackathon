// Smoke test for the WebSocket bridge.
// Spawns the MCP server, connects a WS client, verifies the ready→loadLevel
// reply and that a place_tile mutation broadcasts a fresh loadLevel.

import { spawn } from "node:child_process";
import { WebSocket } from "ws";
import { setTimeout as wait } from "node:timers/promises";

const proc = spawn(process.execPath, ["dist/mcp-server/src/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
});

let cleanedUp = false;
const cleanup = () => {
  if (cleanedUp) return;
  cleanedUp = true;
  if (!proc.killed) proc.kill();
};
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });
process.on("uncaughtException", (e) => {
  console.error("[smoke] uncaught:", e.message);
  cleanup();
  process.exit(1);
});

proc.stdout.on("data", (d) => {
  for (const line of d.toString().split("\n").filter(Boolean)) {
    console.log("[mcp-stdout]", line.slice(0, 200));
  }
});
proc.stderr.on("data", (d) => {
  for (const line of d.toString().split("\n").filter(Boolean)) {
    console.log("[mcp-stderr]", line);
  }
});

const writeRpc = (msg) => proc.stdin.write(JSON.stringify(msg) + "\n");

try {
  writeRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke", version: "0" },
    },
  });

  // Wait for bridge to print "listening" on stderr before connecting.
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("bridge listening timeout")), 5000);
    proc.stderr.on("data", (d) => {
      if (d.toString().includes("[bridge] listening")) {
        clearTimeout(t);
        resolve();
      }
    });
  });

  const ws = new WebSocket("ws://localhost:8787");
  const messages = [];

  await new Promise((resolve, reject) => {
    ws.once("open", resolve);
    ws.once("error", reject);
  });
  console.log("[smoke] ws open");

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    messages.push(msg);
    console.log(
      "[smoke] received",
      msg.type,
      "enemies:",
      msg.level?.enemies?.length,
    );
  });

  ws.send(JSON.stringify({ type: "ready" }));
  await wait(300);

  writeRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "spawn_enemy", arguments: { x: 9, y: 13, type: "koopa" } },
  });
  await wait(400);

  ws.close();
  await wait(100);

  const types = messages.map((m) => m.type);
  const counts = messages.map((m) => m.level?.enemies?.length ?? -1);
  const ok =
    types.length === 2 &&
    types.every((t) => t === "loadLevel") &&
    counts[1] === counts[0] + 1;
  console.log("[smoke] received types:", types, "enemy counts:", counts);
  console.log(ok ? "[smoke] PASS" : "[smoke] FAIL");
  cleanup();
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error("[smoke] error:", e.message);
  cleanup();
  process.exit(1);
}
