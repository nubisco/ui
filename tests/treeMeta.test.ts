import { describe, it, expect, afterEach } from 'vitest'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'
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

describe('NbTreeNode rows on a phone touch screen', () => {
  afterEach(() => unstubPhone())

  const mountTree = (compact: boolean) =>
    mount(NbTree, {
      props: { compact },
      slots: { default: () => h(NbTreeNode, { id: 'a', label: 'about' }) },
    })
  const height = (w: ReturnType<typeof mountTree>) =>
    (w.find('.nb-tree-node__label').element as HTMLElement).style.minHeight

  it('keeps 32px and 24px rows off a touch phone', () => {
    stubPhone()
    expect(height(mountTree(false))).toBe('32px')
    expect(height(mountTree(true))).toBe('24px')
  })

  it('makes every row a fingertip tall, compact or not', () => {
    stubPhone({ touch: true })
    expect(height(mountTree(false))).toBe('44px')
    expect(height(mountTree(true))).toBe('44px')
  })
})
