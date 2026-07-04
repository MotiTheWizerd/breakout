import { useCallback, useEffect, useRef, useState } from 'react'
import { BreakoutEngine } from '../game/engine'
import { Particles } from '../game/particles'
import { render } from '../game/render'
import { sound } from '../game/sound'
import { WIDTH, HEIGHT } from '../game/constants'
import type { Snapshot } from '../game/types'

export function useBreakout(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<BreakoutEngine | null>(null)
  const particlesRef = useRef(new Particles())
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [muted, setMuted] = useState(false)

  // lazily create the engine once
  if (engineRef.current === null) {
    engineRef.current = new BreakoutEngine()
  }

  // wire engine events -> sound + particles
  useEffect(() => {
    const engine = engineRef.current!
    engine.onEvent = (e, x, y) => {
      if (e === 'brick' && x != null && y != null) {
        particlesRef.current.burst(x, y, 320 - Math.random() * 60)
      }
      if (e === 'giftget' && x != null && y != null) {
        particlesRef.current.burst(x, y, 45, 22) // gold pop
      }
      if (e === 'levelclear' || e === 'win' || e === 'gameover') {
        particlesRef.current.clear()
      }
      // map engine events to sound presets
      sound.play(e as never)
    }
  }, [])

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let last = performance.now()
    let acc = 0
    let running = true

    const frame = (now: number) => {
      if (!running) return
      const engine = engineRef.current!
      let dt = (now - last) / 1000
      last = now
      dt = Math.min(dt, 0.05) // clamp big pauses (tab switch)
      acc += dt

      engine.update(dt)
      particlesRef.current.update(dt)
      render(ctx, engine, particlesRef.current, acc)

      setSnap(engine.snapshot())
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [canvasRef])

  // keyboard
  useEffect(() => {
    const engine = engineRef.current!
    const down = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A':
          engine.setPointer(null); engine.setMoveLeft(true); break
        case 'ArrowRight': case 'd': case 'D':
          engine.setPointer(null); engine.setMoveRight(true); break
        case ' ': case 'Enter':
          e.preventDefault(); sound.unlock(); engine.launchOrAdvance(); break
        case 'p': case 'P':
          engine.togglePause(); break
        default: return
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') engine.setMoveLeft(false)
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') engine.setMoveRight(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // pointer control on the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = engineRef.current!
    const toLocalX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect()
      return ((clientX - rect.left) / rect.width) * WIDTH
    }
    const move = (e: PointerEvent) => engine.setPointer(toLocalX(e.clientX))
    const leave = () => engine.setPointer(null)
    const click = () => { sound.unlock(); engine.launchOrAdvance() }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerleave', leave)
    canvas.addEventListener('pointerdown', click)
    return () => {
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('pointerdown', click)
    }
  }, [canvasRef])

  const launch = useCallback(() => {
    sound.unlock()
    engineRef.current!.launchOrAdvance()
  }, [])

  const newGame = useCallback(() => {
    sound.unlock()
    particlesRef.current.clear()
    engineRef.current!.startNewGame()
  }, [])

  const togglePause = useCallback(() => engineRef.current!.togglePause(), [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      sound.setMuted(next)
      return next
    })
  }, [])

  return { snap, muted, launch, newGame, togglePause, toggleMute, size: { WIDTH, HEIGHT } }
}
