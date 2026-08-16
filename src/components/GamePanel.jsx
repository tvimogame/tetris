import MiniPiece from './MiniPiece.jsx'

export default function GamePanel({ state, dispatch, highScore }) {
  const { status, score, lines, level, hold, queue, canHold } = state

  return (
    <div className="panels d-flex flex-column gap-3">
      <div className="panel">
        <div className="stat-label mb-2">Hold</div>
        <div className="mini-wrap">
          {hold ? (
            <MiniPiece type={hold} dim={!canHold} />
          ) : (
            <span className="text-secondary small">empty</span>
          )}
        </div>
        <div className="stat-label mt-3 mb-2">Next</div>
        <div className="d-flex flex-column gap-2">
          {queue.slice(0, 3).map((t, i) => (
            <MiniPiece key={`${t}-${i}`} type={t} dim={i > 0} />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Score</span>
          <span key={score} className="stat-value score-value">
            {score}
          </span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Best</span>
          <span className="stat-value">{highScore}</span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Lines</span>
          <span className="stat-value">{lines}</span>
        </div>
        <div className="d-flex justify-content-between align-items-baseline">
          <span className="stat-label">Level</span>
          <span className="stat-value">{level}</span>
        </div>
      </div>

      <div className="panel">
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            disabled={status !== 'playing' && status !== 'paused'}
          >
            {status === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={() => dispatch({ type: 'START' })}
          >
            New Game
          </button>
        </div>
        <ul className="controls-hint list-unstyled mb-0 mt-3">
          <li>
            <kbd>←</kbd> <kbd>→</kbd> move
          </li>
          <li>
            <kbd>↑</kbd> / <kbd>Z</kbd> rotate
          </li>
          <li>
            <kbd>↓</kbd> soft drop
          </li>
          <li>
            <kbd>Space</kbd> hard drop
          </li>
          <li>
            <kbd>C</kbd> hold
          </li>
          <li>
            <kbd>P</kbd> pause
          </li>
        </ul>
      </div>
    </div>
  )
}
