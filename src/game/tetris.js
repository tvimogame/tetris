export const COLS = 10
export const ROWS = 20

export const PIECE_DEFS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'cyan',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'blue',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'orange',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'yellow',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'green',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'purple',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'red',
  },
}

export const PIECE_TYPES = Object.keys(PIECE_DEFS)

export const LINE_SCORES = [0, 100, 300, 700, 1500]

const KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
  [-2, 0],
  [2, 0],
]

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

export function shuffleBag() {
  const bag = [...PIECE_TYPES]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

export function rotateShape(shape, dir) {
  const n = shape.length
  const out = Array.from({ length: n }, () => Array(n).fill(0))
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (dir > 0) out[x][n - 1 - y] = shape[y][x]
      else out[n - 1 - x][y] = shape[y][x]
    }
  }
  return out
}

export function collides(board, shape, x, y) {
  for (let sy = 0; sy < shape.length; sy++) {
    for (let sx = 0; sx < shape[sy].length; sx++) {
      if (!shape[sy][sx]) continue
      const bx = x + sx
      const by = y + sy
      if (bx < 0 || bx >= COLS || by >= ROWS) return true
      if (by >= 0 && board[by][bx]) return true
    }
  }
  return false
}

export function mergePiece(board, piece) {
  const next = board.map((row) => [...row])
  const color = PIECE_DEFS[piece.type].color
  piece.shape.forEach((row, sy) =>
    row.forEach((v, sx) => {
      if (v && piece.y + sy >= 0) next[piece.y + sy][piece.x + sx] = color
    }),
  )
  return next
}

export function findFullRows(board) {
  const rows = []
  board.forEach((row, y) => {
    if (row.every((c) => c)) rows.push(y)
  })
  return rows
}

export function removeRows(board, rows) {
  const doomed = new Set(rows)
  const kept = board.filter((_, y) => !doomed.has(y))
  const fresh = Array.from({ length: rows.length }, () => Array(COLS).fill(null))
  return [...fresh, ...kept]
}

export function ghostY(board, piece) {
  let y = piece.y
  while (!collides(board, piece.shape, piece.x, y + 1)) y += 1
  return y
}

export function spawnPiece(type) {
  const shape = PIECE_DEFS[type].shape.map((row) => [...row])
  return {
    type,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  }
}

export function scoreForLines(n, level) {
  return LINE_SCORES[n] * level
}

export function levelForLines(lines) {
  return Math.floor(lines / 10) + 1
}

export function gravityMs(level) {
  return Math.max(70, Math.round(800 * Math.pow(0.85, level - 1)))
}

function drawFromQueue(queue) {
  const [head, ...rest] = queue
  let next = rest
  while (next.length < 3) next = next.concat(shuffleBag())
  return { type: head, queue: next }
}

export function createInitialState() {
  const { type, queue } = drawFromQueue(shuffleBag())
  return {
    board: createEmptyBoard(),
    current: spawnPiece(type),
    queue,
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    status: 'ready',
    clearing: null,
    lastClear: null,
  }
}

function spawnNext(state) {
  const { type, queue } = drawFromQueue(state.queue)
  const current = spawnPiece(type)
  if (collides(state.board, current.shape, current.x, current.y)) {
    return { ...state, current, queue, status: 'over' }
  }
  return { ...state, current, queue, canHold: true }
}

function lockPiece(state) {
  const board = mergePiece(state.board, state.current)
  const full = findFullRows(board)
  if (full.length > 0) {
    const lines = state.lines + full.length
    const points = scoreForLines(full.length, state.level)
    return {
      ...state,
      board,
      current: null,
      clearing: full,
      lines,
      level: levelForLines(lines),
      score: state.score + points,
      lastClear: { count: full.length, points, key: Date.now() },
    }
  }
  return spawnNext({ ...state, board, current: null })
}

export function tetrisReducer(state, action) {
  switch (action.type) {
    case 'START': {
      return { ...createInitialState(), status: 'playing' }
    }

    case 'TICK': {
      if (state.status !== 'playing' || state.clearing) return state
      const piece = state.current
      const ny = piece.y + 1
      if (!collides(state.board, piece.shape, piece.x, ny)) {
        return { ...state, current: { ...piece, y: ny } }
      }
      return lockPiece(state)
    }

    case 'MOVE': {
      if (state.status !== 'playing' || state.clearing) return state
      const nx = state.current.x + action.dx
      if (!collides(state.board, state.current.shape, nx, state.current.y)) {
        return { ...state, current: { ...state.current, x: nx } }
      }
      return state
    }

    case 'ROTATE': {
      if (state.status !== 'playing' || state.clearing) return state
      if (state.current.type === 'O') return state
      const shape = rotateShape(state.current.shape, action.dir)
      for (const [dx, dy] of KICKS) {
        const nx = state.current.x + dx
        const ny = state.current.y + dy
        if (!collides(state.board, shape, nx, ny)) {
          return { ...state, current: { ...state.current, shape, x: nx, y: ny } }
        }
      }
      return state
    }

    case 'SOFT_DROP': {
      if (state.status !== 'playing' || state.clearing) return state
      const piece = state.current
      if (!collides(state.board, piece.shape, piece.x, piece.y + 1)) {
        return { ...state, current: { ...piece, y: piece.y + 1 }, score: state.score + 1 }
      }
      return lockPiece(state)
    }

    case 'HARD_DROP': {
      if (state.status !== 'playing' || state.clearing) return state
      const y = ghostY(state.board, state.current)
      const points = (y - state.current.y) * 2
      return lockPiece({
        ...state,
        current: { ...state.current, y },
        score: state.score + points,
      })
    }

    case 'HOLD': {
      if (state.status !== 'playing' || state.clearing || !state.canHold) return state
      const currentType = state.current.type
      if (state.hold) {
        const piece = spawnPiece(state.hold)
        if (collides(state.board, piece.shape, piece.x, piece.y)) return state
        return { ...state, hold: currentType, current: piece, canHold: false }
      }
      const spawned = spawnNext(state)
      return { ...spawned, hold: currentType, canHold: false }
    }

    case 'CLEAR_DONE': {
      if (!state.clearing) return state
      const board = removeRows(state.board, state.clearing)
      return spawnNext({ ...state, board, clearing: null })
    }

    case 'DEBUG_PRESET': {
      return {
        ...state,
        board: action.board,
        current: action.current,
        queue: action.queue,
        hold: action.hold ?? null,
        canHold: true,
        score: action.score ?? 0,
        lines: action.lines ?? 0,
        level: action.level ?? 1,
        status: 'playing',
        clearing: null,
        lastClear: null,
      }
    }

    case 'TOGGLE_PAUSE': {
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return state
    }

    default:
      return state
  }
}
