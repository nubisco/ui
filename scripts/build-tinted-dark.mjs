/**
 * Tinted dark surfaces generator.
 *
 * Writes `src/styles/variables/_tinted-dark.scss`: the dark ramp (`$dark` in
 * `src/styles/variables/_layers.scss`) tinted toward each category's accent
 * hue, one map per category with the same shape as `$dark`, so `level()`,
 * `token()` and `plane-values()` read it unchanged.
 *
 * The tint holds WCAG relative luminance, not OKLCH lightness. Every value
 * keeps the luminance of the grey it replaces, so every contrast ratio the
 * grey ramp was measured at survives within 8-bit rounding, and where
 * rounding cannot hit the grey exactly it errs to the safe side: a surface,
 * border or hover never comes out lighter than its grey, and a text tier
 * never comes out darker.
 *
 * Everything is read from the SCSS source, never retyped here: the ramp and
 * the text tiers from `$dark`, the accents from `$categories`. Change either
 * and run `pnpm run generate:tinted-dark`. `tests/tintedDark.test.ts` fails if
 * the committed file is not what this script produces.
 *
 * Run: node scripts/build-tinted-dark.mjs [--check]
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LAYERS_FILE = resolve(ROOT, 'src/styles/variables/_layers.scss')
const CATEGORIES_FILE = resolve(ROOT, 'src/styles/variables/_categories.scss')
export const OUT_FILE = resolve(ROOT, 'src/styles/variables/_tinted-dark.scss')

// ─── the strength ───────────────────────────────────────────────────────────

/** OKLCH chroma for surfaces, borders and hovers ("subtle"). */
export const SURFACE_CHROMA = 0.01
/** OKLCH chroma for the text tiers: a trace, so text stays neutral. */
export const TEXT_CHROMA = 0.004
/**
 * Chroma scales a little with the level, so deeper planes carry slightly
 * more colour: 0.0085 on layer 0 up to 0.0115 on layer 3.
 */
export const LEVEL_SCALE = [0.85, 0.95, 1.05, 1.15]

/**
 * The scalar keys of `$dark` and how each is tinted. `dir` is the side
 * rounding may err to: -1 never lighter than the grey, +1 never darker.
 * The inverse pair swaps roles: the light chip is tinted like text, the dark
 * text on it like a surface.
 */
const SCALARS = {
  text: { chroma: TEXT_CHROMA, dir: 1 },
  'text-muted': { chroma: TEXT_CHROMA, dir: 1 },
  'text-subtle': { chroma: TEXT_CHROMA, dir: 1 },
  'bg-inverse': { chroma: TEXT_CHROMA, dir: 1 },
  'text-inverse': { chroma: SURFACE_CHROMA, dir: -1 },
  'border-inverse': { chroma: SURFACE_CHROMA, dir: -1 },
  'classic-field-bg': { chroma: SURFACE_CHROMA, dir: -1 },
  'classic-field-border': { chroma: SURFACE_CHROMA, dir: -1 },
}

// ─── reading the source ─────────────────────────────────────────────────────

const stripComments = (s) => s.replace(/\/\/[^\n]*/g, '')

/** The text of a `$name: ( ... );` map, comments removed. */
function mapBody(source, name) {
  const start = source.indexOf(`$${name}: (`)
  if (start < 0) throw new Error(`$${name} not found`)
  let depth = 0
  for (let i = source.indexOf('(', start); i < source.length; i++) {
    if (source[i] === '(') depth++
    else if (source[i] === ')' && --depth === 0)
      return stripComments(source.slice(source.indexOf('(', start) + 1, i))
  }
  throw new Error(`$${name} is not closed`)
}

