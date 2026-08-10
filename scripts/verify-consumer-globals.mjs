/**
 * Type-check a stand-in consumer SFC against the BUILT `dist/global.d.ts`.
 *
 * `verify-consumer-types` proves the named type EXPORTS are usable. It cannot
 * see the globally-registered-component path, because that never goes through
 * an import: a consumer writes <NbBadge> and Vue resolves it through
 * `interface GlobalComponents` in module 'vue'. Emit that augmentation under
 * any other name and it is still valid TypeScript, still ships, and is still
 * read by nobody, so every <Nb*> tag downstream stays `any` forever. That is
 * precisely what 1.53.1-1.56.0 did with `IGlobalComponents`.
 *
 * vue-tsc (not tsc) is required here: only the Vue language plugin type-checks
 * template tags and their props.
 */
import { existsSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const DIST = resolve('dist')
const GLOBALS = join(DIST, 'global.d.ts')
const FIXTURE = resolve('scripts/fixtures/consumer-globals.vue')

for (const [label, path] of [
  ['dist/global.d.ts', GLOBALS],
  ['fixture', FIXTURE],
]) {
  if (!existsSync(path)) {
    console.error(`verify-consumer-globals: missing ${label} at ${path}`)
    process.exit(1)
  }
}

// Same constraint as verify-consumer-types: the config has to live in the repo
// so that the bare `vue` specifier inside the built declarations resolves.
//
// `dist/global.d.ts` is listed in `files` rather than pulled in via `types`.
// It is a module (it has imports and an `export {}`), and a module only
// contributes its augmentation once it is actually part of the program; a
// `types` entry pointing at it does not reliably do that, which fails OPEN --
// the tag falls back to `any` and every probe below passes for the wrong
// reason. Listing the file is unambiguous.
const config = resolve('.consumer-globals.tsconfig.json')

writeFileSync(
  config,
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      files: [GLOBALS, FIXTURE],
    },
    null,
    2,
  ),
)

try {
  execFileSync('npx', ['vue-tsc', '-p', config], { stdio: 'inherit' })
  console.log(
    'verify-consumer-globals: OK, <Nb*> tags type-check in a consumer template',
  )
} catch {
  console.error(
    '\nverify-consumer-globals: FAILED. Globally-registered components do not\n' +
      'type-check for consumers.\n' +
      'An "unused @ts-expect-error" (TS2578) here means the <Nb*> tag resolved to\n' +
      '`any`. The usual cause is dist/global.d.ts augmenting an interface other\n' +
      'than `GlobalComponents` -- check src/plugins/globalTypes.ts.',
  )
  process.exit(1)
} finally {
  rmSync(config, { force: true })
}
