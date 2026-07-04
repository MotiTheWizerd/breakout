import { useRef } from 'react'
import { useBreakout } from './hooks/useBreakout'
import { Hud } from './components/Hud'
import { Overlay } from './components/Overlay'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { snap, muted, launch, newGame, togglePause, toggleMute, size } = useBreakout(canvasRef)

  const onPrimary = () => {
    if (!snap) return
    if (snap.status === 'paused') togglePause()
    else if (snap.status === 'won' || snap.status === 'gameover') newGame()
    else launch() // ready / levelclear
  }

  return (
    <div className="app crt">
      <div className="stage">
        {snap && <Hud snap={snap} muted={muted} onMute={toggleMute} />}
        <div className="board">
          <canvas
            ref={canvasRef}
            width={size.WIDTH}
            height={size.HEIGHT}
            className="game-canvas"
          />
          {snap && <Overlay snap={snap} onPrimary={onPrimary} />}
        </div>
        <p className="credits">
          PINGBALL · a Breakout by <b>Moti</b> &amp; <b>Claude</b> 🐵🥊
        </p>
      </div>
    </div>
  )
}
