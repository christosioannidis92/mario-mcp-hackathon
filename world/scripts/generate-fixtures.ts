// One-shot script: produces the pre-generated fallback levels demo/ expects.
// Seeds are fixed so re-running this script yields byte-identical JSON — safe
// to commit.

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describeLevel, generateLevel } from "../src/index.js";
import type { Difficulty, Theme } from "../src/index.js";

interface Spec {
  id: string;
  filename: string;
  theme: Theme;
  difficulty: Difficulty;
  length: number;
  seed: number;
}

const SPECS: Spec[] = [
  {
    id: "castle-1",
    filename: "level-castle.json",
    theme: "castle",
    difficulty: 4,
    length: 80,
    seed: 0xca571e,
  },
  {
    id: "underground-1",
    filename: "level-underground.json",
    theme: "underground",
    difficulty: 3,
    length: 70,
    seed: 0xdeed,
  },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../../fixtures");

for (const spec of SPECS) {
  const level = generateLevel({
    id: spec.id,
    theme: spec.theme,
    difficulty: spec.difficulty,
    length: spec.length,
    seed: spec.seed,
  });
  const outPath = resolve(fixturesDir, spec.filename);
  writeFileSync(outPath, JSON.stringify(level, null, 2) + "\n");
  console.log(`\n== ${spec.id} → ${spec.filename} ==`);
  console.log(describeLevel(level));
}
