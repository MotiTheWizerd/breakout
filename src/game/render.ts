import { WIDTH, HEIGHT, NET_Y } from './constants'
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

interface LevelTheme {
  skyTop: string
  skyBot: string
  grid: string
  sunA: string // sun top
  sunB: string // sun bottom
}

// One outrun palette per level — the eye gets a fresh vibe each stage, ramping
// from calm magenta dusk toward a crimson "danger" final level. Cycles if the
// level count ever exceeds the theme count.
const LEVEL_THEMES: LevelTheme[] = [
  { skyTop: '#0a0016', skyBot: '#1e0330', grid: 'rgba(255, 45, 149, 0.15)', sunA: '#ff2d95', sunB: '#ff8a3d' }, // 1 magenta dusk
  { skyTop: '#00131a', skyBot: '#022c37', grid: 'rgba(0, 231, 255, 0.15)', sunA: '#00e7ff', sunB: '#7dfff0' }, // 2 cyan night
  { skyTop: '#0c0020', skyBot: '#26094e', grid: 'rgba(150, 90, 255, 0.16)', sunA: '#a06bff', sunB: '#ff6bd6' }, // 3 violet void
  { skyTop: '#1a0700', skyBot: '#331402', grid: 'rgba(255, 150, 40, 0.15)', sunA: '#ffcf3d', sunB: '#ff5a2b' }, // 4 sunset amber
  { skyTop: '#02160a', skyBot: '#053315', grid: 'rgba(80, 255, 130, 0.15)', sunA: '#5dff8c', sunB: '#d4ff3d' }, // 5 acid green
  { skyTop: '#180003', skyBot: '#33000c', grid: 'rgba(255, 60, 90, 0.18)', sunA: '#ff3c5a', sunB: '#ff9a1f' }, // 6 crimson danger
]

