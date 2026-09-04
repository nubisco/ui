// Chart colour-role guard.
//
// Three things have to stay true and none of them are visible from reading a
// token file:
//
//  1. The role indirection is invisible. `--nb-c-chart-1` through `-8` have to
//     resolve, in the light theme, to exactly the eight brand ramp values that
//     Charts/shared/palette.ts used to name inline. If one drifts, every chart
//     in twelve apps repaints on an upgrade nobody read the notes for.
//  2. The colours are legible. Roles are non-text graphics, so 3:1 against the
//     surfaces a chart lands on, in both themes. The light theme carries one
//     documented exception (role 4) and the dark theme one documented ceiling
//     (layer-3); both are asserted here so they cannot silently grow.
//  3. The numbers in docs/ui/components/charts/color.md are real. The page caps
//     colour-only encoding at five series on the strength of measured CIEDE2000
//     distances, including under simulated colour-vision deficiency. Those
//     numbers are measured here, off the compiled stylesheet, so the guidance
//     and the palette cannot drift apart.
//
// Colour maths that already exists (parse, WCAG ratio, L*) comes from
// scripts/lib/layerTokens.mjs, the same module the layer contrast guard and the
// contrast audit read. CIEDE2000 and the CVD simulation live here because this
// is the only thing in the repo that needs them.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'
// The module is imported by its own path because src/main.ts pulls in
// `virtual:icons` and `virtual:flags`, which exist only under the library's
// own vite config (the same reason component-registration.test.ts reads the
// entry as text). Reachability from `@nubisco/ui` is therefore asserted
// against the text of src/main.ts, below, and it has to be: half of this
// surface (both ramps) cannot be reached by setting a custom property, so an
// entry that forgets it makes the documented examples uncompilable.
import {
  CHART_ROLE_COUNT,
  DEFAULT_PALETTE,
  chartRole,
  colorAt,
  divergingAt,
  rampSteps,
  sequentialAt,
  seriesColors,
} from '../src/components/Charts/shared/palette'

const ROOT = resolve(__dirname, '..')
const theme = loadThemeResolvers()

/** The exact ramps palette.ts named inline before the roles existed. */
const LEGACY_LIGHT_RAMPS = [
  '--nb-c-grape-hyacinth-500',
  '--nb-c-the-blues-brothers-500',
  '--nb-c-emerald-reflection-600',
  '--nb-c-phoenix-flames-500',
  '--nb-c-chicken-comb-500',
  '--nb-c-liberty-blue-500',
  '--nb-c-powder-blue-500',
  '--nb-c-nouveau-gray-500',
]

const roles = (mode: 'light' | 'dark'): string[] =>
  Array.from({ length: CHART_ROLE_COUNT }, (_, i) =>
    theme[mode](`--nb-c-chart-${i + 1}`),
  ) as string[]

// ─── colour maths ───────────────────────────────────────────────────────────

const toLinear = (c: number): number => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const fromLinear = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.min(255, Math.max(0, v * 255))
}
const apply = (m: number[][], v: number[]): number[] =>
  m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2])

