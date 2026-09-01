import { describe, it, expect, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import BlueprintCard from '../src/components/BlueprintCard.vue'
import { NB_BLUEPRINT_CONTEXT } from '../src/components/Blueprint.context'
import type { IBlueprintCardPortEvent } from '../src/components/Blueprint.types'

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
      | IBlueprintCardPortEvent
      | undefined
    expect(ev).toEqual({
      nodeId: 'test',
      portId: 'audio-out/r',
      type: 'output',
      dataType: 'audio:stereo',
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

  // The tooltip and the accessible name live on the hit target, not on the
  // pin: the pin is `pointer-events: none` decoration drawn over the button,
  // so a title on it would never surface.
  it('renders a tooltip combining port and channel labels', () => {
    const w = createWrapper({ ports: [stereoPort] })
    const hits = w.findAll(
      '.nb-blueprint-card__ports--right .nb-blueprint-card__port-hit',
    )
    expect(hits[0].attributes('title')).toBe('Stereo Out . L')
    expect(hits[1].attributes('title')).toBe('Stereo Out . R')
  })

  it('names each port for assistive tech with its direction and state', () => {
    const w = createWrapper({
      ports: [{ id: 'in', label: 'Sidechain', type: 'input' }],
      connectedPorts: ['in'],
    })
    const hit = w.find('.nb-blueprint-card__port-hit')
    expect(hit.attributes('aria-label')).toBe('Sidechain, input, connected')
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

  // ── Provide/inject port handlers ─────────────────────────────────────

  it('calls injected NbBlueprint context handlers when a port is interacted with', async () => {
    const onPortDown = vi.fn()
    const onPortUp = vi.fn()
    const w = mount(BlueprintCard, {
      props: {
        id: 'card',
        title: 'Card',
        ports: [{ id: 'out', label: 'Out', type: 'output', dataType: 'audio' }],
      },
      global: {
        provide: {
          [NB_BLUEPRINT_CONTEXT as symbol]: { onPortDown, onPortUp },
        },
      },
    })
    const port = w.find('.nb-blueprint-card__port')
    await port.trigger('mousedown')
    expect(onPortDown).toHaveBeenCalledWith({
      nodeId: 'card',
      portId: 'out',
      type: 'output',
      dataType: 'audio',
    })
    await port.trigger('mouseup')
    expect(onPortUp).toHaveBeenCalledWith({
      nodeId: 'card',
      portId: 'out',
      type: 'output',
      dataType: 'audio',
    })
  })

  it('still emits port events when used outside an NbBlueprint context', async () => {
    const w = createWrapper({
      ports: [{ id: 'in', label: 'In', type: 'input', dataType: 'audio' }],
    })
    const port = w.find('.nb-blueprint-card__port')
    await port.trigger('mousedown')
    expect(w.emitted('port-mousedown')?.[0]?.[0]).toEqual({
      nodeId: 'test',
      portId: 'in',
      type: 'input',
      dataType: 'audio',
    })
  })
})

// ── Port anatomy ──────────────────────────────────────────────────────
//
// These are geometry contracts, not styling preferences. The canvas derives
// a wire endpoint from the element carrying `data-port`, so anything that
// creeps into that element's box moves every wire attached to the card.
describe('BlueprintCard ports', () => {
  const createWrapper = (props = {}) =>
    mount(BlueprintCard, {
      props: { id: 'test', title: 'Test Card', ...props },
    })

  const audioIn = { id: 'in', label: 'In', type: 'input' as const }

  it('keeps the inline label out of the element the wire layer measures', () => {
    const w = createWrapper({
      ports: [{ ...audioIn, showLabel: true }],
      showPortLabels: 'left' as const,
    })
    const pin = w.find('.nb-blueprint-card__port')
    expect(pin.attributes('data-port')).toBe('test:in')
    // The label exists, and it is a sibling rather than a descendant. When it
    // lived inside the pin, the endpoint sat half a label inside the card.
    expect(w.find('.nb-blueprint-card__port-label').exists()).toBe(true)
    expect(pin.find('.nb-blueprint-card__port-label').exists()).toBe(false)
  })

  it('puts the hit target on a real button, separate from the pin', () => {
    const w = createWrapper({ ports: [audioIn] })
    const hit = w.find('.nb-blueprint-card__port-hit')
    expect(hit.element.tagName).toBe('BUTTON')
    expect(hit.attributes('type')).toBe('button')
    // The pin is inside the button, so the comfortable target and the
    // measured box can differ without either compromising.
    expect(hit.find('.nb-blueprint-card__port').exists()).toBe(true)
  })

  it('sizes pins with real dimensions, never transform: scale', () => {
    const w = createWrapper({
      ports: [
        { ...audioIn, id: 'a', size: 'sm' as const },
        { ...audioIn, id: 'b' },
        { ...audioIn, id: 'c', size: 'lg' as const },
      ],
    })
    const pins = w.findAll('.nb-blueprint-card__port')
    expect(pins[0].classes()).toContain('nb-blueprint-card__port--size-sm')
    expect(pins[2].classes()).toContain('nb-blueprint-card__port--size-lg')
    // A scaled pin looked bigger while keeping a medium pin's box, so its
    // endpoint and its hit area both stayed the wrong size.
    for (const pin of pins) {
      expect(pin.attributes('style') ?? '').not.toContain('scale')
    }
  })

  it('marks a metered pin only when a level was reported for it', () => {
    const w = createWrapper({
      ports: [
        { ...audioIn, id: 'quiet' },
        { ...audioIn, id: 'loud' },
      ],
      activePorts: ['quiet', 'loud'],
      portLevels: { loud: 0.42 },
    })
    const pins = w.findAll('.nb-blueprint-card__port')
    expect(pins[0].classes()).not.toContain('nb-blueprint-card__port--metered')
    expect(pins[1].classes()).toContain('nb-blueprint-card__port--metered')
    expect(pins[1].attributes('style')).toContain('--pin-level: 42.0%')
  })

  it('clamps a reported level into 0..1', () => {
    const w = createWrapper({
      ports: [
        { ...audioIn, id: 'over' },
        { ...audioIn, id: 'under' },
      ],
      portLevels: { over: 3, under: -1 },
    })
    const pins = w.findAll('.nb-blueprint-card__port')
    expect(pins[0].attributes('style')).toContain('--pin-level: 100.0%')
    expect(pins[1].attributes('style')).toContain('--pin-level: 0.0%')
  })
})

// ── Drop targets ──────────────────────────────────────────────────────
describe('BlueprintCard drop targets', () => {
  const dragOrigin = ref<IBlueprintCardPortEvent | null>(null)

  const mountWithDrag = (props = {}) =>
    mount(BlueprintCard, {
      props: { id: 'target', title: 'Target', ...props },
      global: {
        provide: {
          [NB_BLUEPRINT_CONTEXT as symbol]: {
            onPortDown: vi.fn(),
            onPortUp: vi.fn(),
            dragOrigin,
          },
        },
      },
    })

  const ports = [
    {
      id: 'audio-in',
      label: 'Audio',
      type: 'input' as const,
      dataType: 'audio' as const,
    },
    {
      id: 'midi-in',
      label: 'MIDI',
      type: 'input' as const,
      dataType: 'midi' as const,
    },
    {
      id: 'audio-out',
      label: 'Out',
      type: 'output' as const,
      dataType: 'audio' as const,
    },
  ]

  const classesFor = (w: ReturnType<typeof mountWithDrag>, portId: string) =>
    w.find(`[data-port="target:${portId}"]`).classes()

  it('marks nothing while no wire is in flight', async () => {
    dragOrigin.value = null
    const w = mountWithDrag({ ports })
    await nextTick()
    for (const p of ports) {
      expect(classesFor(w, p.id)).not.toContain(
        'nb-blueprint-card__port--target-valid',
      )
      expect(classesFor(w, p.id)).not.toContain(
        'nb-blueprint-card__port--target-invalid',
      )
    }
  })

  it('lights compatible inputs and dims the rest while dragging an output', async () => {
    dragOrigin.value = {
      nodeId: 'other',
      portId: 'src',
      type: 'output',
      dataType: 'audio',
    }
    const w = mountWithDrag({ ports })
    await nextTick()
    // Right direction, matching family.
    expect(classesFor(w, 'audio-in')).toContain(
      'nb-blueprint-card__port--target-valid',
    )
    // Right direction, wrong family.
    expect(classesFor(w, 'midi-in')).toContain(
      'nb-blueprint-card__port--target-invalid',
    )
    // An output cannot receive an output.
    expect(classesFor(w, 'audio-out')).toContain(
      'nb-blueprint-card__port--target-invalid',
    )
    dragOrigin.value = null
  })

  it('treats members of one data-type family as compatible', async () => {
    dragOrigin.value = {
      nodeId: 'other',
      portId: 'src',
      type: 'output',
      dataType: 'audio:mono',
    }
    const w = mountWithDrag({
      ports: [
        {
          id: 'stereo',
          label: 'Stereo',
          type: 'input' as const,
          dataType: 'audio:stereo' as const,
        },
      ],
    })
    await nextTick()
    expect(classesFor(w, 'stereo')).toContain(
      'nb-blueprint-card__port--target-valid',
    )
    dragOrigin.value = null
  })

  it('treats an undeclared or `any` type as compatible with anything', async () => {
    dragOrigin.value = {
      nodeId: 'other',
      portId: 'src',
      type: 'output',
      dataType: undefined,
    }
    const w = mountWithDrag({
      ports: [
        {
          id: 'midi-in',
          label: 'MIDI',
          type: 'input' as const,
          dataType: 'midi' as const,
        },
      ],
    })
    await nextTick()
    expect(classesFor(w, 'midi-in')).toContain(
      'nb-blueprint-card__port--target-valid',
    )
    dragOrigin.value = null
  })

  it('never marks a card against a drag that started on itself', async () => {
    dragOrigin.value = {
      nodeId: 'target',
      portId: 'audio-out',
      type: 'output',
      dataType: 'audio',
    }
    const w = mountWithDrag({ ports })
    await nextTick()
    // The originating pin is neither a target nor a non-target...
    expect(classesFor(w, 'audio-out')).not.toContain(
      'nb-blueprint-card__port--target-valid',
    )
    expect(classesFor(w, 'audio-out')).not.toContain(
      'nb-blueprint-card__port--target-invalid',
    )
    // ...and a card cannot wire to itself, so its other pins are not targets.
    expect(classesFor(w, 'audio-in')).toContain(
      'nb-blueprint-card__port--target-invalid',
    )
    dragOrigin.value = null
  })
})

// ── Density, keyboard, status ─────────────────────────────────────────
describe('BlueprintCard density and keyboard', () => {
  it('inherits the canvas density and lets a card override it', () => {
    const density = ref<'default' | 'compact'>('compact')
    const withContext = (props = {}) =>
      mount(BlueprintCard, {
        props: { id: 'c', title: 'C', ...props },
        global: {
          provide: {
            [NB_BLUEPRINT_CONTEXT as symbol]: {
              onPortDown: vi.fn(),
              onPortUp: vi.fn(),
              density,
            },
          },
        },
      })
    expect(withContext().classes()).toContain(
      'nb-blueprint-card--density-compact',
    )
    expect(withContext({ density: 'default' }).classes()).toContain(
      'nb-blueprint-card--density-default',
    )
  })

  it('falls back to default density with no canvas around it', () => {
    const w = mount(BlueprintCard, { props: { id: 'c', title: 'C' } })
    expect(w.classes()).toContain('nb-blueprint-card--density-default')
  })

  it('nudges through the blueprint so arrow keys and drags share one path', async () => {
    const nudge = vi.fn()
    const w = mount(BlueprintCard, {
      props: { id: 'c', title: 'C' },
      global: {
        provide: {
          [NB_BLUEPRINT_CONTEXT as symbol]: {
            onPortDown: vi.fn(),
            onPortUp: vi.fn(),
            nudge,
          },
        },
      },
    })
    await w.trigger('keydown', { key: 'ArrowRight' })
    expect(nudge).toHaveBeenCalledWith('c', 1, 0)
    await w.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    expect(nudge).toHaveBeenCalledWith('c', 0, -10)
    // Keys the card does not own are left alone for the canvas to handle.
    await w.trigger('keydown', { key: 'a' })
    expect(nudge).toHaveBeenCalledTimes(2)
  })

  it('is focusable and describes itself', () => {
    const w = mount(BlueprintCard, {
      props: {
        id: 'c',
        title: 'Low-pass',
        category: 'Effect',
        status: 'warning' as const,
        enabled: false,
      },
    })
    expect(w.attributes('tabindex')).toBe('0')
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe(
      'Low-pass, Effect, Warning, disabled',
    )
  })

  it('draws status as a titled glyph rather than a colour-only dot', () => {
    const w = mount(BlueprintCard, {
      props: { id: 'c', title: 'C', status: 'error' as const },
    })
    const status = w.find('.nb-blueprint-card__status')
    expect(status.element.tagName.toLowerCase()).toBe('svg')
    expect(status.attributes('aria-label')).toBe('Error')
    expect(status.find('title').text()).toBe('Error')
  })
})

describe('BlueprintCard port overflow', () => {
  it('publishes the taller column pin count so the card can contain it', () => {
    const w = mount(BlueprintCard, {
      props: {
        id: 'mix',
        title: 'Mixer',
        ports: [
          { id: 'a', label: 'A', type: 'input' as const },
          { id: 'b', label: 'B', type: 'input' as const },
          { id: 'c', label: 'C', type: 'input' as const },
          { id: 'out', label: 'Sum', type: 'output' as const },
        ],
      },
    })
    // The card's min-height is derived from this, so a card with more ports
    // than chrome grows instead of letting pins hang off its bottom edge.
    expect(w.attributes('style')).toContain('--nb-blueprint-port-count: 3')
  })

  it('counts each channel of a multi-channel port as its own row', () => {
    const w = mount(BlueprintCard, {
      props: {
        id: 'mix',
        title: 'Mixer',
        ports: [
          {
            id: 'out',
            label: 'Out',
            type: 'output' as const,
            channels: [
              { id: 'l', label: 'L' },
              { id: 'r', label: 'R' },
              { id: 'c', label: 'C' },
              { id: 'lfe', label: 'LFE' },
            ],
          },
        ],
      },
    })
    expect(w.attributes('style')).toContain('--nb-blueprint-port-count: 4')
  })

  it('never reports fewer than one row, so a portless card keeps a floor', () => {
    const w = mount(BlueprintCard, { props: { id: 'c', title: 'C' } })
    expect(w.attributes('style')).toContain('--nb-blueprint-port-count: 1')
  })
})