function drawBackground(ctx: CanvasRenderingContext2D, t: number, level: number) {
  const theme = LEVEL_THEMES[(level - 1) % LEVEL_THEMES.length]
  const horizon = HEIGHT * 0.62

  // sky gradient above the horizon, deep void below
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, theme.skyTop)
  sky.addColorStop(1, theme.skyBot)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, WIDTH, horizon)
  ctx.fillStyle = '#05000c'
  ctx.fillRect(0, horizon, WIDTH, HEIGHT - horizon)

  // outrun sun sitting on the horizon (gradient disc + slit lines)
  const sunR = 92
  const sunY = horizon - 4
  ctx.save()
  ctx.shadowColor = theme.sunA
  ctx.shadowBlur = 60
  ctx.beginPath()
  ctx.arc(WIDTH / 2, sunY, sunR, 0, Math.PI * 2)
  ctx.clip()
  const sg = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR)
  sg.addColorStop(0, theme.sunA)
  sg.addColorStop(1, theme.sunB)
  ctx.fillStyle = sg
  ctx.fillRect(WIDTH / 2 - sunR, sunY - sunR, sunR * 2, sunR * 2)
  // horizontal slits across the lower half — cut with the sky color so the
  // bands read as gaps, widening toward the horizon (classic sunset look)
  ctx.fillStyle = theme.skyBot
  for (let i = 0; i < 8; i++) {
    const yy = sunY + 6 + i * 8
    ctx.fillRect(WIDTH / 2 - sunR, yy, sunR * 2, 2 + i * 0.9)
  }
  ctx.restore()

  // perspective grid floor for the outrun vibe
  ctx.save()
  ctx.strokeStyle = theme.grid
  ctx.lineWidth = 1
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
  // screen shake: translate the whole scene by the engine's trauma offset. Fill
  // a solid backdrop first so a hard shake never exposes an unpainted edge.
  const shake = engine.getShake()
  ctx.save()
  if (shake.x !== 0 || shake.y !== 0) {
    ctx.fillStyle = '#05000c'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.translate(shake.x, shake.y)
  }

  drawBackground(ctx, t, engine.level)

  // bricks
  for (const br of engine.bricks) {
    if (!br.alive) continue
    ctx.save()

    if (br.kind === 'solid') {
      // indestructible steel — desaturated gunmetal + corner rivets
      ctx.shadowColor = 'rgba(190, 200, 220, 0.45)'
      ctx.shadowBlur = 6
      const grad = ctx.createLinearGradient(br.x, br.y, br.x, br.y + br.h)
      grad.addColorStop(0, '#727a8c')
      grad.addColorStop(1, '#3a3f4d')
      ctx.fillStyle = grad
      roundRect(ctx, br.x, br.y, br.w, br.h, 5)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      for (const rx of [br.x + 6, br.x + br.w - 6]) {
        ctx.beginPath()
        ctx.arc(rx, br.y + br.h / 2, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      continue
    }

    const explosive = br.kind === 'explosive'
    const light = br.hp < br.maxHp ? 40 : 58
    ctx.shadowColor = `hsla(${br.hue}, 100%, 60%, ${explosive ? 1 : 0.9})`
    ctx.shadowBlur = explosive ? 16 + Math.sin(t * 6) * 5 : 12
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
    if (explosive) {
      // pulsing hot core telegraphs the blast
      const pulse = 0.5 + 0.5 * Math.sin(t * 6)
      ctx.fillStyle = `rgba(255, 244, 214, ${0.55 + 0.4 * pulse})`
      ctx.beginPath()
      ctx.arc(br.x + br.w / 2, br.y + br.h / 2, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
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
    // per-type icon
    ctx.shadowBlur = 0
    ctx.fillStyle = '#0c1418'
    const cx = g.x + g.w / 2
    const cy = g.y + g.h / 2
    if (g.type === 'gun') {
      ctx.fillStyle = '#20110a'
      ctx.fillRect(cx - 6, cy - 1, 12, 4) // barrel base
      ctx.fillRect(cx - 2, cy - 6, 4, 8) // muzzle up
    } else if (g.type === 'wide') {
      // wide: a bar with arrowheads pointing outward (↔)
      ctx.fillStyle = '#0c2412'
      ctx.fillRect(cx - 5, cy - 2, 10, 4) // center bar
      ctx.beginPath() // left arrowhead
      ctx.moveTo(cx - 11, cy)
      ctx.lineTo(cx - 5, cy - 5)
      ctx.lineTo(cx - 5, cy + 5)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath() // right arrowhead
      ctx.moveTo(cx + 11, cy)
      ctx.lineTo(cx + 5, cy - 5)
      ctx.lineTo(cx + 5, cy + 5)
      ctx.closePath()
      ctx.fill()
    } else if (g.type === 'slow') {
      // slow-mo: a little clock face
      ctx.strokeStyle = '#1a0c24'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy - 5) // hour hand
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + 4, cy + 1) // minute hand
      ctx.stroke()
    } else if (g.type === 'shrink') {
      // skull: two eye sockets + a nose (the bad gift)
      ctx.fillStyle = '#2a0508'
      ctx.beginPath()
      ctx.arc(cx - 5, cy - 1, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 5, cy - 1, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx, cy + 1)
      ctx.lineTo(cx - 2, cy + 5)
      ctx.lineTo(cx + 2, cy + 5)
      ctx.closePath()
      ctx.fill()
    } else if (g.type === 'life') {
      // extra life: a heart
      ctx.fillStyle = '#2a0616'
      ctx.beginPath()
      ctx.moveTo(cx, cy + 6)
      ctx.bezierCurveTo(cx - 9, cy - 2, cx - 5, cy - 8, cx, cy - 3)
      ctx.bezierCurveTo(cx + 5, cy - 8, cx + 9, cy - 2, cx, cy + 6)
      ctx.closePath()
      ctx.fill()
    } else if (g.type === 'net') {
      // safety net: a shield pentagon
      ctx.fillStyle = '#08202e'
      ctx.beginPath()
      ctx.moveTo(cx, cy - 6)
      ctx.lineTo(cx + 6, cy - 3)
      ctx.lineTo(cx + 6, cy + 1)
      ctx.lineTo(cx, cy + 7)
      ctx.lineTo(cx - 6, cy + 1)
      ctx.lineTo(cx - 6, cy - 3)
      ctx.closePath()
      ctx.fill()
    } else if (g.type === 'fireball') {
      // fireball: a little flame teardrop
      ctx.fillStyle = '#2a1206'
      ctx.beginPath()
      ctx.moveTo(cx, cy - 7)
      ctx.quadraticCurveTo(cx + 6, cy - 1, cx + 4, cy + 4)
      ctx.quadraticCurveTo(cx + 3, cy + 7, cx, cy + 7)
      ctx.quadraticCurveTo(cx - 3, cy + 7, cx - 4, cy + 4)
      ctx.quadraticCurveTo(cx - 6, cy - 1, cx, cy - 7)
      ctx.closePath()
      ctx.fill()
    } else {
      // multiball: three little balls
      for (const dx of [-7, 0, 7]) {
        ctx.beginPath()
        ctx.arc(cx + dx, cy, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  particles.render(ctx)

  // paddle
  const p = engine.paddle
  const armed = engine.hasPowerup('gun')
  const wide = engine.hasPowerup('wide')
  const shrunk = engine.hasPowerup('shrink')
  ctx.save()
  ctx.shadowColor = shrunk
    ? 'rgba(255, 60, 90, 0.95)'
    : armed
      ? 'rgba(255, 158, 61, 0.95)'
      : wide
        ? 'rgba(93, 255, 140, 0.9)'
        : 'rgba(0, 255, 231, 0.9)'
  ctx.shadowBlur = 18
  const pg = ctx.createLinearGradient(0, p.y, 0, p.y + p.h)
  if (shrunk) {
    pg.addColorStop(0, '#ff9aa8')
    pg.addColorStop(1, '#e21d3a')
  } else if (armed) {
    pg.addColorStop(0, '#ffd79a')
    pg.addColorStop(1, '#ff8a2b')
  } else if (wide) {
    pg.addColorStop(0, '#b6ffcb')
    pg.addColorStop(1, '#1fcf5d')
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

  // safety-net shield line across the floor while active (animated energy bar)
  if (engine.hasPowerup('net')) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 6)
    ctx.save()
    ctx.strokeStyle = `rgba(90, 180, 255, ${0.35 + 0.5 * pulse})`
    ctx.lineWidth = 3
    ctx.shadowColor = 'rgba(90, 180, 255, 0.95)'
    ctx.shadowBlur = 16
    ctx.setLineDash([16, 10])
    ctx.lineDashOffset = -(t * 60) % 26
    ctx.beginPath()
    ctx.moveTo(0, NET_Y)
    ctx.lineTo(WIDTH, NET_Y)
    ctx.stroke()
    ctx.restore()
  }

  // balls — fireball blazes orange (priority), else slow-mo tints violet
  const fire = engine.hasPowerup('fireball')
  const slow = engine.hasPowerup('slow')
  const ballEdge = fire ? '#ff6a12' : slow ? '#b06bff' : '#ff2d95'
  const ballGlow = fire
    ? 'rgba(255, 120, 24, 0.98)'
    : slow
      ? 'rgba(176, 107, 255, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
  for (const b of engine.balls) {
    ctx.save()
    ctx.shadowColor = ballGlow
    ctx.shadowBlur = fire ? 28 : 20
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
    bg.addColorStop(0, '#ffffff')
    bg.addColorStop(1, ballEdge)
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.restore() // end screen-shake transform
}
