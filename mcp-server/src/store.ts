import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { LevelStore } from "../../world/src/tools.js";
import type { Level } from "../../world/src/types.js";

const here = dirname(fileURLToPath(import.meta.url));

function findFixture(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, "fixtures/sample-level.json");
    if (existsSync(candidate)) return candidate;
    dir = resolve(dir, "..");
  }
  throw new Error(`could not locate fixtures/sample-level.json from ${start}`);
}

const fixture = JSON.parse(readFileSync(findFixture(here), "utf8")) as Level;

export const store = new LevelStore();
store.put(fixture);
store.load(fixture.id);

export function currentLevelId(): string | null {
  return store.current()?.id ?? null;
}
