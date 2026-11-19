import { parseDateText } from './dates'
import { ERROR_LITERALS } from './tokenizer'
import type {
  IEvalContext,
  IFormulaError,
  IFormulaRange,
  IMatrix,
  TFormulaErrorCode,
  TScalar,
  TValue,
} from './types'

const DEFAULT_MESSAGES: Record<TFormulaErrorCode, string> = {
  '#DIV/0!': 'Division by zero',
  '#VALUE!': 'Wrong type of value',
  '#REF!': 'Invalid reference',
  '#NAME?': 'Unknown name',
  '#N/A': 'Value not available',
  '#NUM!': 'Invalid number',
  '#NULL!': 'Empty intersection',
  '#ERROR!': 'Formula could not be read',
}

export function formulaError(
  code: TFormulaErrorCode,
  message?: string,
): IFormulaError {
  return { error: code, message: message ?? DEFAULT_MESSAGES[code] }
}

/** True for a string starting with '=' that has something after it. */
export function isFormula(value: unknown): value is string {
  return typeof value === 'string' && value.length > 1 && value[0] === '='
}

export function isFormulaError(value: unknown): value is IFormulaError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    (ERROR_LITERALS as readonly unknown[]).includes(
      (value as IFormulaError).error,
    )
  )
}

export function isMatrix(value: unknown): value is IMatrix {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as IMatrix).kind === 'matrix'
  )
}

export function arrayMatrix(
  rows: number,
  cols: number,
  data: TScalar[],
): IMatrix {
  return {
    kind: 'matrix',
    rows,
    cols,
    get: (r, c) => data[r * cols + c] ?? null,
  }
}

/** A matrix over sheet cells. Open-ended ranges stop at the used area of the sheet. */
export function rangeMatrix(ctx: IEvalContext, range: IFormulaRange): IMatrix {
  const r2 = range.r2 === Infinity ? ctx.extent.rows - 1 : range.r2
  const c2 = range.c2 === Infinity ? ctx.extent.cols - 1 : range.c2
  const { r1, c1 } = range
  return {
    kind: 'matrix',
    rows: Math.max(0, r2 - r1 + 1),
    cols: Math.max(0, c2 - c1 + 1),
    get: (r, c) => ctx.cell(r1 + r, c1 + c),
    origin: { row: r1, col: c1 },
  }
}

/** Any value as a matrix, so functions that take ranges also take a single value. */
export function asMatrix(value: TValue): IMatrix {
  return isMatrix(value) ? value : arrayMatrix(1, 1, [value])
}

/** Visits every cell, row by row. Returning true from the visitor stops the walk. */
export function eachCell(
  matrix: IMatrix,
  visit: (value: TScalar, row: number, col: number) => boolean | void,
): void {
  for (let r = 0; r < matrix.rows; r++) {
    for (let c = 0; c < matrix.cols; c++) {
      if (visit(matrix.get(r, c), r, c) === true) return
    }
  }
}

/**
 * A value where one value is expected. A single cell is its value. A range
 * of any other size is #VALUE!, since there is no implicit intersection.
 */
export function scalar(value: TValue): TScalar {
  if (!isMatrix(value)) return value
  if (value.rows === 1 && value.cols === 1) return value.get(0, 0)
  return formulaError('#VALUE!', 'A range cannot be used as a single value')
}

const NUMERIC_TEXT =
  /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?%?$/

/** Reads text that looks like a number ('3', ' -1.5 ', '2e3', '50%'), or null. */
export function parseNumericText(text: string): number | null {
  const trimmed = text.trim()
  if (!NUMERIC_TEXT.test(trimmed)) return null
  if (trimmed.endsWith('%')) return Number(trimmed.slice(0, -1)) / 100
  return Number(trimmed)
}

export function toNumber(value: TScalar): number | IFormulaError {
  if (value === null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    // Date and time text counts as its serial number, as in Excel, so
    // "2026-01-02"-"2026-01-01" is 1.
    const parsed = parseNumericText(value) ?? parseDateText(value)
    return parsed === null
      ? formulaError('#VALUE!', 'Text cannot be used as a number')
      : parsed
  }
  return value
}

/** Numbers as text the way a spreadsheet shows them: at most 15 significant digits. */
export function numberToText(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e21) return String(value)
  return String(Number(value.toPrecision(15))).toUpperCase()
}

export function toText(value: TScalar): string | IFormulaError {
  if (value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return numberToText(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return value
}

export function toBoolean(value: TScalar): boolean | IFormulaError {
  if (value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const upper = value.toUpperCase()
    if (upper === 'TRUE') return true
    if (upper === 'FALSE') return false
    return formulaError('#VALUE!', 'Text cannot be used as TRUE or FALSE')
  }
  return value
}

export const numberArg = (value: TValue) => toNumber(scalar(value))
export const textArg = (value: TValue) => toText(scalar(value))
export const booleanArg = (value: TValue) => toBoolean(scalar(value))

/** An optional number argument: absent or left empty means the default. */
export function optionalNumber(
  args: TValue[],
  index: number,
  fallback: number,
): number | IFormulaError {
  const value = args[index]
  return value === undefined || value === null ? fallback : numberArg(value)
}

function typeRank(value: string | number | boolean): number {
  return typeof value === 'number' ? 0 : typeof value === 'string' ? 1 : 2
}

/**
 * Orders two non-error values as a spreadsheet does: numbers before text
 * before booleans, text compared without regard to case. A blank takes the
 * empty value of the other side's type.
 */
export function compareValues(
  a: string | number | boolean | null,
  b: string | number | boolean | null,
): number {
  if (a === null && b === null) return 0
  const blankLike = (other: string | number | boolean) =>
    typeof other === 'number' ? 0 : typeof other === 'string' ? '' : false
  const left = a === null ? blankLike(b as string | number | boolean) : a
  const right = b === null ? blankLike(left) : b
  const rank = typeRank(left) - typeRank(right)
  if (rank !== 0) return Math.sign(rank)
  if (typeof left === 'string') {
    const x = left.toLowerCase()
    const y = (right as string).toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  }
  return Math.sign(Number(left) - Number(right))
}

/**
 * Collects the numbers of aggregate arguments the way Excel does. Values
 * read from ranges and references count only when they are numbers, so text
 * and booleans there are skipped. Values written directly as arguments are
 * converted, so TRUE counts as 1 and '3' as 3. Errors anywhere win.
 */
export function collectNumbers(args: TValue[]): number[] | IFormulaError {
  const numbers: number[] = []
  for (const arg of args) {
    if (isMatrix(arg)) {
      let failure: IFormulaError | null = null
      eachCell(arg, (value) => {
        if (typeof value === 'number') numbers.push(value)
        else if (isFormulaError(value)) {
          failure = value
          return true
        }
      })
      if (failure) return failure
    } else if (arg !== null) {
      const n = toNumber(arg)
      if (isFormulaError(n)) return n
      numbers.push(n)
    }
  }
  return numbers
}

/** A non-finite number becomes #NUM!, since a cell cannot show Infinity or NaN. */
export function finite(value: TValue): TValue {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return formulaError('#NUM!', 'The result is not a finite number')
  }
  return value
}
