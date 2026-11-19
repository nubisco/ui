import { describe, expect, it } from 'vitest'
import {
  createFormulaSheet,
  isFormulaError,
  type TFormulaCells,
  type TFormulaValue,
} from '../src/formula'

/** Evaluates one formula in Z1 of a sheet holding the given cells. */
function calc(formula: string, cells: TFormulaCells = {}): TFormulaValue {
  return (
    createFormulaSheet()
      .compute({ ...cells, Z1: formula })
      .get('Z1') ?? null
  )
}

const code = (value: TFormulaValue) =>
  isFormulaError(value) ? value.error : null
const message = (value: TFormulaValue) =>
  isFormulaError(value) ? value.message : null

describe('operators and precedence', () => {
  it('follows arithmetic precedence', () => {
    expect(calc('=1+2*3')).toBe(7)
    expect(calc('=(1+2)*3')).toBe(9)
    expect(calc('=10-4-3')).toBe(3)
    expect(calc('=12/3/2')).toBe(2)
  })

  it('raises left to right, with negation first, as Excel does', () => {
    expect(calc('=2^3^2')).toBe(64)
    expect(calc('=-2^2')).toBe(4)
    expect(calc('=0-2^2')).toBe(-4)
    expect(calc('=2^-1')).toBe(0.5)
  })

  it('applies percent after negation and before power', () => {
    expect(calc('=50%')).toBe(0.5)
    expect(calc('=-50%')).toBe(-0.5)
    expect(calc('=4^50%')).toBe(2)
    expect(calc('=200%%')).toBe(0.02)
  })

  it('joins text with & below arithmetic and above comparisons', () => {
    expect(calc('=1+2&3')).toBe('33')
    expect(calc('="a"&"b"="AB"')).toBe(true)
    expect(calc('=0.1+0.2&""')).toBe('0.3')
    expect(calc('=TRUE&1')).toBe('TRUE1')
  })

  it('compares across types: numbers, then text, then booleans', () => {
    expect(calc('=1<"a"')).toBe(true)
    expect(calc('="z"<TRUE')).toBe(true)
    expect(calc('="abc"="ABC"')).toBe(true)
    expect(calc('="a"<"B"')).toBe(true)
    expect(calc('=2<>2')).toBe(false)
    expect(calc('=3>=3')).toBe(true)
    expect(calc('=A1=0')).toBe(true)
    expect(calc('=A1=""')).toBe(true)
  })

  it('reads literals', () => {
    expect(calc('=1.5e3')).toBe(1500)
    expect(calc('=.5')).toBe(0.5)
    expect(calc('="say ""hi"""')).toBe('say "hi"')
    expect(calc('=true')).toBe(true)
    expect(calc('=False')).toBe(false)
    expect(code(calc('=#N/A'))).toBe('#N/A')
    expect(calc('=  1 +  2 ')).toBe(3)
  })

  it('joins a reference and a range with the range operator', () => {
    expect(calc('=SUM(A1 : B2)', { A1: 1, B2: 2, A2: 3 })).toBe(6)
  })
})

describe('coercion', () => {
  it('treats empty cells as 0 and as empty text', () => {
    expect(calc('=A1')).toBe(0)
    expect(calc('=A1+1')).toBe(1)
    expect(calc('=A1&"x"')).toBe('x')
    expect(calc('=A1', { A1: '' })).toBe(0)
  })

  it('reads numeric text in arithmetic and refuses other text', () => {
    expect(calc('="3"+1')).toBe(4)
    expect(calc('=A1*2', { A1: ' 2.5 ' })).toBe(5)
    expect(code(calc('="abc"+1'))).toBe('#VALUE!')
    expect(code(calc('=A1+1', { A1: 'Apples' }))).toBe('#VALUE!')
  })

  it('counts booleans as 1 and 0 in arithmetic', () => {
    expect(calc('=TRUE+TRUE')).toBe(2)
    expect(calc('=A1*5', { A1: false })).toBe(0)
  })

  it('returns raw numbers without rounding', () => {
    expect(calc('=0.1+0.2')).toBe(0.1 + 0.2)
  })

  it('returns text and booleans of referenced cells', () => {
    expect(calc('=A1', { A1: 'Pears' })).toBe('Pears')
    expect(calc('=A1', { A1: true })).toBe(true)
    expect(calc('=""')).toBe('')
  })
})

