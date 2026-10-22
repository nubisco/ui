<template>
  <ChartFrame
    :title="title"
    :subtitle="subtitle"
    :height="height"
    :show-legend="showLegend && resolvedSeries.length > 0"
  >
    <div ref="root" class="nb-line-chart">
      <svg
        :width="size.width"
        :height="size.height"
        class="nb-chart__svg"
        role="img"
        :aria-label="title || 'Line chart'"
        @mouseleave="hoverIndex = null"
        @mousemove="onMove"
      >
        <g v-if="showGrid && size.width > 0">
          <line
            v-for="t in yTicks"
            :key="`grid-${t}`"
            class="nb-chart__gridline"
            :x1="margin.left"
            :x2="size.width - margin.right"
            :y1="yScale(t)"
            :y2="yScale(t)"
          />
        </g>

        <g class="nb-chart__axis">
          <text
            v-for="t in yTicks"
            :key="`yt-${t}`"
            :x="margin.left - 6"
            :y="tickLabelY(t)"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {{ printValue(t) }}
          </text>
        </g>

        <g ref="xAxis" class="nb-chart__axis">
          <text
            v-for="(label, i) in xLabelsToShow"
            :key="`xt-${i}`"
            :x="label.x"
            :y="size.height - margin.bottom + 14"
            text-anchor="middle"
          >
            {{ label.value }}
          </text>
        </g>

        <line
          class="nb-chart__axis-line"
          :x1="margin.left"
          :x2="size.width - margin.right"
          :y1="size.height - margin.bottom"
          :y2="size.height - margin.bottom"
        />

        <g v-for="(s, si) in resolvedSeries" :key="`s-${si}`">
          <path
            v-if="area"
            class="nb-chart__area"
            :d="areaPath(s.data)"
            :fill="s.color"
            opacity="0.18"
          />
          <path
            class="nb-chart__line"
            :d="linePath(s.data)"
            :stroke="s.color"
            fill="none"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <template v-if="points">
            <circle
              v-for="(d, di) in s.data"
              :key="`p-${si}-${di}`"
              :cx="xPositionFor(di)"
              :cy="yScale(d.y)"
              :r="hoverIndex === di ? 4 : 3"
              :fill="s.color"
              class="nb-chart__point"
            />
          </template>
        </g>

        <line
          v-if="hoverIndex !== null"
          class="nb-chart__hover-line"
          :x1="xPositionFor(hoverIndex)"
          :x2="xPositionFor(hoverIndex)"
          :y1="margin.top"
          :y2="size.height - margin.bottom"
        />
      </svg>

      <ChartTooltip
        :visible="showTooltip && hoverIndex !== null"
        :x="tooltipPos.x"
        :y="tooltipPos.y"
        :title="hoverIndex !== null ? String(xValues[hoverIndex]) : ''"
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
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toDisplayString,
  watch,
} from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartLegend from './shared/ChartLegend.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { linear, padDomain } from './shared/scales'
import { colorAt, DEFAULT_PALETTE } from './shared/palette'
import { useChartSize } from './shared/useChartSize'
import { layoutXLabels } from './shared/xLabels'
import type { ILineChartProps } from './LineChart.d'
import type { IChartPoint } from './shared/types.d'

const props = withDefaults(defineProps<ILineChartProps>(), {
  title: undefined,
  subtitle: undefined,
  height: 280,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  colors: () => DEFAULT_PALETTE,
  series: () => [],
  area: false,
  points: false,
  curve: 'smooth',
})

const margin = { top: 12, right: 16, bottom: 28, left: 44 }

const root = ref<HTMLElement | null>(null)
const size = useChartSize(root, { width: 480, height: 240 })

const resolvedSeries = computed(() =>
  props.series.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.color ?? colorAt(i, props.colors),
  })),
)

const xValues = computed(() => (props.series[0]?.data ?? []).map((d) => d.x))

const yDomain = computed<[number, number]>(() => {
  const all = props.series.flatMap((s) => s.data.map((d) => d.y))
  if (!all.length) return [0, 1]
  const min = Math.min(0, ...all)
  const max = Math.max(...all)
  return padDomain(min, max, 0.1)
})

const yScale = computed(() =>
  linear(yDomain.value, [
    Math.max(margin.top, size.value.height - margin.bottom),
    margin.top,
  ]),
)

const yTicks = computed(() => yScale.value.ticks(5))

// How far a y tick's text reaches above its own y. The measured value where
// text can be measured, half of the 11px axis font's line box otherwise.
const tickTextTop = ref(7)

// The top tick can sit above the plot, past the svg's top edge. Its label
// moves down just enough to show in full. The tick, its gridline and every
// other label stay where they are.
const tickLabelY = (t: number) => Math.max(yScale.value(t), tickTextTop.value)

const innerWidth = computed(() =>
  Math.max(0, size.value.width - margin.left - margin.right),
)

const xPositionFor = (i: number) => {
  const n = xValues.value.length
  if (n <= 1) return margin.left + innerWidth.value / 2
  return margin.left + (i / (n - 1)) * innerWidth.value
}

