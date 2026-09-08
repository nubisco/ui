import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '../src/components/Charts/BarChart.vue'
import PieChart from '../src/components/Charts/PieChart.vue'

// jsdom has no layout, so ResizeObserver never fires and the chart keeps the
// fallback size it was constructed with. That is what makes the geometry here
// worth asserting: 480 x 240 with known margins gives exact numbers, so these
// read as arithmetic rather than as snapshots.
const WIDTH = 480
const HEIGHT = 240

const single = [
  {
    name: 'Sign-ups',
    data: [
      { x: 'Organic', y: 300 },
      { x: 'Referral', y: 100 },
    ],
  },
]

const grouped = [
  {
    name: 'EU',
    data: [
      { x: 'Q1', y: 30 },
      { x: 'Q2', y: 40 },
    ],
  },
  {
    name: 'NA',
    data: [
      { x: 'Q1', y: 20 },
      { x: 'Q2', y: 10 },
    ],
  },
]

const withNegatives = [
  {
    name: 'Net',
    data: [
      { x: 'Q1', y: 12 },
      { x: 'Q2', y: -8 },
    ],
  },
]

const mountChart = (props: Record<string, unknown> = {}, listeners = {}) =>
  mount(BarChart, { props: { series: single, ...props, ...listeners } })

const bars = (w: ReturnType<typeof mountChart>) =>
  w.findAll('rect.nb-chart__bar')
const num = (
  el: { attributes: (n: string) => string | undefined },
  name: string,
) => Number(el.attributes(name))

describe('NbBarChart: vertical orientation (the default)', () => {
  it('puts the categories on the x axis and the values on the y axis', () => {
    const w = mountChart()
    const [first, second] = bars(w)
    // Same width, different x: categories run across.
    expect(num(first, 'width')).toBe(num(second, 'width'))
    expect(num(second, 'x')).toBeGreaterThan(num(first, 'x'))
    // Taller bar for the larger value, and both sit on the same baseline.
    expect(num(first, 'height')).toBeGreaterThan(num(second, 'height'))
    expect(num(first, 'y') + num(first, 'height')).toBeCloseTo(
      num(second, 'y') + num(second, 'height'),
      5,
    )
  })

  it('places the category labels under the plot', () => {
    const w = mountChart()
    const labels = w
      .findAll('g.nb-chart__axis text')
      .filter((t) => ['Organic', 'Referral'].includes(t.text()))
    expect(labels).toHaveLength(2)
    labels.forEach((label) => {
      expect(num(label, 'y')).toBe(HEIGHT - 28 + 14)
      expect(label.attributes('text-anchor')).toBe('middle')
    })
  })

  it('draws gridlines across the plot', () => {
    const w = mountChart()
    const grid = w.findAll('line.nb-chart__gridline')
    expect(grid.length).toBeGreaterThan(0)
    grid.forEach((line) => {
      expect(num(line, 'y1')).toBe(num(line, 'y2'))
      expect(num(line, 'x1')).not.toBe(num(line, 'x2'))
    })
  })
})

