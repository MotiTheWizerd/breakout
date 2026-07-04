export type GameStatus =
  | 'ready'      // ball resting on paddle, waiting for launch
  | 'playing'
  | 'paused'
  | 'levelclear'
  | 'won'
  | 'gameover'

export interface Vec {
  x: number
  y: number
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  dead?: boolean // marked when it falls off the bottom
}

export interface Paddle {
  x: number // center x
  w: number
  h: number
  y: number // top y
}

export type PowerUpType = 'gun' | 'multiball' | 'wide' | 'slow' | 'shrink' | 'fireball'

export interface Gift {
  x: number // left
  y: number // top
  w: number
  h: number
  vy: number
  type: PowerUpType
  hue: number
}

export interface Bullet {
  x: number
  y: number
  vy: number
  r: number
}

export interface Brick {
  x: number
  y: number
  w: number
  h: number
  hp: number
  maxHp: number
  hue: number
  points: number
  alive: boolean
}

export interface Snapshot {
  status: GameStatus
  score: number
  lives: number
  level: number
  bricksLeft: number
  highScore: number
  powerups: { type: PowerUpType; remaining: number }[]
}
