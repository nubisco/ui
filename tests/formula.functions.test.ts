import { describe, expect, it } from 'vitest'
import {
  createFormulaSheet,
  FORMULA_FUNCTIONS,
  isFormulaError,
  type TFormulaCells,
  type TFormulaValue,
} from '../src/formula'

/** Evaluates one formula in Z1 of a sheet holding the given cells. */
function calc(formula: string, cells: TFormulaCells = DATA): TFormulaValue {
  return (
    createFormulaSheet()
      .compute({ ...cells, Z1: formula })
      .get('Z1') ?? null
  )
}

const code = (value: TFormulaValue) =>
  isFormulaError(value) ? value.error : null

// A small price list: names in A, quantities in B, prices in C. B6 holds
// text and A7:C7 are empty, so the skipping rules have something to skip.
const DATA: TFormulaCells = {
  A1: 'Fruit',
  B1: 'Qty',
  C1: 'Price',
  A2: 'Apples',
  B2: 10,
  C2: 1.5,
  A3: 'Pears',
  B3: 4,
  C3: 2,
  A4: 'Plums',
  B4: 7,
  C4: 3,
  A5: 'apples',
  B5: 1,
  C5: 1.25,
  A6: 'Kiwis',
  B6: 'none',
  C6: 5,
  B8: true,
}

const tested = new Set<string>()
/** Records which functions a test covers, so the last test can check none was missed. */
function covers(...names: string[]) {
  for (const name of names) tested.add(name)
}

describe('math', () => {
  it('SUM, PRODUCT', () => {
    covers('SUM', 'PRODUCT')
    expect(calc('=SUM(B2:B6)')).toBe(22)
    expect(calc('=SUM(B2:B8)')).toBe(22) // TRUE in B8 is skipped in a range
    expect(calc('=SUM(1, TRUE, "2")')).toBe(4) // direct arguments convert
    expect(code(calc('=SUM(1, "x")'))).toBe('#VALUE!')
    expect(calc('=SUM(B6)')).toBe(0) // text in a reference is skipped
    expect(calc('=PRODUCT(B3:B5)')).toBe(28)
    expect(calc('=PRODUCT(A1:A2)')).toBe(0)
  })

  it('SUMIF, SUMIFS', () => {
    covers('SUMIF', 'SUMIFS')
    expect(calc('=SUMIF(A2:A6, "apples", B2:B6)')).toBe(11)
    expect(calc('=SUMIF(B2:B6, ">5")')).toBe(17)
    expect(calc('=SUMIF(A2:A6, "P*", C2:C6)')).toBe(5)
    expect(calc('=SUMIFS(B2:B6, A2:A6, "?????", C2:C6, ">=2")')).toBe(11)
    expect(code(calc('=SUMIFS(B2:B6, A2:A5, "x")'))).toBe('#VALUE!')
  })

  it('SUMPRODUCT', () => {
    covers('SUMPRODUCT')
    expect(calc('=SUMPRODUCT(B2:B5, C2:C5)')).toBe(15 + 8 + 21 + 1.25)
    expect(calc('=SUMPRODUCT(B2:B6, C2:C6)')).toBe(45.25) // text counts as 0
    expect(code(calc('=SUMPRODUCT(B2:B5, C2:C6)'))).toBe('#VALUE!')
  })

  it('ROUND, ROUNDUP, ROUNDDOWN, INT, TRUNC', () => {
    covers('ROUND', 'ROUNDUP', 'ROUNDDOWN', 'INT', 'TRUNC')
    expect(calc('=ROUND(2.5)')).toBe(3)
    expect(calc('=ROUND(-2.5)')).toBe(-3)
    expect(calc('=ROUND(1.005, 2)')).toBe(1.01)
    expect(calc('=ROUND(1234.5, -2)')).toBe(1200)
    expect(calc('=ROUNDUP(1.21, 1)')).toBe(1.3)
    expect(calc('=ROUNDUP(-1.21, 1)')).toBe(-1.3)
    expect(calc('=ROUNDDOWN(1.29, 1)')).toBe(1.2)
    expect(calc('=ROUNDDOWN(-1.29, 1)')).toBe(-1.2)
    expect(calc('=INT(-1.5)')).toBe(-2)
    expect(calc('=INT(1.9)')).toBe(1)
    expect(calc('=TRUNC(-1.59)')).toBe(-1)
    expect(calc('=TRUNC(1.567, 2)')).toBe(1.56)
  })

  it('ABS, MOD, POWER, SQRT, SIGN', () => {
    covers('ABS', 'MOD', 'POWER', 'SQRT', 'SIGN')
    expect(calc('=ABS(-3)')).toBe(3)
    expect(calc('=MOD(7, 3)')).toBe(1)
    expect(calc('=MOD(-7, 3)')).toBe(2)
    expect(calc('=MOD(7, -3)')).toBe(-2)
    expect(code(calc('=MOD(1, 0)'))).toBe('#DIV/0!')
    expect(calc('=POWER(2, 10)')).toBe(1024)
    expect(code(calc('=POWER(0, 0)'))).toBe('#NUM!')
    expect(calc('=SQRT(16)')).toBe(4)
    expect(code(calc('=SQRT(-1)'))).toBe('#NUM!')
    expect(calc('=SIGN(-4)')).toBe(-1)
    expect(calc('=SIGN(0)')).toBe(0)
  })

  it('EXP, LN, LOG, LOG10, PI', () => {
    covers('EXP', 'LN', 'LOG', 'LOG10', 'PI')
    expect(calc('=EXP(0)')).toBe(1)
    expect(calc('=LN(EXP(2))')).toBeCloseTo(2)
    expect(code(calc('=LN(0)'))).toBe('#NUM!')
    expect(calc('=LOG(100)')).toBeCloseTo(2)
    expect(calc('=LOG(8, 2)')).toBeCloseTo(3)
    expect(code(calc('=LOG(8, 1)'))).toBe('#DIV/0!')
    expect(calc('=LOG10(1000)')).toBe(3)
    expect(calc('=PI()')).toBe(Math.PI)
  })

  it('CEILING, FLOOR', () => {
    covers('CEILING', 'FLOOR')
    expect(calc('=CEILING(2.1)')).toBe(3)
    expect(calc('=CEILING(22, 5)')).toBe(25)
    expect(calc('=CEILING(-2.5, 1)')).toBe(-2)
    expect(calc('=CEILING(-2.5, -2)')).toBe(-4)
    expect(code(calc('=CEILING(2.5, -1)'))).toBe('#NUM!')
    expect(calc('=FLOOR(0.7, 0.1)')).toBeCloseTo(0.7)
    expect(calc('=FLOOR(22, 5)')).toBe(20)
    expect(code(calc('=FLOOR(1, 0)'))).toBe('#DIV/0!')
  })
})

