import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DragHandle from '../src/components/DragHandle.vue'
import type { IDragHandleEvent } from '../src/components/DragHandle.d'

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  document.documentElement.classList.remove('nb-drag-handle-grabbing')
})

function mountHandle(props: Record<string, unknown> = {}) {
  const wrapper = mount(DragHandle, {
    props: { label: 'Move Introduction', ...props },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

/** jsdom has no PointerEvent constructor, so build one from MouseEvent. */
function pointer(
  type: string,
  init: { x?: number; y?: number; id?: number; button?: number } = {},
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: init.button ?? 0,
  })
  Object.defineProperty(event, 'pointerId', { value: init.id ?? 1 })
  return event
}

function key(el: Element, name: string) {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    cancelable: true,
  })
  el.dispatchEvent(event)
  return event
}

const payloads = (wrapper: VueWrapper, name: string) =>
  (wrapper.emitted(name) ?? []).map((args) => args[0] as IDragHandleEvent)

describe('NbDragHandle', () => {
  describe('semantics', () => {
    it('is a button with an accessible name and instructions', () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button')
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('aria-label')).toBe('Move Introduction')
      const describedBy = button.attributes('aria-describedby')!
      expect(wrapper.get(`#${describedBy}`).text()).toContain('arrow keys')
    })

    it('uses the six-dot grip glyph, laid flat for a horizontal axis', () => {
      expect(
        mountHandle().get('[data-testid="nb-icon"]').attributes('data-name'),
      ).toBe('dots-six-vertical')
      expect(
        mountHandle({ axis: 'horizontal' })
          .get('[data-testid="nb-icon"]')
          .attributes('data-name'),
      ).toBe('dots-six')
    })

    it('hides the glyph from assistive technology', () => {
      expect(
        mountHandle().get('[data-testid="nb-icon"]').attributes('aria-hidden'),
      ).toBe('true')
    })

    it('renders the announcement in a polite live region', async () => {
      const wrapper = mountHandle()
      await wrapper.setProps({ announcement: 'Moved to position 3 of 5' })
      const live = wrapper.get('[aria-live="polite"]')
      expect(live.text()).toBe('Moved to position 3 of 5')
    })

    it('can be disabled', () => {
      expect(
        mountHandle({ disabled: true }).get('button').attributes('disabled'),
      ).toBeDefined()
    })

    it('is draggable only in native mode', () => {
      expect(
        mountHandle().get('button').attributes('draggable'),
      ).toBeUndefined()
      expect(
        mountHandle({ native: true }).get('button').attributes('draggable'),
      ).toBe('true')
    })
  })

  describe('keyboard', () => {
    it('picks up with Space, moves with arrows, drops with Enter', async () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element

      expect(key(button, ' ').defaultPrevented).toBe(true)
      await nextTick()
      expect(payloads(wrapper, 'drag-start')).toHaveLength(1)
      expect(payloads(wrapper, 'drag-start')[0].via).toBe('keyboard')
      expect(button.getAttribute('aria-label')).toBe(
        'Move Introduction, picked up',
      )
      expect(button.classList.contains('nb-drag-handle--grabbed')).toBe(true)

      key(button, 'ArrowDown')
      key(button, 'ArrowDown')
      key(button, 'ArrowUp')
      const moves = payloads(wrapper, 'drag-move')
      expect(moves.map((m) => m.direction)).toEqual(['down', 'down', 'up'])
      expect(moves.map((m) => m.deltaY)).toEqual([1, 2, 1])

      key(button, 'Enter')
      await nextTick()
      const end = payloads(wrapper, 'drag-end')
      expect(end).toHaveLength(1)
      expect(end[0]).toMatchObject({ via: 'keyboard', deltaY: 1, deltaX: 0 })
      expect(button.getAttribute('aria-label')).toBe('Move Introduction')
    })

    it('ignores arrow keys until the item is picked up', () => {
      const wrapper = mountHandle()
      const event = key(wrapper.get('button').element, 'ArrowDown')
      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.emitted('drag-move')).toBeUndefined()
    })

    it('only moves along its own axis', () => {
      const wrapper = mountHandle({ axis: 'horizontal' })
      const button = wrapper.get('button').element
      key(button, 'Enter')
      key(button, 'ArrowDown')
      key(button, 'ArrowRight')
      expect(payloads(wrapper, 'drag-move').map((m) => m.direction)).toEqual([
        'right',
      ])
    })

    it('moves in both axes when axis is both', () => {
      const wrapper = mountHandle({ axis: 'both' })
      const button = wrapper.get('button').element
      key(button, 'Enter')
      key(button, 'ArrowLeft')
      key(button, 'ArrowDown')
      expect(payloads(wrapper, 'drag-move').map((m) => m.direction)).toEqual([
        'left',
        'down',
      ])
    })

    it('cancels with Escape', async () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element
      key(button, 'Enter')
      key(button, 'ArrowDown')
      key(button, 'Escape')
      await nextTick()
      expect(payloads(wrapper, 'drag-cancel')[0]).toMatchObject({
        via: 'keyboard',
        deltaY: 1,
      })
      expect(wrapper.emitted('drag-end')).toBeUndefined()
    })

    it('does not fire the host click on a keyboard pick-up', async () => {
      const onClick = vi.fn()
      const wrapper = mount(DragHandle, {
        props: { label: 'Move', onClick },
        attachTo: document.body,
      })
      mounted.push(wrapper)
      const button = wrapper.get('button').element
      key(button, ' ')
      // Firefox synthesises this click from the Space keyup.
      button.click()
      expect(onClick).not.toHaveBeenCalled()
    })

    it('drops when focus moves to another control', async () => {
      const wrapper = mountHandle()
      const other = document.createElement('button')
      document.body.appendChild(other)
      const button = wrapper.get('button').element
      button.focus()
      key(button, 'Enter')
      other.focus()
      await nextTick()
      expect(payloads(wrapper, 'drag-end')[0].via).toBe('keyboard')
    })

    it('keeps holding when the host moves the handle in the DOM', async () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element as HTMLButtonElement
      button.focus()
      key(button, 'Enter')
      // A node moved by the host loses focus with nowhere for it to go.
      button.blur()
      expect(document.activeElement).toBe(document.body)
      await new Promise((resolve) => requestAnimationFrame(resolve))
      expect(wrapper.emitted('drag-end')).toBeUndefined()
      expect(document.activeElement).toBe(button)
    })

    it('cancels a held item when it becomes disabled', async () => {
      const wrapper = mountHandle()
      key(wrapper.get('button').element, 'Enter')
      await wrapper.setProps({ disabled: true })
      expect(payloads(wrapper, 'drag-cancel')).toHaveLength(1)
    })
  })

  describe('pointer', () => {
    it('stays a click below the threshold', async () => {
      const onClick = vi.fn()
      const wrapper = mount(DragHandle, {
        props: { label: 'Move', threshold: 4, onClick },
        attachTo: document.body,
      })
      mounted.push(wrapper)
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown', { x: 10, y: 10 }))
      button.dispatchEvent(pointer('pointermove', { x: 12, y: 11 }))
      button.dispatchEvent(pointer('pointerup', { x: 12, y: 11 }))
      button.click()
      expect(wrapper.emitted('drag-start')).toBeUndefined()
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('emits the lifecycle once past the threshold, and eats the click', async () => {
      const onClick = vi.fn()
      const wrapper = mount(DragHandle, {
        props: { label: 'Move', onClick },
        attachTo: document.body,
      })
      mounted.push(wrapper)
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown', { x: 10, y: 10 }))
      button.dispatchEvent(pointer('pointermove', { x: 10, y: 30 }))
      await nextTick()
      expect(payloads(wrapper, 'drag-start')[0]).toMatchObject({
        via: 'pointer',
        clientY: 30,
        deltaY: 20,
      })
      expect(button.classList.contains('nb-drag-handle--dragging')).toBe(true)
      expect(
        document.documentElement.classList.contains('nb-drag-handle-grabbing'),
      ).toBe(true)

      button.dispatchEvent(pointer('pointermove', { x: 15, y: 50 }))
      button.dispatchEvent(pointer('pointerup', { x: 15, y: 50 }))
      button.click()
      await nextTick()

      expect(payloads(wrapper, 'drag-move').map((m) => m.deltaY)).toEqual([
        20, 40,
      ])
      expect(payloads(wrapper, 'drag-end')[0]).toMatchObject({
        deltaX: 5,
        deltaY: 40,
      })
      expect(onClick).not.toHaveBeenCalled()
      expect(
        document.documentElement.classList.contains('nb-drag-handle-grabbing'),
      ).toBe(false)
    })

    it('cancels a pointer drag on Escape', () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown', { x: 0, y: 0 }))
      button.dispatchEvent(pointer('pointermove', { x: 0, y: 20 }))
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      expect(payloads(wrapper, 'drag-cancel')[0].via).toBe('pointer')
      button.dispatchEvent(pointer('pointerup', { x: 0, y: 20 }))
      expect(wrapper.emitted('drag-end')).toBeUndefined()
    })

    it('reports pointercancel as a cancel', () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown'))
      button.dispatchEvent(pointer('pointermove', { y: 20 }))
      button.dispatchEvent(pointer('pointercancel', { y: 20 }))
      expect(payloads(wrapper, 'drag-cancel')).toHaveLength(1)
    })

    it('ignores secondary mouse buttons', () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown', { button: 2 }))
      button.dispatchEvent(pointer('pointermove', { y: 40 }))
      expect(wrapper.emitted('drag-start')).toBeUndefined()
    })

    it('cancel() ends a drag in progress', () => {
      const wrapper = mountHandle()
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown'))
      button.dispatchEvent(pointer('pointermove', { y: 20 }))
      ;(wrapper.vm as unknown as { cancel: () => void }).cancel()
      expect(payloads(wrapper, 'drag-cancel')).toHaveLength(1)
    })
  })

  describe('native drag and drop', () => {
    it('forwards the DragEvent so the host can fill dataTransfer', () => {
      const wrapper = mountHandle({ native: true })
      const button = wrapper.get('button').element
      const start = new Event('dragstart', { bubbles: true })
      button.dispatchEvent(start)
      expect(payloads(wrapper, 'drag-start')[0]).toMatchObject({
        via: 'native',
        event: start,
      })
      button.dispatchEvent(new Event('dragend', { bubbles: true }))
      expect(payloads(wrapper, 'drag-end')).toHaveLength(1)
    })

    it('does not start pointer tracking in native mode', () => {
      const wrapper = mountHandle({ native: true })
      const button = wrapper.get('button').element
      button.dispatchEvent(pointer('pointerdown'))
      button.dispatchEvent(pointer('pointermove', { y: 40 }))
      expect(wrapper.emitted('drag-start')).toBeUndefined()
    })
  })
})
