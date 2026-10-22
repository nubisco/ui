import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LineChart from '../src/components/Charts/LineChart.vue'
import {
  defaultXLabelIndices,
  layoutXLabels,
} from '../src/components/Charts/shared/xLabels'

// The chart's own geometry: 44px on the left, 16px on the right.
const positions = (width: number, count: number) => (i: number) =>
  44 + (count <= 1 ? (width - 60) / 2 : (i / (count - 1)) * (width - 60))

const layout = (width: number, count: number, labelWidth: number) =>
  layoutXLabels({
    count,
    positionOf: positions(width, count),
    widthOf: () => labelWidth,
    width,
  })

// Smallest space between two neighbouring labels.
const minGap = (placed: { x: number }[], labelWidth: number): number => {
  let gap = Infinity
  for (let k = 1; k < placed.length; k++) {
    gap = Math.min(gap, placed[k].x - placed[k - 1].x - labelWidth)
  }
  return gap
}

describe('defaultXLabelIndices', () => {
  it('keeps the labels charts have always drawn', () => {
    expect(defaultXLabelIndices(0)).toEqual([])
    expect(defaultXLabelIndices(1)).toEqual([0])
    expect(defaultXLabelIndices(7)).toEqual([0, 2, 4, 6])
    expect(defaultXLabelIndices(30)).toEqual([0, 5, 10, 15, 20, 25, 29])
    expect(defaultXLabelIndices(90)).toEqual([0, 15, 30, 45, 60, 75, 89])
  })
})

describe('layoutXLabels', () => {
  it('returns the default labels untouched when nothing is measured', () => {
    const placed = layoutXLabels({
      count: 30,
      positionOf: positions(340, 30),
    })
    expect(placed.map((p) => p.index)).toEqual(defaultXLabelIndices(30))
    expect(placed.map((p) => p.x)).toEqual(
      defaultXLabelIndices(30).map(positions(340, 30)),
    )
  })

  it('keeps the default labels and positions whenever they do not touch', () => {
    // 2026-07-01 is about 63px in the 11px axis font.
    for (const [width, count] of [
      [1200, 90],
      [900, 30],
      [600, 30],
      [700, 7],
      [340, 7],
    ]) {
      const placed = layout(width, count, 63)
      expect(placed.map((p) => p.index)).toEqual(defaultXLabelIndices(count))
      expect(placed.map((p) => p.x)).toEqual(
        defaultXLabelIndices(count).map(positions(width, count)),
      )
    }
  })

  it('keeps labels that only just clear each other', () => {
    // 30 points at 600px leave the default labels 9.6px apart.
    const placed = layout(600, 30, 63)
    expect(placed).toHaveLength(7)
  })

  it('thins labels that would overlap, leaving room between them', () => {
    for (const width of [390, 360, 340]) {
      for (const count of [30, 90]) {
        const placed = layout(width, count, 63)
        expect(placed.length).toBeLessThan(7)
        expect(placed.length).toBeGreaterThanOrEqual(2)
        expect(minGap(placed, 63)).toBeGreaterThanOrEqual(8)
      }
    }
  })

  it('always keeps the first and the last point', () => {
    for (const count of [14, 24, 30, 72, 90]) {
      const placed = layout(340, count, 100)
      expect(placed[0].index).toBe(0)
      expect(placed[placed.length - 1].index).toBe(count - 1)
    }
  })

  it('keeps thinned labels inside the chart', () => {
    const placed = layout(340, 24, 100)
    for (const p of placed) {
      expect(p.x - 50).toBeGreaterThanOrEqual(0)
      expect(p.x + 50).toBeLessThanOrEqual(340)
    }
  })

  it('thins by space, not by viewport: a long label thins a wide chart', () => {
    // "2026-10-20 00:00" is about 98px: 24 hourly points overlap at 700px.
    const placed = layout(700, 24, 98)
    expect(placed.length).toBeLessThan(7)
    expect(minGap(placed, 98)).toBeGreaterThanOrEqual(8)
  })

  it('falls back to the first label alone when even two do not fit', () => {
    const placed = layout(120, 10, 100)
    expect(placed.map((p) => p.index)).toEqual([0])
  })

  it('handles one and two points', () => {
    expect(layout(340, 1, 63).map((p) => p.index)).toEqual([0])
    expect(layout(340, 2, 63).map((p) => p.index)).toEqual([0, 1])
    expect(layout(0, 0, 63)).toEqual([])
  })
})

describe('NbLineChart x-axis labels', () => {
  const series = [
    {
      name: 'Visitors',
      data: Array.from({ length: 30 }, (_, i) => ({
        x: `2026-07-${String(i + 1).padStart(2, '0')}`,
        y: i * 10,
      })),
    },
  ]

  // jsdom cannot measure text, so the chart draws its default labels.
  it('draws the default labels where text cannot be measured', () => {
    const w = mount(LineChart, { props: { series } })
    const labels = w
      .findAll('.nb-chart__axis')[1]
      .findAll('text')
      .map((t) => t.text())
    expect(labels).toEqual([
      '2026-07-01',
      '2026-07-06',
      '2026-07-11',
      '2026-07-16',
      '2026-07-21',
      '2026-07-26',
      '2026-07-30',
    ])
  })

  // Where text can be measured, labels that would overlap are thinned.
  // jsdom charts are 480px wide, so 24 hourly labels of ~100px collide.
  describe('with measurable text', () => {
    const proto = SVGElement.prototype as SVGElement & {
      getComputedTextLength?: () => number
    }
    afterEach(() => {
      delete proto.getComputedTextLength
    })

    it('thins labels that would overlap and keeps the first and last', async () => {
      proto.getComputedTextLength = function (this: SVGElement) {
        return (this.textContent ?? '').length * 6.2
      }
      const hourly = [
        {
          name: 'Visitors',
          data: Array.from({ length: 24 }, (_, i) => ({
            x: `2026-10-20 ${String(i).padStart(2, '0')}:00`,
            y: i,
          })),
        },
      ]
      const w = mount(LineChart, { props: { series: hourly } })
      await nextTick()
      const texts = w.findAll('.nb-chart__axis')[1].findAll('text')
      const labels = texts.map((t) => t.text())
      expect(labels.length).toBeLessThan(7)
      expect(labels[0]).toBe('2026-10-20 00:00')
      expect(labels[labels.length - 1]).toBe('2026-10-20 23:00')
      // The measuring element is gone again.
      expect(texts.every((t) => t.attributes('visibility') !== 'hidden')).toBe(
        true,
      )
      const xs = texts.map((t) => Number(t.attributes('x')))
      for (let k = 1; k < xs.length; k++) {
        expect(xs[k] - xs[k - 1]).toBeGreaterThanOrEqual(16 * 6.2 + 8)
      }
    })

    it('leaves labels that fit exactly as they were', async () => {
      proto.getComputedTextLength = function (this: SVGElement) {
        return (this.textContent ?? '').length * 6.2
      }
      // A week of daily labels sits well apart in 480px.
      const week = [{ name: 'Visitors', data: series[0].data.slice(0, 7) }]
      const w = mount(LineChart, { props: { series: week } })
      await nextTick()
      const texts = w.findAll('.nb-chart__axis')[1].findAll('text')
      expect(texts.map((t) => t.text())).toEqual([
        '2026-07-01',
        '2026-07-03',
        '2026-07-05',
        '2026-07-07',
      ])
      // Same positions the default layout gives: 44px in, 420px across.
      expect(texts.map((t) => Number(t.attributes('x')))).toEqual([
        44, 184, 324, 464,
      ])
    })
  })
})
