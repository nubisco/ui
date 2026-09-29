import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import NbTree from '../src/components/Tree.vue'
import NbTreeNode from '../src/components/TreeNode.vue'

describe('NbTreeNode meta slot', () => {
  it('renders the meta slot in its own always-visible container, before the actions', () => {
    const w = mount(NbTree, {
      slots: {
        default: () =>
          h(
            NbTreeNode,
            { id: 'p', label: 'pricing' },
            {
              meta: () => h('span', { class: 'state' }, 'In review'),
              actions: () => h('button', { class: 'act' }, 'x'),
            },
          ),
      },
    })
    const meta = w.find('.nb-tree-node__meta')
    expect(meta.exists()).toBe(true)
    expect(meta.text()).toBe('In review')
    // It is not the hover-only actions container.
    expect(meta.element.closest('.nb-tree-node__actions')).toBeNull()
    const order = [
      ...w.element.querySelectorAll(
        '.nb-tree-node__meta, .nb-tree-node__actions',
      ),
    ].map((e) => e.className)
    expect(order).toEqual(['nb-tree-node__meta', 'nb-tree-node__actions'])
    w.unmount()
  })

  it('renders no meta container when the slot is not used', () => {
    const w = mount(NbTree, {
      slots: { default: () => h(NbTreeNode, { id: 'a', label: 'about' }) },
    })
    expect(w.find('.nb-tree-node__meta').exists()).toBe(false)
    w.unmount()
  })
})
