/**
 * Shared layer-token measurement.
 *
 * Compiles the SCSS theme, resolves every `--nb-*` custom property down to a
 * literal colour, and provides the colour maths the layer work is judged on.
 * Used by the contrast audit (`scripts/audit-contrast.mjs`, which reports) and
 * by the contrast guard (`tests/layerContrast.test.ts`, which fails CI). Both
 * have to read the same numbers off the same stylesheet, so they read them
 * through here rather than each parsing the theme their own way.
 */

import * as sass from 'sass-embedded'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(__dirname, '../..')

// ─── colour maths ───────────────────────────────────────────────────────────

/** Parses `#rgb`, `#rrggbb` or `rgb()/rgba()` into channels. Null otherwise. */
export function parseColor(v) {
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

/** Relative luminance, WCAG 2.x definition. */
export const lum = (rgb) =>
  0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2])

/** WCAG contrast ratio between two colours, or null if either will not parse. */
export function ratio(a, b) {
  const A = parseColor(a)
  const B = parseColor(b)
  if (!A || !B) return null
  const l1 = lum(A)
  const l2 = lum(B)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/**
 * CIE L*, perceptual lightness 0 to 100. Separation between near-identical
 * greys reads better in dL* than in a WCAG ratio that hugs 1.0.
 */
export function lstar(v) {
  const y = lum(parseColor(v))
  return y <= 216 / 24389 ? y * (24389 / 27) : Math.cbrt(y) * 116 - 16
}

/** Perceptual distance between two colours. */
export const dL = (a, b) => Math.abs(lstar(a) - lstar(b))

/** Two decimal places, null-safe. */
export const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100)

// ─── the stylesheet ─────────────────────────────────────────────────────────

/** Compiles the theme mixins to CSS. */
export function compile(mixins) {
  const { css } = sass.compileString(
    `@use 'theme';` + mixins.map((m) => `@include theme.${m}();`).join(''),
    { loadPaths: [resolve(ROOT, 'src/styles')], style: 'compressed' },
  )
  return css
}

/** Collects `--nb-*` declarations from every block whose selector matches. */
export function propsFrom(css, selector) {
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

/**
 * Builds a lookup that follows `var()` chains to a literal value.
 *
 * @param {Object[]} scopes property maps, later ones override earlier
 */
export function resolver(scopes) {
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

/**
 * Compiles the theme once and returns a token lookup per theme.
 *
 * @returns {{ light: (name: string) => string|null, dark: (name: string) => string|null }}
 */
export function loadThemeResolvers() {
  const cssAll = compile(['base', 'light', 'dark'])
  const rootProps = propsFrom(cssAll, /^:root$/)
  const darkProps = propsFrom(cssAll, /(^|\s)\.dark$/)
  return {
    light: resolver([rootProps]),
    dark: resolver([rootProps, darkProps]),
  }
}