describe('statistical', () => {
  it('AVERAGE, AVERAGEIF, AVERAGEIFS', () => {
    covers('AVERAGE', 'AVERAGEIF', 'AVERAGEIFS')
    expect(calc('=AVERAGE(B2:B6)')).toBe(5.5)
    expect(code(calc('=AVERAGE(A2:A3)'))).toBe('#DIV/0!')
    expect(calc('=AVERAGEIF(A2:A6, "apples", B2:B6)')).toBe(5.5)
    expect(code(calc('=AVERAGEIF(A2:A6, "Figs", B2:B6)'))).toBe('#DIV/0!')
    expect(calc('=AVERAGEIFS(C2:C6, B2:B6, ">1", B2:B6, "<10")')).toBe(2.5)
  })

  it('COUNT, COUNTA, COUNTBLANK', () => {
    covers('COUNT', 'COUNTA', 'COUNTBLANK')
    expect(calc('=COUNT(B1:B8)')).toBe(4)
    expect(calc('=COUNT(1, "2", "x", TRUE)')).toBe(3)
    expect(calc('=COUNTA(A1:C8)')).toBe(19)
    expect(calc('=COUNTBLANK(A1:C8)')).toBe(5)
  })

  it('COUNTIF with every kind of criterion', () => {
    covers('COUNTIF')
    expect(calc('=COUNTIF(B2:B6, 4)')).toBe(1)
    expect(calc('=COUNTIF(B2:B6, ">4")')).toBe(2)
    expect(calc('=COUNTIF(B2:B6, "<=4")')).toBe(2)
    expect(calc('=COUNTIF(B2:B6, "<>4")')).toBe(4)
    expect(calc('=COUNTIF(A2:A6, "apples")')).toBe(2)
    expect(calc('=COUNTIF(A2:A6, "=pears")')).toBe(1)
    expect(calc('=COUNTIF(A2:A6, "<>apples")')).toBe(3)
    expect(calc('=COUNTIF(A2:A6, "p*")')).toBe(2)
    expect(calc('=COUNTIF(A2:A6, "?ears")')).toBe(1)
    expect(calc('=COUNTIF(A2:A6, ">m")')).toBe(2)
    expect(calc('=COUNTIF(A7:C8, "")')).toBe(5)
    expect(calc('=COUNTIF(A1:C8, "<>")')).toBe(19)
    expect(calc('=COUNTIF(B1:B8, TRUE)')).toBe(1)
    expect(calc('=COUNTIF(B2:B6, "4")')).toBe(1)
    expect(calc('=COUNTIF(B2:B6, ">"&B4)')).toBe(1)
  })

  it('wildcards can be escaped with ~', () => {
    const cells = { A1: 'a*b', A2: 'axb', A3: 'a?', A4: 'ab' }
    expect(calc('=COUNTIF(A1:A4, "a~*b")', cells)).toBe(1)
    expect(calc('=COUNTIF(A1:A4, "a*b")', cells)).toBe(3)
    expect(calc('=COUNTIF(A1:A4, "a~?")', cells)).toBe(1)
  })

  it('COUNTIFS', () => {
    covers('COUNTIFS')
    expect(calc('=COUNTIFS(A2:A6, "*s", B2:B6, ">1")')).toBe(3)
    expect(calc('=COUNTIFS(A2:A6, "apples", C2:C6, "<1.5")')).toBe(1)
    expect(code(calc('=COUNTIFS(A2:A6, "x", B2:B3, 1)'))).toBe('#VALUE!')
  })

  it('MIN, MAX, MEDIAN', () => {
    covers('MIN', 'MAX', 'MEDIAN')
    expect(calc('=MIN(B2:B6)')).toBe(1)
    expect(calc('=MAX(B2:B6)')).toBe(10)
    expect(calc('=MAX(A1:A3)')).toBe(0)
    expect(calc('=MEDIAN(B2:B6)')).toBe(5.5)
    expect(calc('=MEDIAN(1, 2, 3)')).toBe(2)
    expect(code(calc('=MEDIAN(A1:A2)'))).toBe('#NUM!')
  })

  it('LARGE, SMALL', () => {
    covers('LARGE', 'SMALL')
    expect(calc('=LARGE(B2:B6, 1)')).toBe(10)
    expect(calc('=LARGE(B2:B6, 2)')).toBe(7)
    expect(calc('=SMALL(B2:B6, 2)')).toBe(4)
    expect(code(calc('=SMALL(B2:B6, 5)'))).toBe('#NUM!')
  })

  it('STDEV, VAR', () => {
    covers('STDEV', 'VAR')
    expect(calc('=VAR(2, 4, 4, 4, 5, 5, 7, 9)')).toBeCloseTo(32 / 7)
    expect(calc('=STDEV(2, 4, 4, 4, 5, 5, 7, 9)')).toBeCloseTo(
      Math.sqrt(32 / 7),
    )
    expect(code(calc('=STDEV(1)'))).toBe('#DIV/0!')
  })
})

