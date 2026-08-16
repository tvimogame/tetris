import { test, expect } from '@playwright/test'

const getState = (page) => page.evaluate(() => window.__tetris.state())

const cellSignature = (p) =>
  p.shape
    .flatMap((row, sy) => row.map((v, sx) => (v ? `${p.x + sx},${p.y + sy}` : null)))
    .filter(Boolean)
    .sort()
    .join('|')

test.describe('Tetris (tvimogame)', () => {
  test('shows tvimogame in header and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.tetris-brand')).toContainText('tvimogame')
    await expect(page.locator('.tetris-footer')).toContainText('tvimogame')
    await expect(page).toHaveTitle(/tvimogame/i)
  })

  test('start game begins play', async ({ page }) => {
    await page.goto('/')
    const s0 = await getState(page)
    expect(s0.status).toBe('ready')

    await page.getByRole('button', { name: 'Start Game' }).click()
    const s1 = await getState(page)
    expect(s1.status).toBe('playing')
    expect(s1.current).not.toBeNull()
    expect(s1.queue.length).toBeGreaterThanOrEqual(3)
  })

  test('arrow keys move the active piece', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    const x0 = (await getState(page)).current.x
    await page.keyboard.press('ArrowLeft')
    const x1 = (await getState(page)).current.x
    expect(x1).toBe(x0 - 1)

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const x2 = (await getState(page)).current.x
    expect(x2).toBe(x0 + 1)
  })

  test('rotation changes orientation and stays on the board', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    const before = await getState(page)
    const beforeSig = cellSignature(before.current)

    await page.keyboard.press('ArrowUp')
    const after = await getState(page)
    expect(after.status).toBe('playing')

    if (before.current.type !== 'O') {
      expect(cellSignature(after.current)).not.toBe(beforeSig)
    }

    const { current } = after
    for (let sy = 0; sy < current.shape.length; sy++) {
      for (let sx = 0; sx < current.shape[sy].length; sx++) {
        if (!current.shape[sy][sx]) continue
        const bx = current.x + sx
        const by = current.y + sy
        expect(bx).toBeGreaterThanOrEqual(0)
        expect(bx).toBeLessThan(10)
        expect(by).toBeGreaterThanOrEqual(0)
        expect(by).toBeLessThan(20)
      }
    }
  })

  test('hard drop adds points and locks the piece', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    const before = await getState(page)
    const filledBefore = before.board.flat().filter(Boolean).length

    await page.keyboard.press(' ')
    const after = await getState(page)
    const filledAfter = after.board.flat().filter(Boolean).length

    expect(filledAfter).toBeGreaterThan(filledBefore)
    expect(after.score).toBeGreaterThanOrEqual(before.score + 1)
  })

  test('soft drop scores 1 point per cell', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    const before = await getState(page)
    await page.keyboard.press('ArrowDown')
    const after = await getState(page)
    expect(after.score).toBe(before.score + 1)
    expect(after.current.y).toBe(before.current.y + 1)
  })

  test('hold stores the piece once per drop', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    const first = (await getState(page)).current.type
    await page.keyboard.press('c')
    let s = await getState(page)
    expect(s.hold).toBe(first)
    expect(s.canHold).toBe(false)

    // second hold on the same falling piece must be ignored
    const typeBefore = s.current.type
    await page.keyboard.press('c')
    s = await getState(page)
    expect(s.current.type).toBe(typeBefore)
    expect(s.hold).toBe(first)

    // after the next piece locks, hold becomes available again
    await page.keyboard.press(' ')
    s = await getState(page)
    expect(s.canHold).toBe(true)
  })

  test('pause freezes the game, resume continues it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    await page.keyboard.press('p')
    expect((await getState(page)).status).toBe('paused')

    const xPaused = (await getState(page)).current.x
    await page.keyboard.press('ArrowLeft')
    expect((await getState(page)).current.x).toBe(xPaused)

    await page
      .getByRole('button', { name: 'Resume' })
      .first()
      .click()
    expect((await getState(page)).status).toBe('playing')
  })

  test('game over when the stack reaches the top', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()

    for (let i = 0; i < 60; i++) {
      await page.keyboard.press(' ')
      await page.waitForTimeout(30)
      if ((await getState(page)).status === 'over') break
    }

    expect((await getState(page)).status).toBe('over')
    await expect(page.locator('.overlay-title.gameover')).toHaveText('GAME OVER')
    await expect(page.getByText(/Score:/)).toBeVisible()
  })

  test('line clear scoring: 1 line = 100 x level, 4 lines = 1500 x level', async ({ page }) => {
    // --- single line: bottom row has a 4-wide gap, horizontal I drops in ---
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.evaluate(() => {
      const board = Array.from({ length: 20 }, () => Array(10).fill(null))
      board[19] = Array(10).fill('red')
      for (let x = 3; x <= 6; x += 1) board[19][x] = null
      window.__tetris.dispatch({
        type: 'DEBUG_PRESET',
        board,
        current: { type: 'I', shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ], x: 3, y: 0 },
        queue: ['T', 'S', 'Z'],
      })
    })
    const singleBefore = (await getState(page)).score
    await page.keyboard.press(' ')
    let s = await getState(page)
    expect(s.lines).toBe(1)
    expect(s.score - singleBefore).toBe(100 + 18 * 2)

    // --- tetris: 4 rows with one column gap, vertical I drops in ---
    await page.evaluate(() => {
      const board = Array.from({ length: 20 }, () => Array(10).fill(null))
      for (let y = 16; y < 20; y += 1) {
        board[y] = Array(10).fill('blue')
        board[y][5] = null
      }
      window.__tetris.dispatch({
        type: 'DEBUG_PRESET',
        board,
        current: { type: 'I', shape: [
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
        ], x: 3, y: 0 },
        queue: ['T', 'S', 'Z'],
      })
    })
    const tetrisBefore = (await getState(page)).score
    await page.keyboard.press(' ')
    s = await getState(page)
    expect(s.lines).toBe(4)
    expect(s.score - tetrisBefore).toBe(1500 + 16 * 2)
  })

  test('4-line clear pays 1500 x level (level 2 = 3000)', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.evaluate(() => {
      const board = Array.from({ length: 20 }, () => Array(10).fill(null))
      for (let y = 16; y < 20; y += 1) {
        board[y] = Array(10).fill('green')
        board[y][5] = null
      }
      window.__tetris.dispatch({
        type: 'DEBUG_PRESET',
        board,
        current: { type: 'I', shape: [
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
          [0, 0, 1, 0],
        ], x: 3, y: 0 },
        queue: ['T', 'S', 'Z'],
        lines: 10,
        level: 2,
      })
    })
    const before = (await getState(page)).score
    await page.keyboard.press(' ')
    const s = await getState(page)
    expect(s.lines).toBe(14)
    expect(s.score - before).toBe(3000 + 16 * 2)
  })

  test('restart resets the game', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Game' }).click()
    await page.keyboard.press(' ')
    await page.keyboard.press(' ')

    await page.getByRole('button', { name: 'New Game' }).click()
    const s = await getState(page)
    expect(s.status).toBe('playing')
    expect(s.score).toBe(0)
    expect(s.board.flat().every((c) => c === null)).toBe(true)
  })
})
