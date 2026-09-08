<template>
  <ChartFrame
    :title="title"
    :subtitle="subtitle"
    :height="height"
    :show-legend="showLegend && resolvedSeries.length > 0"
  >
    <div ref="root" class="nb-bar-chart">
      <svg
        :width="size.width"
        :height="size.height"
        class="nb-chart__svg"
        :class="{ 'nb-chart__svg--selectable': isSelectable() }"
        :role="isSelectable() ? 'group' : 'img'"
        :aria-label="title || 'Bar chart'"
        @mouseleave="hoverIndex = null"
      >
        <!-- Gridlines follow the value axis, so they run across the plot in
             vertical mode and down it in horizontal mode. -->
        <g v-if="showGrid && size.width > 0">
          <line
            v-for="t in valueTicks"
            :key="`grid-${t}`"
            class="nb-chart__gridline"
            :x1="horizontal ? valueScale(t) : plot.x0"
            :x2="horizontal ? valueScale(t) : plot.x1"
            :y1="horizontal ? plot.y0 : valueScale(t)"
            :y2="horizontal ? plot.y1 : valueScale(t)"
          />
        </g>

        <g class="nb-chart__axis">
          <text
            v-for="t in valueTicks"
            :key="`vt-${t}`"
            :x="horizontal ? valueScale(t) : plot.x0 - 6"
            :y="horizontal ? plot.y1 + 14 : valueScale(t)"
            :text-anchor="horizontal ? 'middle' : 'end'"
            :dominant-baseline="horizontal ? 'auto' : 'middle'"
          >
            {{ formatValue(t) }}
          </text>
        </g>

        <g class="nb-chart__axis">
          <text
            v-for="(cat, i) in categories"
            :key="`ct-${i}`"
            :x="horizontal ? plot.x0 - 6 : categoryCentre(i)"
            :y="horizontal ? categoryCentre(i) : plot.y1 + 14"
            :text-anchor="horizontal ? 'end' : 'middle'"
            :dominant-baseline="horizontal ? 'middle' : 'auto'"
          >
            {{ cat }}
          </text>
        </g>

        <!-- The zero baseline: horizontal in vertical mode, vertical in
             horizontal mode. -->
        <line
          class="nb-chart__axis-line"
          :x1="horizontal ? valueScale(0) : plot.x0"
          :x2="horizontal ? valueScale(0) : plot.x1"
          :y1="horizontal ? plot.y0 : valueScale(0)"
          :y2="horizontal ? plot.y1 : valueScale(0)"
        />

        <g v-for="(_, ci) in categories" :key="`g-${ci}`">
          <rect
            v-for="(s, si) in resolvedSeries"
            :key="`${ci}-${si}`"
            class="nb-chart__bar"
            :class="{ 'is-dim': hoverIndex !== null && hoverIndex !== ci }"
            v-bind="barRect(ci, si)"
            :fill="s.color"
            :tabindex="isSelectable() ? 0 : undefined"
            :role="isSelectable() ? 'button' : undefined"
            :aria-label="isSelectable() ? barLabel(ci, si) : undefined"
            @keydown="onBarKeydown($event, ci, si)"
          />
        </g>

        <!-- One transparent band per category, on top, so hovering anywhere in
             the column (or row) shows the tooltip rather than only the bar
             itself. It is also the click target: forgiving, and it already
             knows which category it belongs to. -->
        <g class="nb-chart__hover-layer">
          <rect
            v-for="(_, ci) in categories"
            :key="`hover-${ci}`"
            v-bind="bandRect(ci)"
            fill="transparent"
            @mouseenter="hoverIndex = ci"
            @mousemove="(e) => updateTooltip(e, ci)"
            @click="(e) => onBandClick(e, ci)"
          />
        </g>
      </svg>

      <ChartTooltip
        :visible="showTooltip && hoverIndex !== null"
        :x="tooltipPos.x"
        :y="tooltipPos.y"
        :title="hoverIndex !== null ? String(categories[hoverIndex]) : ''"
        :rows="tooltipRows"
      />
    </div>

    <template #legend>
      <ChartLegend
        :items="resolvedSeries.map((s) => ({ label: s.name, color: s.color }))"
      />
    </template>
  </ChartFrame>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartLegend from './shared/ChartLegend.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { band, linear, padDomain } from './shared/scales'
import { colorAt, DEFAULT_PALETTE } from './shared/palette'
import { useChartSize } from './shared/useChartSize'
import type { IBarChartProps } from './BarChart.d'
import type { IChartMargins, IChartSeriesSelection } from './shared/types.d'

const props = withDefaults(defineProps<IBarChartProps>(), {
  title: undefined,
  subtitle: undefined,
  height: 280,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  colors: () => DEFAULT_PALETTE,
  series: () => [],
  orientation: 'vertical',
  stacked: false,
})

