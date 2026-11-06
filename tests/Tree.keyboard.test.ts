import { describe, it, expect, afterEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import NbTree from '../src/components/Tree.vue'
import NbTreeNode from '../src/components/TreeNode.vue'

/*
 * The WAI-ARIA tree view keys: one tab stop (roving tabindex), Up and Down,
 * Home and End, Right to open or step into a branch, Left to close it or step
 * out to the parent, and first-letter typeahead.
 *
 *   docs
 *     guide
 *     getting started
 *   design
 *   api
 */

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

function mountTree(props: Record<string, unknown> = {}) {
  wrapper = mount(NbTree, {
    props,
    attachTo: document.body,
    slots: {
      default: () => [
        h(NbTreeNode, { id: 'docs', label: 'docs' }, () => [
          h(NbTreeNode, { id: 'guide', label: 'guide' }),
          h(NbTreeNode, { id: 'start', label: 'getting started' }),
        ]),
        h(NbTreeNode, { id: 'design', label: 'design' }),
        h(NbTreeNode, { id: 'api', label: 'api' }),
      ],
    },
  })
  return wrapper
}

const row = (id: string) =>
  document.querySelector<HTMLElement>(`[data-nb-tree-id="${id}"]`)!
const focusedId = () =>
  (document.activeElement as HTMLElement | null)?.getAttribute(
    'data-nb-tree-id',
  )
const tabStops = () =>
  [...document.querySelectorAll('[role="treeitem"][tabindex="0"]')].map((e) =>
    e.getAttribute('data-nb-tree-id'),
  )

async function press(key: string) {
  const target = document.activeElement as HTMLElement
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  await nextTick()
  await nextTick()
}

describe('NbTree keyboard', () => {
  it('puts exactly one row in the tab order, the first by default', async () => {
    mountTree()
    await nextTick()
    await nextTick()
    expect(tabStops()).toEqual(['docs'])
  })

  it('makes the selected row the tab stop', async () => {
    mountTree({ modelValue: 'design' })
    await nextTick()
    await nextTick()
    expect(tabStops()).toEqual(['design'])
  })

  it('moves with Up, Down, Home and End and carries the tab stop along', async () => {
    mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowDown')
    expect(focusedId()).toBe('design')
    expect(tabStops()).toEqual(['design'])
    await press('End')
    expect(focusedId()).toBe('api')
    await press('ArrowUp')
    expect(focusedId()).toBe('design')
    await press('Home')
    expect(focusedId()).toBe('docs')
  })

  it('opens a branch with Right, then steps into it', async () => {
    mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowRight')
    expect(row('docs').getAttribute('aria-expanded')).toBe('true')
    expect(focusedId()).toBe('docs')
    await press('ArrowRight')
    expect(focusedId()).toBe('guide')
  })

  it('steps out to the parent with Left, then closes it', async () => {
    mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowRight')
    await press('ArrowRight')
    expect(focusedId()).toBe('guide')
    await press('ArrowLeft')
    expect(focusedId()).toBe('docs')
    expect(row('docs').getAttribute('aria-expanded')).toBe('true')
    await press('ArrowLeft')
    expect(row('docs').getAttribute('aria-expanded')).toBe('false')
    expect(focusedId()).toBe('docs')
  })

  it('does not select every ancestor when Enter is pressed on a child', async () => {
    const w = mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowRight')
    await press('ArrowRight')
    await press('Enter')
    expect(w.emitted('select')).toEqual([['guide']])
  })

  it('jumps by first letter, wrapping, and repeats walk the matches', async () => {
    mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowRight')
    await press('a')
    expect(focusedId()).toBe('api')
    await press('g')
    expect(focusedId()).toBe('guide')
  })

  it('moves the tab stop off a row that collapses away', async () => {
    mountTree()
    await nextTick()
    row('docs').focus()
    await press('ArrowRight')
    await press('ArrowRight')
    expect(tabStops()).toEqual(['guide'])
    // Collapse the parent by pointer: the focused child unmounts.
    row('docs').querySelector<HTMLElement>('.nb-tree-node__toggle')!.click()
    await nextTick()
    await nextTick()
    await flushPromises()
    expect(tabStops()).toEqual(['docs'])
  })
})
