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
export const MAX_LEVEL = 6

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
