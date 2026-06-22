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
