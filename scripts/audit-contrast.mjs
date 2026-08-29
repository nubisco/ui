/**
 * Layer contrast audit.
 *
 * Compiles the SCSS theme, resolves every --nb-* custom property to a literal
 * colour, then measures the layer system: surface-to-surface separation,
 * border legibility against both surfaces it divides, and text on each layer.
 *
 * Carbon's real published token values (parsed from @carbon/themes) are the
 * reference. Run: node scripts/audit-contrast.mjs [--json]
 */

import * as sass from 'sass-embedded'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── colour maths ───────────────────────────────────────────────────────────

function parseColor(v) {
  if (!v) return null
  v = String(v).trim()
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (m) {
    let h = m[1]
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (m) return [+m[1], +m[2], +m[3]]
  return null
}

const srgb = (c) => {
  c /= 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
const lum = (rgb) =>
  0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2])
function ratio(a, b) {
  const A = parseColor(a),
    B = parseColor(b)
  if (!A || !B) return null
  const l1 = lum(A),
    l2 = lum(B)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
// CIE L* (perceptual lightness, 0-100) — separation of near-identical greys
// reads better in ΔL* than in a WCAG ratio that hugs 1.0.
function lstar(v) {
  const y = lum(parseColor(v))
  return y <= 216 / 24389 ? y * (24389 / 27) : Math.cbrt(y) * 116 - 16
}
const dL = (a, b) => Math.abs(lstar(a) - lstar(b))
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100)

// ─── compile our theme ──────────────────────────────────────────────────────

function compile(mixins) {
  const { css } = sass.compileString(
    `@use 'theme';` + mixins.map((m) => `@include theme.${m}();`).join(''),
    { loadPaths: [resolve(ROOT, 'src/styles')], style: 'compressed' },
  )
  return css
}

function propsFrom(css, selector) {
  // grab the block(s) whose selector matches, last-wins like the cascade
  const out = {}
  const re = new RegExp(`(^|})\\s*([^{}]*)\\{([^{}]*)\\}`, 'g')
  let m
  while ((m = re.exec(css))) {
    const sel = m[2].trim()
    if (!selector.test(sel)) continue
    for (const [, name, value] of m[3].matchAll(
      /(--nb-[\w-]+)\s*:\s*([^;}]+)/g,
    )) {
      out[name] = value.trim()
    }
  }
  return out
}

function resolver(scopes) {
  // scopes: array of prop maps, later ones override earlier
  const merged = Object.assign({}, ...scopes)
  return function deref(name, depth = 0) {
    let v = merged[name]
    if (v == null) return null
    while (depth < 12) {
      const m = String(v).match(/^var\(\s*(--nb-[\w-]+)\s*(?:,\s*([^)]+))?\)$/)
      if (!m) break
      const next = merged[m[1]]
      v = next != null ? next : m[2]
      depth++
    }
    return v
  }
}

const cssAll = compile(['base', 'light', 'dark'])
const rootProps = propsFrom(cssAll, /^:root$/)
const darkProps = propsFrom(cssAll, /(^|\s)\.dark$/)

const light = resolver([rootProps])
const dark = resolver([rootProps, darkProps])

// ─── Carbon reference (real published values) ───────────────────────────────

const carbonPath = resolve(ROOT, 'scripts/fixtures/carbon-tokens.json')
const carbon = existsSync(carbonPath)
  ? JSON.parse(readFileSync(carbonPath, 'utf8'))
  : null

// ─── measurements ───────────────────────────────────────────────────────────

const LAYERS = [0, 1, 2, 3]

function measureOurs(get, label) {
  const surface = LAYERS.map((i) => get(`--nb-c-layer-${i}`))
  const border = LAYERS.map((i) => get(`--nb-c-layer-border-${i}`))
  const hover = LAYERS.map((i) => get(`--nb-c-layer-hover-${i}`))
  const text = get('--nb-c-text')
  const textMuted = get('--nb-c-text-muted')
  const field = get('--nb-c-field-bg')
  const rows = []
  for (let i = 0; i < LAYERS.length - 1; i++) {
    rows.push({
      pair: `layer-${i} → layer-${i + 1}`,
      a: surface[i],
      b: surface[i + 1],
      ratio: r2(ratio(surface[i], surface[i + 1])),
      deltaL: r2(dL(surface[i], surface[i + 1])),
    })
  }
  const borders = LAYERS.map((i) => ({
    layer: i,
    color: border[i],
    vsOwn: r2(ratio(border[i], surface[i])),
    vsParent: i > 0 ? r2(ratio(border[i], surface[i - 1])) : null,
  }))
  const hovers = LAYERS.map((i) => ({
    layer: i,
    color: hover[i],
    vsRest: r2(ratio(hover[i], surface[i])),
    deltaL: r2(dL(hover[i], surface[i])),
  }))
  const texts = LAYERS.map((i) => ({
    layer: i,
    primary: r2(ratio(text, surface[i])),
    muted: r2(ratio(textMuted, surface[i])),
  }))
  return {
    label,
    surface,
    rows,
    borders,
    hovers,
    texts,
    field: { color: field, vsLayer1: r2(ratio(field, surface[1])) },
  }
}

