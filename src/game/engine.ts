import {
  WIDTH, HEIGHT, PADDLE_W, PADDLE_H, PADDLE_MARGIN, PADDLE_SPEED,
  BALL_R, BALL_BASE_SPEED, BALL_SPEED_PER_LEVEL, BALL_MAX_SPEED,
  MAX_BOUNCE_ANGLE, BRICK_COLS, BRICK_GAP, BRICK_TOP, BRICK_SIDE_PAD,
  BRICK_H, START_LIVES, MAX_LEVEL,
  GIFT_W, GIFT_H, GIFT_FALL_SPEED, GIFT_DROP_CHANCE, GUN_DURATION,
  BULLET_SPEED, BULLET_R, FIRE_INTERVAL,
  MULTIBALL_ADD, MAX_BALLS, MULTIBALL_SPREAD,
  WIDE_PADDLE_W, WIDE_DURATION, SLOW_FACTOR, SLOW_DURATION,
} from './constants'
import type { Ball, Brick, Bullet, GameStatus, Gift, Paddle, PowerUpType, Snapshot } from './types'

const HS_KEY = 'pingball.highscore'

/** Rows of bricks per level and how many of the top rows are 2-hit. */
function levelLayout(level: number): { rows: number; toughRows: number } {
  return {
    rows: Math.min(4 + level, 9),
    toughRows: Math.min(level - 1, 3),
  }
}

export class BreakoutEngine {
  status: GameStatus = 'ready'
  score = 0
  lives = START_LIVES
  level = 1
  highScore = 0

  paddle: Paddle
  balls: Ball[] = []
  bricks: Brick[] = []
  gifts: Gift[] = []
  bullets: Bullet[] = []

  // input state
  private moveLeft = false
  private moveRight = false
  private pointerX: number | null = null

  // power-up state
  private timers = new Map<PowerUpType, number>() // type -> seconds remaining
  private fireCooldown = 0

  /** Fired when a scoring / feedback event happens, for sound + particles. */
  onEvent: (
    e: 'paddle' | 'brick' | 'wall' | 'lose' | 'levelclear' | 'gameover' | 'win' | 'giftget' | 'shoot',
    x?: number,
    y?: number,
  ) => void = () => {}

  constructor() {
    this.paddle = {
      x: WIDTH / 2,
      w: PADDLE_W,
      h: PADDLE_H,
      y: HEIGHT - PADDLE_MARGIN,
    }
    this.balls = [{ x: WIDTH / 2, y: this.paddle.y - BALL_R - 1, vx: 0, vy: 0, r: BALL_R }]
    this.highScore = this.loadHighScore()
    this.buildLevel()
  }