describe('logical', () => {
  it('IF evaluates only the branch it takes', () => {
    covers('IF')
    expect(calc('=IF(B2>5, "many", "few")')).toBe('many')
    expect(calc('=IF(FALSE, 1/0, 2)')).toBe(2)
    expect(calc('=IF(TRUE, 2, 1/0)')).toBe(2)
    expect(calc('=IF(FALSE, 1)')).toBe(false)
    expect(calc('=IF(TRUE,,1)')).toBe(0)
    expect(code(calc('=IF("x", 1, 2)'))).toBe('#VALUE!')
    expect(code(calc('=IF(1/0, 1, 2)'))).toBe('#DIV/0!')
  })

  it('IFS', () => {
    covers('IFS')
    expect(calc('=IFS(B2<5, "low", B2<20, "mid")')).toBe('mid')
    expect(calc('=IFS(TRUE, 1, 1/0, 2)')).toBe(1)
    expect(code(calc('=IFS(FALSE, 1)'))).toBe('#N/A')
    expect(code(calc('=IFS(TRUE, 1, FALSE)'))).toBe('#N/A')
  })

  it('IFERROR, IFNA', () => {
    covers('IFERROR', 'IFNA')
    expect(calc('=IFERROR(1/0, "none")')).toBe('none')
    expect(calc('=IFERROR(3, 1/0)')).toBe(3)
    expect(calc('=IFNA(NA(), 0)')).toBe(0)
    expect(code(calc('=IFNA(1/0, 0)'))).toBe('#DIV/0!')
  })

  it('AND, OR, XOR, NOT', () => {
    covers('AND', 'OR', 'XOR', 'NOT')
    expect(calc('=AND(TRUE, 1)')).toBe(true)
    expect(calc('=AND(TRUE, 0)')).toBe(false)
    expect(calc('=AND(B2:B6)')).toBe(true) // text in the range is skipped
    expect(code(calc('=AND(A1:A2)'))).toBe('#VALUE!')
    expect(code(calc('=AND(FALSE, 1/0)'))).toBe('#DIV/0!')
    expect(calc('=OR(FALSE, B8)')).toBe(true)
    expect(calc('=XOR(TRUE, TRUE, TRUE)')).toBe(true)
    expect(calc('=XOR(TRUE, TRUE)')).toBe(false)
    expect(calc('=NOT(B2>5)')).toBe(false)
  })

  it('SWITCH', () => {
    covers('SWITCH')
    expect(calc('=SWITCH(A3, "Apples", 1, "pears", 2)')).toBe(2)
    expect(calc('=SWITCH(9, 1, "a", "other")')).toBe('other')
    expect(code(calc('=SWITCH(9, 1, "a")'))).toBe('#N/A')
    expect(calc('=SWITCH(1, 1, "a", 2, 1/0)')).toBe('a')
  })

  it('TRUE, FALSE', () => {
    covers('TRUE', 'FALSE')
    expect(calc('=TRUE()')).toBe(true)
    expect(calc('=FALSE()')).toBe(false)
  })
})

