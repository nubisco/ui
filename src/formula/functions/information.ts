import type { TScalar, TValue } from '../types'
import { formulaError, isFormulaError, isMatrix, scalar } from '../values'
import type { IFunctionDefinition } from './define'

/** Wraps a test of a single value. A range larger than one cell is #VALUE!. */
const test =
  (fn: (value: TScalar) => boolean) =>
  (args: TValue[]): TValue => {
    const arg = args[0]
    if (isMatrix(arg) && arg.rows * arg.cols !== 1) {
      return formulaError('#VALUE!', 'A range cannot be used as a single value')
    }
    return fn(scalar(arg))
  }

export const INFORMATION_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'ISBLANK',
    category: 'information',
    syntax: 'ISBLANK(value)',
    description: 'Returns TRUE when a cell is empty.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => value === null),
  },
  {
    name: 'ISNUMBER',
    category: 'information',
    syntax: 'ISNUMBER(value)',
    description: 'Returns TRUE when a value is a number.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => typeof value === 'number'),
  },
  {
    name: 'ISTEXT',
    category: 'information',
    syntax: 'ISTEXT(value)',
    description: 'Returns TRUE when a value is text.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => typeof value === 'string'),
  },
  {
    name: 'ISLOGICAL',
    category: 'information',
    syntax: 'ISLOGICAL(value)',
    description: 'Returns TRUE when a value is TRUE or FALSE.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => typeof value === 'boolean'),
  },
  {
    name: 'ISERROR',
    category: 'information',
    syntax: 'ISERROR(value)',
    description: 'Returns TRUE when a value is any error.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => isFormulaError(value)),
  },
  {
    name: 'ISNA',
    category: 'information',
    syntax: 'ISNA(value)',
    description: 'Returns TRUE when a value is the #N/A error.',
    minArgs: 1,
    maxArgs: 1,
    call: test((value) => isFormulaError(value) && value.error === '#N/A'),
  },
  {
    name: 'NA',
    category: 'information',
    syntax: 'NA()',
    description: 'Returns the #N/A error, for a value that is not available.',
    minArgs: 0,
    maxArgs: 0,
    call: () => formulaError('#N/A'),
  },
]
