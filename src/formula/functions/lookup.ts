import { wildcardPattern } from '../criteria'
import type { IMatrix, TAstNode, TScalar, TValue } from '../types'
import {
  asMatrix,
  booleanArg,
  compareValues,
  formulaError,
  isFormulaError,
  isMatrix,
  numberArg,
  optionalNumber,
  scalar,
} from '../values'
import { firstError, type IFunctionDefinition } from './define'

const notFound = () => formulaError('#N/A', 'The value was not found')

/** Reads a one-dimensional range as a list. Anything wider is null. */
function vector(
  matrix: IMatrix,
): { length: number; at: (i: number) => TScalar } | null {
  if (matrix.cols === 1)
    return { length: matrix.rows, at: (i) => matrix.get(i, 0) }
  if (matrix.rows === 1)
    return { length: matrix.cols, at: (i) => matrix.get(0, i) }
  return null
}

/** Equality as lookups use it: same type, text without case, '*' and '?' when asked. */
function equalsFor(
  key: TScalar,
  wildcards: boolean,
): (value: TScalar) => boolean {
  if (typeof key === 'string' && wildcards && /[*?~]/.test(key)) {
    const pattern = wildcardPattern(key)
    return (value) => typeof value === 'string' && pattern.test(value)
  }
  return (value) =>
    value !== null &&
    !isFormulaError(value) &&
    typeof value === typeof key &&
    compareValues(value, key as string | number | boolean) === 0
}

/**
 * Finds a key in a list. Mode 0 is an exact match. Mode 1 is the last value
 * not above the key in a list sorted ascending, and mode -1 the last value
 * not below it in a list sorted descending, as MATCH and the approximate
 * VLOOKUP read them. Only values of the key's own type are considered.
 */
function find(
  list: { length: number; at: (i: number) => TScalar },
  key: TScalar,
  mode: 0 | 1 | -1,
  wildcards: boolean,
): number {
  if (mode === 0) {
    const equals = equalsFor(key, wildcards)
    for (let i = 0; i < list.length; i++) if (equals(list.at(i))) return i
    return -1
  }
  let found = -1
  for (let i = 0; i < list.length; i++) {
    const value = list.at(i)
    if (value === null || isFormulaError(value) || typeof value !== typeof key)
      continue
    const order = compareValues(value, key as string | number | boolean)
    if (order === 0) return i
    if ((mode === 1 && order < 0) || (mode === -1 && order > 0)) found = i
    else break
  }
  return found
}

function tableLookup(args: TValue[], vertical: boolean): TValue {
  const key = scalar(args[0])
  const table = asMatrix(args[1])
  const index = numberArg(args[2])
  const approximate =
    args[3] === undefined || args[3] === null ? true : booleanArg(args[3])
  const error = firstError(key, index, approximate)
  if (error) return error
  const n = Math.trunc(index as number)
  const size = vertical ? table.cols : table.rows
  if (n < 1) return formulaError('#VALUE!', 'The index must be at least 1')
  if (n > size) return formulaError('#REF!', 'The index is outside the table')
  const keys = vertical
    ? { length: table.rows, at: (i: number) => table.get(i, 0) }
    : { length: table.cols, at: (i: number) => table.get(0, i) }
  const hit = find(keys, key, approximate ? 1 : 0, true)
  if (hit < 0) return notFound()
  return vertical ? table.get(hit, n - 1) : table.get(n - 1, hit)
}

/** A slice of a matrix that keeps its place on the sheet, for ROW and COLUMN. */
function slice(
  m: IMatrix,
  r: number,
  c: number,
  rows: number,
  cols: number,
): IMatrix {
  return {
    kind: 'matrix',
    rows,
    cols,
    get: (row, col) => m.get(r + row, c + col),
    origin: m.origin
      ? { row: m.origin.row + r, col: m.origin.col + c }
      : undefined,
  }
}

function position(
  value: TValue | undefined,
  ctx: { at?: { row: number; col: number } },
  axis: 'row' | 'col',
) {
  if (value === undefined || value === null) {
    return ctx.at
      ? ctx.at[axis] + 1
      : formulaError('#VALUE!', 'There is no current cell')
  }
  if (isMatrix(value) && value.origin) return value.origin[axis] + 1
  return formulaError('#VALUE!', 'A reference is needed')
}