describe('errors', () => {
  it('divides by zero into #DIV/0!', () => {
    expect(code(calc('=1/0'))).toBe('#DIV/0!')
    expect(code(calc('=1/A1'))).toBe('#DIV/0!')
  })

  it('reports an unknown function or name as #NAME?', () => {
    const fn = calc('=FOO(1)')
    expect(code(fn)).toBe('#NAME?')
    expect(message(fn)).toBe('Unknown function FOO')
    expect(code(calc('=apples+1'))).toBe('#NAME?')
  })

  it('reports bad syntax as #ERROR! with a message', () => {
    for (const formula of [
      '=1+',
      '=(1',
      '=SUM(1',
      '=1 2',
      '=*3',
      '="open',
      '=1;2',
      '=)',
    ]) {
      const result = calc(formula)
      expect(code(result), formula).toBe('#ERROR!')
      expect(message(result), formula).toMatch(/^[A-Z]/)
    }
    expect(message(calc('="open'))).toBe(
      'A text value is missing its closing quote',
    )
  })

  it('reports the wrong number of arguments as #N/A', () => {
    expect(code(calc('=ROUND()'))).toBe('#N/A')
    expect(message(calc('=ABS(1,2)'))).toBe('ABS expects 1 argument')
    expect(message(calc('=IF(1)'))).toBe('IF expects between 2 and 3 arguments')
    expect(message(calc('=SUM()'))).toBe('SUM expects at least 1 argument')
    expect(message(calc('=PI(1)'))).toBe('PI expects 0 arguments')
  })

  it('propagates errors from referenced cells', () => {
    const result = createFormulaSheet().compute({
      A1: '=1/0',
      A2: '=A1+1',
      A3: '=SUM(A1:A2)',
    })
    expect(code(result.get('A2') ?? null)).toBe('#DIV/0!')
    expect(code(result.get('A3') ?? null)).toBe('#DIV/0!')
  })

  it('turns non-finite results into #NUM!', () => {
    expect(code(calc('=10^400'))).toBe('#NUM!')
    expect(code(calc('=POWER(10,400)/10'))).toBe('#NUM!')
    expect(code(calc('=(-8)^(1/3)'))).toBe('#NUM!')
    expect(code(calc('=A1', { A1: Infinity }))).toBe('#NUM!')
  })

  it('refuses a range where one value is expected', () => {
    expect(code(calc('=A1:A3+1', { A1: 1 }))).toBe('#VALUE!')
    expect(code(calc('=A1:A3', { A1: 1 }))).toBe('#VALUE!')
    expect(calc('=A1:A1+1', { A1: 1 })).toBe(2)
  })

  it('applies operators across ranges inside an aggregate', () => {
    const cells = { A1: 1, A2: 2, A3: 3, B1: 4, B2: 5, B3: 6 }
    expect(calc('=SUM(A1:A3*B1:B3)', cells)).toBe(32)
    expect(calc('=SUMPRODUCT((A1:A3>1)*B1:B3)', cells)).toBe(11)
    expect(calc('=SUM(-A1:A3)', cells)).toBe(-6)
  })
})

