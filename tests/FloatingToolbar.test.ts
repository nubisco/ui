import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import FloatingToolbar from '../src/components/FloatingToolbar.vue'

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

/** A selection has a rectangle and no element: this is the main consumer. */
const selectionRect = { top: 300, left: 400, width: 120, height: 18 }

function mountToolbar(
  props: Record<string, unknown> = {},
  buttons = ['Bold', 'Italic', 'Link'],
) {
  const wrapper = mount(FloatingToolbar, {
    props: {
      open: true,
      label: 'Text formatting',
      anchor: selectionRect,
      ...props,
    },
    slots: {
      default: () =>
        buttons.map((text) =>
          h('button', { type: 'button', class: 'b' }, text),
        ),
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}

const toolbar = () =>
  document.body.querySelector<HTMLElement>('.nb-floating-toolbar')
const buttons = () =>
  Array.from(document.body.querySelectorAll<HTMLButtonElement>('button.b'))

async function settle() {
  await nextTick()
  await nextTick()
}

describe('NbFloatingToolbar', () => {
  it('renders a named toolbar with an orientation', async () => {
    mountToolbar()
    await settle()
    const el = toolbar()
    expect(el).not.toBeNull()
    expect(el?.getAttribute('role')).toBe('toolbar')
    expect(el?.getAttribute('aria-label')).toBe('Text formatting')
    expect(el?.getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('renders nothing while closed or without an anchor', async () => {
    mountToolbar({ open: false })
    await settle()
    expect(toolbar()).toBeNull()
    mounted.splice(0).forEach((w) => w.unmount())

    mountToolbar({ anchor: null })
    await settle()
    expect(toolbar()).toBeNull()
  })

  it('positions itself against a plain rectangle (virtual anchor)', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    // The toolbar measures its layout size, which jsdom reports as zero.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
    mountToolbar({ gap: 8 })
    await settle()
    const el = toolbar()!
    // Centred over the rectangle, 8px above it.
    expect(el.style.top).toBe(`${300 - 40 - 8}px`)
    expect(el.style.left).toBe(`${400 + 60 - 100}px`)
    expect(el.classList.contains('nb-floating-toolbar--top')).toBe(true)
  })

  it('flips below a rectangle at the top of the viewport', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    // The toolbar measures its layout size, which jsdom reports as zero.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
    mountToolbar({ anchor: { top: 10, left: 400, width: 120, height: 18 } })
    await settle()
    const el = toolbar()!
    expect(el.classList.contains('nb-floating-toolbar--bottom')).toBe(true)
    expect(el.style.top).toBe(`${10 + 18 + 8}px`)
  })

  it('re-reads a virtual anchor object on every reposition', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    let top = 300
    const anchor = {
      getBoundingClientRect: () => ({ top, left: 400, width: 120, height: 18 }),
    }
    const wrapper = mountToolbar({ anchor })
    await settle()
    const first = toolbar()!.style.top

    top = 500
    ;(wrapper.vm as unknown as { reposition: () => void }).reposition()
    await nextTick()
    expect(toolbar()!.style.top).not.toBe(first)
  })

  it('does not move focus when it appears', async () => {
    const editor = document.createElement('div')
    editor.tabIndex = 0
    document.body.appendChild(editor)
    editor.focus()
    expect(document.activeElement).toBe(editor)

    mountToolbar()
    await settle()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(document.activeElement).toBe(editor)
  })

  it('cancels mousedown so pressing a button does not blur the editor', async () => {
    mountToolbar()
    await settle()
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    })
    buttons()[0].dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves mousedown alone on a text field inside the toolbar', async () => {
    const wrapper = mount(FloatingToolbar, {
      props: { open: true, label: 'Link', anchor: selectionRect },
      slots: { default: () => h('input', { class: 'url' }) },
      attachTo: document.body,
    })
    mounted.push(wrapper)
    await settle()
    const input = document.body.querySelector('input.url')!
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('is a single tab stop (roving tabindex)', async () => {
    mountToolbar()
    await settle()
    expect(buttons().map((b) => b.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
    ])
  })

  it('moves focus with the arrow keys, wrapping, and Home / End', async () => {
    const wrapper = mountToolbar()
    await settle()
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    expect(document.activeElement).toBe(buttons()[0])

    const press = (key: string) =>
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )

    press('ArrowRight')
    expect(document.activeElement).toBe(buttons()[1])
    expect(buttons()[1].getAttribute('tabindex')).toBe('0')
    expect(buttons()[0].getAttribute('tabindex')).toBe('-1')

    press('ArrowLeft')
    press('ArrowLeft')
    expect(document.activeElement).toBe(buttons()[2])

    press('Home')
    expect(document.activeElement).toBe(buttons()[0])
    press('End')
    expect(document.activeElement).toBe(buttons()[2])
    press('ArrowRight')
    expect(document.activeElement).toBe(buttons()[0])
  })

  it('uses the up and down arrows when vertical', async () => {
    const wrapper = mountToolbar({ orientation: 'vertical' })
    await settle()
    expect(toolbar()!.getAttribute('aria-orientation')).toBe('vertical')
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      )
    press('ArrowRight')
    expect(document.activeElement).toBe(buttons()[0])
    press('ArrowDown')
    expect(document.activeElement).toBe(buttons()[1])
  })

  it('skips disabled controls', async () => {
    const wrapper = mount(FloatingToolbar, {
      props: { open: true, label: 'Text formatting', anchor: selectionRect },
      slots: {
        default: () => [
          h('button', { class: 'b' }, 'Bold'),
          h('button', { class: 'b', disabled: true }, 'Italic'),
          h('button', { class: 'b' }, 'Link'),
        ],
      },
      attachTo: document.body,
    })
    mounted.push(wrapper)
    await settle()
    ;(wrapper.vm as unknown as { focus: () => void }).focus()
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    )
    expect(document.activeElement).toBe(buttons()[2])
  })

  it('takes the tab stop to whichever control receives focus', async () => {
    mountToolbar()
    await settle()
    buttons()[2].focus()
    expect(buttons()[2].getAttribute('tabindex')).toBe('0')
    expect(buttons()[0].getAttribute('tabindex')).toBe('-1')
  })

  it('emits close on Escape and never closes itself', async () => {
    const wrapper = mountToolbar()
    await settle()
    buttons()[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toolbar()).not.toBeNull()
  })

  it('hosts ordinary NbButtons', async () => {
    const { default: NbButton } = await import('../src/components/Button.vue')
    const Host = defineComponent({
      setup() {
        const clicks = ref(0)
        return () =>
          h(
            FloatingToolbar,
            { open: true, label: 'Text formatting', anchor: selectionRect },
            () => [
              h(
                NbButton,
                {
                  icon: 'text-b',
                  'aria-label': 'Bold',
                  onClick: () => clicks.value++,
                },
                undefined,
              ),
              h('output', { class: 'clicks' }, String(clicks.value)),
            ],
          )
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    mounted.push(wrapper)
    await settle()
    const bold = document.body.querySelector<HTMLButtonElement>(
      '.nb-floating-toolbar .nb-button',
    )!
    expect(bold.getAttribute('tabindex')).toBe('0')
    bold.click()
    await nextTick()
    expect(document.body.querySelector('.clicks')!.textContent).toBe('1')
  })

  it('stops listening to scroll and resize once closed', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountToolbar()
    await settle()
    await wrapper.setProps({ open: false })
    await settle()
    const removed = remove.mock.calls.map((c) => c[0])
    expect(removed).toContain('scroll')
    expect(removed).toContain('resize')
  })
})
