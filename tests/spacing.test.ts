import { describe, it, expect } from 'vitest'
import { compileString } from 'sass-embedded'
import { resolve } from 'node:path'

const loadPaths = [resolve(__dirname, '../src/styles')]
const base = compileString('@use "theme"; @include theme.base;', {
  loadPaths,
}).css
const classes = compileString('@use "theme"; @include theme.classes;', {
  loadPaths,
}).css

const DEPRECATED = [9, 10, 11, 13, 14, 18, 42, 46, 50, 54]

describe('spacing scale', () => {
  it('has a 40px step, Carbon spacing-08', () => {
    expect(base).toContain('--nb-spacing-40: 2.5rem')
    expect(classes).toContain('.p-40 {')
  })

  // Kept for one minor so a product reading one keeps working.
  it('still emits the custom property of every deprecated step', () => {
    for (const step of DEPRECATED)
      expect(base).toContain(`--nb-spacing-${step}:`)
  })

  it('generates no utility class for a deprecated step', () => {
    for (const step of DEPRECATED) {
      expect(classes, `p-${step}`).not.toContain(`.p-${step} {`)
      expect(classes, `mt-${step}`).not.toContain(`.mt-${step} {`)
    }
    expect(classes).toContain('.p-16 {')
    expect(classes).toContain('.mt-48 {')
  })

  it('emits the four fluid steps in viewport width', () => {
    expect(base).toContain('--nb-fluid-spacing-01: 0')
    expect(base).toContain('--nb-fluid-spacing-02: 2vw')
    expect(base).toContain('--nb-fluid-spacing-03: 5vw')
    expect(base).toContain('--nb-fluid-spacing-04: 10vw')
  })

  it('has logical utilities beside the physical ones', () => {
    const rule = (sel: string) =>
      classes.slice(
        classes.indexOf(`${sel} {`),
        classes.indexOf('}', classes.indexOf(`${sel} {`)),
      )
    expect(rule('.pis-16')).toContain(
      'padding-inline-start: var(--nb-spacing-16)',
    )
    expect(rule('.pie-8')).toContain('padding-inline-end: var(--nb-spacing-8)')
    expect(rule('.mis-24')).toContain(
      'margin-inline-start: var(--nb-spacing-24)',
    )
    expect(rule('.mie-4')).toContain('margin-inline-end: var(--nb-spacing-4)')
    expect(classes).toContain('.pl-16 {')
  })

  // The scale used to be a copy of the type ramp. Adding 40 to one and not
  // the other is the proof that the two are separate maps now.
  it('is its own map, no longer the font size ramp', () => {
    expect(base).toContain('--nb-spacing-40:')
    expect(base).not.toContain('--nb-font-size-40:')
  })
})
