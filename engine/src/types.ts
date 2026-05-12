// Re-export the shared contract. Engine code imports types from here only.
export type {
  TileType,
  EnemyType,
  Theme,
  Enemy,
  Level,
} from "../../world/src/types";

export { SOLID_TILES, TRIGGER_TILES } from "../../world/src/types";
