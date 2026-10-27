/**
 * Penpot token exporter.
 *
 * Compiles the theme mixins one at a time, splits the result into a light and
 * a dark value for every --nb-* property, and writes a Tokens Studio style
 * multi-set file that Penpot imports directly (Tokens > Import):
 *
 *   core            raw values: palette, layer ramps, spacing, radius, type
 *   semantic/light  the jobs, as references into core, for the light theme
 *   semantic/dark   the same names, for the dark theme
 *   component       theme-independent component geometry (field, shell, menu)
 *   appearance/square   corner radii and field geometry, square (the default)
 *   appearance/rounded  the same names for data-nb-appearance="rounded"
 *
 * plus two theme groups that combine independently, as they do in the code:
 * Mode (Light, Dark) switches the semantic set and Appearance (Square,
 * Rounded) switches the appearance set.
 *
 * Semantic tokens reference core tokens wherever the source does, and also
 * where the source writes a literal that equals a core value (Sass resolves
 * `colors.get-color()` to a hex, so the dark theme arrives as literals). Two
 * things cannot be references and are resolved per theme instead, with the
 * source formula in $description:
 *
 *   - color-mix(): Penpot tokens have no mix function.
 *   - the per-variant ink colours from logic/_ink.scss, which only exist as a
 *     mix evaluated where they are painted.
 *
 * The primitives also write some values as literals in their scoped styles
 * (a 500 weight, button heights, badge tints). Those are listed in LOCAL and
 * LOCAL_COLORS below and emitted with the file they came from, so the Penpot
 * components can bind every value to a token.
 *
 * Properties with no Penpot equivalent (z-index, durations, vw, percentages,
 * border shorthands, runtime context radii) are left out and listed in
 * $metadata.skipped, so nothing disappears silently.
 *
 * Writes design/penpot/tokens.json, committed next to the .penpot file it
 * feeds. It is not part of the docs build. Regenerate after token changes:
 *   pnpm penpot:tokens
 */

import * as sass from 'sass-embedded'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const LOAD_PATHS = [resolve(ROOT, 'src/styles')]
const REM = 16

const MODES = ['light', 'dark']
const APPEARANCES = ['square', 'rounded']

// ─── 1. Compile ─────────────────────────────────────────────────────────────

function compile(source) {
  return sass.compileString(source, {
    loadPaths: LOAD_PATHS,
    style: 'compressed',
  }).css
}

// Top-level declarations of the blocks whose selector is exactly `selector`.
// Nested scopes such as `:root .nb-modal` are runtime overrides, not themes.
function declarations(css, selector) {
  const out = {}
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (sel.trim() !== selector) continue
    for (const [, name, value] of body.matchAll(/--nb-([\w-]+):([^;]+)/g)) {
      out[name] = value.replace(/\s+/g, ' ').trim()
    }
  }
  return out
}

function readTheme() {
  const base = declarations(
    compile(`@use 'theme'; @include theme.base();`),
    ':root',
  )
  const light = declarations(
    compile(`@use 'theme'; @include theme.light();`),
    ':root',
  )
  const dark = declarations(
    compile(`@use 'theme'; @include theme.dark();`),
    '.dark',
  )
  const lightRaw = { ...base, ...light }
  return { light: lightRaw, dark: { ...lightRaw, ...dark } }
}

// The two blocks of _appearance.scss, keyed by appearance.
function readAppearance() {
  const css = compile(`@use 'appearance'; @include appearance.appearance;`)
  return Object.fromEntries(
    APPEARANCES.map((a) => [a, declarations(css, `[data-nb-appearance=${a}]`)]),
  )
}

