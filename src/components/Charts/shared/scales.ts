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

// ---------------------------------------------------------------------------
// Time-scale helpers (used by GanttChart)
// ---------------------------------------------------------------------------

type TTimeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface ITimelineTick {
  date: Date
  label: string
  x: number
}

// Return the start of the unit containing `d` (mutates nothing).
const startOf = (d: Date, unit: TTimeUnit): Date => {
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  if (unit === 'day') return s
  if (unit === 'week') {
    s.setDate(s.getDate() - s.getDay())
    return s
  }
  s.setDate(1)
  if (unit === 'month') return s
  if (unit === 'quarter') {
    s.setMonth(Math.floor(s.getMonth() / 3) * 3)
    return s
  }
  // year
  s.setMonth(0)
  return s
}

// Advance a date by one unit.
const advanceBy = (d: Date, unit: TTimeUnit): Date => {
  const n = new Date(d)
  if (unit === 'day') n.setDate(n.getDate() + 1)
  else if (unit === 'week') n.setDate(n.getDate() + 7)
  else if (unit === 'month') n.setMonth(n.getMonth() + 1)
  else if (unit === 'quarter') n.setMonth(n.getMonth() + 3)
  else n.setFullYear(n.getFullYear() + 1)
  return n
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const formatTickLabel = (d: Date, unit: TTimeUnit): string => {
  if (unit === 'day') return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`
  if (unit === 'week') return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`
  if (unit === 'month')
    return `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  if (unit === 'quarter')
    return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
  return String(d.getFullYear())
}

// Generate timeline tick marks between two dates at the given granularity.
// `pxPerMs` converts milliseconds to pixel offset from `origin`.
const timelineTicks = (
  minDate: Date,
  maxDate: Date,
  unit: TTimeUnit,
  pxPerMs: number,
  originMs: number,
): ITimelineTick[] => {
  const ticks: ITimelineTick[] = []
  let cursor = startOf(new Date(minDate), unit)
  // Step back one unit so labels before the visible range still show.
  cursor = startOf(cursor, unit)
  const limit = advanceBy(new Date(maxDate), unit).getTime()
  while (cursor.getTime() <= limit) {
    ticks.push({
      date: new Date(cursor),
      label: formatTickLabel(cursor, unit),
      x: (cursor.getTime() - originMs) * pxPerMs,
    })
    cursor = advanceBy(cursor, unit)
  }
  return ticks
}

// Map a Date (or ISO string) to a pixel x position.
const dateToX = (
  date: Date | string,
  originMs: number,
  pxPerMs: number,
): number => {
  const ms =
    typeof date === 'string' ? new Date(date).getTime() : date.getTime()
  return (ms - originMs) * pxPerMs
}

export {
  linear,
  band,
  niceTicks,
  padDomain,
  timelineTicks,
  dateToX,
  startOf,
  advanceBy,
}
export type { ILinearScale, IBandScale, ITimelineTick, TTimeUnit }