// Rendered width of every x label, and how far a y tick's text reaches above
// its y, measured in the axis's own font by a hidden text element that is
// removed again before anything paints. The widths stay
// null where text cannot be measured (server rendering, jsdom), and the
// default labels are drawn unchanged.
const xAxis = ref<SVGGElement | null>(null)
const labelWidths = ref<Map<string, number> | null>(null)

const measureLabels = () => {
  const g = xAxis.value
  if (!g || typeof document === 'undefined') return
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  if (typeof probe.getComputedTextLength !== 'function') return
  probe.setAttribute('visibility', 'hidden')
  probe.setAttribute('aria-hidden', 'true')
  g.appendChild(probe)
  const widths = new Map<string, number>()
  for (const value of xValues.value) {
    const text = toDisplayString(value)
    if (widths.has(text)) continue
    probe.textContent = text
    widths.set(text, probe.getComputedTextLength())
  }
  if (typeof probe.getBBox === 'function') {
    probe.setAttribute('dominant-baseline', 'middle')
    probe.setAttribute('y', '0')
    probe.textContent = '0'
    const top = -probe.getBBox().y
    if (top > 0) tickTextTop.value = top
  }
  g.removeChild(probe)
  labelWidths.value = widths
}

watch(xValues, measureLabels, { flush: 'post' })

// A web font that arrives after the first measure changes every width.
const fonts = typeof document === 'undefined' ? undefined : document.fonts
onMounted(() => {
  measureLabels()
  fonts?.addEventListener?.('loadingdone', measureLabels)
})
onBeforeUnmount(() => {
  fonts?.removeEventListener?.('loadingdone', measureLabels)
})

// About six evenly spaced x-axis labels, thinned further only when those
// would overlap at the width the chart actually has (see shared/xLabels).
const xLabelsToShow = computed(() => {
  const all = xValues.value
  const widths = labelWidths.value
  return layoutXLabels({
    count: all.length,
    positionOf: xPositionFor,
    widthOf: widths
      ? (i) => widths.get(toDisplayString(all[i])) ?? 0
      : undefined,
    width: size.value.width,
  }).map((p) => ({ ...p, value: all[p.index] }))
})

const linePath = (data: IChartPoint[]): string => {
  if (!data.length) return ''
  const points = data.map(
    (d, i) => [xPositionFor(i), yScale.value(d.y)] as [number, number],
  )
  return buildPath(points, props.curve)
}

const areaPath = (data: IChartPoint[]): string => {
  if (!data.length) return ''
  const points = data.map(
    (d, i) => [xPositionFor(i), yScale.value(d.y)] as [number, number],
  )
  const baseline = size.value.height - margin.bottom
  const top = buildPath(points, props.curve)
  const lastX = points[points.length - 1][0]
  const firstX = points[0][0]
  return `${top} L${lastX},${baseline} L${firstX},${baseline} Z`
}

// Path builder supporting linear, smooth (Catmull-Rom-like cubic), and step curves.
const buildPath = (
  points: [number, number][],
  curve: 'linear' | 'smooth' | 'step',
): string => {
  if (!points.length) return ''
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`
  if (curve === 'linear') {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`)
      .join(' ')
  }
  if (curve === 'step') {
    let d = `M${points[0][0]},${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      const [px, py] = points[i - 1]
      const [x, y] = points[i]
      const midX = (px + x) / 2
      d += ` L${midX},${py} L${midX},${y} L${x},${y}`
    }
    return d
  }
  // smooth: cubic bezier using neighbour-derived tangents (Catmull-Rom -> Bezier)
  const k = 0.2
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) * k
    const c1y = p1[1] + (p2[1] - p0[1]) * k
    const c2x = p2[0] - (p3[0] - p1[0]) * k
    const c2y = p2[1] - (p3[1] - p1[1]) * k
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

const formatValue = (n: number) => {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// The consumer's formatter when there is one, the built-in `k` shorthand
// otherwise, so a chart without one prints exactly what it always has.
const printValue = (n: number) =>
  props.valueFormatter ? props.valueFormatter(n) : formatValue(n)

const hoverIndex = ref<number | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const onMove = (e: MouseEvent) => {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const px = e.clientX - rect.left
  const n = xValues.value.length
  if (!n) return
  // Snap to nearest x index based on pointer position.
  const ratio = (px - margin.left) / Math.max(1, innerWidth.value)
  const idx = Math.round(Math.min(1, Math.max(0, ratio)) * (n - 1))
  hoverIndex.value = idx
  tooltipPos.value = {
    x: e.clientX - rect.left + 12,
    y: e.clientY - rect.top + 12,
  }
}

const tooltipRows = computed(() => {
  if (hoverIndex.value === null) return []
  return resolvedSeries.value.map((s) => {
    const point = s.data[hoverIndex.value as number]
    return {
      label: s.name,
      value: point?.label ?? printValue(point?.y ?? 0),
      color: s.color,
    }
  })
})
</script>

<style lang="scss" scoped>
.nb-line-chart {
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

.nb-chart__line {
  pointer-events: none;
}

.nb-chart__point {
  pointer-events: none;
  transition: r 120ms ease;
}

.nb-chart__hover-line {
  stroke: var(--nb-c-component-plain-border);
  stroke-dasharray: 2 3;
  stroke-width: 1;
  pointer-events: none;
}
</style>
