import { describe, it, expect, vi, afterEach } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import Blueprint from '../src/components/Blueprint.vue'
import BlueprintDomRenderer from '../src/components/BlueprintDomRenderer.vue'
import BlueprintCard from '../src/components/BlueprintCard.vue'
import type { IBlueprintWire } from '../src/components/Blueprint.renderer'

const conn = {
  fromNode: 'a',
  fromPort: 'out',
  toNode: 'b',
  toPort: 'in',
}

const wire = (overrides: Partial<IBlueprintWire> = {}): IBlueprintWire => ({
  path: 'M 0 0 C 5 0, 5 10, 10 10',
  conn,
  color: '#fff',
  isMidi: false,
  ...overrides,
})

const baseProps = {
  panX: 0,
  panY: 0,
  zoom: 1,
  isTransforming: false,
  windowed: false,
  visibleCards: [],
  dragWire: null,
  shouldFlow: () => false,
  background: 'dots' as const,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BlueprintDomRenderer', () => {
  it('renders one wire group and visible path per wire', () => {
    const w = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [wire(), wire()] },
    })
    expect(w.findAll('.nb-blueprint__wire-group')).toHaveLength(2)
    expect(w.findAll('.nb-blueprint__wire-hitregion')).toHaveLength(2)
    // grid + canvas scene roots both present
    expect(w.find('.nb-blueprint__grid').exists()).toBe(true)
    expect(w.find('.nb-blueprint__canvas').exists()).toBe(true)
  })

  it('emits wire pointer events with the connection payload', async () => {
    const w = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [wire()] },
    })
    await w.find('.nb-blueprint__wire-hitregion').trigger('mousedown')
    const ev = w.emitted('wire-mousedown')
    expect(ev).toBeTruthy()
    // payload is [MouseEvent, conn] (Vue wraps the prop in a reactive
    // proxy, so compare by value, not identity)
    expect(ev![0][1]).toEqual(conn)
  })

  it('renders the grid with the chosen background variant', () => {
    const dots = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [], background: 'lines' as const },
    })
    expect(dots.find('.nb-blueprint__grid--lines').exists()).toBe(true)
    const none = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [], background: 'none' as const },
    })
    expect(none.find('.nb-blueprint__grid').exists()).toBe(false)
  })

  it('applies the camera transform to the canvas', () => {
    const w = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [], panX: 12, panY: 34, zoom: 2 },
    })
    const style = w.find('.nb-blueprint__canvas').attributes('style') ?? ''
    expect(style).toContain('translate(12px, 34px) scale(2)')
  })

  it('renders the default slot in legacy (non-windowed) mode', () => {
    const w = mount(BlueprintDomRenderer, {
      props: { ...baseProps, wires: [] },
      slots: { default: '<div class="legacy-card">x</div>' },
    })
    expect(w.find('.legacy-card').exists()).toBe(true)
  })

  it('renders the card slot per visible card in windowed mode', () => {
    const w = mount(BlueprintDomRenderer, {
      props: {
        ...baseProps,
        wires: [],
        windowed: true,
        visibleCards: [{ id: 'n1', x: 0, y: 0 }],
      },
      slots: {
        card: ({ card }: { card: { id: string } }) =>
          h(BlueprintCard, { id: card.id, title: card.id }),
      },
    })
    expect(w.find('[data-card-id="n1"]').exists()).toBe(true)
  })
})

describe('Blueprint renderer resolution', () => {
  it('uses the DOM renderer by default', () => {
    const w = mount(Blueprint)
    expect(w.findComponent(BlueprintDomRenderer).exists()).toBe(true)
  })

  it('falls back to the DOM renderer (with a warning) when pixi is requested', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Blueprint, { props: { renderer: 'pixi' } })
    expect(w.findComponent(BlueprintDomRenderer).exists()).toBe(true)
    // jsdom has no WebGL, so the async availability check warns and stays DOM.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('renderer="pixi" unavailable'),
    )
  })

  it('does not warn for renderer="dom"', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Blueprint, { props: { renderer: 'dom' } })
    expect(warn).not.toHaveBeenCalled()
  })
})
