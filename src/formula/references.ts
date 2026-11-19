import {
  columnLetters,
  lettersToColumn,
  parseRangeText,
  parseRef,
} from './refs'
import { CANONICAL_SYNTAX, tokenize } from './tokenizer'
import type { IFormulaReference, IFormulaSyntax } from './types'

/**
 * The references and ranges in a formula with their positions in the given
 * text, so an editor can colour each one and outline the cells it points at.
 */
export function referencesIn(
  formula: string,
  syntax: IFormulaSyntax = CANONICAL_SYNTAX,
): IFormulaReference[] {
  const found: IFormulaReference[] = []
  for (const token of tokenize(formula, syntax)) {
    if (token.type === 'reference') {
      const ref = parseRef(token.text)
      if (!ref) continue
      found.push({
        start: token.start,
        end: token.end,
        text: token.text,
        range: { r1: ref.row, c1: ref.col, r2: ref.row, c2: ref.col },
      })
    } else if (token.type === 'range') {
      const range = parseRangeText(token.text)
      if (range)
        found.push({
          start: token.start,
          end: token.end,
          text: token.text,
          range,
        })
    }
  }
  return found
}

/** One end of a reference: a column, a row or both, each relative or '$'-absolute. */
interface IRefPart {
  col?: { index: number; absolute: boolean }
  row?: { index: number; absolute: boolean }
}

const PART = /^(\$?)([A-Za-z]{1,3})?(\$?)([1-9][0-9]*)?$/

function readPart(text: string): IRefPart | null {
  const match = PART.exec(text)
  if (!match || (!match[2] && !match[4])) return null
  const part: IRefPart = {}
  // A lone '$' belongs to whichever half is present: '$3' is an absolute row.
  if (match[2])
    part.col = { index: lettersToColumn(match[2]), absolute: match[1] === '$' }
  if (match[4]) {
    const absolute = match[2]
      ? match[3] === '$'
      : match[1] === '$' || match[3] === '$'
    part.row = { index: Number(match[4]) - 1, absolute }
  }
  return part
}

function writePart(part: IRefPart): string {
  let text = ''
  if (part.col)
    text += (part.col.absolute ? '$' : '') + columnLetters(part.col.index)
  if (part.row)
    text += (part.row.absolute ? '$' : '') + String(part.row.index + 1)
  return text
}

/** Moves the relative halves of a part. Returns false when it falls off the sheet. */
function movePart(part: IRefPart, rows: number, cols: number): boolean {
  if (part.col && !part.col.absolute) part.col.index += cols
  if (part.row && !part.row.absolute) part.row.index += rows
  return (
    (!part.col || part.col.index >= 0) && (!part.row || part.row.index >= 0)
  )
}

function shiftReference(text: string, rows: number, cols: number): string {
  const pieces = text.split(':')
  const parts = pieces.map(readPart)
  if (parts.some((part) => part === null)) return text
  const moved = parts as IRefPart[]
  for (const part of moved) if (!movePart(part, rows, cols)) return '#REF!'
  if (moved.length === 2) {
    // With one end absolute, the ends can cross. Swap the crossed halves so
    // the range stays top-left to bottom-right.
    const [a, b] = moved
    if (a.row && b.row && a.row.index > b.row.index)
      [a.row, b.row] = [b.row, a.row]
    if (a.col && b.col && a.col.index > b.col.index)
      [a.col, b.col] = [b.col, a.col]
  }
  return moved.map(writePart).join(':')
}

/**
 * Moves the relative references of a formula by an offset, for fill and for
 * copy and paste. '$'-absolute columns and rows stay where they are. A
 * reference pushed above row 1 or left of column A becomes #REF!. Everything
 * else in the text is kept as it was, whitespace included.
 */
export function shiftFormula(
  formula: string,
  rows: number,
  cols: number,
): string {
  if (rows === 0 && cols === 0) return formula
  return tokenize(formula)
    .map((token) =>
      token.type === 'reference' || token.type === 'range'
        ? shiftReference(token.text, rows, cols)
        : token.text,
    )
    .join('')
}
