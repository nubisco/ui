import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import NbActionGroup from '../src/components/ActionGroup.vue'
import NbButton from '../src/components/Button.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbToolbar from '../src/components/Toolbar.vue'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'
import type { IActionGroupItem } from '../src/components/ActionGroup.d'

function stubPhone(on: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: on && query === NB_PHONE_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const items = (): IActionGroupItem[] => [
  { id: 'edit', label: 'Edit', icon: 'pencil-simple', onSelect: vi.fn() },
  {
    id: 'add',
    label: 'Add item',
    icon: 'plus',
    variant: 'primary',
    priority: 'primary',
    onSelect: vi.fn(),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    danger: true,
    onSelect: vi.fn(),
  },
]

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
})

describe('NbActionGroup on a desktop', () => {
  it('renders the same buttons a product would place by hand', () => {
    stubPhone(false)
    const list = items()
    const group = mount(NbActionGroup, { props: { items: list } })
    const byHand = mount({
      render: () =>
        h('div', { class: 'nb-action-group' }, [
          h(NbButton, { size: 'sm', icon: 'pencil-simple' }, () => 'Edit'),
          h(
            NbButton,
            { size: 'sm', icon: 'plus', variant: 'primary' },
            () => 'Add item',
          ),
          h(
            NbButton,
            { size: 'sm', icon: 'trash', variant: 'danger' },
            () => 'Delete',
          ),
        ]),
    })
    // The buttons, not the wrapper's markup: the group renders through a
    // fragment and keeps a placeholder for its overflow menu.
    const buttons = (w: typeof group | typeof byHand) =>
      w.findAll('.nb-button').map((b) => b.html())
    expect(group.classes()).toEqual(['nb-action-group'])
    expect(buttons(group)).toEqual(buttons(byHand))
  })

  it('keeps the labelled buttons with overflow="phone" off a phone', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: { items: items(), overflow: 'phone' },
    })
    expect(w.findAll('.nb-button')).toHaveLength(3)
    expect(w.find('[aria-haspopup="menu"]').exists()).toBe(false)
    expect(w.text()).toContain('Delete')
  })

  it('never folds with the default overflow, even on a phone', () => {
    stubPhone(true)
    const w = mount(NbActionGroup, { props: { items: items() } })
    expect(w.findAll('.nb-button')).toHaveLength(3)
    expect(w.find('[aria-haspopup="menu"]').exists()).toBe(false)
  })

  it('calls onSelect and emits select with the id', async () => {
    stubPhone(false)
    const list = items()
    const w = mount(NbActionGroup, { props: { items: list } })
    await w.findAll('.nb-button')[1].trigger('click')
    expect(list[1].onSelect).toHaveBeenCalledOnce()
    expect(w.emitted('select')).toEqual([['add']])
  })

  it('folds with overflow="always" and keeps labels off a phone', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: { items: items(), overflow: 'always' },
      attachTo: document.body,
    })
    const buttons = w.findAll('.nb-button')
    // The primary action plus the trigger.
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Add item')
    expect(buttons[1].attributes('aria-label')).toBe('More actions')
  })
})

describe('NbActionGroup on a phone', () => {
  const mountPhone = (props: Record<string, unknown> = {}, slots = {}) => {
    stubPhone(true)
    return mount(NbActionGroup, {
      props: { items: items(), overflow: 'phone', ...props },
      slots,
      attachTo: document.body,
    })
  }

  it('keeps the primary action as an icon-only button named by its label', () => {
    const w = mountPhone()
    const [primary, more] = w.findAll('.nb-button')
    expect(w.findAll('.nb-button')).toHaveLength(2)
    expect(primary.classes()).toContain('nb-button--icon-only')
    expect(primary.attributes('aria-label')).toBe('Add item')
    expect(primary.text()).toBe('')
    expect(more.attributes('aria-label')).toBe('More actions')
    expect(more.attributes('aria-haspopup')).toBe('menu')
    expect(more.attributes('aria-expanded')).toBe('false')
    expect(more.find('[data-name="dots-three"]').exists()).toBe(true)
  })

  it('keeps the first actions when none is flagged primary', () => {
    const list = items().map((i) => ({ ...i, priority: undefined }))
    const w = mountPhone({ items: list, phoneVisible: 2 })
    const labels = w
      .findAll('.nb-button')
      .map((b) => b.attributes('aria-label'))
    expect(labels).toEqual(['Edit', 'Add item', 'More actions'])
  })

  it('keeps the label when the action has no icon', () => {
    const list = [{ id: 'a', label: 'Archive', priority: 'primary' as const }]
    const w = mountPhone({ items: list })
    const [only] = w.findAll('.nb-button')
    expect(only.text()).toBe('Archive')
    // Nothing hidden and no slot: no trigger for an empty menu.
    expect(w.findAll('.nb-button')).toHaveLength(1)
  })

  it('lists the rest in the overflow menu and runs them', async () => {
    const list = items()
    stubPhone(true)
    const w = mount(NbActionGroup, {
      props: { items: list, overflow: 'phone' },
      attachTo: document.body,
    })
    await w.find('[aria-haspopup="menu"]').trigger('click')
    await nextTick()
    const rows = w.findAllComponents(NbMenuItem)
    expect(rows.map((r) => r.props('label'))).toEqual(['Edit', 'Delete'])
    expect(rows[1].props('danger')).toBe(true)
    expect(w.find('[aria-haspopup="menu"]').attributes('aria-expanded')).toBe(
      'true',
    )
    await rows[1].trigger('click')
    expect(list[2].onSelect).toHaveBeenCalledOnce()
    expect(w.emitted('select')).toEqual([['delete']])
    await nextTick()
    expect(w.find('[aria-haspopup="menu"]').attributes('aria-expanded')).toBe(
      'false',
    )
  })

  it('merges #menu items into the overflow menu', async () => {
    const w = mountPhone(
      { items: [items()[1]] },
      { menu: () => h(NbMenuItem, { label: 'Export' }) },
    )
    await w.find('[aria-haspopup="menu"]').trigger('click')
    await nextTick()
    expect(
      w.findAllComponents(NbMenuItem).map((r) => r.props('label')),
    ).toEqual(['Export'])
  })

  it('closes, rather than reopens, when its trigger is pressed again', async () => {
    const w = mountPhone()
    const more = w.find('[aria-haspopup="menu"]')
    await more.trigger('click')
    await nextTick()
    expect(more.attributes('aria-expanded')).toBe('true')
    // The menu closes on any outside mousedown, the trigger included.
    await more.trigger('mousedown')
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await more.trigger('click')
    await nextTick()
    expect(more.attributes('aria-expanded')).toBe('false')
  })

  it('takes a localised trigger name', () => {
    const w = mountPhone({ overflowLabel: 'Más acciones' })
    expect(w.find('[aria-haspopup="menu"]').attributes('aria-label')).toBe(
      'Más acciones',
    )
  })

  it('does not run a disabled or loading action', async () => {
    const list = items()
    list[1].disabled = true
    const w = mountPhone({ items: list })
    await w.findAll('.nb-button')[0].trigger('click')
    expect(list[1].onSelect).not.toHaveBeenCalled()
  })
})

