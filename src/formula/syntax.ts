import { arrayColumnSeparator, CANONICAL_SYNTAX, tokenize } from './tokenizer'
import type { IFormulaSyntax } from './types'

export { CANONICAL_SYNTAX }

/**
 * The syntax people in a locale expect. Where the decimal mark is a comma,
 * the comma cannot also separate arguments, so the separator becomes ';'
 * (as Excel and Google Sheets do in those locales).
 */
export function syntaxForLocale(locale?: string): IFormulaSyntax {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1.5)
    const decimal = parts.find((part) => part.type === 'decimal')?.value
    if (decimal === ',') return { decimal: ',', separator: ';' }
  } catch (_error) {
    // An unknown locale tag falls back to the canonical syntax.
  }
  return { ...CANONICAL_SYNTAX }
}

function convert(
  formula: string,
  from: IFormulaSyntax,
  to: IFormulaSyntax,
): string {
  if (from.decimal === to.decimal && from.separator === to.separator)
    return formula
  // Separators inside braces divide array columns, which have their own
  // character in each syntax.
  let depth = 0
  return tokenize(formula, from)
    .map((token) => {
      if (token.type === 'brace') {
        depth = token.text === '{' ? depth + 1 : Math.max(0, depth - 1)
      }
      if (token.type === 'number')
        return token.text.replace(from.decimal, to.decimal)
      if (token.type === 'separator') {
        return depth > 0 ? arrayColumnSeparator(to) : to.separator
      }
      return token.text
    })
    .join('')
}

/** What a person typed in their locale's syntax, as the text to store. */
export function toCanonical(formula: string, from: IFormulaSyntax): string {
  return convert(formula, from, CANONICAL_SYNTAX)
}

/** Stored formula text, as the editor shows it in a locale's syntax. */
export function toLocalized(formula: string, to: IFormulaSyntax): string {
  return convert(formula, CANONICAL_SYNTAX, to)
}