describe('text', () => {
  it('CONCAT, CONCATENATE, TEXTJOIN', () => {
    covers('CONCAT', 'CONCATENATE', 'TEXTJOIN')
    expect(calc('=CONCAT(A2:A3, 1)')).toBe('ApplesPears1')
    expect(calc('=CONCATENATE("a", 1.5, TRUE)')).toBe('a1.5TRUE')
    expect(calc('=TEXTJOIN(", ", TRUE, A6:A8, "end")')).toBe('Kiwis, end')
    expect(calc('=TEXTJOIN("-", FALSE, A6:A7)')).toBe('Kiwis-')
  })

  it('LEN, LEFT, RIGHT, MID', () => {
    covers('LEN', 'LEFT', 'RIGHT', 'MID')
    expect(calc('=LEN(A2)')).toBe(6)
    expect(calc('=LEFT(A2)')).toBe('A')
    expect(calc('=LEFT(A2, 3)')).toBe('App')
    expect(calc('=RIGHT(A2, 2)')).toBe('es')
    expect(calc('=RIGHT("ab", 5)')).toBe('ab')
    expect(calc('=MID(A2, 2, 3)')).toBe('ppl')
    expect(code(calc('=MID(A2, 0, 3)'))).toBe('#VALUE!')
    expect(code(calc('=LEFT(A2, -1)'))).toBe('#VALUE!')
  })

  it('UPPER, LOWER, PROPER, TRIM', () => {
    covers('UPPER', 'LOWER', 'PROPER', 'TRIM')
    expect(calc('=UPPER(A2)')).toBe('APPLES')
    expect(calc('=LOWER(A2)')).toBe('apples')
    expect(calc('=PROPER("green aPPLES, red-pears")')).toBe(
      'Green Apples, Red-Pears',
    )
    expect(calc('=TRIM("  two   apples ")')).toBe('two apples')
  })

  it('SUBSTITUTE, REPLACE', () => {
    covers('SUBSTITUTE', 'REPLACE')
    expect(calc('=SUBSTITUTE("a-b-c", "-", "+")')).toBe('a+b+c')
    expect(calc('=SUBSTITUTE("a-b-c", "-", "+", 2)')).toBe('a-b+c')
    expect(calc('=SUBSTITUTE("a-b", "-", "+", 5)')).toBe('a-b')
    expect(calc('=REPLACE("Apples", 1, 1, "Gr")')).toBe('Grpples')
  })

  it('FIND, SEARCH', () => {
    covers('FIND', 'SEARCH')
    expect(calc('=FIND("p", "Apples")')).toBe(2)
    expect(calc('=FIND("p", "Apples", 3)')).toBe(3)
    expect(code(calc('=FIND("P", "Apples")'))).toBe('#VALUE!')
    expect(calc('=SEARCH("P", "Apples")')).toBe(2)
    expect(calc('=SEARCH("l?s", "Apples")')).toBe(4)
    expect(code(calc('=SEARCH("x", "Apples")'))).toBe('#VALUE!')
  })

  it('REPT, EXACT, VALUE', () => {
    covers('REPT', 'EXACT', 'VALUE')
    expect(calc('=REPT("ab", 3)')).toBe('ababab')
    expect(code(calc('=REPT("ab", 100000)'))).toBe('#VALUE!')
    expect(calc('=EXACT("Apples", A2)')).toBe(true)
    expect(calc('=EXACT("apples", A2)')).toBe(false)
    expect(calc('=VALUE("1.5e2")')).toBe(150)
    expect(calc('=VALUE(B2)')).toBe(10)
    expect(code(calc('=VALUE("ten")'))).toBe('#VALUE!')
  })
})