const emit = defineEmits<{ select: [selection: IChartSeriesSelection] }>()

const root = ref<HTMLElement | null>(null)
const size = useChartSize(root, { width: 480, height: 240 })

const horizontal = computed(() => props.orientation === 'horizontal')

const resolvedSeries = computed(() =>
  props.series.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.color ?? colorAt(i, props.colors),
  })),
)

const categories = computed(() => (props.series[0]?.data ?? []).map((d) => d.x))

const valueAt = (ci: number, si: number) =>
  resolvedSeries.value[si]?.data[ci]?.y ?? 0

// Where a bar segment starts and ends in data space. Grouped bars always run
// from zero; stacked ones start where the same-signed segments before them
// finished, so a mixed-sign category grows in both directions from the
// baseline instead of cancelling itself out.
const segment = (ci: number, si: number): [number, number] => {
  const value = valueAt(ci, si)
  if (!props.stacked) return [0, value]
  let base = 0
  for (let k = 0; k < si; k += 1) {
    const previous = valueAt(ci, k)
    if (previous >= 0 === value >= 0) base += previous
  }
  return [base, base + value]
}

const valueDomain = computed<[number, number]>(() => {
  const totals: number[] = []
  categories.value.forEach((_, ci) => {
    resolvedSeries.value.forEach((_series, si) => {
      totals.push(segment(ci, si)[1])
    })
  })
  if (!totals.length) return [0, 1]
  return padDomain(Math.min(0, ...totals), Math.max(0, ...totals), 0.05)
})

// The category labels sit outside the plot, so the gutter they need differs by
// orientation: under the plot they get the whole band width each, beside it
// they get whatever the left margin is. 6.2px per character approximates the
// 11px sans face closely enough to size that gutter, and the ceiling keeps one
// long outlier from eating the plot it is labelling.
const margin = computed<IChartMargins>(() => {
  if (!horizontal.value) return { top: 12, right: 16, bottom: 28, left: 44 }
  const longest = categories.value.reduce<number>(
    (n, c) => Math.max(n, String(c).length),
    0,
  )
  const ceiling = Math.max(44, Math.round(size.value.width * 0.4))
  return {
    top: 12,
    right: 16,
    bottom: 28,
    left: Math.min(Math.max(44, Math.ceil(longest * 6.2) + 12), ceiling),
  }
})

const plot = computed(() => ({
  x0: margin.value.left,
  x1: Math.max(margin.value.left, size.value.width - margin.value.right),
  y0: margin.value.top,
  y1: Math.max(margin.value.top, size.value.height - margin.value.bottom),
}))

// One band scale across the categories and one linear scale over the values.
// Which screen axis each lands on is the whole of the orientation switch.
const categoryScale = computed(() =>
  band(
    categories.value.map((c) => String(c)),
    horizontal.value
      ? [plot.value.y0, plot.value.y1]
      : [plot.value.x0, plot.value.x1],
    0.2,
  ),
)

const valueScale = computed(() =>
  linear(
    valueDomain.value,
    horizontal.value
      ? [plot.value.x0, plot.value.x1]
      : [plot.value.y1, plot.value.y0],
  ),
)

const valueTicks = computed(() => valueScale.value.ticks(5))

const categoryStart = (ci: number) =>
  categoryScale.value(String(categories.value[ci]))

const categoryCentre = (ci: number) =>
  categoryStart(ci) + categoryScale.value.bandwidth / 2

// Stacked segments share the full band; grouped ones divide it.
const groupBandwidth = computed(() => {
  const count = resolvedSeries.value.length || 1
  return props.stacked
    ? categoryScale.value.bandwidth
    : categoryScale.value.bandwidth / count
})

const barRect = (ci: number, si: number) => {
  const [from, to] = segment(ci, si)
  const a = valueScale.value(from)
  const b = valueScale.value(to)
  const thickness = Math.max(0, groupBandwidth.value - 2)
  const offset =
    categoryStart(ci) + (props.stacked ? 0 : si * groupBandwidth.value)
  const length = Math.max(0, Math.abs(b - a))
  return horizontal.value
    ? { x: Math.min(a, b), y: offset, width: length, height: thickness }
    : { x: offset, y: Math.min(a, b), width: thickness, height: length }
}

const bandRect = (ci: number) => {
  const start = categoryStart(ci)
  const thickness = categoryScale.value.bandwidth
  return horizontal.value
    ? {
        x: plot.value.x0,
        y: start,
        width: Math.max(0, plot.value.x1 - plot.value.x0),
        height: thickness,
      }
    : {
        x: start,
        y: plot.value.y0,
        width: thickness,
        height: Math.max(0, plot.value.y1 - plot.value.y0),
      }
}

