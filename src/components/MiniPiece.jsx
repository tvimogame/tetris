import { PIECE_DEFS } from '../game/tetris.js'

export default function MiniPiece({ type, dim }) {
  const { shape } = PIECE_DEFS[type]
  const cells = []
  shape.forEach((row, y) =>
    row.forEach((v, x) => {
      cells.push(
        <div key={`${x}-${y}`} className={`mini ${v ? `mini--on mini--${type}` : ''}`} />,
      )
    }),
  )
  return (
    <div
      className={`mini-grid ${dim ? 'mini-grid--dim' : ''}`}
      style={{ gridTemplateColumns: `repeat(${shape[0].length}, 1fr)` }}
    >
      {cells}
    </div>
  )
}
