import { describe, expect, it } from 'vitest'
import { fitActions } from '../src/utils/actionFit.helper'

describe('fitActions', () => {
  it('keeps every action when they all fit', () => {
    expect(fitActions([80, 100, 90], 286, 32, 8)).toBe(3)
  })

  it('makes room for the trigger once one action folds', () => {
    // 80 + 8 + 100 + 8 + 90 = 286 does not fit 280. With the trigger:
    // 32 + 8 + 80 + 8 + 100 = 228 fits, adding 90 does not.
    expect(fitActions([80, 100, 90], 280, 32, 8)).toBe(2)
  })

  it('folds everything when only the trigger fits', () => {
    expect(fitActions([80, 100], 40, 32, 8)).toBe(0)
  })

  it('never folds an unmeasured row', () => {
    expect(fitActions([80, 100], 0, 32, 8)).toBe(2)
  })
})
