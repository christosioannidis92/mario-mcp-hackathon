import { FIXED_DT, MAX_FRAME_MS } from "./constants";

export type StopFn = () => void;

// Fixed-timestep accumulator. step() runs at exactly FIXED_DT seconds; render() runs once per RAF.
export function startLoop(step: (dt: number) => void, render: () => void): StopFn {
  let lastNow = performance.now();
  let accumulator = 0;
  let rafId = 0;
  let running = true;

  const tick = (now: number) => {
    if (!running) return;
    const frameMs = Math.min(now - lastNow, MAX_FRAME_MS);
    lastNow = now;
    accumulator += frameMs / 1000;

    // Cap how many catch-up steps we run in one frame so a hitch doesn't snowball.
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < 5) {
      step(FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }
    if (steps === 5) accumulator = 0;  // gave up; drop the backlog

    render();
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}
