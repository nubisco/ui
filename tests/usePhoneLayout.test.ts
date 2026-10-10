import { describe, expect, it, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  NB_PHONE_QUERY,
  NB_PHONE_TOUCH_QUERY,
  resetPhoneLayoutForTests,
  usePhoneLayout,
} from '../src/composables/usePhoneLayout.composable'

describe('usePhoneLayout', () => {
  afterEach(() => {
    resetPhoneLayoutForTests()
    vi.unstubAllGlobals()
  })

  it('matches the SCSS phone queries, so styles and script agree', () => {
    const scss = readFileSync(
      resolve(__dirname, '../src/styles/variables/_breakpoints.scss'),
      'utf8',
    )
    const md = Number(/\$bp-md:\s*(\d+)/.exec(scss)![1])
    const expand = (q: string) =>
      q.replace('#{$bp-md - 0.02}', String(Math.round((md - 0.02) * 100) / 100))
    const phone = /\$phone-query:\s*'([^']+)'/.exec(scss)![1]
    const touch = /\$phone-touch-query:\s*'([^']+)'/.exec(scss)![1]
    expect(expand(phone)).toBe(NB_PHONE_QUERY)
    expect(expand(touch)).toBe(NB_PHONE_TOUCH_QUERY)
  })

  it('answers desktop when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { phone, phoneTouch } = usePhoneLayout()
    expect(phone.value).toBe(false)
    expect(phoneTouch.value).toBe(false)
  })

  it('follows the media query', () => {
    const listeners: Record<string, (e: { matches: boolean }) => void> = {}
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === NB_PHONE_QUERY,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
        (listeners[q] = fn),
    }))
    const { phone, phoneTouch } = usePhoneLayout()
    expect(phone.value).toBe(true)
    expect(phoneTouch.value).toBe(false)
    listeners[NB_PHONE_TOUCH_QUERY]({ matches: true })
    expect(phoneTouch.value).toBe(true)
  })
})
