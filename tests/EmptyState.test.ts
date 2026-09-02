import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../src/components/EmptyState.vue'
import Icon from '../src/components/Icon.vue'

describe('NbEmptyState', () => {
  it('renders a title and a description', () => {
    const w = mount(EmptyState, {
      props: {
        title: 'Start by adding a field',
        description: 'Fields describe the shape of a content type.',
      },
    })
    expect(w.find('.nb-empty-state__title').text()).toBe(
      'Start by adding a field',
    )
    expect(w.find('.nb-empty-state__description').text()).toContain(
      'shape of a content type',
    )
  })

  // The four kinds are not decoration: they want different copy and different
  // actions, and naming the case is what stops "No results" appearing over a
  // request that failed.
  it('picks a distinct icon per kind', () => {
    const seen = new Set<string>()
    for (const kind of ['empty', 'no-results', 'error', 'forbidden'] as const) {
      const w = mount(EmptyState, { props: { kind, title: 'x' } })
      seen.add(w.findComponent(Icon).props('name') as string)
      expect(w.classes()).toContain(`nb-empty-state--${kind}`)
    }
    expect(seen.size).toBe(4)
  })

  it('takes an icon override, and drops the icon for null', () => {
    const custom = mount(EmptyState, { props: { icon: 'tray', title: 'x' } })
    expect(custom.find('.nb-empty-state__icon').exists()).toBe(true)

    const none = mount(EmptyState, { props: { icon: null, title: 'x' } })
    expect(none.find('.nb-empty-state__icon').exists()).toBe(false)
  })

  it('renders actions only when given some', () => {
    const bare = mount(EmptyState, { props: { title: 'x' } })
    expect(bare.find('.nb-empty-state__actions').exists()).toBe(false)

    const withAction = mount(EmptyState, {
      props: { title: 'x' },
      slots: { actions: '<button>Add field</button>' },
    })
    expect(withAction.find('.nb-empty-state__actions button').text()).toBe(
      'Add field',
    )
  })

  it('accepts slotted body copy in place of the description prop', () => {
    const w = mount(EmptyState, {
      props: { title: 'x' },
      slots: { default: 'Try a <em>broader</em> search' },
    })
    expect(w.find('.nb-empty-state__description em').text()).toBe('broader')
  })

  it('has a small size for panels and a bordered variant for drop zones', () => {
    const w = mount(EmptyState, {
      props: { title: 'x', size: 'sm', bordered: true },
    })
    expect(w.classes()).toContain('nb-empty-state--sm')
    expect(w.classes()).toContain('nb-empty-state--bordered')
  })
})
