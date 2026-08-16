import { COLS, ROWS, ghostY } from '../game/tetris.js'

export default function Board({ board, current, clearing, status }) {
  const ghostCells = new Map()
  if (current) {
    const gy = ghostY(board, current)
    if (gy !== current.y) {
      current.shape.forEach((row, sy) =>
        row.forEach((v, sx) => {
          if (v) ghostCells.set(`${current.x + sx},${gy + sy}`, current.type)
        }),
      )
    }
  }

  const currentCells = new Map()
  if (current) {
    current.shape.forEach((row, sy) =>
      row.forEach((v, sx) => {
        if (v) currentCells.set(`${current.x + sx},${current.y + sy}`, current.type)
      }),
    )
  }

  const clearingSet = new Set(clearing || [])

  const cells = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const key = `${x},${y}`
      const base = board[y][x]
      let cls = 'cell'
      if (currentCells.has(key)) {
        cls += ` piece piece--${currentCells.get(key)}`
      } else if (base) {
        cls += ` filled filled--${base}`
      } else if (status === 'playing' && ghostCells.has(key)) {
        cls += ` ghost ghost--${ghostCells.get(key)}`
      }
      if (clearingSet.has(y)) cls += ' clearing'
      cells.push(<div key={key} className={cls} />)
    }
  }

  return (
    <div className="board" role="img" aria-label="Tetris board">
      {cells}
    </div>
  )
}
