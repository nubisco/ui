import { FUNCTIONS } from './functions'
import type { IEvalContext, IMatrix, TAstNode, TScalar, TValue } from './types'
import {
  arrayMatrix,
  compareValues,
  finite,
  formulaError,
  isFormulaError,
  isMatrix,
  rangeMatrix,
  scalar,
  toNumber,
  toText,
} from './values'

function arithmetic(op: string, x: TScalar, y: TScalar): TScalar {
  if (isFormulaError(x)) return x
  if (isFormulaError(y)) return y
  if (op === '&') {
    const a = toText(x)
    if (isFormulaError(a)) return a
    const b = toText(y)
    if (isFormulaError(b)) return b
    return a + b
  }
  if (
    op === '=' ||
    op === '<>' ||
    op === '<' ||
    op === '>' ||
    op === '<=' ||
    op === '>='
  ) {
    const order = compareValues(x, y)
    switch (op) {
      case '=':
        return order === 0
      case '<>':
        return order !== 0
      case '<':
        return order < 0
      case '>':
        return order > 0
      case '<=':
        return order <= 0
      default:
        return order >= 0
    }
  }
  const a = toNumber(x)
  if (isFormulaError(a)) return a
  const b = toNumber(y)
  if (isFormulaError(b)) return b
  let result: number
  switch (op) {
    case '+':
      result = a + b
      break
    case '-':
      result = a - b
      break
    case '*':
      result = a * b
      break
    case '/':
      if (b === 0) return formulaError('#DIV/0!', 'Division by zero')
      result = a / b
      break
    default:
      if (a === 0 && b === 0)
        return formulaError('#NUM!', 'Zero to the power of zero')
      if (a === 0 && b < 0) return formulaError('#DIV/0!', 'Division by zero')
      result = Math.pow(a, b)
  }
  return finite(result) as TScalar
}

const single = (value: TValue) =>
  !isMatrix(value) || (value.rows === 1 && value.cols === 1)

/**
 * Applies an operator cell by cell when either side is a range, so
 * SUM(A1:A3*B1:B3) and SUMPRODUCT((A1:A3>2)*1) work. A side with one row or
 * one column stretches over the other, and cells outside a smaller side are
 * #N/A, as in Excel. A range left over at the top level of a cell is #VALUE!.
 */
function elementwise(
  left: TValue,
  right: TValue,
  apply: (x: TScalar, y: TScalar) => TScalar,
): TValue {
  if (single(left) && single(right)) return apply(scalar(left), scalar(right))
  const a: IMatrix = isMatrix(left) ? left : arrayMatrix(1, 1, [left])
  const b: IMatrix = isMatrix(right) ? right : arrayMatrix(1, 1, [right])
  const rows = Math.max(a.rows, b.rows)
  const cols = Math.max(a.cols, b.cols)
  const pick = (m: IMatrix, r: number, c: number): TScalar => {
    const row = m.rows === 1 ? 0 : r
    const col = m.cols === 1 ? 0 : c
    if (row >= m.rows || col >= m.cols)
      return formulaError('#N/A', 'The ranges differ in size')
    return m.get(row, col)
  }
  const data: TScalar[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++)
      data.push(apply(pick(a, r, c), pick(b, r, c)))
  }
  return arrayMatrix(rows, cols, data)
}

function describeCount(min: number, max: number): string {
  const plural = (n: number) => (n === 1 ? 'argument' : 'arguments')
  if (min === max) return `${min} ${plural(min)}`
  if (max === Infinity) return `at least ${min} ${plural(min)}`
  return `between ${min} and ${max} arguments`
}

/** Evaluates a parsed formula. The result may still be a range, see finalValue. */
export function evaluateNode(node: TAstNode, ctx: IEvalContext): TValue {
  switch (node.type) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.value
    case 'error':
      return node.error
    case 'missing':
      return null
    case 'name':
      return formulaError('#NAME?', `Unknown name ${node.name}`)
    case 'ref':
      return rangeMatrix(ctx, {
        r1: node.row,
        c1: node.col,
        r2: node.row,
        c2: node.col,
      })
    case 'range':
      return rangeMatrix(ctx, node.range)
    case 'array':
      return arrayMatrix(node.rows, node.cols, node.values)
    case 'unary': {
      const operand = evaluateNode(node.operand, ctx)
      return elementwise(operand, 0, (x) =>
        node.op === '-' ? arithmetic('-', 0, x) : arithmetic('+', 0, x),
      )
    }
    case 'percent':
      return elementwise(evaluateNode(node.operand, ctx), 100, (x, y) =>
        arithmetic('/', x, y),
      )
    case 'binary': {
      const left = evaluateNode(node.left, ctx)
      const right = evaluateNode(node.right, ctx)
      return elementwise(left, right, (x, y) => arithmetic(node.op, x, y))
    }
    case 'call': {
      const definition = FUNCTIONS.get(node.name)
      if (!definition)
        return formulaError('#NAME?', `Unknown function ${node.name}`)
      const count = node.args.length
      if (count < definition.minArgs || count > definition.maxArgs) {
        return formulaError(
          '#N/A',
          `${node.name} expects ${describeCount(definition.minArgs, definition.maxArgs)}`,
        )
      }
      const run = (arg: TAstNode) => evaluateNode(arg, ctx)
      const result = definition.lazy
        ? definition.lazy(node.args, ctx, run)
        : definition.call
          ? definition.call(node.args.map(run), ctx)
          : formulaError('#NAME?', `Unknown function ${node.name}`)
      return finite(result)
    }
  }
}

/**
 * What a cell shows: a single value, never a range. A blank becomes 0, as
 * =A1 of an empty cell does in a spreadsheet.
 */
export function finalValue(value: TValue): TScalar {
  const result = scalar(value)
  if (result === null) return 0
  return finite(result) as TScalar
}

/** Evaluates a tree to what a cell shows, and turns a stack overflow into an error. */
export function evaluateFormula(node: TAstNode, ctx: IEvalContext): TScalar {
  try {
    return finalValue(evaluateNode(node, ctx))
  } catch (error) {
    if (error instanceof RangeError) {
      return formulaError('#ERROR!', 'The formula is nested too deeply')
    }
    throw error
  }
}
