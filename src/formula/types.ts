/** The error codes a formula can produce, the same set Excel and Google Sheets show. */
export type TFormulaErrorCode =
  | '#DIV/0!'
  | '#VALUE!'
  | '#REF!'
  | '#NAME?'
  | '#N/A'
  | '#NUM!'
  | '#NULL!'
  | '#ERROR!'

/**
 * An error value. The code is what a cell shows, the message is a short
 * English sentence for a tooltip, such as 'Circular reference'.
 */
export interface IFormulaError {
  error: TFormulaErrorCode
  message: string
}

/** What a formula evaluates to. */
export type TFormulaValue = number | string | boolean | null | IFormulaError

/** What a cell in sheet mode holds: a literal, or a formula as a string starting with '='. */
export type TFormulaCellValue = string | number | boolean | null

/** A sheet's cells keyed by A1-style references ('A1', 'B12', 'AA3'). */
export type TFormulaCells = Record<string, TFormulaCellValue>

/**
 * A rectangle of cells, 0-based and inclusive, always normalised so that
 * r1 <= r2 and c1 <= c2. A whole-column range has r2 = Infinity and a
 * whole-row range has c2 = Infinity.
 */
export interface IFormulaRange {
  r1: number
  c1: number
  r2: number
  c2: number
}

/** The two locale-dependent parts of formula syntax. */
export interface IFormulaSyntax {
  decimal: '.' | ','
  separator: ',' | ';'
}

export type TFormulaTokenType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'error'
  | 'reference'
  | 'range'
  | 'function'
  | 'name'
  | 'operator'
  | 'paren'
  | 'separator'
  | 'whitespace'
  | 'invalid'
  | 'brace'
  | 'rowSeparator'

/** One token of a formula, with its position in the text it came from. */
export interface IFormulaToken {
  type: TFormulaTokenType
  text: string
  start: number
  end: number
}

/** A reference or range found in a formula, with its position in the text. */
export interface IFormulaReference {
  start: number
  end: number
  text: string
  range: IFormulaRange
}

export type TFormulaCategory =
  | 'math'
  | 'statistical'
  | 'logical'
  | 'text'
  | 'lookup'
  | 'information'
  | 'date'

/** What autocomplete and the reference page know about a function. */
export interface IFormulaFunction {
  name: string
  category: TFormulaCategory
  /** How the call is written, optional arguments in brackets, e.g. 'SUMIF(range, criterion, [sum_range])'. */
  syntax: string
  /** One plain sentence. */
  description: string
  minArgs: number
  /** Infinity for a function that takes any number of arguments. */
  maxArgs: number
}

export interface IFormulaSheet {
  /**
   * Computes every formula cell and returns ref -> value for the formula
   * cells only. Parsed formulas are reused across calls, keyed by their text.
   */
  compute(cells: TFormulaCells): Map<string, TFormulaValue>
  /**
   * Evaluates a canonical formula against the cells and results of the last
   * compute(). References are the absolute positions as written. Meant for
   * rules such as conditional formatting.
   */
  evaluate(formula: string): TFormulaValue
  /** How many parsed formulas the sheet is holding on to, for tests and diagnostics. */
  readonly cacheSize: number
}

// ─── Internal types ──────────────────────────────────────────────────────

/** A single value flowing through evaluation. */
export type TScalar = TFormulaValue

/**
 * A rectangle of values: a range read from the sheet, or an array produced
 * by an operator over ranges. Range cells are read lazily, so a large range
 * costs nothing until a function walks it.
 */
export interface IMatrix {
  kind: 'matrix'
  rows: number
  cols: number
  get(row: number, col: number): TScalar
  /** Where a matrix read from the sheet starts, 0-based. ROW and COLUMN need it. */
  origin?: { row: number; col: number }
}

export type TValue = TScalar | IMatrix

/** What evaluation needs from the sheet around it. */
export interface IEvalContext {
  cell(row: number, col: number): TScalar
  /** The used area of the sheet, which bounds whole-column and whole-row ranges. */
  extent: { rows: number; cols: number }
  /** The cell holding the formula, when there is one. */
  at?: { row: number; col: number }
}

export type TAstNode =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'error'; error: IFormulaError }
  | { type: 'ref'; row: number; col: number }
  | { type: 'range'; range: IFormulaRange }
  | { type: 'name'; name: string }
  | { type: 'missing' }
  | { type: 'call'; name: string; args: TAstNode[] }
  | { type: 'unary'; op: '-' | '+'; operand: TAstNode }
  | { type: 'percent'; operand: TAstNode }
  | { type: 'binary'; op: string; left: TAstNode; right: TAstNode }
  | { type: 'array'; rows: number; cols: number; values: TScalar[] }
