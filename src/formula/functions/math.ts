import { criterionTest } from '../criteria'
import type { IFormulaError, IMatrix, TScalar, TValue } from '../types'
import {
  asMatrix,
  collectNumbers,
  formulaError,
  isFormulaError,
  numberArg,
  optionalNumber,
} from '../values'
import { firstError, numeric, type IFunctionDefinition } from './define'

// Binary floating point leaves 1.005 * 100 at 100.49999999999999. Rounding
// to 15 significant digits first gives the answer people expect, as Excel does.
const clean = (n: number) => Number(n.toPrecision(15))

function roundWith(
  mode: (n: number) => number,
  value: number,
  digits: number,
): number {
  // A negative digit count rounds to tens, hundreds and so on. Dividing and
  // multiplying by a whole power of ten keeps the result exact.
  const places = Math.trunc(digits)
  const factor = Math.pow(10, Math.abs(places))
  const sign = Math.sign(value)
  if (places >= 0)
    return (sign * mode(clean(Math.abs(value) * factor))) / factor
  return sign * mode(clean(Math.abs(value) / factor)) * factor
}

const roundHalfUp = (n: number) => Math.floor(n + 0.5)

/** The criteria pairs of SUMIFS, AVERAGEIFS and COUNTIFS, as a per-cell test. */
export function criteriaPairs(
  args: TValue[],
  shape?: { rows: number; cols: number },
): ((r: number, c: number) => boolean) | IFormulaError {
  const tests: { range: IMatrix; test: (value: TScalar) => boolean }[] = []
  if (args.length % 2 !== 0) {
    return formulaError('#N/A', 'Each criteria range needs a criterion')
  }
  let rows = shape?.rows
  let cols = shape?.cols
  for (let i = 0; i < args.length; i += 2) {
    const range = asMatrix(args[i])
    const criterion = asMatrix(args[i + 1])
    if (rows === undefined || cols === undefined) {
      rows = range.rows
      cols = range.cols
    } else if (range.rows !== rows || range.cols !== cols) {
      return formulaError('#VALUE!', 'The ranges differ in size')
    }
    tests.push({ range, test: criterionTest(criterion.get(0, 0)) })
  }
  return (r, c) => tests.every(({ range, test }) => test(range.get(r, c)))
}

/** The numbers of a range where a test passes. Errors in matching cells win. */
export function matchingNumbers(
  values: TValue,
  passes: (r: number, c: number) => boolean,
  rows: number,
  cols: number,
): number[] | IFormulaError {
  const matrix = asMatrix(values)
  const numbers: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!passes(r, c)) continue
      const value = r < matrix.rows && c < matrix.cols ? matrix.get(r, c) : null
      if (isFormulaError(value)) return value
      if (typeof value === 'number') numbers.push(value)
    }
  }
  return numbers
}

const sum = (numbers: number[]) => numbers.reduce((total, n) => total + n, 0)

export function sumIf(args: TValue[]): number[] | IFormulaError {
  const range = asMatrix(args[0])
  const test = criterionTest(asMatrix(args[1]).get(0, 0))
  const target = args[2] === undefined || args[2] === null ? args[0] : args[2]
  return matchingNumbers(
    target,
    (r, c) => test(range.get(r, c)),
    range.rows,
    range.cols,
  )
}

export function sumIfs(args: TValue[]): number[] | IFormulaError {
  const target = asMatrix(args[0])
  const passes = criteriaPairs(args.slice(1), target)
  if (isFormulaError(passes)) return passes
  return matchingNumbers(target, passes, target.rows, target.cols)
}

function stepTo(
  args: TValue[],
  mode: (n: number) => number,
  name: string,
): TValue {
  const value = numberArg(args[0])
  const step = optionalNumber(args, 1, 1)
  const error = firstError(value, step)
  if (error) return error
  const n = value as number
  const s = step as number
  if (s === 0)
    return name === 'FLOOR' ? formulaError('#DIV/0!', 'Division by zero') : 0
  if (n > 0 && s < 0) {
    return formulaError(
      '#NUM!',
      'A positive number needs a positive significance',
    )
  }
  return mode(clean(n / s)) * s
}

