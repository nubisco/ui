import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { COMPONENT_MANIFEST } from '../../components/manifest.js'
import { nubiscoGlyphs, type IGlyphOptions } from './glyphs.js'

/**
 * Compile-time resolution for `@nubisco/ui`.
 *
 * ```ts
 * // vite.config.ts
 * import { nubiscoUI } from '@nubisco/ui/vite'
 *
 * export default defineConfig({ plugins: [vue(), nubiscoUI()] })
 * ```
 *
 * After which `<NbButton>` and `<NbIcon name="github-logo" />` work in any
 * template with no per-file import, and the built bundle contains the
 * components that page used and the icons it named, rather than the whole
 * library.
 *
 * Two plugins do the work:
 *
 * 1. `unplugin-vue-components` with a resolver over the library's component
 *    manifest, so `<NbButton>` becomes an import of
 *    `@nubisco/ui/components/Button` in the file that used it.
 * 2. The glyph transform, which turns literal icon and flag names into
 *    imports of the single glyph module they name.
 *
 * The component import comes with its stylesheets. The library ships one CSS
 * file per chunk instead of a single 214KB sheet, and `component-styles.json`
 * records which of them each component needs, so a page loads the styles for
 * what it renders and nothing else. Consumers who do not run this plugin
 * import `@nubisco/ui/css`, the whole sheet, as before.
 *
 * Nothing is deferred to runtime, so SSR, prerendering and hydration behave
 * exactly as they would with hand-written imports.
 */
export interface INubiscoUIOptions {
  /**
   * Auto-import components. Pass `false` to disable, or an object to control
   * where the ambient declarations are written.
   */
  components?:
    | boolean
    | {
        /**
         * Path for the generated ambient declarations, so editors and
         * `vue-tsc` still see the global tags. Defaults to
         * `components.d.ts`; pass `false` to skip.
         */
        dts?: boolean | string
        /** Extra directories of the consumer's own components to auto-import. */
        dirs?: string[]
      }
  /** Resolve icon and flag names at compile time. Pass `false` to disable. */
  glyphs?: boolean | IGlyphOptions
  /**
   * Import each component's stylesheets alongside the component. Defaults to
   * true. Pass `false` if you import `@nubisco/ui/css` yourself and would
   * rather have the whole sheet.
   */
  styles?: boolean
  /**
   * Where the built library lives. Only the library's own build sets this.
   */
  distRoot?: string
}

/** dist/plugins/vite/index.js → dist */
const defaultDistRoot = () =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** Which stylesheets each component needs, recorded by the library's build. */
function loadStyleManifest(distRoot: string): Record<string, string[]> {
  const file = path.join(distRoot, 'component-styles.json')
  if (!existsSync(file)) return {}
  return JSON.parse(readFileSync(file, 'utf8'))
}

/** Every `Nb*` tag the library ships, mapped to its published entry point. */
const RESOLVER_ENTRIES = Object.entries(COMPONENT_MANIFEST) as [
  string,
  string,
][]

export function nubiscoUI(options: INubiscoUIOptions = {}): Plugin[] {
  const { components = true, glyphs = true, styles = true } = options
  const componentOptions = typeof components === 'object' ? components : {}
  const plugins: Plugin[] = []

  if (glyphs !== false) {
    plugins.push(nubiscoGlyphs(typeof glyphs === 'object' ? glyphs : {}))
  }

  if (components !== false) {
    const lookup = new Map(RESOLVER_ENTRIES)
    const styleManifest = styles
      ? loadStyleManifest(options.distRoot ?? defaultDistRoot())
      : {}

    plugins.push(
      Components({
        dirs: componentOptions.dirs ?? [],
        dts: componentOptions.dts ?? 'components.d.ts',
        resolvers: [
          (name: string) => {
            const file = lookup.get(name)
            if (!file) return
            const sheets = styleManifest[file] ?? []
            return {
              name,
              from: `@nubisco/ui/components/${file}`,
              sideEffects: sheets.map((sheet) => `@nubisco/ui/dist/${sheet}`),
            }
          },
        ],
      }),
    )
  }

  return plugins
}

export { nubiscoGlyphs }
export type { IGlyphOptions }
export default nubiscoUI
