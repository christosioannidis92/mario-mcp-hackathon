import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  describeLevel,
  placeTile,
  spawnEnemy,
  setPlayerStart,
} from "../../world/src/tools.js";
import type { Difficulty } from "../../world/src/constants.js";
import { store, currentLevelId } from "./store.js";

const tileTypeSchema = z.enum([
  "ground",
  "brick",
  "pipe",
  "coin",
  "flag",
  "empty",
]);
const enemyTypeSchema = z.enum(["goomba", "koopa", "piranha", "kiosk"]);
const themeSchema = z.enum([
  "overworld",
  "underground",
  "castle",
  "ice",
  "spooky",
]);
const difficultySchema = z
  .number()
  .int()
  .min(1)
  .max(5)
  .transform((n) => n as Difficulty);

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function okText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function err(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

function resolveLevelId(provided: string | undefined): string | null {
  return provided ?? currentLevelId();
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "generate_level",
    {
      description:
        "Create a new level by composing chunks. Returns the new level_id and immediately makes it the current level (bridge pushes loadLevel to the browser).",
      inputSchema: {
        theme: themeSchema,
        difficulty: difficultySchema,
        length: z
          .number()
          .int()
          .min(20)
          .max(400)
          .describe("Level width in tiles."),
        seed: z
          .number()
          .int()
          .optional()
          .describe("Seed for deterministic generation."),
      },
    },
    async ({ theme, difficulty, length, seed }) => {
      const level = store.generate({ theme, difficulty, length, seed });
      const loaded = store.load(level.id);
      if (!loaded.ok) return err(loaded.error);
      return ok({ level_id: level.id });
    },
  );

  server.registerTool(
    "list_levels",
    {
      description: "List the ids of all levels currently in the in-memory store.",
      inputSchema: {},
    },
    async () => ok({ level_ids: store.list(), current: currentLevelId() }),
  );

  server.registerTool(
    "load_level",
    {
      description:
        "Switch the current level to the one with this id. The bridge pushes a loadLevel snapshot to the browser.",
      inputSchema: { level_id: z.string() },
    },
    async ({ level_id }) => {
      const result = store.load(level_id);
      return result.ok ? ok({ ok: true }) : err(result.error);
    },
  );

  server.registerTool(
    "describe_level",
    {
      description:
        "Return a human-readable summary of a level (tile counts, enemy counts, ground gaps, flag position). If level_id is omitted, describes the current level.",
      inputSchema: { level_id: z.string().optional() },
    },
    async ({ level_id }) => {
      const id = resolveLevelId(level_id);
      if (!id) return err("no level loaded — call generate_level first");
      const level = store.get(id);
      if (!level) return err(`unknown level "${id}"`);
      return okText(describeLevel(level));
    },
  );

  server.registerTool(
    "place_tile",
    {
      description:
        "Place a tile at (x, y) in tile units. Origin top-left, y grows downward, standard ground at y=14. If level_id is omitted, edits the current level.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        type: tileTypeSchema,
        level_id: z.string().optional(),
      },
    },
    async ({ x, y, type, level_id }) => {
      const id = resolveLevelId(level_id);
      if (!id) return err("no level loaded — call generate_level first");
      const result = store.mutate(id, (level) => placeTile(level, x, y, type));
      return result.ok ? ok({ ok: true }) : err(result.error);
    },
  );

  server.registerTool(
    "spawn_enemy",
    {
      description:
        "Spawn an enemy at (x, y) in tile units. The enemy's own tile must be empty (cannot spawn inside a solid). If level_id is omitted, edits the current level.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        type: enemyTypeSchema,
        level_id: z.string().optional(),
      },
    },
    async ({ x, y, type, level_id }) => {
      const id = resolveLevelId(level_id);
      if (!id) return err("no level loaded — call generate_level first");
      const result = store.mutate(id, (level) => spawnEnemy(level, x, y, type));
      return result.ok ? ok({ ok: true }) : err(result.error);
    },
  );

  server.registerTool(
    "set_player_start",
    {
      description:
        "Set the player spawn position in tile units. The target tile must not be solid. If level_id is omitted, edits the current level.",
      inputSchema: {
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        level_id: z.string().optional(),
      },
    },
    async ({ x, y, level_id }) => {
      const id = resolveLevelId(level_id);
      if (!id) return err("no level loaded — call generate_level first");
      const result = store.mutate(id, (level) => setPlayerStart(level, x, y));
      return result.ok ? ok({ ok: true }) : err(result.error);
    },
  );
}
