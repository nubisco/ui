import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShellPanel from '../src/components/ShellPanel.vue'

describe('ShellPanel', () => {
  it('renders with the default size class', () => {
    const w = mount(ShellPanel, { props: { title: 'P' } })
    expect(w.classes()).toContain('default')
    w.unmount()
  })

  it('does NOT carry the fluid modifier class by default', () => {
    const w = mount(ShellPanel, { props: { title: 'P' } })
    expect(w.classes()).not.toContain('nb-shell-panel--fluid')
    w.unmount()
  })

  it('applies the fluid modifier class when fluid=true', () => {
    const w = mount(ShellPanel, { props: { title: 'P', fluid: true } })
    expect(w.classes()).toContain('nb-shell-panel--fluid')
    w.unmount()
  })

  it('emits update:size when the size buttons are clicked', async () => {
    const w = mount(ShellPanel, {
      props: { title: 'P', size: 'default' },
    })
    const buttons = w.findAll('.nb-shell-panel__size-btn')
    expect(buttons.length).toBeGreaterThan(0)
    // Click "collapsed" (first button per the template order).
    await buttons[0]!.trigger('click')
    const ev = w.emitted('update:size')?.[0]?.[0]
    expect(ev).toBe('collapsed')
    w.unmount()
  })
})
