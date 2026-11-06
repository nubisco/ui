import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AiLabel from '../src/components/AiLabel.vue'

describe('AiLabel', () => {
  const createWrapper = (props = {}, attrs = {}) =>
    mount(AiLabel, { props, attrs })

  it('renders the AI glyph', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies default variant class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-ai-label__default')
  })

  it('applies inline variant class', () => {
    const wrapper = createWrapper({ variant: 'inline' })
    expect(wrapper.classes()).toContain('nb-ai-label__inline')
  })

  it.each(['sm', 'md', 'lg'])('applies the %s size class', (size) => {
    const wrapper = createWrapper({ size })
    expect(wrapper.classes()).toContain(`nb-ai-label__${size}`)
  })

  it('applies medium size class by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-ai-label__md')
  })

  it('shows dot element in inline variant', () => {
    const wrapper = createWrapper({ variant: 'inline' })
    expect(wrapper.find('.nb-ai-label--dot').exists()).toBe(true)
  })

  it('does not show dot in default variant', () => {
    const wrapper = createWrapper({ variant: 'default' })
    expect(wrapper.find('.nb-ai-label--dot').exists()).toBe(false)
  })

  describe('inline text', () => {
    it('says "AI" beside the dot by default, as text', () => {
      const wrapper = createWrapper({ variant: 'inline' })
      expect(wrapper.find('.nb-ai-label--text').text()).toBe('AI')
      expect(wrapper.find('svg').exists()).toBe(false)
    })

    it('says the word it is given, so it can be localised', () => {
      const wrapper = createWrapper({ variant: 'inline', text: 'IA' })
      expect(wrapper.find('.nb-ai-label--text').text()).toBe('IA')
    })

    it('draws the glyph when the text is empty', () => {
      const wrapper = createWrapper({ variant: 'inline', text: '' })
      expect(wrapper.find('.nb-ai-label--text').exists()).toBe(false)
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('a label with nothing to do', () => {
    it('is a mark, never an inert button', () => {
      const wrapper = createWrapper()
      expect(wrapper.element.tagName.toLowerCase()).toBe('span')
      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Written by AI')
      expect(wrapper.classes()).toContain('nb-ai-label__static')
    })

    it('names the mark with its label', () => {
      const wrapper = createWrapper({ static: true, label: 'AI summary' })
      expect(wrapper.attributes('aria-label')).toBe('AI summary')
    })

    it('hides the glyph from assistive technology', () => {
      const wrapper = createWrapper({ static: true })
      expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('a label with a click listener', () => {
    it('is a button with an accessible name', () => {
      const onClick = vi.fn()
      const wrapper = createWrapper({}, { onClick })
      expect(wrapper.element.tagName.toLowerCase()).toBe('button')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.attributes('aria-label')).toBe('AI, show information')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('nb-ai-label__static')
    })

    it('takes its name from label', () => {
      const wrapper = createWrapper(
        { label: 'About this summary' },
        { onClick: vi.fn() },
      )
      expect(wrapper.attributes('aria-label')).toBe('About this summary')
    })

    it('calls the listener on click', async () => {
      const onClick = vi.fn()
      const wrapper = createWrapper({}, { onClick })
      await wrapper.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('stays a mark when static is set', () => {
      const wrapper = createWrapper({ static: true }, { onClick: vi.fn() })
      expect(wrapper.element.tagName.toLowerCase()).toBe('span')
      expect(wrapper.attributes('role')).toBe('img')
    })
  })
})