export const MATH_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'SUM',
    category: 'math',
    syntax: 'SUM(value1, [value2, ...])',
    description: 'Adds numbers and the numbers in ranges.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      const numbers = collectNumbers(args)
      return isFormulaError(numbers) ? numbers : sum(numbers)
    },
  },
  {
    name: 'SUMIF',
    category: 'math',
    syntax: 'SUMIF(range, criterion, [sum_range])',
    description: 'Adds the cells that meet a criterion.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const numbers = sumIf(args)
      return isFormulaError(numbers) ? numbers : sum(numbers)
    },
  },
  {
    name: 'SUMIFS',
    category: 'math',
    syntax:
      'SUMIFS(sum_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])',
    description: 'Adds the cells that meet every criterion.',
    minArgs: 3,
    maxArgs: Infinity,
    call: (args) => {
      const numbers = sumIfs(args)
      return isFormulaError(numbers) ? numbers : sum(numbers)
    },
  },
  {
    name: 'SUMPRODUCT',
    category: 'math',
    syntax: 'SUMPRODUCT(array1, [array2, ...])',
    description:
      'Multiplies matching cells of ranges of the same size and adds the products.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      const arrays = args.map(asMatrix)
      const { rows, cols } = arrays[0]
      if (arrays.some((m) => m.rows !== rows || m.cols !== cols)) {
        return formulaError('#VALUE!', 'The ranges differ in size')
      }
      let total = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let product = 1
          for (const m of arrays) {
            const value = m.get(r, c)
            if (isFormulaError(value)) return value
            // Anything that is not a number counts as 0, as in Excel.
            product *= typeof value === 'number' ? value : 0
          }
          total += product
        }
      }
      return total
    },
  },
  {
    name: 'PRODUCT',
    category: 'math',
    syntax: 'PRODUCT(value1, [value2, ...])',
    description: 'Multiplies numbers and the numbers in ranges.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      const numbers = collectNumbers(args)
      if (isFormulaError(numbers)) return numbers
      return numbers.length === 0
        ? 0
        : numbers.reduce((total, n) => total * n, 1)
    },
  },
  {
    name: 'ROUND',
    category: 'math',
    syntax: 'ROUND(value, [digits])',
    description:
      'Rounds a number to a number of digits, halves away from zero.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const digits = optionalNumber(args, 1, 0)
      const value = numberArg(args[0])
      return (
        firstError(value, digits) ??
        roundWith(roundHalfUp, value as number, digits as number)
      )
    },
  },
  {
    name: 'ROUNDUP',
    category: 'math',
    syntax: 'ROUNDUP(value, [digits])',
    description: 'Rounds a number away from zero to a number of digits.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const digits = optionalNumber(args, 1, 0)
      const value = numberArg(args[0])
      return (
        firstError(value, digits) ??
        roundWith(Math.ceil, value as number, digits as number)
      )
    },
  },
  {
    name: 'ROUNDDOWN',
    category: 'math',
    syntax: 'ROUNDDOWN(value, [digits])',
    description: 'Rounds a number toward zero to a number of digits.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const digits = optionalNumber(args, 1, 0)
      const value = numberArg(args[0])
      return (
        firstError(value, digits) ??
        roundWith(Math.floor, value as number, digits as number)
      )
    },
  },
  {
    name: 'INT',
    category: 'math',
    syntax: 'INT(value)',
    description: 'Rounds a number down to the nearest integer.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) => Math.floor(n)),
  },
  {
    name: 'TRUNC',
    category: 'math',
    syntax: 'TRUNC(value, [digits])',
    description: 'Cuts a number to a number of digits without rounding.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const digits = optionalNumber(args, 1, 0)
      const value = numberArg(args[0])
      return (
        firstError(value, digits) ??
        roundWith(Math.floor, value as number, digits as number)
      )
    },
  },
  {
    name: 'ABS',
    category: 'math',
    syntax: 'ABS(value)',
    description: 'Returns a number without its sign.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) => Math.abs(n)),
  },
  {
    name: 'MOD',
    category: 'math',
    syntax: 'MOD(dividend, divisor)',
    description:
      'Returns the remainder of a division, with the sign of the divisor.',
    minArgs: 2,
    maxArgs: 2,
    call: numeric((n, d) =>
      d === 0
        ? formulaError('#DIV/0!', 'Division by zero')
        : n - d * Math.floor(n / d),
    ),
  },
  {
    name: 'POWER',
    category: 'math',
    syntax: 'POWER(base, exponent)',
    description: 'Raises a number to a power.',
    minArgs: 2,
    maxArgs: 2,
    call: numeric((base, exponent) => {
      if (base === 0 && exponent === 0)
        return formulaError('#NUM!', 'Zero to the power of zero')
      if (base === 0 && exponent < 0)
        return formulaError('#DIV/0!', 'Division by zero')
      return Math.pow(base, exponent)
    }),
  },
  {
    name: 'SQRT',
    category: 'math',
    syntax: 'SQRT(value)',
    description: 'Returns the square root of a number.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) =>
      n < 0
        ? formulaError('#NUM!', 'Square root of a negative number')
        : Math.sqrt(n),
    ),
  },
  {
    name: 'EXP',
    category: 'math',
    syntax: 'EXP(value)',
    description: 'Returns e raised to a power.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) => Math.exp(n)),
  },
  {
    name: 'LN',
    category: 'math',
    syntax: 'LN(value)',
    description: 'Returns the natural logarithm of a number.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) =>
      n <= 0
        ? formulaError('#NUM!', 'Logarithm of a number that is not positive')
        : Math.log(n),
    ),
  },
  {
    name: 'LOG',
    category: 'math',
    syntax: 'LOG(value, [base])',
    description:
      'Returns the logarithm of a number in a base, 10 when left out.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => {
      const base = optionalNumber(args, 1, 10)
      const value = numberArg(args[0])
      const error = firstError(value, base)
      if (error) return error
      const n = value as number
      const b = base as number
      if (n <= 0 || b <= 0) {
        return formulaError(
          '#NUM!',
          'Logarithm of a number that is not positive',
        )
      }
      if (b === 1) return formulaError('#DIV/0!', 'Division by zero')
      return Math.log(n) / Math.log(b)
    },
  },
  {
    name: 'LOG10',
    category: 'math',
    syntax: 'LOG10(value)',
    description: 'Returns the base 10 logarithm of a number.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) =>
      n <= 0
        ? formulaError('#NUM!', 'Logarithm of a number that is not positive')
        : Math.log10(n),
    ),
  },
  {
    name: 'PI',
    category: 'math',
    syntax: 'PI()',
    description: 'Returns the number pi.',
    minArgs: 0,
    maxArgs: 0,
    call: () => Math.PI,
  },
  {
    name: 'SIGN',
    category: 'math',
    syntax: 'SIGN(value)',
    description:
      'Returns 1 for a positive number, -1 for a negative one and 0 for zero.',
    minArgs: 1,
    maxArgs: 1,
    call: numeric((n) => Math.sign(n)),
  },
  {
    name: 'CEILING',
    category: 'math',
    syntax: 'CEILING(value, [significance])',
    description:
      'Rounds a number up to the nearest multiple of a significance, 1 when left out.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => stepTo(args, Math.ceil, 'CEILING'),
  },
  {
    name: 'FLOOR',
    category: 'math',
    syntax: 'FLOOR(value, [significance])',
    description:
      'Rounds a number down to the nearest multiple of a significance, 1 when left out.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => stepTo(args, Math.floor, 'FLOOR'),
  },
]
