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

  it('sets data-card-id attribute', () => {
    const w = createWrapper()
    expect(w.attributes('data-card-id')).toBe('test')
  })

  it('renders category as accent-colored tag', () => {
    const w = createWrapper({ category: 'effect' })
    const tag = w.find('.nb-blueprint-card__tag')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('effect')
  })

  it('appends "off" suffix to category when disabled', () => {
    const w = createWrapper({ category: 'effect', enabled: false })
    const tag = w.find('.nb-blueprint-card__tag')
    expect(tag.text()).toContain('off')
  })

  it('applies color as CSS custom property', () => {
    const w = createWrapper({ color: '#ff0000' })
    expect(w.attributes('style')).toContain('--nb-card-color: #ff0000')
  })

  it('computes glow color from hex color', () => {
    const w = createWrapper({ color: '#8b7cff' })
    expect(w.attributes('style')).toContain('--nb-card-glow')
    expect(w.attributes('style')).toContain('rgba(139, 124, 255, 0.18)')
  })

  it('renders selected state', () => {
    const w = createWrapper({ selected: true })
    expect(w.classes()).toContain('nb-blueprint-card--selected')
  })

  it('renders disabled state with reduced opacity', () => {
    const w = createWrapper({ enabled: false })
    expect(w.classes()).toContain('nb-blueprint-card--disabled')
  })

  it('renders collapsed state', () => {
    const w = createWrapper({ collapsed: true })
    expect(w.classes()).toContain('nb-blueprint-card--collapsed')
  })

  it('renders input and output ports', () => {
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

  it('marks connected ports', () => {
    const w = createWrapper({
      ports: [
        { id: 'in1', label: 'Input 1', type: 'input' },
        { id: 'out1', label: 'Output 1', type: 'output' },
      ],
      connectedPorts: ['in1'],
    })
    const ports = w.findAll('.nb-blueprint-card__port--connected')
    expect(ports).toHaveLength(1)
  })

  it('emits select on mousedown (bubbles, no stopPropagation)', async () => {
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

  it('renders chevron collapse button', () => {
    const w = createWrapper()
    expect(w.find('.nb-blueprint-card__collapse').exists()).toBe(true)
  })

  it('emits toggle-collapse on chevron click', async () => {
    const w = createWrapper()
    await w.find('.nb-blueprint-card__collapse').trigger('click')
    expect(w.emitted('toggle-collapse')?.[0]).toEqual(['test'])
  })

  it('renders parameter rows', () => {
    const w = createWrapper({
      parameters: [
        { label: 'radius', value: 20, unit: 'blocks', bar: 40 },
        { label: 'seed', value: '0x2A' },
      ],
    })
    const rows = w.findAll('.nb-blueprint-card__row')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('radius')
    expect(rows[0].text()).toContain('20')
    expect(rows[0].text()).toContain('blocks')
    expect(rows[0].find('.nb-blueprint-card__row-bar').exists()).toBe(true)
    expect(rows[1].text()).toContain('seed')
    expect(rows[1].text()).toContain('0x2A')
    expect(rows[1].find('.nb-blueprint-card__row-bar').exists()).toBe(false)
  })

  it('hides parameters when collapsed', () => {
    const w = createWrapper({
      collapsed: true,
      parameters: [{ label: 'radius', value: 20 }],
    })
    expect(w.findAll('.nb-blueprint-card__row')).toHaveLength(0)
  })

  it('renders status indicator inside name', () => {
    const w = createWrapper({ status: 'valid' })
    expect(w.find('.nb-blueprint-card__status--valid').exists()).toBe(true)
  })

  // ── Multi-I/O bundle ports ──────────────────────────────────────────

  const stereoPort = {
    id: 'audio-out',
    label: 'Audio Out',
    type: 'output' as const,
    dataType: 'audio:stereo' as const,
    channels: [
      { id: 'l', label: 'L' },
      { id: 'r', label: 'R' },
    ],
  }

  it('renders a bundle port as a single pin by default', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pins = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(pins).toHaveLength(1)
    expect(pins[0].classes()).toContain('nb-blueprint-card__port--bundle')
  })

  it('exposes the channel count on the bundle pin via data-channel-count', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pin = w.find('.nb-blueprint-card__port--bundle')
    expect(pin.attributes('data-channel-count')).toBe('2')
  })

  it('uses the bundle port id (no channel suffix) when collapsed', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pin = w.find('.nb-blueprint-card__port--bundle')
    expect(pin.attributes('data-port')).toBe('test:audio-out')
  })

  it('renders one sub-pin per channel when defaultExpanded is true', () => {
    const w = createWrapper({
      ports: [{ ...stereoPort, defaultExpanded: true }],
    })
    const pins = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(pins).toHaveLength(2)
    expect(pins[0].classes()).toContain('nb-blueprint-card__port--channel')
    expect(pins[0].attributes('data-port')).toBe('test:audio-out/l')
    expect(pins[1].attributes('data-port')).toBe('test:audio-out/r')
  })

  it('toggles expand state when the chevron is clicked', async () => {
    const w = createWrapper({ ports: [stereoPort] })
    expect(w.findAll('.nb-blueprint-card__port--channel')).toHaveLength(0)
    await w.find('.nb-blueprint-card__port-expand').trigger('click')
    expect(w.findAll('.nb-blueprint-card__port--channel')).toHaveLength(2)
    // click again to collapse
    await w.find('.nb-blueprint-card__port-expand').trigger('click')
    expect(w.findAll('.nb-blueprint-card__port--channel')).toHaveLength(0)
  })

  it('emits port-mousedown with the slashed sub-pin id when expanded', async () => {
    const w = createWrapper({
      ports: [{ ...stereoPort, defaultExpanded: true }],
    })
    const subpins = w.findAll('.nb-blueprint-card__port--channel')
    await subpins[1].trigger('mousedown')
    const ev = w.emitted('port-mousedown')?.[0]?.[0] as
      | { nodeId: string; portId: string; type: 'input' | 'output' }
      | undefined
    expect(ev).toEqual({
      nodeId: 'test',
      portId: 'audio-out/r',
      type: 'output',
    })
  })

  it('marks the bundle pin as connected when any sub-channel is connected', () => {
    const w = createWrapper({
      ports: [stereoPort],
      connectedPorts: ['audio-out/r'],
    })
    const bundle = w.find('.nb-blueprint-card__port--bundle')
    expect(bundle.classes()).toContain('nb-blueprint-card__port--connected')
  })

  it('marks a sub-pin as connected when the parent bundle id is connected', () => {
    const w = createWrapper({
      ports: [{ ...stereoPort, defaultExpanded: true }],
      connectedPorts: ['audio-out'],
    })
    const subpins = w.findAll('.nb-blueprint-card__port--channel')
    for (const p of subpins) {
      expect(p.classes()).toContain('nb-blueprint-card__port--connected')
    }
  })

  it('does not render an expand chevron on a regular (non-bundle) port', () => {
    const w = createWrapper({
      ports: [{ id: 'in', label: 'In', type: 'input', dataType: 'audio' }],
    })
    expect(w.find('.nb-blueprint-card__port-expand').exists()).toBe(false)
  })

  it('accepts new pin data types (audio:stereo, midi, control) without errors', () => {
    const ports = [
      {
        id: 'a',
        label: 'A',
        type: 'input' as const,
        dataType: 'audio:stereo' as const,
      },
      {
        id: 'b',
        label: 'B',
        type: 'input' as const,
        dataType: 'midi' as const,
      },
      {
        id: 'c',
        label: 'C',
        type: 'output' as const,
        dataType: 'control' as const,
      },
    ]
    const w = createWrapper({ ports })
    const left = w.findAll(
      '.nb-blueprint-card__ports--left .nb-blueprint-card__port',
    )
    const right = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(left).toHaveLength(2)
    expect(right).toHaveLength(1)
  })
})
