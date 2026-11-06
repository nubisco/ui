import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '../src/components/Badge.vue'

describe('Badge', () => {
  it('renders slot content', () => {
    const wrapper = mount(Badge, { slots: { default: 'Active' } })
    expect(wrapper.text()).toBe('Active')
  })

  it('applies the neutral intent by default', () => {
    const wrapper = mount(Badge)
    expect(wrapper.classes()).toContain('nb-badge--neutral')
  })

  it('applies every intent class', () => {
    const variants = [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
      'primary',
    ] as const
    for (const variant of variants) {
      const wrapper = mount(Badge, { props: { variant } })
      expect(wrapper.classes()).toContain(`nb-badge--${variant}`)
    }
  })

  it('renders a colour-named variant as its intent, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const aliases = {
      grey: 'neutral',
      blue: 'info',
      green: 'success',
      orange: 'warning',
      red: 'danger',
      purple: 'primary',
    } as const
    for (const [variant, intent] of Object.entries(aliases)) {
      const wrapper = mount(Badge, {
        props: { variant: variant as keyof typeof aliases },
      })
      expect(wrapper.classes()).toContain(`nb-badge--${intent}`)
      expect(wrapper.classes()).not.toContain(`nb-badge--${variant}`)
    }
    mount(Badge, { props: { variant: 'grey' } })
    const calls = warn.mock.calls.filter((c) =>
      String(c[0]).includes('[NbBadge]'),
    )
    expect(calls).toHaveLength(6)
    warn.mockRestore()
  })

  it('applies default medium size class', () => {
    const wrapper = mount(Badge)
    expect(wrapper.classes()).toContain('nb-badge--md')
  })

  it('applies small size class', () => {
    const wrapper = mount(Badge, { props: { size: 'sm' } })
    expect(wrapper.classes()).toContain('nb-badge--sm')
  })

  it('renders dot when dot prop is true', () => {
    const wrapper = mount(Badge, { props: { dot: true } })
    expect(wrapper.find('.nb-badge__dot').exists()).toBe(true)
  })

  it('does not render dot by default', () => {
    const wrapper = mount(Badge)
    expect(wrapper.find('.nb-badge__dot').exists()).toBe(false)
  })

  it('renders as span element', () => {
    const wrapper = mount(Badge)
    expect(wrapper.element.tagName.toLowerCase()).toBe('span')
  })

  describe('as a placeholder', () => {
    it('stays a quiet span by default, so nothing existing changes', () => {
      const wrapper = mount(Badge, { slots: { default: 'x' } })
      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.classes()).not.toContain('nb-badge--placeholder')
      expect(wrapper.classes()).not.toContain('nb-badge--interactive')
      expect(wrapper.find('.nb-badge__icon').exists()).toBe(false)
    })

    it('marks a value not set yet', () => {
      const wrapper = mount(Badge, {
        props: { placeholder: true },
        slots: { default: 'No labels' },
      })
      expect(wrapper.classes()).toContain('nb-badge--placeholder')
      expect(wrapper.text()).toBe('No labels')
    })

    it('is a real button when it does something', async () => {
      const wrapper = mount(Badge, {
        props: { placeholder: true, interactive: true },
        attrs: { 'aria-label': 'Add labels' },
        slots: { default: 'No labels' },
      })
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.attributes('aria-label')).toBe('Add labels')
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('draws a leading icon', () => {
      const wrapper = mount(Badge, {
        props: { icon: 'tag', size: 'sm' },
        slots: { default: 'x' },
      })
      expect(wrapper.find('.nb-badge__icon').exists()).toBe(true)
    })
  })
})
