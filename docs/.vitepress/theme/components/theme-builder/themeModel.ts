/**
 * The theme model: what a theme is made of, what the samples are, and how one
 * is turned back into SCSS.
 *
 * Kept apart from the builder's markup so the export path can be tested and
 * re-run from Node without a browser, and so the samples are ordinary themes
 * rather than something only the documentation can express. They go through
 * the same `theme()` mixin a consumer calls.
 */

import tinycolor from 'tinycolor2'

/** A token a person can edit, grouped so the UI is not a wall of variables. */
export interface IThemeToken {
  /** Key as the SCSS mixin takes it: the `--nb-c-` prefix, dropped. */
  key: string
  label: string
  /** What it does, in one line, for the control's help text. */
  hint: string
}

export interface IThemeGroup {
  title: string
  /** Shown collapsed: the tokens most themes never touch. */
  advanced?: boolean
  tokens: IThemeToken[]
}

/**
 * The editable contract.
 *
 * Deliberately a subset of the ~190 semantic tokens the library emits. These
 * are the ones that actually decide what a theme looks like; everything else
 * either derives from them or is structural. A theme that sets only these
 * reads as a complete theme, and anything omitted falls through to the
 * default, so a one-key theme is valid.
 */
export const GROUPS: IThemeGroup[] = [
  {
    title: 'Accent',
    tokens: [
      { key: 'primary', label: 'Primary', hint: 'The action colour.' },
      {
        key: 'primary-hover',
        label: 'Primary hover',
        hint: 'Pointer over a primary control.',
      },
      {
        key: 'primary-active',
        label: 'Primary active',
        hint: 'While a primary control is pressed.',
      },
      {
        key: 'secondary',
        label: 'Secondary',
        hint: 'The alternative action.',
      },
    ],
  },
  {
    title: 'Surfaces',
    tokens: [
      {
        key: 'layer-0',
        label: 'Page',
        hint: 'The ground everything sits on.',
      },
      { key: 'layer-1', label: 'Panel', hint: 'Cards, panels, tables.' },
      { key: 'layer-2', label: 'Nested', hint: 'A section inside a panel.' },
      { key: 'layer-3', label: 'Popover', hint: 'Menus, modals, tooltips.' },
    ],
  },
  {
    title: 'Text',
    tokens: [
      { key: 'text', label: 'Primary text', hint: 'Body copy and headings.' },
      { key: 'text-muted', label: 'Muted', hint: 'Secondary text, captions.' },
      {
        key: 'text-subtle',
        label: 'Subtle',
        hint: 'Placeholders and hints. Never essential text.',
      },
    ],
  },
  {
    title: 'Fields',
    tokens: [
      { key: 'field-bg', label: 'Field fill', hint: 'An editable field.' },
      {
        key: 'field-border',
        label: 'Field rule',
        hint: 'The bottom rule under a field.',
      },
      {
        key: 'focus-ring',
        label: 'Focus ring',
        hint: 'Keyboard focus. Held to 3:1.',
      },
    ],
  },
  {
    title: 'Status',
    tokens: [
      { key: 'success', label: 'Success', hint: 'A positive outcome.' },
      { key: 'info', label: 'Info', hint: 'Neutral information.' },
      { key: 'warning', label: 'Warning', hint: 'Proceed with care.' },
      { key: 'danger', label: 'Danger', hint: 'Destroys something.' },
    ],
  },
  {
    title: 'Borders and layers',
    advanced: true,
    tokens: [
      { key: 'border', label: 'Border', hint: 'The default border colour.' },
      {
        key: 'layer-border-1',
        label: 'Panel border',
        hint: 'The edge of a panel.',
      },
      {
        key: 'layer-hover-1',
        label: 'Panel hover',
        hint: 'A hovered row on a panel.',
      },
    ],
  },
]

export const ALL_KEYS: string[] = GROUPS.flatMap((g) =>
  g.tokens.map((t) => t.key),
)