function toLab(color: string): [number, number, number] {
  const rgb = parseColor(color) as number[]
  const [r, g, b] = rgb.map(toLinear)
  const xyz = [
    (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883,
  ]
  const f = (t: number) =>
    t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29
  const [fx, fy, fz] = xyz.map(f)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/** CIEDE2000. Perceptual distance; roughly, 2 is "a trained eye can tell". */
function dE2000(c1: string, c2: string): number {
  const [L1, a1, b1] = toLab(c1)
  const [L2, a2, b2] = toLab(c2)
  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cbar = (C1 + C2) / 2
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)))
  const A1 = (1 + G) * a1
  const A2 = (1 + G) * a2
  const Cp1 = Math.hypot(A1, b1)
  const Cp2 = Math.hypot(A2, b2)
  const hue = (a: number, b: number) => {
    if (a === 0 && b === 0) return 0
    const d = (Math.atan2(b, a) * 180) / Math.PI
    return d < 0 ? d + 360 : d
  }
  const h1 = hue(A1, b1)
  const h2 = hue(A2, b2)
  const dLp = L2 - L1
  const dCp = Cp2 - Cp1
  let dhp = 0
  if (Cp1 * Cp2 !== 0) {
    dhp = h2 - h1
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * Math.PI) / 360)
  const Lbar = (L1 + L2) / 2
  const Cpbar = (Cp1 + Cp2) / 2
  let hbar = (h1 + h2) / 2
  if (Cp1 * Cp2 !== 0 && Math.abs(h1 - h2) > 180) {
    hbar = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2
  }
  const T =
    1 -
    0.17 * Math.cos(((hbar - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * hbar * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hbar + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * hbar - 63) * Math.PI) / 180)
  const Sl = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2)
  const Sc = 1 + 0.045 * Cpbar
  const Sh = 1 + 0.015 * Cpbar * T
  const Rt =
    -2 *
    Math.sqrt(Cpbar ** 7 / (Cpbar ** 7 + 25 ** 7)) *
    Math.sin((2 * 30 * Math.exp(-(((hbar - 275) / 25) ** 2)) * Math.PI) / 180)
  return Math.sqrt(
    (dLp / Sl) ** 2 +
      (dCp / Sc) ** 2 +
      (dHp / Sh) ** 2 +
      Rt * (dCp / Sc) * (dHp / Sh),
  )
}

// Viénot, Brettel and Mollon (1999) dichromat simulation, in LMS.
const RGB_TO_LMS = [
  [0.31399022, 0.63951294, 0.04649755],
  [0.15537241, 0.75789446, 0.08670142],
  [0.01775239, 0.10944209, 0.87256922],
]
const LMS_TO_RGB = [
  [5.47221206, -4.6419601, 0.16963708],
  [-1.1252419, 2.29317094, -0.1678952],
  [0.02980165, -0.19318073, 1.16364789],
]
const CVD: Record<string, number[][]> = {
  deuteranopia: [
    [1, 0, 0],
    [0.9513092, 0, 0.44758864],
    [0, 0, 1],
  ],
  protanopia: [
    [0, 1.05118294, -0.05116099],
    [0, 1, 0],
    [0, 0, 1],
  ],
  tritanopia: [
    [1, 0, 0],
    [0, 1, 0],
    [-0.86744736, 1.86727089, 0],
  ],
}
function simulate(color: string, kind: keyof typeof CVD | 'normal'): string {
  if (kind === 'normal') return color
  const lms = apply(RGB_TO_LMS, (parseColor(color) as number[]).map(toLinear))
  const back = apply(LMS_TO_RGB, apply(CVD[kind], lms))
  return `rgb(${back.map(fromLinear).join(',')})`
}

/** Smallest CIEDE2000 between any two of the first `n` roles. */
function minSeparation(
  colors: string[],
  n: number,
  kind: keyof typeof CVD | 'normal' = 'normal',
): number {
  const seen = colors.slice(0, n).map((c) => simulate(c, kind))
  let min = Infinity
  for (let i = 0; i < seen.length; i++) {
    for (let j = i + 1; j < seen.length; j++) {
      min = Math.min(min, dE2000(seen[i], seen[j]))
    }
  }
  return min
}

// ─── the module ─────────────────────────────────────────────────────────────

