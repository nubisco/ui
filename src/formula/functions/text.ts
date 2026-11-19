import { wildcardPattern } from '../criteria'
import type { IFormulaError, TValue } from '../types'
import {
  booleanArg,
  eachCell,
  formulaError,
  isFormulaError,
  isMatrix,
  numberArg,
  optionalNumber,
  parseNumericText,
  scalar,
  textArg,
  toText,
} from '../values'
import { firstError, type IFunctionDefinition } from './define'

// Excel's limit on the length of a text value. REPT stops there instead of
// building a string that would freeze the page.
const MAX_TEXT = 32767

/** Every argument as text, ranges read row by row. */
function collectTexts(args: TValue[]): string[] | IFormulaError {
  const texts: string[] = []
  for (const arg of args) {
    if (isMatrix(arg)) {
      let failure: IFormulaError | null = null
      eachCell(arg, (value) => {
        const text = toText(value)
        if (isFormulaError(text)) {
          failure = text
          return true
        }
        texts.push(text)
      })
      if (failure) return failure
    } else {
      const text = toText(arg)
      if (isFormulaError(text)) return text
      texts.push(text)
    }
  }
  return texts
}

/** Wraps a function of one text argument. */
const ofText =
  (fn: (text: string) => TValue) =>
  (args: TValue[]): TValue => {
    const text = textArg(args[0])
    return isFormulaError(text) ? text : fn(text)
  }

function leftOrRight(args: TValue[], fromEnd: boolean): TValue {
  const text = textArg(args[0])
  const count = optionalNumber(args, 1, 1)
  const error = firstError(text, count)
  if (error) return error
  const n = Math.trunc(count as number)
  if (n < 0) return formulaError('#VALUE!', 'The count cannot be negative')
  const s = text as string
  return fromEnd ? s.slice(Math.max(0, s.length - n)) : s.slice(0, n)
}

function locate(args: TValue[], caseSensitive: boolean): TValue {
  const needle = textArg(args[0])
  const haystack = textArg(args[1])
  const from = optionalNumber(args, 2, 1)
  const error = firstError(needle, haystack, from)
  if (error) return error
  const start = Math.trunc(from as number)
  const text = haystack as string
  if (start < 1 || start > text.length + 1) {
    return formulaError('#VALUE!', 'The start position is outside the text')
  }
  if (caseSensitive) {
    const index = text.indexOf(needle as string, start - 1)
    return index < 0
      ? formulaError('#VALUE!', 'The text was not found')
      : index + 1
  }
  const pattern = wildcardPattern(needle as string, false)
  const match = pattern.exec(text.slice(start - 1))
  return match
    ? match.index + start
    : formulaError('#VALUE!', 'The text was not found')
}