export const LOOKUP_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'VLOOKUP',
    category: 'lookup',
    syntax: 'VLOOKUP(key, table, column, [approximate])',
    description:
      'Finds a key in the first column of a table and returns the value in another column of that row.',
    minArgs: 3,
    maxArgs: 4,
    call: (args) => tableLookup(args, true),
  },
  {
    name: 'HLOOKUP',
    category: 'lookup',
    syntax: 'HLOOKUP(key, table, row, [approximate])',
    description:
      'Finds a key in the first row of a table and returns the value in another row of that column.',
    minArgs: 3,
    maxArgs: 4,
    call: (args) => tableLookup(args, false),
  },
  {
    name: 'INDEX',
    category: 'lookup',
    syntax: 'INDEX(range, row, [column])',
    description:
      'Returns the value at a row and column of a range, counting from 1.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const m = asMatrix(args[0])
      let row = numberArg(args[1])
      let col = optionalNumber(args, 2, 0)
      const error = firstError(row, col)
      if (error) return error
      // A single row read with one index is indexed along the row.
      if (m.rows === 1 && (args[2] === undefined || args[2] === null)) {
        col = row
        row = 1
      }
      const r = Math.trunc(row as number)
      const c = Math.trunc(col as number)
      if (r < 0 || c < 0 || r > m.rows || c > m.cols) {
        return formulaError('#REF!', 'The position is outside the range')
      }
      if (r === 0 && c === 0) return m
      if (r === 0) return slice(m, 0, c - 1, m.rows, 1)
      if (c === 0)
        return m.cols === 1
          ? slice(m, r - 1, 0, 1, 1)
          : slice(m, r - 1, 0, 1, m.cols)
      return slice(m, r - 1, c - 1, 1, 1)
    },
  },
  {
    name: 'MATCH',
    category: 'lookup',
    syntax: 'MATCH(key, range, [match_type])',
    description:
      'Returns the position of a key in a row or column: 1 for sorted ascending, 0 for exact, -1 for sorted descending.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const key = scalar(args[0])
      const type = optionalNumber(args, 2, 1)
      const error = firstError(key, type)
      if (error) return error
      const list = vector(asMatrix(args[1]))
      if (!list)
        return formulaError('#N/A', 'The range must be one row or one column')
      const mode = Math.sign(type as number) as 0 | 1 | -1
      const hit = find(list, key, mode, true)
      return hit < 0 ? notFound() : hit + 1
    },
  },
  {
    name: 'XLOOKUP',
    category: 'lookup',
    syntax:
      'XLOOKUP(key, lookup_range, return_range, [if_not_found], [match_mode], [search_mode])',
    description:
      'Finds a key in a range and returns the matching item of another range, with a fallback when nothing matches.',
    minArgs: 3,
    maxArgs: 6,
    lazy: (args, _ctx, run) => {
      const key = scalar(run(args[0]))
      const lookup = asMatrix(run(args[1]))
      const results = asMatrix(run(args[2]))
      const matchMode = args[4] ? numberArg(run(args[4])) : 0
      const searchMode = args[5] ? numberArg(run(args[5])) : 1
      const error = firstError(key, matchMode, searchMode)
      if (error) return error
      const list = vector(lookup)
      if (!list)
        return formulaError(
          '#VALUE!',
          'The lookup range must be one row or one column',
        )
      const vertical = lookup.cols === 1
      if (
        vertical ? results.rows !== list.length : results.cols !== list.length
      ) {
        return formulaError('#VALUE!', 'The ranges differ in size')
      }

      const mode = matchMode as number
      const order: number[] = []
      for (let i = 0; i < list.length; i++) order.push(i)
      if ((searchMode as number) < 0) order.reverse()

      // Without an exact match, mode -1 takes the largest value below the
      // key and mode 1 the smallest value above it.
      const equals = equalsFor(key, mode === 2)
      let hit = -1
      let nearest = -1
      for (const i of order) {
        const value = list.at(i)
        if (equals(value)) {
          hit = i
          break
        }
        if (mode !== -1 && mode !== 1) continue
        if (
          value === null ||
          isFormulaError(value) ||
          typeof value !== typeof key
        )
          continue
        const side = compareValues(value, key as string | number | boolean)
        if (side !== mode) continue
        const current =
          nearest < 0 ? null : (list.at(nearest) as string | number | boolean)
        if (current === null || compareValues(value, current) === -mode)
          nearest = i
      }
      if (hit < 0) hit = nearest
      if (hit < 0) {
        return args[3] && args[3].type !== 'missing' ? run(args[3]) : notFound()
      }
      return vertical
        ? slice(results, hit, 0, 1, results.cols)
        : slice(results, 0, hit, results.rows, 1)
    },
  },
  {
    name: 'CHOOSE',
    category: 'lookup',
    syntax: 'CHOOSE(index, value1, [value2, ...])',
    description:
      'Returns the value at a position in a list of values, counting from 1.',
    minArgs: 2,
    maxArgs: Infinity,
    lazy: (args: TAstNode[], _ctx, run) => {
      const index = numberArg(run(args[0]))
      if (isFormulaError(index)) return index
      const n = Math.trunc(index)
      if (n < 1 || n >= args.length) {
        return formulaError('#VALUE!', 'The index is outside the list')
      }
      return run(args[n])
    },
  },
  {
    name: 'ROWS',
    category: 'lookup',
    syntax: 'ROWS(range)',
    description: 'Returns the number of rows in a range.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => asMatrix(args[0]).rows,
  },
  {
    name: 'COLUMNS',
    category: 'lookup',
    syntax: 'COLUMNS(range)',
    description: 'Returns the number of columns in a range.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => asMatrix(args[0]).cols,
  },
  {
    name: 'ROW',
    category: 'lookup',
    syntax: 'ROW([reference])',
    description:
      'Returns the row number of a reference, or of the current cell.',
    minArgs: 0,
    maxArgs: 1,
    call: (args, ctx) => position(args[0], ctx, 'row'),
  },
  {
    name: 'COLUMN',
    category: 'lookup',
    syntax: 'COLUMN([reference])',
    description:
      'Returns the column number of a reference, or of the current cell.',
    minArgs: 0,
    maxArgs: 1,
    call: (args, ctx) => position(args[0], ctx, 'col'),
  },
]
