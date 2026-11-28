import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'

/*
 * An outlined button draws its variant's colour as ink: danger text and a
 * danger border on an outlined danger, primary on a tertiary. From 5.41.0 to
 * 5.69.1 the generic outlined rule carried one class more than the
 * per-variant rules after it (`:not(.nb-button--link)` added with the link
 * variant), so it won, and every outlined button drew neutral text and a
 * neutral border at rest, in light and dark alike. jsdom cannot cascade, so
 * this measures the compiled selectors instead.
 */
const css = (() => {
  const path = join(__dirname, '../src/components/Button.vue')
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  return descriptor.styles
    .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
})()

/** Every rule as [selector, body], in source order. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  body: m[2],
  index: m.index ?? 0,
}))

/**
 * The (id, class, type) specificity of one compound selector, enough for the
 * selectors in this file: classes, attributes and pseudo-classes count as
 * classes, `:where()` counts nothing, `:not()` and `:is()` count their
 * argument.
 */
function specificity(selector: string): [number, number, number] {
  let rest = selector
  let classes = 0
  // Innermost first, so `:not(:where(.x))` resolves to zero.
  for (;;) {
    const where = rest.replace(/:where\([^()]*\)/g, '')
    const unwrapped = where.replace(/:(?:not|is)\(([^()]*)\)/g, ' $1 ')
    if (unwrapped === rest) break
    rest = unwrapped
  }
  classes += (rest.match(/\.[\w-]+/g) ?? []).length
  classes += (rest.match(/\[[^\]]+\]/g) ?? []).length
  classes += (rest.match(/:(?!:)[\w-]+/g) ?? []).length
  return [0, classes, 0]
}

const generic = rules.find((r) =>
  /^\.nb-button--outlined:not\(\.nb-button--ghost\)/.test(r.selector),
)!

describe('outlined button colours', () => {
  it('finds the generic outlined rule, which paints the neutral ink', () => {
    expect(generic).toBeDefined()
    expect(generic.body).toMatch(/color:\s*var\(--nb-c-contrast\)/)
  })

  for (const variant of [
    'primary',
    'secondary',
    'danger',
    'warning',
    'success',
    'info',
  ]) {
    it(`lets the ${variant} ink win over the neutral one at rest`, () => {
      const own = rules.find(
        (r) => r.selector === `.nb-button--outlined.nb-button--${variant}`,
      )
      expect(own, `no rule for outlined ${variant}`).toBeDefined()
      expect(own!.body).toMatch(new RegExp(`var\\(--nb-c-${variant}`))
      // Equal specificity and later in the sheet, or more specific.
      const [, a] = specificity(own!.selector)
      const [, b] = specificity(generic.selector)
      expect(a > b || (a === b && own!.index > generic.index)).toBe(true)
    })
  }

  it('still keeps the outlined border off a link', () => {
    expect(generic.selector).toMatch(/:not\(:where\(\.nb-button--link\)\)/)
  })
})
