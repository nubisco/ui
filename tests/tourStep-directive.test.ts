import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import tourStepDirective from '../src/directives/TourStep.directive'
import {
  TOUR_STEP_ATTRIBUTE,
  isTargetVisible,
  resolveTourTarget,
  tourStepSelector,
} from '../src/utils/tourTarget.helper'

const mountWithDirective = (component: unknown, props = {}) =>
  mount(component as never, {
    props,
    global: {
      plugins: [{ install: (app) => tourStepDirective(app) }],
    },
  })

describe('v-nb-tour-step', () => {
  it('stamps the tour-step attribute on its element', () => {
    const wrapper = mountWithDirective(
      defineComponent({
        template: `<nav v-nb-tour-step="'sidebar-nav'">nav</nav>`,
      }),
    )
    expect(wrapper.find('nav').attributes(TOUR_STEP_ATTRIBUTE)).toBe(
      'sidebar-nav',
    )
  })

  it('updates the attribute when the bound id changes', async () => {
    const Host = defineComponent({
      setup() {
        const id = ref('one')
        return { id }
      },
      template: `<nav v-nb-tour-step="id">nav</nav>`,
    })
    const wrapper = mountWithDirective(Host)
    expect(wrapper.find('nav').attributes(TOUR_STEP_ATTRIBUTE)).toBe('one')
    ;(wrapper.vm as unknown as { id: string }).id = 'two'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('nav').attributes(TOUR_STEP_ATTRIBUTE)).toBe('two')
  })

  it('removes the attribute when the id becomes empty', async () => {
    const Host = defineComponent({
      setup: () => ({ id: ref<string>('one') }),
      template: `<nav v-nb-tour-step="id">nav</nav>`,
    })
    const wrapper = mountWithDirective(Host)
    ;(wrapper.vm as unknown as { id: string }).id = ''
    await wrapper.vm.$nextTick()
    expect(wrapper.find('nav').attributes(TOUR_STEP_ATTRIBUTE)).toBeUndefined()
  })
})

describe('resolveTourTarget', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('builds a selector from a tour-step id', () => {
    expect(tourStepSelector('sidebar-nav')).toBe(
      `[${TOUR_STEP_ATTRIBUTE}="sidebar-nav"]`,
    )
  })

  it('resolves a string to a tour-step id first', () => {
    document.body.innerHTML = `
      <nav id="nav">by selector</nav>
      <aside ${TOUR_STEP_ATTRIBUTE}="nav">by tour id</aside>
    `
    // Both could match "nav"; the stable tour id wins over the element name.
    expect(resolveTourTarget('nav')?.tagName).toBe('ASIDE')
  })

  it('falls back to a CSS selector', () => {
    document.body.innerHTML = `<div class="kpi">KPI</div>`
    expect(resolveTourTarget('.kpi')?.className).toBe('kpi')
  })

  it('returns null for an unmatched selector', () => {
    expect(resolveTourTarget('#nothing-here')).toBeNull()
  })

  it('returns null for an invalid selector instead of throwing', () => {
    expect(() => resolveTourTarget('not a valid ::: selector')).not.toThrow()
    expect(resolveTourTarget('not a valid ::: selector')).toBeNull()
  })

  it('accepts an element directly', () => {
    const el = document.createElement('div')
    expect(resolveTourTarget(el)).toBe(el)
  })

  it('accepts a template ref', () => {
    const el = document.createElement('div')
    expect(resolveTourTarget(ref(el))).toBe(el)
    expect(resolveTourTarget(ref(null))).toBeNull()
  })

  it('accepts a getter', () => {
    const el = document.createElement('div')
    expect(resolveTourTarget(() => el)).toBe(el)
    expect(resolveTourTarget(() => null)).toBeNull()
  })

  it('returns null for an undefined target', () => {
    expect(resolveTourTarget(undefined)).toBeNull()
  })
})

describe('isTargetVisible', () => {
  it('rejects null and detached elements', () => {
    expect(isTargetVisible(null)).toBe(false)
    expect(isTargetVisible(document.createElement('div'))).toBe(false)
  })

  it('rejects a connected element with no box', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(isTargetVisible(el)).toBe(false)
    el.remove()
  })

  it('accepts a connected element with a measurable box', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.getBoundingClientRect = () =>
      ({ top: 10, left: 10, width: 100, height: 40 }) as DOMRect
    expect(isTargetVisible(el)).toBe(true)
    el.remove()
  })
})
