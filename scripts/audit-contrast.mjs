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

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROOT, dL, loadThemeResolvers, r2, ratio } from './lib/layerTokens.mjs'

const { light, dark } = loadThemeResolvers()

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
