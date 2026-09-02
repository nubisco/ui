import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import Accordion from '../src/components/Accordion.vue'
import AccordionItem from '../src/components/AccordionItem.vue'

const items = (n: number, props: Record<string, unknown>[] = []) =>
  Array.from({ length: n }, (_, i) =>
    h(
      AccordionItem,
      { id: `i${i}`, title: `Section ${i}`, ...(props[i] ?? {}) },
      () => `Body ${i}`,
    ),
  )

const mountAccordion = (
  accordionProps = {},
  n = 3,
  itemProps = [],
  attach = false,
) =>
  mount(Accordion, {
    props: accordionProps,
    slots: { default: () => items(n, itemProps) },
    // Focus only moves for elements that are actually in the document, so the
    // keyboard test has to attach; the rest do not pay for it.
    ...(attach ? { attachTo: document.body } : {}),
  })

describe('NbAccordion', () => {
  it('opens a section on click and closes it again', async () => {
    const w = mountAccordion()
    const headers = w.findAll('.nb-accordion-item__header')
    expect(headers[0].attributes('aria-expanded')).toBe('false')

    await headers[0].trigger('click')
    expect(headers[0].attributes('aria-expanded')).toBe('true')

    await headers[0].trigger('click')
    expect(headers[0].attributes('aria-expanded')).toBe('false')
  })

  it('keeps one section open at a time by default', async () => {
    const w = mountAccordion()
    const headers = w.findAll('.nb-accordion-item__header')
    await headers[0].trigger('click')
    await headers[1].trigger('click')
    expect(headers[0].attributes('aria-expanded')).toBe('false')
    expect(headers[1].attributes('aria-expanded')).toBe('true')
  })

  it('allows several open when multiple is set', async () => {
    const w = mountAccordion({ multiple: true })
    const headers = w.findAll('.nb-accordion-item__header')
    await headers[0].trigger('click')
    await headers[1].trigger('click')
    expect(headers[0].attributes('aria-expanded')).toBe('true')
    expect(headers[1].attributes('aria-expanded')).toBe('true')
  })

  it('emits an array from v-model whether or not multiple is set', async () => {
    const w = mountAccordion()
    await w.findAll('.nb-accordion-item__header')[1].trigger('click')
    // Always an array, so a consumer's binding does not change shape when they
    // later turn `multiple` on.
    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['i1'])
  })

  it('reports each toggle with its new state', async () => {
    const w = mountAccordion()
    const headers = w.findAll('.nb-accordion-item__header')
    await headers[0].trigger('click')
    await headers[0].trigger('click')
    expect(w.emitted('toggle')).toEqual([
      ['i0', true],
      ['i0', false],
    ])
  })

  it('is controlled when modelValue is bound', async () => {
    const w = mountAccordion({ modelValue: ['i2'] })
    const headers = w.findAll('.nb-accordion-item__header')
    expect(headers[2].attributes('aria-expanded')).toBe('true')
    // A controlled accordion asks; it does not decide.
    await headers[0].trigger('click')
    expect(headers[0].attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(['i0'])
  })

  it('wires the header to its panel for assistive tech', () => {
    const w = mountAccordion()
    const header = w.find('.nb-accordion-item__header')
    const panel = w.find('[role="region"]')
    expect(header.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(header.attributes('id'))
  })

  it('keeps a closed panel in the DOM but hidden', () => {
    // Removing it would put the content out of reach of find-in-page, which is
    // a real cost for an accordion used on documentation.
    const w = mountAccordion()
    const panel = w.find('[role="region"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('hidden')).toBeDefined()
    expect(panel.text()).toContain('Body 0')
  })

  it('does not toggle a disabled item', async () => {
    const w = mountAccordion({}, 2, [{ disabled: true }] as never)
    const header = w.findAll('.nb-accordion-item__header')[0]
    expect(header.attributes('disabled')).toBeDefined()
    await header.trigger('click')
    expect(w.emitted('toggle')).toBeUndefined()
  })

  it('moves focus between headers with the arrow keys', async () => {
    const w = mountAccordion({}, 3, [], true)
    const headers = w.findAll('.nb-accordion-item__header')
    ;(headers[0].element as HTMLElement).focus()
    await headers[0].trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(document.activeElement).toBe(headers[1].element)

    await headers[1].trigger('keydown', { key: 'End' })
    await nextTick()
    expect(document.activeElement).toBe(headers[2].element)

    // Wraps, so a long accordion does not dead-end.
    await headers[2].trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(document.activeElement).toBe(headers[0].element)
    w.unmount()
  })

  it('announces each header as a heading as well as a button', () => {
    // The heading is what lets a screen reader list the sections; the button
    // inside it is what operates them. Both are needed.
    const w = mountAccordion()
    const heading = w.find('[role="heading"]')
    expect(heading.attributes('aria-level')).toBe('3')
    expect(heading.find('.nb-accordion-item__header').exists()).toBe(true)
  })

  it('takes the outline level from the group', () => {
    // A bare <h3> would also inherit any `.container h3 { margin }` the host
    // has, which outranks a scoped class and was adding 20px above each title.
    const w = mountAccordion({ headingLevel: 2 })
    expect(w.find('[role="heading"]').attributes('aria-level')).toBe('2')
    expect(w.find('h3').exists()).toBe(false)
  })
})
