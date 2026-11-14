import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import ButtonSet from '../src/components/ButtonSet.vue'
import Button from '../src/components/Button.vue'
import Modal from '../src/components/Modal.vue'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const labels = (root: Element) =>
  Array.from(root.querySelectorAll('.nb-button')).map((b) =>
    (b.textContent ?? '').trim(),
  )

describe('NbButtonSet rank order (dialog footers)', () => {
  it('puts the primary first in the DOM, whatever the slot order', () => {
    const w = mount(ButtonSet, {
      props: { focusOrder: 'rank' },
      slots: {
        default: () => [
          h(Button, { variant: 'primary' }, () => 'Save'),
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
        ],
      },
    })
    // The row is drawn reversed, so first in the DOM is rightmost on screen.
    expect(labels(w.element)).toEqual(['Save', 'Cancel'])
  })

  it('reads a slot written secondary-first the same way', () => {
    const w = mount(ButtonSet, {
      props: { focusOrder: 'rank' },
      slots: {
        default: () => [
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
          h(Button, { variant: 'primary' }, () => 'Save'),
        ],
      },
    })
    expect(labels(w.element)).toEqual(['Save', 'Cancel'])
  })

  it('ranks the others from the right-hand end back to the left', () => {
    const w = mount(ButtonSet, {
      props: { focusOrder: 'rank' },
      slots: {
        default: () => [
          h(Button, { variant: 'ghost' }, () => 'Skip'),
          h(Button, { variant: 'secondary' }, () => 'Back'),
          h(Button, { variant: 'primary' }, () => 'Next'),
        ],
      },
    })
    expect(labels(w.element)).toEqual(['Next', 'Back', 'Skip'])
  })

  it('treats a filled danger as the primary, and an outlined one as not', () => {
    const danger = mount(ButtonSet, {
      props: { focusOrder: 'rank' },
      slots: {
        default: () => [
          h(Button, { variant: 'danger' }, () => 'Delete'),
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
        ],
      },
    })
    expect(labels(danger.element)).toEqual(['Delete', 'Cancel'])

    const outlined = mount(ButtonSet, {
      props: { focusOrder: 'rank' },
      slots: {
        default: () => [
          h(Button, { variant: 'primary', outlined: '' }, () => 'Preview'),
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
        ],
      },
    })
    // No primary: the slot order is kept on screen, so the DOM is reversed.
    expect(labels(outlined.element)).toEqual(['Cancel', 'Preview'])
  })

  it('opens fragments and skips v-if placeholders', async () => {
    const show = ref(false)
    const Host = defineComponent({
      setup: () => () =>
        h(
          ButtonSet,
          { focusOrder: 'rank' },
          {
            default: () => [
              show.value ? h(Button, { variant: 'ghost' }, () => 'Skip') : null,
              h(Button, { variant: 'primary' }, () => 'Next'),
            ],
          },
        ),
    })
    const w = mount(Host)
    expect(labels(w.element)).toEqual(['Next'])
    show.value = true
    await nextTick()
    expect(labels(w.element)).toEqual(['Next', 'Skip'])
  })
})

describe('NbButtonSet reading order (the default)', () => {
  it('puts the primary last in a row, whatever the slot order', () => {
    const w = mount(ButtonSet, {
      slots: {
        default: () => [
          h(Button, { variant: 'primary' }, () => 'Next'),
          h(Button, { variant: 'ghost' }, () => 'Skip'),
          h(Button, { variant: 'secondary' }, () => 'Back'),
        ],
      },
    })
    // Drawn forwards, so the DOM (and the tab order) is the order on screen.
    expect(labels(w.element)).toEqual(['Skip', 'Back', 'Next'])
    expect(w.classes()).toContain('nb-button-set--reading')
  })

  it('puts the primary first in a stacked set', () => {
    const w = mount(ButtonSet, {
      props: { stack: 'always' },
      slots: {
        default: () => [
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
          h(Button, { variant: 'primary' }, () => 'Save'),
        ],
      },
    })
    expect(labels(w.element)).toEqual(['Save', 'Cancel'])
  })
})

describe('NbButtonSet', () => {
  it('warns in development past three buttons', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(ButtonSet, {
      slots: {
        default: () =>
          ['A', 'B', 'C', 'D'].map((t) =>
            h(Button, { variant: 'ghost' }, () => t),
          ),
      },
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[NbButtonSet] 4 buttons'),
    )
  })
})

