import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BlueprintCard from '../src/components/BlueprintCard.vue'

describe('BlueprintCard', () => {
  const createWrapper = (props = {}) =>
    mount(BlueprintCard, {
      props: { id: 'test', title: 'Test Card', ...props },
    })

  it('renders title', () => {
    const w = createWrapper()
    expect(w.text()).toContain('Test Card')
  })

  it('renders category', () => {
    const w = createWrapper({ category: 'effect' })
    expect(w.text()).toContain('effect')
  })

  it('applies color indicator', () => {
    const w = createWrapper({ color: '#ff0000' })
    expect(w.attributes('style')).toContain('--nb-card-color: #ff0000')
  })

  it('renders selected state', () => {
    const w = createWrapper({ selected: true })
    expect(w.classes()).toContain('nb-blueprint-card--selected')
  })

  it('renders disabled state', () => {
    const w = createWrapper({ enabled: false })
    expect(w.classes()).toContain('nb-blueprint-card--disabled')
  })

  it('renders input ports', () => {
    const w = createWrapper({
      ports: [
        { id: 'in1', label: 'Input 1', type: 'input' },
        { id: 'out1', label: 'Output 1', type: 'output' },
      ],
    })
    const leftPorts = w.findAll(
      '.nb-blueprint-card__ports--left .nb-blueprint-card__port',
    )
    const rightPorts = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(leftPorts).toHaveLength(1)
    expect(rightPorts).toHaveLength(1)
  })

  it('emits select on click', async () => {
    const w = createWrapper()
    await w.trigger('mousedown')
    expect(w.emitted('select')?.[0]).toEqual(['test'])
  })

  it('emits toggle', async () => {
    const w = createWrapper({ enabled: true })
    const input = w.find('input[type="checkbox"]')
    await input.setValue(false)
    expect(w.emitted('toggle')?.[0]?.[0]).toBe('test')
  })

  it('shows remove button when removable', () => {
    const w = createWrapper({ removable: true })
    expect(w.find('.nb-blueprint-card__remove').exists()).toBe(true)
  })

  it('hides remove button by default', () => {
    const w = createWrapper()
    expect(w.find('.nb-blueprint-card__remove').exists()).toBe(false)
  })
})
