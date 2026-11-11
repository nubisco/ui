import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import CloseButton from '../src/components/CloseButton.vue'
import {
  provideNbStrings,
  resetNbStrings,
} from '../src/composables/useNbStrings.composable'

afterEach(() => resetNbStrings())

describe('NbCloseButton', () => {
  it('is a ghost, icon-only NbButton with the x icon', () => {
    const w = mount(CloseButton)
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'nb-close-button',
        'nb-button',
        'nb-button--ghost',
        'nb-button--icon-only',
      ]),
    )
    expect(w.find('[data-name="x"]').exists()).toBe(true)
  })

  it('is sm by default and lg when asked, nothing else', () => {
    expect(mount(CloseButton).classes()).toContain('nb-button--sm')
    expect(mount(CloseButton, { props: { size: 'lg' } }).classes()).toContain(
      'nb-button--lg',
    )
  })

  it('takes its name from the catalogue', () => {
    expect(mount(CloseButton).attributes('aria-label')).toBe('Close')
  })

  it('follows a translated catalogue', () => {
    const w = mount(
      defineComponent({
        setup() {
          provideNbStrings({ close: 'Schließen' })
          return () => h(CloseButton)
        },
      }),
    )
    expect(w.find('button').attributes('aria-label')).toBe('Schließen')
  })

  it('lets a label prop win over the catalogue', () => {
    const w = mount(CloseButton, { props: { label: 'Close notifications' } })
    expect(w.attributes('aria-label')).toBe('Close notifications')
  })

  it('emits click, and not while disabled', async () => {
    const w = mount(CloseButton)
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)

    const off = mount(CloseButton, { props: { disabled: true } })
    expect(off.attributes('disabled')).toBeDefined()
  })

  it('exposes focus() for a host that moves focus onto it', () => {
    const w = mount(CloseButton, { attachTo: document.body })
    ;(w.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(w.element)
    w.unmount()
  })
})
