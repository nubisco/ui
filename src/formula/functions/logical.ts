import type { IFormulaError, TScalar, TValue } from '../types'
import {
  booleanArg,
  compareValues,
  eachCell,
  formulaError,
  isFormulaError,
  isMatrix,
  scalar,
  toBoolean,
} from '../values'
import type { IFunctionDefinition } from './define'

/**
 * The booleans of AND, OR and XOR. Numbers and booleans in ranges count,
 * text and blanks there are skipped. Direct arguments are converted. With
 * nothing to look at, the result is #VALUE!, as in Excel.
 */
function collectBooleans(args: TValue[]): boolean[] | IFormulaError {
  const flags: boolean[] = []
  for (const arg of args) {
    if (isMatrix(arg)) {
      let failure: IFormulaError | null = null
      eachCell(arg, (value) => {
        if (isFormulaError(value)) {
          failure = value
          return true
        }
        if (typeof value === 'boolean' || typeof value === 'number') {
          flags.push(toBoolean(value) as boolean)
        }
      })
      if (failure) return failure
    } else if (arg !== null) {
      const flag = toBoolean(arg)
      if (isFormulaError(flag)) return flag
      flags.push(flag)
    }
  }
  if (flags.length === 0)
    return formulaError('#VALUE!', 'There are no logical values')
  return flags
}

const withBooleans =
  (fn: (flags: boolean[]) => boolean) =>
  (args: TValue[]): TValue => {
    const flags = collectBooleans(args)
    return isFormulaError(flags) ? flags : fn(flags)
  }

/** An error a value holds, looking through a single cell. */
function errorOf(value: TValue): IFormulaError | null {
  const single =
    isMatrix(value) && value.rows * value.cols === 1 ? value.get(0, 0) : value
  return isFormulaError(single) ? single : null
}

export const LOGICAL_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'IF',
    category: 'logical',
    syntax: 'IF(condition, [value_if_true], [value_if_false])',
    description:
      'Returns one value when a condition is true and another when it is false.',
    minArgs: 2,
    maxArgs: 3,
    lazy: (args, _ctx, run) => {
      const condition = booleanArg(run(args[0]))
      if (isFormulaError(condition)) return condition
      if (condition) return run(args[1])
      return args[2] === undefined ? false : run(args[2])
    },
  },
  {
    name: 'IFS',
    category: 'logical',
    syntax: 'IFS(condition1, value1, [condition2, value2, ...])',
    description:
      'Returns the value paired with the first condition that is true.',
    minArgs: 2,
    maxArgs: Infinity,
    lazy: (args, _ctx, run) => {
      if (args.length % 2 !== 0) {
        return formulaError(
          '#N/A',
          'IFS expects conditions and values in pairs',
        )
      }
      for (let i = 0; i < args.length; i += 2) {
        const condition = booleanArg(run(args[i]))
        if (isFormulaError(condition)) return condition
        if (condition) return run(args[i + 1])
      }
      return formulaError('#N/A', 'No condition was true')
    },
  },
  {
    name: 'IFERROR',
    category: 'logical',
    syntax: 'IFERROR(value, value_if_error)',
    description: 'Returns a value, or a fallback when the value is any error.',
    minArgs: 2,
    maxArgs: 2,
    lazy: (args, _ctx, run) => {
      const value = run(args[0])
      return errorOf(value) ? run(args[1]) : value
    },
  },
  {
    name: 'IFNA',
    category: 'logical',
    syntax: 'IFNA(value, value_if_na)',
    description: 'Returns a value, or a fallback when the value is #N/A.',
    minArgs: 2,
    maxArgs: 2,
    lazy: (args, _ctx, run) => {
      const value = run(args[0])
      return errorOf(value)?.error === '#N/A' ? run(args[1]) : value
    },
  },
  {
    name: 'AND',
    category: 'logical',
    syntax: 'AND(value1, [value2, ...])',
    description: 'Returns TRUE when every value is true.',
    minArgs: 1,
    maxArgs: Infinity,
    call: withBooleans((flags) => flags.every(Boolean)),
  },
  {
    name: 'OR',
    category: 'logical',
    syntax: 'OR(value1, [value2, ...])',
    description: 'Returns TRUE when at least one value is true.',
    minArgs: 1,
    maxArgs: Infinity,
    call: withBooleans((flags) => flags.some(Boolean)),
  },
  {
    name: 'XOR',
    category: 'logical',
    syntax: 'XOR(value1, [value2, ...])',
    description: 'Returns TRUE when an odd number of values are true.',
    minArgs: 1,
    maxArgs: Infinity,
    call: withBooleans((flags) => flags.filter(Boolean).length % 2 === 1),
  },
  {
    name: 'NOT',
    category: 'logical',
    syntax: 'NOT(value)',
    description: 'Returns the opposite of a logical value.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      const flag = booleanArg(args[0])
      return isFormulaError(flag) ? flag : !flag
    },
  },
  {
    name: 'SWITCH',
    category: 'logical',
    syntax:
      'SWITCH(expression, case1, value1, [case2, value2, ...], [default])',
    description:
      'Compares a value with a list of cases and returns the value of the first match.',
    minArgs: 3,
    maxArgs: Infinity,
    lazy: (args, _ctx, run) => {
      const subject: TScalar = scalar(run(args[0]))
      if (isFormulaError(subject)) return subject
      const pairs = Math.floor((args.length - 1) / 2)
      for (let i = 0; i < pairs; i++) {
        const candidate = scalar(run(args[1 + i * 2]))
        if (isFormulaError(candidate)) return candidate
        if (
          typeof candidate === typeof subject &&
          compareValues(subject, candidate) === 0
        ) {
          return run(args[2 + i * 2])
        }
      }
      const hasDefault = (args.length - 1) % 2 === 1
      return hasDefault
        ? run(args[args.length - 1])
        : formulaError('#N/A', 'No case matched')
    },
  },
  {
    name: 'TRUE',
    category: 'logical',
    syntax: 'TRUE()',
    description: 'Returns the logical value TRUE.',
    minArgs: 0,
    maxArgs: 0,
    call: () => true,
  },
  {
    name: 'FALSE',
    category: 'logical',
    syntax: 'FALSE()',
    description: 'Returns the logical value FALSE.',
    minArgs: 0,
    maxArgs: 0,
    call: () => false,
  },
]
