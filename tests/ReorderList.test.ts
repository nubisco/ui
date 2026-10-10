import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ReorderList from '../src/components/ReorderList.vue'

type Row = { id: string; label: string }

const rows = (): Row[] => [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
]

const mountList = (props = {}, attach = false) =>
  mount(ReorderList, {
    props: { modelValue: rows(), itemKey: 'id', label: 'Fields', ...props },
    ...(attach ? { attachTo: document.body } : {}),
  })

const grabs = (w: ReturnType<typeof mountList>) =>
  w.findAll('.nb-reorder-list__grab')

const order = (w: ReturnType<typeof mountList>) =>
  (w.emitted('update:modelValue')?.at(-1)?.[0] as Row[]).map((r) => r.id)

describe('NbReorderList', () => {
  it('renders a row per item with a stable key', () => {
    const w = mountList()
    expect(w.findAll('.nb-reorder-list__row')).toHaveLength(3)
  })

  // The keyboard path is the one that gets skipped when this is hand-rolled,
  // and it is the reason the component exists rather than a recipe.
  it('picks up, moves and drops with the keyboard', async () => {
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    await grabs(w)[0].trigger('keydown', { key: 'ArrowDown' })
    expect(order(w)).toEqual(['b', 'a', 'c'])
    expect(w.emitted('reorder')?.at(-1)?.[0]).toMatchObject({
      from: 0,
      to: 1,
      via: 'keyboard',
    })
    w.unmount()
  })

  it('browses without rearranging when nothing is picked up', async () => {
    // Arrow keys on a row that has not been lifted move focus only. Moving the
    // row directly would leave a screen reader user unable to read the list
    // without reordering it.
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(document.activeElement).toBe(grabs(w)[1].element)
    w.unmount()
  })

  it('cancels a pick-up with Escape', async () => {
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    await grabs(w)[0].trigger('keydown', { key: 'Escape' })
    await grabs(w)[0].trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('does not move past either end', async () => {
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    await grabs(w)[0].trigger('keydown', { key: 'ArrowUp' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('announces the result, because a keyboard user cannot see it move', async () => {
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    expect(w.find('[aria-live]').text()).toContain('picked up')
    await grabs(w)[0].trigger('keydown', { key: 'ArrowDown' })
    expect(w.find('[aria-live]').text()).toContain('moved to position 2')
    w.unmount()
  })

  it('names each row with its position for assistive tech', () => {
    const w = mountList()
    expect(grabs(w)[1].attributes('aria-label')).toBe('Beta, 2 of 3')
  })

  it('does nothing at all when disabled', async () => {
    const w = mountList({ disabled: true }, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    await grabs(w)[0].trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(grabs(w)[0].attributes('tabindex')).toBe('-1')
    w.unmount()
  })

  it('labels the list and points at its instructions', () => {
    const w = mountList()
    expect(w.attributes('aria-label')).toBe('Fields')
    const hint = w.attributes('aria-describedby')
    expect(w.find(`#${hint}`).text()).toContain('Space or Enter to pick up')
  })

  it('exposes each item to the default slot', () => {
    const w = mount(ReorderList, {
      props: { modelValue: rows(), itemKey: 'id' },
      slots: { default: '<b class="row">{{ params.item.label }}</b>' },
    })
    expect(w.findAll('.row').map((n) => n.text())).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ])
  })
})

describe('NbReorderList pointer and keyboard together', () => {
  it('releases a keyboard-held row when a pointer drag starts', async () => {
    // Otherwise the row stays outlined as "picked up" while the mouse is
    // moving a different one, which claims something is held when nothing is.
    const w = mountList({}, true)
    await grabs(w)[0].trigger('keydown', { key: ' ' })
    expect(w.findAll('.nb-reorder-list__row--lifted')).toHaveLength(1)

    // Constructed rather than triggered: VTU cannot set `button` on a
    // MouseEvent in jsdom, and the handler ignores anything but the primary.
    w.findAll('.nb-reorder-list__row')[2].element.dispatchEvent(
      new MouseEvent('pointerdown', { button: 0, bubbles: true }),
    )
    await nextTick()
    expect(w.findAll('.nb-reorder-list__row--lifted')).toHaveLength(0)
    w.unmount()
  })
})

describe('NbReorderList text selection', () => {
  const down = (w: ReturnType<typeof mountList>, i: number) =>
    w
      .findAll('.nb-reorder-list__row')
      [
        i
      ].element.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))

  it('suppresses selection on the document while dragging', async () => {
    // On the document, not the list: the pointer leaves the list constantly
    // during a drag, and a selection started on a row extends past it.
    const w = mountList({}, true)
    expect(document.body.style.userSelect).toBe('')

    down(w, 0)
    await nextTick()
    expect(document.body.style.userSelect).toBe('none')

    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    await nextTick()
    expect(document.body.style.userSelect).toBe('')
    w.unmount()
  })

  it('restores whatever the host had rather than clearing it', async () => {
    document.body.style.userSelect = 'text'
    const w = mountList({}, true)
    down(w, 0)
    await nextTick()
    expect(document.body.style.userSelect).toBe('none')

    window.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }))
    await nextTick()
    expect(document.body.style.userSelect).toBe('text')
    document.body.style.userSelect = ''
    w.unmount()
  })

  it('does not leave the document unselectable if it unmounts mid-drag', async () => {
    const w = mountList({}, true)
    down(w, 0)
    await nextTick()
    expect(document.body.style.userSelect).toBe('none')
    w.unmount()
    expect(document.body.style.userSelect).toBe('')
  })
})