describe('NbBarChart: horizontal orientation', () => {
  it('puts the categories on the y axis and the values on the x axis', () => {
    const w = mountChart({ orientation: 'horizontal' })
    const [first, second] = bars(w)
    // Same height, different y: categories run down.
    expect(num(first, 'height')).toBe(num(second, 'height'))
    expect(num(second, 'y')).toBeGreaterThan(num(first, 'y'))
    // Longer bar for the larger value, both starting from the same baseline.
    expect(num(first, 'width')).toBeGreaterThan(num(second, 'width'))
    expect(num(first, 'x')).toBeCloseTo(num(second, 'x'), 5)
  })

  it('moves the category labels to the left of the plot, right-aligned', () => {
    const w = mountChart({ orientation: 'horizontal' })
    const labels = w
      .findAll('g.nb-chart__axis text')
      .filter((t) => ['Organic', 'Referral'].includes(t.text()))
    expect(labels).toHaveLength(2)
    labels.forEach((label) => {
      expect(label.attributes('text-anchor')).toBe('end')
      expect(label.attributes('dominant-baseline')).toBe('middle')
    })
    // Different rows, not a single line under the plot.
    expect(num(labels[0], 'y')).not.toBe(num(labels[1], 'y'))
  })

  it('moves the value ticks to the bottom', () => {
    const w = mountChart({ orientation: 'horizontal' })
    const ticks = w
      .findAll('g.nb-chart__axis text')
      .filter((t) => !['Organic', 'Referral'].includes(t.text()))
    expect(ticks.length).toBeGreaterThan(0)
    ticks.forEach((tick) => {
      expect(num(tick, 'y')).toBe(HEIGHT - 28 + 14)
      expect(tick.attributes('text-anchor')).toBe('middle')
    })
  })

  it('turns the gridlines vertical, following the value axis', () => {
    const w = mountChart({ orientation: 'horizontal' })
    const grid = w.findAll('line.nb-chart__gridline')
    expect(grid.length).toBeGreaterThan(0)
    grid.forEach((line) => {
      expect(num(line, 'x1')).toBe(num(line, 'x2'))
      expect(num(line, 'y1')).not.toBe(num(line, 'y2'))
    })
  })

  // The category labels are drawn 6px left of where the plot starts, so their
  // x is the gutter, measured.
  const gutterOf = (w: ReturnType<typeof mountChart>) =>
    num(w.findAll('g.nb-chart__axis text').at(-1)!, 'x') + 6

  it('widens the left gutter for long category labels', () => {
    const short = mountChart({ orientation: 'horizontal' })
    const long = mountChart({
      orientation: 'horizontal',
      series: [
        {
          name: 'Count',
          data: [
            { x: 'Infrastructure and platform', y: 3 },
            { x: 'Documentation', y: 2 },
          ],
        },
      ],
    })
    expect(gutterOf(long)).toBeGreaterThan(gutterOf(short))
  })

  it('caps that gutter so one long label cannot eat the plot', () => {
    const w = mountChart({
      orientation: 'horizontal',
      series: [
        {
          name: 'Count',
          data: [{ x: 'x'.repeat(300), y: 3 }],
        },
      ],
    })
    expect(gutterOf(w)).toBeLessThanOrEqual(WIDTH * 0.4)
  })

  it('grows negative bars the other way from the baseline', () => {
    const w = mountChart({
      orientation: 'horizontal',
      series: withNegatives,
    })
    const [positive, negative] = bars(w)
    // The negative bar ends where the positive one starts: the zero baseline.
    expect(num(negative, 'x') + num(negative, 'width')).toBeCloseTo(
      num(positive, 'x'),
      5,
    )
    expect(num(negative, 'width')).toBeGreaterThan(0)
  })
})

describe('NbBarChart: stacked series', () => {
  it('stacks segments instead of grouping them, in either orientation', () => {
    const groupedChart = mountChart({ series: grouped })
    const stackedChart = mountChart({ series: grouped, stacked: true })

    const [gEU, gNA] = bars(groupedChart)
    // Grouped: side by side, each half the band.
    expect(num(gNA, 'x')).toBeGreaterThan(num(gEU, 'x'))

    const [sEU, sNA] = bars(stackedChart)
    // Stacked: same column, full band, one sitting on top of the other.
    expect(num(sNA, 'x')).toBe(num(sEU, 'x'))
    expect(num(sEU, 'width')).toBeGreaterThan(num(gEU, 'width'))
    expect(num(sNA, 'y') + num(sNA, 'height')).toBeCloseTo(num(sEU, 'y'), 5)
  })

  it('stacks along the value axis when horizontal', () => {
    const w = mountChart({
      series: grouped,
      stacked: true,
      orientation: 'horizontal',
    })
    const [eu, na] = bars(w)
    expect(num(na, 'y')).toBe(num(eu, 'y'))
    expect(num(na, 'x')).toBeCloseTo(num(eu, 'x') + num(eu, 'width'), 5)
  })

  it('scales the value axis to the stacked total, not the tallest segment', () => {
    const stacked = mountChart({ series: grouped, stacked: true })
    const groupedChart = mountChart({ series: grouped })
    // Q1 totals 50 stacked against a 30 maximum grouped, so the same 30-unit
    // segment has to be drawn shorter once it shares the axis with the total.
    expect(num(bars(stacked)[0], 'height')).toBeLessThan(
      num(bars(groupedChart)[0], 'height'),
    )
  })
})