/* ─── The palette ─────────────────────────────────────────────────────────
 *
 * A theme in this library is not a bag of hexes. It is a set of NAMED base
 * colours, each expanded into a seventeen-step ramp with a readable
 * foreground for every step, and a set of semantic roles that POINT at those
 * steps. `--nb-c-primary` is not a colour, it is a reference to
 * `--nb-c-grape-hyacinth-500`, and `--nb-c-primary-a11y` follows it to
 * `--nb-c-grape-hyacinth-500-a11y`.
 *
 * Everything below mirrors that, so what the builder previews is what the
 * exported SCSS compiles to. The two ramp functions are ports of
 * `make-shades()` and `color-contrast()`, and a test compiles the real Sass
 * and compares it step by step rather than trusting the port.
 */

/** The tints the library emits for every palette colour. */
export const TINTS = [
  100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
  850, 900,
]

export interface IPaletteColor {
  /** Used in the token name: `--nb-c-<id>-500`. */
  id: string
  name: string
  /** The colour the ramp is generated from. */
  base: string
}

/**
 * Which step a colour naturally sits at, mirroring `color-level()`.
 *
 * A base colour keeps its exact value at its own level, so a brand hex
 * survives the ramp untouched instead of being approximated by a step near it.
 */
export function colorLevel(value: string): number {
  const l = tinycolor(value).toHsl().l * 100
  return Math.min(Math.max(Math.round((100 - l) / 10) * 100, 100), 900)
}

/** The full ramp for one base colour, mirroring `make-shades()`. */
export function shadesOf(base: string): Record<number, string> {
  const out: Record<number, string> = {}
  if (!isValidColor(base)) return out
  const own = colorLevel(base)
  const { h, s } = tinycolor(base).toHsl()
  for (const tint of TINTS) {
    const i = tint / 50
    out[tint] =
      tint === own
        ? `#${tinycolor(base).toHex()}`
        : `#${tinycolor({ h, s, l: (100 - i * 5) / 100 }).toHex()}`
  }
  return out
}

/** WCAG relative luminance, the same formula the SCSS contrast helpers use. */
function luminance(value: string): number {
  const { r, g, b } = tinycolor(value).toRgb()
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const raw = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  // The SCSS rounds to a hundredth before comparing, so this does too.
  return Math.round(raw * 100) / 100
}

/*
 * The two foregrounds the library chooses between.
 *
 * `#101010`, not `#000000`. That is the library's own `$black`, and the
 * difference decides real cases: a mid-red resolves to white text with
 * #101010 as the reference and to black text with pure black, because the
 * near-black is light enough to lose the comparison. Mirroring the constant
 * is the difference between a preview that predicts the build and one that
 * contradicts it.
 */
export const A11Y_WHITE = '#ffffff'
export const A11Y_BLACK = '#101010'

/**
 * The readable foreground for a colour, mirroring `color-contrast()`.
 *
 * Black or white, whichever contrasts more. Not a nearest-accessible-colour
 * search: the library picks between the two, and the builder must agree with
 * the library rather than be cleverer than it.
 */
export function a11yOf(value: string): string {
  return contrastRatio(value, A11Y_WHITE) > contrastRatio(value, A11Y_BLACK)
    ? A11Y_WHITE
    : A11Y_BLACK
}

/* ─── Roles ──────────────────────────────────────────────────────────────── */

/**
 * What a role holds: either a step of a palette colour (`accent-500`) or a
 * literal colour.
 *
 * The literal is the deliberate escape hatch. Pure white is not a step of
 * anything, and forcing it to be one would mean inventing a palette entry
 * whose only purpose is to hold a value the author already knows.
 */
export type TRoleValue = string

export interface IRampRef {
  color: string
  tint: number
}

/** Reads a role value as a ramp reference, or null if it is a literal. */
export function asRampRef(
  value: TRoleValue,
  palette: IPaletteColor[],
): IRampRef | null {
  if (!value || value.startsWith('#')) return null
  for (const color of palette) {
    if (value.startsWith(`${color.id}-`)) {
      const tint = Number(value.slice(color.id.length + 1))
      if (TINTS.includes(tint)) return { color: color.id, tint }
    }
  }
  return null
}

