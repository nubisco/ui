// Parsing and sampling for the cubic-bezier wire paths NbBlueprint produces.
//
// NbBlueprint's `computedWires` emits each wire as an SVG path string of the
// exact form `M fx fy C c1x c1y, c2x c2y, tx ty` (see Blueprint.vue). The
// PixiJS renderer re-draws those same curves with `Graphics.bezierCurveTo`,
// and the flow animation samples them into points. This module turns the
// path string into structured control points and sampled polylines. It has
// no PixiJS dependency so it stays in the always-loaded bundle and is unit
// testable without a WebGL context.

export interface ICubicBezier {
  /** Start point [x, y]. */
  p0: [number, number]
  /** First control point. */
  c1: [number, number]
  /** Second control point. */
  c2: [number, number]
  /** End point. */
  p3: [number, number]
}

const NUMBER_RE = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi

/**
 * Parse a `M x y C x y x y x y` cubic path string into control points.
 * Returns null if the string does not contain the expected 8 numbers (so a
 * malformed or non-cubic path is skipped rather than throwing).
 */
export function parseCubicPath(d: string): ICubicBezier | null {
  const m = d.match(NUMBER_RE)
  if (!m || m.length < 8) return null
  const n = m.slice(0, 8).map(Number)
  if (n.some((v) => Number.isNaN(v))) return null
  return {
    p0: [n[0]!, n[1]!],
    c1: [n[2]!, n[3]!],
    c2: [n[4]!, n[5]!],
    p3: [n[6]!, n[7]!],
  }
}

/** Evaluate a cubic bezier at parameter t in [0, 1]. */
export function cubicAt(b: ICubicBezier, t: number): [number, number] {
  const mt = 1 - t
  const a = mt * mt * mt
  const c = 3 * mt * mt * t
  const e = 3 * mt * t * t
  const f = t * t * t
  return [
    a * b.p0[0] + c * b.c1[0] + e * b.c2[0] + f * b.p3[0],
    a * b.p0[1] + c * b.c1[1] + e * b.c2[1] + f * b.p3[1],
  ]
}

/**
 * Sample a cubic bezier into `segments + 1` points. Used by the flow
 * animation to walk evenly-ish along the wire. `segments` is a fixed count
 * (not arc-length parameterised) which is plenty for a short connector.
 */
export function sampleCubic(
  b: ICubicBezier,
  segments: number,
): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= segments; i++) pts.push(cubicAt(b, i / segments))
  return pts
}

/** Resolution of the intermediate arc-length table. A cubic is smooth enough
 *  that this many chords measure its length to well under a pixel. */
const ARC_LUT = 192

/**
 * Resample a cubic into `segments + 1` points spaced evenly by ARC LENGTH,
 * packed as [x, y, nx, ny] per sample where (nx, ny) is the unit normal.
 *
 * Even in `t` is NOT even in distance: a cubic's parameter bunches where the
 * curve is tight, so t-uniform samples crowd near the ends of a typical wire
 * and stretch through the middle. Anything drawn along the wire at a fixed
 * spatial frequency (the 'vibrate' wave) would visibly squash and stretch
 * along a single wire. Sampling by arc length makes the spacing physical, so
 * one sample step is one constant distance in world px.
 */
export function resampleUniformArc(
  b: ICubicBezier,
  segments: number,
): Float32Array {
  const xs = new Float64Array(ARC_LUT + 1)
  const ys = new Float64Array(ARC_LUT + 1)
  const cum = new Float64Array(ARC_LUT + 1)
  for (let i = 0; i <= ARC_LUT; i++) {
    const [x, y] = cubicAt(b, i / ARC_LUT)
    xs[i] = x
    ys[i] = y
    if (i) cum[i] = cum[i - 1]! + Math.hypot(x - xs[i - 1]!, y - ys[i - 1]!)
  }
  const length = cum[ARC_LUT]!
  const out = new Float32Array((segments + 1) * 4)
  let j = 0
  for (let i = 0; i <= segments; i++) {
    const target = (i / segments) * length
    while (j < ARC_LUT - 1 && cum[j + 1]! < target) j++
    const seg = cum[j + 1]! - cum[j]! || 1
    const f = (target - cum[j]!) / seg
    let tx = xs[j + 1]! - xs[j]!
    let ty = ys[j + 1]! - ys[j]!
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const o = i * 4
    out[o] = xs[j]! + (xs[j + 1]! - xs[j]!) * f
    out[o + 1] = ys[j]! + (ys[j + 1]! - ys[j]!) * f
    out[o + 2] = -ty
    out[o + 3] = tx
  }
  return out
}

/** Arc length of a cubic, in the curve's own units. */
export function cubicLength(b: ICubicBezier): number {
  let length = 0
  let [px, py] = cubicAt(b, 0)
  for (let i = 1; i <= ARC_LUT; i++) {
    const [x, y] = cubicAt(b, i / ARC_LUT)
    length += Math.hypot(x - px, y - py)
    px = x
    py = y
  }
  return length
}

/**
 * Unit-amplitude offset of the 'vibrate' travelling wave at sample `i` of `n`,
 * for a polyline resampled at `samplesPerWave` samples per wavelength.
 *
 * The time term is SUBTRACTED, which is what makes the wave travel toward
 * higher `i`. Sample 0 is the path's `M` point, which Blueprint emits from the
 * *source* port, so the wave runs source -> destination: output -> input, the
 * direction the signal itself travels. Adding the time term instead runs every
 * wire backwards.
 *
 * The `sin(u * PI)` envelope pins the ends to zero so the stroke still starts
 * and finishes exactly on its two ports, and the wire reads as a plucked
 * string rather than a sawn-off ripple.
 */
export function vibrateOffset(
  i: number,
  n: number,
  samplesPerWave: number,
  phase: number,
): number {
  const env = Math.sin((i / n) * Math.PI)
  return Math.sin((i * (Math.PI * 2)) / samplesPerWave - phase) * env
}
