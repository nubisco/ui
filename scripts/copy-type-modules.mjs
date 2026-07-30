/**
 * Copy hand-written type-only modules (`src/**\/*.d.ts`) into `dist`.
 *
 * TypeScript treats a `.d.ts` INPUT as already-emitted output: it type-checks
 * it but never writes it to `outDir`. So every `Foo.d.ts` we author by hand is
 * silently absent from the build, while the `Foo.vue.d.ts` that imports
 * `./Foo.d` is emitted and ships pointing at nothing. Consumers then get
 * "cannot find module" for every shared interface.
 *
 * Sibling modules named `Foo.types.ts` do not have this problem (tsc emits
 * `Foo.types.d.ts` normally), which is why the Blueprint types always worked
 * and the rest did not.
 *
 * Copying preserves the existing import specifiers exactly (`./Foo.d` resolves
 * to `Foo.d.ts`), so this needs no source changes. Renaming all of them to
 * `*.types.ts` would be the tidier long-term shape but is a much larger,
 * riskier change than a packaging fix warrants.
 */
import {
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from 'node:fs'
import { join, dirname, relative } from 'node:path'

const SRC = 'src'
const OUT = 'dist'

const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, found)
    else if (path.endsWith('.d.ts')) found.push(path)
  }
  return found
}

if (!existsSync(OUT)) {
  console.error(
    `copy-type-modules: ${OUT}/ does not exist. Run the type build first.`,
  )
  process.exit(1)
}

const sources = walk(SRC)

if (sources.length === 0) {
  console.error(
    'copy-type-modules: found no *.d.ts modules under src/. Refusing to continue.',
  )
  process.exit(1)
}

let copied = 0
const skipped = []

for (const source of sources) {
  const target = join(OUT, relative(SRC, source))
  // A file tsc actually emitted wins: it is generated from real source.
  if (existsSync(target)) {
    skipped.push(relative(SRC, source))
    continue
  }
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(source, target)
  copied++
}

console.log(`copy-type-modules: copied ${copied} type module(s) into ${OUT}/`)
if (skipped.length > 0) {
  console.log(
    `copy-type-modules: left ${skipped.length} already-emitted file(s) untouched: ${skipped.join(', ')}`,
  )
}