/** The colour a role actually renders as. */
export function resolveRole(
  value: TRoleValue,
  palette: IPaletteColor[],
): string {
  const ref = asRampRef(value, palette)
  if (!ref) return value
  const color = palette.find((c) => c.id === ref.color)
  if (!color) return '#000000'
  return shadesOf(color.base)[ref.tint] ?? '#000000'
}

export type TThemeTokens = Record<string, TRoleValue>

export interface ITheme {
  id: string
  name: string
  palette: IPaletteColor[]
  light: TThemeTokens
  dark: TThemeTokens
}

/**
 * The roles the library pairs with a readable foreground.
 *
 * Kept identical to `$a11y-roles` in `_theme-api.scss`, and a test asserts
 * the two lists match so they cannot drift apart.
 */
export const A11Y_ROLES = [
  'primary',
  'primary-hover',
  'primary-active',
  'secondary',
  'secondary-hover',
  'secondary-active',
  'success',
  'success-hover',
  'success-active',
  'info',
  'info-hover',
  'info-active',
  'warning',
  'warning-hover',
  'warning-active',
  'danger',
  'danger-hover',
  'danger-active',
]

/**
 * A sensible starting mapping for a fresh palette.
 *
 * Not magic, and not hidden: every role below is visible and editable in the
 * builder the moment a theme loads. This exists so that defining six colours
 * gives you a working theme rather than a form with forty empty fields, which
 * is the same reason the library ships defaults for all of them.
 *
 * The two halves point at different STEPS of the same colours. That is the
 * whole idea: a dark theme is not a different palette, it is the same palette
 * read from the other end.
 */
export function defaultRoles(mode: 'light' | 'dark'): TThemeTokens {
  if (mode === 'light') {
    return {
      primary: 'accent-500',
      'primary-hover': 'accent-600',
      'primary-active': 'accent-700',
      secondary: 'neutral-700',
      'layer-0': '#ffffff',
      'layer-1': 'neutral-100',
      'layer-2': 'neutral-150',
      'layer-3': '#ffffff',
      text: 'neutral-800',
      'text-muted': 'neutral-650',
      'text-subtle': 'neutral-500',
      'field-bg': 'neutral-100',
      'field-border': 'neutral-450',
      'focus-ring': 'accent-500',
      success: 'success-600',
      info: 'info-500',
      warning: 'warning-600',
      danger: 'danger-500',
      border: 'neutral-250',
      'layer-border-1': 'neutral-250',
      'layer-hover-1': 'neutral-150',
    }
  }
  return {
    primary: 'accent-350',
    'primary-hover': 'accent-300',
    'primary-active': 'accent-250',
    secondary: 'neutral-300',
    'layer-0': 'neutral-900',
    'layer-1': 'neutral-850',
    'layer-2': 'neutral-800',
    'layer-3': 'neutral-750',
    text: 'neutral-150',
    'text-muted': 'neutral-300',
    'text-subtle': 'neutral-450',
    'field-bg': 'neutral-800',
    'field-border': 'neutral-500',
    'focus-ring': 'accent-350',
    success: 'success-400',
    info: 'info-400',
    warning: 'warning-400',
    danger: 'danger-400',
    border: 'neutral-700',
    'layer-border-1': 'neutral-700',
    'layer-hover-1': 'neutral-750',
  }
}

/** The palette every sample is built from: one accent, one neutral, four states. */
function paletteOf(accent: string, neutral: string): IPaletteColor[] {
  return [
    { id: 'accent', name: 'Accent', base: accent },
    { id: 'neutral', name: 'Neutral', base: neutral },
    { id: 'success', name: 'Success', base: '#4acf7b' },
    { id: 'info', name: 'Info', base: '#214da6' },
    { id: 'warning', name: 'Warning', base: '#f59e0b' },
    { id: 'danger', name: 'Danger', base: '#dc2626' },
  ]
}

