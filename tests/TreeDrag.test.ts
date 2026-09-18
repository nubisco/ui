import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import NbTree from '../src/components/Tree.vue'
import NbTreeNode from '../src/components/TreeNode.vue'
import type { ITreeDropEvent } from '../src/components/Tree.d'

const mounted: VueWrapper[] = []

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
})

/** Home > Manual > Chapter, plus a sibling root to drop on. */
function mountTree(drops: ITreeDropEvent[]) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          NbTree,
          { draggable: true, onDrop: (e: ITreeDropEvent) => drops.push(e) },
          () => [
            h(NbTreeNode, { id: 'home', label: 'Nubisco Home' }, () => [
              h(
                NbTreeNode,
                { id: 'manual', label: 'The Nubisco Manual' },
                () => [h(NbTreeNode, { id: 'chapter', label: 'Chapter one' })],
              ),
            ]),
            h(NbTreeNode, { id: 'other', label: 'Other' }),
          ],
        )
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

const row = (label: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('.nb-tree-node')).find(
    (el) =>
      el.querySelector('.nb-tree-node__label')?.textContent?.trim() === label,
  )!

/** jsdom has no DataTransfer, so the events carry a minimal stand-in. */
function dragEvent(type: string) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const data = new Map<string, string>()
  Object.assign(event, {
    clientY: 0,
    dataTransfer: {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: (k: string, v: string) => data.set(k, v),
      getData: (k: string) => data.get(k) ?? '',
    },
  })
  return event
}

async function expand(label: string) {
  row(label).querySelector<HTMLElement>('.nb-tree-node__toggle')!.click()
  await nextTick()
}

describe('NbTree drag', () => {
  it.each([
    ['The Nubisco Manual', 'manual'],
    ['Chapter one', 'chapter'],
    ['Nubisco Home', 'home'],
  ])('dragging "%s" drags that node, not an ancestor', async (label, id) => {
    const drops: ITreeDropEvent[] = []
    mountTree(drops)
    await expand('Nubisco Home')
    await expand('The Nubisco Manual')

    row(label).dispatchEvent(dragEvent('dragstart'))
    await nextTick()
    const target = row('Other')
    target.dispatchEvent(dragEvent('dragover'))
    target.dispatchEvent(dragEvent('drop'))

    expect(drops).toHaveLength(1)
    expect(drops[0].sourceId).toBe(id)
    expect(drops[0].targetId).toBe('other')
  })

  it.each([
    ['its own child', 'The Nubisco Manual'],
    ['its own grandchild', 'Chapter one'],
    ['itself', 'Nubisco Home'],
  ])('refuses a drop into %s', async (_, targetLabel) => {
    const drops: ITreeDropEvent[] = []
    mountTree(drops)
    await expand('Nubisco Home')
    await expand('The Nubisco Manual')

    row('Nubisco Home').dispatchEvent(dragEvent('dragstart'))
    await nextTick()
    const target = row(targetLabel)
    const over = dragEvent('dragover')
    target.dispatchEvent(over)
    // Not accepted, so the browser keeps showing "cannot drop".
    expect(over.defaultPrevented).toBe(false)
    expect(document.querySelector('.nb-tree-node--drop-inside')).toBeNull()

    target.dispatchEvent(dragEvent('drop'))
    expect(drops).toHaveLength(0)
  })

  it('still accepts a drop onto a node outside the dragged subtree', async () => {
    const drops: ITreeDropEvent[] = []
    mountTree(drops)
    await expand('Nubisco Home')

    row('Nubisco Home').dispatchEvent(dragEvent('dragstart'))
    await nextTick()
    const target = row('Other')
    target.dispatchEvent(dragEvent('dragover'))
    target.dispatchEvent(dragEvent('drop'))
    expect(drops).toHaveLength(1)
    expect(drops[0]).toMatchObject({ sourceId: 'home', targetId: 'other' })
  })

  it('still lets the dragstart reach listeners above the tree', async () => {
    const drops: ITreeDropEvent[] = []
    mountTree(drops)
    await expand('Nubisco Home')
    let seen = 0
    document.body.addEventListener('dragstart', () => seen++)
    row('The Nubisco Manual').dispatchEvent(dragEvent('dragstart'))
    expect(seen).toBe(1)
  })
})

