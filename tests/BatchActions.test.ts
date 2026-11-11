import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { h } from 'vue'
import NbBatchActions from '../src/components/BatchActions.vue'
import NbButton from '../src/components/Button.vue'
import NbOverflowMenu from '../src/components/OverflowMenu.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'
import type { IActionGroupItem } from '../src/components/ActionGroup.d'

enableAutoUnmount(afterEach)
afterEach(() => unstubPhone())

const items = (): IActionGroupItem[] => [
  { id: 'export', label: 'Export', icon: 'export', onSelect: vi.fn() },
  { id: 'delete', label: 'Delete', icon: 'trash', onSelect: vi.fn() },
]

describe('NbBatchActions', () => {
  it('shows the count, the actions and Cancel last', () => {
    const w = mount(NbBatchActions, { props: { count: 3, items: items() } })
    expect(w.attributes('role')).toBe('region')
    expect(w.attributes('aria-label')).toBe('Batch actions')
    expect(w.find('.nb-batch-actions__count').text()).toBe('3 selected')
    const buttons = w.findAll('button').map((b) => b.text())
    expect(buttons).toEqual(['Export', 'Delete', 'Cancel'])
  })

  it('runs an action and emits select', async () => {
    const list = items()
    const w = mount(NbBatchActions, { props: { count: 1, items: list } })
    await w.findAll('button')[1].trigger('click')
    expect(list[1].onSelect).toHaveBeenCalledOnce()
    expect(w.emitted('select')).toEqual([['delete']])
  })

  it('emits cancel, and takes its own cancel text', async () => {
    const w = mount(NbBatchActions, {
      props: { count: 1, cancelLabel: 'Clear selection' },
    })
    const cancel = w.find('.nb-batch-actions__cancel')
    expect(cancel.text()).toBe('Clear selection')
    await cancel.trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })

  it('sizes and squares slotted buttons as an overlay', () => {
    const w = mount(NbBatchActions, {
      props: { count: 1, size: 'md' },
      slots: { default: () => h(NbButton, () => 'Archive') },
    })
    expect(w.classes()).toContain('nb-batch-actions--overlay')
    const archive = w.findAll('.nb-button')[0]
    expect(archive.classes()).toContain('nb-button--md')
    expect(archive.classes()).toContain('nb-button--flush')
  })

  it('keeps corners as a floating bar', () => {
    const w = mount(NbBatchActions, {
      props: { count: 1, variant: 'floating' },
      slots: { default: () => h(NbButton, () => 'Archive') },
    })
    expect(w.classes()).toContain('nb-batch-actions--floating')
    expect(w.find('.nb-button--flush').exists()).toBe(false)
    expect(w.find('.nb-button').classes()).toContain('nb-button--sm')
  })

  it('folds the items into a menu and Cancel into an icon on a phone', () => {
    stubPhone()
    const w = mount(NbBatchActions, {
      props: { count: 2, items: items() },
      slots: {
        default: (p: { phone: boolean }) =>
          h('span', { class: 'flag' }, String(p.phone)),
      },
    })
    expect(w.findComponent(NbOverflowMenu).props('items')).toHaveLength(2)
    const cancel = w.find('.nb-batch-actions__cancel')
    expect(cancel.classes()).toContain('nb-button--icon-only')
    expect(cancel.attributes('aria-label')).toBe('Cancel')
    expect(w.find('.flag').text()).toBe('true')
  })
})

describe('NbBatchActions disabled reason', () => {
  it('passes a disabled action its reason, so it stays focusable', () => {
    const w = mount(NbBatchActions, {
      props: {
        count: 2,
        items: [
          {
            id: 'send',
            label: 'Send',
            disabled: true,
            disabledReason: 'Already sent',
          },
        ],
      },
    })
    const send = w.findAll('button').find((b) => b.text() === 'Send')
    expect(send?.attributes('aria-disabled')).toBe('true')
    expect(send?.attributes('disabled')).toBeUndefined()
  })
})
