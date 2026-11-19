import { describe, expect, it } from 'vitest'
import {
  CANONICAL_SYNTAX,
  columnLetters,
  findFunctions,
  FORMULA_FUNCTIONS,
  formatRef,
  fromSerial,
  parseDateText,
  toSerial,
  isFormula,
  isFormulaError,
  lettersToColumn,
  parseRef,
  referencesIn,
  shiftFormula,
  syntaxForLocale,
  toCanonical,
  toLocalized,
  tokenize,
} from '../src/formula'

const PT = { decimal: ',', separator: ';' } as const

describe('refs', () => {
  it('converts between letters and column indexes', () => {
    expect(columnLetters(0)).toBe('A')
    expect(columnLetters(25)).toBe('Z')
    expect(columnLetters(26)).toBe('AA')
    expect(columnLetters(701)).toBe('ZZ')
    expect(columnLetters(702)).toBe('AAA')
    expect(lettersToColumn('A')).toBe(0)
    expect(lettersToColumn('aa')).toBe(26)
    expect(lettersToColumn('AAA')).toBe(702)
    expect(lettersToColumn('A1')).toBe(-1)
  })

  it('parses and formats A1 references', () => {
    expect(parseRef('B3')).toEqual({ row: 2, col: 1 })
    expect(parseRef('$B$3')).toEqual({ row: 2, col: 1 })
    expect(parseRef('aa10')).toEqual({ row: 9, col: 26 })
    expect(parseRef('A0')).toBeNull()
    expect(parseRef('3B')).toBeNull()
    expect(formatRef(2, 1)).toBe('B3')
    expect(formatRef(0, 27)).toBe('AB1')
  })

  it('recognises formulas and errors', () => {
    expect(isFormula('=A1')).toBe(true)
    expect(isFormula('=')).toBe(false)
    expect(isFormula('A1')).toBe(false)
    expect(isFormula(3)).toBe(false)
    expect(isFormulaError({ error: '#N/A', message: 'x' })).toBe(true)
    expect(isFormulaError({ error: 'nope', message: 'x' })).toBe(false)
    expect(isFormulaError('#N/A')).toBe(false)
  })
})

describe('tokenize', () => {
  const samples = [
    '=SUM(A1:B2, 3) * -2^2 & "a""b"',
    '=IF($A$1>=10%,"yes","no")',
    '=A:A + 1:3 + LOG10(100) + #N/A',
    '=  1.5e3 + .5 <> TRUE',
    '=SUM(A1;1,5)',
    '="unterminated',
    '=@{}!? ~',
    '=SUM({1,5\\2,5;3\\4};{1})',
    '={1,2;3,4}+{"a;b",TRUE}',
    '=}{;\\',
    '',
  ]

  it('covers every character of the input', () => {
    for (const sample of samples) {
      expect(
        tokenize(sample)
          .map((t) => t.text)
          .join(''),
      ).toBe(sample)
      expect(
        tokenize(sample, PT)
          .map((t) => t.text)
          .join(''),
      ).toBe(sample)
    }
  })

  it('classifies tokens', () => {
    const types = tokenize(
      '=SUM(A1:B2,$C$3,"x",TRUE,#REF!,LOG10(1),foo,A:B,1:3)',
    )
      .filter((t) => t.type !== 'separator')
      .map((t) => `${t.type}:${t.text}`)
    expect(types).toEqual([
      'operator:=',
      'function:SUM',
      'paren:(',
      'range:A1:B2',
      'reference:$C$3',
      'string:"x"',
      'boolean:TRUE',
      'error:#REF!',
      'function:LOG10',
      'paren:(',
      'number:1',
      'paren:)',
      'name:foo',
      'range:A:B',
      'range:1:3',
      'paren:)',
    ])
  })

  it('records positions', () => {
    const tokens = tokenize('=A1+10')
    expect(tokens[1]).toEqual({
      type: 'reference',
      text: 'A1',
      start: 1,
      end: 3,
    })
    expect(tokens[3]).toEqual({ type: 'number', text: '10', start: 4, end: 6 })
  })

  it('reads numbers in either syntax', () => {
    expect(tokenize('=1,5', PT)[1]).toMatchObject({
      type: 'number',
      text: '1,5',
    })
    expect(tokenize('=1.5e-3')[1]).toMatchObject({
      type: 'number',
      text: '1.5e-3',
    })
    expect(tokenize('=.5')[1]).toMatchObject({ type: 'number', text: '.5' })
  })

  it('marks what it cannot read as invalid instead of throwing', () => {
    expect(tokenize('="open').map((t) => t.type)).toEqual([
      'operator',
      'invalid',
    ])
    expect(tokenize('=1;2').map((t) => t.type)).toContain('invalid')
  })
})