function sample(
  id: string,
  name: string,
  accent: string,
  neutral: string,
): ITheme {
  return {
    id,
    name,
    palette: paletteOf(accent, neutral),
    light: defaultRoles('light'),
    dark: defaultRoles('dark'),
  }
}

export const SAMPLE_THEMES: ITheme[] = [
  sample('ocean', 'Ocean', '#0f6f8c', '#5b7683'),
  sample('forest', 'Forest', '#2f6b3f', '#6b7280'),
  sample('warm-neutral', 'Warm neutral', '#a4552b', '#7a6a5f'),
]

/* ─── Validation and export ──────────────────────────────────────────────── */

/** A hex colour, and nothing else. Palette bases are always literal colours. */
export function isValidColor(value: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

/** The identifier rules, matched to the SCSS mixin's own validation. */
export function isValidId(value: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(value)
}

/** Turns any name into a usable identifier. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/** The palette, as the SCSS map the mixin expands into ramps. */
function emitPalette(palette: IPaletteColor[]): string {
  const rows = palette
    .filter((c) => isValidId(c.id) && isValidColor(c.base))
    .map((c) => `    ${c.id}: ${c.base.toLowerCase()}`)
  return rows.length ? `(\n${rows.join(',\n')}\n  )` : '()'
}

/**
 * One half of the role mapping.
 *
 * A ramp reference is quoted, because it is a string the mixin looks up
 * against the palette; a literal colour is emitted bare. Anything that is
 * neither is DROPPED rather than interpolated, so a value that arrived from a
 * text field cannot become SCSS.
 */
function emitRoles(tokens: TThemeTokens, palette: IPaletteColor[]): string {
  const rows: string[] = []
  for (const key of Object.keys(tokens).sort()) {
    const value = tokens[key]
    const quoted = /^[a-z0-9-]+$/.test(key) ? `'${key}'` : null
    if (!quoted) continue
    if (asRampRef(value, palette)) {
      rows.push(`    ${quoted}: '${value}'`)
    } else if (isValidColor(value)) {
      rows.push(`    ${quoted}: ${value.toLowerCase()}`)
    }
  }
  return rows.length ? `(\n${rows.join(',\n')}\n  )` : '()'
}

export function toScss(theme: ITheme): string {
  if (!isValidId(theme.id)) {
    throw new Error(
      `Invalid theme id "${theme.id}". Use lowercase letters, digits and hyphens.`,
    )
  }
  for (const color of theme.palette) {
    if (!isValidId(color.id)) {
      throw new Error(
        `Invalid palette id "${color.id}". Use lowercase letters, digits and hyphens.`,
      )
    }
  }
  // The name reaches only a comment, so it is stripped of anything that could
  // end one rather than being trusted.
  const safeName = theme.name
    .replace(/\*\//g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()

  return `/*
 * ${safeName || theme.id}
 *
 * A Nubisco UI colour theme.
 *
 * The palette below is expanded into the same seventeen-step ramps the
 * library builds for its own colours, each with an -a11y counterpart, and the
 * roles point at steps of those ramps. A role that names a step also carries
 * its readable foreground, so text on a themed control stays legible.
 *
 * Carries colour only: light and dark are both defined here and the existing
 * dark-mode class chooses between them, and corner geometry is a separate
 * setting this file does not touch.
 *
 * Usage:
 *
 *   // main.ts
 *   import '@nubisco/ui/styles'
 *   import './themes/${theme.id}.scss'
 *
 *   import { configureNamedTheme } from '@nubisco/ui'
 *   configureNamedTheme({ themes: ['${theme.id}'], defaultTheme: '${theme.id}' })
 *
 * Any token not listed falls through to the default theme.
 */

@use '@nubisco/ui/styles/theme-api' as nb;

@include nb.theme(
  '${theme.id}',
  $palette: ${emitPalette(theme.palette)},
  $light: ${emitRoles(theme.light, theme.palette)},
  $dark: ${emitRoles(theme.dark, theme.palette)}
);
`
}
