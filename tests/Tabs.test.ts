import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Tabs from '../src/components/Tabs.vue'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name" />',
}

const NbBadgeStub = {
  name: 'NbBadge',
  props: ['size'],
  template: '<span data-testid="nb-badge"><slot /></span>',
}

const items = [
  { id: 'settings', label: 'Settings' },
  { id: 'hours', label: 'Hours' },
  { id: 'invoices', label: 'Invoices' },
]

describe('Tabs', () => {
  const createWrapper = (props = {}, options = {}) =>
    mount(Tabs, {
      props: { items, ...props },
      attachTo: document.body,
      global: { stubs: { NbIcon: NbIconStub, NbBadge: NbBadgeStub } },
      ...options,
    })

  const tabs = (wrapper: ReturnType<typeof createWrapper>) =>
    wrapper.findAll('[role="tab"]')

  it('renders one tab per item', () => {
    const wrapper = createWrapper()
    expect(tabs(wrapper).map((t) => t.text())).toEqual([
      'Settings',
      'Hours',
      'Invoices',
    ])
  })

  it('selects the first tab when no model value is given', () => {
    const wrapper = createWrapper()
    expect(tabs(wrapper)[0].attributes('aria-selected')).toBe('true')
    expect(tabs(wrapper)[1].attributes('aria-selected')).toBe('false')
  })

  it('selects the tab matching the model value', () => {
    const wrapper = createWrapper({ modelValue: 'invoices' })
    expect(tabs(wrapper)[2].attributes('aria-selected')).toBe('true')
  })

  it('emits the new id on click', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    await tabs(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hours']])
    expect(wrapper.emitted('change')?.[0]).toEqual(['hours', items[1]])
  })

  it('does not re-emit when the active tab is clicked', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    await tabs(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('tracks selection on its own without v-model', async () => {
    const wrapper = createWrapper()
    await tabs(wrapper)[1].trigger('click')
    expect(tabs(wrapper)[1].attributes('aria-selected')).toBe('true')
  })

  it('keeps only the active tab in the tab order', () => {
    const wrapper = createWrapper({ modelValue: 'hours' })
    expect(tabs(wrapper).map((t) => t.attributes('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
    ])
  })

  it('moves and activates with the arrow keys', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    await wrapper.find('[role="tablist"]').trigger('keydown', {
      key: 'ArrowRight',
    })
    expect(wrapper.emitted('update:modelValue')).toEqual([['hours']])
  })

  it('wraps around at both ends', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    const list = wrapper.find('[role="tablist"]')
    await list.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:modelValue')).toEqual([['invoices']])
  })

  it('jumps to the first and last tab with Home and End', async () => {
    const wrapper = createWrapper({ modelValue: 'hours' })
    const list = wrapper.find('[role="tablist"]')
    await list.trigger('keydown', { key: 'End' })
    await list.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['invoices'],
      ['settings'],
    ])
  })

  it('ignores unrelated keys', async () => {
    const wrapper = createWrapper()
    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'a' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('moves focus along with the selection', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    await wrapper.find('[role="tablist"]').trigger('keydown', {
      key: 'ArrowRight',
    })
    expect(document.activeElement).toBe(tabs(wrapper)[1].element)
    wrapper.unmount()
  })

  it('skips disabled tabs when navigating', async () => {
    const wrapper = createWrapper({
      items: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', disabled: true },
        { id: 'c', label: 'C' },
      ],
      modelValue: 'a',
    })
    await wrapper.find('[role="tablist"]').trigger('keydown', {
      key: 'ArrowRight',
    })
    expect(wrapper.emitted('update:modelValue')).toEqual([['c']])
  })

  it('does not select a disabled tab on click', async () => {
    const wrapper = createWrapper({
      items: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', disabled: true },
      ],
      modelValue: 'a',
    })
    await tabs(wrapper)[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(tabs(wrapper)[1].attributes('disabled')).toBeDefined()
  })

  it('disables every tab when the bar is disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(
      tabs(wrapper).every((t) => t.attributes('disabled') !== undefined),
    ).toBe(true)
  })

  it('falls back to the first enabled tab for an unknown model value', () => {
    const wrapper = createWrapper({ modelValue: 'nope' })
    expect(tabs(wrapper)[0].attributes('aria-selected')).toBe('true')
  })

  it('renders the panel of the active tab only', () => {
    const wrapper = createWrapper(
      { modelValue: 'hours' },
      {
        slots: {
          settings: '<p>Settings body</p>',
          hours: '<p>Hours body</p>',
        },
      },
    )
    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels).toHaveLength(1)
    expect(panels[0].text()).toBe('Hours body')
  })

  it('wires the panel to its tab', () => {
    const wrapper = createWrapper(
      { modelValue: 'settings' },
      { slots: { settings: '<p>Body</p>' } },
    )
    const tab = tabs(wrapper)[0]
    const panel = wrapper.find('[role="tabpanel"]')
    expect(tab.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(tab.attributes('id'))
  })

  it('omits aria-controls when a tab has no panel slot', () => {
    const wrapper = createWrapper()
    expect(tabs(wrapper)[0].attributes('aria-controls')).toBeUndefined()
  })

  it('names the tablist from ariaLabel', () => {
    const wrapper = createWrapper({ ariaLabel: 'Project' })
    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe(
      'Project',
    )
  })

  it('renders icons and badges', () => {
    const wrapper = createWrapper({
      items: [{ id: 'a', label: 'A', icon: 'gear', badge: 3 }],
    })
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('gear')
    expect(wrapper.find('[data-testid="nb-badge"]').text()).toBe('3')
  })

  it('applies the variant, size and full-width classes', () => {
    expect(createWrapper().classes()).toContain('nb-tabs--line')
    expect(createWrapper().classes()).toContain('nb-tabs--md')
    expect(createWrapper({ variant: 'contained' }).classes()).toContain(
      'nb-tabs--contained',
    )
    expect(createWrapper({ size: 'lg' }).classes()).toContain('nb-tabs--lg')
    expect(createWrapper({ fullWidth: true }).classes()).toContain(
      'nb-tabs--full-width',
    )
  })

  it('follows the model value when it changes from outside', async () => {
    const wrapper = createWrapper({ modelValue: 'settings' })
    await wrapper.setProps({ modelValue: 'invoices' })
    expect(tabs(wrapper)[2].attributes('aria-selected')).toBe('true')
  })
})