describe('NbReorderList touch', () => {
  // Rows laid out 40px apart, so a pointer at clientY picks a gap the same way
  // it would in a browser.
  const layout = (w: ReturnType<typeof mountList>) => {
    w.findAll('.nb-reorder-list__row').forEach((row, i) => {
      ;(row.element as HTMLElement).getBoundingClientRect = () =>
        ({ top: i * 40, height: 40, bottom: i * 40 + 40 }) as DOMRect
    })
  }
  const pointer = (
    type: string,
    init: { pointerId?: number; clientY?: number; pointerType?: string } = {},
  ) =>
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId: 7,
      pointerType: 'touch',
      ...init,
    })

  it('drags a row by its grip with a finger, end to end', async () => {
    const w = mountList({}, true)
    layout(w)
    const grip = grabs(w)[0].element as HTMLElement
    const capture = vi.fn()
    grip.setPointerCapture = capture

    grip.dispatchEvent(pointer('pointerdown'))
    await nextTick()
    expect(capture).toHaveBeenCalledWith(7)
    expect(w.find('.nb-reorder-list__row--dragging').exists()).toBe(true)

    window.dispatchEvent(pointer('pointermove', { clientY: 100 }))
    window.dispatchEvent(pointer('pointerup', { clientY: 100 }))
    await nextTick()
    expect(order(w)).toEqual(['b', 'c', 'a'])
    expect(w.emitted('reorder')?.at(-1)?.[0]).toMatchObject({
      from: 0,
      to: 2,
      via: 'pointer',
    })
    expect(w.find('.nb-reorder-list__row--dragging').exists()).toBe(false)
    w.unmount()
  })

  it('cleans up without moving when the browser cancels the pointer', async () => {
    // The bug this guards: a cancelled touch left the row held and the
    // listeners armed, so the next tap anywhere dropped the row there.
    const w = mountList({}, true)
    layout(w)
    const grip = grabs(w)[0].element as HTMLElement
    grip.setPointerCapture = vi.fn()

    grip.dispatchEvent(pointer('pointerdown'))
    window.dispatchEvent(pointer('pointermove', { clientY: 100 }))
    window.dispatchEvent(pointer('pointercancel'))
    await nextTick()
    expect(w.find('.nb-reorder-list__row--dragging').exists()).toBe(false)
    expect(w.find('.nb-reorder-list--dragging').exists()).toBe(false)
    expect(document.body.style.userSelect).toBe('')

    // A later tap lands nowhere in particular and must not move anything.
    window.dispatchEvent(pointer('pointerup', { clientY: 100 }))
    await nextTick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('does not start a drag from the row body with a finger', async () => {
    // That gesture belongs to the page scroll.
    const w = mountList({}, true)
    w.find('.nb-reorder-list__content').element.dispatchEvent(
      pointer('pointerdown'),
    )
    await nextTick()
    expect(w.find('.nb-reorder-list__row--dragging').exists()).toBe(false)
    w.unmount()
  })

  it('ignores a second finger while one is dragging', async () => {
    const w = mountList({}, true)
    layout(w)
    const grips = grabs(w).map((g) => g.element as HTMLElement)
    grips.forEach((g) => (g.setPointerCapture = vi.fn()))

    grips[0].dispatchEvent(pointer('pointerdown'))
    grips[2].dispatchEvent(pointer('pointerdown', { pointerId: 8 }))
    window.dispatchEvent(pointer('pointerup', { pointerId: 8, clientY: 0 }))
    await nextTick()
    expect(w.findAll('.nb-reorder-list__row')[0].classes()).toContain(
      'nb-reorder-list__row--dragging',
    )
    expect(w.emitted('update:modelValue')).toBeUndefined()

    window.dispatchEvent(pointer('pointermove', { clientY: 60 }))
    window.dispatchEvent(pointer('pointerup', { clientY: 60 }))
    await nextTick()
    expect(order(w)).toEqual(['b', 'a', 'c'])
    w.unmount()
  })

  it('does not capture a mouse, so desktop hover keeps working mid-drag', async () => {
    const w = mountList({}, true)
    const grip = grabs(w)[0].element as HTMLElement
    const capture = vi.fn()
    grip.setPointerCapture = capture
    grip.dispatchEvent(pointer('pointerdown', { pointerType: 'mouse' }))
    await nextTick()
    expect(capture).not.toHaveBeenCalled()
    expect(w.find('.nb-reorder-list__row--dragging').exists()).toBe(true)
    window.dispatchEvent(pointer('pointerup', { pointerType: 'mouse' }))
    w.unmount()
  })
})
