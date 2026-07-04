// Tiny synthesized sound engine — no audio assets, all Web Audio oscillators.

type Wave = OscillatorType

interface Beep {
  freq: number
  to?: number // optional glide target
  dur: number
  type: Wave
  gain?: number
}

const PRESETS: Record<string, Beep> = {
  paddle: { freq: 220, to: 330, dur: 0.07, type: 'square', gain: 0.18 },
  wall: { freq: 180, dur: 0.05, type: 'triangle', gain: 0.12 },
  brick: { freq: 520, to: 760, dur: 0.08, type: 'sawtooth', gain: 0.16 },
  lose: { freq: 300, to: 90, dur: 0.35, type: 'sawtooth', gain: 0.22 },
  levelclear: { freq: 440, to: 880, dur: 0.28, type: 'square', gain: 0.2 },
  gameover: { freq: 220, to: 55, dur: 0.6, type: 'sawtooth', gain: 0.24 },
  win: { freq: 523, to: 1046, dur: 0.5, type: 'square', gain: 0.22 },
  giftget: { freq: 660, to: 1180, dur: 0.18, type: 'square', gain: 0.2 },
  shoot: { freq: 900, to: 300, dur: 0.06, type: 'sawtooth', gain: 0.1 },
}

class SoundEngine {
  private ctx: AudioContext | null = null
  muted = false
  private semitone = 0 // per-level transpose applied to the tonal gameplay sounds

  // The constantly-heard gameplay sounds follow the level's "key" so the ear
  // moves with the eye; transition stingers stay fixed to keep their meaning.
  private static readonly TONAL = new Set(['paddle', 'wall', 'brick', 'giftget', 'shoot'])
  // Minor-pentatonic climb per level (1-indexed) — brighter/tenser each stage,
  // reaching a full octave on the crimson final level. Cycles past the end.
  private static readonly LEVEL_STEPS = [0, 3, 5, 7, 10, 12]

  /** Set the current level so tonal sounds transpose into that stage's key. */
  setLevel(level: number) {
    const steps = SoundEngine.LEVEL_STEPS
    this.semitone = steps[(Math.max(1, level) - 1) % steps.length]
  }

  private ensure(): AudioContext | null {
    if (this.muted) return null
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext()
      } catch {
        return null
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** Call from a user gesture to unlock audio on browsers that require it. */
  unlock() {
    this.ensure()
  }

  setMuted(m: boolean) {
    this.muted = m
  }

  play(name: keyof typeof PRESETS) {
    const ctx = this.ensure()
    if (!ctx) return
    const p = PRESETS[name]
    const shift = SoundEngine.TONAL.has(name) ? Math.pow(2, this.semitone / 12) : 1
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = p.type
    osc.frequency.setValueAtTime(p.freq * shift, t0)
    if (p.to != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, p.to * shift), t0 + p.dur)
    const peak = p.gain ?? 0.15
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + p.dur + 0.02)
  }
}

export const sound = new SoundEngine()
