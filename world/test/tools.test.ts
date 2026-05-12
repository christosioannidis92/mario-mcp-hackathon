import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";

import { GROUND_ROW } from "../src/constants.js";
import {
  Level,
  LevelStore,
  SOLID_TILES,
  describeLevel,
  generateLevel,
  placeTile,
  setPlayerStart,
  spawnEnemy,
} from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, "../../fixtures/sample-level.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as Level;

describe("fixture round-trip", () => {
  it("loads the fixture and matches the expected shape", () => {
    assert.equal(fixture.id, "sample-1");
    assert.equal(fixture.width, 40);
    assert.equal(fixture.height, 15);
    assert.equal(fixture.tiles.length, 15);
    assert.equal(fixture.tiles[0]!.length, 40);
    assert.equal(fixture.enemies.length, 3);
  });

  it("placeTile mutates immutably and respects bounds", () => {
    const before = fixture.tiles[5]![5];
    const result = placeTile(fixture, 5, 5, "brick");
    assert.ok(result.ok);
    if (!result.ok) return;
    assert.equal(result.data.tiles[5]![5], "brick");
    assert.equal(fixture.tiles[5]![5], before, "fixture must not mutate");

    const oob = placeTile(fixture, 999, 999, "brick");
    assert.equal(oob.ok, false);
  });

  it("spawnEnemy refuses to place inside a solid tile", () => {
    const bad = spawnEnemy(fixture, 0, GROUND_ROW, "goomba");
    assert.equal(bad.ok, false);

    const ok = spawnEnemy(fixture, 10, 5, "goomba");
    assert.ok(ok.ok);
    if (!ok.ok) return;
    assert.equal(ok.data.enemies.length, fixture.enemies.length + 1);
    assert.equal(fixture.enemies.length, 3, "fixture enemies untouched");
  });

  it("setPlayerStart rejects solid tiles", () => {
    const bad = setPlayerStart(fixture, 0, GROUND_ROW);
    assert.equal(bad.ok, false);

    const good = setPlayerStart(fixture, 5, 10);
    assert.ok(good.ok);
    if (!good.ok) return;
    assert.deepEqual(good.data.playerStart, { x: 5, y: 10 });
  });

  it("describeLevel mentions tiles, enemies, and flag", () => {
    const text = describeLevel(fixture);
    assert.match(text, /sample-1/);
    assert.match(text, /goomba/);
    assert.match(text, /flag/i);
  });
});

describe("generateLevel", () => {
  it("returns a valid level with a flag and a safe spawn", () => {
    const level = generateLevel({
      theme: "overworld",
      difficulty: 2,
      length: 60,
      seed: 42,
    });
    assert.equal(level.theme, "overworld");
    assert.equal(level.width, 60);
    assert.equal(level.height, 15);
    assert.equal(level.tiles.length, 15);
    for (const row of level.tiles) assert.equal(row.length, 60);

    let flagFound = false;
    for (const row of level.tiles) {
      if (row.includes("flag")) flagFound = true;
    }
    assert.ok(flagFound, "generated level must contain a flag");

    const startTile = level.tiles[GROUND_ROW]![level.playerStart.x];
    assert.ok(
      startTile && SOLID_TILES.has(startTile),
      `expected solid ground under player start, got ${startTile}`,
    );
  });

  it("is deterministic for the same seed", () => {
    const a = generateLevel({ theme: "castle", difficulty: 3, length: 80, seed: 123 });
    const b = generateLevel({ theme: "castle", difficulty: 3, length: 80, seed: 123, id: a.id });
    assert.deepEqual(a.tiles, b.tiles);
    assert.deepEqual(a.enemies, b.enemies);
  });

  it("scales enemy presence with difficulty", () => {
    const easy = generateLevel({ theme: "overworld", difficulty: 1, length: 120, seed: 7 });
    const hard = generateLevel({ theme: "overworld", difficulty: 5, length: 120, seed: 7 });
    assert.ok(
      hard.enemies.length >= easy.enemies.length,
      `expected hard >= easy enemies (easy=${easy.enemies.length}, hard=${hard.enemies.length})`,
    );
  });
});

describe("LevelStore", () => {
  it("stores, loads, and notifies subscribers exactly once per mutation", () => {
    const store = new LevelStore();
    const level = store.generate({ theme: "overworld", difficulty: 2, length: 40, seed: 1 });
    assert.deepEqual(store.list(), [level.id]);

    const received: string[] = [];
    store.subscribe((l) => received.push(l.id));

    const loadResult = store.load(level.id);
    assert.ok(loadResult.ok);
    assert.deepEqual(received, [level.id]);

    const after = store.mutate(level.id, (l) => placeTile(l, 5, 5, "brick"));
    assert.ok(after.ok);
    if (!after.ok) return;
    assert.equal(after.data.tiles[5]![5], "brick");
    assert.equal(received.length, 2, "exactly one notify per mutation");
  });

  it("rejects loads for unknown ids", () => {
    const store = new LevelStore();
    const result = store.load("missing");
    assert.equal(result.ok, false);
  });
});