describe('lookup', () => {
  it('VLOOKUP exact and approximate', () => {
    covers('VLOOKUP')
    expect(calc('=VLOOKUP("pears", A2:C6, 3, FALSE)')).toBe(2)
    expect(calc('=VLOOKUP("Pl*", A2:C6, 2, FALSE)')).toBe(7)
    expect(code(calc('=VLOOKUP("Figs", A2:C6, 2, FALSE)'))).toBe('#N/A')
    expect(code(calc('=VLOOKUP("Pears", A2:C6, 4, FALSE)'))).toBe('#REF!')
    expect(code(calc('=VLOOKUP("Pears", A2:C6, 0, FALSE)'))).toBe('#VALUE!')
    const grades = {
      A1: 0,
      B1: 'F',
      A2: 50,
      B2: 'C',
      A3: 70,
      B3: 'B',
      A4: 90,
      B4: 'A',
    }
    expect(calc('=VLOOKUP(75, A1:B4, 2)', grades)).toBe('B')
    expect(calc('=VLOOKUP(90, A1:B4, 2, TRUE)', grades)).toBe('A')
    expect(code(calc('=VLOOKUP(-1, A1:B4, 2)', grades))).toBe('#N/A')
  })

  it('HLOOKUP', () => {
    covers('HLOOKUP')
    expect(calc('=HLOOKUP("Price", A1:C6, 3, FALSE)')).toBe(2)
    expect(code(calc('=HLOOKUP("Cost", A1:C6, 3, FALSE)'))).toBe('#N/A')
  })

  it('INDEX', () => {
    covers('INDEX')
    expect(calc('=INDEX(A2:C6, 2, 3)')).toBe(2)
    expect(calc('=INDEX(B2:B6, 3)')).toBe(7)
    expect(calc('=INDEX(A1:C1, 2)')).toBe('Qty')
    expect(calc('=SUM(INDEX(A2:C6, 0, 2))')).toBe(22)
    expect(calc('=ROW(INDEX(A2:C6, 2, 1))')).toBe(3)
    expect(code(calc('=INDEX(A2:C6, 9, 1)'))).toBe('#REF!')
  })

  it('MATCH in every mode', () => {
    covers('MATCH')
    expect(calc('=MATCH("plums", A2:A6, 0)')).toBe(3)
    expect(calc('=MATCH("k*", A2:A6, 0)')).toBe(5)
    expect(code(calc('=MATCH("Figs", A2:A6, 0)'))).toBe('#N/A')
    const ascending = { A1: 10, A2: 20, A3: 30 }
    expect(calc('=MATCH(25, A1:A3)', ascending)).toBe(2)
    expect(calc('=MATCH(30, A1:A3, 1)', ascending)).toBe(3)
    expect(code(calc('=MATCH(5, A1:A3, 1)', ascending))).toBe('#N/A')
    const descending = { A1: 30, A2: 20, A3: 10 }
    expect(calc('=MATCH(25, A1:A3, -1)', descending)).toBe(1)
    expect(calc('=MATCH(15, A1:A3, -1)', descending)).toBe(2)
    expect(code(calc('=MATCH(1, A1:B2, 0)', descending))).toBe('#N/A')
  })

  it('XLOOKUP', () => {
    covers('XLOOKUP')
    expect(calc('=XLOOKUP("plums", A2:A6, C2:C6)')).toBe(3)
    expect(calc('=XLOOKUP("Figs", A2:A6, C2:C6, "none")')).toBe('none')
    expect(code(calc('=XLOOKUP("Figs", A2:A6, C2:C6)'))).toBe('#N/A')
    expect(calc('=XLOOKUP("apples", A2:A6, B2:B6, , 0, -1)')).toBe(1)
    expect(calc('=XLOOKUP("p*", A2:A6, B2:B6, , 2)')).toBe(4)
    expect(code(calc('=XLOOKUP("p*", A2:A6, B2:B6)'))).toBe('#N/A')
    expect(calc('=XLOOKUP(5, B2:B5, A2:A5, , -1)')).toBe('Pears')
    expect(calc('=XLOOKUP(5, B2:B5, A2:A5, , 1)')).toBe('Plums')
    expect(calc('=XLOOKUP("Qty", A1:C1, A3:C3)')).toBe(4)
    expect(calc('=SUM(XLOOKUP("Pears", A2:A6, B2:C6))')).toBe(6)
    expect(calc('=XLOOKUP("Pears", A2:A6, C2:C6, 1/0)')).toBe(2)
    expect(code(calc('=XLOOKUP("Pears", A2:A6, C2:C5)'))).toBe('#VALUE!')
  })

  it('CHOOSE evaluates only the value it picks', () => {
    covers('CHOOSE')
    expect(calc('=CHOOSE(2, "a", "b", 1/0)')).toBe('b')
    expect(code(calc('=CHOOSE(4, "a", "b", "c")'))).toBe('#VALUE!')
    expect(calc('=SUM(CHOOSE(1, B2:B3, C2:C3))')).toBe(14)
  })

  it('ROWS, COLUMNS, ROW, COLUMN', () => {
    covers('ROWS', 'COLUMNS', 'ROW', 'COLUMN')
    expect(calc('=ROWS(A2:C6)')).toBe(5)
    expect(calc('=COLUMNS(A2:C6)')).toBe(3)
    expect(calc('=ROWS(5)')).toBe(1)
    expect(calc('=ROW(C7)')).toBe(7)
    expect(calc('=COLUMN(C7)')).toBe(3)
    expect(calc('=ROW()')).toBe(1)
    expect(calc('=COLUMN()')).toBe(26)
    expect(code(calc('=ROW(5)'))).toBe('#VALUE!')
  })
})

