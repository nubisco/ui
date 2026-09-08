import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoHint from '../src/components/InfoHint.vue'
import NotificationCenter from '../src/components/NotificationCenter.vue'
import * as question from '@nubisco/ui/icons/question'
import { hasCatalog } from '../src/composables/glyphCatalog.composable'

/**
 * These two named their glyph in a prop default (`icon: 'info'`, `icon:
 * 'bell'`) rather than as a literal in their template, so the compile-time
 * transform never saw it and the components shipped linking no artwork. In any
 * consumer that had not loaded the whole icon catalogue, rendering either one
 * threw on first render.
 *
 * This file deliberately does not import a catalogue, which is what makes it
 * the test: it asserts the components render on their own, the way a
 * consumer's app has them. The shared NbIcon stub is switched off for the same
 * reason, since a stub cannot fail to resolve a glyph.
 */
const real = { global: { stubs: { NbIcon: false } } }
describe('components that default their own glyph', () => {
  it('has no catalogue loaded, which is the point of this file', () => {
    expect(hasCatalog('icon')).toBe(false)
  })

  it('NbInfoHint renders its default icon', () => {
    const wrapper = mount(InfoHint, { props: { text: 'Explanation' }, ...real })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('.nb-icon').classes()).toContain('info')
  })

  it('NbInfoHint still takes an icon of its own', () => {
    const wrapper = mount(InfoHint, {
      props: { text: 'Explanation', icon: question },
      ...real,
    })
    expect(wrapper.find('.nb-icon').classes()).toContain('question')
  })

  it('and a name it cannot resolve still fails loudly, not silently', () => {
    // The default is the component's own business, but an icon the app names
    // is the app's: without the plugin or a registration there is nothing to
    // resolve it against, and saying so beats rendering a gap.
    expect(() =>
      mount(InfoHint, {
        props: { text: 'Explanation', icon: 'question' },
        ...real,
      }),
    ).toThrow(/catalogue is not loaded/)
  })

  it('NbNotificationCenter renders its default icon', () => {
    const wrapper = mount(NotificationCenter, { props: { items: [] }, ...real })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('.nb-icon').classes()).toContain('bell')
  })
})