describe('NbBarChart: selection', () => {
  // Interactivity is opt-in: a chart nobody listens to must not look or behave
  // like a control.
  it('adds no button semantics when no listener is bound', () => {
    const w = mountChart()
    const bar = bars(w)[0]
    expect(bar.attributes('tabindex')).toBeUndefined()
    expect(bar.attributes('role')).toBeUndefined()
    expect(w.get('svg').attributes('role')).toBe('img')
    expect(w.get('svg').classes()).not.toContain('nb-chart__svg--selectable')
  })

  it('makes every bar a focusable button when a listener is bound', () => {
    const w = mountChart({}, { onSelect: () => {} })
    const bar = bars(w)[0]
    expect(bar.attributes('tabindex')).toBe('0')
    expect(bar.attributes('role')).toBe('button')
    expect(bar.attributes('aria-label')).toBe('Organic: 300')
    // The svg stops being an opaque image once it contains controls.
    expect(w.get('svg').attributes('role')).toBe('group')
  })

  it('names the series in the label when there is more than one', () => {
    const w = mountChart({ series: grouped }, { onSelect: () => {} })
    expect(bars(w)[0].attributes('aria-label')).toBe('Q1, EU: 30')
  })

  it('emits the underlying datum, not the rendered label', async () => {
    const w = mountChart({}, { onSelect: () => {} })
    await w.findAll('.nb-chart__hover-layer rect')[1].trigger('click')
    expect(w.emitted('select')?.[0][0]).toEqual({
      kind: 'series',
      x: 'Referral',
      y: 100,
      seriesName: 'Sign-ups',
      seriesIndex: 0,
      index: 1,
      point: { x: 'Referral', y: 100 },
    })
  })

  it('is activated from the keyboard, on the bar itself', async () => {
    const w = mountChart({}, { onSelect: () => {} })
    await bars(w)[0].trigger('keydown', { key: 'Enter' })
    expect(w.emitted('select')?.[0][0]).toMatchObject({ x: 'Organic', y: 300 })

    await bars(w)[1].trigger('keydown', { key: ' ' })
    expect(w.emitted('select')?.[1][0]).toMatchObject({ x: 'Referral' })
  })

  it('ignores keys that are not activation keys', async () => {
    const w = mountChart({}, { onSelect: () => {} })
    await bars(w)[0].trigger('keydown', { key: 'a' })
    expect(w.emitted('select')).toBeUndefined()
  })

  it('emits nothing when nobody is listening', async () => {
    const w = mountChart()
    await w.findAll('.nb-chart__hover-layer rect')[0].trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('picks the series under the pointer in a grouped chart', async () => {
    const w = mountChart({ series: grouped }, { onSelect: () => {} })
    const band = w.findAll('.nb-chart__hover-layer rect')[0]
    const start = num(band, 'x')
    const bandwidth = num(band, 'width')

    // Left half of the band is the first series, right half the second.
    await band.trigger('click', { clientX: start + bandwidth * 0.25 })
    expect(w.emitted('select')?.[0][0]).toMatchObject({
      seriesName: 'EU',
      seriesIndex: 0,
    })

    await band.trigger('click', { clientX: start + bandwidth * 0.75 })
    expect(w.emitted('select')?.[1][0]).toMatchObject({
      seriesName: 'NA',
      seriesIndex: 1,
    })
  })

  it('picks the segment under the pointer in a stacked chart', async () => {
    const w = mountChart(
      { series: grouped, stacked: true },
      { onSelect: () => {} },
    )
    const [euBar, naBar] = bars(w)
    const band = w.findAll('.nb-chart__hover-layer rect')[0]

    // Vertical stack: the lower segment is the first series.
    await band.trigger('click', {
      clientY: num(euBar, 'y') + num(euBar, 'height') / 2,
    })
    expect(w.emitted('select')?.[0][0]).toMatchObject({ seriesIndex: 0 })

    await band.trigger('click', {
      clientY: num(naBar, 'y') + num(naBar, 'height') / 2,
    })
    expect(w.emitted('select')?.[1][0]).toMatchObject({ seriesIndex: 1 })
  })
})

// The selection payload is designed for the whole family, not for bars. Pie's
// datum is categorical rather than a point in a series, so it carries the other
// half of the discriminated union: this asserts that both halves are real.
describe('NbPieChart: the same selection contract', () => {
  const data = [
    { label: 'Direct', value: 40 },
    { label: 'Referral', value: 60 },
  ]

  it('adds no button semantics when no listener is bound', () => {
    const w = mount(PieChart, { props: { data } })
    expect(w.get('svg').attributes('role')).toBe('img')
    expect(
      w.findAll('path.nb-chart__slice')[0].attributes('tabindex'),
    ).toBeUndefined()
  })

  it('emits the categorical datum on click', async () => {
    const w = mount(PieChart, { props: { data, onSelect: () => {} } })
    await w.findAll('path.nb-chart__slice')[1].trigger('click')
    expect(w.emitted('select')?.[0][0]).toEqual({
      kind: 'categorical',
      label: 'Referral',
      value: 60,
      index: 1,
      datum: { label: 'Referral', value: 60 },
    })
  })

  it('activates a slice from the keyboard', async () => {
    const w = mount(PieChart, { props: { data, onSelect: () => {} } })
    const slice = w.findAll('path.nb-chart__slice')[0]
    expect(slice.attributes('role')).toBe('button')
    expect(slice.attributes('aria-label')).toBe('Direct: 40')
    await slice.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('select')?.[0][0]).toMatchObject({ label: 'Direct' })
  })
})