describe('locale syntax', () => {
  it('picks the separator from the decimal mark', () => {
    expect(syntaxForLocale('pt-PT')).toEqual({ decimal: ',', separator: ';' })
    expect(syntaxForLocale('en-US')).toEqual(CANONICAL_SYNTAX)
    expect(syntaxForLocale('not a locale !!')).toEqual(CANONICAL_SYNTAX)
  })

  it('round trips between pt-PT and the stored text', () => {
    expect(toCanonical('=SUM(A1;1,5)', PT)).toBe('=SUM(A1,1.5)')
    expect(toLocalized('=SUM(A1,1.5)', PT)).toBe('=SUM(A1;1,5)')
  })

  it('leaves strings alone', () => {
    expect(toLocalized('=CONCAT("1.5, 2", 2.5)', PT)).toBe(
      '=CONCAT("1.5, 2"; 2,5)',
    )
    expect(toCanonical('=CONCAT("1,5; 2"; 2,5)', PT)).toBe(
      '=CONCAT("1,5; 2", 2.5)',
    )
  })

  it('does not throw on text it cannot read', () => {
    // '1,' is a number with a trailing decimal mark, the second ',' is kept.
    expect(toCanonical('=SUM(1,,"x', PT)).toBe('=SUM(1.,"x')
    expect(toLocalized('=@#!', PT)).toBe('=@#!')
  })

  it('is the identity in the canonical syntax', () => {
    expect(toCanonical('=SUM(A1, 1.5)', CANONICAL_SYNTAX)).toBe('=SUM(A1, 1.5)')
  })
})

describe('referencesIn', () => {
  it('returns positions and ranges', () => {
    expect(referencesIn('=A1+SUM($B$2:C3)')).toEqual([
      { start: 1, end: 3, text: 'A1', range: { r1: 0, c1: 0, r2: 0, c2: 0 } },
      {
        start: 8,
        end: 15,
        text: '$B$2:C3',
        range: { r1: 1, c1: 1, r2: 2, c2: 2 },
      },
    ])
  })

  it('normalises ranges and opens whole columns and rows', () => {
    const [backwards, column, row] = referencesIn('=B3:A1+A:B+2:3')
    expect(backwards.range).toEqual({ r1: 0, c1: 0, r2: 2, c2: 1 })
    expect(column.range).toEqual({ r1: 0, c1: 0, r2: Infinity, c2: 1 })
    expect(row.range).toEqual({ r1: 1, c1: 0, r2: 2, c2: Infinity })
  })

  it('uses positions in localized text', () => {
    const refs = referencesIn('=SUM(A1;1,5;B2)', PT)
    expect(refs.map((r) => [r.start, r.text])).toEqual([
      [5, 'A1'],
      [12, 'B2'],
    ])
  })

  it('ignores references inside strings and function names', () => {
    expect(referencesIn('="A1"&LOG10(1)')).toEqual([])
  })
})

describe('shiftFormula', () => {
  it('moves relative references', () => {
    expect(shiftFormula('=A1+B2', 1, 0)).toBe('=A2+B3')
    expect(shiftFormula('=A1+B2', 0, 2)).toBe('=C1+D2')
  })

  it('keeps absolute parts', () => {
    expect(shiftFormula('=$A$1+$A1+A$1', 2, 3)).toBe('=$A$1+$A3+D$1')
  })

  it('moves ranges and whole columns and rows', () => {
    expect(shiftFormula('=SUM(A1:B2)', 1, 1)).toBe('=SUM(B2:C3)')
    expect(shiftFormula('=SUM(A:A)', 5, 1)).toBe('=SUM(B:B)')
    expect(shiftFormula('=SUM(1:2)', 1, 5)).toBe('=SUM(2:3)')
    expect(shiftFormula('=SUM($A:A)', 0, 2)).toBe('=SUM($A:C)')
  })

  it('keeps a range coherent when one end is absolute', () => {
    expect(shiftFormula('=SUM($A$5:A6)', -3, 0)).toBe('=SUM($A3:A$5)')
  })

  it('turns references pushed off the sheet into #REF!', () => {
    expect(shiftFormula('=A1+B2', -1, 0)).toBe('=#REF!+B1')
    expect(shiftFormula('=SUM(A1:B2)', 0, -1)).toBe('=SUM(#REF!)')
  })

  it('preserves everything else verbatim', () => {
    expect(shiftFormula('=  a1 +"A1" + LOG10(1)', 1, 0)).toBe(
      '=  A2 +"A1" + LOG10(1)',
    )
    expect(shiftFormula('=A1', 0, 0)).toBe('=A1')
  })
})