describe('chart palette module', () => {
  it('addresses colour by role, never by brand ramp', () => {
    expect(DEFAULT_PALETTE).toEqual([
      'var(--nb-c-chart-1)',
      'var(--nb-c-chart-2)',
      'var(--nb-c-chart-3)',
      'var(--nb-c-chart-4)',
      'var(--nb-c-chart-5)',
      'var(--nb-c-chart-6)',
      'var(--nb-c-chart-7)',
      'var(--nb-c-chart-8)',
    ])
    // Every chart component, not just this module: the leak that started this
    // was one hardcoded ramp in one chart, and a second one survived the first
    // attempt at fixing it. Ramp names may be discussed in comments; none may
    // be painted anywhere under Charts/.
    const files = readdirSync(resolve(ROOT, 'src/components/Charts'), {
      recursive: true,
    })
      .map(String)
      .filter((f) => /\.(vue|ts)$/.test(f))
    expect(files.length).toBeGreaterThan(8)

    const RAMP =
      /var\(--nb-c-(grape|the-blues|emerald|phoenix|chicken|liberty|powder|nouveau)/
    for (const file of files) {
      const source = readFileSync(
        resolve(ROOT, 'src/components/Charts', file),
        'utf8',
      )
      source.split('\n').forEach((line, i) => {
        const t = line.trim()
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'))
          return
        if (RAMP.test(line)) {
          throw new Error(`brand ramp painted at Charts/${file}:${i + 1}`)
        }
      })
    }
  })

  it('wraps colorAt at the role count and keeps index 0 on role 1', () => {
    expect(colorAt(0)).toBe('var(--nb-c-chart-1)')
    expect(colorAt(7)).toBe('var(--nb-c-chart-8)')
    expect(colorAt(8)).toBe(colorAt(0))
    expect(colorAt(19)).toBe(colorAt(19 % CHART_ROLE_COUNT))
    expect(colorAt(1, ['red', 'blue'])).toBe('blue')
    expect(colorAt(2, ['red', 'blue'])).toBe('red')
  })

  it('chartRole is 1-based and wraps in both directions', () => {
    expect(chartRole(1)).toBe('var(--nb-c-chart-1)')
    expect(chartRole(8)).toBe('var(--nb-c-chart-8)')
    expect(chartRole(9)).toBe('var(--nb-c-chart-1)')
    expect(chartRole(0)).toBe('var(--nb-c-chart-8)')
  })

  it('mixes ramps in oklab, at paint time, from the anchor tokens', () => {
    expect(sequentialAt(0)).toBe(
      'color-mix(in oklab, var(--nb-c-chart-sequential-to) 0.00%, var(--nb-c-chart-sequential-from))',
    )
    expect(sequentialAt(1)).toContain('var(--nb-c-chart-sequential-to) 100.00%')
    expect(sequentialAt(0.25)).toContain('25.00%')
    // Out-of-domain input clamps rather than producing an invalid colour.
    expect(sequentialAt(4)).toBe(sequentialAt(1))
    expect(sequentialAt(-1)).toBe(sequentialAt(0))
    expect(sequentialAt(Number.NaN)).toBe(sequentialAt(0))
  })

  it('pins the diverging neutral at the midpoint', () => {
    expect(divergingAt(0)).toContain('var(--nb-c-chart-diverging-low)')
    expect(divergingAt(0.5)).toContain(
      'var(--nb-c-chart-diverging-mid) 100.00%',
    )
    expect(divergingAt(1)).toContain('var(--nb-c-chart-diverging-high) 100.00%')
    // Symmetric inputs sit symmetrically either side of the neutral.
    expect(divergingAt(0.25)).toContain(
      'var(--nb-c-chart-diverging-mid) 50.00%',
    )
    expect(divergingAt(0.75)).toContain(
      'var(--nb-c-chart-diverging-high) 50.00%',
    )
  })

  it('falls back to the roles when handed an empty palette', () => {
    // The chart components default `colors` to `[]`, so this path is the
    // common one, not the exotic one. `[] [0 % 0]` is `undefined`, and an
    // undefined SVG fill paints black.
    expect(colorAt(0, [])).toBe('var(--nb-c-chart-1)')
    expect(colorAt(3, [])).toBe('var(--nb-c-chart-4)')
    expect(colorAt(-1)).toBe('var(--nb-c-chart-8)')
    expect(colorAt(Number.NaN)).toBe('var(--nb-c-chart-1)')
  })

  it('curates a set per series count, nested so nothing recolours', () => {
    expect(seriesColors(0)).toEqual([])
    expect(seriesColors(-3)).toEqual([])
    expect(seriesColors(Number.NaN)).toEqual([])
    expect(seriesColors(3)).toEqual([
      'var(--nb-c-chart-2)',
      'var(--nb-c-chart-4)',
      'var(--nb-c-chart-5)',
    ])
    expect(seriesColors(3, { mark: 'line' })).toEqual([
      'var(--nb-c-chart-2)',
      'var(--nb-c-chart-5)',
      'var(--nb-c-chart-8)',
    ])
    // Nesting is the promise the docs make: adding a series appends, it never
    // recolours the series already drawn. Both orders, every count.
    for (const mark of ['fill', 'line'] as const) {
      for (let n = 1; n < CHART_ROLE_COUNT; n++) {
        expect(seriesColors(n + 1, { mark })).toEqual([
          ...seriesColors(n, { mark }),
          seriesColors(n + 1, { mark })[n],
        ])
      }
      // A permutation of the eight roles, so no role is spent twice.
      expect(new Set(seriesColors(8, { mark })).size).toBe(CHART_ROLE_COUNT)
    }
    // Past eight it wraps, exactly like colorAt, and is just as illegible.
    expect(seriesColors(9)[8]).toBe(seriesColors(1)[0])
  })

  it('bins a ramp into evenly spaced stops', () => {
    const five = rampSteps(5)
    expect(five).toHaveLength(5)
    expect(five[0]).toBe(sequentialAt(0))
    expect(five[4]).toBe(sequentialAt(1))
    expect(five[2]).toContain('50.00%')
    expect(rampSteps(1)).toEqual([sequentialAt(1)])
    expect(rampSteps(3, divergingAt)[1]).toContain('diverging-mid')
  })
})

describe('package entry', () => {
  it('re-exports every symbol the palette module exports', () => {
    // The failure this exists for: the roles are settable as CSS custom
    // properties, so the categorical half of the contract works even when the
    // entry forgets this module, while `sequentialAt` and `divergingAt` build
    // a `color-mix()` in JS and have no CSS equivalent at all. A missing line
    // here silently deletes the non-categorical half of the API and the docs
    // keep telling people to import it.
    const paletteSrc = readFileSync(
      resolve(ROOT, 'src/components/Charts/shared/palette.ts'),
      'utf8',
    )
    const mainSrc = readFileSync(resolve(ROOT, 'src/main.ts'), 'utf8')

    const exported = [
      ...paletteSrc.matchAll(/^export (?:type )?\{([^}]*)\}/gm),
    ].flatMap((m) =>
      m[1]
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
    )
    expect(exported).toContain('sequentialAt')
    expect(exported).toContain('divergingAt')
    expect(exported.length).toBeGreaterThanOrEqual(8)

    const reExports = [
      ...mainSrc.matchAll(
        /export (?:type )?\{([^}]*)\} from '\.\/components\/Charts\/shared\/palette'/g,
      ),
    ]
      .flatMap((m) => m[1].split(','))
      .map((n) => n.trim())
      .filter(Boolean)

    for (const name of exported) expect(reExports).toContain(name)
  })
})

