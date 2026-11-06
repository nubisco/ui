import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Calendar from '../src/components/Calendar.vue'
import AiUsage from '../src/components/AiUsage.vue'

// The library used to fall back to one fixed non-English locale when the
// browser reported none. The fallback is now the browser's language, then
// English, so a consumer who passes nothing gets what the user reads.
afterEach(() => vi.restoreAllMocks())

describe('locale fallback', () => {
  it('NbCalendar follows navigator.language when no locale is passed', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE')
    const wrapper = mount(Calendar, {
      props: { modelValue: '2024-03-15' },
    })
    expect(wrapper.text()).toContain('MoDiMiDoFr')
  })

  it('NbCalendar falls back to English when the browser reports nothing', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('')
    const wrapper = mount(Calendar, {
      props: { modelValue: '2024-03-15' },
    })
    expect(wrapper.text()).toContain('MonTueWed')
  })

  it('NbAiUsage formats counts for its locale', () => {
    const wrapper = mount(AiUsage, {
      props: { hasKey: true, requests: 12345, locale: 'de-DE' },
    })
    expect(wrapper.text()).toContain('12.345')
  })
})
