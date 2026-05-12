// WebSocket bridge client. Owns the contract resolved in COORDINATION.md Q-001:
//   server → browser: { "type": "loadLevel", "level": Level }
//   browser → server: { "type": "ready" } (once on open)
// Engine owns reconnect with exponential backoff. Unknown message types ignored.

import type { Level } from "./types";

export type BridgeStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface BridgeOptions {
  url?: string;
  onLevel: (level: Level) => void;
  onStatus?: (status: BridgeStatus) => void;
}

const DEFAULT_URL = "ws://localhost:8787";
const BACKOFF_MS = [1000, 2000, 4000, 10000];

export class Bridge {
  private url: string;
  private onLevel: (l: Level) => void;
  private onStatus: (s: BridgeStatus) => void;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private stopped = false;

  constructor(opts: BridgeOptions) {
    this.url = opts.url ?? DEFAULT_URL;
    this.onLevel = opts.onLevel;
    this.onStatus = opts.onStatus ?? (() => {});
    this.connect();
  }

  destroy(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
  }

  // ----------- internals -----------

  private connect(): void {
    if (this.stopped) return;
    this.onStatus("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
    } catch (e) {
      console.warn("[bridge] WebSocket constructor failed:", e);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0;
      this.onStatus("open");
      ws.send(JSON.stringify({ type: "ready" }));
    };

    ws.onmessage = (ev) => {
      this.handleMessage(ev.data);
    };

    ws.onerror = () => {
      this.onStatus("error");
      // 'close' will follow; reconnect is scheduled there.
    };

    ws.onclose = () => {
      this.onStatus("closed");
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      console.warn("[bridge] non-JSON message dropped");
      return;
    }
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;
    const m = msg as { type: string; level?: unknown };
    if (m.type === "loadLevel" && m.level && typeof m.level === "object") {
      this.onLevel(m.level as Level);
      return;
    }
    // Forward-compat: unknown types silently ignored.
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
    this.attempt++;
    console.warn(`[bridge] reconnecting in ${delay}ms (attempt ${this.attempt})`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