function measureCarbon(theme) {
  if (!carbon) return null
  const t = carbon[theme]
  const surface = [t['background'], t['layer-01'], t['layer-02'], t['layer-03']]
  const border = [
    t['border-subtle-00'],
    t['border-subtle-01'],
    t['border-subtle-02'],
    t['border-subtle-03'],
  ]
  const hover = [
    t['background-hover'],
    t['layer-hover-01'],
    t['layer-hover-02'],
    t['layer-hover-03'],
  ]
  const rows = []
  for (let i = 0; i < 3; i++) {
    rows.push({
      pair: `layer-${i} → layer-${i + 1}`,
      a: surface[i],
      b: surface[i + 1],
      ratio: r2(ratio(surface[i], surface[i + 1])),
      deltaL: r2(dL(surface[i], surface[i + 1])),
    })
  }
  const borders = surface.map((s, i) => ({
    layer: i,
    color: border[i],
    vsOwn: r2(ratio(border[i], surface[i])),
    vsParent: i > 0 ? r2(ratio(border[i], surface[i - 1])) : null,
  }))
  const hovers = surface.map((s, i) => ({
    layer: i,
    color: hover[i],
    vsRest: hover[i] && !/rgba/.test(hover[i]) ? r2(ratio(hover[i], s)) : null,
    deltaL: hover[i] && !/rgba/.test(hover[i]) ? r2(dL(hover[i], s)) : null,
  }))
  const texts = surface.map((s, i) => ({
    layer: i,
    primary: r2(ratio(t['text-primary'], s)),
    muted: r2(ratio(t['text-secondary'], s)),
  }))
  return {
    label: `carbon:${theme}`,
    surface,
    rows,
    borders,
    hovers,
    texts,
    field: {
      color: t['field-01'],
      vsLayer1: r2(ratio(t['field-01'], surface[1])),
    },
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  ours: {
    light: measureOurs(light, 'ours:light'),
    dark: measureOurs(dark, 'ours:dark'),
  },
  carbon: carbon
    ? {
        white: measureCarbon('white'),
        g10: measureCarbon('g10'),
        g90: measureCarbon('g90'),
        g100: measureCarbon('g100'),
      }
    : null,
}

if (process.argv.includes('--json')) {
  const out = resolve(ROOT, 'docs/public/contrast-audit.json')
  writeFileSync(out, JSON.stringify(report, null, 2))
  console.log('wrote', out)
}

function print(m) {
  if (!m) return
  console.log(`\n### ${m.label}`)
  console.log('  surfaces:', m.surface.join('  '))
  console.log('  surface separation (adjacent):')
  for (const r of m.rows)
    console.log(
      `    ${r.pair}  ${r.a} vs ${r.b}   ratio ${r.ratio}   dL* ${r.deltaL}`,
    )
  console.log('  borders (vs own surface / vs parent surface):')
  for (const b of m.borders)
    console.log(
      `    L${b.layer} ${b.color}   own ${b.vsOwn}   parent ${b.vsParent ?? '-'}`,
    )
  console.log('  hover (vs rest):')
  for (const h of m.hovers)
    console.log(
      `    L${h.layer} ${h.color}   ratio ${h.vsRest}   dL* ${h.deltaL}`,
    )
  console.log('  text (primary / secondary on each layer):')
  for (const t of m.texts)
    console.log(`    L${t.layer}   primary ${t.primary}   secondary ${t.muted}`)
  console.log(`  field-01 ${m.field.color}   vs layer-1 ${m.field.vsLayer1}`)
}

for (const k of ['light', 'dark']) print(report.ours[k])
if (report.carbon)
  for (const k of ['white', 'g10', 'g90', 'g100']) print(report.carbon[k])
