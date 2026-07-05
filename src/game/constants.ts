export const WIDTH = 800
export const HEIGHT = 600

export const PADDLE_W = 120
export const PADDLE_H = 16
export const PADDLE_MARGIN = 42 // distance of paddle top from bottom edge
export const PADDLE_SPEED = 620 // px/s for keyboard control

export const BALL_R = 8
export const BALL_BASE_SPEED = 380 // px/s at level 1
export const BALL_SPEED_PER_LEVEL = 34
export const BALL_MAX_SPEED = 720
export const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180 // steer angle off paddle

export const BRICK_COLS = 11
export const BRICK_GAP = 6
export const BRICK_TOP = 70
export const BRICK_SIDE_PAD = 24
export const BRICK_H = 26

export const START_LIVES = 3
export const MAX_LIVES = 5 // cap for the extra-life gift (keeps the HUD row bounded)
export const MAX_LEVEL = 6

// combo multiplier — bricks broken in one airborne chain (no paddle touch) score
// points × min(chain, COMBO_MAX). Paddle contact resets the chain to 0.
export const COMBO_MAX = 9

// special bricks — reach (center-to-center px) of an explosive brick's blast
export const EXPLOSION_RADIUS = 78

// ---- screen shake (juice) ----
// Trauma model (Squirrel Eiserloh): events add "trauma" (0..1), which decays
// linearly every frame. Actual shake = trauma² × SHAKE_MAX, so small taps barely
// register while big explosive combo chains slam — a 1-combo and a 9-combo feel
// worlds apart. Direction re-randomises per frame for a rattling jitter.
export const SHAKE_MAX = 16 // px, peak offset at full trauma
export const SHAKE_DECAY = 2.6 // trauma units drained per second
export const SHAKE_BRICK = 0.16 // trauma from breaking a brick (base)
export const SHAKE_COMBO = 0.05 // extra trauma per combo step at break time
export const SHAKE_EXPLOSION = 0.45 // trauma from an explosive detonation
export const SHAKE_LOSE = 0.7 // trauma when a life is lost

// ---- power-ups / gifts ----
export const GIFT_W = 36
export const GIFT_H = 22
export const GIFT_FALL_SPEED = 155
export const GIFT_DROP_CHANCE = 0.38 // per destroyed brick (bumped +20pts for testing; normal ~0.18)
export const GUN_DURATION = 10 // seconds of shooting
export const BULLET_SPEED = 640
export const BULLET_R = 4
export const FIRE_INTERVAL = 0.26 // seconds between shots while armed

// multiball
export const MULTIBALL_ADD = 2 // extra balls spawned on catch
export const MAX_BALLS = 7
export const MULTIBALL_SPREAD = (24 * Math.PI) / 180 // fan angle between spawned balls

// wide paddle
export const WIDE_PADDLE_W = 200 // paddle width while the wide power-up is active (base 120)
export const WIDE_DURATION = 12 // seconds of a wider paddle

// slow-mo — scales the BALL integration dt only (paddle stays full-speed)
export const SLOW_FACTOR = 0.5 // balls move at half pace while active
export const SLOW_DURATION = 8 // seconds of slow-motion

// skull — the BAD gift: shrinks the paddle (risk/reward on every drop)
export const SHRINK_PADDLE_W = 76 // paddle width while shrunk (base 120)
export const SHRINK_DURATION = 8 // seconds of a shrunken paddle

// fireball — the ball plows STRAIGHT through bricks (no bounce), shattering
// even tough bricks in one pass. Still bounces off walls + paddle.
export const FIREBALL_DURATION = 7 // seconds of piercing fire

// safety net — a timed shield across the floor that bounces balls back up
export const NET_DURATION = 12 // seconds the floor shield lasts
export const NET_Y = HEIGHT - 8 // y of the shield line, just above the bottom