describe('NbTreeNode children and drop inside', () => {
  const nodeRow = (id: string) =>
    document.querySelector<HTMLElement>(`[data-test-id="${id}"]`)!

  function mountList(
    children: Ref<string[]>,
    nodeProps: Record<string, unknown> = {},
    drops: ITreeDropEvent[] = [],
  ) {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            NbTree,
            { draggable: true, onDrop: (e: ITreeDropEvent) => drops.push(e) },
            () => [
              h(
                NbTreeNode,
                {
                  id: 'page',
                  label: 'Page',
                  'data-test-id': 'page',
                  ...nodeProps,
                },
                // Always a slot, sometimes empty: the shape of a tree rendered
                // from data, which is where the old check went wrong.
                () =>
                  children.value.map((id) => h(NbTreeNode, { id, label: id })),
              ),
              h(NbTreeNode, {
                id: 'moved',
                label: 'Moved',
                'data-test-id': 'moved',
              }),
            ],
          )
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    mounted.push(wrapper)
    return wrapper
  }

  it('a node whose slot renders nothing is a leaf', async () => {
    mountList(ref([]))
    await nextTick()
    const page = nodeRow('page')
    expect(page.classList.contains('nb-tree-node--leaf')).toBe(true)
    expect(page.querySelector('.nb-tree-node__toggle')).toBeNull()
    expect(page.hasAttribute('aria-expanded')).toBe(false)
  })

  it('gains a caret when its first child arrives, without remounting', async () => {
    const children = ref<string[]>([])
    mountList(children)
    await nextTick()
    const page = nodeRow('page')
    expect(page.querySelector('.nb-tree-node__toggle')).toBeNull()

    children.value = ['child']
    await nextTick()
    await nextTick()
    expect(nodeRow('page')).toBe(page)
    expect(page.classList.contains('nb-tree-node--branch')).toBe(true)
    expect(page.querySelector('.nb-tree-node__toggle')).not.toBeNull()
    expect(page.getAttribute('aria-expanded')).toBe('false')

    children.value = []
    await nextTick()
    await nextTick()
    expect(page.querySelector('.nb-tree-node__toggle')).toBeNull()
  })

  it('expandable forces the caret on or off', async () => {
    mountList(ref([]), { expandable: true })
    await nextTick()
    expect(
      nodeRow('page').querySelector('.nb-tree-node__toggle'),
    ).not.toBeNull()
    mounted.splice(0).forEach((w) => w.unmount())

    mountList(ref(['child']), { expandable: false })
    await nextTick()
    expect(nodeRow('page').querySelector('.nb-tree-node__toggle')).toBeNull()
  })

  /** Drags "Moved" over the middle of "Page" and drops it. */
  async function dropInMiddle(drops: ITreeDropEvent[]) {
    nodeRow('moved').dispatchEvent(dragEvent('dragstart'))
    await nextTick()
    const page = nodeRow('page')
    const label = page.querySelector<HTMLElement>('.nb-tree-node__label')!
    label.getBoundingClientRect = () => ({ top: 100, height: 32 }) as DOMRect
    const over = dragEvent('dragover')
    Object.assign(over, { clientY: 116 })
    page.dispatchEvent(over)
    page.dispatchEvent(dragEvent('drop'))
    return drops[0]
  }

  it('a childless node takes a drop inside by default, with no caret', async () => {
    const drops: ITreeDropEvent[] = []
    mountList(ref([]), {}, drops)
    await nextTick()
    expect(nodeRow('page').querySelector('.nb-tree-node__toggle')).toBeNull()
    const drop = await dropInMiddle(drops)
    expect(drop).toMatchObject({
      sourceId: 'moved',
      targetId: 'page',
      position: 'inside',
    })
  })

  it('droppable false leaves only before and after', async () => {
    const drops: ITreeDropEvent[] = []
    mountList(ref([]), { droppable: false }, drops)
    await nextTick()
    expect((await dropInMiddle(drops)).position).not.toBe('inside')
  })

  it('clicking a leaf does not toggle an empty group', async () => {
    const toggles: unknown[] = []
    mountList(ref([]), { onToggle: (...args: unknown[]) => toggles.push(args) })
    await nextTick()
    nodeRow('page').querySelector<HTMLElement>('.nb-tree-node__label')!.click()
    await nextTick()
    expect(toggles).toHaveLength(0)
  })
})
