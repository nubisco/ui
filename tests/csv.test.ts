import { describe, it, expect } from 'vitest'
import { parseCsv, toCsv } from '../src/utils/csv.helper'

describe('parseCsv', () => {
  it('reads quoted fields with delimiters, quotes and line breaks', () => {
    expect(
      parseCsv('Item,Note\r\nApples,"Red, ""crisp""\nand sweet"\n'),
    ).toEqual([
      ['Item', 'Note'],
      ['Apples', 'Red, "crisp"\nand sweet'],
    ])
  })

  it('keeps empty fields and a trailing empty field', () => {
    expect(parseCsv('a,,c,\n,,,')).toEqual([
      ['a', '', 'c', ''],
      ['', '', '', ''],
    ])
  })

  it('takes the delimiter the first line uses most', () => {
    expect(parseCsv('Item;Price\nPears;1,5')).toEqual([
      ['Item', 'Price'],
      ['Pears', '1,5'],
    ])
    expect(parseCsv('a\tb\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('drops a byte order mark and reads a lone carriage return as a break', () => {
    expect(parseCsv('﻿a,b\r1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('toCsv', () => {
  it('quotes only the fields that need it', () => {
    expect(
      toCsv([
        ['Item', 'Note', 'Qty'],
        ['Apples', 'Red, crisp', 3],
        ['Say "hi"', null, undefined],
      ]),
    ).toBe('Item,Note,Qty\r\nApples,"Red, crisp",3\r\n"Say ""hi""",,')
  })

  it('round-trips through parseCsv with another delimiter', () => {
    const rows = [
      ['a;b', 'c\nd'],
      ['', 'e'],
    ]
    expect(parseCsv(toCsv(rows, ';'), ';')).toEqual(rows)
  })
})
