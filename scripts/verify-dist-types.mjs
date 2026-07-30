/**
 * Fail the build when a shipped declaration file points at a module that is
 * not in `dist`.
 *
 * 1.53.0 published `dist/main.d.ts` re-exporting `./components/DataTable.d`
 * and 90 other modules that were never emitted, so `import type
 * { IDataTableColumn } from '@nubisco/ui'` resolved to nothing and any
 * consumer running vue-tsc failed. Nothing in the pipeline noticed, because
 * the library type-checks its own SOURCE (where those modules exist) and never
 * type-checks the build output.
 *
 * This walks every `.d.ts` in dist, resolves each relative specifier the way
 * TypeScript would, and exits non-zero on the first unresolvable one.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'

const OUT = process.argv[2] ?? 'dist'

if (!existsSync(OUT)) {
  console.error(
    `verify-dist-types: ${OUT}/ does not exist. Run the build first.`,
  )
  process.exit(1)
}

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, found)
    else if (path.endsWith('.d.ts')) found.push(path)
  }
  return found
}

// `export ... from './x'`, `import ... from './x'`, `import('./x')`
const SPECIFIER = /(?:from\s*|import\s*\(\s*)['"](\.[^'"]+)['"]/g

// `@/…` is this repo's build-time alias for `src`. It cannot resolve in a
// consumer's node_modules, so it must never survive into a shipped
// declaration. Caught separately because there is nothing to resolve against.
const ALIAS = /(?:from\s*|import\s*\(\s*)['"](@\/[^'"]+)['"]/g

// JSDoc blocks routinely show example imports of paths that do not exist in
// the package (`* import Foo from './icons/Foo.vue'`). Only real code counts.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const files = walk(OUT)
const broken = new Map()

for (const file of files) {
  const source = stripComments(readFileSync(file, 'utf8'))
  for (const match of source.matchAll(SPECIFIER)) {
    const specifier = match[1]
    const base = resolve(dirname(file), specifier)
    // TS tries the literal path, then extensions, then a directory index.
    // `./Foo.d` legitimately resolves to `Foo.d.ts`.
    const resolves = [
      base,
      `${base}.d.ts`,
      `${base}.ts`,
      join(base, 'index.d.ts'),
    ].some((candidate) => existsSync(candidate))
    if (resolves) continue

    const key = `${relative(OUT, file)} -> ${specifier}`
    broken.set(key, (broken.get(key) ?? 0) + 1)
  }

  for (const match of source.matchAll(ALIAS)) {
    const key = `${relative(OUT, file)} -> ${match[1]} (unresolvable build alias)`
    broken.set(key, (broken.get(key) ?? 0) + 1)
  }
}

if (broken.size > 0) {
  console.error(
    `verify-dist-types: ${broken.size} unresolvable module reference(s) in ${OUT}/.\n` +
      'These would ship as "cannot find module" errors for consumers:\n',
  )
  for (const key of [...broken.keys()].sort()) console.error(`  ${key}`)
  process.exit(1)
}

console.log(
  `verify-dist-types: OK, every relative reference in ${files.length} declaration file(s) resolves`,
)
