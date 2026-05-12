// World-internal constants. NOT part of the cross-team contract — the engine
// has its own pixel-space constants in engine/src/constants.ts.

export const DEFAULT_HEIGHT = 15;
export const GROUND_ROW = 14;

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
