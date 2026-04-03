/**
 * Build-time design token extractor.
 *
 * Compiles the SCSS theme mixin with sass-embedded, parses every --nb-* CSS
 * custom property, resolves var() references to real values, then writes a
 * structured W3C Design Token (DTCG) JSON to docs/public/tokens.json.
 *
 * Run automatically via: pnpm docs:build
 * Output is a build artifact — not committed to the repo.
 * Tokens Studio (Figma) can read it from: https://docs.nubisco.io/tokens.json
 */

import * as sass from 'sass-embedded'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_DIR = resolve(ROOT, 'docs/public')
const OUT_FILE = resolve(OUT_DIR, 'tokens.json')

// ─── 1. Compile SCSS → CSS ──────────────────────────────────────────────────

const { css } = sass.compileString(`@use 'theme'; @include theme.base();`, {
  loadPaths: [resolve(ROOT, 'src/styles')],
  style: 'compressed',
})

// ─── 2. Parse CSS custom properties ────────────────────────────────────────

const raw = {}
for (const [, name, value] of css.matchAll(/--nb-([\w-]+):([^;}]+)/g)) {
  raw[name] = value.trim()
}

// ─── 3. Resolve var() references ───────────────────────────────────────────

function resolve$(value, depth = 0) {
  if (depth > 5 || !value.startsWith('var(--nb-')) return value
  const ref = value.match(/^var\(--nb-([\w-]+)\)$/)
  if (!ref) return value
  const target = raw[ref[1]]
  return target ? resolve$(target, depth + 1) : value
}

// ─── 4. Determine palette color names ──────────────────────────────────────

const paletteNames = new Set()
for (const name of Object.keys(raw)) {
  const m = name.match(/^c-([\w-]+)-\d+(?:-a11y)?$/)
  if (m) paletteNames.add(m[1])
}

// ─── 5. Build structured token tree ────────────────────────────────────────

function token(value, type, extra = {}) {
  return { $value: value, $type: type, ...extra }
}

const out = {
  $metadata: {
    generated: new Date().toISOString(),
    source: 'src/styles/_theme.scss',
    tokenSetOrder: [
      'color',
      'typography',
      'spacing',
      'animation',
      'zIndex',
      'grid',
    ],
  },
  color: { palette: {}, semantic: {} },
  typography: {
    fontSize: {},
    fontWeight: {},
    fontFamily: {},
    lineHeight: {},
    letterSpacing: {},
    typeSet: {},
  },
  spacing: {},
  animation: {},
  zIndex: {},
  grid: {},
}

for (const [name, rawValue] of Object.entries(raw)) {
  const resolved = resolve$(rawValue)

  // ── Colors ──────────────────────────────────────────────────────────────
  if (name.startsWith('c-')) {
    const rest = name.slice(2)
    const isA11y = rest.endsWith('-a11y')
    const base = isA11y ? rest.slice(0, -5) : rest
    const shadeMatch = base.match(/^([\w-]+)-(\d+)$/)

    if (shadeMatch) {
      const [, colorName, shade] = shadeMatch
      if (!out.color.palette[colorName]) out.color.palette[colorName] = {}
      const key = isA11y ? `${shade}-a11y` : shade
      out.color.palette[colorName][key] = token(resolved, 'color')
    } else if (!isA11y) {
      // semantic aliases — store raw ref + resolved value so docs can use either
      out.color.semantic[rest] = token(resolved, 'color', { $rawRef: rawValue })
    }
    continue
  }

  // ── Typography ───────────────────────────────────────────────────────────
  if (name.startsWith('font-size-')) {
    out.typography.fontSize[name.slice(10)] = token(rawValue, 'dimension')
    continue
  }
  if (name.startsWith('font-weight-')) {
    out.typography.fontWeight[name.slice(12)] = token(rawValue, 'fontWeight')
    continue
  }
  if (name.startsWith('font-family-')) {
    out.typography.fontFamily[name.slice(12)] = token(rawValue, 'fontFamily')
    continue
  }
  if (name.startsWith('line-height-')) {
    out.typography.lineHeight[name.slice(12)] = token(rawValue, 'number')
    continue
  }
  if (name.startsWith('letter-spacing-')) {
    out.typography.letterSpacing[name.slice(15)] = token(rawValue, 'dimension')
    continue
  }
  if (name.startsWith('type-')) {
    // type-heading-01-size → setName=heading-01, prop=size
    const rest = name.slice(5)
    const lastDash = rest.lastIndexOf('-')
    const setName = rest.slice(0, lastDash)
    const prop = rest.slice(lastDash + 1)
    if (!out.typography.typeSet[setName]) out.typography.typeSet[setName] = {}
    out.typography.typeSet[setName][prop] = resolve$(rawValue)
    continue
  }

  // ── Spacing ──────────────────────────────────────────────────────────────
  if (name === 'base-unit') {
    out.spacing['base-unit'] = token(rawValue, 'dimension')
    continue
  }
  if (name.startsWith('spacing-')) {
    out.spacing[name.slice(8)] = token(rawValue, 'dimension')
    continue
  }

  // ── Animation ────────────────────────────────────────────────────────────
  if (name.startsWith('animation-')) {
    out.animation[name.slice(10)] = token(rawValue, 'duration')
    continue
  }

  // ── Z-Index ──────────────────────────────────────────────────────────────
  if (name.startsWith('zindex-modal-')) {
    if (!out.zIndex.modal) out.zIndex.modal = {}
    out.zIndex.modal[name.slice(13)] = token(rawValue, 'number')
    continue
  }
  if (name.startsWith('zindex-')) {
    out.zIndex[name.slice(7)] = token(rawValue, 'number')
    continue
  }

  // ── Grid ─────────────────────────────────────────────────────────────────
  if (name.startsWith('grid-')) {
    out.grid[name.slice(5)] = token(rawValue, 'dimension')
    continue
  }
}

// ─── 6. Write output ────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(out, null, 2))

const count = Object.keys(raw).length
console.log(`✓ ${count} tokens → docs/public/tokens.json`)
