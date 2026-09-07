/**
 * Guards the two properties that make splitting `ui.css` safe.
 *
 * The library used to ship one 214KB stylesheet, so a page that rendered a
 * button downloaded the styles for all 86 components. It now ships one file per
 * chunk, and `@nubisco/ui/vite` imports only the ones a page's components need.
 * That changes the order library rules appear in, which is only safe because:
 *
 * 1. Nothing is dropped. `dist/ui.css` still contains every rule, so consumers
 *    who import the whole sheet, or use `@nubisco/ui/all`, are unaffected.
 *
 * 2. No unscoped selector appears in two stylesheets. Almost every rule is
 *    scoped to its component with a `[data-v-…]` attribute and cannot collide;
 *    the handful of unscoped ones could, and if two sheets ever styled the same
 *    unscoped selector, which one won would depend on the order the consumer's
 *    bundler happened to emit them in. That is the failure this catches: it
 *    would look like a component rendering differently on one page than
 *    another, for no reason visible in the source.
 *
 * Ordering against the *consuming app's* own CSS is a different question, and
 * one this cannot check; it is covered in the upgrade guide.
 */
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, process.argv[2] ?? 'dist')
const stylesDir = path.join(dist, 'styles')

/** Top-level selector lists, in source order. */
function selectors(css) {
  const found = []
  let depth = 0
  let buffer = ''
  for (const character of css) {
    if (character === '{') {
      if (depth === 0) found.push(buffer.trim())
      depth += 1
      buffer = ''
    } else if (character === '}') {
      depth -= 1
      buffer = ''
    } else if (depth === 0) {
      buffer += character
    }
  }
  return found
}

const sheets = readdirSync(stylesDir).filter((file) => file.endsWith('.css'))
const whole = readFileSync(path.join(dist, 'ui.css'), 'utf8')
const wholeSelectors = new Set(selectors(whole))

const failures = []
const unscoped = new Map()

for (const sheet of sheets) {
  const css = readFileSync(path.join(stylesDir, sheet), 'utf8')
  for (const selector of selectors(css)) {
    if (!wholeSelectors.has(selector)) {
      failures.push(`ui.css is missing "${selector}" from styles/${sheet}`)
    }
    if (selector.startsWith('@') || selector.includes('[data-v-')) continue
    for (const one of selector.split(',').map((part) => part.trim())) {
      if (!one) continue
      const owners = unscoped.get(one) ?? new Set()
      owners.add(sheet)
      unscoped.set(one, owners)
    }
  }
}

for (const [selector, owners] of unscoped) {
  if (owners.size > 1) {
    failures.push(
      `unscoped selector "${selector}" is styled by ${[...owners].join(' and ')}, ` +
        `so which one wins depends on the consumer's bundle order`,
    )
  }
}

if (failures.length) {
  console.error('verify-style-split: FAILED')
  for (const failure of failures.slice(0, 20)) console.error(`  ${failure}`)
  if (failures.length > 20) console.error(`  …and ${failures.length - 20} more`)
  process.exit(1)
}

console.log(
  `verify-style-split: OK, ${sheets.length} stylesheets, all present in ui.css, ` +
    `${unscoped.size} unscoped selector(s), none shared`,
)
