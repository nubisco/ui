import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * The motion docs make two claims, and this file is what keeps them true.
 *
 * 1. Nothing in the library writes a duration as a literal, except a loop.
 *    Every transition and every one-shot animation reads a `--nb-motion-*`
 *    step. A loop is the documented exception (the spinner, skeleton and
 *    progress loops are deliberately spread so two on one screen do not beat
 *    against each other), and each one has to be named in `LOOPS` below, with
 *    its reason, so a new loop is justified where it is added.
 * 2. The reduced-motion preference is written one way, `@include
 *    motion.reduced`. A raw `@media (prefers-reduced-motion)` is a handler a
 *    grep for the mixin would miss.
 *
 * The scan is textual, over source, because the claim is about source.
 */

const root = join(__dirname, '..')
const SCANNED = ['src/components', 'src/styles', 'src/directives']

/**
 * Loops allowed a literal duration: the file (relative to the repo root) and
 * the keyframe names its looping declarations run.
 */
const LOOPS: Record<string, string[]> = {
  // Tuned per indicator: a 900ms spin, a 1600ms breathe under reduced motion.
  'src/components/Spinner.vue': ['nb-spinner-spin', 'nb-spinner-breathe'],
  // A 1600ms sweep, a 2000ms fade under reduced motion.
  'src/components/Skeleton.vue': ['nb-skeleton-sweep', 'nb-skeleton-fade'],
  // A 1400ms indeterminate sweep, a 2000ms pulse under reduced motion.
  'src/components/ProgressBar.vue': [
    'nb-progress-bar-indeterminate',
    'nb-progress-bar-pulse',
  ],
  // The button's own ring, quicker than NbSpinner's because it is smaller.
  'src/components/Button.vue': ['nb-spin', 'nb-button-spinner-breathe'],
  'src/components/FileUploader.vue': ['nb-spin', 'nb-file-uploader-breathe'],
  'src/components/DataTable.vue': [
    'nb-data-table-shimmer',
    'nb-data-table-fade',
  ],
  // Marching ants and wire flow are dash offsets, timed to the dash length.
  'src/components/Blueprint.vue': ['nb-marching-ants'],
  'src/components/BlueprintDomRenderer.vue': [
    'nb-wire-flow',
    'nb-wire-breathe',
  ],
  // The decorative icon animations (the `animation` prop). Every one of them
  // is a loop, and the icon component owns them.
  'src/components/Icon.vue': ['*'],
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (/\.(vue|scss|ts)$/.test(name) && !name.endsWith('.d.ts'))
      out.push(path)
  }
  return out
}

// Comments are blanked rather than removed, so line numbers still point at
// the source. Prose about a transition is not a transition.
function stripComments(src: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, ' ')
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(?<![:'"\w])\/\/.*$/gm, blank)
}

const files = SCANNED.flatMap((d) => walk(join(root, d))).map((path) => ({
  rel: relative(root, path),
  src: stripComments(readFileSync(path, 'utf8')),
}))

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split('\n').length
}

// A transition or animation declaration in CSS, which may span lines, or an
// inline `style.transition = ...` / `style.animation = ...` in script.
const DECLARATION =
  /(?:^|[\s{;])(?:transition|animation)(?:-duration|-delay)?\s*:\s*([^;{}]*);|\.style\.(?:transition|animation)\s*=\s*(`[^`]*`|'[^']*')/g
// A number with a time unit. `0s` and `0ms` are not a choice of step.
const DURATION = /(?<![\w.$-])(\d*\.?\d+)(ms|s)\b/g

describe('motion conformance', () => {
  it('writes no literal duration outside a listed loop', () => {
    const offenders: string[] = []
    for (const { rel, src } of files) {
      for (const m of src.matchAll(DECLARATION)) {
        const value = m[1] ?? m[2] ?? ''
        const literals = [...value.matchAll(DURATION)].filter(
          (d) => Number(d[1]) !== 0,
        )
        if (!literals.length) continue
        const allowed = LOOPS[rel]
        const isLoop = /\binfinite\b/.test(value)
        const name = value.trim().split(/\s+/)[0]
        if (
          isLoop &&
          allowed &&
          (allowed.includes('*') || allowed.includes(name))
        )
          continue
        offenders.push(
          `${rel}:${lineOf(src, m.index ?? 0)}  ${value.trim().replace(/\s+/g, ' ')}`,
        )
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('writes the reduced-motion preference only through motion.reduced', () => {
    const offenders = files
      .filter(({ rel }) => rel !== 'src/styles/logic/_motion.scss')
      .flatMap(({ rel, src }) =>
        [...src.matchAll(/@media[^{]*prefers-reduced-motion/g)].map(
          (m) => `${rel}:${lineOf(src, m.index ?? 0)}`,
        ),
      )
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('lists no loop that is no longer there', () => {
    const stale: string[] = []
    for (const [rel, names] of Object.entries(LOOPS)) {
      const file = files.find((f) => f.rel === rel)
      if (!file) {
        stale.push(rel)
        continue
      }
      for (const name of names)
        if (name !== '*' && !file.src.includes(`@keyframes ${name}`))
          stale.push(`${rel} ${name}`)
    }
    expect(stale, stale.join('\n')).toEqual([])
  })
})
