import { useTetris } from '../hooks/useTetris.js'
import Board from './Board.jsx'
import GamePanel from './GamePanel.jsx'

const CLEAR_TEXT = { 1: 'SINGLE', 2: 'DOUBLE', 3: 'TRIPLE', 4: 'TETRIS!' }

export default function Tetris() {
  const { state, dispatch, highScore } = useTetris()
  const { status, score, clearing, lastClear } = state

  return (
    <div className="game-layout">
      <div className="board-wrap">
        <Board
          board={state.board}
          current={state.current}
          clearing={clearing}
          status={status}
        />

        {lastClear && status === 'playing' && (
          <div key={lastClear.key} className={`clear-banner banner--${lastClear.count}`}>
            {CLEAR_TEXT[lastClear.count]} +{lastClear.points}
          </div>
        )}

        {status === 'ready' && (
          <div className="overlay">
            <h1 className="overlay-title">TETRIS</h1>
            <p className="text-secondary mb-0">Stack the blocks. Don&apos;t reach the top.</p>
            <button
              type="button"
              className="btn btn-accent btn-lg px-4"
              onClick={() => dispatch({ type: 'START' })}
            >
              Start Game
            </button>
            <p className="small text-secondary mb-0">or press Enter</p>
          </div>
        )}

        {status === 'paused' && (
          <div className="overlay">
            <h1 className="overlay-title">PAUSED</h1>
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            >
              Resume
            </button>
          </div>
        )}

        {status === 'over' && (
          <div className="overlay">
            <h1 className="overlay-title gameover">GAME OVER</h1>
            <p className="mb-1">
              Score: <strong>{score}</strong>
            </p>
            <button type="button" className="btn btn-accent" onClick={() => dispatch({ type: 'START' })}>
              Restart
            </button>
          </div>
        )}
      </div>

      <GamePanel state={state} dispatch={dispatch} highScore={highScore} />
    </div>
  )
}