describe('NbButtonSet props', () => {
  it('reflects fluid, stack and align as classes', () => {
    const w = mount(ButtonSet, {
      props: { fluid: true, stack: 'phone', align: 'end' },
    })
    expect(w.classes()).toEqual(
      expect.arrayContaining([
        'nb-button-set--fluid',
        'nb-button-set--stack-phone',
        'nb-button-set--align-end',
      ]),
    )
  })

  it('defaults to a row that never stacks, gathered at the start', () => {
    const w = mount(ButtonSet)
    expect(w.classes()).toContain('nb-button-set--stack-never')
    expect(w.classes()).toContain('nb-button-set--align-start')
    expect(w.classes()).not.toContain('nb-button-set--fluid')
  })

  it('gives every NbButton the set size, over its own', () => {
    const w = mount(ButtonSet, {
      props: { size: 'xl' },
      slots: {
        default: () => [
          h(Button, { variant: 'secondary', size: 'sm' }, () => 'Cancel'),
          h(Button, { variant: 'primary' }, () => 'Save'),
        ],
      },
    })
    const sizes = w
      .findAll('.nb-button')
      .map((b) =>
        b.classes().find((c) => /^nb-button--(xs|sm|md|lg|xl)$/.test(c)),
      )
    expect(sizes).toEqual(['nb-button--xl', 'nb-button--xl'])
  })
})

describe('NbButtonSet inside a v-for', () => {
  /*
   * The list hands in a new item object on every change, so the buttons are
   * only right if the set ranks them again on the parent's re-render.
   */
  const Host = defineComponent({
    components: { NbButtonSet: ButtonSet, NbButton: Button },
    setup() {
      const n = ref(0)
      const clicked = ref<number[]>([])
      const items = computed(() => [{ k: 'a', v: n.value }])
      return { n, clicked, items }
    },
    template: `
      <div v-for="i in items" :key="i.k">
        <NbButtonSet>
          <NbButton variant="primary" @click="clicked.push(i.v)">v{{ i.v }}</NbButton>
          <NbButton v-if="i.v === 0">zero</NbButton>
        </NbButtonSet>
      </div>`,
  })

  it('follows a new item: its label, its v-if and its click handler', async () => {
    const w = mount(Host)
    expect(labels(w.element)).toEqual(['zero', 'v0'])
    ;(w.vm as unknown as { n: number }).n = 1
    await nextTick()
    expect(labels(w.element)).toEqual(['v1'])

    await w.find('.nb-button').trigger('click')
    expect((w.vm as unknown as { clicked: number[] }).clicked).toEqual([1])
  })
})

describe('NbModal footer', () => {
  it('is an NbButtonSet of xl buttons with the primary first in the DOM', async () => {
    mount(Modal, {
      props: { open: true, title: 'Rename workspace' },
      slots: {
        footer: () => [
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
          h(Button, { variant: 'primary' }, () => 'Rename'),
        ],
      },
      attachTo: document.body,
    })
    await nextTick()
    const footer = document.querySelector('.nb-modal--footer')!
    expect(footer.querySelector('.nb-button-set--fluid')).not.toBeNull()
    expect(labels(footer)).toEqual(['Rename', 'Cancel'])
    for (const b of footer.querySelectorAll('.nb-button')) {
      expect(b.classList).toContain('nb-button--xl')
    }
  })

  it('opens on the primary when the body has nothing to focus', async () => {
    mount(Modal, {
      props: { open: false, title: 'Publish' },
      slots: {
        default: () => h('p', 'Publish the draft?'),
        footer: () => [
          h(Button, { variant: 'secondary' }, () => 'Cancel'),
          h(Button, { variant: 'primary', class: 'go' }, () => 'Publish'),
        ],
      },
      attachTo: document.body,
    }).setProps({ open: true })
    await nextTick()
    await nextTick()
    expect(document.activeElement?.classList).toContain('go')
  })

  it('steps over a danger primary to the secondary', async () => {
    mount(Modal, {
      props: { open: false, title: 'Delete' },
      slots: {
        default: () => h('p', 'Delete the draft?'),
        footer: () => [
          h(Button, { variant: 'secondary', class: 'cancel' }, () => 'Cancel'),
          h(Button, { variant: 'danger' }, () => 'Delete'),
        ],
      },
      attachTo: document.body,
    }).setProps({ open: true })
    await nextTick()
    await nextTick()
    expect(document.activeElement?.classList).toContain('cancel')
  })
})
