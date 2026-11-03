import { computed, reactive } from 'vue'

/**
 * State the motion demos share.
 *
 * Every stage on the Motion pages carries the same slow-motion switch, and
 * they are one switch: a reader who slows one demo down to see a curve wants
 * every demo on the page slowed down. The factor scales the duration tokens
 * on each stage, which is also a live demonstration of the one way a product
 * retunes motion, by setting the tokens.
 */
export const SLOW_FACTOR = 4

export const motionDemo = reactive({ slow: false })

export interface IMotionStep {
  token: string
  ms: number
  moves: string
}

export const STEPS: IMotionStep[] = [
  {
    token: 'micro',
    ms: 70,
    moves: 'A tint. A switch track. A popover leaving.',
  },
  { token: 'quick', ms: 110, moves: 'A chevron. A tick. A popover arriving.' },
  { token: 'short', ms: 150, moves: 'A dialog or a drawer leaving.' },
  {
    token: 'medium',
    ms: 240,
    moves: 'The rail. The inspector. A dialog arriving.',
  },
  {
    token: 'long',
    ms: 400,
    moves: 'The ceiling. Nothing in the library needs it.',
  },
]

export interface IMotionCurve {
  token: string
  value: string
  points: [number, number, number, number]
  role: string
}

export const CURVES: IMotionCurve[] = [
  {
    token: 'standard',
    value: 'cubic-bezier(0.2, 0, 0.38, 0.9)',
    points: [0.2, 0, 0.38, 0.9],
    role: 'On screen before and after',
  },
  {
    token: 'enter',
    value: 'cubic-bezier(0, 0, 0.38, 0.9)',
    points: [0, 0, 0.38, 0.9],
    role: 'Arriving',
  },
  {
    token: 'exit',
    value: 'cubic-bezier(0.2, 0, 1, 0.9)',
    points: [0.2, 0, 1, 0.9],
    role: 'Leaving for good',
  },
]

/**
 * The duration tokens, scaled, as inline custom properties for a stage. The
 * stage's children, library components included, read the scaled values the
 * same way they read the real ones from `:root`.
 */
export const slowTokens = computed<Record<string, string>>(() => {
  if (!motionDemo.slow) return {}
  const out: Record<string, string> = {}
  for (const { token, ms } of STEPS)
    out[`--nb-motion-${token}`] = `${ms * SLOW_FACTOR}ms`
  out['--nb-motion-loop'] = `${1000 * SLOW_FACTOR}ms`
  return out
})

/** The SVG path of a cubic bezier curve in a square of `size` px. */
export function curvePath(
  [x1, y1, x2, y2]: IMotionCurve['points'],
  size: number,
): string {
  const px = (x: number) => (x * size).toFixed(1)
  const py = (y: number) => ((1 - y) * size).toFixed(1)
  return `M0,${size} C${px(x1)},${py(y1)} ${px(x2)},${py(y2)} ${size},0`
}