describe('function metadata', () => {
  it('is sorted and complete', () => {
    const names = FORMULA_FUNCTIONS.map((fn) => fn.name)
    expect(names).toEqual(names.slice().sort())
    expect(names).toHaveLength(106)
    for (const fn of FORMULA_FUNCTIONS) {
      expect(fn.syntax.startsWith(fn.name + '(')).toBe(true)
      expect(fn.description).toMatch(/^[A-Z].*\.$/)
      expect(fn.description).not.toContain('\u2014')
      expect(fn.minArgs).toBeLessThanOrEqual(fn.maxArgs)
    }
  })

  it('finds functions by prefix, ignoring case', () => {
    expect(findFunctions('sumi').map((fn) => fn.name)).toEqual([
      'SUMIF',
      'SUMIFS',
    ])
    expect(findFunctions('ZZ')).toEqual([])
  })
})

describe('array literals in the tokenizer and the locale round trip', () => {
  it('emits braces and row separators', () => {
    expect(tokenize('={1,2;3,4}').map((t) => t.type)).toEqual([
      'operator',
      'brace',
      'number',
      'separator',
      'number',
      'rowSeparator',
      'number',
      'separator',
      'number',
      'brace',
    ])
    expect(tokenize('={1\\2;3}', PT).map((t) => t.type)).toEqual([
      'operator',
      'brace',
      'number',
      'separator',
      'number',
      'rowSeparator',
      'number',
      'brace',
    ])
  })

  it('treats a backslash outside braces as invalid', () => {
    expect(tokenize('=1\\2', PT)[2].type).toBe('invalid')
  })

  it('round trips arrays between pt-PT and the stored text', () => {
    expect(toCanonical('=SUM({1,5\\2,5;3\\4})', PT)).toBe('=SUM({1.5,2.5;3,4})')
    expect(toLocalized('=SUM({1.5,2.5;3,4})', PT)).toBe('=SUM({1,5\\2,5;3\\4})')
    expect(toCanonical('=SUM({1\\2};3,5)', PT)).toBe('=SUM({1,2},3.5)')
    expect(toLocalized('=SUM({1,2},3.5)', PT)).toBe('=SUM({1\\2};3,5)')
  })
})

describe('serial dates', () => {
  it('counts days from 1899-12-30', () => {
    expect(toSerial(1899, 12, 30)).toBe(0)
    expect(toSerial(1899, 12, 31)).toBe(1)
    expect(toSerial(2026, 11, 19)).toBe(46345)
    expect(toSerial(2026, 11, 19, 18)).toBe(46345.75)
    expect(toSerial(2024, 2, 29)).toBe(45351)
  })

  it('does not invent 29 February 1900', () => {
    expect(toSerial(1900, 2, 28)).toBe(60)
    expect(toSerial(1900, 3, 1)).toBe(61)
    expect(toSerial(1900, 2, 29)).toBe(61)
    expect(parseDateText('1900-02-29')).toBeNull()
  })

  it('rolls over months and days', () => {
    expect(toSerial(2026, 13, 1)).toBe(toSerial(2027, 1, 1))
    expect(toSerial(2026, 0, 1)).toBe(toSerial(2025, 12, 1))
    expect(toSerial(2026, 3, 0)).toBe(toSerial(2026, 2, 28))
    expect(toSerial(2024, 3, 0)).toBe(toSerial(2024, 2, 29))
  })

  it('reads a serial back into its parts', () => {
    expect(fromSerial(46345.75)).toEqual({
      year: 2026,
      month: 11,
      day: 19,
      hours: 18,
      minutes: 0,
      seconds: 0,
      weekday: 4,
    })
    expect(fromSerial(0).weekday).toBe(6)
    expect(fromSerial(45351)).toMatchObject({ year: 2024, month: 2, day: 29 })
    // Rounded to the nearest second, so no 23:59:59.999.
    expect(fromSerial(46345 + 0.9999999999)).toMatchObject({
      day: 20,
      hours: 0,
      seconds: 0,
    })
    expect(fromSerial(toSerial(2026, 1, 1, 13, 14, 15))).toMatchObject({
      hours: 13,
      minutes: 14,
      seconds: 15,
    })
  })

  it('parses ISO dates and times', () => {
    expect(parseDateText('2026-11-19')).toBe(46345)
    expect(parseDateText(' 2026-11-19 ')).toBe(46345)
    expect(parseDateText('2026-11-19T18:00')).toBe(46345.75)
    expect(parseDateText('2026-11-19 06:00:00')).toBe(46345.25)
    expect(parseDateText('12:00')).toBe(0.5)
    expect(parseDateText('06:00:00')).toBe(0.25)
    expect(parseDateText('2024-02-29')).toBe(45351)
    for (const bad of [
      '2023-02-29',
      '2026-13-01',
      '2026-11-19T25:00',
      '24:00',
      '19/11/2026',
      'soon',
      '2026',
    ]) {
      expect(parseDateText(bad), bad).toBeNull()
    }
  })
})