/** `$dark` as `{ levels: { role: [hex x4] }, scalars: { key: hex } }`, in source order. */
export function readDarkRamp() {
  const body = mapBody(readFileSync(LAYERS_FILE, 'utf8'), 'dark')
  const levels = {}
  const scalars = {}
  const re = /([\w-]+)\s*:\s*(\(([^()]*)\)|#[0-9a-f]{6})/gi
  let m
  while ((m = re.exec(body))) {
    if (m[3] != null) {
      const values = [...m[3].matchAll(/(\d)\s*:\s*(#[0-9a-f]{6})/gi)]
      levels[m[1]] = values.map((v) => v[2].toLowerCase())
      if (levels[m[1]].length !== 4)
        throw new Error(`$dark ${m[1]} does not have four levels`)
    } else scalars[m[1]] = m[2].toLowerCase()
  }
  for (const key of Object.keys(scalars))
    if (!SCALARS[key])
      throw new Error(`$dark key ${key} has no tint rule in this script`)
  return { levels, scalars }
}

/** `$categories` as `{ name: [light, dark] }`, in source order. */
export function readCategories() {
  const body = mapBody(readFileSync(CATEGORIES_FILE, 'utf8'), 'categories')
  const out = {}
  for (const m of body.matchAll(
    /([\w-]+)\s*:\s*\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*,?\s*\)/gi,
  ))
    out[m[1]] = [m[2].toLowerCase(), m[3].toLowerCase()]
  if (!Object.keys(out).length) throw new Error('no categories parsed')
  return out
}

// ─── colour maths (OKLab, sRGB, WCAG relative luminance) ────────────────────

const hex2rgb = (h) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const toLin = (c) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
const fromLin = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055

function rgb2oklab([r, g, b]) {
  r = toLin(r)
  g = toLin(g)
  b = toLin(b)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklab2linrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** OKLCH of a hex colour. */
export function oklch(hex) {
  const [L, a, b] = rgb2oklab(hex2rgb(hex))
  return {
    L,
    C: Math.hypot(a, b),
    H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  }
}

const inGamut = (rgb) => rgb.every((c) => c >= -1e-6 && c <= 1 + 1e-6)

/** OKLCH to hex, reducing chroma by bisection until the colour is in sRGB. */
function lch2hex(L, C, H) {
  const lab = (c) => [
    L,
    c * Math.cos((H * Math.PI) / 180),
    c * Math.sin((H * Math.PI) / 180),
  ]
  let rgb = oklab2linrgb(lab(C))
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = C
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklab2linrgb(lab(mid)))) lo = mid
      else hi = mid
    }
    rgb = oklab2linrgb(lab(lo))
  }
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(Math.min(1, Math.max(0, fromLin(c))) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

/** WCAG relative luminance of a hex colour. */
const lum = (hex) => {
  const [r, g, b] = hex2rgb(hex).map(toLin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Relative luminance of an OKLCH colour before 8-bit rounding. */
function lumRaw(L, C, H) {
  const rgb = oklab2linrgb([
    L,
    C * Math.cos((H * Math.PI) / 180),
    C * Math.sin((H * Math.PI) / 180),
  ]).map((c) => Math.min(1, Math.max(0, c)))
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

/**
 * Tints one grey toward a hue, holding its WCAG relative luminance.
 *
 * Bisects OKLCH L until the unrounded colour has the grey's luminance, then
 * tries the 8-bit values either side and keeps the closest one on the
 * permitted side (`dir` -1: not lighter than the grey, +1: not darker).
 */
export function tint(hex, hue, chroma, dir = -1) {
  if (!chroma) return hex
  const L0 = oklch(hex).L
  const target = lum(hex)
  let lo = Math.max(0, L0 - 0.08)
  let hi = Math.min(1, L0 + 0.08)
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (lumRaw(mid, chroma, hue) < target) lo = mid
    else hi = mid
  }
  let best = null
  let bestD = Infinity
  for (let d = -0.004; d <= 0.004; d += 0.0005) {
    const c = lch2hex((lo + hi) / 2 + d, chroma, hue)
    const diff = lum(c) - target
    if (diff * dir < -1e-9) continue
    const e = Math.abs(diff)
    if (e < bestD) {
      bestD = e
      best = c
    }
  }
  if (!best)
    throw new Error(`no ${dir < 0 ? 'darker' : 'lighter'} tint of ${hex}`)
  return best
}

// ─── building the maps ──────────────────────────────────────────────────────

/** The tinted ramp for one hue, same shape as `readDarkRamp()`. */
export function tintRamp(ramp, hue) {
  const levels = {}
  for (const [role, values] of Object.entries(ramp.levels))
    levels[role] = values.map((v, lvl) =>
      tint(v, hue, SURFACE_CHROMA * LEVEL_SCALE[lvl], -1),
    )
  const scalars = {}
  for (const [key, v] of Object.entries(ramp.scalars))
    scalars[key] = tint(v, hue, SCALARS[key].chroma, SCALARS[key].dir)
  return { levels, scalars }
}

/** Every category's tinted ramp, keyed by category, in source order. */
export function tintedRamps() {
  const ramp = readDarkRamp()
  const out = {}
  for (const [name, [, dark]] of Object.entries(readCategories()))
    out[name] = {
      hue: oklch(dark).H,
      accent: dark,
      ...tintRamp(ramp, oklch(dark).H),
    }
  return out
}

/** The generated SCSS, formatted the way the repository's Prettier would. */
export async function renderTintedDark() {
  const ramps = tintedRamps()
  const lines = [
    '// GENERATED FILE. Do not edit by hand.',
    '//',
    '// Written by `scripts/build-tinted-dark.mjs` from `$dark` in `_layers.scss`',
    '// and `$categories` in `_categories.scss`. After changing either, run',
    '// `pnpm run generate:tinted-dark` and commit the result.',
    '// `tests/tintedDark.test.ts` fails while this file is out of date.',
    '',
    '/// The dark ramp, tinted toward each category.',
    '///',
    '/// One map per category, each the same shape as `$dark`, so `level()`,',
    '/// `token()` and `plane-values()` read it unchanged. Every value holds the',
    '/// WCAG relative luminance of the grey it replaces, at OKLCH chroma 0.01',
    "/// (scaled 0.85 to 1.15 from layer 0 to 3) on the hue of the category's",
    '/// dark accent, and 0.004 on the text tiers. Where 8-bit rounding cannot',
    '/// hold the luminance exactly, a surface, border or hover rounds darker',
    '/// and a text tier rounds lighter, so no contrast pair gets worse.',
    '///',
    "/// Applied by `app-theme()` under `[data-nb-dark-surfaces='tinted']`.",
    '///',
    '/// ```text',
    ...Object.entries(ramps).map(
      ([name, r]) =>
        `/// ${name.padEnd(10)} accent ${r.accent}   OKLCH hue ${r.hue.toFixed(2)}`,
    ),
    '/// ```',
    '///',
    '/// @type Map',
    '/// @access public',
    '/// @group @nubisco/layers',
    '$tinted-dark: (',
  ]
  for (const [name, r] of Object.entries(ramps)) {
    lines.push(`  ${name}: (`)
    for (const [role, values] of Object.entries(r.levels))
      lines.push(
        `    ${role}: (${values.map((v, i) => `${i}: ${v}`).join(', ')}),`,
      )
    for (const [key, v] of Object.entries(r.scalars))
      lines.push(`    ${key}: ${v},`)
    lines.push('  ),')
  }
  lines.push(');', '')
  const options = (await prettier.resolveConfig(OUT_FILE)) ?? {}
  return prettier.format(lines.join('\n'), { ...options, filepath: OUT_FILE })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = await renderTintedDark()
  if (process.argv.includes('--check')) {
    const current = readFileSync(OUT_FILE, 'utf8')
    if (current !== next) {
      console.error(
        `${OUT_FILE} is out of date. Run pnpm run generate:tinted-dark.`,
      )
      process.exit(1)
    }
    console.log('tinted dark ramps are up to date')
  } else {
    writeFileSync(OUT_FILE, next)
    console.log('wrote', OUT_FILE)
  }
}
