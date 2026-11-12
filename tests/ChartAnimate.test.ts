import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import BarChart from '../src/components/Charts/BarChart.vue'
import LineChart from '../src/components/Charts/LineChart.vue'
import PieChart from '../src/components/Charts/PieChart.vue'
import Sparkline from '../src/components/Charts/Sparkline.vue'

// The entrance animation is CSS, and jsdom computes no styles, so these tests
// hold the contract on both sides of it: the markup carries the hooks only
// when `animate` is set, and the stylesheet switches every hook off under
// `prefers-reduced-motion: reduce`.

const series = [
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
const slices = [
  { label: 'A', value: 3 },
  { label: 'B', value: 1 },
]

const compiled = (file: string) => {
  const path = join(__dirname, '../src/components/Charts', file)
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  return descriptor.styles
    .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The body of the `@media (prefers-reduced-motion: reduce)` block. */
const reducedBlock = (css: string) => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
  expect(start).toBeGreaterThan(-1)
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(css.indexOf('{', start), i)
    }
  }
  return ''
}

describe('chart entrance animation: markup', () => {
  it('bar: groups carry the hooks only when animate is set', () => {
    const off = mount(BarChart, { props: { series } })
    expect(off.find('.nb-chart__bar-group').exists()).toBe(false)
    expect(off.find('svg').classes()).not.toContain('nb-chart__svg--animate')
    expect(off.find('g[style]').exists()).toBe(false)

    const on = mount(BarChart, { props: { series, animate: true } })
    const groups = on.findAll('.nb-chart__bar-group')
    expect(groups).toHaveLength(2)
    expect(groups[0].classes()).toContain('nb-chart__bar-group--vertical')
    expect(on.find('svg').classes()).toContain('nb-chart__svg--animate')
    // Staggered by category, from the zero line.
    expect(groups[0].attributes('style')).toContain('--nb-chart-i: 0')
    expect(groups[1].attributes('style')).toContain('--nb-chart-i: 1')
    expect(groups[0].attributes('style')).toContain('transform-origin')
  })

  it('bar: horizontal charts grow along the value axis', () => {
    const w = mount(BarChart, {
      props: { series, animate: true, orientation: 'horizontal' },
    })
    expect(w.find('.nb-chart__bar-group').classes()).toContain(
      'nb-chart__bar-group--horizontal',
    )
  })

  it('bar: the entrance plays again when the data changes', async () => {
    const w = mount(BarChart, { props: { series, animate: true } })
    const before = w.find('.nb-chart__bar-group').element
    await w.setProps({
      series: [
        {
          name: 'EU',
          data: [
            { x: 'Q1', y: 5 },
            { x: 'Q2', y: 6 },
          ],
        },
      ],
    })
    await nextTick()
    expect(w.find('.nb-chart__bar-group').element).not.toBe(before)
  })

  it('bar: without animate the elements survive a data change', async () => {
    const w = mount(BarChart, { props: { series } })
    const before = w.find('rect.nb-chart__bar').element
    await w.setProps({
      series: [
        {
          name: 'EU',
          data: [
            { x: 'Q1', y: 5 },
            { x: 'Q2', y: 6 },
          ],
        },
      ],
    })
    expect(w.find('rect.nb-chart__bar').element).toBe(before)
  })

  it('line: the line is drawn in, the area and points fade in', () => {
    const off = mount(LineChart, {
      props: { series, area: true, points: true },
    })
    expect(off.find('.nb-chart__line--draw').exists()).toBe(false)
    expect(off.find('.nb-chart__line').attributes('pathLength')).toBeUndefined()

    const on = mount(LineChart, {
      props: { series, area: true, points: true, animate: true },
    })
    expect(on.find('.nb-chart__line').classes()).toContain(
      'nb-chart__line--draw',
    )
    expect(on.find('.nb-chart__line').attributes('pathLength')).toBe('1')
    expect(on.find('.nb-chart__area').classes()).toContain(
      'nb-chart__area--enter',
    )
    expect(on.find('.nb-chart__point').classes()).toContain(
      'nb-chart__point--enter',
    )
  })

  it('line: the entrance plays again when the data changes', async () => {
    const w = mount(LineChart, { props: { series, animate: true } })
    const before = w.find('.nb-chart__line').element
    await w.setProps({ series: [series[0]] })
    expect(w.find('.nb-chart__line').element).not.toBe(before)
  })

  it('pie: a sweep mask exists only when animate is set', () => {
    const off = mount(PieChart, { props: { data: slices } })
    expect(off.find('mask').exists()).toBe(false)
    expect(off.find('g[mask]').exists()).toBe(false)

    const on = mount(PieChart, { props: { data: slices, animate: true } })
    const mask = on.find('mask')
    expect(mask.exists()).toBe(true)
    expect(on.find('.nb-chart__sweep').exists()).toBe(true)
    expect(on.find('g[mask]').attributes('mask')).toBe(
      `url(#${mask.attributes('id')})`,
    )
  })

  it('pie: the mask comes off when the sweep ends and returns on a data change', async () => {
    const w = mount(PieChart, { props: { data: slices, animate: true } })
    await w.find('.nb-chart__sweep').trigger('animationend')
    expect(w.find('g[mask]').exists()).toBe(false)
    await w.setProps({ data: [{ label: 'A', value: 1 }] })
    expect(w.find('g[mask]').exists()).toBe(true)
  })

  it('sparkline: a wipe clip exists only when animate is set', async () => {
    const data = [1, 3, 2, 5]
    const off = mount(Sparkline, { props: { data } })
    expect(off.find('clipPath').exists()).toBe(false)
    expect(off.find('path[clip-path]').exists()).toBe(false)

    const on = mount(Sparkline, { props: { data, animate: true } })
    expect(on.find('clipPath').exists()).toBe(true)
    expect(on.find('path[clip-path]').exists()).toBe(true)
    await on.find('.nb-sparkline__wipe').trigger('animationend')
    expect(on.find('path[clip-path]').exists()).toBe(false)
    await on.setProps({ data: [4, 1, 2] })
    expect(on.find('path[clip-path]').exists()).toBe(true)
  })

  it('animate defaults to false on all four', () => {
    expect(mount(BarChart).props('animate')).toBe(false)
    expect(mount(LineChart).props('animate')).toBe(false)
    expect(mount(PieChart).props('animate')).toBe(false)
    expect(mount(Sparkline, { props: { data: [] } }).props('animate')).toBe(
      false,
    )
  })
})

