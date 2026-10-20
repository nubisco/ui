import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '../src/components/Charts/BarChart.vue'
import LineChart from '../src/components/Charts/LineChart.vue'

// Values either side of 1000, so the default `k` shorthand shows up in the
// ticks and the tooltip, and a formatter visibly replaces it.
const revenue = [
  {
    name: 'Revenue',
    data: [
      { x: 'Q1', y: 1500 },
      { x: 'Q2', y: 800, label: 'Eight hundred' },
    ],
  },
]

const euro = (n: number) => `EUR ${n}`

const ticks = (w: ReturnType<typeof mount>) =>
  w
    .findAll('.nb-chart__axis')[0]
    .findAll('text')
    .map((t) => t.text())
const tooltipValues = (w: ReturnType<typeof mount>) =>
  w.findAll('.nb-chart__tooltip-value').map((t) => t.text())

const hoverBar = async (w: ReturnType<typeof mount>, ci: number) => {
  const band = w.findAll('.nb-chart__hover-layer rect')[ci]
  await band.trigger('mouseenter')
}
// jsdom reports a zero-sized box, so clientX is the pointer's x in the svg.
const hoverLine = async (w: ReturnType<typeof mount>, clientX: number) => {
  await w.find('svg').trigger('mousemove', { clientX })
}
const LINE_END = 10_000

describe('NbBarChart: value formatting', () => {
  const mountBar = (props = {}) =>
    mount(BarChart, {
      props: { series: revenue, ...props, onSelect: () => {} },
    })

  it('prints what it always has without a formatter or labels', async () => {
    const w = mountBar({
      series: [
        {
          name: 'Revenue',
          data: [
            { x: 'Q1', y: 1500 },
            { x: 'Q2', y: 800 },
          ],
        },
      ],
    })
    expect(ticks(w)).toEqual(['0', '500', '1.0k', '1.5k'])
    await hoverBar(w, 0)
    expect(tooltipValues(w)).toEqual(['1.5k'])
    await hoverBar(w, 1)
    expect(tooltipValues(w)).toEqual(['800'])
    expect(w.findAll('rect.nb-chart__bar')[0].attributes('aria-label')).toBe(
      'Q1: 1.5k',
    )
  })

  it('shows the point label as the tooltip value', async () => {
    const w = mountBar()
    await hoverBar(w, 1)
    expect(tooltipValues(w)).toEqual(['Eight hundred'])
    await hoverBar(w, 0)
    expect(tooltipValues(w)).toEqual(['1.5k'])
  })

  it('applies valueFormatter to ticks, tooltip and aria labels', async () => {
    const w = mountBar({ valueFormatter: euro })
    expect(ticks(w).every((t) => t.startsWith('EUR '))).toBe(true)
    await hoverBar(w, 0)
    expect(tooltipValues(w)).toEqual(['EUR 1500'])
    expect(w.findAll('rect.nb-chart__bar')[0].attributes('aria-label')).toBe(
      'Q1: EUR 1500',
    )
  })

  it('lets a point label win over valueFormatter in the tooltip', async () => {
    const w = mountBar({ valueFormatter: euro })
    await hoverBar(w, 1)
    expect(tooltipValues(w)).toEqual(['Eight hundred'])
  })

  it('keeps raw values in the selection payload', async () => {
    const selections: unknown[] = []
    const w = mount(BarChart, {
      props: {
        series: revenue,
        valueFormatter: euro,
        onSelect: (s: unknown) => selections.push(s),
      },
    })
    await w
      .findAll('rect.nb-chart__bar')[0]
      .trigger('keydown', { key: 'Enter' })
    expect(selections[0]).toMatchObject({ y: 1500 })
  })
})

describe('NbLineChart: value formatting', () => {
  const mountLine = (props = {}) =>
    mount(LineChart, { props: { series: revenue, ...props } })

  it('prints what it always has without a formatter or labels', async () => {
    const w = mountLine({
      series: [
        {
          name: 'Revenue',
          data: [
            { x: 'Q1', y: 1500 },
            { x: 'Q2', y: 800 },
          ],
        },
      ],
    })
    expect(ticks(w)).toEqual(['0', '500', '1.0k', '1.5k'])
    await hoverLine(w, 0)
    expect(tooltipValues(w)).toEqual(['1.5k'])
    await hoverLine(w, LINE_END)
    expect(tooltipValues(w)).toEqual(['800'])
  })

  it('shows the point label as the tooltip value', async () => {
    const w = mountLine()
    await hoverLine(w, LINE_END)
    expect(tooltipValues(w)).toEqual(['Eight hundred'])
  })

  it('applies valueFormatter to ticks and tooltip, and a label wins', async () => {
    const w = mountLine({ valueFormatter: euro })
    expect(ticks(w).every((t) => t.startsWith('EUR '))).toBe(true)
    await hoverLine(w, 0)
    expect(tooltipValues(w)).toEqual(['EUR 1500'])
    await hoverLine(w, LINE_END)
    expect(tooltipValues(w)).toEqual(['Eight hundred'])
  })
})
