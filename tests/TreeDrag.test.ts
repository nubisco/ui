import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
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
