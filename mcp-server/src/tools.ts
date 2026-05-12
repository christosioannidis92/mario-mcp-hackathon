import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getLevel,
  placeTile,
  spawnEnemy,
  setPlayerStart,
} from "./level-store.js";
import { sendToBrowser } from "./bridge.js";

const tileTypeSchema = z.enum([
  "ground",
  "brick",
  "pipe",
  "coin",
  "flag",
  "empty",
]);
const enemyTypeSchema = z.enum(["goomba", "koopa", "piranha"]);

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function err(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "describe_level",
    {
      description:
        "Return the current level JSON (tiles, enemies, playerStart). Use this to inspect what exists before authoring.",
      inputSchema: {},
    },
    async () => ok(getLevel()),
  );

  server.registerTool(
    "place_tile",
    {
      description:
        "Place a tile at (x, y) in tile units. Origin top-left, y increases downward. Standard ground is at y=14.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        type: tileTypeSchema,
      },
    },
    async ({ x, y, type }) => {
      try {
        placeTile(x, y, type);
        sendToBrowser({ type: "loadLevel", level: getLevel() });
        return ok({ ok: true });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.registerTool(
    "spawn_enemy",
    {
      description:
        "Spawn an enemy at (x, y) in tile units. Goombas walk, koopas leave shells when stomped, piranhas live in pipes.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        type: enemyTypeSchema,
      },
    },
    async ({ x, y, type }) => {
      try {
        spawnEnemy(x, y, type);
        sendToBrowser({ type: "loadLevel", level: getLevel() });
        return ok({ ok: true });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.registerTool(
    "set_player_start",
    {
      description: "Set the player spawn position in tile units.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
      },
    },
    async ({ x, y }) => {
      try {
        setPlayerStart(x, y);
        sendToBrowser({ type: "loadLevel", level: getLevel() });
        return ok({ ok: true });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );
}
