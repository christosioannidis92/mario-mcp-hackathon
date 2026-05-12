import type { Level, TileType, EnemyType } from "./types";
import type { Player } from "./entities";
import type { Camera } from "./camera";
import type { AssetBundle } from "./assets";
import { TILE_SIZE, CANVAS_W, CANVAS_H } from "./constants";

const TILE_COLOR: Record<TileType, string> = {
  ground: "#8b5a2b",
  brick:  "#c47a3c",
  pipe:   "#2aa84a",
  coin:   "#ffd24c",
  flag:   "#e34c4c",
  empty:  "",  // unused
};

const ENEMY_COLOR: Record<EnemyType, string> = {
  goomba:  "#7a4a2a",
  koopa:   "#3aa84a",
  piranha: "#b03050",
};

const PLAYER_COLOR = "#ff4747";

export type GameState = "PLAYING" | "WON" | "DEAD";

export function render(
  ctx: CanvasRenderingContext2D,
  level: Level,
  player: Player,
  camera: Camera,
  assets: AssetBundle,
  state: GameState,
): void {
  // 1. Background
  if (assets.background) {
    ctx.drawImage(assets.background, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = themeBackground(level.theme);
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // 2. Tiles — cull to visible column range
  const colStart = Math.max(0, Math.floor(camera.x / TILE_SIZE));
  const colEnd = Math.min(level.width, Math.ceil((camera.x + CANVAS_W) / TILE_SIZE));

  for (let y = 0; y < level.height; y++) {
    for (let x = colStart; x < colEnd; x++) {
      const t = level.tiles[y]?.[x];
      if (!t || t === "empty") continue;
      const sx = Math.floor(x * TILE_SIZE - camera.x);
      const sy = Math.floor(y * TILE_SIZE - camera.y);
      const img = assets.tiles?.[t];
      if (img) {
        ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = TILE_COLOR[t];
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        if (t === "coin") {
          // little inset highlight so coins don't look like blocks
          ctx.fillStyle = "#fff5b0";
          ctx.fillRect(sx + 12, sy + 10, 8, 12);
          ctx.fillStyle = TILE_COLOR[t];
        }
      }
    }
  }

  // 3. Enemies
  for (const e of level.enemies) {
    const wx = e.x * TILE_SIZE;
    if (wx + TILE_SIZE < camera.x || wx > camera.x + CANVAS_W) continue;
    const sx = Math.floor(wx - camera.x);
    const sy = Math.floor(e.y * TILE_SIZE - camera.y);
    const img = assets.enemies?.[e.type];
    if (img) {
      ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = ENEMY_COLOR[e.type];
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
    }
  }

  // 4. Player
  const px = Math.floor(player.x - camera.x);
  const py = Math.floor(player.y - camera.y);
  if (assets.player) {
    ctx.save();
    if (player.facing === -1) {
      ctx.translate(px + player.w, py);
      ctx.scale(-1, 1);
      ctx.drawImage(assets.player, 0, 0, player.w, player.h);
    } else {
      ctx.drawImage(assets.player, px, py, player.w, player.h);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(px, py, player.w, player.h);
    // little eye so we can tell which way the player faces
    ctx.fillStyle = "#fff";
    const eyeX = player.facing === 1 ? px + player.w - 8 : px + 4;
    ctx.fillRect(eyeX, py + 8, 4, 4);
  }

  // 5. HUD overlay
  if (state !== "PLAYING") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = state === "WON" ? "#ffe55c" : "#ff6b6b";
    ctx.font = 'bold 48px ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state === "WON" ? "WIN" : "DIED", CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }
}

function themeBackground(theme: Level["theme"]): string {
  switch (theme) {
    case "underground": return "#0b0b1a";
    case "castle":      return "#2a1a2a";
    case "ice":         return "#a4d4ee";
    case "spooky":      return "#1a1024";
    case "overworld":
    default:            return "#5c94fc";
  }
}
