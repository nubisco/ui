/**
 * Prove an exported theme file is a usable theme, not just valid SCSS.
 *
 * A theme builder that produces a download has proved nothing. What matters is
 * whether the file it produced compiles against the library's PUBLIC entry
 * points, scopes its tokens to its own identifier, defines both halves, and can
 * sit alongside another theme without either clobbering the other.
 *
 * This checks the compiled CSS rather than the exit code, because `sass` exits
 * zero on a file that emits nothing at all.
 *
 * Run: `node scripts/verify-theme-export.mjs`
 */

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import * as sass from 'sass-embedded'

const ROOT = resolve('.')
const failures = []

function check(label, condition, detail = '') {
  if (condition) return
  failures.push(detail ? `${label}\n    ${detail}` : label)
}

/**
 * Compile as a consumer would.
 *
 * `@nubisco/ui/...` is mapped to this checkout, which is what a real install
 * resolves it to. If a theme file reaches into a path the package does not
 * export, it fails here rather than in someone's application.
 */
function compile(scss) {
  return sass.compileString(scss, {
    loadPaths: [ROOT],
    importers: [
      {
        findFileUrl(url) {
          if (!url.startsWith('@nubisco/ui/')) return null
          const rest = url.slice('@nubisco/ui/'.length)
          return new URL(`file://${join(ROOT, 'src', rest)}`)
        },
      },
    ],
  }).css
}

/** The same output the documentation's exporter produces. */
function themeFile(id, light, dark) {
  const emit = (m) =>
    `(\n${Object.entries(m)
      .map(([k, v]) => `    ${k}: ${v},`)
      .join('\n')}\n  )`
  return `@use '@nubisco/ui/styles/theme-api' as nb;

@include nb.theme(
  '${id}',
  $light: ${emit(light)},
  $dark: ${emit(dark)}
);
`
}

const OCEAN_LIGHT = {
  primary: '#0f6f8c',
  'layer-0': '#eef4f6',
  text: '#12252c',
}
const OCEAN_DARK = { primary: '#4fb3cf', 'layer-0': '#0b1418', text: '#e6eef1' }
const FOREST_LIGHT = { primary: '#2f6b3f', 'layer-0': '#eff3ee' }
const FOREST_DARK = { primary: '#68b97e', 'layer-0': '#0d130e' }

/* ── 1. It compiles against the public entry point ──────────────────────── */

let ocean = ''
try {
  ocean = compile(themeFile('ocean', OCEAN_LIGHT, OCEAN_DARK))
} catch (error) {
  check('exported theme compiles', false, String(error.message).split('\n')[0])
}

/* ── 2. It emits something, under its own identifier ────────────────────── */

