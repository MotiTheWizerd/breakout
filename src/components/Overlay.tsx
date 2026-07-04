import type { Snapshot } from '../game/types'

interface Props {
  snap: Snapshot
  onPrimary: () => void
}

/** Full-screen message layer shown for every non-'playing' status. */
export function Overlay({ snap, onPrimary }: Props) {
  if (snap.status === 'playing') return null

  let title = ''
  let subtitle = ''
  let cta = ''
  let tone = 'neon'

  switch (snap.status) {
    case 'ready':
      title = snap.level === 1 && snap.score === 0 ? 'PINGBALL' : `LEVEL ${snap.level}`
      subtitle = 'Move with mouse or ← →  •  Launch with Space / Click'
      cta = 'LAUNCH'
      break
    case 'paused':
      title = 'PAUSED'
      subtitle = 'Take a breath, champ'
      cta = 'RESUME'
      break
    case 'levelclear':
      title = 'LEVEL CLEAR'
      subtitle = `Score ${snap.score} — next round is faster`
      cta = 'NEXT LEVEL'
      tone = 'win'
      break
    case 'won':
      title = 'YOU WIN! 🏆'
      subtitle = `All levels cleared with ${snap.score} points`
      cta = 'PLAY AGAIN'
      tone = 'win'
      break
    case 'gameover':
      title = 'GAME OVER'
      subtitle = snap.score >= snap.highScore && snap.score > 0
        ? `New high score: ${snap.score}!`
        : `Final score ${snap.score}`
      cta = 'RETRY'
      tone = 'lose'
      break
  }

  return (
    <div className="overlay">
      <div className={`overlay-card ${tone}`}>
        <h1 className="overlay-title">{title}</h1>
        <p className="overlay-sub">{subtitle}</p>
        <button className="overlay-cta" onClick={onPrimary}>{cta}</button>
        <p className="overlay-hint">Space / Click · P to pause</p>
      </div>
    </div>
  )
}
