import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import DefinitionList from '../src/components/DefinitionList.vue'
import DefinitionListItem from '../src/components/DefinitionListItem.vue'

describe('NbDefinitionList', () => {
  const facts = [
    { term: 'Uploaded', value: '12 May 2026' },
    { term: 'By', value: 'jose' },
    { term: 'Size', value: '1.4 MB' },
  ]

  it('renders a term and value per fact', () => {
    const w = mount(DefinitionList, { props: { items: facts } })
    expect(w.element.tagName).toBe('DL')
    expect(w.findAll('dt').map((n) => n.text())).toEqual([
      'Uploaded',
      'By',
      'Size',
    ])
    expect(w.findAll('dd')[2].text()).toBe('1.4 MB')
  })

  // The bug this component exists to prevent. A grid on the <dl> makes every
  // descendant a grid item, so anything else placed in the list gets pulled
  // into the columns: that is how a definition list swallowed two form fields.
  it('puts the grid on each row, never on the list', () => {
    const w = mount(DefinitionList, { props: { items: facts } })
    const rows = w.findAll('.nb-definition-list__row')
    expect(rows).toHaveLength(3)
    // Every dt and dd is inside a row, so the list itself has no grid children.
    for (const cell of [...w.findAll('dt'), ...w.findAll('dd')]) {
      expect(cell.element.parentElement).toHaveProperty('className')
      expect(cell.element.parentElement?.className).toContain(
        'nb-definition-list__row',
      )
    }
  })

  it('keeps unrelated content out of the term and value columns', () => {
    const w = mount(DefinitionList, {
      slots: {
        default: () => [
          h(DefinitionListItem, { term: 'Owner' }, () => 'nubisco'),
          h('div', { class: 'sentinel' }, 'not a fact'),
        ],
      },
    })
    // The sentinel is a direct child of the <dl> and is NOT inside a row, so
    // no row grid can lay it out into a column.
    const sentinel = w.find('.sentinel')
    expect(
      sentinel.element.parentElement?.classList.contains(
        'nb-definition-list__row',
      ),
    ).toBe(false)
  })

  it('shows a dash for an empty value rather than an empty row', () => {
    // A blank looks like a bug or a missing fact; a dash says the answer is
    // nothing.
    const w = mount(DefinitionList, {
      props: {
        items: [
          { term: 'Dimensions', value: null },
          { term: 'Caption', value: '' },
        ],
      },
    })
    const values = w.findAll('.nb-definition-list__empty')
    expect(values).toHaveLength(2)
    expect(values[0].text()).toBe('–')
  })

  it('takes a per-item override for the empty text', () => {
    const w = mount(DefinitionList, {
      props: { items: [{ term: 'Expires', value: null, empty: 'Never' }] },
    })
    expect(w.find('dd').text()).toBe('Never')
  })

  it('renders zero as a value, not as empty', () => {
    // A count of zero is a fact; only null, undefined and '' are absences.
    const w = mount(DefinitionList, {
      props: { items: [{ term: 'Uses', value: 0 }] },
    })
    expect(w.find('.nb-definition-list__empty').exists()).toBe(false)
    expect(w.find('dd').text()).toBe('0')
  })

  it('prefers the slot over items rather than rendering both', () => {
    const w = mount(DefinitionList, {
      props: { items: facts },
      slots: {
        default: () => h(DefinitionListItem, { term: 'Only' }, () => 'me'),
      },
    })
    // Two sources of truth would interleave silently; items wins because it is
    // the explicit prop.
    expect(w.findAll('dt')).toHaveLength(3)
  })

  it('carries the layout on the list so rows share one definition of it', () => {
    for (const layout of ['columns', 'stacked', 'auto'] as const) {
      const w = mount(DefinitionList, { props: { items: facts, layout } })
      expect(w.classes()).toContain(`nb-definition-list--${layout}`)
    }
  })
})

describe('NbDefinitionListItem', () => {
  it('renders a row with a term and a slotted value', () => {
    const w = mount(DefinitionListItem, {
      props: { term: 'Repository' },
      slots: { default: '<a href="#">nubisco/ui</a>' },
    })
    expect(w.classes()).toContain('nb-definition-list__row')
    expect(w.find('dt').text()).toBe('Repository')
    expect(w.find('dd a').text()).toBe('nubisco/ui')
  })
})
