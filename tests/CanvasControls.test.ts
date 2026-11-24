import { describe, it, expect, vi } from 'vitest'
import { h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import CanvasControls from '../src/components/CanvasControls.vue'
import CanvasControlsGroup from '../src/components/CanvasControlsGroup.vue'
import BlueprintControls from '../src/components/BlueprintControls.vue'
import Button from '../src/components/Button.vue'
import { NB_BLUEPRINT_CONTROLLER } from '../src/components/Blueprint.context'

function controls(props: Record<string, unknown> = {}, groupLabel?: string) {
  return mount(CanvasControls, {
    props: { label: 'Map controls', ...props },
    slots: {
      default: () =>
        h(CanvasControlsGroup, { label: groupLabel }, () => [
          h(Button, { variant: 'ghost', icon: 'plus', label: 'Zoom in' }),
          h(Button, {
            variant: 'ghost',
            icon: 'plus',
            label: 'Big',
            size: 'lg',
          }),
        ]),
    },
  })
}

describe('NbCanvasControls', () => {
  it('is a named toolbar at its position and orientation', () => {
    const w = controls({ position: 'top-left', orientation: 'horizontal' })
    const root = w.find('.nb-canvas-controls')
    expect(root.attributes('role')).toBe('toolbar')
    expect(root.attributes('aria-label')).toBe('Map controls')
    expect(root.attributes('aria-orientation')).toBe('horizontal')
    expect(root.classes()).toContain('nb-canvas-controls--top-left')
    expect(root.classes()).toContain('is-horizontal')
    expect(w.find('.nb-canvas-controls-group').classes()).toContain(
      'is-horizontal',
    )
  })

  it('defaults to the bottom-right corner, vertical', () => {
    const root = controls().find('.nb-canvas-controls')
    expect(root.classes()).toContain('nb-canvas-controls--bottom-right')
    expect(root.classes()).toContain('is-vertical')
  })

  it('sizes the buttons inside through the toolbar context', () => {
    const w = controls({ size: 'md' })
    const [zoom, big] = w.findAll('.nb-button')
    expect(zoom.classes()).toContain('nb-button--md')
    // A button given a size of its own keeps it.
    expect(big.classes()).toContain('nb-button--lg')
    expect(controls().find('.nb-button').classes()).toContain('nb-button--sm')
  })

  it('names a group only when given a label', () => {
    expect(
      controls({}, 'Zoom').find('.nb-canvas-controls-group').attributes(),
    ).toMatchObject({ role: 'group', 'aria-label': 'Zoom' })
    expect(
      controls().find('.nb-canvas-controls-group').attributes('role'),
    ).toBeUndefined()
  })

  it('draws its corner, lift and inset from tokens', () => {
    const read = (f: string) =>
      readFileSync(resolve(__dirname, '../src', f), 'utf8')
    const group = read('components/CanvasControlsGroup.vue')
    expect(group).toContain('var(--nb-canvas-controls-radius)')
    expect(group).toContain('box-shadow: var(--nb-canvas-controls-shadow)')
    expect(read('components/CanvasControls.vue')).toContain(
      'var(--nb-canvas-controls-inset)',
    )
    const theme = read('styles/_theme.scss')
    expect(theme).toContain('--nb-canvas-controls-radius: var(--nb-radius-lg)')
  })
})

describe('NbBlueprintControls on NbCanvasControls', () => {
  it('renders through the generic component, buttons at sm', () => {
    const ctrl = {
      selectedIds: ref(new Set<string>()),
      isEditMode: ref(false),
      zoomIn: vi.fn(),
    }
    const w = mount(BlueprintControls, {
      global: { provide: { [NB_BLUEPRINT_CONTROLLER as symbol]: ctrl } },
    })
    expect(w.findComponent(CanvasControls).exists()).toBe(true)
    expect(w.find('.nb-canvas-controls--bottom-right').exists()).toBe(true)
    expect(w.find('.nb-canvas-controls-group').exists()).toBe(true)
    for (const b of w.findAll('.nb-button')) {
      expect(b.classes()).toContain('nb-button--sm')
    }
  })
})
