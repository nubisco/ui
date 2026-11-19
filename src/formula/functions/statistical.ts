import { criterionTest } from '../criteria'
import type { TValue } from '../types'
import {
  asMatrix,
  collectNumbers,
  eachCell,
  formulaError,
  isFormulaError,
  isMatrix,
  numberArg,
  parseNumericText,
} from '../values'
import { firstError, type IFunctionDefinition } from './define'
import { criteriaPairs, sumIf, sumIfs } from './math'

const mean = (numbers: number[]) =>
  numbers.length === 0
    ? formulaError('#DIV/0!', 'There are no numbers to average')
    : numbers.reduce((total, n) => total + n, 0) / numbers.length

function variance(numbers: number[]) {
  if (numbers.length < 2) {
    return formulaError('#DIV/0!', 'At least two numbers are needed')
  }
  const average = numbers.reduce((total, n) => total + n, 0) / numbers.length
  const squares = numbers.reduce((total, n) => total + (n - average) ** 2, 0)
  return squares / (numbers.length - 1)
}

/** Wraps a function of the collected numbers of every argument. */
const ofNumbers =
  (fn: (numbers: number[]) => TValue) =>
  (args: TValue[]): TValue => {
    const numbers = collectNumbers(args)
    return isFormulaError(numbers) ? numbers : fn(numbers)
  }

function nth(args: TValue[], fromTop: boolean): TValue {
  const numbers = collectNumbers([asMatrix(args[0])])
  const k = numberArg(args[1])
  const error = firstError(numbers, k)
  if (error) return error
  const list = (numbers as number[])
    .slice()
    .sort((a, b) => (fromTop ? b - a : a - b))
  const index = Math.ceil(k as number) - 1
  if (index < 0 || index >= list.length) {
    return formulaError('#NUM!', 'The position is outside the list')
  }
  return list[index]
}

export const STATISTICAL_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'AVERAGE',
    category: 'statistical',
    syntax: 'AVERAGE(value1, [value2, ...])',
    description:
      'Returns the arithmetic mean of numbers and the numbers in ranges.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers(mean),
  },
  {
    name: 'AVERAGEIF',
    category: 'statistical',
    syntax: 'AVERAGEIF(range, criterion, [average_range])',
    description: 'Returns the mean of the cells that meet a criterion.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => {
      const numbers = sumIf(args)
      return isFormulaError(numbers) ? numbers : mean(numbers)
    },
  },
  {
    name: 'AVERAGEIFS',
    category: 'statistical',
    syntax:
      'AVERAGEIFS(average_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])',
    description: 'Returns the mean of the cells that meet every criterion.',
    minArgs: 3,
    maxArgs: Infinity,
    call: (args) => {
      const numbers = sumIfs(args)
      return isFormulaError(numbers) ? numbers : mean(numbers)
    },
  },
  {
    name: 'COUNT',
    category: 'statistical',
    syntax: 'COUNT(value1, [value2, ...])',
    description: 'Counts the numbers among the values and in ranges.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      let count = 0
      for (const arg of args) {
        if (isMatrix(arg)) {
          eachCell(arg, (value) => {
            if (typeof value === 'number') count++
          })
        } else if (
          typeof arg === 'number' ||
          typeof arg === 'boolean' ||
          (typeof arg === 'string' && parseNumericText(arg) !== null)
        ) {
          count++
        }
      }
      return count
    },
  },
  {
    name: 'COUNTA',
    category: 'statistical',
    syntax: 'COUNTA(value1, [value2, ...])',
    description:
      'Counts the values and the cells in ranges that are not empty.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      let count = 0
      for (const arg of args) {
        if (isMatrix(arg)) {
          eachCell(arg, (value) => {
            if (value !== null) count++
          })
        } else if (arg !== null) count++
      }
      return count
    },
  },
  {
    name: 'COUNTBLANK',
    category: 'statistical',
    syntax: 'COUNTBLANK(range)',
    description:
      'Counts the empty cells in a range, including cells with empty text.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      let count = 0
      eachCell(asMatrix(args[0]), (value) => {
        if (value === null || value === '') count++
      })
      return count
    },
  },
  {
    name: 'COUNTIF',
    category: 'statistical',
    syntax: 'COUNTIF(range, criterion)',
    description: 'Counts the cells in a range that meet a criterion.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const test = criterionTest(asMatrix(args[1]).get(0, 0))
      let count = 0
      eachCell(asMatrix(args[0]), (value) => {
        if (test(value)) count++
      })
      return count
    },
  },
  {
    name: 'COUNTIFS',
    category: 'statistical',
    syntax:
      'COUNTIFS(criteria_range1, criterion1, [criteria_range2, criterion2, ...])',
    description: 'Counts the positions where every criterion is met.',
    minArgs: 2,
    maxArgs: Infinity,
    call: (args) => {
      const first = asMatrix(args[0])
      const passes = criteriaPairs(args)
      if (isFormulaError(passes)) return passes
      let count = 0
      for (let r = 0; r < first.rows; r++) {
        for (let c = 0; c < first.cols; c++) if (passes(r, c)) count++
      }
      return count
    },
  },
  {
    name: 'MIN',
    category: 'statistical',
    syntax: 'MIN(value1, [value2, ...])',
    description: 'Returns the smallest number, or 0 when there are none.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers((numbers) =>
      numbers.length === 0 ? 0 : numbers.reduce((a, b) => Math.min(a, b)),
    ),
  },
  {
    name: 'MAX',
    category: 'statistical',
    syntax: 'MAX(value1, [value2, ...])',
    description: 'Returns the largest number, or 0 when there are none.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers((numbers) =>
      numbers.length === 0 ? 0 : numbers.reduce((a, b) => Math.max(a, b)),
    ),
  },
  {
    name: 'MEDIAN',
    category: 'statistical',
    syntax: 'MEDIAN(value1, [value2, ...])',
    description:
      'Returns the middle number, or the mean of the two middle numbers.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers((numbers) => {
      if (numbers.length === 0)
        return formulaError('#NUM!', 'There are no numbers')
      const sorted = numbers.slice().sort((a, b) => a - b)
      const middle = Math.floor(sorted.length / 2)
      return sorted.length % 2 === 1
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2
    }),
  },
  {
    name: 'LARGE',
    category: 'statistical',
    syntax: 'LARGE(range, k)',
    description: 'Returns the k-th largest number in a range.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => nth(args, true),
  },
  {
    name: 'SMALL',
    category: 'statistical',
    syntax: 'SMALL(range, k)',
    description: 'Returns the k-th smallest number in a range.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => nth(args, false),
  },
  {
    name: 'STDEV',
    category: 'statistical',
    syntax: 'STDEV(value1, [value2, ...])',
    description: 'Returns the standard deviation of a sample.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers((numbers) => {
      const v = variance(numbers)
      return isFormulaError(v) ? v : Math.sqrt(v)
    }),
  },
  {
    name: 'VAR',
    category: 'statistical',
    syntax: 'VAR(value1, [value2, ...])',
    description: 'Returns the variance of a sample.',
    minArgs: 1,
    maxArgs: Infinity,
    call: ofNumbers(variance),
  },
]
