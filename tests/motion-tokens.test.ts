import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileString } from 'sass-embedded'
import { motion, easing } from '../src/tokens/motion'

/**
 * The motion tokens exist twice: as Sass maps, which `_theme.scss` emits as
 * custom properties, and as the script export, which timers read. This test
 * is what makes them one source: it compiles the maps and fails on any
 * difference in either direction.
 */

const css = compileString(
  `@use 'sass:map';
@use 'animations' as a;
:root {
  @each $k, $v in a.$motion { --motion-#{$k}: #{$v}; }
  @each $k, $v in a.$easing { --ease-#{$k}: #{$v}; }
}`,
  {
    syntax: 'scss',
    url: pathToFileURL(join(__dirname, '../src/styles/variables/x.scss')),
  },
).css

function read(prefix: string): Record<string, string> {
  return Object.fromEntries(
    [
      ...css.matchAll(new RegExp(`--${prefix}-([\\w-]+):\\s*([^;]+);`, 'g')),
    ].map((m) => [m[1], m[2].trim()]),
  )
}

const toMs = (v: string) =>
  v.endsWith('ms') ? Number(v.slice(0, -2)) : Number(v.slice(0, -1)) * 1000

describe('motion tokens', () => {
  it('match the Sass duration scale, step for step', () => {
    const sass = read('motion')
    expect(Object.keys(motion).sort()).toEqual(Object.keys(sass).sort())
    for (const [step, value] of Object.entries(sass))
      expect(motion[step as keyof typeof motion], step).toBe(toMs(value))
  })

  it('match the Sass easing curves, role for role', () => {
    const sass = read('ease')
    expect(Object.keys(easing).sort()).toEqual(Object.keys(sass).sort())
    const norm = (v: string) => v.replace(/\s+/g, '')
    for (const [role, value] of Object.entries(sass))
      expect(norm(easing[role as keyof typeof easing]), role).toBe(norm(value))
  })
})
