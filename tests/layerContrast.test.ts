// Contrast regression guard.
//
// The layer ramps in `src/styles/variables/_layers.scss` are hand-picked values
// chosen to clear AAA on every surface a piece of text can land on. Nothing
// about them is self-evident from reading the hex, so an edit that looks
// harmless can quietly drop a token below the bar. This compiles the real
// stylesheet, resolves the real custom properties and measures them. If a value
// moves the wrong way, this fails, in the pre-commit hook, the pre-push hook and
// in CI, all of which run the suite.
//
// The measurement code is shared with `scripts/audit-contrast.mjs`, so the
// numbers reported by the audit and the numbers enforced here cannot drift
// apart.

import { describe, it, expect } from 'vitest'
import {
  dL,
  loadThemeResolvers,
  lstar as lStar,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const LEVELS = [0, 1, 2, 3] as const

/** WCAG AAA for body text. Every text/surface pair has to clear this. */
const AAA = 7.0
/** Hard floor, no exceptions anywhere, including the deepest layer. */
const AA = 4.5
/** A border has to be visible against the surface it sits on. */
const BORDER_MIN = 1.5
/** A border in the "strong" role has to read as a deliberate edge. */
const STRONG_BORDER_MIN = 3.0
/** Hover has to be visible without flashing. */
const HOVER_MIN_DL = 3.0
const HOVER_MAX_DL = 12.0
/** Adjacent surfaces have to separate, by theme. */
const SURFACE_MIN_DL = { light: 3.8, dark: 7.0 } as const

/** Light alternates, so every pair of surfaces must stay apart, not just neighbours. */
const SURFACE_MIN_PAIR_DL = 1.5

/** The deepest light surface stays bright. Below this it is a descending ramp again. */
const LIGHT_FLOOR_LSTAR = 90.0

/** No light surface pinned against the white ceiling. */
const LIGHT_CEILING_LSTAR = 98.5

/** A border past this stops reading as an edge and starts reading as a wireframe. */
const BORDER_MAX = 4.5

/** A hover value this close to any resting surface reads as a depth change. */
const HOVER_MIN_SURFACE_DL = 1.5
/** How far a neutral is allowed to drift from grey, per channel. */
const MAX_CHANNEL_SPREAD = 8

type Theme = 'light' | 'dark'

const resolvers = loadThemeResolvers()

interface IThemeTokens {
  surface: string[]
  border: string[]
  hover: string[]
  text: string
  textMuted: string
  textSubtle: string
  fieldBg: string
  fieldBorder: string
}

function tokensFor(theme: Theme): IThemeTokens {
  const get = resolvers[theme]
  const need = (name: string): string => {
    const value = get(name)
    // A renamed or deleted token is a regression too, not a skipped assertion.
    expect(value, `${theme}: ${name} does not resolve`).toBeTruthy()
    return value as string
  }
  return {
    surface: LEVELS.map((i) => need(`--nb-c-layer-${i}`)),
    border: LEVELS.map((i) => need(`--nb-c-layer-border-${i}`)),
    hover: LEVELS.map((i) => need(`--nb-c-layer-hover-${i}`)),
    text: need('--nb-c-text'),
    textMuted: need('--nb-c-text-muted'),
    textSubtle: need('--nb-c-text-subtle'),
    fieldBg: need('--nb-c-field-bg'),
    fieldBorder: need('--nb-c-field-border'),
  }
}

const themes: Theme[] = ['light', 'dark']

describe.each(themes)('%s layer ramp', (theme) => {
  const t = tokensFor(theme)

  // ── text ──────────────────────────────────────────────────────────────────
  //
  // Text lands on three kinds of ground: a resting layer, that layer's hover
  // state, and a field. All three are measured, for both text tiers.

  describe.each(LEVELS)('layer %i', (level) => {
    it('carries primary text at AAA', () => {
      expect(ratio(t.text, t.surface[level])).toBeGreaterThanOrEqual(AAA)
    })

    it('carries muted text at AAA', () => {
      expect(ratio(t.textMuted, t.surface[level])).toBeGreaterThanOrEqual(AAA)
    })

    it('carries primary text at AAA on its hover surface', () => {
      expect(ratio(t.text, t.hover[level])).toBeGreaterThanOrEqual(AAA)
    })

    it('carries muted text at AAA on its hover surface', () => {
      // The case the original ramp failed worst: a hovered row is where muted
      // text lives, and it was never measured there.
      expect(ratio(t.textMuted, t.hover[level])).toBeGreaterThanOrEqual(AAA)
    })

    it('never lets muted text fall under the hard floor', () => {
      expect(ratio(t.textMuted, t.surface[level])).toBeGreaterThanOrEqual(AA)
      expect(ratio(t.textMuted, t.hover[level])).toBeGreaterThanOrEqual(AA)
    })

    it('carries subtle text at AA, resting and hovered', () => {
      // The third tier is held to AA, not AAA, and the reason is arithmetic:
      // muted already sits near 8:1 on the deepest surface, so a tier lighter
      // than muted and still above 7:1 has no room to read as a separate tier.
      // It is still measured, because it was silently failing AA on every
      // layer before it was given values of its own.
      expect(ratio(t.textSubtle, t.surface[level])).toBeGreaterThanOrEqual(AA)
      expect(ratio(t.textSubtle, t.hover[level])).toBeGreaterThanOrEqual(AA)
    })
  })

  it('carries subtle text at AA on a field', () => {
    expect(ratio(t.textSubtle, t.fieldBg)).toBeGreaterThanOrEqual(AA)
  })

  it('carries both text tiers at AAA on a field', () => {
    expect(ratio(t.text, t.fieldBg)).toBeGreaterThanOrEqual(AAA)
    expect(ratio(t.textMuted, t.fieldBg)).toBeGreaterThanOrEqual(AAA)
  })

  // ── depth ─────────────────────────────────────────────────────────────────

  it('separates adjacent surfaces by at least the per-theme floor', () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(
        dL(t.surface[i], t.surface[i + 1]),
        `layer-${i} to layer-${i + 1}`,
      ).toBeGreaterThanOrEqual(SURFACE_MIN_DL[theme])
    }
  })

  // The two themes carry depth in different shapes, so they are guarded
  // differently.
  //
  // Dark runs a monotonic ramp: separation must never shrink as depth grows,
  // which is what makes depth readable as an order rather than a set of local
  // boundaries.
  //
  // Light alternates, because a light theme should stay light as surfaces
  // stack rather than getting muddier with every level. Alternation cannot
  // promise growing steps, so it has to promise two other things instead: no
  // two surfaces may collapse onto each other (the failure in Carbon's own
  // light themes, where layer 2 is byte-identical to the background), and the
  // borders must carry the depth order the fill cannot.

  if (theme === 'dark') {
    it('never separates less as it goes deeper', () => {
      const steps = [0, 1, 2].map((i) => dL(t.surface[i], t.surface[i + 1]))
      for (let i = 1; i < steps.length; i++) {
        expect(steps[i], `step ${i} vs ${i - 1}`).toBeGreaterThanOrEqual(
          steps[i - 1] - 0.01,
        )
      }
    })
  }

  if (theme === 'light') {
    it('alternates darker and lighter rather than only descending', () => {
      const l = t.surface.map(lStar)
      expect(l[1], 'layer-1 above layer-0').toBeGreaterThan(l[0])
      expect(l[2], 'layer-2 below layer-1').toBeLessThan(l[1])
      expect(l[3], 'layer-3 above layer-2').toBeGreaterThan(l[2])
    })

    it('keeps the deepest surface light', () => {
      // The point of alternating. If the deepest surface sinks, the theme has
      // quietly become a descending ramp again.
      expect(Math.min(...t.surface.map(lStar))).toBeGreaterThanOrEqual(
        LIGHT_FLOOR_LSTAR,
      )
    })

    it('never pins a surface against the white ceiling', () => {
      // Glare over a long session is set by the brightest surface, the same way
      // it is set by the darkest one in dark mode.
      expect(Math.max(...t.surface.map(lStar))).toBeLessThanOrEqual(
        LIGHT_CEILING_LSTAR,
      )
    })

    it('never lets two surfaces collapse onto each other', () => {
      for (let i = 0; i < LEVELS.length; i++) {
        for (let j = i + 1; j < LEVELS.length; j++) {
          expect(
            dL(t.surface[i], t.surface[j]),
            `layer-${i} vs layer-${j}`,
          ).toBeGreaterThanOrEqual(SURFACE_MIN_PAIR_DL)
        }
      }
    })

    it('escalates borders with depth to carry the order the fill cannot', () => {
      const ratios = LEVELS.map((i) => ratio(t.border[i], t.surface[i]))
      for (let i = 1; i < ratios.length; i++) {
        expect(ratios[i], `border-${i} vs border-${i - 1}`).toBeGreaterThan(
          ratios[i - 1],
        )
      }
      // ...without becoming a wireframe.
      for (const [i, r] of ratios.entries()) {
        expect(r, `border-${i}`).toBeLessThanOrEqual(BORDER_MAX)
      }
    })
  }

  it('never lets a hover surface impersonate another layer', () => {
    // A hovered row that lands on another layer's resting colour reads as a
    // depth change rather than a state change.
    for (const level of LEVELS) {
      for (const other of LEVELS) {
        expect(
          dL(t.hover[level], t.surface[other]),
          `hover-${level} vs layer-${other}`,
        ).toBeGreaterThanOrEqual(HOVER_MIN_SURFACE_DL)
      }
    }
  })

  it('keeps hover visible without making it a flash', () => {
    for (const level of LEVELS) {
      const delta = dL(t.hover[level], t.surface[level])
      expect(delta, `hover-${level}`).toBeGreaterThanOrEqual(HOVER_MIN_DL)
      expect(delta, `hover-${level}`).toBeLessThanOrEqual(HOVER_MAX_DL)
    }
  })

  it('keeps every border visible against its own surface', () => {
    for (const level of LEVELS) {
      expect(
        ratio(t.border[level], t.surface[level]),
        `border-${level}`,
      ).toBeGreaterThanOrEqual(BORDER_MIN)
    }
  })

  it('keeps the strong border role reading as a deliberate edge', () => {
    // `--nb-c-field-border` is the strong role: an interactive edge, not a
    // divider, so it is held to a higher bar than the layer borders.
    expect(
      ratio(t.fieldBorder, t.fieldBg),
      'field-border vs field-bg',
    ).toBeGreaterThanOrEqual(STRONG_BORDER_MIN)
  })

  it('gives a field an edge of its own against the page ground', () => {
    // The defect this replaces: field-bg was the same value as layer-0, so a
    // field on the page had no fill boundary at all.
    expect(t.fieldBg).not.toBe(t.surface[0])
  })

  // ── emitted values ────────────────────────────────────────────────────────

  it('emits integer-channel hex for every layer token', () => {
    const all = [
      ...t.surface,
      ...t.border,
      ...t.hover,
      t.text,
      t.textMuted,
      t.fieldBg,
      t.fieldBorder,
    ]
    for (const value of all) {
      // The tint ramp this replaced emitted `rgb(229.5, 229.5, 229.5)`.
      expect(value, value).toMatch(/^#[0-9a-f]{6}$/i)
      for (const channel of parseColor(value) as number[]) {
        expect(Number.isInteger(channel), value).toBe(true)
      }
    }
  })

  it('stays in one neutral hue family across the whole ramp', () => {
    // The previous ramp mixed a blue-ish grey with a pure neutral, so the hue
    // changed mid-stack. Every token here has to be near-grey and drift in the
    // same direction.
    const all = [...t.surface, ...t.border, ...t.hover]
    for (const value of all) {
      const [r, g, b] = parseColor(value) as number[]
      expect(
        Math.max(r, g, b) - Math.min(r, g, b),
        `${value} channel spread`,
      ).toBeLessThanOrEqual(MAX_CHANNEL_SPREAD)
      expect(r <= g && g <= b, `${value} hue direction`).toBe(true)
    }
  })
})