// ─── the tokens ─────────────────────────────────────────────────────────────

describe('chart role tokens', () => {
  it('exist and resolve to a literal colour in both themes', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const c of roles(mode)) {
        expect(parseColor(c)).not.toBeNull()
      }
      for (const name of [
        '--nb-c-chart-sequential-from',
        '--nb-c-chart-sequential-to',
        '--nb-c-chart-diverging-low',
        '--nb-c-chart-diverging-mid',
        '--nb-c-chart-diverging-high',
      ]) {
        expect(parseColor(theme[mode](name) as string)).not.toBeNull()
      }
    }
  })

  it('repaints nothing in the light theme: role N is the ramp it replaced', () => {
    const now = roles('light')
    LEGACY_LIGHT_RAMPS.forEach((ramp, i) => {
      expect(now[i]).toBe(theme.light(ramp))
    })
  })

  it('repaints every dark-theme chart, and is worth it', () => {
    // This is the upgrade's one visible change and the release note says so.
    // Before the roles existed the palette named ramp-500s with no theme
    // branch, so a dark chart painted the light colours on a dark ground.
    // Every role now moves, which means every dark chart in every consuming
    // app changes colour once, on upgrade.
    const light = roles('light')
    const dark = roles('dark')
    expect(dark.filter((c, i) => c !== light[i])).toHaveLength(CHART_ROLE_COUNT)

    // The justification, asserted rather than asserted-in-prose: for the three
    // roles that failed WCAG 1.4.11 on a dark surface, the new value clears
    // the bar the old one missed, and no role gets worse.
    const worstOnDark = (c: string) =>
      Math.min(
        ...['--nb-c-layer-0', '--nb-c-layer-1', '--nb-c-layer-2'].map(
          (l) => ratio(c, theme.dark(l)) as number,
        ),
      )
    // Six of the eight light values miss 3:1 on a dark ground; the page names
    // the two that do not, so those two are pinned and the rest is a floor.
    const survives = light
      .map((c, i) => (worstOnDark(c) >= 3 ? i + 1 : null))
      .filter(Boolean)
    expect(survives).toEqual([3, 4])
    light.forEach((was, i) => {
      expect(worstOnDark(dark[i])).toBeGreaterThanOrEqual(
        Math.min(worstOnDark(was), 3),
      )
    })
  })

  it('clears 3:1 against every surface a chart lands on', () => {
    // WCAG 1.4.11: non-text graphics need 3:1 against the adjacent colour.
    // Charts are supported on layer-0 through layer-2. Layer-3 is excluded
    // deliberately: the docs say charts do not belong there in the dark
    // theme, where four roles sit in the 2.7 to 2.9 band.
    const NON_TEXT = 3
    const SURFACES = ['--nb-c-layer-0', '--nb-c-layer-1', '--nb-c-layer-2']
    // The two light roles that miss, as worst case across those surfaces.
    // Held as ceilings, not skipped: they cannot get worse, and fixing one
    // (a visual change, queued for the next major) fails here loudly rather
    // than leaving the docs claiming a failure that no longer exists.
    const LIGHT_EXCEPTIONS: Record<number, number> = { 3: 2.69, 4: 1.75 }

    roles('light').forEach((c, i) => {
      const worst = Math.min(
        ...SURFACES.map((l) => ratio(c, theme.light(l)) as number),
      )
      const documented = LIGHT_EXCEPTIONS[i + 1]
      if (documented) expect(worst).toBeCloseTo(documented, 1)
      else expect(worst).toBeGreaterThanOrEqual(NON_TEXT)
    })

    // The dark set has no exceptions: all eight clear the bar.
    roles('dark').forEach((c) => {
      for (const layer of SURFACES) {
        expect(ratio(c, theme.dark(layer))).toBeGreaterThanOrEqual(NON_TEXT)
      }
    })

    // And the layer-3 caveat the docs state is real, so it stays stated.
    const onLayer3 = roles('dark').map(
      (c) => ratio(c, theme.dark('--nb-c-layer-3')) as number,
    )
    expect(Math.min(...onLayer3)).toBeLessThan(NON_TEXT)
  })

  it('keeps the documented separation, including under colour-vision deficiency', () => {
    // Two assertions per figure, and the pair is the point.
    //
    // `near` is a change detector: it says the number printed in
    // docs/ui/components/charts/color.md is still the number the stylesheet
    // produces, so the page cannot quietly drift away from the palette. On its
    // own it is a bad guard, because improving the palette fails it and the
    // only way out is editing the expectation, which is indistinguishable from
    // covering up a regression.
    //
    // `atLeast` is the actual bar: the floor below which the guidance on the
    // page (colour alone up to five series, direct labels at six) stops being
    // true. A change that raises a figure trips only `near`, and the fix is to
    // reprint the page. A change that lowers one past the floor trips both,
    // and the fix is to put the palette back.
    const light = roles('light')
    const near = (actual: number, documented: number) =>
      expect(Math.abs(actual - documented)).toBeLessThan(0.1)
    const atLeast = (actual: number, floor: number) =>
      expect(actual).toBeGreaterThanOrEqual(floor)

    near(minSeparation(light, 5), 16.0)
    near(minSeparation(light, 6), 10.0)
    near(minSeparation(light, 8), 6.5)
    // Five series in role order have to stay comfortably distinguishable to a
    // reader with typical colour vision, since that is what the page permits
    // without direct labels. 10 is roughly "obvious at a glance".
    atLeast(minSeparation(light, 5), 10)
    atLeast(minSeparation(light, 6), 5)

    near(minSeparation(light, 5, 'deuteranopia'), 5.2)
    near(minSeparation(light, 6, 'deuteranopia'), 5.2)
    near(minSeparation(light, 8, 'deuteranopia'), 0.8)
    near(minSeparation(light, 5, 'protanopia'), 9.5)
    near(minSeparation(light, 6, 'protanopia'), 7.6)
    near(minSeparation(light, 8, 'protanopia'), 2.1)
    near(minSeparation(light, 5, 'tritanopia'), 12.8)
    near(minSeparation(light, 6, 'tritanopia'), 5.8)
    near(minSeparation(light, 8, 'tritanopia'), 5.8)
    // Floors under the same rows. The page tells a reader with a red-green
    // deficiency that five series in role order are usable but not
    // comfortable; below 4 that sentence would be a lie.
    atLeast(minSeparation(light, 5, 'deuteranopia'), 4)
    atLeast(minSeparation(light, 5, 'protanopia'), 7)
    atLeast(minSeparation(light, 5, 'tritanopia'), 7)

    // The dark set trades a little separation at the tail for contrast
    // (role 7 is a 350, see _theme.scss), so it is held to its own numbers.
    const dark = roles('dark')
    near(minSeparation(dark, 5), 15.4)
    near(minSeparation(dark, 8), 5.5)
    atLeast(minSeparation(dark, 5), 10)
    atLeast(minSeparation(dark, 5, 'deuteranopia'), 4)
  })

  it('curated sets beat role order at the same count, in both themes', () => {
    // The reason seriesColors() exists. Role order is frozen by backward
    // compatibility and opens with three violet-blues; these are the same
    // eight roles reordered so that every prefix is the best set of its size.
    // Asserted as a strict improvement rather than as fixed numbers, so the
    // claim survives any future repalette that keeps the search honest.
    const at = (
      mode: 'light' | 'dark',
      list: string[],
      kind: Parameters<typeof minSeparation>[2],
    ) =>
      minSeparation(
        list.map((v) => theme[mode](v.slice(4, -1)) as string),
        list.length,
        kind,
      )

    for (const mode of ['light', 'dark'] as const) {
      const order = DEFAULT_PALETTE
      for (let n = 3; n <= 7; n++) {
        for (const kind of ['deuteranopia', 'protanopia'] as const) {
          expect(at(mode, seriesColors(n), kind)).toBeGreaterThanOrEqual(
            at(mode, order.slice(0, n), kind),
          )
        }
      }
      // Every colour the line variant hands out clears 3:1 on the surfaces a
      // chart is supported on, up to the six roles that can manage it.
      for (const v of seriesColors(6, { mark: 'line' })) {
        const c = theme[mode](v.slice(4, -1)) as string
        for (const layer of [
          '--nb-c-layer-0',
          '--nb-c-layer-1',
          '--nb-c-layer-2',
        ]) {
          expect(ratio(c, theme[mode](layer))).toBeGreaterThanOrEqual(3)
        }
      }
    }

    // The printed figures for the five-series case, light theme.
    const near = (actual: number, documented: number) =>
      expect(Math.abs(actual - documented)).toBeLessThan(0.1)
    near(at('light', seriesColors(5), 'normal'), 17.9)
    near(at('light', seriesColors(5), 'deuteranopia'), 9.4)
    near(at('light', seriesColors(5), 'protanopia'), 14.1)
    near(at('light', seriesColors(5), 'tritanopia'), 12.8)
  })

  it('runs the sequential ramp the right way for each theme', () => {
    const lightness = (c: string) => toLab(c)[0]
    // Light page: the largest value is the darkest end.
    expect(
      lightness(theme.light('--nb-c-chart-sequential-from') as string),
    ).toBeGreaterThan(
      lightness(theme.light('--nb-c-chart-sequential-to') as string) + 40,
    )
    // Dark page: it inverts, so the largest value is the brightest end.
    expect(
      lightness(theme.dark('--nb-c-chart-sequential-to') as string),
    ).toBeGreaterThan(
      lightness(theme.dark('--nb-c-chart-sequential-from') as string) + 40,
    )
  })

  it('balances the diverging poles and keeps them out of the red/green axis', () => {
    for (const mode of ['light', 'dark'] as const) {
      const low = theme[mode]('--nb-c-chart-diverging-low') as string
      const high = theme[mode]('--nb-c-chart-diverging-high') as string
      const mid = theme[mode]('--nb-c-chart-diverging-mid') as string
      // Neither pole may look heavier than the other.
      expect(Math.abs(toLab(low)[0] - toLab(high)[0])).toBeLessThan(6)
      // The sign of a value has to survive deuteranopia.
      expect(
        dE2000(simulate(low, 'deuteranopia'), simulate(high, 'deuteranopia')),
      ).toBeGreaterThan(15)
      // The neutral has to read as neutral against both poles.
      expect(dE2000(mid, low)).toBeGreaterThan(20)
      expect(dE2000(mid, high)).toBeGreaterThan(20)
    }
  })
})

