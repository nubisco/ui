/**
 * Type-check a stand-in consumer against the BUILT declarations.
 *
 * `pnpm types:check` only proves the SOURCE is sound. It cannot catch a
 * declaration that was never emitted, an unresolvable alias that survived into
 * dist, or a public type that silently became `any` for everyone downstream.
 * This resolves `@nubisco/ui` to `dist/main.d.ts` exactly as a consumer would
 * and fails the build if the published surface is not usable.
 *
 * skipLibCheck mirrors the common consumer setting (it is the default in
 * @vue/tsconfig, and what Stagewright uses), which is deliberately the LEAST
 * strict case: the failure mode being guarded is silent degradation to `any`,
 * which only surfaces via the fixture's @ts-expect-error probes.
 */
import { existsSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const DIST = resolve('dist')
const ENTRY = join(DIST, 'main.d.ts')
const FIXTURE = resolve('scripts/fixtures/consumer-types.ts')

for (const [label, path] of [
  ['dist/main.d.ts', ENTRY],
  ['fixture', FIXTURE],
]) {
  if (!existsSync(path)) {
    console.error(`verify-consumer-types: missing ${label} at ${path}`)
    process.exit(1)
  }
}

// The config has to live in the repo, not a temp dir: the built declarations
// import `vue`, and a bare specifier resolves from the importing file upward.
// Run from /tmp and `vue` goes unresolved, which silently turns the very types
// under test into `any` and the probes stop meaning anything.
const config = resolve('.consumer-types.tsconfig.json')

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
        paths: { '@nubisco/ui': [ENTRY] },
      },
      files: [FIXTURE],
    },
    null,
    2,
  ),
)

try {
  execFileSync('npx', ['tsc', '-p', config], { stdio: 'inherit' })
  console.log(
    'verify-consumer-types: OK, the built declarations are usable from outside the package',
  )
} catch {
  console.error(
    '\nverify-consumer-types: FAILED. The built declarations are not usable by a consumer.\n' +
      'An "unused @ts-expect-error" here means a public type resolved to `any`,\n' +
      'which almost always means its declaration module is missing from dist.',
  )
  process.exit(1)
} finally {
  rmSync(config, { force: true })
}
