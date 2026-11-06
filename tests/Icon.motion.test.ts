import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import { EAnimation } from '../src/components/Icon.d'

/**
 * NbIcon's seventeen animations, asserted on the compiled stylesheet because
 * jsdom evaluates neither keyframes nor media queries.
 *
 * Three promises: an animated icon is the size of a static one (no keyframe
 * scales the glyph up as its resting state), every animation is timed by a
 * duration that resolves (a loop is a literal, like every library loop; the
 * motion scale has no loop step) and eased on the standard token, and reduced
 * motion stops the travel while the loading glyphs keep
 * breathing, per docs/principles/motion/accessibility.md.
 */

const path = join(__dirname, '../src/components/Icon.vue')
const { descriptor } = parse(readFileSync(path, 'utf8'))
const css = descriptor.styles
  .map(
    (s) =>
      compileString(s.content, {
        syntax: 'scss',
        url: pathToFileURL(path),
        style: 'expanded',
      }).css,
  )
  .join('\n')

/** The body of the first `@media` block whose query contains `needle`. */
function media(needle: string): string {
  const at = css.indexOf(`@media ${needle}`)
  if (at === -1) return ''
  const open = css.indexOf('{', at)
  let depth = 0
  let end = open
  for (; end < css.length; end++) {
    if (css[end] === '{') depth++
    else if (css[end] === '}' && --depth === 0) break
  }
  return css.slice(open, end + 1)
}

/** The declarations of the rule for `selector` inside `scope`. */
function rule(scope: string, selector: string): string {
  const at = scope.indexOf(selector)
  if (at === -1) return ''
  const open = scope.indexOf('{', at)
  return scope.slice(open, scope.indexOf('}', open))
}

const LOADING = ['refresh', 'cog', 'hourglass']
const ALL = Object.values(EAnimation) as string[]

describe('NbIcon animations', () => {
  it('ships all seventeen', () => {
    expect(ALL).toHaveLength(17)
    for (const name of ALL) {
      expect(css).toContain(`@keyframes ${name}`)
      expect(css).toContain(`.nb-icon-animation-always-${name}`)
      expect(css).toContain(`.nb-icon-animation-hover-${name}:hover`)
    }
  })

  it('never rests the glyph at a larger scale than a static icon', () => {
    expect(css).not.toMatch(/scale\(1\.5\)/)
    expect(css).not.toMatch(/scale\(2\)/)
  })

  it('times every animation with a duration that resolves', () => {
    for (const name of ALL) {
      const body = rule(css, `.nb-icon-animation-always-${name}`)
      // A var() of an undeclared token would drop the whole shorthand, so
      // the duration is a literal loop length.
      expect(body, name).toMatch(/animation: \S+ \d*\.?\d+m?s /)
      expect(body, name).toContain('infinite')
      expect(body, name).toMatch(/var\(--nb-ease-standard\)|linear/)
      expect(body, name).not.toMatch(/cubic-bezier/)
    }
    expect(rule(css, '.nb-icon-animation-always-refresh')).toContain('linear')
  })

  describe('reduced motion', () => {
    const reduced = media('(prefers-reduced-motion: reduce)')

    it('has one reduced-motion block', () => {
      expect(reduced).not.toBe('')
      expect(css.match(/prefers-reduced-motion/g)).toHaveLength(1)
    })

    it('stops every travel animation', () => {
      for (const name of ALL.filter((n) => !LOADING.includes(n))) {
        expect(
          rule(reduced, `.nb-icon-animation-always-${name}`),
          name,
        ).toContain('animation: none')
      }
    })

    it('keeps the loading glyphs alive as an opacity loop', () => {
      for (const name of LOADING) {
        const body = rule(reduced, `.nb-icon-animation-always-${name}`)
        expect(body, name).toContain('nb-icon-breathe')
        expect(body, name).toContain('infinite')
      }
      const breathe = css.slice(css.indexOf('@keyframes nb-icon-breathe'))
      expect(breathe.slice(0, breathe.indexOf('}\n}'))).toContain('opacity')
      expect(breathe.slice(0, breathe.indexOf('}\n}'))).not.toContain(
        'transform',
      )
    })
  })
})
