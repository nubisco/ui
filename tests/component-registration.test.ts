import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * NbBanner shipped once as a named export that was never added to
 * components/index.ts, the list the plugin installs. Everything looked fine:
 * types passed, because global.d.ts is GENERATED from the component folder, and
 * the build passed, because the named export was real. Only the docs showed it,
 * as unstyled text where a banner should have been, since <NbBanner> resolved
 * to nothing at runtime.
 *
 * The two lists have to agree, so this asserts they do rather than trusting
 * whoever adds the next component to remember both. Read as text rather than
 * imported: src/main.ts pulls in `virtual:icons` and `virtual:flags`, which
 * exist only under the library's own vite config.
 */
const root = resolve(__dirname, '..')
const mainSrc = readFileSync(resolve(root, 'src/main.ts'), 'utf8')
const indexSrc = readFileSync(resolve(root, 'src/components/index.ts'), 'utf8')

/**
 * `export { default as NbFoo } from './components/Foo.vue'`
 *
 * Labs components are excluded on purpose: they are experimental, and a second
 * plugin (NubiscoUILabs) registers them from a glob, so they are deliberately
 * absent from the core list rather than forgotten in it.
 */
const exported = [
  ...mainSrc.matchAll(
    /export\s*\{\s*default as (Nb\w+)\s*\}\s*from\s*'\.\/components\/((?!labs\/)[^']+)\.vue'/g,
  ),
].map((m) => m[1])

/** The names listed in the object the plugin registers. */
const registered = new Set(
  [...indexSrc.matchAll(/^\s{2}(Nb\w+),\s*$/gm)].map((m) => m[1]),
)

describe('component registration', () => {
  it('finds both lists', () => {
    expect(exported.length).toBeGreaterThan(20)
    expect(registered.size).toBeGreaterThan(20)
  })

  it.each(exported)(
    '%s, exported from main.ts, is also registered by the plugin',
    (name) => {
      expect(registered.has(name)).toBe(true)
    },
  )
})
