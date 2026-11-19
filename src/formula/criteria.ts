import type { TScalar } from './types'
import { compareValues, isFormulaError, parseNumericText } from './values'

/**
 * Turns a pattern with '*' (any run) and '?' (any one character) into a
 * case-insensitive regular expression. '~' escapes the next character, so
 * '~*' is a literal asterisk.
 */
export function wildcardPattern(pattern: string, anchored = true): RegExp {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === '~' && i + 1 < pattern.length) {
      source += escapeRegExp(pattern[++i])
    } else if (char === '*') source += '[\\s\\S]*'
    else if (char === '?') source += '[\\s\\S]'
    else source += escapeRegExp(char)
  }
  return new RegExp(anchored ? `^${source}$` : source, 'i')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const isBlank = (value: TScalar) => value === null || value === ''

/**
 * Builds the test for a criterion of SUMIF, COUNTIF and the other *IF and
 * *IFS functions. A number matches equal numbers. Text may start with an
 * operator ('>5', '<=3', '<>x', '=a'). Without one it is a case-insensitive
 * match with '*' and '?' wildcards. An empty criterion matches blank cells.
 */
export function criterionTest(criterion: TScalar): (value: TScalar) => boolean {
  if (criterion === null) return isBlank
  if (typeof criterion === 'number' || typeof criterion === 'boolean') {
    return (value) => typeof value === typeof criterion && value === criterion
  }
  if (isFormulaError(criterion)) {
    return (value) => isFormulaError(value) && value.error === criterion.error
  }

  const match = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(criterion)
  const op = match?.[1] ?? ''
  const operand = match?.[2] ?? ''

  if (operand === '') {
    if (op === '' || op === '=') return isBlank
    if (op === '<>') return (value) => !isBlank(value)
    return () => false
  }

  const number = parseNumericText(operand)
  const upper = operand.toUpperCase()
  const target: string | number | boolean =
    number !== null
      ? number
      : upper === 'TRUE'
        ? true
        : upper === 'FALSE'
          ? false
          : operand

  if (op === '' || op === '=' || op === '<>') {
    const equals =
      typeof target === 'string'
        ? (() => {
            const pattern = wildcardPattern(target)
            return (value: TScalar) =>
              typeof value === 'string' && pattern.test(value)
          })()
        : (value: TScalar) => typeof value === typeof target && value === target
    return op === '<>' ? (value) => !equals(value) : equals
  }

  // Ordering comparisons only look at cells of the operand's own type, so
  // '>5' never matches text and '>m' never matches numbers.
  return (value) => {
    if (
      value === null ||
      isFormulaError(value) ||
      typeof value !== typeof target
    ) {
      return false
    }
    const order = compareValues(value, target)
    switch (op) {
      case '<':
        return order < 0
      case '>':
        return order > 0
      case '<=':
        return order <= 0
      default:
        return order >= 0
    }
  }
}
