// Which x-axis labels a chart shows, and where.
//
// The default is about six evenly spaced labels plus the last one. That is
// what every chart has always drawn, and it is kept whenever those labels fit
// side by side. Only when two of them would intersect, measured against the
// width the chart actually has, are they thinned to a wider step that leaves
// room between them. A chart that fits today renders exactly as it did.

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
  // Width of the svg. Thinned labels are kept inside it.
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

const layoutXLabels = ({
  count,
  positionOf,
  widthOf,
  width,
  gap = THINNED_GAP,
}: IXLabelLayout): IXLabelPlacement[] => {
  const base = defaultXLabelIndices(count).map((index) => ({
    index,
    x: positionOf(index),
  }))
  // Unmeasured, or the default labels do not touch: draw them untouched.
  if (!widthOf || labelsFit(base, widthOf, 0)) return base

  const last = count - 1
  const place = (index: number) => ({
    index,
    x: clampInside(positionOf(index), widthOf(index), width),
  })
  const firstStep = Math.max(1, Math.ceil(count / DEFAULT_TARGET)) + 1
  for (let step = firstStep; step <= last; step++) {
    const indices: number[] = []
    for (let i = 0; i < last; i += step) indices.push(i)
    let placed = [...indices, last].map(place)
    // The last point always keeps its label. When the step lands just
    // before it, the label in between gives way instead.
    if (placed.length > 2 && !labelsFit(placed.slice(-2), widthOf, gap)) {
      placed = [...placed.slice(0, -2), placed[placed.length - 1]]
    }
    if (labelsFit(placed, widthOf, gap)) return placed
  }
  // Not even the first and last fit side by side: the first one alone.
  return [place(0)]
}

export { defaultXLabelIndices, layoutXLabels }
export type { IXLabelLayout, IXLabelPlacement }
