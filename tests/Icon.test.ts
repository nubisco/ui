import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Icon from '../src/components/Icon.vue'
import * as house from '@nubisco/ui/icons/house'
import { registerIcons, unregisterIcon } from '../src/composables/iconRegistry'

// These specs cover the three ways an icon reaches NbIcon. Everything below
// the first describe passes the module, which is what the compile-time plugin
// injects for a literal `name="house"`, so the assertions run against the same
// input a built app produces.

describe('Icon', () => {
  const createWrapper = (props = {}) =>
    mount(Icon, { props: { name: house, ...props } })

  it('renders an i element', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('i')
  })

  it('applies nb-icon class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-icon')
  })

  it('applies the icon name as a class, read off the linked module', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.classes()).toContain('house')
  })

  it('applies size class for named sizes', () => {
    const wrapper = createWrapper({ name: house, size: 'md' })
    expect(wrapper.classes()).toContain('nb-icon-md')
  })

  it('applies width and height attributes for named sizes', () => {
    const wrapper = createWrapper({ name: house, size: 'md' })
    expect(wrapper.attributes('width')).toBeTruthy()
    expect(wrapper.attributes('height')).toBeTruthy()
  })

  it('applies color style when color is provided', () => {
    const wrapper = createWrapper({ name: house, color: 'var(--nb-c-danger)' })
    expect(wrapper.attributes('style')).toContain('color: var(--nb-c-danger)')
  })

  it('applies role button when clickable', () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    expect(wrapper.attributes('role')).toBe('button')
  })

  it('does not apply role button when not clickable', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('emits click when clickable and clicked', async () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = createWrapper({ name: house })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies title attribute', () => {
    const wrapper = createWrapper({ name: house, title: 'Go home' })
    expect(wrapper.attributes('title')).toBe('Go home')
  })

  it('applies hoverable class', () => {
    const wrapper = createWrapper({ name: house, hoverable: true })
    expect(wrapper.classes()).toContain('hoverable')
  })

  it('applies box-clickable class when clickable', () => {
    const wrapper = createWrapper({ name: house, clickable: true })
    expect(wrapper.classes()).toContain('box-clickable')
  })

  it('renders the icon svg component', () => {
    const wrapper = createWrapper({ name: house })
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

describe('Icon: how the glyph is resolved', () => {
  afterEach(() => unregisterIcon('house'))

  it('accepts a module on `icon`, which wins over `name`', () => {
    const wrapper = mount(Icon, { props: { name: 'not-an-icon', icon: house } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.classes()).toContain('house')
  })

  it('resolves a registered name without any catalogue', () => {
    registerIcons({ house })
    const wrapper = mount(Icon, { props: { name: 'house' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('fails loudly when a runtime name is used and no catalogue is loaded', () => {
    expect(() => mount(Icon, { props: { name: 'house' } })).toThrow(
      /icon catalogue is not loaded/,
    )
  })

  it('resolves a runtime name once the catalogue is imported', async () => {
    await import('@nubisco/ui/icons/all')
    const wrapper = mount(Icon, { props: { name: 'house' } })
    await flushPromises()
    expect(wrapper.find('svg').exists()).toBe(true)
  })
})

// The NbNubiscoMark contract, carried over: decorative unless named, and a
// named icon is an image with that name rather than a tooltip on an <i>.
describe('Icon: decorative and informative', () => {
  it('is decorative by default: hidden, no role, the svg not focusable', () => {
    const wrapper = mount(Icon, { props: { name: house } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
  })

  it('with a label, renders role="img" named by it and is not hidden', () => {
    const wrapper = mount(Icon, { props: { name: house, label: 'Home' } })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Home')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    // No tooltip unless one was asked for.
    expect(wrapper.attributes('title')).toBeUndefined()
  })

  it('with a title, is named by it as well as showing it as a tooltip', () => {
    const wrapper = mount(Icon, { props: { name: house, title: 'Go home' } })
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Go home')
    expect(wrapper.attributes('title')).toBe('Go home')
  })

  it('prefers label over title for the name', () => {
    const wrapper = mount(Icon, {
      props: { name: house, label: 'Home', title: 'Go to the home page' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Home')
    expect(wrapper.attributes('title')).toBe('Go to the home page')
  })

  it('is never hidden while a fallthrough aria-label names it', () => {
    const wrapper = mount(Icon, {
      props: { name: house },
      attrs: { 'aria-label': 'Home' },
    })
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Home')
  })
})

describe('Icon: the size scale', () => {
  it.each([
    ['sm', '16px'],
    ['md', '20px'],
    ['lg', '24px'],
    ['xl', '32px'],
  ])('maps %s to %s', (size, px) => {
    const wrapper = mount(Icon, { props: { name: house, size } })
    expect(wrapper.attributes('width')).toBe(px)
    expect(wrapper.classes()).toContain(`nb-icon-${size}`)
  })

  it('defaults to 16px, the size it always rendered at', () => {
    const wrapper = mount(Icon, { props: { name: house } })
    expect(wrapper.attributes('width')).toBe('16px')
    expect(wrapper.classes()).toContain('nb-icon-sm')
  })

  it('keeps the number and CSS length escape hatches', () => {
    expect(
      mount(Icon, { props: { name: house, size: 48 } }).attributes('style'),
    ).toContain('width: 48px')
    expect(
      mount(Icon, { props: { name: house, size: '1.5rem' } }).attributes(
        'style',
      ),
    ).toContain('width: 1.5rem')
  })

  it('warns once per deprecated size: xs, xxs and numbers under 16', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      mount(Icon, { props: { name: house, size: 'xs' } })
      mount(Icon, { props: { name: house, size: 'xs' } })
      mount(Icon, { props: { name: house, size: 'xxs' } })
      mount(Icon, { props: { name: house, size: 13 } })
      mount(Icon, { props: { name: house, size: 13 } })
      const messages = warn.mock.calls.map((c) => String(c[0]))
      expect(messages.filter((m) => m.includes('"xs"'))).toHaveLength(1)
      expect(messages.filter((m) => m.includes('"xxs"'))).toHaveLength(1)
      expect(messages.filter((m) => m.includes(' 13 '))).toHaveLength(1)
      expect(messages.every((m) => m.startsWith('[NbIcon]'))).toBe(true)
    } finally {
      warn.mockRestore()
    }
  })

  it('does not warn on the scale, on 16 and up, or on a CSS length', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (const size of ['sm', 'md', 'lg', 'xl', 16, 18, 64, '1.2em']) {
        mount(Icon, { props: { name: house, size } })
      }
      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})

describe('Icon: clickable, deprecated', () => {
  it('warns once, pointing at NbButton', async () => {
    // A fresh copy of the component, so an earlier spec has not already
    // spent the one warning.
    vi.resetModules()
    const { default: Fresh } = await import('../src/components/Icon.vue')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      mount(Fresh, { props: { name: house, clickable: true } })
      mount(Fresh, { props: { name: house, clickable: true } })
      const messages = warn.mock.calls
        .map((c) => String(c[0]))
        .filter((m) => m.includes('clickable'))
      expect(messages).toHaveLength(1)
      expect(messages[0]).toContain('NbButton variant="ghost"')
    } finally {
      warn.mockRestore()
    }
  })

  it('is a tab stop with a name', () => {
    const wrapper = mount(Icon, {
      props: { name: house, clickable: true, label: 'Home' },
    })
    expect(wrapper.attributes('tabindex')).toBe('0')
    expect(wrapper.attributes('role')).toBe('button')
    expect(wrapper.attributes('aria-label')).toBe('Home')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })

  it('is pressed by Enter, and by Space on release', async () => {
    const wrapper = mount(Icon, { props: { name: house, clickable: true } })
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(1)
    await wrapper.trigger('keyup', { key: ' ' })
    expect(wrapper.emitted('click')).toHaveLength(2)
  })

  it('ignores keys when not clickable', async () => {
    const wrapper = mount(Icon, { props: { name: house } })
    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keyup', { key: ' ' })
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
  })
})
