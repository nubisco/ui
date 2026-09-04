import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * NbBanner shipped once as a named export that was never added to
 * components/index.ts, the list the plugin installs. Everything looked fine:
 * types passed, because global.d.ts is GENERATED from the component folder, and
 * the build passed, because the named export was real. Only the docs showed it,
 * as unstyled text where a banner should have been, since <NbBanner> resolved
 * to nothing at runtime.
 *
 * The first version of this test compared the two lists to each other, so it
 * could only catch a component present in one and missing from the other. A
 * component missing from BOTH passed it vacuously. The component folder is now
 * the source of truth: every component that exists has to appear in both lists.
 *
 * Writing it that way immediately found four components (NbAiLabel,
 * NbFileUploader, NbForm, NbImageCropper) that the plugin registered but that
 * had no named export, so `<NbForm>` worked in a template while
 * `import { NbForm } from '@nubisco/ui'` did not resolve. The two lists agreed
 * with each other in the old test's terms and were both wrong.
 *
 * Read as text rather than imported: src/main.ts pulls in `virtual:icons` and
 * `virtual:flags`, which exist only under the library's own vite config.
 */
const root = resolve(__dirname, '..')
const mainSrc = readFileSync(resolve(root, 'src/main.ts'), 'utf8')
const indexSrc = readFileSync(resolve(root, 'src/components/index.ts'), 'utf8')
const componentDir = resolve(root, 'src/components')

/**
 * `export { default as NbFoo } from './components/Foo.vue'`
 *
 * Labs components are excluded on purpose: they are experimental, and a second
 * plugin (NubiscoUILabs) registers them from a glob, so they are deliberately
 * absent from the core list rather than forgotten in it.
 */
const exported = new Set(
  [
    ...mainSrc.matchAll(
      /export\s*\{\s*default as (Nb\w+)\s*\}\s*from\s*'\.\/components\/((?!labs\/)[^']+)\.vue'/g,
    ),
  ].map((m) => m[1]),
)

/** The names listed in the object the plugin registers. */
const registered = new Set(
  [...indexSrc.matchAll(/^\s{2}(Nb\w+),\s*$/gm)].map((m) => m[1]),
)

/**
 * Components that exist on disk but are intentionally not part of the public
 * surface: renderers a parent swaps between, provider-only wrappers, and
 * sub-components a parent renders from data. Adding a name here is a decision;
 * forgetting a name is not.
 */
const PRIVATE_COMPONENTS = new Set<string>([
  'NbBlueprintDomRenderer',
  'NbBlueprintPixiRenderer',
  'NbSidebarVariantScope',
  'NbSurfaceLayerScope',
  'NbNotificationCenterItem',
  'NbStepperStep',
])

/** Every .vue in the folder, as the Nb name it would be exported under. */
const onDisk = readdirSync(componentDir)
  .filter((file) => file.endsWith('.vue'))
  .map((file) => `Nb${file.replace(/\.vue$/, '')}`)
  .filter((name) => !PRIVATE_COMPONENTS.has(name))

describe('component registration', () => {
  it('finds both lists', () => {
    expect(exported.size).toBeGreaterThan(20)
    expect(registered.size).toBeGreaterThan(20)
  })

  it.each(onDisk)('%s is exported from main.ts', (name) => {
    expect(exported.has(name)).toBe(true)
  })

  it.each(onDisk)('%s is registered by the plugin', (name) => {
    expect(registered.has(name)).toBe(true)
  })

  it.each([...exported])(
    '%s, exported from main.ts, is also registered by the plugin',
    (name) => {
      expect(registered.has(name)).toBe(true)
    },
  )
})
