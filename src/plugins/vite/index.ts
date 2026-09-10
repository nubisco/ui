import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import Components from 'unplugin-vue-components/vite'
import { COMPONENT_MANIFEST } from '../../components/manifest.js'
import { nubiscoGlyphs, type IGlyphOptions } from './glyphs.js'
import { nubiscoImports } from './imports.js'

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
 * A third plugin gives hand-written imports the same treatment, because an app
 * that writes `import { NbButton } from '@nubisco/ui'` never reaches the
 * resolver and so used to get no stylesheets at all.
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

/**
 * The full-stylesheet import, in the two spellings that reach the same file:
 * the `./css` export condition and the path it maps to. Matched against source
 * text rather than a resolved id so it is found before the CSS pipeline turns
 * it into something else.
 */
const FULL_SHEET =
  /(?:^|["'\s(])@nubisco\/ui\/(?:css|dist\/ui\.css)(?=["'\s)]|$)/m

export function nubiscoUI(options: INubiscoUIOptions = {}): Plugin[] {
  const { components = true, glyphs = true, styles = true } = options
  const componentOptions = typeof components === 'object' ? components : {}
  const plugins: Plugin[] = []
  let resolvedComponents = 0

  if (glyphs !== false) {
    plugins.push(nubiscoGlyphs(typeof glyphs === 'object' ? glyphs : {}))
  }

  if (components !== false) {
    const lookup = new Map(RESOLVER_ENTRIES)
    // Set by the first non-vendor module found importing the full sheet.
    let fullSheetImporter: string | null = null
    const styleManifest = styles
      ? loadStyleManifest(options.distRoot ?? defaultDistRoot())
      : {}

    plugins.push(
      nubiscoImports({
        manifest: lookup,
        styleManifest,
        styles,
        packageName: '@nubisco/ui',
        onResolve: (count) => {
          resolvedComponents += count
        },
      }) as Plugin,
    )

    plugins.push(
      Components({
        dirs: componentOptions.dirs ?? [],
        dts: componentOptions.dts ?? 'components.d.ts',
        resolvers: [
          (name: string) => {
            const file = lookup.get(name)
            if (!file) return
            resolvedComponents += 1
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

    // A build that linked no component at all cannot have linked any component
    // CSS either, and `styles: true` says the app is relying on this plugin
    // for it. That combination ships an unstyled app and fails nothing, so it
    // is worth a line. It is reachable when every usage goes through a
    // namespace import (`import * as UI from '@nubisco/ui'`), or a dynamic
    // one, neither of which names the components it uses.
    if (styles) {
      plugins.push({
        name: 'nubisco-ui:styles-check',
        apply: 'build',

        /*
         * The other half of the same mistake.
         *
         * `@nubisco/ui/css` is the whole 214KB sheet for all 86 components. It
         * still exists and still works, so an app that keeps importing it
         * while this plugin also links per-component sheets gets every rule
         * twice: byte-identical, same specificity, nothing renders
         * differently, and the only symptom is a CSS bundle roughly twice the
         * size it should be.
         *
         * That combination is exactly what an upgrade produces, because
         * importing the full sheet was the correct thing to do beforehand.
         * The upgrade guide says to drop the line; this says so at the moment
         * it starts costing something, which is the difference between a
         * sentence someone read and a sentence someone acts on.
         */
        transform(code, id) {
          if (fullSheetImporter) return
          if (id.includes('/node_modules/')) return
          if (!FULL_SHEET.test(code)) return
          fullSheetImporter = id
          return null
        },

        closeBundle() {
          /*
           * Both halves of the condition matter, and the second one is not
           * decoration.
           *
           * The full sheet is the RIGHT answer for a build that links no
           * per-component stylesheets: an entry built without this plugin at
           * all, or one whose components never got resolved. Warning on the
           * import alone would fire on a file where importing it is the only
           * thing keeping the app styled, and a diagnostic that cries wolf on
           * correct code is how people learn to ignore it.
           *
           * So this fires only when both sources are actually feeding the same
           * build. That also makes it mutually exclusive with the "nothing was
           * linked" warning below, which is the opposite failure.
           */
          if (fullSheetImporter && resolvedComponents > 0) {
            const where = fullSheetImporter.split('/').slice(-2).join('/')
            console.warn(
              `[nubisco-ui] ${where} imports the full stylesheet ` +
                `('@nubisco/ui/css') and this plugin is also linking ` +
                `per-component stylesheets, so every component rule is in ` +
                `this build twice. It renders correctly and costs roughly ` +
                `double the component CSS. Drop the import, or keep it and ` +
                `pass \`nubiscoUI({ styles: false })\`.`,
            )
          }
          if (resolvedComponents) return
          console.warn(
            `[nubisco-ui] no components were linked in this build, so none of ` +
              `the component stylesheets were either. If this app renders ` +
              `Nubisco components, it will render unstyled. Import them by ` +
              `name (\`import { NbButton } from '@nubisco/ui'\`) or use the ` +
              `tags directly so they can be resolved; or pass ` +
              `\`nubiscoUI({ styles: false })\` and import ` +
              `'@nubisco/ui/css' yourself.`,
          )
        },
      })
    }
  }

  return plugins
}

export { nubiscoGlyphs }
export type { IGlyphOptions }
export default nubiscoUI
