import type {
  IEvalContext,
  IFormulaError,
  IFormulaFunction,
  TAstNode,
  TValue,
} from '../types'
import { isFormulaError, numberArg } from '../values'

/**
 * A function's metadata and its implementation, kept together so the two
 * cannot drift. Most functions take their arguments already evaluated
 * (`call`). The few that skip arguments, such as IF, take the unevaluated
 * trees and evaluate only what they need (`lazy`).
 */
export interface IFunctionDefinition extends IFormulaFunction {
  call?: (args: TValue[], ctx: IEvalContext) => TValue
  lazy?: (
    args: TAstNode[],
    ctx: IEvalContext,
    run: (node: TAstNode) => TValue,
  ) => TValue
}

/** Wraps a function of plain numbers: each argument is read as a number, and the first error wins. */
export function numeric(
  fn: (...numbers: number[]) => TValue,
): (args: TValue[]) => TValue {
  return (args) => {
    const numbers: number[] = []
    for (const arg of args) {
      const n = numberArg(arg)
      if (isFormulaError(n)) return n
      numbers.push(n)
    }
    return fn(...numbers)
  }
}

/** The first error in a list of checked values, if there is one. */
export function firstError(...values: unknown[]): IFormulaError | null {
  for (const value of values) if (isFormulaError(value)) return value
  return null
}
