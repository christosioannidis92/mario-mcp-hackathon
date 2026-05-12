// Cross-team smoke test: spawns mcp-server, replays the engine.Bridge
// protocol against PR3's real WebSocket bridge, and validates that
// every loadLevel payload PR3 emits passes engine/src/index.ts's
// validateLevel. Catches schema drift, port collisions, ready-handshake
// timing, and out-of-bounds broadcast bugs before they hit demo day.
//
// Run from engine/:  npm run smoke
// Requires:          mcp-server/dist exists (npm run build in mcp-server)
// Node:              21+ (uses the built-in WebSocket global)

import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const mcpDir = resolve(here, "../../mcp-server");
const mcpEntry = resolve(mcpDir, "dist/mcp-server/src/index.js");

if (!existsSync(mcpEntry)) {
  console.error(`[engine-smoke] mcp-server build missing at ${mcpEntry}`);
  console.error(`[engine-smoke] run: cd mcp-server && npm install && npm run build`);
  process.exit(1);
}
if (typeof WebSocket === "undefined") {
  console.error("[engine-smoke] Node WebSocket global not available — need Node 21+");
  process.exit(1);
}

const proc = spawn(process.execPath, [mcpEntry], {
  stdio: ["pipe", "pipe", "pipe"],
  cwd: mcpDir,
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
  console.error("[engine-smoke] uncaught:", e.message);
  cleanup();
  process.exit(1);
});

proc.stderr.on("data", (d) => process.stderr.write(`[mcp] ${d}`));

const writeRpc = (msg) => proc.stdin.write(JSON.stringify(msg) + "\n");

const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
};

// Mirror of validateLevel in engine/src/index.ts. If the engine's
// validation ever changes, copy the rules here so the smoke catches
// drift on either side.
function validateLevel(level) {
  if (!level || typeof level !== "object") return false;
  if (typeof level.width !== "number" || typeof level.height !== "number") return false;
  if (!Array.isArray(level.tiles) || level.tiles.length !== level.height) return false;
  for (const row of level.tiles) {
    if (!Array.isArray(row) || row.length !== level.width) return false;
  }
  if (!level.playerStart || level.playerStart.x < 0 || level.playerStart.y < 0) return false;
  if (level.playerStart.x >= level.width || level.playerStart.y >= level.height) return false;
  if (!Array.isArray(level.enemies)) return false;
  return true;
}

async function waitForListening() {
  return new Promise((resolveP, rejectP) => {
    const t = setTimeout(() => rejectP(new Error("bridge listening timeout")), 5000);
    proc.stderr.on("data", (d) => {
      if (d.toString().includes("[bridge] listening")) {
        clearTimeout(t);
        resolveP();
      }
    });
  });
}

function openWs() {
  return new Promise((resolveP, rejectP) => {
    const ws = new WebSocket("ws://localhost:8787");
    ws.onopen = () => resolveP(ws);
    ws.onerror = () => rejectP(new Error("ws connection failed"));
  });
}

try {
  // MCP initialize
  writeRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "engine-smoke", version: "0" },
    },
  });
  await waitForListening();

  console.log("\n[engine-smoke] section 1: ready handshake + schema validation");

  const ws = await openWs();
  const messages = [];
  ws.onmessage = (ev) => {
    try { messages.push(JSON.parse(ev.data)); }
    catch { check("non-JSON message", false, "received non-JSON"); }
  };

  ws.send(JSON.stringify({ type: "ready" }));
  await wait(400);

  check("server replied after ready", messages.length >= 1);
  const first = messages[0];
  check("first message type is loadLevel", first?.type === "loadLevel");
  check("first message has level field", first?.level != null);
  check("level passes engine validateLevel", validateLevel(first?.level));
  if (first?.level) {
    const l = first.level;
    check("dimensions positive integers",
      Number.isInteger(l.width) && l.width > 0 && Number.isInteger(l.height) && l.height > 0,
      `width=${l.width}, height=${l.height}`);
    check("tiles[y][x] structure intact",
      l.tiles.length === l.height && l.tiles.every(r => r.length === l.width));
    check("playerStart in bounds",
      l.playerStart.x >= 0 && l.playerStart.x < l.width &&
      l.playerStart.y >= 0 && l.playerStart.y < l.height,
      `playerStart=(${l.playerStart.x},${l.playerStart.y})`);
    check("level id is a non-empty string",
      typeof l.id === "string" && l.id.length > 0, `id="${l.id}"`);
  }

  console.log("\n[engine-smoke] section 2: tool mutation broadcasts");

  const baselineEnemyCount = first?.level?.enemies?.length ?? -1;
  writeRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "place_tile", arguments: { x: 5, y: 13, type: "brick" } },
  });
  await wait(400);

  check("place_tile triggered a broadcast", messages.length >= 2);
  const second = messages[1];
  check("broadcast message type is loadLevel", second?.type === "loadLevel");
  check("broadcast level still validates", validateLevel(second?.level));
  check("placed tile is reflected in broadcast",
    second?.level?.tiles?.[13]?.[5] === "brick",
    `tiles[13][5] = ${second?.level?.tiles?.[13]?.[5]}`);

  writeRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "spawn_enemy", arguments: { x: 9, y: 13, type: "koopa" } },
  });
  await wait(400);

  const third = messages[2];
  check("spawn_enemy triggered a broadcast", messages.length >= 3);
  check("enemy count incremented",
    (third?.level?.enemies?.length ?? -1) === baselineEnemyCount + 1,
    `was ${baselineEnemyCount}, now ${third?.level?.enemies?.length}`);
  check("new enemy reflects spawned koopa",
    third?.level?.enemies?.some(e => e.x === 9 && e.y === 13 && e.type === "koopa"));

  console.log("\n[engine-smoke] section 3: error-path silence");

  const countBefore = messages.length;
  writeRpc({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "place_tile", arguments: { x: 999, y: 999, type: "ground" } },
  });
  await wait(400);

  check("out-of-bounds place_tile did NOT broadcast",
    messages.length === countBefore,
    `was ${countBefore}, now ${messages.length}`);

  console.log("\n[engine-smoke] section 4: disconnect + reconnect");

  ws.close();
  await wait(200);
  const ws2 = await openWs();
  const msgs2 = [];
  ws2.onmessage = (ev) => msgs2.push(JSON.parse(ev.data));
  ws2.send(JSON.stringify({ type: "ready" }));
  await wait(400);

  check("reconnect ready handshake works",
    msgs2.length >= 1 && msgs2[0]?.type === "loadLevel");
  check("reconnect snapshot preserves prior mutations",
    msgs2[0]?.level?.tiles?.[13]?.[5] === "brick",
    `tiles[13][5] after reconnect = ${msgs2[0]?.level?.tiles?.[13]?.[5]}`);
  check("reconnect snapshot includes the spawned koopa",
    msgs2[0]?.level?.enemies?.some(e => e.x === 9 && e.y === 13 && e.type === "koopa"));

  ws2.close();
  await wait(100);

  const failed = checks.filter(c => !c.ok);
  console.log("");
  if (failed.length === 0) {
    console.log(`[engine-smoke] PASS — ${checks.length}/${checks.length} checks`);
    cleanup();
    process.exit(0);
  } else {
    console.log(`[engine-smoke] FAIL — ${failed.length} of ${checks.length} checks failed:`);
    for (const c of failed) console.log(`  ✗ ${c.name}${c.detail ? " — " + c.detail : ""}`);
    cleanup();
    process.exit(1);
  }
} catch (e) {
  console.error("[engine-smoke] error:", e.message);
  cleanup();
  process.exit(1);
}
