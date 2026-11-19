import type { IFormulaSyntax, IFormulaToken, TFormulaTokenType } from './types'

/** How formulas are stored: English function names, '.' decimal, ',' between arguments. */
export const CANONICAL_SYNTAX: IFormulaSyntax = Object.freeze({
  decimal: '.',
  separator: ',',
}) as IFormulaSyntax

export const ERROR_LITERALS = [
  '#DIV/0!',
  '#VALUE!',
  '#REF!',
  '#NAME?',
  '#N/A',
  '#NUM!',
  '#NULL!',
  '#ERROR!',
] as const

// A reference or range only counts as one when it is not the start of a
// longer name or a function call. LOG10( is a function, not the cell LOG10.
const NOT_AFTER = '(?![A-Za-z0-9_.$(])'
const CELL_RANGE = new RegExp(
  `^\\$?[A-Za-z]{1,3}\\$?[1-9][0-9]*:\\$?[A-Za-z]{1,3}\\$?[1-9][0-9]*${NOT_AFTER}`,
)
const COLUMN_RANGE = new RegExp(
  `^\\$?[A-Za-z]{1,3}:\\$?[A-Za-z]{1,3}${NOT_AFTER}`,
)
const ROW_RANGE = new RegExp(`^\\$?[1-9][0-9]*:\\$?[1-9][0-9]*${NOT_AFTER}`)
const CELL = new RegExp(`^\\$?[A-Za-z]{1,3}\\$?[1-9][0-9]*${NOT_AFTER}`)
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_.]*/
const WHITESPACE = /^\s+/
const OPERATORS = [
  '<>',
  '<=',
  '>=',
  '+',
  '-',
  '*',
  '/',
  '^',
  '&',
  '%',
  '=',
  '<',
  '>',
  ':',
]

function numberPattern(decimal: string): RegExp {
  const d = decimal === '.' ? '\\.' : ','
  return new RegExp(`^(?:[0-9]+(?:${d}[0-9]*)?|${d}[0-9]+)(?:[eE][+-]?[0-9]+)?`)
}

const NUMBER_PATTERNS: Record<string, RegExp> = {
  '.': numberPattern('.'),
  ',': numberPattern(','),
}

/** The separator between the columns of an array literal: ',' or, in ';' locales, '\\'. */
export function arrayColumnSeparator(syntax: IFormulaSyntax): string {
  return syntax.separator === ';' ? '\\' : ','
}

/**
 * Splits a formula into tokens. It never throws: anything it cannot read
 * becomes an 'invalid' token, so the concatenated token texts are always
 * the input, which is what highlighting and the locale round trip rely on.
 */
export function tokenize(
  formula: string,
  syntax: IFormulaSyntax = CANONICAL_SYNTAX,
): IFormulaToken[] {
  const tokens: IFormulaToken[] = []
  const numberRe = NUMBER_PATTERNS[syntax.decimal] ?? NUMBER_PATTERNS['.']
  // Inside braces, columns are separated by ',' and rows by ';'. Where ';'
  // already separates arguments, columns take '\\' instead, as in Google Sheets.
  const columnSeparator = arrayColumnSeparator(syntax)
  let depth = 0
  let i = 0
  const push = (type: TFormulaTokenType, length: number) => {
    tokens.push({
      type,
      text: formula.slice(i, i + length),
      start: i,
      end: i + length,
    })
    i += length
  }

  while (i < formula.length) {
    const rest = formula.slice(i)
    const char = rest[0]
    let match: RegExpExecArray | null

    if ((match = WHITESPACE.exec(rest))) {
      push('whitespace', match[0].length)
    } else if (char === '"') {
      // A string runs to the next quote that is not doubled. One left open
      // is invalid to the end of the input.
      let j = 1
      let closed = false
      while (j < rest.length) {
        if (rest[j] === '"') {
          if (rest[j + 1] === '"') j += 2
          else {
            closed = true
            j++
            break
          }
        } else j++
      }
      push(closed ? 'string' : 'invalid', j)
    } else if (char === '#') {
      const upper = rest.toUpperCase()
      const literal = ERROR_LITERALS.find((code) => upper.startsWith(code))
      push(literal ? 'error' : 'invalid', literal ? literal.length : 1)
    } else if ((match = ROW_RANGE.exec(rest))) {
      push('range', match[0].length)
    } else if ((match = numberRe.exec(rest))) {
      push('number', match[0].length)
    } else if (
      (match = CELL_RANGE.exec(rest)) ||
      (match = COLUMN_RANGE.exec(rest))
    ) {
      push('range', match[0].length)
    } else if ((match = CELL.exec(rest))) {
      push('reference', match[0].length)
    } else if ((match = IDENTIFIER.exec(rest))) {
      const word = match[0]
      const next = formula[i + word.length]
      const upper = word.toUpperCase()
      if (next === '(') push('function', word.length)
      else if (upper === 'TRUE' || upper === 'FALSE')
        push('boolean', word.length)
      else push('name', word.length)
    } else if (char === '(' || char === ')') {
      push('paren', 1)
    } else if (char === '{' || char === '}') {
      depth = char === '{' ? depth + 1 : Math.max(0, depth - 1)
      push('brace', 1)
    } else if (depth > 0 && char === columnSeparator) {
      push('separator', 1)
    } else if (depth > 0 && char === ';') {
      push('rowSeparator', 1)
    } else if (char === syntax.separator) {
      push('separator', 1)
    } else {
      const op = OPERATORS.find((candidate) => rest.startsWith(candidate))
      push(op ? 'operator' : 'invalid', op ? op.length : 1)
    }
  }
  return tokens
}