describe('NbActionGroup Carbon behaviour', () => {
  it('names an iconOnly action with label, so it gets a tooltip', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: {
        items: [
          { id: 'filter', label: 'Filter', icon: 'funnel', iconOnly: true },
        ],
      },
    })
    const button = w.findComponent(NbButton)
    expect(button.props('label')).toBe('Filter')
    expect(button.classes()).toContain('nb-button--icon-only')
    expect(button.attributes('aria-label')).toBe('Filter')
  })

  it('says why a disabled icon-only action is disabled', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: {
        items: [
          {
            id: 'delete',
            label: 'Delete',
            icon: 'trash',
            iconOnly: true,
            disabled: true,
            disabledReason: 'Paid invoices cannot be deleted',
          },
        ],
      },
    })
    // NbButton's disabledReason: still focusable, so the reason is reachable
    // from the keyboard, and the reason is its tooltip.
    const button = w.findComponent(NbButton)
    expect(button.props('disabledReason')).toBe(
      'Paid invoices cannot be deleted',
    )
    expect(button.attributes('aria-label')).toBe('Delete')
    expect(button.attributes('aria-disabled')).toBe('true')
  })

  it('draws a pressed toggle with the button pressed state', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: { items: [{ id: 'grid', label: 'Grid', pressed: true }] },
    })
    const button = w.find('button')
    expect(button.classes()).toContain('nb-button--pressed')
    expect(button.attributes('aria-pressed')).toBe('true')
  })

  it('has a gap of its own, and none inside a toolbar', () => {
    stubPhone(false)
    const alone = mount(NbActionGroup, { props: { items: items() } })
    expect(alone.classes()).not.toContain('nb-action-group--in-toolbar')
    const inBar = mount(NbToolbar, {
      props: { label: 'Tools', size: 'md' },
      slots: { default: () => h(NbActionGroup, { items: items() }) },
    })
    const group = inBar.find('.nb-action-group')
    expect(group.classes()).toContain('nb-action-group--in-toolbar')
    // And the buttons take the toolbar's size rather than `sm`.
    expect(group.find('.nb-button').classes()).toContain('nb-button--md')
  })

  it('keeps every action when overflow="auto" has not been measured', () => {
    stubPhone(false)
    const w = mount(NbActionGroup, {
      props: { items: items(), overflow: 'auto' },
    })
    expect(w.findAll('.nb-button')).toHaveLength(3)
    expect(w.find('[aria-haspopup="menu"]').exists()).toBe(false)
    expect(w.classes()).toContain('nb-action-group--auto')
  })

  it('folds by width with overflow="auto"', async () => {
    stubPhone(false)
    let resize: (() => void) | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          resize = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    const widths: Record<string, number> = { edit: 80, add: 100, delete: 90 }
    const offsetWidth = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return widths[this.dataset.actionId ?? ''] ?? 0
      })
    const offsetHeight = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(32)
    const clientWidth = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(220)
    const w = mount(NbActionGroup, {
      props: { items: items(), overflow: 'auto' },
      attachTo: document.body,
    })
    await nextTick()
    resize!()
    await nextTick()
    // 32 (trigger) + 80 + 100 = 212 fits in 220; adding Delete does not.
    const labels = w.findAll('.nb-button').map((b) => b.text())
    expect(labels).toEqual(['Edit', 'Add item', ''])
    expect(w.find('[aria-haspopup="menu"]').exists()).toBe(true)
    offsetWidth.mockRestore()
    offsetHeight.mockRestore()
    clientWidth.mockRestore()
  })
})
