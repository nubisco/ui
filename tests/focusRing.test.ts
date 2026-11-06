/**
 * The default focus ring for elements the library does not style.
 *
 * Guards the three things that make it safe: it is the house ring (2px of the
 * focus token, 2px out, an outline), it sits at zero specificity so every
 * component ring wins, and the reset no longer takes the ring away from
 * every element at a specificity the default could not beat.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileString } from 'sass-embedded'

function compile(file: string): string {
  const path = join(import.meta.dirname, '../src/styles', file)
  return compileString(readFileSync(path, 'utf8'), {
    url: pathToFileURL(path),
  }).css.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('default focus ring', () => {
  const css = compile('_focus.scss')

  it('draws 2px of the focus token, 2px out, as an outline', () => {
    expect(css).toMatch(
      /:where\(:focus-visible\)\s*\{\s*outline: 2px solid var\(--nb-c-focus-ring\);\s*outline-offset: 2px;/,
    )
  })

  it('puts every selector inside :where()', () => {
    const selectors = [...css.matchAll(/(?:^|\n)([^{}]+?)\s*\{/g)].map((m) =>
      m[1].trim(),
    )
    expect(selectors.length).toBe(2)
    for (const s of selectors) expect(s.startsWith(':where(')).toBe(true)
  })

  it('leaves library elements to their own component', () => {
    expect(css).toMatch(/\[class\^=nb-\]:focus-visible/)
  })

  it('is no longer cancelled by the reset', () => {
    expect(compile('_reset.scss')).not.toMatch(
      /(^|\n|\})\s*:focus-visible\s*\{\s*outline:\s*0/,
    )
  })

  it('is loaded after the reset in the full stylesheet', () => {
    const index = readFileSync(
      join(import.meta.dirname, '../src/styles/index.scss'),
      'utf8',
    )
    expect(index.indexOf("@use 'focus'")).toBeGreaterThan(
      index.indexOf("@forward 'reset'"),
    )
  })
})
