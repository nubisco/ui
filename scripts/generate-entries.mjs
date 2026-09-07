/**
 * Writes one entry module per component into `generated/entries/`.
 *
 * `dist/components/` used to hold 54 files, every one of them a `.d.ts`: the
 * entire runtime was the single `dist/index.mjs` barrel, and
 * `exports["./components/*"]` pointed its `import` condition at `src/`, which
 * `files` does not publish. A deep import resolved its types and failed on its
 * runtime.
 *
 * Each generated entry re-exports the SFC under both `default` and its `Nb*`
 * name, so `@nubisco/ui/components/Button` works with either import style, and
 * so the bundler plugin can inject a named import.
 */
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'generated/entries')

const manifestSource = readFileSync(
  path.join(root, 'src/components/manifest.ts'),
  'utf8',
)
const manifest = [...manifestSource.matchAll(/^\s{2}(Nb\w+): '(.+)',$/gm)].map(
  (match) => ({ name: match[1], file: match[2] }),
)

rmSync(outDir, { recursive: true, force: true })
for (const { name, file } of manifest) {
  const target = path.join(outDir, `${file}.ts`)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(
    target,
    `export { default, default as ${name} } from '@/components/${file}.vue'\n`,
  )
}

console.log(`wrote ${manifest.length} component entry modules`)
export default manifest
