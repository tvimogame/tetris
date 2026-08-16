import { useEffect, useReducer, useRef, useState } from 'react'
import { createInitialState, gravityMs, tetrisReducer } from '../game/tetris.js'

const HIGH_SCORE_KEY = 'tvimogame-tetris-highscore'

export function useTetris() {
  const [state, dispatch] = useReducer(tetrisReducer, undefined, createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const [highScore, setHighScore] = useState(() => {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY))
    return Number.isFinite(stored) ? stored : 0
  })

  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score)
      localStorage.setItem(HIGH_SCORE_KEY, String(state.score))
    }
  }, [state.score, highScore])

  useEffect(() => {
    if (state.status !== 'playing' || state.clearing) return undefined
    const id = setInterval(() => dispatch({ type: 'TICK' }), gravityMs(state.level))
    return () => clearInterval(id)
  }, [state.status, state.level, state.clearing])

  useEffect(() => {
    if (!state.clearing) return undefined
    const id = setTimeout(() => dispatch({ type: 'CLEAR_DONE' }), 420)
    return () => clearTimeout(id)
  }, [state.clearing])

  useEffect(() => {
    const onKey = (e) => {
      const st = stateRef.current
      const k = e.key
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) {
        e.preventDefault()
      }
      if (k === 'ArrowLeft') dispatch({ type: 'MOVE', dx: -1 })
      else if (k === 'ArrowRight') dispatch({ type: 'MOVE', dx: 1 })
      else if (k === 'ArrowUp') dispatch({ type: 'ROTATE', dir: 1 })
      else if (k === 'z' || k === 'Z') dispatch({ type: 'ROTATE', dir: -1 })
      else if (k === 'ArrowDown') dispatch({ type: 'SOFT_DROP' })
      else if (k === ' ') dispatch({ type: 'HARD_DROP' })
      else if (k === 'c' || k === 'C') dispatch({ type: 'HOLD' })
      else if (k === 'p' || k === 'P' || k === 'Escape') {
        if (st.status === 'playing' || st.status === 'paused') {
          dispatch({ type: 'TOGGLE_PAUSE' })
        }
      } else if (k === 'Enter' && (st.status === 'ready' || st.status === 'over')) {
        dispatch({ type: 'START' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.__tetris = {
      dispatch: (action) => dispatch(action),
      state: () => stateRef.current,
    }
    return () => {
      delete window.__tetris
    }
  }, [])

  return { state, dispatch, highScore }
}
