// All tunables live here. Physics in pixels and seconds.

export const TILE_SIZE = 32;          // px
export const CANVAS_W  = 800;         // px (25 tiles wide)
export const CANVAS_H  = 480;         // px (15 tiles tall — matches Level.height)

export const GRAVITY     = 1800;      // px/s² downward
export const MAX_FALL_V  = 900;       // px/s terminal velocity

export const RUN_SPEED    = 180;      // px/s horizontal max
export const RUN_ACCEL    = 1200;     // px/s² when key held
export const RUN_FRICTION = 1500;     // px/s² decel when no key

export const JUMP_V0        = 800;    // px/s upward at jump press
export const JUMP_CUT_V     = 240;    // px/s cap when releasing jump while rising
export const COYOTE_MS      = 90;     // ms after leaving ground where jump still works
export const JUMP_BUFFER_MS = 90;     // ms — pressing jump before landing still jumps on land

export const STOMP_BOUNCE_V = 380;    // px/s upward kick after stomping an enemy
export const DEATH_JUMP_V   = 520;    // px/s upward pop at death (then gravity)
export const MAX_JUMPS      = 3;      // triple jump: ground + 2 mid-air

export const PLAYER_W = 24;           // px — AABB used for physics/collision
export const PLAYER_H = 28;           // px

// Sprite is drawn larger than the AABB and bottom-anchored to it, so the
// character looks tall but still fits through 1-tile gaps. Pure render-only.
export const PLAYER_SPRITE_W = 40;    // px
export const PLAYER_SPRITE_H = 56;    // px

export const FIXED_DT     = 1 / 60;   // s — fixed simulation step
export const MAX_FRAME_MS = 100;      // clamp huge frame gaps (tab refocus)

export const CAMERA_DEADZONE_W = 160; // px — free movement band

export const DEATH_FREEZE_S   = 0.6;  // s — kept for back-compat; not used by death animation
export const DEATH_TIMEOUT_S  = 2.5;  // s — max time the death animation can run before auto-reset
