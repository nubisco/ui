import { describe, it, expect } from 'vitest'
import { pluralize } from '../src/utils/pluralize.helper'

const cards = { one: '{count} card', other: '{count} cards' }

describe('pluralize', () => {
  it('picks one and other in English', () => {
    expect(pluralize(1, cards)).toBe('1 card')
    expect(pluralize(0, cards)).toBe('0 cards')
    expect(pluralize(2, cards)).toBe('2 cards')
  })

  it('formats the count for the locale', () => {
    expect(pluralize(1200, cards, 'en-US')).toBe('1,200 cards')
    expect(pluralize(1200, cards, 'de')).toBe('1.200 cards')
  })

  it('uses the forms a locale has beyond one and other', () => {
    const files = {
      one: '{count} plik',
      few: '{count} pliki',
      many: '{count} plików',
      other: '{count} pliku',
    }
    expect(pluralize(1, files, 'pl')).toBe('1 plik')
    expect(pluralize(3, files, 'pl')).toBe('3 pliki')
    expect(pluralize(5, files, 'pl')).toBe('5 plików')
  })

  it('falls back to other when the locale needs a form that was not given', () => {
    expect(pluralize(3, cards, 'pl')).toBe('3 cards')
  })

  it('returns a form without a placeholder as it is', () => {
    expect(pluralize(4, { one: 'item', other: 'items' })).toBe('items')
  })
})
