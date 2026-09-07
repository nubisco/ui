/**
 * Generates the per-asset ESM modules that back `@nubisco/ui/icons/*` and
 * `@nubisco/ui/flags/*`.
 *
 * Why this exists: both NbIcon and NbFlag used to resolve their artwork through
 * a single virtual module holding every glyph, so any app that rendered one
 * icon linked the whole catalogue (~1.5 MB) and shipped ~9,000 lazy chunks.
 * Splitting the artwork into one addressable module per name lets a call site
 * with a literal name link exactly that name, while the full catalogue stays
 * available for the cases that genuinely need it (an icon picker, a country
 * selector, a value that arrives from an API).
 *
 * Output (git-ignored, copied into `dist/` by the build):
 *
 *   generated/icons/<name>.mjs     six weight exports, `regular` as default
 *   generated/icons/all.mjs        lazy catalogue, registers itself globally
 *   generated/icons/catalog.mjs    name/tags/categories metadata, no artwork
 *   generated/flags/…              same shape, one weight per flag
 *
 * The modules are plain ESM whose only import is `vue`, so the build copies
 * them verbatim rather than routing them through Rollup: they must keep stable
 * paths (`@nubisco/ui/icons/github-logo`), which hashed bundler chunks cannot.
 *
 * Each module inlines its own factory rather than importing a shared one. A
 * shared module would make every glyph part of one chunk in the consumer's
 * graph, which both couples them and let Rollup name the chunk holding Vue
 * after our runtime file. The factory minifies to a couple of hundred bytes
 * and gzips against itself, which is a good trade for a module that has no
 * dependency but Vue.
 */
import { createRequire } from 'module'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = path.join(root, 'generated')

const WEIGHTS = ['thin', 'light', 'regular', 'bold', 'fill', 'duotone']

/** Pull the viewBox and the drawable body out of a raw SVG file. */
function splitSvg(source) {
  const open = source.match(/<svg\b[^>]*>/)
  if (!open) throw new Error('no <svg> element found')
  const viewBox = open[0].match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 256 256'
  const body = source
    .slice(open.index + open[0].length, source.lastIndexOf('</svg>'))
    .replace(/\s+/g, ' ')
    .trim()
  return { viewBox, body }
}

/**
 * Prelude inlined at the top of every glyph module.
 *
 * The markup is held as a string and handed to Vue as `innerHTML`, which both
 * the DOM renderer and `@vue/server-renderer` understand, so these components
 * are SSR-safe and cost one function call each instead of a compiled render
 * function. `glyphName` travels with the component so that NbIcon and NbFlag
 * can still derive their identity class and stable element id after the
 * compile-time plugin has replaced a literal name with this module.
 */
const PRELUDE = `import { h } from 'vue'

const g = (name, viewBox, body) => {
  const c = (props) =>
    h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox,
      fill: 'currentColor',
      ...props,
      innerHTML: body,
    })
  c.displayName = 'NbGlyph'
  c.glyphName = name
  return c
}
`

function writeModule(dir, name, contents) {
  writeFileSync(path.join(dir, `${name}.mjs`), contents)
}

/* ------------------------------------------------------------------ icons */

function generateIcons() {
  const dir = path.join(outRoot, 'icons')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const { icons } = require('@phosphor-icons/core')
  const assets = path.join(root, 'node_modules/@phosphor-icons/core/assets')

  const catalogEntries = []
  const loaderEntries = []

  for (const icon of icons) {
    const lines = [PRELUDE]
    for (const weight of WEIGHTS) {
      const file =
        weight === 'regular' ? `${icon.name}.svg` : `${icon.name}-${weight}.svg`
      const { viewBox, body } = splitSvg(
        readFileSync(path.join(assets, weight, file), 'utf8'),
      )
      lines.push(
        `export const ${weight} = /*#__PURE__*/ g(${JSON.stringify(icon.name)}, ${JSON.stringify(viewBox)}, ${JSON.stringify(body)})`,
      )
    }
    lines.push(
      '',
      `export const glyphName = ${JSON.stringify(icon.name)}`,
      '',
      'export default regular',
      '',
    )
    writeModule(dir, icon.name, lines.join('\n'))

    const tags = icon.tags.filter((tag) => !tag.startsWith('*'))
    catalogEntries.push(
      `  ${JSON.stringify(icon.name)}: { name: ${JSON.stringify(icon.name)}, tags: ${JSON.stringify(tags)}, categories: ${JSON.stringify([...icon.categories])} }`,
    )
    loaderEntries.push(
      `  ${JSON.stringify(icon.name)}: () => import('./${icon.name}.mjs')`,
    )
  }

  writeModule(
    dir,
    'catalog',
    `/** Static metadata for every bundled icon. Carries no artwork. */\nexport const catalog = {\n${catalogEntries.join(',\n')}\n}\n\nexport default catalog\n`,
  )
  writeModule(dir, 'all', catalogueModule('icon', loaderEntries))
  writeFileSync(
    path.join(dir, 'names.json'),
    JSON.stringify(icons.map((icon) => icon.name)),
  )
  writeTypes(dir, 'icon')

  return icons.length
}

