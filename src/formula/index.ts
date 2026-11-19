/**
 * A spreadsheet formula engine with no dependencies, used by the sheet mode
 * of NbSpreadsheet and available on its own as `@nubisco/ui/formula`.
 */
export type {
  IFormulaError,
  IFormulaFunction,
  IFormulaRange,
  IFormulaReference,
  IFormulaSheet,
  IFormulaSyntax,
  IFormulaToken,
  TFormulaCategory,
  TFormulaCells,
  TFormulaCellValue,
  TFormulaErrorCode,
  TFormulaTokenType,
  TFormulaValue,
} from './types'
export { isFormula, isFormulaError } from './values'
export {
  CANONICAL_SYNTAX,
  syntaxForLocale,
  toCanonical,
  toLocalized,
} from './syntax'
export { tokenize } from './tokenizer'
export { columnLetters, formatRef, lettersToColumn, parseRef } from './refs'
export { referencesIn, shiftFormula } from './references'
export { FORMULA_FUNCTIONS, findFunctions } from './functions'
export { createFormulaSheet } from './sheet'
