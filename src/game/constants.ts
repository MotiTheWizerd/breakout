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
export const GIFT_DROP_CHANCE = 0.9 // per destroyed brick — cranked up for testing (real value ~0.16)
export const GUN_DURATION = 10 // seconds of shooting
export const BULLET_SPEED = 640
export const BULLET_R = 4
export const FIRE_INTERVAL = 0.26 // seconds between shots while armed