export const TEXT_FUNCTIONS: IFunctionDefinition[] = [
  {
    name: 'CONCAT',
    category: 'text',
    syntax: 'CONCAT(value1, [value2, ...])',
    description: 'Joins values and the cells of ranges into one text.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      const texts = collectTexts(args)
      return isFormulaError(texts) ? texts : texts.join('')
    },
  },
  {
    name: 'CONCATENATE',
    category: 'text',
    syntax: 'CONCATENATE(value1, [value2, ...])',
    description: 'Joins values into one text.',
    minArgs: 1,
    maxArgs: Infinity,
    call: (args) => {
      const texts = collectTexts(args)
      return isFormulaError(texts) ? texts : texts.join('')
    },
  },
  {
    name: 'TEXTJOIN',
    category: 'text',
    syntax: 'TEXTJOIN(delimiter, ignore_empty, value1, [value2, ...])',
    description:
      'Joins values with a delimiter, optionally leaving out empty ones.',
    minArgs: 3,
    maxArgs: Infinity,
    call: (args) => {
      const delimiter = textArg(args[0])
      const ignoreEmpty = booleanArg(args[1])
      const texts = collectTexts(args.slice(2))
      const error = firstError(delimiter, ignoreEmpty, texts)
      if (error) return error
      const parts = ignoreEmpty
        ? (texts as string[]).filter((t) => t !== '')
        : (texts as string[])
      return parts.join(delimiter as string)
    },
  },
  {
    name: 'LEN',
    category: 'text',
    syntax: 'LEN(text)',
    description: 'Returns the number of characters in a text.',
    minArgs: 1,
    maxArgs: 1,
    call: ofText((text) => text.length),
  },
  {
    name: 'LEFT',
    category: 'text',
    syntax: 'LEFT(text, [count])',
    description:
      'Returns the first characters of a text, one when the count is left out.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => leftOrRight(args, false),
  },
  {
    name: 'RIGHT',
    category: 'text',
    syntax: 'RIGHT(text, [count])',
    description:
      'Returns the last characters of a text, one when the count is left out.',
    minArgs: 1,
    maxArgs: 2,
    call: (args) => leftOrRight(args, true),
  },
  {
    name: 'MID',
    category: 'text',
    syntax: 'MID(text, start, count)',
    description:
      'Returns characters from the middle of a text, counting from 1.',
    minArgs: 3,
    maxArgs: 3,
    call: (args) => {
      const text = textArg(args[0])
      const start = numberArg(args[1])
      const count = numberArg(args[2])
      const error = firstError(text, start, count)
      if (error) return error
      const from = Math.trunc(start as number)
      const n = Math.trunc(count as number)
      if (from < 1)
        return formulaError('#VALUE!', 'The start position must be at least 1')
      if (n < 0) return formulaError('#VALUE!', 'The count cannot be negative')
      return (text as string).slice(from - 1, from - 1 + n)
    },
  },
  {
    name: 'UPPER',
    category: 'text',
    syntax: 'UPPER(text)',
    description: 'Converts a text to upper case.',
    minArgs: 1,
    maxArgs: 1,
    call: ofText((text) => text.toUpperCase()),
  },
  {
    name: 'LOWER',
    category: 'text',
    syntax: 'LOWER(text)',
    description: 'Converts a text to lower case.',
    minArgs: 1,
    maxArgs: 1,
    call: ofText((text) => text.toLowerCase()),
  },
  {
    name: 'PROPER',
    category: 'text',
    syntax: 'PROPER(text)',
    description:
      'Capitalises the first letter of each word and lowers the rest.',
    minArgs: 1,
    maxArgs: 1,
    call: ofText((text) =>
      text
        .toLowerCase()
        .replace(
          /(^|[^\p{L}])(\p{L})/gu,
          (_match, before: string, letter: string) =>
            before + letter.toUpperCase(),
        ),
    ),
  },
  {
    name: 'TRIM',
    category: 'text',
    syntax: 'TRIM(text)',
    description:
      'Removes spaces from both ends and collapses runs of spaces inside.',
    minArgs: 1,
    maxArgs: 1,
    call: ofText((text) => text.replace(/ +/g, ' ').trim()),
  },
  {
    name: 'SUBSTITUTE',
    category: 'text',
    syntax: 'SUBSTITUTE(text, old_text, new_text, [instance])',
    description:
      'Replaces occurrences of a text, or only the given occurrence.',
    minArgs: 3,
    maxArgs: 4,
    call: (args) => {
      const text = textArg(args[0])
      const search = textArg(args[1])
      const replacement = textArg(args[2])
      const instance =
        args[3] === undefined || args[3] === null ? null : numberArg(args[3])
      const error = firstError(text, search, replacement, instance)
      if (error) return error
      const s = text as string
      const find = search as string
      if (find === '') return s
      if (instance === null) return s.split(find).join(replacement as string)
      const which = Math.trunc(instance as number)
      if (which < 1)
        return formulaError('#VALUE!', 'The instance must be at least 1')
      let index = -1
      for (let i = 0; i < which; i++) {
        index = s.indexOf(find, index + 1)
        if (index < 0) return s
      }
      return (
        s.slice(0, index) +
        (replacement as string) +
        s.slice(index + find.length)
      )
    },
  },
  {
    name: 'REPLACE',
    category: 'text',
    syntax: 'REPLACE(text, start, count, new_text)',
    description:
      'Replaces a number of characters at a position, counting from 1.',
    minArgs: 4,
    maxArgs: 4,
    call: (args) => {
      const text = textArg(args[0])
      const start = numberArg(args[1])
      const count = numberArg(args[2])
      const replacement = textArg(args[3])
      const error = firstError(text, start, count, replacement)
      if (error) return error
      const from = Math.trunc(start as number)
      const n = Math.trunc(count as number)
      if (from < 1)
        return formulaError('#VALUE!', 'The start position must be at least 1')
      if (n < 0) return formulaError('#VALUE!', 'The count cannot be negative')
      const s = text as string
      return (
        s.slice(0, from - 1) + (replacement as string) + s.slice(from - 1 + n)
      )
    },
  },
  {
    name: 'FIND',
    category: 'text',
    syntax: 'FIND(search_for, text, [start])',
    description:
      'Returns the position of a text inside another, matching case.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => locate(args, true),
  },
  {
    name: 'SEARCH',
    category: 'text',
    syntax: 'SEARCH(search_for, text, [start])',
    description:
      'Returns the position of a text inside another, ignoring case and allowing wildcards.',
    minArgs: 2,
    maxArgs: 3,
    call: (args) => locate(args, false),
  },
  {
    name: 'REPT',
    category: 'text',
    syntax: 'REPT(text, times)',
    description: 'Repeats a text a number of times.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const text = textArg(args[0])
      const times = numberArg(args[1])
      const error = firstError(text, times)
      if (error) return error
      const n = Math.trunc(times as number)
      if (n < 0) return formulaError('#VALUE!', 'The count cannot be negative')
      if ((text as string).length * n > MAX_TEXT) {
        return formulaError('#VALUE!', 'The text would be too long')
      }
      return (text as string).repeat(n)
    },
  },
  {
    name: 'EXACT',
    category: 'text',
    syntax: 'EXACT(text1, text2)',
    description: 'Returns TRUE when two texts are the same, including case.',
    minArgs: 2,
    maxArgs: 2,
    call: (args) => {
      const a = textArg(args[0])
      const b = textArg(args[1])
      return firstError(a, b) ?? a === b
    },
  },
  {
    name: 'VALUE',
    category: 'text',
    syntax: 'VALUE(text)',
    description: 'Converts a text that looks like a number into the number.',
    minArgs: 1,
    maxArgs: 1,
    call: (args) => {
      const value = scalar(args[0])
      if (typeof value === 'number' || isFormulaError(value)) return value
      const parsed = typeof value === 'string' ? parseNumericText(value) : null
      return parsed === null
        ? formulaError('#VALUE!', 'The text is not a number')
        : parsed
    },
  },
]