/**
 * Resolves `color-mix(in srgb, var(--a) N%, var(--b))` to a literal.
 *
 * scripts/lib/layerTokens.mjs follows `var()` chains but stops at a function,
 * which is correct for it (it audits literal surfaces). The one token that
 * needs a mix resolved is asserted here rather than teaching the shared module
 * a CSS colour algebra it has no other caller for.
 */
function mixInSrgb(value: string, mode: 'light' | 'dark'): string {
  const m = value.match(
    /color-mix\(\s*in srgb,\s*var\((--[\w-]+)\)\s*([\d.]+)%,\s*var\((--[\w-]+)\)\s*\)/,
  )
  if (!m) throw new Error(`not a two-stop srgb mix: ${value}`)
  const p = Number(m[2]) / 100
  const a = parseColor(theme[mode](m[1]) as string) as number[]
  const b = parseColor(theme[mode](m[3]) as string) as number[]
  return `rgb(${a.map((v, i) => v * p + b[i] * (1 - p)).join(',')})`
}

// ─── the brand leak in Button ───────────────────────────────────────────────

describe('ghost button hover border', () => {
  it('names a semantic role, not a brand ramp', () => {
    const source = readFileSync(
      resolve(ROOT, 'src/components/Button.vue'),
      'utf8',
    )
    expect(source).toContain('border-color: var(--nb-c-primary-subtle)')
    for (const line of source.split('\n')) {
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue
      if (line.includes('/*') || line.includes('*/')) continue
      expect(line).not.toMatch(/var\(--nb-c-grape-hyacinth/)
    }
  })

  it('derives from the brand, so a rebrand carries', () => {
    // An alias would have kept the pixel and kept the bug: a product that sets
    // --nb-c-primary would still get a violet edge, which is the whole defect.
    for (const mode of ['light', 'dark'] as const) {
      const value = String(theme[mode]('--nb-c-primary-subtle'))
      expect(value).toMatch(/^color-mix\(/)
      expect(value).toContain('var(--nb-c-primary)')
      expect(value).toContain('var(--nb-c-white)')
    }
  })

  it('lands within a just-noticeable difference of what shipped', () => {
    // dE2000 under 1.0 is the usual threshold for "a side-by-side comparison
    // is needed to see it at all". Held per theme, since the two mixes take
    // different percentages: the dark --nb-c-primary is already a lighter step
    // of the same ramp, so it needs less white to reach the same wash.
    for (const mode of ['light', 'dark'] as const) {
      const mixed = mixInSrgb(
        String(theme[mode]('--nb-c-primary-subtle')),
        mode,
      )
      const shipped = theme[mode]('--nb-c-grape-hyacinth-200') as string
      expect(dE2000(mixed, shipped)).toBeLessThan(1)
    }
    // And the dark mix is exact, so only one theme carries any drift at all.
    expect(
      dE2000(
        mixInSrgb(String(theme.dark('--nb-c-primary-subtle')), 'dark'),
        theme.dark('--nb-c-grape-hyacinth-200') as string,
      ),
    ).toBeLessThan(0.01)
  })
})
