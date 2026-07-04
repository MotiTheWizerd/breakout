import type { PowerUpType, Snapshot } from '../game/types'
import { START_LIVES } from '../game/constants'

const POWERUP_META: Record<PowerUpType, { icon: string; label: string }> = {
  gun: { icon: '🔫', label: 'GUN' },
  multiball: { icon: '🔴', label: 'MULTI' },
  wide: { icon: '↔️', label: 'WIDE' },
  slow: { icon: '🐢', label: 'SLOW' },
  shrink: { icon: '💀', label: 'SHRINK' },
  fireball: { icon: '🔥', label: 'FIRE' },
}

export function Hud({ snap, muted, onMute }: { snap: Snapshot; muted: boolean; onMute: () => void }) {
  return (
    <div className="hud">
      <div className="hud-cell">
        <span className="hud-label">SCORE</span>
        <span className="hud-value">{snap.score.toString().padStart(5, '0')}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">HIGH</span>
        <span className="hud-value hud-high">{snap.highScore.toString().padStart(5, '0')}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">LEVEL</span>
        <span className="hud-value">{snap.level}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">LIVES</span>
        <span className="hud-lives">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <span key={i} className={i < snap.lives ? 'life on' : 'life'}>●</span>
          ))}
        </span>
      </div>
      <div className="hud-powerups">
        {snap.powerups.map((pu) => (
          <span key={pu.type} className="powerup-badge">
            {POWERUP_META[pu.type].icon} {POWERUP_META[pu.type].label}
            <b>{pu.remaining}s</b>
          </span>
        ))}
      </div>
      <button className="mute-btn" onClick={onMute} title={muted ? 'Unmute' : 'Mute'}>
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}