const formatValue = (n: number) => {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/* ------------------------------------------------------------- selection */

// Read off the vnode rather than cached in a computed: a computed with no
// reactive dependency would freeze the answer from first render, and this has
// to stay honest if the parent binds the listener conditionally. Interactivity
// is opt-in, so a chart nobody is listening to grows no cursor, no focus ring
// and no button semantics.
const instance = getCurrentInstance()
const isSelectable = () => Boolean(instance?.vnode.props?.onSelect)

const barLabel = (ci: number, si: number) => {
  const series = resolvedSeries.value[si]
  const value = formatValue(valueAt(ci, si))
  return resolvedSeries.value.length > 1
    ? `${categories.value[ci]}, ${series?.name}: ${value}`
    : `${categories.value[ci]}: ${value}`
}

const selectionFor = (ci: number, si: number): IChartSeriesSelection => {
  const series = resolvedSeries.value[si]
  const point = series?.data[ci]
  return {
    kind: 'series',
    x: point?.x ?? categories.value[ci],
    y: point?.y ?? 0,
    seriesName: series?.name ?? '',
    seriesIndex: si,
    index: ci,
    point: point ?? { x: categories.value[ci], y: 0 },
  }
}

const pointerIn = (e: MouseEvent) => {
  const svg = (e.currentTarget as SVGElement).ownerSVGElement
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

// The band is one target covering every series in the category, so a click on
// it has to say which bar was meant. Grouped bars divide the band, so the
// offset along the category axis picks the series; stacked ones divide the
// value axis, so the position along that axis does. Either way the answer is
// clamped into range, which makes the padding between bars behave like the
// nearest bar rather than like nothing at all.
const seriesIndexAt = (e: MouseEvent, ci: number): number => {
  const count = resolvedSeries.value.length
  if (count <= 1) return 0
  const at = pointerIn(e)
  if (!at) return 0
  if (props.stacked) {
    const along = horizontal.value ? at.x : at.y
    for (let si = 0; si < count; si += 1) {
      const [from, to] = segment(ci, si)
      const a = valueScale.value(from)
      const b = valueScale.value(to)
      if (along >= Math.min(a, b) && along <= Math.max(a, b)) return si
    }
    return count - 1
  }
  const offset = (horizontal.value ? at.y : at.x) - categoryStart(ci)
  const index = Math.floor(offset / (groupBandwidth.value || 1))
  return Math.min(Math.max(index, 0), count - 1)
}

const onBandClick = (e: MouseEvent, ci: number) => {
  if (!isSelectable()) return
  emit('select', selectionFor(ci, seriesIndexAt(e, ci)))
}

// The bars sit under the hover band, so they never see a click. They do see
// keyboard events, which is the point: each one is a real focusable button, so
// the chart is operable without a pointer and announced as something you can
// activate.
const onBarKeydown = (e: KeyboardEvent, ci: number, si: number) => {
  if (!isSelectable()) return
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  emit('select', selectionFor(ci, si))
}

/* --------------------------------------------------------------- tooltip */

const hoverIndex = ref<number | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const updateTooltip = (e: MouseEvent, ci: number) => {
  const at = pointerIn(e)
  if (!at) return
  tooltipPos.value = { x: at.x + 12, y: at.y + 12 }
  hoverIndex.value = ci
}

const tooltipRows = computed(() => {
  if (hoverIndex.value === null) return []
  return resolvedSeries.value.map((s) => ({
    label: s.name,
    value: formatValue(s.data[hoverIndex.value as number]?.y ?? 0),
    color: s.color,
  }))
})
</script>

<style lang="scss" scoped>
.nb-bar-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.nb-chart__svg {
  display: block;
}

.nb-chart__gridline {
  stroke: var(--nb-c-component-plain-border);
  stroke-dasharray: 2 3;
  stroke-width: 1;
  opacity: 0.6;
}

.nb-chart__axis {
  font-family: var(--nb-font-family-sans);
  font-size: 11px;
  fill: var(--nb-c-text-muted);
}

.nb-chart__axis-line {
  stroke: var(--nb-c-component-plain-border);
  stroke-width: 1;
}

.nb-chart__bar {
  transition: opacity 120ms ease;
  &.is-dim {
    opacity: 0.35;
  }

  // Only when the chart is actually listening. An SVG shape takes `outline`
  // in current browsers, and the stroke is there for the ones that paint the
  // outline behind neighbouring bars.
  .nb-chart__svg--selectable &:focus-visible {
    outline: 1px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
    stroke: var(--nb-c-focus-ring);
    stroke-width: 1;
  }
}

// The band on top is what the pointer actually meets, so it carries the
// cursor. Bars underneath would never get to show one.
.nb-chart__svg--selectable .nb-chart__hover-layer rect {
  cursor: pointer;
}
</style>
