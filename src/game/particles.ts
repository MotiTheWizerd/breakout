interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  size: number
}

export class Particles {
  private items: Particle[] = []

  burst(x: number, y: number, hue: number, count = 14) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const sp = 60 + Math.random() * 180
      const life = 0.35 + Math.random() * 0.4
      this.items.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life,
        maxLife: life,
        hue,
        size: 2 + Math.random() * 3,
      })
    }
  }

  update(dt: number) {
    for (const p of this.items) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 240 * dt // gravity
      p.life -= dt
    }
    this.items = this.items.filter((p) => p.life > 0)
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.items) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  clear() {
    this.items = []
  }
}
