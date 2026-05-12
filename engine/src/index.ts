import type { Level } from "./types";
import type { AssetBundle } from "./assets";
import { CANVAS_W, CANVAS_H, DEATH_FREEZE_S } from "./constants";
import { startLoop, type StopFn } from "./loop";
import { createInput, type Input } from "./input";
import { createPlayer, createEnemies, type Player, type RuntimeEnemy } from "./entities";
import { createCamera, followCamera, snapCamera, type Camera } from "./camera";
import { stepPlayer, stepEnemies, checkTriggers, checkDeath, checkEnemyHit } from "./physics";
import { render, type GameState } from "./render";

export { preloadAssets } from "./assets";
export type { AssetBundle } from "./assets";
export type { Level } from "./types";
export { Bridge } from "./bridge";
export type { BridgeOptions, BridgeStatus } from "./bridge";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private assets: AssetBundle;
  private level: Level | null = null;
  private player: Player | null = null;
  private enemies: RuntimeEnemy[] = [];
  private camera: Camera = createCamera();
  private input: ReturnType<typeof createInput>;
  private stopLoop: StopFn | null = null;
  private state: GameState = "PLAYING";
  private deathTimer = 0;

  constructor(canvas: HTMLCanvasElement, assets: AssetBundle = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.assets = assets;
    this.input = createInput();
    this.setupCanvas(canvas);
    this.stopLoop = startLoop(
      (dt) => this.step(dt),
      () => this.draw(),
    );
  }

  loadLevel(level: Level): void {
    if (!validateLevel(level)) {
      console.warn("[engine] invalid level, keeping current", level);
      return;
    }
    this.level = level;
    this.player = createPlayer(level.playerStart);
    this.enemies = createEnemies(level);
    this.camera = createCamera();
    snapCamera(this.camera, this.player, this.level);
    this.state = "PLAYING";
    this.deathTimer = 0;
  }

  reset(): void {
    if (this.level) this.loadLevel(this.level);
  }

  // Swap the asset bundle at runtime. Lets consumers construct the Game
  // immediately (with colored-rect fallbacks) and hydrate sprites later.
  setAssets(assets: AssetBundle): void {
    this.assets = assets;
  }

  destroy(): void {
    this.stopLoop?.();
    this.stopLoop = null;
    this.input._detach();
  }

  private setupCanvas(canvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  private step(dt: number): void {
    this.input._consumeEdges();
    if (!this.level || !this.player) return;

    if (this.input.resetPressed) {
      this.reset();
      return;
    }

    if (this.state === "PLAYING") {
      stepPlayer(this.player, this.input, this.level, dt);
      stepEnemies(this.enemies, this.level, dt);
      followCamera(this.camera, this.player, this.level);

      const trigger = checkTriggers(this.player, this.level);
      if (trigger === "flag") this.state = "WON";
      else if (checkEnemyHit(this.player, this.enemies)) this.state = "DEAD";
      else if (checkDeath(this.player, this.level)) this.state = "DEAD";
    } else if (this.state === "DEAD") {
      this.deathTimer += dt;
      if (this.deathTimer >= DEATH_FREEZE_S) this.reset();
    }
    // WON freezes until R; that's handled by resetPressed above.
  }

  private draw(): void {
    if (!this.level || !this.player) {
      this.ctx.fillStyle = "#0b0d10";
      this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      return;
    }
    render(this.ctx, this.level, this.player, this.enemies, this.camera, this.assets, this.state);
  }
}

function validateLevel(level: unknown): level is Level {
  if (!level || typeof level !== "object") return false;
  const l = level as Level;
  if (typeof l.width !== "number" || typeof l.height !== "number") return false;
  if (!Array.isArray(l.tiles) || l.tiles.length !== l.height) return false;
  for (const row of l.tiles) {
    if (!Array.isArray(row) || row.length !== l.width) return false;
  }
  if (!l.playerStart || l.playerStart.x < 0 || l.playerStart.y < 0) return false;
  if (l.playerStart.x >= l.width || l.playerStart.y >= l.height) return false;
  if (!Array.isArray(l.enemies)) return false;
  return true;
}
