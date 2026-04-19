// Minimal scale + tick utilities. Lightweight stand-ins for the parts of
// d3-scale we actually need at this stage; they keep the chart components
// dependency-free until the more advanced charts (sankey, force, hierarchy)
// pull in d3 modules.

interface ILinearScale {
  (value: number): number
  domain: readonly [number, number]
  range: readonly [number, number]
  ticks: (count?: number) => number[]
}

const linear = (
  domain: readonly [number, number],
  range: readonly [number, number],
): ILinearScale => {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  const fn = ((value: number) =>
    r0 + ((value - d0) / span) * (r1 - r0)) as ILinearScale
  fn.domain = domain
  fn.range = range
  fn.ticks = (count = 5) => niceTicks(d0, d1, count)
  return fn
}

interface IBandScale {
  (key: string | number): number
  bandwidth: number
  domain: readonly (string | number)[]
  range: readonly [number, number]
}

const band = (
  domain: readonly (string | number)[],
  range: readonly [number, number],
  padding = 0.2,
): IBandScale => {
  const [r0, r1] = range
  const step = (r1 - r0) / Math.max(domain.length, 1)
  const bandwidth = step * (1 - padding)
  const offset = (step - bandwidth) / 2
  const index = new Map(domain.map((k, i) => [k, i]))
  const fn = ((key: string | number) => {
    const i = index.get(key)
    if (i === undefined) return r0
    return r0 + i * step + offset
  }) as IBandScale
  fn.bandwidth = bandwidth
  fn.domain = domain
  fn.range = range
  return fn
}

// Produce evenly spaced "nice" tick values (1/2/5 × 10^n) covering [min,max].
const niceTicks = (min: number, max: number, count = 5): number[] => {
  if (min === max) return [min]
  const span = max - min
  const rough = span / Math.max(count, 1)
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)))
  const candidates = [1, 2, 5, 10].map((m) => m * pow10)
  const step =
    candidates.find((c) => span / c <= count * 1.5) ??
    candidates[candidates.length - 1]
  const start = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step / 2; v += step) {
    ticks.push(Number(v.toFixed(10)))
  }
  return ticks
}

// Pad a numeric domain so values aren't flush against axes / chart edges.
const padDomain = (
  min: number,
  max: number,
  ratio = 0.05,
): [number, number] => {
  if (min === max) {
    const delta = Math.abs(min) || 1
    return [min - delta, max + delta]
  }
  const pad = (max - min) * ratio
  return [min - pad, max + pad]
}

export { linear, band, niceTicks, padDomain }
export type { ILinearScale, IBandScale }