describe('circular references', () => {
  it('marks a self reference', () => {
    const result = createFormulaSheet().compute({ A1: '=A1+1' })
    expect(result.get('A1')).toEqual({
      error: '#REF!',
      message: 'Circular reference',
    })
  })

  it('marks every cell of a cycle and lets dependants see the error', () => {
    const result = createFormulaSheet().compute({
      A1: '=B1',
      B1: '=C1',
      C1: '=A1',
      D1: '=A1*2',
      E1: 5,
      F1: '=E1+1',
    })
    for (const ref of ['A1', 'B1', 'C1']) {
      expect(message(result.get(ref) ?? null)).toBe('Circular reference')
    }
    expect(code(result.get('D1') ?? null)).toBe('#REF!')
    expect(result.get('F1')).toBe(6)
  })

  it('finds a cycle through a range', () => {
    const result = createFormulaSheet().compute({
      A1: 1,
      A2: 2,
      A3: '=SUM(A1:A3)',
    })
    expect(message(result.get('A3') ?? null)).toBe('Circular reference')
    const column = createFormulaSheet().compute({ A1: 1, B1: '=SUM(B:B)' })
    expect(message(column.get('B1') ?? null)).toBe('Circular reference')
  })

  it('evaluates a 5,000 cell chain without overflowing', () => {
    const cells: TFormulaCells = { A5000: 1 }
    for (let row = 1; row < 5000; row++) cells[`A${row}`] = `=A${row + 1}+1`
    const result = createFormulaSheet().compute(cells)
    expect(result.get('A1')).toBe(5000)
    expect(result.get('A4999')).toBe(2)
  })

  it('reports a 5,000 cell loop as circular', () => {
    const cells: TFormulaCells = { A5000: '=A1' }
    for (let row = 1; row < 5000; row++) cells[`A${row}`] = `=A${row + 1}+1`
    const result = createFormulaSheet().compute(cells)
    expect(message(result.get('A2500') ?? null)).toBe('Circular reference')
  })
})

describe('whole-column and whole-row ranges', () => {
  it('stop at the data on the sheet', () => {
    const cells = { A1: 1, A2: 2, A10: 3, B1: 'Apples', C5: 10 }
    expect(calc('=SUM(A:A)', cells)).toBe(6)
    expect(calc('=ROWS(A:A)', cells)).toBe(10)
    expect(calc('=COUNTBLANK(A:A)', cells)).toBe(7)
    expect(calc('=SUM(2:2)', cells)).toBe(2)
    // The formula itself sits in Z1, so the sheet is 26 columns wide.
    expect(calc('=COLUMNS(2:2)', cells)).toBe(26)
    expect(calc('=SUM(A:C)', cells)).toBe(16)
  })

  it('are empty on an empty sheet', () => {
    expect(calc('=SUM(B:B)')).toBe(0)
  })
})

describe('createFormulaSheet', () => {
  it('returns values for formula cells only', () => {
    const result = createFormulaSheet().compute({
      A1: 2,
      A2: '=A1*3',
      A3: 'Apples',
      A4: '=',
    })
    expect([...result.keys()]).toEqual(['A2'])
    expect(result.get('A2')).toBe(6)
  })

  it('evaluates formulas in any cell order', () => {
    const result = createFormulaSheet().compute({
      C1: '=B1+1',
      B1: '=A1+1',
      A1: 1,
    })
    expect(result.get('C1')).toBe(3)
  })

  it('reuses parsed formulas across calls and drops the ones that are gone', () => {
    const sheet = createFormulaSheet()
    sheet.compute({ A1: 1, B1: '=A1*2', B2: '=A1*2', C1: '=A1+1' })
    expect(sheet.cacheSize).toBe(2)
    const second = sheet.compute({ A1: 5, B1: '=A1*2', C1: '=A1+1' })
    expect(second.get('B1')).toBe(10)
    expect(sheet.cacheSize).toBe(2)
    sheet.compute({ A1: 5, B1: '=A1*3' })
    expect(sheet.cacheSize).toBe(1)
  })

  it('evaluates a rule against the last compute', () => {
    const sheet = createFormulaSheet()
    sheet.compute({ A1: 4, A2: '=A1*10' })
    expect(sheet.evaluate('=A2>30')).toBe(true)
    expect(sheet.evaluate('A1+A2')).toBe(44)
    expect(sheet.evaluate('=AND(A1>1, A2<100)')).toBe(true)
    expect(code(sheet.evaluate('=ROW()'))).toBe('#VALUE!')
    expect(code(sheet.evaluate('=1+'))).toBe('#ERROR!')
  })

  it('knows the current cell for ROW and COLUMN', () => {
    const result = createFormulaSheet().compute({ C4: '=ROW()*100+COLUMN()' })
    expect(result.get('C4')).toBe(403)
  })

  it('ignores keys that are not references', () => {
    const result = createFormulaSheet().compute({ foo: '=1', A1: '=2' })
    expect([...result.keys()]).toEqual(['A1'])
  })

  it('survives a deeply nested formula', () => {
    const deep = '=' + '('.repeat(20000) + '1' + ')'.repeat(20000)
    expect(code(calc(deep))).toBe('#ERROR!')
  })
})
