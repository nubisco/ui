import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '../src/components/Charts/BarChart.vue'

// The markup of NbBarChart as it rendered before the opt-in presentation props
// (`barRadius`, `showEmpty`, `showBaseline`, `showValueAxis`,
// `categoryLabelEvery`) existed. The snapshot was recorded from the previous
// component, so a chart that does not set any of them must still produce it
// byte for byte. It compares the serialised DOM, not the pretty-printed one,
// with comments and scoped-style attributes dropped: neither is painted, and a
// `v-if` that is off leaves a comment behind. Each element goes on its own
// line so a failure points at the element that changed.
const normalise = (w: { element: Element }) =>
  w.element.outerHTML
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ data-v-[a-z0-9]+=""/g, '')
    .replace(/></g, '>\n<')

const hours = Array.from({ length: 24 }, (_, h) => `${h}`.padStart(2, '0'))
const zeroHeavy = [
  {
    name: 'Notes',
    data: hours.map((x, h) => ({ x, y: h % 5 === 0 ? 0 : (h * 7) % 11 })),
  },
  {
    name: 'Messages',
    data: hours.map((x, h) => ({ x, y: h % 5 === 0 ? 0 : (h * 3) % 4 })),
  },
]

const fixtures: Record<string, Record<string, unknown>> = {
  single: {
    series: [
      {
        name: 'Sign-ups',
        data: [
          { x: 'Organic', y: 300 },
          { x: 'Referral', y: 100 },
          { x: 'Paid', y: 0 },
        ],
      },
    ],
  },
  grouped: {
    title: 'Quarterly',
    subtitle: 'By region',
    series: [
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
    ],
  },
  negatives: {
    series: [
      {
        name: 'Net',
        data: [
          { x: 'Q1', y: 12 },
          { x: 'Q2', y: -8 },
          { x: 'Q3', y: 0 },
        ],
      },
    ],
  },
  stackedHours: { stacked: true, series: zeroHeavy },
  horizontalStacked: {
    orientation: 'horizontal',
    stacked: true,
    series: [
      {
        name: 'Up',
        data: [
          { x: 'Authentication', y: 5 },
          { x: 'Billing', y: -3 },
        ],
      },
      {
        name: 'Down',
        data: [
          { x: 'Authentication', y: -2 },
          { x: 'Billing', y: 4 },
        ],
      },
    ],
  },
  chromeless: {
    showLegend: false,
    showTooltip: false,
    showGrid: false,
    series: zeroHeavy,
  },
}

describe('NbBarChart: defaults render exactly as before', () => {
  for (const [name, props] of Object.entries(fixtures)) {
    it(`${name}`, () => {
      const w = mount(BarChart, { props })
      expect(normalise(w)).toMatchSnapshot()
    })
  }

  it('selectable (with a select listener)', () => {
    const w = mount(BarChart, {
      props: { ...fixtures.grouped, onSelect: () => {} },
    })
    expect(normalise(w)).toMatchSnapshot()
  })
})
