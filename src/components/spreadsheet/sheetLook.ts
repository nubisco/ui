// How a sheet-mode cell looks: its number format, the conditional formats
// that pass for it, and the ranges both are written against. Kept apart from
// the component so the rules can be read, and tested, on their own.
import type {
  ISpreadsheetCellStyle,
  TSpreadsheetNumberFormat,
  TSpreadsheetRule,
} from '../Spreadsheet.d'
import { formatRef, parseRangeText, parseRef } from '@/formula/refs'

/**
 * A range as 0-based, inclusive sheet positions. A whole column runs to
 * `Infinity` rows, and a whole row to `Infinity` columns.
 */
export interface ISheetRange {
  r1: number
  c1: number
  r2: number
  c2: number
}

/**
 * Reads 'B2', 'B2:D9', 'C:C' or '3:5', case-insensitively. Anything else is
 * null, so a typo in a conditional format leaves the sheet alone instead of
 * styling the wrong cells.
 */
export function parseRange(text: string): ISheetRange | null {
  const trimmed = text.trim()
  if (trimmed.includes(':')) return parseRangeText(trimmed)
  const ref = parseRef(trimmed)
  return ref ? { r1: ref.row, c1: ref.col, r2: ref.row, c2: ref.col } : null
}

/** 'A1:C3', or 'A1' for a single cell. */
export function rangeText(range: ISheetRange): string {
  const from = formatRef(range.r1, range.c1)
  const to = formatRef(range.r2, range.c2)
  return from === to ? from : `${from}:${to}`
}

export function rangesOverlap(a: ISheetRange, b: ISheetRange): boolean {
  return a.r1 <= b.r2 && b.r1 <= a.r2 && a.c1 <= b.c2 && b.c1 <= a.c2
}

/** A number in a cell's format, in the sheet's locale. */
export function formatNumber(
  value: number,
  format: TSpreadsheetNumberFormat | undefined,
  locale: string,
): string {
  const fixed = (decimals: number | undefined, fallback: number) =>
    decimals === undefined
      ? { maximumFractionDigits: fallback }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  try {
    if (format?.type === 'percent')
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        ...fixed(format.decimals, 10),
      }).format(value)
    if (format?.type === 'currency')
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: format.currency,
        ...(format.decimals === undefined ? {} : fixed(format.decimals, 2)),
      }).format(value)
    if (format?.type === 'number')
      return new Intl.NumberFormat(locale, {
        useGrouping: format.grouping ?? true,
        ...fixed(format.decimals, 10),
      }).format(value)
  } catch {
    // An unknown currency code throws. The number is still worth showing.
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(
    value,
  )
}

/** A computed error, which a cell shows as its code. */
export interface ISheetError {
  error: string
  message: string
}

export function isSheetError(value: unknown): value is ISheetError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ISheetError).error === 'string'
  )
}

// Text compares without case, as a spreadsheet's comparisons do.
function compare(a: unknown, b: number | string): number | null {
  if (typeof b === 'number') {
    const n =
      typeof a === 'number'
        ? a
        : typeof a === 'string' && a.trim() !== ''
          ? Number(a)
          : NaN
    return Number.isFinite(n) ? n - b : null
  }
  if (a === null || a === undefined) return null
  return String(a).toLowerCase().localeCompare(b.toLowerCase())
}

/**
 * Whether a value passes a rule. `formulaResult` is the rule's formula
 * evaluated for the cell, and only a `formula` rule reads it: it passes when
 * the result is TRUE or a number other than 0.
 */
export function ruleMatches(
  rule: TSpreadsheetRule,
  value: unknown,
  formulaResult?: unknown,
): boolean {
  if (isSheetError(value)) return rule.when === 'error'
  const empty = value === null || value === undefined || value === ''
  switch (rule.when) {
    case 'error':
      return false
    case 'empty':
      return empty
    case 'notEmpty':
      return !empty
    case 'formula':
      return (
        formulaResult === true ||
        (typeof formulaResult === 'number' && formulaResult !== 0)
      )
    case 'between':
    case 'notBetween': {
      const n = typeof value === 'number' ? value : NaN
      if (!Number.isFinite(n)) return false
      const lo = Math.min(rule.min, rule.max)
      const hi = Math.max(rule.min, rule.max)
      const inside = n >= lo && n <= hi
      return rule.when === 'between' ? inside : !inside
    }
    case 'contains':
    case 'notContains':
    case 'startsWith':
    case 'endsWith': {
      if (empty) return rule.when === 'notContains'
      const text = String(value).toLowerCase()
      const needle = rule.text.toLowerCase()
      if (rule.when === 'contains') return text.includes(needle)
      if (rule.when === 'notContains') return !text.includes(needle)
      if (rule.when === 'startsWith') return text.startsWith(needle)
      return text.endsWith(needle)
    }
    default: {
      if (empty) return false
      const d = compare(value, rule.value)
      if (d === null) return rule.when === 'notEqual'
      switch (rule.when) {
        case 'greaterThan':
          return d > 0
        case 'lessThan':
          return d < 0
        case 'greaterOrEqual':
          return d >= 0
        case 'lessOrEqual':
          return d <= 0
        case 'equal':
          return d === 0
        case 'notEqual':
          return d !== 0
      }
    }
  }
  return false
}

/** Two styles merged, the second winning wherever it sets something. */
export function mergeStyle(
  base: ISpreadsheetCellStyle | undefined,
  over: ISpreadsheetCellStyle | undefined,
): ISpreadsheetCellStyle | undefined {
  if (!over) return base
  if (!base) return over
  return { ...base, ...over }
}

/** A style without the keys set to undefined or false, or undefined if empty. */
export function cleanStyle(
  style: ISpreadsheetCellStyle,
): ISpreadsheetCellStyle | undefined {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(style)) {
    if (v !== undefined && v !== false) out[k] = v
  }
  return Object.keys(out).length ? (out as ISpreadsheetCellStyle) : undefined
}
