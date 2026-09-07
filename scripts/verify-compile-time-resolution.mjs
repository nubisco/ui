/**
 * Asserts the two properties the whole packaging design rests on, against the
 * built output rather than the source.
 *
 * 1. No component resolves a sibling by name at runtime. `NbTextInput` used to
 *    call `resolveComponent('NbGrid')` for its own wrapper, which is what made
 *    global registration mandatory: without it the component rendered an
 *    unknown `<nbgrid>` element, no layout, no styling. A library must never
 *    depend on the consumer's global registry.
 *
 * 2. No component pulls in a glyph catalogue. The catalogues are opt-in, loaded
 *    by the one file in a consuming app that needs a runtime-chosen name. If a
 *    library component imported one, every app would carry all 1,500 icons
 *    again and the change would have silently undone itself.
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, process.argv[2] ?? 'dist')

/** Every built JS file except the generated glyph modules themselves. */
const walk = (dir, found = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'icons' || entry === 'flags') continue
      walk(full, found)
    } else if (/\.(mjs|cjs|js)$/.test(entry)) {
      found.push(full)
    }
  }
  return found
}

const files = walk(dist)
const failures = []

for (const file of files) {
  const code = readFileSync(file, 'utf8')
  const relative = path.relative(root, file)

  // Minified, so the helper is aliased: match the call by its argument.
  for (const match of code.matchAll(/\(\s*"(Nb[A-Z]\w*)"\s*\)/g)) {
    const before = code.slice(Math.max(0, match.index - 40), match.index)
    if (/resolve(Component|Dynamic)|\b[a-zA-Z_$]{1,3}$/.test(before)) {
      failures.push(`${relative}: resolves <${match[1]}> by name at runtime`)
    }
  }

  // dist/plugins is build-time code: the bundler plugin emits that import
  // string into consumer source, it does not execute it.
  if (
    !relative.startsWith('dist/plugins') &&
    /@nubisco\/ui\/(icons|flags)\/all/.test(code)
  ) {
    failures.push(`${relative}: imports a full glyph catalogue`)
  }
}

if (failures.length) {
  console.error('verify-compile-time-resolution: FAILED')
  for (const failure of [...new Set(failures)]) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  `verify-compile-time-resolution: OK, ${files.length} built module(s) resolve components and glyphs at compile time`,
)
