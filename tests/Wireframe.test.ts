import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Wireframe from '../src/components/Wireframe.vue'

describe('NbWireframe', () => {
  it('lays out rows of columns on a 12-column grid', () => {
    const w = mount(Wireframe, {
      props: {
        spec: {
          rows: [
            [
              { span: 7, parts: ['eyebrow', 'title', 'text', 'buttons'] },
              { span: 5, parts: ['image'] },
            ],
          ],
        },
      },
    })
    const cols = w.findAll('.nb-wireframe__col')
    expect(cols.map((c) => c.attributes('style'))).toEqual([
      'grid-column: span 7;',
      'grid-column: span 5;',
    ])
    expect(w.find('.nb-wireframe__bar--title').exists()).toBe(true)
    expect(w.findAll('.nb-wireframe__pill--primary')).toHaveLength(1)
    expect(w.find('.nb-wireframe__box--image').exists()).toBe(true)
  })

  it('draws a counted part that many times', () => {
    const w = mount(Wireframe, {
      props: { spec: { rows: [[{ parts: ['cards:4', 'chips:2'] }]] } },
    })
    expect(w.findAll('.nb-wireframe__card')).toHaveLength(4)
    expect(w.findAll('.nb-wireframe__pill--chip')).toHaveLength(2)
  })

  it('ignores what it does not know instead of failing, so a newer spec still draws', () => {
    const w = mount(Wireframe, {
      props: {
        spec: {
          rows: [
            [{ parts: ['hologram', 'title', 42 as unknown as string] }],
            'nonsense' as never,
          ],
        },
      },
    })
    expect(w.findAll('.nb-wireframe__row')).toHaveLength(1)
    expect(w.findAll('.nb-wireframe__col > *')).toHaveLength(1)
  })

  it('is decorative without a label, and an image with one', () => {
    const spec = { rows: [[{ parts: ['title'] }]] }
    expect(
      mount(Wireframe, { props: { spec } }).attributes('aria-hidden'),
    ).toBe('true')
    const named = mount(Wireframe, { props: { spec, label: 'Product hero' } })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Product hero')
  })

  it('takes a dark tone for a section drawn on a dark band', () => {
    const w = mount(Wireframe, {
      props: { spec: { tone: 'dark', rows: [[{ parts: ['title'] }]] } },
    })
    expect(w.classes()).toContain('nb-wireframe--dark')
  })
})
