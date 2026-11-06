import { describe, it, expect } from 'vitest'
import { truncateMiddle } from '../src/utils/truncateMiddle.helper'

describe('truncateMiddle', () => {
  it('leaves a string that fits alone', () => {
    expect(truncateMiddle('Invoices', 20)).toBe('Invoices')
    expect(truncateMiddle('12345', 5)).toBe('12345')
  })

  it('keeps both ends and never exceeds max', () => {
    const out = truncateMiddle('quarterly-report-final-2026-11-05.pdf', 24)
    expect(out).toBe('quarterly-r...-11-05.pdf')
    expect(out.length).toBe(24)
  })

  it('gives the start the extra character when the room is odd', () => {
    expect(truncateMiddle('abcdefghij', 8)).toBe('abc...ij')
  })

  it('takes a custom separator', () => {
    expect(truncateMiddle('abcdefghij', 5, '/')).toBe('ab/ij')
  })

  it('never splits a code point', () => {
    const out = truncateMiddle('😀😀😀😀😀😀😀😀😀😀', 7)
    expect(Array.from(out)).toHaveLength(7)
    expect(out).toBe('😀😀...😀😀')
  })

  it('degrades to a plain cut when max leaves no room', () => {
    expect(truncateMiddle('abcdefghij', 2)).toBe('ab')
    expect(truncateMiddle('abcdefghij', 0)).toBe('')
  })
})