/* ------------------------------------------------------------------ flags */

function generateFlags() {
  const dir = path.join(outRoot, 'flags')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const assets = path.join(root, 'src/assets/flags')
  const files = readdirSync(assets).filter((file) => file.endsWith('.svg'))

  const catalogEntries = []
  const loaderEntries = []

  for (const file of files) {
    const code = file.replace(/\.svg$/, '')
    const { viewBox, body } = splitSvg(
      readFileSync(path.join(assets, file), 'utf8'),
    )
    writeModule(
      dir,
      code,
      [
        PRELUDE,
        `export const regular = /*#__PURE__*/ g(${JSON.stringify(code)}, ${JSON.stringify(viewBox)}, ${JSON.stringify(body)})`,
        '',
        `export const glyphName = ${JSON.stringify(code)}`,
        '',
        'export default regular',
        '',
      ].join('\n'),
    )
    catalogEntries.push(
      `  ${JSON.stringify(code)}: { name: ${JSON.stringify(code)} }`,
    )
    loaderEntries.push(
      `  ${JSON.stringify(code)}: () => import('./${code}.mjs')`,
    )
  }

  writeModule(
    dir,
    'catalog',
    `/** Static metadata for every bundled flag. Carries no artwork. */\nexport const catalog = {\n${catalogEntries.join(',\n')}\n}\n\nexport default catalog\n`,
  )
  writeModule(dir, 'all', catalogueModule('flag', loaderEntries))
  writeFileSync(
    path.join(dir, 'names.json'),
    JSON.stringify(files.map((file) => file.replace(/\.svg$/, ''))),
  )
  writeTypes(dir, 'flag')

  return files.length
}

/* ------------------------------------------------------------- catalogues */

/**
 * The full catalogue: a map of name to lazy loader, published on `globalThis`
 * under a well-known symbol.
 *
 * The symbol, rather than a shared import, is deliberate. This module is a
 * published file with a stable path, while the component that reads the
 * catalogue lives inside a bundled chunk; routing both through one module
 * instance would tie this file's identity to a hashed chunk name. A symbol
 * registry costs nothing and survives duplicate copies of the library.
 */
function catalogueModule(kind, loaderEntries) {
  return `const KEY = Symbol.for('@nubisco/ui:${kind}-catalog')

const catalog = {
${loaderEntries.join(',\n')}
}

const store = globalThis[KEY] || (globalThis[KEY] = Object.create(null))
Object.assign(store, catalog)

export default catalog
`
}

function writeTypes(dir, kind) {
  const isIcon = kind === 'icon'
  const weights = isIcon ? WEIGHTS : ['regular']
  writeFileSync(
    path.join(dir, 'module.d.ts'),
    `import type { FunctionalComponent, SVGAttributes } from 'vue'

export type TGlyphComponent = FunctionalComponent<SVGAttributes> & {
  /** The catalogue name this glyph was generated from. */
  glyphName: string
}

${weights.map((w) => `export declare const ${w}: TGlyphComponent`).join('\n')}

export declare const glyphName: string

declare const _default: TGlyphComponent
export default _default
`,
  )
  writeFileSync(
    path.join(dir, 'all.d.ts'),
    `import type { TGlyphComponent } from './module'

export type TGlyphLoader = () => Promise<Record<string, TGlyphComponent>>

declare const catalog: Record<string, TGlyphLoader>
export default catalog
`,
  )
  writeFileSync(
    path.join(dir, 'catalog.d.ts'),
    isIcon
      ? `export interface IIconCatalogEntry {
  name: string
  tags: string[]
  categories: string[]
}

export declare const catalog: Record<string, IIconCatalogEntry>
declare const _default: Record<string, IIconCatalogEntry>
export default _default
`
      : `export interface IFlagCatalogEntry {
  name: string
}

export declare const catalog: Record<string, IFlagCatalogEntry>
declare const _default: Record<string, IFlagCatalogEntry>
export default _default
`,
  )
}

/* ---------------------------------------------------------------- driver */

mkdirSync(outRoot, { recursive: true })
const iconCount = generateIcons()
const flagCount = generateFlags()
console.log(
  `generated ${iconCount} icon modules and ${flagCount} flag modules in generated/`,
)
