import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { compileString } from 'sass-embedded'
import { resolve } from 'node:path'
import Grid from '../src/components/Grid.vue'

describe('NbGrid responsive direction', () => {
  // The docs example: a column until md, then a row. md's 'row' used to be
  // skipped as "the default", so the grid stayed a column at every width.
  it('emits a breakpoint row after a smaller breakpoint column', () => {
    const w = mount(Grid, { props: { dir: { sm: 'col', md: 'row' } } })
    expect(w.classes()).toContain('sm-col')
    expect(w.classes()).toContain('md-row')
  })

  it('still emits the base row for a scalar dir', () => {
    const w = mount(Grid, { props: { dir: 'row' } })
    expect(w.classes()).toContain('row')
  })
})

describe('NbGrid spans and gaps', () => {
  const css = compileString('@use "grid"; @include grid.grid;', {
    loadPaths: [resolve(__dirname, '../src/styles')],
  }).css

  function rule(selector: string): string {
    const at = css.indexOf(`${selector} {`)
    expect(at, selector).toBeGreaterThanOrEqual(0)
    return css.slice(at, css.indexOf('}', at))
  }

  // grid-8 + grid-8 in a row with a gap used to be 50% + gap + 50%, with a
  // 50% minimum width, so the row overflowed its parent by the gap.
  it('takes its share of the parent gap off a span', () => {
    const span = rule('.nb-grid.grid-8')
    expect(span).toContain('var(--nb-grid-parent-gap, 0px)')
    expect(span).toContain('var(--nb-grid-parent-row, 1)')
    expect(span).toMatch(/min-width: calc\(/)
  })

  it('hands each gap to the children, and only a row gap counts', () => {
    expect(rule('.nb-grid.gap-md > *')).toContain('--nb-grid-parent-gap: 16px')
    expect(rule('.nb-grid.row > *')).toContain('--nb-grid-parent-row: 1')
    expect(rule('.nb-grid.col > *')).toContain('--nb-grid-parent-row: 0')
    expect(rule('.nb-grid.md-row > *')).toContain('--nb-grid-parent-row: 1')
  })

  it('does not pass a gap through a grid that has none', () => {
    expect(rule('.nb-grid > *')).toContain('--nb-grid-parent-gap: 0px')
  })
})
