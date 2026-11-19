import { normaliseRange, parseRangeText, parseRef } from './refs'
import { CANONICAL_SYNTAX, tokenize } from './tokenizer'
import type {
  IFormulaSyntax,
  IFormulaToken,
  TAstNode,
  TFormulaErrorCode,
} from './types'
import { formulaError } from './values'

class ParseError extends Error {}

// Binding powers, lowest first. Negation binds tighter than '%', which binds
// tighter than '^', so -2^2 is 4 and 2^50% raises to 0.5, as in Excel.
const INFIX: Record<string, number> = {
  '=': 10,
  '<>': 10,
  '<': 10,
  '>': 10,
  '<=': 10,
  '>=': 10,
  '&': 20,
  '+': 30,
  '-': 30,
  '*': 40,
  '/': 40,
  '^': 50,
  ':': 80,
}
const PERCENT = 60
const PREFIX = 70

/**
 * Parses a formula (with or without its leading '=') into a tree. It never
 * throws: a formula that cannot be read becomes a single #ERROR! node, which
 * evaluates to that error with a message saying what went wrong.
 */
export function parseFormula(
  formula: string,
  syntax: IFormulaSyntax = CANONICAL_SYNTAX,
): TAstNode {
  const tokens = tokenize(formula, syntax).filter(
    (token) => token.type !== 'whitespace',
  )
  if (
    tokens.length > 0 &&
    tokens[0].type === 'operator' &&
    tokens[0].text === '='
  ) {
    tokens.shift()
  }
  let pos = 0
  const peek = (): IFormulaToken | undefined => tokens[pos]
  const next = (): IFormulaToken | undefined => tokens[pos++]
  const fail = (message: string): never => {
    throw new ParseError(message)
  }
  const describe = (token: IFormulaToken | undefined) =>
    token ? `Unexpected "${token.text}"` : 'The formula ends too early'

  const parseExpression = (minBp: number): TAstNode => {
    let left = parsePrefix()
    for (;;) {
      const token = peek()
      if (!token || token.type !== 'operator') break
      if (token.text === '%') {
        if (PERCENT <= minBp) break
        pos++
        left = { type: 'percent', operand: left }
        continue
      }
      const bp = INFIX[token.text]
      if (bp === undefined || bp <= minBp) break
      pos++
      const right = parseExpression(bp)
      left =
        token.text === ':'
          ? joinRange(left, right)
          : binary(token.text, left, right)
    }
    return left
  }

  const binary = (op: string, left: TAstNode, right: TAstNode): TAstNode => ({
    type: 'binary',
    op,
    left,
    right,
  })

  // A1:B2 is one token already. The ':' operator only appears with spaces or
  // with a reference on one side and a range on the other, and it joins them
  // into the rectangle that covers both.
  const joinRange = (left: TAstNode, right: TAstNode): TAstNode => {
    const box = (node: TAstNode) =>
      node.type === 'ref'
        ? { r1: node.row, c1: node.col, r2: node.row, c2: node.col }
        : node.type === 'range'
          ? node.range
          : null
    const a = box(left)
    const b = box(right)
    if (!a || !b) return fail('A range needs a reference on each side of ":"')
    return {
      type: 'range',
      range: normaliseRange(
        Math.min(a.r1, b.r1),
        Math.min(a.c1, b.c1),
        Math.max(a.r2, b.r2),
        Math.max(a.c2, b.c2),
      ),
    }
  }

  const parsePrefix = (): TAstNode => {
    const token = next()
    if (!token) return fail(describe(token))
    switch (token.type) {
      case 'number':
        return {
          type: 'number',
          value: Number(token.text.replace(syntax.decimal, '.')),
        }
      case 'string':
        return {
          type: 'string',
          value: token.text.slice(1, -1).replace(/""/g, '"'),
        }
      case 'boolean':
        return { type: 'boolean', value: token.text.toUpperCase() === 'TRUE' }
      case 'error':
        return {
          type: 'error',
          error: formulaError(token.text.toUpperCase() as TFormulaErrorCode),
        }
      case 'reference': {
        const ref = parseRef(token.text)
        return ref
          ? { type: 'ref', ...ref }
          : fail(`"${token.text}" is not a reference`)
      }
      case 'range': {
        const range = parseRangeText(token.text)
        return range
          ? { type: 'range', range }
          : fail(`"${token.text}" is not a range`)
      }
      case 'name':
        return { type: 'name', name: token.text }
      case 'function':
        return parseCall(token.text)
      case 'paren':
        if (token.text === '(') {
          const inner = parseExpression(0)
          const close = next()
          if (!close || close.text !== ')') fail('A parenthesis is not closed')
          return inner
        }
        return fail(describe(token))
      case 'operator':
        if (token.text === '-' || token.text === '+') {
          return {
            type: 'unary',
            op: token.text,
            operand: parseExpression(PREFIX),
          }
        }
        return fail(describe(token))
      default:
        if (token.text.startsWith('"'))
          return fail('A text value is missing its closing quote')
        return fail(describe(token))
    }
  }

  const isArgumentEnd = (token: IFormulaToken | undefined) =>
    !!token &&
    (token.type === 'separator' ||
      (token.type === 'paren' && token.text === ')'))

  const parseCall = (name: string): TAstNode => {
    next() // the '(' the tokenizer saw after the name
    const args: TAstNode[] = []
    if (peek()?.type === 'paren' && peek()?.text === ')') {
      pos++
      return { type: 'call', name: name.toUpperCase(), args }
    }
    for (;;) {
      // An argument left empty, as in IF(A1,,1), is a blank.
      args.push(
        isArgumentEnd(peek()) ? { type: 'missing' } : parseExpression(0),
      )
      const token = next()
      if (token?.type === 'separator') continue
      if (token?.type === 'paren' && token.text === ')') break
      fail(token ? describe(token) : `${name.toUpperCase()} is missing a ")"`)
    }
    return { type: 'call', name: name.toUpperCase(), args }
  }

  try {
    if (tokens.length === 0) fail('The formula is empty')
    const tree = parseExpression(0)
    if (pos < tokens.length) fail(describe(tokens[pos]))
    return tree
  } catch (error) {
    const message =
      error instanceof ParseError
        ? error.message
        : error instanceof RangeError
          ? 'The formula is nested too deeply'
          : 'The formula could not be read'
    return { type: 'error', error: formulaError('#ERROR!', message) }
  }
}

/** Every reference and range a formula reads, for the dependency graph. */
export function collectReferences(
  node: TAstNode,
  into: TAstNode[] = [],
): TAstNode[] {
  // An explicit stack, so a long chain of operators cannot overflow.
  const stack: TAstNode[] = [node]
  while (stack.length > 0) {
    const current = stack.pop() as TAstNode
    switch (current.type) {
      case 'ref':
      case 'range':
        into.push(current)
        break
      case 'call':
        for (const arg of current.args) stack.push(arg)
        break
      case 'unary':
      case 'percent':
        stack.push(current.operand)
        break
      case 'binary':
        stack.push(current.left, current.right)
        break
    }
  }
  return into
}
