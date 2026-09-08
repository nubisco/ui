/**
 * A glyph named in a prop default is invisible to the compile-time transform.
 *
 * The transform reads templates. `<NbIcon name="check" />` is a literal it can
 * see and rewrite into an import; `icon: 'info'` in a `withDefaults` block is
 * a string in the script that reaches `NbIcon` as a runtime name, at which
 * point the component needs the icon catalogue that a compile-time build
 * deliberately does not carry, and throws on first render.
 *
 * That shipped twice, in NbInfoHint and NbNotificationCenter, and neither the
 * typecheck, the tests nor the build noticed: the components render fine in
 * this repo, where the docs site loads the whole catalogue. It only failed in
 * a consumer.
 *
 * So this reads every component's prop defaults, finds the ones whose value is
 * a glyph name the package ships, and fails if the built output does not link
 * that glyph. The fix, in every case, is for the component to import the glyph
 * module and default to that instead of to its name.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, process.argv[2] ?? 'dist')

const names = (kind) =>
  new Set(
    JSON.parse(
      readFileSync(path.join(root, 'generated', kind, 'names.json'), 'utf8'),
    ),
  )
const glyphs = { icons: names('icons'), flags: names('flags') }

/** Every `.vue` under src/components, recursively. */
const components = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return components(full)
    return entry.name.endsWith('.vue') ? [full] : []
  })

/** The built chunk for a component, plus everything it imports from dist. */
const builtSources = (name) => {
  const files = readdirSync(dist).filter(
    (file) => file.startsWith(`${name}-`) && file.endsWith('.js'),
  )
  return files.map((file) => readFileSync(path.join(dist, file), 'utf8'))
}

const failures = []
let checked = 0

for (const file of components(path.join(root, 'src/components'))) {
  const source = readFileSync(file, 'utf8')
  const defaults = source.match(/withDefaults\([\s\S]*?\{([\s\S]*?)\n\}\)/)
  if (!defaults) continue

  for (const match of defaults[1].matchAll(
    /^\s*(icon|flag|name)\w*:\s*'([a-z0-9][a-z0-9-]*)'/gm,
  )) {
    const [, prop, value] = match
    const kind = prop === 'flag' ? 'flags' : 'icons'
    if (!glyphs[kind].has(value)) continue

    checked += 1
    const name = path.basename(file, '.vue')
    const specifier = `@nubisco/ui/${kind}/${value}`
    const linked = builtSources(name).some((built) => built.includes(specifier))
    if (!linked) {
      failures.push(
        `${path.relative(root, file)}: \`${prop}: '${value}'\` is a glyph ` +
          `name in a prop default, and the built component does not import ` +
          `${specifier}. It will be resolved at runtime and throw in any app ` +
          `without the catalogue. Import the glyph module and default to it.`,
      )
    }
  }
}

if (!existsSync(dist)) {
  console.error(`verify-default-glyphs: no build at ${dist}`)
  process.exit(1)
}

if (failures.length) {
  console.error('verify-default-glyphs: FAILED')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(
  `verify-default-glyphs: OK, ${checked} glyph default(s) link their module`,
)