describe('information', () => {
  it('ISBLANK, ISNUMBER, ISTEXT, ISLOGICAL', () => {
    covers('ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISLOGICAL')
    expect(calc('=ISBLANK(A7)')).toBe(true)
    expect(calc('=ISBLANK(A2)')).toBe(false)
    expect(calc('=ISBLANK("")')).toBe(false)
    expect(calc('=ISNUMBER(B2)')).toBe(true)
    expect(calc('=ISNUMBER(B6)')).toBe(false)
    expect(calc('=ISTEXT(A2)')).toBe(true)
    expect(calc('=ISLOGICAL(B8)')).toBe(true)
    expect(code(calc('=ISTEXT(A1:A2)'))).toBe('#VALUE!')
  })

  it('ISERROR, ISNA, NA', () => {
    covers('ISERROR', 'ISNA', 'NA')
    expect(calc('=ISERROR(1/0)')).toBe(true)
    expect(calc('=ISERROR(1)')).toBe(false)
    expect(calc('=ISNA(NA())')).toBe(true)
    expect(calc('=ISNA(1/0)')).toBe(false)
    expect(code(calc('=NA()'))).toBe('#N/A')
  })
})

describe('coverage', () => {
  it('tests every function in the catalogue', () => {
    const missing = FORMULA_FUNCTIONS.map((fn) => fn.name).filter(
      (name) => !tested.has(name),
    )
    expect(missing).toEqual([])
  })
})
