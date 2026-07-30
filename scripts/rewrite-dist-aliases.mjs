/**
 * Rewrite `@/…` alias specifiers in built declarations to relative paths.
 *
 * `@` is a build-time alias for `src` configured in this repo's vite/tsconfig.
 * It means nothing to a consumer, so any declaration shipped with
 * `from '@/types/Size.d'` is an unresolvable import in the published package.
 * This affects declarations vue-tsc emits as well as the hand-written type
 * modules, so the rewrite runs over the whole of `dist` rather than only the
 * files we copy in.
 *
 * Kept as a post-process rather than a source change because the alias is the
 * ergonomic form inside the repo, and `paths` rewriting is not something tsc
 * will do for us on declaration emit.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, relative, resolve, sep } from 'node:path'

const OUT = process.argv[2] ?? 'dist'

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, found)
    else if (path.endsWith('.d.ts')) found.push(path)
  }
  return found
}

// `from '@/x'`, `import('@/x')`, and the `declare module '@/x'` form.
const ALIAS = /(['"])@\/([^'"]+)\1/g

let changedFiles = 0
let changedSpecifiers = 0

for (const file of walk(OUT)) {
  const source = readFileSync(file, 'utf8')
  let touched = 0

  const next = source.replace(ALIAS, (_match, quote, subpath) => {
    // `@/x` points at `src/x`, which lands at `<OUT>/x` in the build.
    let rel = relative(dirname(file), resolve(OUT, subpath))
    if (sep === '\\') rel = rel.split('\\').join('/')
    if (!rel.startsWith('.')) rel = `./${rel}`
    touched++
    return `${quote}${rel}${quote}`
  })

  if (touched > 0) {
    writeFileSync(file, next)
    changedFiles++
    changedSpecifiers += touched
  }
}

console.log(
  `rewrite-dist-aliases: rewrote ${changedSpecifiers} alias specifier(s) across ${changedFiles} file(s)`,
)
