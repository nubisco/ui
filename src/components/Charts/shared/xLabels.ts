// Which x-axis labels a chart shows, and where.
//
// The default is about six evenly spaced labels plus the last one. Every
// measured label is kept inside the svg, so a long first or last label is
// moved in from the edge instead of being cut off, and when that move brings
// it against its neighbour, the neighbour gives way. The rest of the default
// labels are kept whenever they fit side by side. Only when two of them would
// intersect, measured against the width the chart actually has, are they
// thinned to a wider step that leaves room between them.

interface IXLabelPlacement {
  index: number
  x: number
}

interface IXLabelLayout {
  // Number of points along the x axis.
  count: number
  // Centre of the label for point `i`, in svg pixels.
  positionOf: (i: number) => number
  // Rendered width of the label for point `i`, in pixels. Without it nothing
  // can be measured, so the default labels are returned as they are.
  widthOf?: (i: number) => number
  // Width of the svg. Measured labels are kept inside it.
  width?: number
  // Space left between two thinned labels.
  gap?: number
}

const DEFAULT_TARGET = 6
const THINNED_GAP = 8

// The evenly distributed labels every chart has always shown.
const defaultXLabelIndices = (count: number, target = DEFAULT_TARGET) => {
  const out: number[] = []
  if (count <= 0) return out
  const step = Math.max(1, Math.ceil(count / target))
  for (let i = 0; i < count; i += step) out.push(i)
  if (out[out.length - 1] !== count - 1) out.push(count - 1)
  return out
}

// True when no two neighbouring labels are closer than `gap`.
const labelsFit = (
  placed: IXLabelPlacement[],
  widthOf: (i: number) => number,
  gap: number,
) => {
  for (let k = 1; k < placed.length; k++) {
    const a = placed[k - 1]
    const b = placed[k]
    const aRight = a.x + widthOf(a.index) / 2
    const bLeft = b.x - widthOf(b.index) / 2
    if (bLeft - aRight < gap) return false
  }
  return true
}

// Moves a label in from the edge so its text is not cut off by the svg.
const clampInside = (x: number, labelWidth: number, width?: number) => {
  if (width === undefined || labelWidth >= width) return x
  const half = labelWidth / 2
  return Math.min(Math.max(x, half), width - half)
}

// The first and last labels always stay. When one of them sits against its
// neighbour, the neighbour gives way. `movedGap` applies instead of `gap` to
// an edge label that was moved in from the edge, so a label that moved never
// ends up cramped against the one beside it.
const edgesGiveWay = (
  placed: IXLabelPlacement[],
  widthOf: (i: number) => number,
  positionOf: (i: number) => number,
  gap: number,
  movedGap: number,
) => {
  const gapFor = (p: IXLabelPlacement) =>
    p.x === positionOf(p.index) ? gap : movedGap
  let out = placed
  const last = out[out.length - 1]
  if (out.length > 2 && !labelsFit(out.slice(-2), widthOf, gapFor(last))) {
    out = [...out.slice(0, -2), last]
  }
  if (out.length > 2 && !labelsFit(out.slice(0, 2), widthOf, gapFor(out[0]))) {
    out = [out[0], ...out.slice(2)]
  }
  return out
}

const layoutXLabels = ({
  count,
  positionOf,
  widthOf,
  width,
  gap = THINNED_GAP,
}: IXLabelLayout): IXLabelPlacement[] => {
  const defaults = defaultXLabelIndices(count)
  // Unmeasured: draw the default labels where they have always been.
  if (!widthOf) {
    return defaults.map((index) => ({ index, x: positionOf(index) }))
  }

  const place = (index: number) => ({
    index,
    x: clampInside(positionOf(index), widthOf(index), width),
  })
  // Only a neighbour of an edge label that was moved gives way here. Any
  // other overlap among the default labels is left to the thinning below.
  const base = edgesGiveWay(
    defaults.map(place),
    widthOf,
    positionOf,
    -Infinity,
    gap,
  )
  if (labelsFit(base, widthOf, 0)) return base

  const last = count - 1
  const firstStep = Math.max(1, Math.ceil(count / DEFAULT_TARGET)) + 1
  for (let step = firstStep; step <= last; step++) {
    const indices: number[] = []
    for (let i = 0; i < last; i += step) indices.push(i)
    const placed = edgesGiveWay(
      [...indices, last].map(place),
      widthOf,
      positionOf,
      gap,
      gap,
    )
    if (labelsFit(placed, widthOf, gap)) return placed
  }
  // Not even the first and last fit side by side: the first one alone.
  return [place(0)]
}

export { defaultXLabelIndices, layoutXLabels }
export type { IXLabelLayout, IXLabelPlacement }
