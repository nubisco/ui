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

describe('NbGrid fractions', () => {
  const css = compileString('@use "grid"; @include grid.grid;', {
    loadPaths: [resolve(__dirname, '../src/styles')],
  }).css

  it('turns a fraction into a class, at the base and at a breakpoint', () => {
    const w = mount(Grid, { props: { grid: '1/3' } })
    expect(w.classes()).toContain('grid-1-3')
    const r = mount(Grid, { props: { grid: { sm: 16, md: '2/3' } } })
    expect(r.classes()).toContain('sm-grid-16')
    expect(r.classes()).toContain('md-grid-2-3')
  })

  it('sizes a third like a column count, sharing the row gap', () => {
    const at = css.indexOf('.nb-grid.grid-1-3 {')
    expect(at).toBeGreaterThanOrEqual(0)
    const rule = css.slice(at, css.indexOf('}', at))
    expect(rule).toContain('100% * 1 / 3')
    expect(rule).toContain('var(--nb-grid-parent-gap, 0px)')
    expect(rule).toContain('* 2 / 3')
    expect(css).toContain('.nb-grid.md-grid-5-6 {')
  })

  it('refuses a fraction it has no class for', () => {
    const validator = (
      Grid.props as { grid: { validator: (v: unknown) => boolean } }
    ).grid.validator
    expect(validator('1/3')).toBe(true)
    expect(validator({ md: '4/5' })).toBe(true)
    expect(validator('1/7')).toBe(false)
    expect(validator(8)).toBe(true)
  })
})

const gridCss = compileString('@use "grid"; @include grid.grid;', {
  loadPaths: [resolve(__dirname, '../src/styles')],
}).css

function gridRule(selector: string): string {
  const at = gridCss.indexOf(`${selector} {`)
  expect(at, selector).toBeGreaterThanOrEqual(0)
  return gridCss.slice(at, gridCss.indexOf('}', at))
}

describe('NbGrid shift', () => {
  // Grid.d.ts allows 0 and the docs demo it, but no rule was generated, so
  // `{ sm: 4, lg: 0 }` left the 4-column shift in place at lg.
  it('generates shift-0, at the base and at a breakpoint', () => {
    expect(gridRule('.nb-grid.shift-0')).toContain('margin-inline-start')
    expect(gridRule('.nb-grid.lg-shift-0')).toContain('margin-inline-start')
    expect(gridCss).toContain('.nb-grid.shift-15 {')
    expect(gridCss).not.toContain('.nb-grid.shift-16 {')
  })

  it('shifts on the logical start edge so it mirrors under RTL', () => {
    expect(gridRule('.nb-grid.shift-4')).toContain('margin-inline-start')
    expect(gridRule('.nb-grid.shift-4')).not.toContain('margin-left')
  })
})
