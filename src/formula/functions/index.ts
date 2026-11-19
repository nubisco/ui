import type { IFormulaFunction } from '../types'
import { DATE_FUNCTIONS } from './date'
import type { IFunctionDefinition } from './define'
import { INFORMATION_FUNCTIONS } from './information'
import { LOGICAL_FUNCTIONS } from './logical'
import { LOOKUP_FUNCTIONS } from './lookup'
import { MATH_FUNCTIONS } from './math'
import { STATISTICAL_FUNCTIONS } from './statistical'
import { TEXT_FUNCTIONS } from './text'

const DEFINITIONS: IFunctionDefinition[] = [
  ...MATH_FUNCTIONS,
  ...STATISTICAL_FUNCTIONS,
  ...LOGICAL_FUNCTIONS,
  ...TEXT_FUNCTIONS,
  ...LOOKUP_FUNCTIONS,
  ...INFORMATION_FUNCTIONS,
  ...DATE_FUNCTIONS,
].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

/** The implementations, by upper-case name. */
export const FUNCTIONS: ReadonlyMap<string, IFunctionDefinition> = new Map(
  DEFINITIONS.map((definition) => [definition.name, definition]),
)

/** Every supported function's metadata, sorted by name, for autocomplete and reference pages. */
export const FORMULA_FUNCTIONS: readonly IFormulaFunction[] = Object.freeze(
  DEFINITIONS.map(({ name, category, syntax, description, minArgs, maxArgs }) =>
    Object.freeze({ name, category, syntax, description, minArgs, maxArgs }),
  ),
)

/** The functions whose names start with a prefix, ignoring case, sorted by name. */
export function findFunctions(prefix: string): IFormulaFunction[] {
  const upper = prefix.trim().toUpperCase()
  return FORMULA_FUNCTIONS.filter((fn) => fn.name.startsWith(upper))
}
