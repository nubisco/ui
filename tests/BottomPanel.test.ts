import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomPanel from '../src/components/BottomPanel.vue'

describe('BottomPanel', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(BottomPanel, { props, slots })

  it('renders with default size', () => {
    const w = createWrapper()
    expect(w.classes()).toContain('default')
  })

  it('renders title', () => {
    const w = createWrapper({ title: 'Blueprint' })
    expect(w.text()).toContain('Blueprint')
  })

  it('applies collapsed size class', () => {
    const w = createWrapper({ size: 'collapsed' })
    expect(w.classes()).toContain('collapsed')
  })

  it('hides content when collapsed', () => {
    const w = createWrapper({ size: 'collapsed' }, { default: () => 'Content' })
    expect(w.find('.nb-bottom-panel__content').exists()).toBe(false)
  })

  it('shows content when not collapsed', () => {
    const w = createWrapper({ size: 'default' }, { default: () => 'Content' })
    expect(w.find('.nb-bottom-panel__content').exists()).toBe(true)
  })

  it('emits update:size when size button clicked', async () => {
    const w = createWrapper({ size: 'default' })
    const buttons = w.findAll('.nb-bottom-panel__size-btn')
    await buttons[2].trigger('click') // half button
    expect(w.emitted('update:size')?.[0]).toEqual(['half'])
  })

  it('renders toolbar slot', () => {
    const w = createWrapper({}, { toolbar: () => 'Toolbar' })
    expect(w.find('.nb-bottom-panel__toolbar').text()).toContain('Toolbar')
  })

  it('applies full size class', () => {
    const w = createWrapper({ size: 'full' })
    expect(w.classes()).toContain('full')
  })
})
