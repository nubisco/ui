import type { IFormulaRange } from './types'

/** 0 -> 'A', 25 -> 'Z', 26 -> 'AA'. */
export function columnLetters(col: number): string {
  let letters = ''
  let n = Math.floor(col) + 1
  while (n > 0) {
    const rest = (n - 1) % 26
    letters = String.fromCharCode(65 + rest) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}

/** 'A' -> 0, 'AA' -> 26. Case-insensitive. Returns -1 for anything that is not letters. */
export function lettersToColumn(letters: string): number {
  if (!/^[A-Za-z]+$/.test(letters)) return -1
  let n = 0
  for (const char of letters.toUpperCase())
    n = n * 26 + (char.charCodeAt(0) - 64)
  return n - 1
}

const REF = /^\$?([A-Za-z]{1,3})\$?([1-9][0-9]*)$/

/** 'B3' -> { row: 2, col: 1 }, 0-based. Accepts '$' markers and lowercase. */
export function parseRef(ref: string): { row: number; col: number } | null {
  const match = REF.exec(ref)
  if (!match) return null
  return { row: Number(match[2]) - 1, col: lettersToColumn(match[1]) }
}

/** { row: 2, col: 1 } -> 'B3'. Never writes '$' markers. */
export function formatRef(row: number, col: number): string {
  return columnLetters(col) + String(row + 1)
}

/**
 * Reads the text of a range token ('A1:B2', 'A:B', '1:3', with optional
 * '$') into a normalised rectangle. Whole columns and whole rows run to
 * Infinity on their open side.
 */
export function parseRangeText(text: string): IFormulaRange | null {
  const parts = text.split(':')
  if (parts.length !== 2) return null
  const [a, b] = parts
  const cellA = parseRef(a)
  const cellB = parseRef(b)
  if (cellA && cellB)
    return normaliseRange(cellA.row, cellA.col, cellB.row, cellB.col)

  const colA = /^\$?([A-Za-z]{1,3})$/.exec(a)
  const colB = /^\$?([A-Za-z]{1,3})$/.exec(b)
  if (colA && colB) {
    const c1 = lettersToColumn(colA[1])
    const c2 = lettersToColumn(colB[1])
    return { r1: 0, r2: Infinity, c1: Math.min(c1, c2), c2: Math.max(c1, c2) }
  }

  const rowA = /^\$?([1-9][0-9]*)$/.exec(a)
  const rowB = /^\$?([1-9][0-9]*)$/.exec(b)
  if (rowA && rowB) {
    const r1 = Number(rowA[1]) - 1
    const r2 = Number(rowB[1]) - 1
    return { r1: Math.min(r1, r2), r2: Math.max(r1, r2), c1: 0, c2: Infinity }
  }
  return null
}

export function normaliseRange(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): IFormulaRange {
  return {
    r1: Math.min(r1, r2),
    r2: Math.max(r1, r2),
    c1: Math.min(c1, c2),
    c2: Math.max(c1, c2),
  }
}