check('emits CSS', ocean.trim().length > 0, 'compiled to an empty stylesheet')
check(
  'light half is scoped to the theme id',
  /\[data-nb-theme=["']?ocean["']?\]\s*\{/.test(ocean),
)
check(
  'dark half is scoped to the theme id',
  /\.dark\s*\[data-nb-theme=["']?ocean["']?\]|\.dark\[data-nb-theme=["']?ocean["']?\]/.test(
    ocean,
  ),
)

/* ── 3. Both halves carry their own values ──────────────────────────────── */

check('light value present', ocean.includes('#0f6f8c'))
check('dark value present', ocean.includes('#4fb3cf'))
check(
  'tokens use the semantic prefix',
  ocean.includes('--nb-c-primary') && ocean.includes('--nb-c-layer-0'),
)

/* ── 4. It leaks nothing outside its own scope ──────────────────────────── */

// A theme that emitted a bare `:root` block would repaint every other theme.
check(
  'no unscoped :root block',
  !/(^|\})\s*:root\s*\{/.test(ocean),
  'a theme must not redeclare tokens globally',
)
check(
  'does not re-emit the library stylesheet',
  !ocean.includes('.nb-button') && !ocean.includes('--nb-base-unit'),
  'the theme should carry its own tokens only',
)

/* ── 5. Two themes coexist ──────────────────────────────────────────────── */

let both = ''
try {
  both =
    compile(themeFile('ocean', OCEAN_LIGHT, OCEAN_DARK)) +
    '\n' +
    compile(themeFile('forest', FOREST_LIGHT, FOREST_DARK))
} catch (error) {
  check('two themes compile', false, String(error.message).split('\n')[0])
}
check(
  'both identifiers survive',
  both.includes('ocean') && both.includes('forest'),
)
check(
  'both palettes survive',
  both.includes('#0f6f8c') && both.includes('#2f6b3f'),
  'one theme overwrote the other',
)

/* ── 6. An unsafe identifier is refused, not escaped ────────────────────── */

let injected = null
try {
  injected = compile(
    themeFile("evil'] { color: red } [x", OCEAN_LIGHT, OCEAN_DARK),
  )
} catch {
  injected = null
}
check(
  'an identifier that could break out of the selector is rejected',
  injected === null,
  'the mixin compiled a malformed id instead of erroring',
)

/* ── 7. It needs nothing private ────────────────────────────────────────── */

const source = themeFile('ocean', OCEAN_LIGHT, OCEAN_DARK)
check(
  'imports only the documented entry point',
  /@use\s+'@nubisco\/ui\/styles\/theme-api'/.test(source) &&
    !/\.\.\//.test(source),
  'an exported file must not reach into the package by relative path',
)

/* ── 8. A theme is colour only ──────────────────────────────────────────── */

check(
  'carries no corner geometry',
  !ocean.includes('--nb-radius') && !ocean.includes('data-nb-appearance'),
  'appearance must stay independent of the colour theme',
)

/* ── Report ─────────────────────────────────────────────────────────────── */

// Prove the round trip once more from a real file on disk, the way a consumer
// imports one, rather than only from a string in memory.
const dir = mkdtempSync(join(tmpdir(), 'nb-theme-'))
try {
  const file = join(dir, 'ocean.scss')
  writeFileSync(file, source)
  const fromDisk = sass.compile(file, {
    loadPaths: [ROOT],
    importers: [
      {
        findFileUrl(url) {
          if (!url.startsWith('@nubisco/ui/')) return null
          return new URL(
            `file://${join(ROOT, 'src', url.slice('@nubisco/ui/'.length))}`,
          )
        },
      },
    ],
  }).css
  check('compiles from a file on disk', fromDisk.includes('#0f6f8c'))
} catch (error) {
  check(
    'compiles from a file on disk',
    false,
    String(error.message).split('\n')[0],
  )
} finally {
  rmSync(dir, { recursive: true, force: true })
}

/* ── 9. A palette is expanded into ramps, with foregrounds ──────────────── */

/*
 * The part a consuming build depends on and a unit test cannot see: the mixin
 * turns declared base colours into the same seventeen-step ramps the library
 * builds for its own colours, gives every step an -a11y counterpart, and makes
 * a role that points at a step carry that step's foreground.
 */
let palette = ''
try {
  palette = compile(
    `@use '@nubisco/ui/styles/theme-api' as nb;\n` +
      `@include nb.theme('reef',\n` +
      `  $palette: (accent: #0f6f8c, neutral: #6b7280),\n` +
      `  $light: ('primary': 'accent-500', 'layer-0': #ffffff),\n` +
      `  $dark: ('primary': 'accent-350')\n` +
      `);\n`,
  )
} catch (error) {
  check('palette theme compiles', false, String(error.message).split('\n')[0])
}

const TINTS = [
  100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
  850, 900,
]
const missingSteps = TINTS.filter(
  (t) => !palette.includes(`--nb-c-accent-${t}:`),
)
check(
  'expands a base colour into the full ramp',
  missingSteps.length === 0,
  missingSteps.length ? `missing tints: ${missingSteps.join(', ')}` : '',
)
const missingA11y = TINTS.filter(
  (t) => !palette.includes(`--nb-c-accent-${t}-a11y:`),
)
check(
  'gives every step a readable foreground',
  missingA11y.length === 0,
  missingA11y.length ? `missing -a11y: ${missingA11y.join(', ')}` : '',
)
check(
  'a role points at the ramp rather than restating a colour',
  /--nb-c-primary:\s*var\(--nb-c-accent-500\)/.test(palette),
)
check(
  'the readable foreground travels with the role',
  /--nb-c-primary-a11y:\s*var\(--nb-c-accent-500-a11y\)/.test(palette),
)
check(
  'a literal role value is emitted as written',
  /--nb-c-layer-0:\s*#ffffff/.test(palette),
)
check(
  'the ramp is emitted once, not per colour mode',
  (palette.match(/--nb-c-accent-500:/g) || []).length === 1,
  'a ramp repeated per mode would double the theme for no reason',
)

if (failures.length) {
  console.error('verify-theme-export: FAILED')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log(
  'verify-theme-export: OK, exported themes compile against the public entry point, scope to their own id, keep both halves, and coexist',
)
