// Keyboard. Tracks held state plus edge events that last exactly one fixed step.
// Singleton bound to window. Detachable for HMR / destroy.

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;   // edge: true for one step after a fresh keydown
  jumpReleased: boolean;  // edge: true for one step after keyup
  resetPressed: boolean;
}

type Detach = () => void;

const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);
const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
const RESET_KEYS = new Set(["KeyR"]);

const PREVENT_DEFAULT = new Set<string>([
  ...LEFT_KEYS, ...RIGHT_KEYS, ...JUMP_KEYS, ...RESET_KEYS,
]);

export function createInput(): Input & { _detach: Detach; _consumeEdges: () => void } {
  const state = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    jumpReleased: false,
    resetPressed: false,
  };

  // Pending edges since last consume — flushed into state at the start of each step.
  let pendingJumpPress = false;
  let pendingJumpRelease = false;
  let pendingReset = false;

  const onDown = (e: KeyboardEvent) => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    if (e.repeat) return;  // ignore OS key-repeat for edge events
    if (LEFT_KEYS.has(e.code)) state.left = true;
    if (RIGHT_KEYS.has(e.code)) state.right = true;
    if (JUMP_KEYS.has(e.code)) { state.jump = true; pendingJumpPress = true; }
    if (RESET_KEYS.has(e.code)) pendingReset = true;
  };

  const onUp = (e: KeyboardEvent) => {
    if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
    if (LEFT_KEYS.has(e.code)) state.left = false;
    if (RIGHT_KEYS.has(e.code)) state.right = false;
    if (JUMP_KEYS.has(e.code)) { state.jump = false; pendingJumpRelease = true; }
  };

  const onBlur = () => {
    state.left = false;
    state.right = false;
    state.jump = false;
  };

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", onBlur);

  const detach: Detach = () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", onBlur);
  };

  // Called once per fixed step *before* game logic reads input.
  const consumeEdges = () => {
    state.jumpPressed = pendingJumpPress;
    state.jumpReleased = pendingJumpRelease;
    state.resetPressed = pendingReset;
    pendingJumpPress = false;
    pendingJumpRelease = false;
    pendingReset = false;
  };

  return Object.assign(state, { _detach: detach, _consumeEdges: consumeEdges });
}
