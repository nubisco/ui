/**
 * Emits flat token maps for the specimen renderer: ours (light/dark) straight
 * from the compiled SCSS, and Carbon's four themes from their real published
 * values. Same key set for every specimen so renders are comparable.
 *
 *   node scripts/emit-specimens.mjs [outDir]
 */
import * as sass from 'sass-embedded'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(process.argv[2] || resolve(ROOT, 'docs/public/specimens'))
mkdirSync(OUT, { recursive: true })

const { css } = sass.compileString(
  `@use 'theme'; @include theme.base(); @include theme.light(); @include theme.dark();`,
  { loadPaths: [resolve(ROOT, 'src/styles')], style: 'compressed' },
)

function propsFrom(selectorRe) {
  const out = {}
  const re = /(^|})\s*([^{}]*)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css))) {
    if (!selectorRe.test(m[2].trim())) continue
    for (const [, n, v] of m[3].matchAll(/(--nb-[\w-]+)\s*:\s*([^;}]+)/g))
      out[n] = v.trim()
  }
  return out
}
const root = propsFrom(/^:root$/)
const darkOnly = propsFrom(/(^|\s)\.dark$/)

function makeDeref(map) {
  return (name) => {
    let v = map[name]
    for (let i = 0; i < 12; i++) {
      const m = String(v).match(/^var\(\s*(--nb-[\w-]+)\s*(?:,\s*([^)]+))?\)$/)
      if (!m) break
      v = map[m[1]] != null ? map[m[1]] : m[2]
    }
    return v
  }
}
const KEYS = {
  'layer-0': '--nb-c-layer-0',
  'layer-1': '--nb-c-layer-1',
  'layer-2': '--nb-c-layer-2',
  'layer-3': '--nb-c-layer-3',
  'layer-border-0': '--nb-c-layer-border-0',
  'layer-border-1': '--nb-c-layer-border-1',
  'layer-border-2': '--nb-c-layer-border-2',
  'layer-border-3': '--nb-c-layer-border-3',
  'layer-hover-0': '--nb-c-layer-hover-0',
  'layer-hover-1': '--nb-c-layer-hover-1',
  'layer-hover-2': '--nb-c-layer-hover-2',
  'layer-hover-3': '--nb-c-layer-hover-3',
  text: '--nb-c-text',
  'text-muted': '--nb-c-text-muted',
  'field-bg': '--nb-c-field-bg',
  'field-border': '--nb-c-field-border',
}
function ours(map) {
  const d = makeDeref(map)
  return Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, d(v)]))
}
writeFileSync(
  resolve(OUT, 'ours-light.json'),
  JSON.stringify(ours(root), null, 2),
)
writeFileSync(
  resolve(OUT, 'ours-dark.json'),
  JSON.stringify(ours({ ...root, ...darkOnly }), null, 2),
)

// ── Carbon ──────────────────────────────────────────────────────────────────
const carbon = JSON.parse(
  readFileSync(resolve(ROOT, 'scripts/fixtures/carbon-tokens.json'), 'utf8'),
)
const hex = (v) => {
  const m = String(v).match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i,
  )
  return m ? { rgb: [+m[1], +m[2], +m[3]], a: m[4] == null ? 1 : +m[4] } : null
}
const parse = (v) => {
  const h = String(v).match(/^#([0-9a-f]{6})$/i)
  if (h) return [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16))
  return hex(v).rgb
}
const over = (fg, bg) => {
  const f = hex(fg),
    b = parse(bg)
  const c = f.rgb.map((v, i) => Math.round(v * f.a + b[i] * (1 - f.a)))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}
for (const theme of ['white', 'g10', 'g90', 'g100']) {
  const t = carbon[theme]
  const spec = {
    'layer-0': t.background,
    'layer-1': t['layer-01'],
    'layer-2': t['layer-02'],
    'layer-3': t['layer-03'],
    'layer-border-0': t['border-subtle-00'],
    'layer-border-1': t['border-subtle-01'],
    'layer-border-2': t['border-subtle-02'],
    'layer-border-3': t['border-subtle-03'],
    'layer-hover-0': over(t['background-hover'], t.background),
    'layer-hover-1': t['layer-hover-01'],
    'layer-hover-2': t['layer-hover-02'],
    'layer-hover-3': t['layer-hover-03'],
    text: t['text-primary'],
    'text-muted': t['text-secondary'],
    'field-bg': t['field-01'],
    'field-border': t['border-strong-01'],
  }
  writeFileSync(
    resolve(OUT, `carbon-${theme}.json`),
    JSON.stringify(spec, null, 2),
  )
}
console.log('specimens →', OUT)
