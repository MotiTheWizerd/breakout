import { WIDTH, HEIGHT } from './constants'
import type { BreakoutEngine } from './engine'
import type { Particles } from './particles'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = '#090014'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // subtle perspective grid floor for the outrun vibe
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 45, 149, 0.10)'
  ctx.lineWidth = 1
  const horizon = HEIGHT * 0.62
  for (let i = 1; i <= 14; i++) {
    const p = i / 14
    const y = horizon + (HEIGHT - horizon) * p * p
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(WIDTH, y)
    ctx.stroke()
  }
  const scroll = (t * 40) % 60
  for (let x = -WIDTH; x <= WIDTH * 2; x += 60) {
    const vx = WIDTH / 2 + (x + scroll - WIDTH / 2)
    ctx.beginPath()
    ctx.moveTo(WIDTH / 2, horizon)
    ctx.lineTo(vx, HEIGHT)
    ctx.stroke()
  }
  ctx.restore()
}

export function render(
  ctx: CanvasRenderingContext2D,
  engine: BreakoutEngine,
  particles: Particles,
  t: number,
) {
  drawBackground(ctx, t)

  // bricks
  for (const br of engine.bricks) {
    if (!br.alive) continue
    const light = br.hp < br.maxHp ? 40 : 58
    ctx.save()
    ctx.shadowColor = `hsla(${br.hue}, 100%, 60%, 0.9)`
    ctx.shadowBlur = 12
    const grad = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.h)
    grad.addColorStop(0, `hsl(${br.hue}, 100%, ${light + 12}%)`)
    grad.addColorStop(1, `hsl(${br.hue}, 90%, ${light - 14}%)`)
    ctx.fillStyle = grad
    roundRect(ctx, br.x, br.y, br.w, br.h, 5)
    ctx.fill()
    // top bevel highlight
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    roundRect(ctx, br.x + 2, br.y + 2, br.w - 4, 4, 2)
    ctx.fill()
    ctx.restore()
  }

  // bullets (drawn under paddle so they emerge from it)
  for (const bl of engine.bullets) {
    ctx.save()
    ctx.shadowColor = 'rgba(0, 255, 231, 0.95)'
    ctx.shadowBlur = 14
    const grad = ctx.createLinearGradient(bl.x, bl.y - 10, bl.x, bl.y + 6)
    grad.addColorStop(0, 'rgba(0,255,231,0)')
    grad.addColorStop(1, '#eafffb')
    ctx.strokeStyle = grad
    ctx.lineWidth = bl.r
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(bl.x, bl.y + 6)
    ctx.lineTo(bl.x, bl.y - 12)
    ctx.stroke()
    ctx.restore()
  }

  // falling gifts
  for (const g of engine.gifts) {
    ctx.save()
    ctx.shadowColor = `hsla(${g.hue}, 100%, 60%, 0.95)`
    ctx.shadowBlur = 16
    const grad = ctx.createLinearGradient(g.x, g.y, g.x, g.y + g.h)
    grad.addColorStop(0, `hsl(${g.hue}, 100%, 66%)`)
    grad.addColorStop(1, `hsl(${g.hue}, 95%, 44%)`)
    ctx.fillStyle = grad
    roundRect(ctx, g.x, g.y, g.w, g.h, 6)
    ctx.fill()
    // icon: a little cannon glyph for the 'gun' gift
    ctx.shadowBlur = 0
    ctx.fillStyle = '#20110a'
    const cx = g.x + g.w / 2
    const cy = g.y + g.h / 2
    ctx.fillRect(cx - 6, cy - 1, 12, 4) // barrel base
    ctx.fillRect(cx - 2, cy - 6, 4, 8) // muzzle up
    ctx.restore()
  }

  particles.render(ctx)

  // paddle
  const p = engine.paddle
  const armed = engine.hasPowerup('gun')
  ctx.save()
  ctx.shadowColor = armed ? 'rgba(255, 158, 61, 0.95)' : 'rgba(0, 255, 231, 0.9)'
  ctx.shadowBlur = 18
  const pg = ctx.createLinearGradient(0, p.y, 0, p.y + p.h)
  if (armed) {
    pg.addColorStop(0, '#ffd79a')
    pg.addColorStop(1, '#ff8a2b')
  } else {
    pg.addColorStop(0, '#8afff5')
    pg.addColorStop(1, '#00b7d4')
  }
  ctx.fillStyle = pg
  roundRect(ctx, p.x - p.w / 2, p.y, p.w, p.h, 8)
  ctx.fill()
  if (armed) {
    // muzzles poking up at each end
    ctx.fillStyle = '#ffe6c2'
    ctx.fillRect(p.x - p.w / 2 + 6, p.y - 5, 6, 6)
    ctx.fillRect(p.x + p.w / 2 - 12, p.y - 5, 6, 6)
  }
  ctx.restore()

  // ball
  const b = engine.ball
  ctx.save()
  ctx.shadowColor = 'rgba(255, 255, 255, 0.95)'
  ctx.shadowBlur = 20
  const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
  bg.addColorStop(0, '#ffffff')
  bg.addColorStop(1, '#ff2d95')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
