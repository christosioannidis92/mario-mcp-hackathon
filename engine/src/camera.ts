import type { Level } from "./types";
import type { Player } from "./entities";
import { CANVAS_W, CAMERA_DEADZONE_W, TILE_SIZE } from "./constants";

export interface Camera {
  x: number;  // world px — top-left of viewport
  y: number;
}

export function createCamera(): Camera {
  return { x: 0, y: 0 };
}

// Horizontal follow with a centered deadzone. Snap-free, just clamped.
export function followCamera(camera: Camera, player: Player, level: Level): void {
  const playerCenter = player.x + player.w / 2;
  const dzLeft = camera.x + (CANVAS_W - CAMERA_DEADZONE_W) / 2;
  const dzRight = dzLeft + CAMERA_DEADZONE_W;

  if (playerCenter < dzLeft) camera.x -= dzLeft - playerCenter;
  else if (playerCenter > dzRight) camera.x += playerCenter - dzRight;

  const maxX = Math.max(0, level.width * TILE_SIZE - CANVAS_W);
  if (camera.x < 0) camera.x = 0;
  if (camera.x > maxX) camera.x = maxX;
}

// Used by loadLevel — no interpolation, snap to player.
export function snapCamera(camera: Camera, player: Player, level: Level): void {
  camera.x = player.x + player.w / 2 - CANVAS_W / 2;
  const maxX = Math.max(0, level.width * TILE_SIZE - CANVAS_W);
  if (camera.x < 0) camera.x = 0;
  if (camera.x > maxX) camera.x = maxX;
  camera.y = 0;
}
