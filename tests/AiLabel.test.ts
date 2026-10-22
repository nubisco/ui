import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AiLabel from '../src/components/AiLabel.vue'

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'align', 'justify', 'gap'],
  template:
    '<component :is="is || \'div\'" v-bind="$attrs" :class="$attrs.class"><slot /></component>',
}

describe('AiLabel', () => {
  const createWrapper = (props = {}) =>
    mount(AiLabel, {
      props,
      global: { stubs: { NbGrid: NbGridStub } },
    })

  it('renders the AI SVG icon', () => {
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

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.classes()).toContain('nb-ai-label__lg')
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

  it('renders as a button', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('button')
  })

  it('renders a static mark as an image, not a button', () => {
    const wrapper = createWrapper({ static: true })
    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Written by AI')
    expect(wrapper.classes()).toContain('nb-ai-label__static')
  })

  it('names a static mark with its label', () => {
    const wrapper = createWrapper({ static: true, label: 'AI summary' })
    expect(wrapper.attributes('aria-label')).toBe('AI summary')
  })

  it('keeps the button free of image semantics', () => {
    const wrapper = createWrapper()
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('hides the glyph from assistive technology', () => {
    const wrapper = createWrapper({ static: true })
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
