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

  // ── Multi-channel ports ──────────────────────────────────────────────

  const stereoPort = {
    id: 'audio-out',
    label: 'Stereo Out',
    type: 'output' as const,
    dataType: 'audio:stereo' as const,
    channels: [
      { id: 'l', label: 'L' },
      { id: 'r', label: 'R' },
    ],
  }

  it('renders one pin per channel for a multi-channel port', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pins = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(pins).toHaveLength(2)
    for (const p of pins) {
      expect(p.classes()).toContain('nb-blueprint-card__port--channel')
    }
  })

  it('addresses each channel pin as `${port.id}/${channel.id}`', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pins = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port',
    )
    expect(pins[0].attributes('data-port')).toBe('test:audio-out/l')
    expect(pins[1].attributes('data-port')).toBe('test:audio-out/r')
  })

  it('emits port-mousedown with the channel-suffixed port id', async () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pins = w.findAll('.nb-blueprint-card__port--channel')
    await pins[1].trigger('mousedown')
    const ev = w.emitted('port-mousedown')?.[0]?.[0] as
      | { nodeId: string; portId: string; type: 'input' | 'output' }
      | undefined
    expect(ev).toEqual({
      nodeId: 'test',
      portId: 'audio-out/r',
      type: 'output',
    })
  })

  it('marks a channel pin as connected when its specific id is in connectedPorts', () => {
    const w = createWrapper({
      ports: [stereoPort],
      connectedPorts: ['audio-out/r'],
    })
    const pins = w.findAll('.nb-blueprint-card__port--channel')
    expect(pins[0].classes()).not.toContain(
      'nb-blueprint-card__port--connected',
    )
    expect(pins[1].classes()).toContain('nb-blueprint-card__port--connected')
  })

  it('does NOT render any expand chevron on multi-channel ports', () => {
    const w = createWrapper({ ports: [stereoPort] })
    expect(w.find('.nb-blueprint-card__port-expand').exists()).toBe(false)
  })

  it('renders a tooltip combining port and channel labels', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const pins = w.findAll('.nb-blueprint-card__port--channel')
    expect(pins[0].attributes('title')).toBe('Stereo Out . L')
    expect(pins[1].attributes('title')).toBe('Stereo Out . R')
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

  // ── Inline port labels ───────────────────────────────────────────────

  it('does not render inline labels by default', () => {
    const w = createWrapper({
      ports: [{ id: 'in', label: 'Audio In', type: 'input' }],
    })
    expect(w.find('.nb-blueprint-card__port-label').exists()).toBe(false)
  })

  it('renders an inline label when port.showLabel is true', () => {
    const w = createWrapper({
      ports: [
        { id: 'in', label: 'MIDI In', type: 'input', showLabel: true },
        { id: 'out', label: 'Out', type: 'output' },
      ],
    })
    const labels = w.findAll('.nb-blueprint-card__port-label')
    expect(labels).toHaveLength(1)
    expect(labels[0].text()).toBe('MIDI In')
  })

  it('respects card-level showPortLabels=left for input ports only', () => {
    const w = createWrapper({
      showPortLabels: 'left',
      ports: [
        { id: 'in', label: 'In', type: 'input' },
        { id: 'out', label: 'Out', type: 'output' },
      ],
    })
    const left = w.find(
      '.nb-blueprint-card__ports--left .nb-blueprint-card__port-label',
    )
    const right = w.find(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port-label',
    )
    expect(left.exists()).toBe(true)
    expect(right.exists()).toBe(false)
  })

  it("uses the channel's label (not the port's) for inline text on multi-channel ports", () => {
    const w = createWrapper({
      showPortLabels: 'right',
      ports: [stereoPort],
    })
    const labels = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port-label',
    )
    expect(labels.map((l) => l.text())).toEqual(['L', 'R'])
  })

  it('per-port showLabel overrides the card-level default', () => {
    const w = createWrapper({
      showPortLabels: 'both',
      ports: [
        { id: 'in', label: 'Hidden', type: 'input', showLabel: false },
        { id: 'out', label: 'Shown', type: 'output' },
      ],
    })
    expect(
      w.findAll('.nb-blueprint-card__port-label').map((l) => l.text()),
    ).toEqual(['Shown'])
  })

  it('adds card-level has-port-labels modifier classes when any side has labels', () => {
    const w = createWrapper({
      showPortLabels: 'left',
      ports: [
        { id: 'in', label: 'In', type: 'input' },
        { id: 'out', label: 'Out', type: 'output' },
      ],
    })
    expect(w.classes()).toContain('nb-blueprint-card--has-port-labels-left')
    expect(w.classes()).not.toContain(
      'nb-blueprint-card--has-port-labels-right',
    )
  })
})
