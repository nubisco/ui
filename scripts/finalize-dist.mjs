/**
 * Puts the non-Rollup pieces of the package into `dist`:
 *
 * 1. The generated glyph modules, copied verbatim. They are published files
 *    with stable, addressable paths (`@nubisco/ui/icons/github-logo`), which
 *    is precisely what a hashed bundler chunk cannot be.
 * 2. A type entry for every component subpath, so
 *    `import { NbButton } from '@nubisco/ui/components/Button'` resolves its
 *    types as well as its runtime.
 * 3. `dist/ui.css`, the whole stylesheet, reassembled from the split ones. The
 *    build emits one file per chunk so a page can load only the components it
 *    renders, but `@nubisco/ui/css` stays the single import for anyone not
 *    running the bundler plugin, and for `@nubisco/ui/all`.
 */
import {
  cpSync,
  existsSync,
  appendFileSync,
  readdirSync,
  writeFileSync,
  readFileSync,
} from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

for (const kind of ['icons', 'flags']) {
  const from = path.join(root, 'generated', kind)
  if (!existsSync(from)) throw new Error(`missing generated/${kind}`)
  cpSync(from, path.join(dist, kind), { recursive: true })
}

const manifestSource = readFileSync(
  path.join(root, 'src/components/manifest.ts'),
  'utf8',
)
const manifest = [...manifestSource.matchAll(/^\s{2}(Nb\w+): '(.+)',$/gm)].map(
  (match) => ({ name: match[1], file: match[2] }),
)

for (const { name, file } of manifest) {
  const declaration = path.join(dist, 'components', `${file}.d.ts`)
  const basename = path.basename(file)
  // `Foo.d.ts` may already exist: it is the hand-written props module that
  // `copy-type-modules.mjs` brought over. Appending keeps both the prop types
  // and the component available from the one subpath consumers import.
  const line = `\nexport { default, default as ${name} } from './${basename}.vue'\n`
  if (existsSync(declaration)) appendFileSync(declaration, line)
  else writeFileSync(declaration, line.trimStart())
}

/* ------------------------------------------------------------- stylesheets */

const stylesDir = path.join(dist, 'styles')
const styleManifest = JSON.parse(
  readFileSync(path.join(dist, 'component-styles.json'), 'utf8'),
)

// Dependency order first: `component-styles.json` lists a component's shared
// stylesheets before its own, so walking it in order keeps the cascade the
// single-file build produced. Anything no component reached (a chunk reachable
// only from the barrel) is appended.
const ordered = []
const seen = new Set()
for (const files of Object.values(styleManifest)) {
  for (const file of files) {
    if (seen.has(file)) continue
    seen.add(file)
    ordered.push(file)
  }
}
for (const file of readdirSync(stylesDir).sort()) {
  const relative = `styles/${file}`
  if (!seen.has(relative)) {
    seen.add(relative)
    ordered.push(relative)
  }
}

writeFileSync(
  path.join(dist, 'ui.css'),
  ordered.map((file) => readFileSync(path.join(dist, file), 'utf8')).join(''),
)

console.log(
  `finalized dist: glyph modules copied, ${manifest.length} component type ` +
    `entries written, ui.css rebuilt from ${ordered.length} stylesheets`,
)