  private loadHighScore(): number {
    try {
      return Number(localStorage.getItem(HS_KEY)) || 0
    } catch {
      return 0
    }
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score
      try {
        localStorage.setItem(HS_KEY, String(this.highScore))
      } catch {
        /* ignore */
      }
    }
  }

  private ballSpeed(): number {
    return Math.min(BALL_BASE_SPEED + (this.level - 1) * BALL_SPEED_PER_LEVEL, BALL_MAX_SPEED)
  }

  private buildLevel() {
    const { rows, toughRows } = levelLayout(this.level)
    const usableW = WIDTH - BRICK_SIDE_PAD * 2
    const brickW = (usableW - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS
    const bricks: Brick[] = []
    for (let r = 0; r < rows; r++) {
      const tough = r < toughRows
      const hp = tough ? 2 : 1
      const hue = 300 - (r / Math.max(rows - 1, 1)) * 260 // magenta -> cyan sweep
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_SIDE_PAD + c * (brickW + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: brickW,
          h: BRICK_H,
          hp,
          maxHp: hp,
          hue,
          points: (rows - r) * 10 * (tough ? 2 : 1),
          alive: true,
        })
      }
    }
    this.bricks = bricks
  }

  /** Clear falling gifts, in-flight bullets and active power-up timers. */
  private resetTransient() {
    this.gifts = []
    this.bullets = []
    this.timers.clear()
    this.fireCooldown = 0
    this.syncPaddleWidth() // clearing timers must restore base width
  }

  /** Reset to a single ball resting on the paddle, awaiting launch. */
  private parkBall() {
    this.balls = [{
      x: this.paddle.x,
      y: this.paddle.y - BALL_R - 1,
      vx: 0,
      vy: 0,
      r: BALL_R,
    }]
  }

  // ---- public control API ----

  startNewGame() {
    this.score = 0
    this.lives = START_LIVES
    this.level = 1
    this.buildLevel()
    this.paddle.x = WIDTH / 2
    this.paddle.w = PADDLE_W
    this.resetTransient()
    this.parkBall()
    this.status = 'ready'
  }

  /** Launch the ball (from 'ready') or advance from a between-level screen. */
  launchOrAdvance() {
    if (this.status === 'ready') {
      const speed = this.ballSpeed()
      const angle = (-Math.PI / 2) + (Math.random() * 0.6 - 0.3) // mostly up, slight jitter
      const b = this.balls[0]
      b.vx = Math.cos(angle) * speed
      b.vy = Math.sin(angle) * speed
      this.status = 'playing'
    } else if (this.status === 'levelclear') {
      this.level += 1
      this.buildLevel()
      this.paddle.x = WIDTH / 2
      this.resetTransient()
      this.parkBall()
      this.status = 'ready'
    } else if (this.status === 'won' || this.status === 'gameover') {
      this.startNewGame()
    }
  }

  togglePause() {
    if (this.status === 'playing') this.status = 'paused'
    else if (this.status === 'paused') this.status = 'playing'
  }

  hasPowerup(type: PowerUpType): boolean { return this.timers.has(type) }

  setMoveLeft(v: boolean) { this.moveLeft = v }
  setMoveRight(v: boolean) { this.moveRight = v }
  setPointer(x: number | null) { this.pointerX = x }

  snapshot(): Snapshot {
    return {
      status: this.status,
      score: this.score,
      lives: this.lives,
      level: this.level,
      bricksLeft: this.bricks.reduce((n, b) => n + (b.alive ? 1 : 0), 0),
      highScore: this.highScore,
      powerups: [...this.timers.entries()].map(([type, remaining]) => ({
        type,
        remaining: Math.ceil(remaining),
      })),
    }
  }

  // ---- simulation ----

  update(dt: number) {
    this.updatePaddle(dt)

    if (this.status === 'ready') {
      // the parked ball tracks the paddle until launched
      const b = this.balls[0]
      b.x = this.paddle.x
      b.y = this.paddle.y - b.r - 1
      return
    }
    if (this.status !== 'playing') return

    // slow-mo scales only the ball's clock; paddle/timers/gifts stay real-time
    const ballDt = this.timers.has('slow') ? dt * SLOW_FACTOR : dt
    this.updateBalls(ballDt)
    if (this.status !== 'playing') return // ball update may have ended level/game

    this.updateTimers(dt)
    this.updateGifts(dt)
    this.updateBullets(dt)
  }

  private updatePaddle(dt: number) {
    const half = this.paddle.w / 2
    if (this.pointerX != null) {
      this.paddle.x = this.pointerX
    } else {
      let dir = 0
      if (this.moveLeft) dir -= 1
      if (this.moveRight) dir += 1
      this.paddle.x += dir * PADDLE_SPEED * dt
    }
    this.paddle.x = Math.max(half, Math.min(WIDTH - half, this.paddle.x))
  }

  private updateBalls(dt: number) {
    for (const b of this.balls) {
      // Sub-step to avoid tunnelling at high speed.
      const speed = Math.hypot(b.vx, b.vy)
      const steps = Math.max(1, Math.ceil((speed * dt) / (b.r * 0.9)))
      const h = dt / steps
      for (let i = 0; i < steps; i++) {
        b.x += b.vx * h
        b.y += b.vy * h
        if (this.collideWalls(b)) break // fell off the bottom
        this.collidePaddle(b)
        if (this.collideBricks(b)) {
          if (this.bricks.every((br) => !br.alive)) {
            this.onLevelCleared()
            return
          }
        }
      }
    }
    // remove balls that fell; only lose a life when the last one is gone
    this.balls = this.balls.filter((b) => !b.dead)
    if (this.balls.length === 0) this.loseLife()
  }

  /** Returns true if the ball fell off the bottom (and should be removed). */
  private collideWalls(b: Ball): boolean {
    if (b.x - b.r < 0) {
      b.x = b.r
      b.vx = Math.abs(b.vx)
      this.onEvent('wall', b.x, b.y)
    } else if (b.x + b.r > WIDTH) {
      b.x = WIDTH - b.r
      b.vx = -Math.abs(b.vx)
      this.onEvent('wall', b.x, b.y)
    }
    if (b.y - b.r < 0) {
      b.y = b.r
      b.vy = Math.abs(b.vy)
      this.onEvent('wall', b.x, b.y)
    } else if (b.y - b.r > HEIGHT) {
      b.dead = true
      return true
    }
    return false
  }

  private collidePaddle(b: Ball) {
    const p = this.paddle
    const half = p.w / 2
    const withinX = b.x >= p.x - half - b.r && b.x <= p.x + half + b.r
    const hitY = b.y + b.r >= p.y && b.y - b.r <= p.y + p.h
    if (withinX && hitY && b.vy > 0) {
      // reflect with angle based on hit position
      const rel = Math.max(-1, Math.min(1, (b.x - p.x) / half))
      const angle = rel * MAX_BOUNCE_ANGLE
      const speed = Math.max(Math.hypot(b.vx, b.vy), this.ballSpeed())
      b.vx = Math.sin(angle) * speed
      b.vy = -Math.cos(angle) * speed
      b.y = p.y - b.r - 0.1
      this.onEvent('paddle', b.x, b.y)
    }
  }

  /** Returns true if a brick was hit this call. */
  private collideBricks(b: Ball): boolean {
    for (const br of this.bricks) {
      if (!br.alive) continue
      // circle vs AABB
      const nx = Math.max(br.x, Math.min(b.x, br.x + br.w))
      const ny = Math.max(br.y, Math.min(b.y, br.y + br.h))
      const dx = b.x - nx
      const dy = b.y - ny
      if (dx * dx + dy * dy > b.r * b.r) continue

      // resolve along the axis of shallowest penetration
      const overlapLeft = b.x + b.r - br.x
      const overlapRight = br.x + br.w - (b.x - b.r)
      const overlapTop = b.y + b.r - br.y
      const overlapBottom = br.y + br.h - (b.y - b.r)
      const minX = Math.min(overlapLeft, overlapRight)
      const minY = Math.min(overlapTop, overlapBottom)
      if (minX < minY) {
        b.vx = overlapLeft < overlapRight ? -Math.abs(b.vx) : Math.abs(b.vx)
      } else {
        b.vy = overlapTop < overlapBottom ? -Math.abs(b.vy) : Math.abs(b.vy)
      }

      this.damageBrick(br, b.x, b.y)
      return true // one brick per step
    }
    return false
  }

  /** Apply one hit to a brick; drops a gift and scores if it dies. */
  private damageBrick(br: Brick, atX: number, atY: number) {
    br.hp -= 1
    if (br.hp <= 0) {
      br.alive = false
      this.score += br.points
      this.onEvent('brick', atX, atY)
      this.maybeDropGift(br)
    } else {
      this.onEvent('wall', atX, atY)
    }
  }

  private static readonly GIFT_POOL: PowerUpType[] = ['gun', 'multiball', 'wide', 'slow']
  private static readonly GIFT_HUE: Record<PowerUpType, number> = { gun: 45, multiball: 190, wide: 130, slow: 275 }

  private maybeDropGift(br: Brick) {
    if (Math.random() >= GIFT_DROP_CHANCE) return
    const pool = BreakoutEngine.GIFT_POOL
    const type = pool[Math.floor(Math.random() * pool.length)]
    this.gifts.push({
      x: br.x + br.w / 2 - GIFT_W / 2,
      y: br.y,
      w: GIFT_W,
      h: GIFT_H,
      vy: GIFT_FALL_SPEED,
      type,
      hue: BreakoutEngine.GIFT_HUE[type],
    })
  }

  private applyPowerup(type: PowerUpType) {
    if (type === 'gun') {
      this.timers.set('gun', GUN_DURATION)
      this.fireCooldown = 0 // fire immediately
    } else if (type === 'multiball') {
      this.spawnMultiball()
    } else if (type === 'wide') {
      this.timers.set('wide', WIDE_DURATION)
      this.syncPaddleWidth()
    } else if (type === 'slow') {
      this.timers.set('slow', SLOW_DURATION)
    }
  }

  /** Single source of truth for paddle width: wide while the timer is live, base otherwise. */
  private syncPaddleWidth() {
    this.paddle.w = this.timers.has('wide') ? WIDE_PADDLE_W : PADDLE_W
  }

  /** Split the current balls into more, fanned out at fresh angles. */
  private spawnMultiball() {
    const source = this.balls.filter((b) => !b.dead)
    if (source.length === 0) return
    const added: Ball[] = []
    for (const src of source) {
      const speed = Math.max(Math.hypot(src.vx, src.vy), this.ballSpeed())
      const baseAngle = Math.atan2(src.vy, src.vx)
      for (let i = 1; i <= MULTIBALL_ADD; i++) {
        if (this.balls.length + added.length >= MAX_BALLS) break
        const dir = i % 2 === 0 ? 1 : -1
        const angle = baseAngle + dir * MULTIBALL_SPREAD * Math.ceil(i / 2)
        added.push({
          x: src.x,
          y: src.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: src.r,
        })
      }
    }
    this.balls.push(...added)
  }

  private updateTimers(dt: number) {
    for (const [type, remaining] of this.timers) {
      const left = remaining - dt
      if (left <= 0) this.timers.delete(type)
      else this.timers.set(type, left)
    }
    this.syncPaddleWidth() // revert to base width once the 'wide' timer lapses
    if (this.timers.has('gun')) {
      this.fireCooldown -= dt
      if (this.fireCooldown <= 0) {
        this.fire()
        this.fireCooldown = FIRE_INTERVAL
      }
    }
  }

  private fire() {
    const p = this.paddle
    const y = p.y - 2
    this.bullets.push({ x: p.x - p.w / 2 + 9, y, vy: -BULLET_SPEED, r: BULLET_R })
    this.bullets.push({ x: p.x + p.w / 2 - 9, y, vy: -BULLET_SPEED, r: BULLET_R })
    this.onEvent('shoot', p.x, y)
  }

  private updateGifts(dt: number) {
    const p = this.paddle
    const half = p.w / 2
    const kept: Gift[] = []
    for (const g of this.gifts) {
      g.y += g.vy * dt
      const caughtX = g.x + g.w > p.x - half && g.x < p.x + half
      const caughtY = g.y + g.h >= p.y && g.y <= p.y + p.h
      if (caughtX && caughtY) {
        this.applyPowerup(g.type)
        this.onEvent('giftget', g.x + g.w / 2, g.y + g.h / 2)
      } else if (g.y <= HEIGHT) {
        kept.push(g)
      }
    }
    this.gifts = kept
  }

  private updateBullets(dt: number) {
    let hitAny = false
    const kept: Bullet[] = []
    for (const bl of this.bullets) {
      bl.y += bl.vy * dt
      if (bl.y + bl.r < 0) continue // off top
      let consumed = false
      for (const br of this.bricks) {
        if (!br.alive) continue
        if (bl.x >= br.x && bl.x <= br.x + br.w && bl.y - bl.r <= br.y + br.h && bl.y + bl.r >= br.y) {
          this.damageBrick(br, bl.x, bl.y)
          consumed = true
          hitAny = true
          break
        }
      }
      if (!consumed) kept.push(bl)
    }
    this.bullets = kept
    if (hitAny && this.bricks.every((br) => !br.alive)) {
      this.onLevelCleared()
    }
  }

  private onLevelCleared() {
    this.saveHighScore()
    if (this.level >= MAX_LEVEL) {
      this.status = 'won'
      this.onEvent('win')
    } else {
      this.status = 'levelclear'
      this.onEvent('levelclear')
    }
  }

  private loseLife() {
    this.lives -= 1
    if (this.lives <= 0) {
      this.saveHighScore()
      this.status = 'gameover'
      this.onEvent('gameover')
    } else {
      this.onEvent('lose')
      this.resetTransient()
      this.parkBall()
      this.status = 'ready'
    }
  }
}