// The layer ramps are literal hex in variables/_layers.scss rather than palette
// steps, so they get core tokens of their own for the semantic layer to point at.
function readLayers() {
  const css = compile(`
    @use 'sass:map';
    @use 'sass:meta';
    @use 'variables/layers';
    :root {
      @each $mode, $ramp in (light: layers.$light, dark: layers.$dark) {
        @each $role, $value in $ramp {
          @if meta.type-of($value) == 'map' {
            @each $level, $color in $value {
              --nb-layer-#{$mode}-#{$role}-#{$level}: #{$color};
            }
          } @else {
            --nb-layer-#{$mode}-#{$role}: #{$value};
          }
        }
      }
    }`)
  return declarations(css, ':root')
}

// ─── 2. Colour maths ────────────────────────────────────────────────────────

const NAMED = {
  transparent: [0, 0, 0, 0],
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
}

function parseColor(value) {
  const v = value.trim().toLowerCase()
  if (NAMED[v]) return NAMED[v]
  let m = v.match(/^#([0-9a-f]{3,8})$/)
  if (m) {
    let h = m[1]
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    const n = (i) => parseInt(h.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
  }
  m = v.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const parts = m[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(parseFloat)
    return [parts[0], parts[1], parts[2], parts[3] ?? 1]
  }
  return null
}

function toHex([r, g, b, a]) {
  const h = (n) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`
}

// color-mix(in srgb, ...) with CSS's percentage normalisation and premultiplied
// alpha, so a mix with `transparent` keeps the colour and scales its alpha.
function mix([c1, p1], [c2, p2]) {
  if (p1 == null && p2 == null) [p1, p2] = [0.5, 0.5]
  else if (p1 == null) p1 = 1 - p2
  else if (p2 == null) p2 = 1 - p1
  const sum = p1 + p2
  const scale = sum < 1 ? sum : 1
  ;[p1, p2] = [p1 / sum, p2 / sum]
  const a = c1[3] * p1 + c2[3] * p2
  const ch = (i) =>
    a === 0 ? 0 : (c1[i] * c1[3] * p1 + c2[i] * c2[3] * p2) / a
  return [ch(0), ch(1), ch(2), a * scale]
}

// Split on commas that are not inside parentheses.
function splitArgs(s) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

// `var(--nb-x)` or `var(--nb-x, fallback)` → ['x', 'fallback' | undefined]
function parseVar(value) {
  const m = value.match(/^var\(\s*--nb-([\w-]+)\s*(?:,(.*))?\)$/)
  return m ? [m[1], m[2]?.trim()] : null
}

function parseMix(value) {
  const m = value.match(/^color-mix\((.*)\)$/)
  if (!m) return null
  const [space, ...stops] = splitArgs(m[1])
  if (space !== 'in srgb' || stops.length !== 2) return null
  return stops.map((stop) => {
    const pm = stop.match(/^(.*?)\s+([\d.]+)%$/)
    return pm ? [pm[1].trim(), parseFloat(pm[2]) / 100] : [stop, null]
  })
}

// `color-mix( in srgb, rgb(84.83, ...) 16%, b )` → `color-mix(in srgb, #5582dd
// 16%, b)` for descriptions: palette tints compile to fractional rgb().
function tidy(value) {
  return value
    .replace(/rgba?\([^()]+\)/g, (c) => toHex(parseColor(c)))
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
}

// ─── 3. Resolution ──────────────────────────────────────────────────────────

function makeResolver(raw) {
  const cache = new Map()
  function color(value, depth = 0) {
    if (depth > 20) return null
    const ref = parseVar(value)
    if (ref) {
      const target = raw[ref[0]]
      if (target !== undefined) return color(target, depth + 1)
      return ref[1] ? color(ref[1], depth + 1) : null
    }
    const stops = parseMix(value)
    if (stops) {
      const resolved = stops.map(([c, p]) => [color(c, depth + 1), p])
      return resolved.every(([c]) => c) ? mix(...resolved) : null
    }
    return parseColor(value)
  }
  return {
    color(name) {
      if (!cache.has(name)) cache.set(name, raw[name] ? color(raw[name]) : null)
      return cache.get(name)
    },
    value: color,
  }
}

// ─── 4. Classification ──────────────────────────────────────────────────────

const RADIUS_SCALE = /^radius-(none|xs|sm|md|lg|pill)$/
const SKIP = [
  [/^zindex-/, 'stacking order has no meaning in a design file'],
  [/^animation-/, 'Penpot tokens have no duration type'],
  [
    /^letter-spacing-/,
    'em values; resolved to px inside each type set instead',
  ],
  [
    /-ink-lift$|^c-ink-toward$/,
    'inputs to the ink colours, emitted as color.*-ink',
  ],
  [
    /^radius-(circle|context|inset)$/,
    'a percentage or a runtime context value',
  ],
]

function skipReason(name) {
  return SKIP.find(([re]) => re.test(name))?.[1]
}

function tokenName(name, palette) {
  if (name === 'base-unit') return 'base-unit'
  if (name === 'c-white' || name === 'c-black') return `color.${name.slice(2)}`
  const shade = name.match(/^c-([\w-]+?)-(\d{3})(-a11y)?$/)
  if (shade && palette.has(shade[1]))
    return `color.${shade[1]}.${shade[2]}${shade[3] ?? ''}`
  if (name.startsWith('c-')) return `color.${name.slice(2)}`
  for (const family of [
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
  ]) {
    if (name.startsWith(`${family}-`))
      return `${family.replace('-', '.')}.${name.slice(family.length + 1)}`
  }
  const dash = name.indexOf('-')
  if (name.startsWith('bottom-panel-'))
    return `bottom-panel.${name.slice('bottom-panel-'.length)}`
  return `${name.slice(0, dash)}.${name.slice(dash + 1)}`
}

// Penpot type for a non-colour property, from what the name says it sizes.
function dimensionType(name) {
  if (/font-size/.test(name)) return 'fontSizes'
  if (/line-height/.test(name)) return 'number'
  if (/opacity/.test(name)) return 'opacity'
  if (/emphasis/.test(name)) return 'number'
  if (/radius/.test(name)) return 'borderRadius'
  if (/border-width/.test(name)) return 'borderWidth'
  if (/(padding|gap|inset|^spacing-)/.test(name)) return 'spacing'
  if (/(height|width|-h$|^size-)/.test(name)) return 'sizing'
  if (/columns/.test(name)) return 'number'
  return 'dimension'
}

// ─── 4b. Component-local values ─────────────────────────────────────────────

// Values the primitives write as literals in their scoped styles rather than
// as theme properties. The library components in Penpot bind to these so no
// shape carries a raw number; each names the rule it was read from. Keep in
// step with the component when its style changes.
const BU = 'var(--nb-base-unit)'
const LOCAL = [
  ['font.weight.medium', '500', 'Button.vue, Badge.vue, Field.vue, Label.vue'],
  ['button.gap', '6px', 'Button.vue .nb-button'],
  ...Object.entries({
    xxs: [2, 1],
    xs: [3, 1.5],
    sm: [4, 1.5],
    md: [5, 2],
    lg: [6, 2.5],
    xl: [8, 3],
    xxl: [16, 4],
  }).flatMap(([size, [h, px]]) => [
    [`button.height-${size}`, `calc(${BU} * ${h})`, `Button.vue --${size}`],
    [`button.padding-x-${size}`, `calc(${BU} * ${px})`, `Button.vue --${size}`],
  ]),
  ['button.padding-x-ghost', `calc(${BU} * 1.5)`, 'Button.vue --ghost'],
  ['button.border-width', '1px', 'Button.vue --outlined border'],
  ['button.focus-width', '1px', 'Button.vue :focus-visible outline'],
  ['button.focus-inset', '2px', 'Button.vue :focus-visible outline-offset'],
  ['button.link-focus-width', '2px', 'Button.vue --link :focus-visible'],
  ['control.focus-ring-width', '2px', 'Checkbox.vue, Radio.vue box-shadow'],
  ['control.label-gap', '10px', 'Checkbox.vue, Radio.vue'],
  ['control.border-width', '1px', 'Checkbox.vue __box, Radio.vue __circle'],
  ['checkbox.size', '16px', 'Checkbox.vue __box'],
  ['radio.size', '18px', 'Radio.vue __circle'],
  ['radio.dot', '9px', 'Radio.vue __dot'],
  ['radio.group-gap', '6px', 'Radio.vue __group'],
  ['switch.width', `calc(${BU} * 4)`, 'Switch.vue -wrapper'],
  ['switch.height', `calc(${BU} * 2)`, 'Switch.vue -wrapper'],
  ['switch.knob', `calc(${BU} * 1)`, 'Switch.vue .slider:before'],
  ['switch.knob-inset', `calc(${BU} / 2)`, 'Switch.vue .slider:before'],
  ['badge.padding-x-sm', '7px', 'Badge.vue --sm'],
  ['badge.padding-y-sm', '2px', 'Badge.vue --sm'],
  ['badge.padding-x-md', '9px', 'Badge.vue --md'],
  ['badge.padding-y-md', '3px', 'Badge.vue --md'],
  ['badge.dot', '6px', 'Badge.vue __dot'],
  ['badge.placeholder-padding-x-sm', '6px', 'Badge.vue --placeholder--sm'],
  ['badge.placeholder-padding-y-sm', '1px', 'Badge.vue --placeholder--sm'],
  ['badge.placeholder-padding-x-md', '8px', 'Badge.vue --placeholder--md'],
  ['badge.placeholder-padding-y-md', '2px', 'Badge.vue --placeholder--md'],
  ['badge.border-width', '1px', 'Badge.vue --placeholder border'],
  // The bottom rule square draws on its own. Rounded draws that edge as part of
  // its full border instead, so the rule's height falls to 0 there.
  [
    'field.rule',
    'calc(1px - var(--nb-field-border-width))',
    'TextInput.vue __field-wrapper border-bottom, less the rounded side border',
  ],
  [
    'field.rule-status',
    'calc((1px + 1px * var(--nb-field-status-emphasis)) * (1 - var(--nb-field-border-width)))',
    'TextInput.vue --error/--warning border plus inset rule, less the rounded side border',
  ],
  ['field.focus-width', '2px', 'TextInput.vue --focused outline'],
  ['avatar.size-xs', '20px', 'Avatar.vue --xs'],
  ['avatar.size-sm', '24px', 'Avatar.vue --sm'],
  ['avatar.size-md', '28px', 'Avatar.vue --md'],
  ['avatar.size-lg', '40px', 'Avatar.vue --lg'],
  ['avatar.font-size-md', '0.64rem', 'Avatar.vue --md'],
]

// Penpot type for a LOCAL entry. Box sizes must be `sizing` to bind width and
// height, and focus widths are stroke widths.
function localType(path) {
  if (path.startsWith('font.weight.')) return 'fontWeights'
  if (/(focus|ring|border)-width$/.test(path)) return 'borderWidth'
  if (/^field\.rule/.test(path)) return 'sizing'
  if (
    /(size|dot|knob|height|width)(-\w+)?$/.test(path) &&
    !/font-size|inset$/.test(path)
  )
    return 'sizing'
  return dimensionType(path.replace(/\./g, '-'))
}

// The same, for colours a component mixes on the spot. They differ per theme,
// so they are resolved per mode like the semantic mixes.
const LOCAL_COLORS = [
  ...['primary', 'secondary', 'success', 'info', 'warning', 'danger'].flatMap(
    (v) => [
      [
        `button.outlined-${v}-hover-bg`,
        `color-mix(in srgb, var(--nb-c-${v}) 8%, transparent)`,
        'Button.vue --outlined :hover',
      ],
      [
        `button.outlined-${v}-active-bg`,
        `color-mix(in srgb, var(--nb-c-${v}) 14%, transparent)`,
        'Button.vue --outlined :active',
      ],
    ],
  ),
  [
    'badge.grey-bg',
    'color-mix(in srgb, var(--nb-c-text-subtle) 15%, var(--nb-c-surface))',
    'Badge.vue --grey',
  ],
  ...Object.entries({
    blue: 'info',
    orange: 'warning',
    green: 'success',
    red: 'danger',
    purple: 'primary',
  }).map(([badge, role]) => [
    `badge.${badge}-bg`,
    `color-mix(in srgb, var(--nb-c-${role}) 12%, var(--nb-c-surface))`,
    `Badge.vue --${badge}`,
  ]),
  [
    'badge.placeholder-border',
    'color-mix(in srgb, var(--nb-c-text-subtle) 55%, transparent)',
    'Badge.vue --placeholder',
  ],
]

// ─── 5. Value translation ───────────────────────────────────────────────────

// A length or calc() expression in Penpot's maths syntax, or null.
function expression(value, refName) {
  let v = value.trim()
  if (/vw|vh|%|max\(|min\(|clamp\(| solid /.test(v)) return null
  const unresolved = []
  v = v.replace(/var\(\s*--nb-([\w-]+)\s*\)/g, (_, n) => {
    const ref = refName(n)
    if (!ref) unresolved.push(n)
    return `{${ref}}`
  })
  if (unresolved.length) return null
  v = v.replace(/^calc\((.*)\)$/, '$1')
  v = v.replace(/(-?[\d.]+)rem\b/g, (_, n) => String(parseFloat(n) * REM))
  v = v.replace(/(-?[\d.]+)px\b/g, '$1')
  return v
}

export function buildPenpotTokens() {
  const theme = readTheme()
  const layers = readLayers()
  const appearance = readAppearance()
  // Appearance owns these names: their theme value is only the square default.
  const appearanceNames = new Set(Object.keys(appearance.square))

  const palette = new Set()
  for (const name of Object.keys(theme.light)) {
    const m = name.match(/^c-([\w-]+?)-\d{3}(?:-a11y)?$/)
    if (m) palette.add(m[1])
  }

  const sets = {
    core: {},
    'semantic/light': {},
    'semantic/dark': {},
    component: {},
    ...Object.fromEntries(APPEARANCES.map((a) => [`appearance/${a}`, {}])),
  }
  const skipped = {}
  const literals = []

  function put(set, path, token) {
    let node = sets[set]
    const parts = path.split('.')
    for (const part of parts.slice(0, -1)) node = node[part] ??= {}
    node[parts.at(-1)] = token
  }

  const resolvers = Object.fromEntries(
    MODES.map((m) => [m, makeResolver(theme[m])]),
  )

  // Every core colour by hex, so a literal in the semantic layer can become a
  // reference. Exact matches only: the rendered colour never changes.
  const coreByHex = new Map()
  const indexCore = (path, hex) => {
    if (!coreByHex.has(hex)) coreByHex.set(hex, [])
    coreByHex.get(hex).push(path)
  }

  const isCore = (name) =>
    name === 'base-unit' ||
    name === 'c-white' ||
    name === 'c-black' ||
    (/^c-([\w-]+?)-\d{3}(-a11y)?$/.test(name) &&
      palette.has(name.match(/^c-([\w-]+?)-\d{3}/)[1])) ||
    /^(spacing|font-family|font-size|font-weight|line-height|size|grid)-/.test(
      name,
    ) ||
    RADIUS_SCALE.test(name) ||
    /^type-/.test(name)

  // A reference may only point at a token this file actually writes: not one
  // that is skipped by name, and not one whose own value Penpot cannot hold.
  const emitted = (name, depth = 0) => {
    const value = theme.light[name]
    if (value === undefined || skipReason(name) || depth > 20) return false
    if (/ solid |vw|%|max\(/.test(value) && !parseMix(value)) return false
    const ref = parseVar(value)
    return ref ? emitted(ref[0], depth + 1) : true
  }
  const refName = (name) => (emitted(name) ? tokenName(name, palette) : null)

  // ── core ──────────────────────────────────────────────────────────────────
  const typeSets = {}
  for (const [name, value] of Object.entries(theme.light)) {
    if (!isCore(name)) continue
    const path = tokenName(name, palette)
    const source = `--nb-${name}`

    if (name.startsWith('c-')) {
      const hex = toHex(parseColor(value))
      put('core', path, { $value: hex, $type: 'color', $description: source })
      indexCore(path, hex)
    } else if (name.startsWith('font-family-')) {
      const families = value
        .split(',')
        .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
      put('core', path, {
        $value: families,
        $type: 'fontFamilies',
        $description: source,
      })
    } else if (name.startsWith('font-weight-')) {
      put('core', path, {
        $value: value,
        $type: 'fontWeights',
        $description: source,
      })
    } else if (name.startsWith('type-')) {
      const [, set, prop] = name.match(
        /^type-(.+)-(size|weight|line-height|letter-spacing|family)$/,
      )
      ;(typeSets[set] ??= {})[prop] = value
    } else {
      const expr = expression(value, refName)
      if (expr == null) skipped[source] = `unsupported value: ${value}`
      else
        put('core', path, {
          $value: expr,
          $type: dimensionType(name),
          $description: source,
        })
    }
  }

  for (const [name, value] of Object.entries(layers)) {
    const [, mode, rest] = name.match(/^layer-(light|dark)-(.+)$/)
    const level = rest.match(/^(surface|border|hover)-(\d)$/)
    const path = level
      ? `color.layer.${mode}.${level[1]}.${level[2]}`
      : `color.layer.${mode}.${rest}`
    const hex = toHex(parseColor(value))
    put('core', path, {
      $value: hex,
      $type: 'color',
      $description: `layers.$${mode} in variables/_layers.scss`,
    })
    indexCore(path, hex)
  }

  // Type sets become typography tokens. Penpot letter spacing is in px, so the
  // em value is written as an expression of the set's own font size.
  for (const [set, props] of Object.entries(typeSets)) {
    const size = `{${tokenName(parseVar(props.size)[0], palette)}}`
    const em = parseFloat(props['letter-spacing'])
    put('core', `type.${set}`, {
      $value: {
        fontFamily: `{${tokenName(parseVar(props.family)[0], palette)}}`,
        fontSize: size,
        fontWeight: `{${tokenName(parseVar(props.weight)[0], palette)}}`,
        lineHeight: props['line-height'],
        letterSpacing: em ? `${size} * ${em}` : '0',
        textCase: 'none',
        textDecoration: 'none',
      },
      $type: 'typography',
      $description: `--nb-type-${set}-*`,
    })
  }

  // ── semantic and component ────────────────────────────────────────────────

  // Which core token a matching hex should point at, best first:
  //   - for an -a11y token, the a11y step of whatever its base colour points at
  //   - the core token the light theme names, then another step of its ramp
  //   - this theme's own layer ramp
  //   - white or black, then any plain palette step
  // An unrelated ramp's a11y step is never chosen: it would be the right
  // colour under a misleading name, so the hex stays a literal instead.
  // The other theme's layer ramp is never a candidate: a dark token that only
  // happens to equal a light layer is a literal, not a light-theme reference.
  function coreReference(hex, name, mode) {
    const other = MODES.find((m) => m !== mode)
    const candidates = (coreByHex.get(hex) ?? []).filter(
      (c) => !c.startsWith(`color.layer.${other}.`),
    )
    if (!candidates.length) return null
    let baseA11y = null
    if (name.endsWith('-a11y')) {
      const base = name.slice(0, -'-a11y'.length)
      const baseRgba = theme[mode][base] && resolvers[mode].color(base)
      const baseRef = baseRgba && coreReference(toHex(baseRgba), base, mode)
      if (baseRef) baseA11y = `${baseRef}-a11y`
    }
    const lightRef = parseVar(theme.light[name] ?? '')
    const hint =
      lightRef && isCore(lightRef[0]) ? tokenName(lightRef[0], palette) : null
    const ramp = hint?.split('.').slice(0, 2).join('.')
    const ranked = [
      candidates.find((c) => c === baseA11y),
      candidates.find((c) => c === hint),
      candidates.find((c) => ramp && c.startsWith(`${ramp}.`)),
      candidates.find((c) => c.startsWith(`color.layer.${mode}.`)),
      candidates.find((c) => c === 'color.white' || c === 'color.black'),
      candidates.find((c) => !c.endsWith('-a11y')),
    ]
    return ranked.find(Boolean)
  }

  // A colour token for one mode: a reference when the source is one or the
  // value is a core colour, otherwise the resolved hex with its formula.
  function colorToken(name, mode) {
    const value = theme[mode][name]
    const source = `--nb-${name}`
    const ref = parseVar(value)
    if (ref && emitted(ref[0])) {
      return {
        $value: `{${tokenName(ref[0], palette)}}`,
        $type: 'color',
        $description: source,
      }
    }
    const rgba = resolvers[mode].color(name)
    const hex = toHex(rgba)
    const stops = parseMix(value)
    // A mix that takes all of one colour is that colour: keep the reference.
    const whole = stops?.find(([, p]) => p === 1)
    if (whole && parseVar(whole[0])) {
      return {
        $value: `{${tokenName(parseVar(whole[0])[0], palette)}}`,
        $type: 'color',
        $description: `${source}: ${tidy(value)}`,
      }
    }
    const core = coreReference(hex, name, mode)
    if (core)
      return { $value: `{${core}}`, $type: 'color', $description: source }
    return {
      $value: hex,
      $type: 'color',
      $description: stops
        ? `${source}: ${tidy(value)}, resolved for ${mode}`
        : `${source}: a literal in the compiled theme`,
    }
  }

  const semanticNames = Object.keys(theme.dark).filter((n) => !isCore(n))
  for (const name of semanticNames) {
    if (appearanceNames.has(name)) continue
    const source = `--nb-${name}`
    const why = skipReason(name)
    if (why) {
      skipped[source] = why
      continue
    }
    const path = tokenName(name, palette)
    const isColor = MODES.every((m) => resolvers[m].color(name))

    if (isColor) {
      const perMode = MODES.map((m) => colorToken(name, m))
      const isLiteral = (token) => !token.$value.startsWith('{')
      // A component colour that is the same in both themes, reference or not,
      // is not a theme decision.
      if (!name.startsWith('c-') && perMode[0].$value === perMode[1].$value) {
        const token = isLiteral(perMode[0])
          ? {
              ...perMode[0],
              $description: perMode[0].$description.replace(
                /, resolved for \w+$/,
                '',
              ),
            }
          : perMode[0]
        put('component', path, token)
        if (isLiteral(token)) literals.push(source)
      } else {
        MODES.forEach((m, i) => {
          put(`semantic/${m}`, path, perMode[i])
          if (isLiteral(perMode[i])) literals.push(`${source} (${m})`)
        })
      }
      continue
    }

    const values = MODES.map((m) => theme[m][name])
    if (values[0] !== values[1]) {
      skipped[source] =
        `non-colour value differs between themes: ${values.join(' / ')}`
      continue
    }
    const expr = expression(values[0], refName)
    if (expr == null) {
      skipped[source] = `unsupported value: ${values[0]}`
      continue
    }
    put('component', path, {
      $value: expr,
      $type: dimensionType(name),
      $description: source,
    })
  }

  // Ink: each variant moved toward the theme's ink-toward colour by its lift.
  for (const variant of [
    'primary',
    'secondary',
    'success',
    'info',
    'warning',
    'danger',
  ]) {
    MODES.forEach((mode) => {
      const raw = theme[mode]
      const percent = parseFloat(raw[`c-${variant}-ink-lift`] ?? '0')
      const lift = percent / 100
      const description = `ink('${variant}') in logic/_ink.scss, ${percent}% toward --nb-c-ink-toward`
      if (!lift) {
        put(`semantic/${mode}`, `color.${variant}-ink`, {
          $value: `{color.${variant}}`,
          $type: 'color',
          $description: description,
        })
        return
      }
      const r = resolvers[mode]
      const rgba = mix(
        [r.color(`c-${variant}`), 1 - lift],
        [r.value(raw['c-ink-toward']), lift],
      )
      const hex = toHex(rgba)
      const core = coreReference(hex, `c-${variant}-ink`, mode)
      if (!core) literals.push(`color.${variant}-ink (${mode})`)
      put(`semantic/${mode}`, `color.${variant}-ink`, {
        $value: core ? `{${core}}` : hex,
        $type: 'color',
        $description: description,
      })
    })
  }

  // Component-local values: lengths into component, colours per mode.
  const localRef = (n) =>
    appearanceNames.has(n) ? tokenName(n, palette) : refName(n)
  for (const [path, value, where] of LOCAL) {
    const expr = expression(value, localRef)
    put('component', path, {
      $value: expr,
      $type: localType(path),
      $description: `${value} in ${where}`,
    })
  }
  for (const [path, value, where] of LOCAL_COLORS) {
    MODES.forEach((mode) => {
      const hex = toHex(resolvers[mode].value(value))
      const core = coreReference(hex, path, mode)
      if (!core) literals.push(`${path} (${mode})`)
      put(`semantic/${mode}`, path, {
        $value: core ? `{${core}}` : hex,
        $type: 'color',
        $description: `${tidy(value)} in ${where}, resolved for ${mode}`,
      })
    })
  }

  // Appearance: each block in full, so either set alone is complete. A value
  // that names another appearance token (field radius → control radius) stays
  // a reference into its own set.
  for (const a of APPEARANCES) {
    for (const [name, value] of Object.entries(appearance[a])) {
      const source = `--nb-${name}`
      const expr = expression(value, (n) =>
        appearanceNames.has(n) ? tokenName(n, palette) : refName(n),
      )
      if (expr == null) {
        skipped[`${source} (${a})`] = `unsupported value: ${value}`
        continue
      }
      put(`appearance/${a}`, tokenName(name, palette), {
        $value: expr,
        $type: dimensionType(name),
        $description: `${source}, [data-nb-appearance='${a}'] in _appearance.scss`,
      })
    }
  }

  const title = (s) => s[0].toUpperCase() + s.slice(1)
  return {
    ...sets,
    $themes: [
      ...MODES.map((mode) => ({
        name: title(mode),
        group: 'Mode',
        selectedTokenSets: {
          core: 'enabled',
          [`semantic/${mode}`]: 'enabled',
          component: 'enabled',
        },
      })),
      ...APPEARANCES.map((a) => ({
        name: title(a),
        group: 'Appearance',
        selectedTokenSets: { [`appearance/${a}`]: 'enabled' },
      })),
    ],
    $metadata: {
      tokenSetOrder: [
        'core',
        'semantic/light',
        'semantic/dark',
        'component',
        ...APPEARANCES.map((a) => `appearance/${a}`),
      ],
      source: 'src/styles/_theme.scss',
      resolvedLiterals: literals,
      skipped,
    },
  }
}

export function countTokens(node) {
  if (node && typeof node === 'object' && '$value' in node) return 1
  return Object.values(node ?? {}).reduce(
    (n, child) => n + countTokens(child),
    0,
  )
}

export function writePenpotTokens(outFile) {
  const tokens = buildPenpotTokens()
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(tokens, null, 2) + '\n')
  return tokens
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = resolve(ROOT, 'design/penpot/tokens.json')
  const tokens = writePenpotTokens(out)
  const counts = tokens.$metadata.tokenSetOrder
    .map((set) => `${set} ${countTokens(tokens[set])}`)
    .join(', ')
  console.log(`✓ Penpot tokens (${counts}) → design/penpot/tokens.json`)
}
