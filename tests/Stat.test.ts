import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Stat from '../src/components/Stat.vue'
import Skeleton from '../src/components/Skeleton.vue'

describe('NbStat', () => {
  it('shows the label and the value, label first in reading order', () => {
    const w = mount(Stat, { props: { label: 'Total keys', value: '1,204' } })
    expect(w.find('.nb-stat__label').text()).toBe('Total keys')
    expect(w.find('.nb-stat__value').text()).toBe('1,204')
    expect(w.text()).toBe('Total keys1,204')
  })

  it('is a plain div when it neither navigates nor acts', () => {
    const w = mount(Stat, { props: { label: 'Created', value: 3 } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('tabindex')).toBeUndefined()
    expect(w.classes()).not.toContain('nb-stat--interactive')
  })

  it('paints a status as a tinted tile', () => {
    const w = mount(Stat, {
      props: { label: 'Errors', value: 2, status: 'danger' },
    })
    expect(w.classes()).toContain('nb-stat--danger')
    expect(mount(Stat, { props: { label: 'x' } }).classes()).toContain(
      'nb-stat--neutral',
    )
  })

  it('draws the delta with an arrow, and colours it by whether it is good news', () => {
    const up = mount(Stat, {
      props: { label: 'Visitors', value: 90, delta: '+12%', trend: 'up' },
    })
    expect(up.find('.nb-stat__delta').text()).toBe('+12%')
    expect(up.find('.nb-stat__delta').classes()).toContain(
      'nb-stat__delta--positive',
    )
    expect(up.find('.nb-stat__trend').exists()).toBe(true)

    const down = mount(Stat, {
      props: { label: 'Visitors', delta: '-4%', trend: 'down' },
    })
    expect(down.find('.nb-stat__delta').classes()).toContain(
      'nb-stat__delta--negative',
    )
  })

  it('inverts the colour, not the arrow, for a figure that should fall', () => {
    const w = mount(Stat, {
      props: {
        label: 'Bounce rate',
        delta: '-3%',
        trend: 'down',
        invertTrend: true,
      },
    })
    expect(w.find('.nb-stat__delta').classes()).toContain(
      'nb-stat__delta--positive',
    )
  })

  it('shows what the delta is compared with', () => {
    const w = mount(Stat, {
      props: {
        label: 'Sessions',
        delta: '+2',
        trend: 'up',
        comparison: 'vs last week',
      },
    })
    expect(w.find('.nb-stat__comparison').text()).toBe('vs last week')
  })

  it('draws no delta row when there is nothing to say', () => {
    const w = mount(Stat, { props: { label: 'Keys', value: 4 } })
    expect(w.find('.nb-stat__delta').exists()).toBe(false)
  })

  it('shows a placeholder and is busy while loading', () => {
    const w = mount(Stat, {
      props: {
        label: 'Keys',
        value: 4,
        delta: '+1',
        trend: 'up',
        loading: true,
      },
    })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('.nb-skeleton').exists()).toBe(true)
    expect(w.find('.nb-stat__value').text()).not.toContain('4')
    expect(w.find('.nb-stat__delta').exists()).toBe(false)
  })

  it('is a link with an href', () => {
    const w = mount(Stat, { props: { label: 'Keys', value: 4, href: '/keys' } })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/keys')
    expect(w.classes()).toContain('nb-stat--interactive')
  })

  it('is a RouterLink with `to` when the app has a router', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/review', name: 'review', component: { template: '<div />' } },
      ],
    })
    router.push('/')
    await router.isReady()
    const w = mount(Stat, {
      props: { label: 'Needs review', value: 7, to: { name: 'review' } },
      global: { plugins: [router] },
    })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('href')).toBe('/review')
  })

  it('acts as a button when clickable, from the mouse and the keyboard', async () => {
    const w = mount(Stat, {
      props: { label: 'Visitors', clickable: true, selected: true },
    })
    expect(w.attributes('role')).toBe('button')
    expect(w.attributes('tabindex')).toBe('0')
    expect(w.attributes('aria-pressed')).toBe('true')
    expect(w.classes()).toContain('nb-stat--selected')
    await w.trigger('click')
    await w.trigger('keydown', { key: 'Enter' })
    await w.trigger('keydown', { key: ' ' })
    expect(w.emitted('select')).toHaveLength(3)
  })

  it('is inert when disabled', async () => {
    const w = mount(Stat, {
      props: { label: 'Visitors', clickable: true, href: '/x', disabled: true },
    })
    expect(w.element.tagName).toBe('DIV')
    await w.trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('takes rich content in the label and value slots', () => {
    const w = mount(Stat, {
      props: { label: 'Visitors' },
      slots: { label: 'Visitors <i>?</i>', value: '<b>12</b>' },
    })
    expect(w.find('.nb-stat__label i').exists()).toBe(true)
    expect(w.find('.nb-stat__value b').text()).toBe('12')
  })

  it('has a dense size for KPI rows, and leaves the default size alone', () => {
    const sm = mount(Stat, { props: { label: 'Open', value: 7, size: 'sm' } })
    expect(sm.classes()).toContain('nb-stat--sm')
    expect(sm.classes()).not.toContain('nb-stat--md')
    expect(mount(Stat, { props: { label: 'Open' } }).classes()).toContain(
      'nb-stat--md',
    )
  })

  it('sizes the loading placeholder to the dense figure', () => {
    const w = mount(Stat, {
      props: { label: 'Open', size: 'sm', loading: true },
    })
    expect(w.findComponent(Skeleton).props('height')).toBe(20)
  })
})