describe('chart entrance animation: reduced motion and tokens', () => {
  const cases: [string, string[]][] = [
    ['BarChart.vue', ['.nb-chart__bar-group']],
    [
      'LineChart.vue',
      [
        '.nb-chart__line--draw',
        '.nb-chart__area--enter',
        '.nb-chart__point--enter',
      ],
    ],
    ['PieChart.vue', ['.nb-chart__sweep']],
    ['Sparkline.vue', ['.nb-sparkline__wipe']],
  ]

  for (const [file, selectors] of cases) {
    it(`${file} switches every animation off under reduced motion`, () => {
      const block = reducedBlock(compiled(file))
      for (const selector of selectors) {
        expect(block).toContain(selector)
      }
      expect(block).toMatch(/animation:\s*none/)
    })

    it(`${file} times its animation with motion tokens, not literals`, () => {
      const css = compiled(file)
      expect(css).toMatch(/animation[^;]*var\(--nb-motion-/)
      expect(css).toMatch(/var\(--nb-ease-/)
      expect(css).not.toMatch(/animation[^;]*\d+m?s\b/)
    })
  }
})

describe('NbBarChart showTotal', () => {
  const hover = async (w: ReturnType<typeof mount>) => {
    const band = w.find('.nb-chart__hover-layer rect')
    await band.trigger('mouseenter')
    await band.trigger('mousemove', { clientX: 10, clientY: 10 })
  }

  it('adds a total row to the tooltip when asked', async () => {
    const w = mount(BarChart, {
      props: { series, stacked: true, showTotal: true },
    })
    await hover(w)
    const total = w.find('.nb-chart__tooltip-row--total')
    expect(total.exists()).toBe(true)
    expect(total.text()).toContain('Total')
    expect(total.text()).toContain('50')
  })

  it('does not by default', async () => {
    const w = mount(BarChart, { props: { series, stacked: true } })
    await hover(w)
    expect(w.find('.nb-chart__tooltip-row--total').exists()).toBe(false)
    expect(w.findAll('.nb-chart__tooltip-row')).toHaveLength(2)
  })

  it('has nothing to add up for a single series', async () => {
    const w = mount(BarChart, {
      props: { series: [series[0]], showTotal: true },
    })
    await hover(w)
    expect(w.find('.nb-chart__tooltip-row--total').exists()).toBe(false)
  })

  it('formats the total with the valueFormatter', async () => {
    const w = mount(BarChart, {
      props: {
        series,
        stacked: true,
        showTotal: true,
        valueFormatter: (n: number) => `EUR ${n}`,
      },
    })
    await hover(w)
    expect(w.find('.nb-chart__tooltip-row--total').text()).toContain('EUR 50')
  })
})
