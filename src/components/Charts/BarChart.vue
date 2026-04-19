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
        role="img"
        :aria-label="title || 'Bar chart'"
        @mouseleave="hoverIndex = null"
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
            :y="yScale(t)"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {{ formatValue(t) }}
          </text>
        </g>

        <g class="nb-chart__axis">
          <text
            v-for="(cat, i) in categories"
            :key="`xt-${i}`"
            :x="xScale(String(cat)) + xScale.bandwidth / 2"
            :y="size.height - margin.bottom + 14"
            text-anchor="middle"
          >
            {{ cat }}
          </text>
        </g>

        <line
          class="nb-chart__axis-line"
          :x1="margin.left"
          :x2="size.width - margin.right"
          :y1="yScale(0)"
          :y2="yScale(0)"
        />

        <g v-for="(category, ci) in categories" :key="`g-${ci}`">
          <rect
            v-for="(s, si) in resolvedSeries"
            :key="`${ci}-${si}`"
            class="nb-chart__bar"
            :class="{ 'is-dim': hoverIndex !== null && hoverIndex !== ci }"
            :x="xScale(String(category)) + si * groupBandwidth"
            :y="barY(s.data[ci]?.y ?? 0)"
            :width="Math.max(0, groupBandwidth - 2)"
            :height="barHeight(s.data[ci]?.y ?? 0)"
            :fill="s.color"
          />
        </g>

        <g class="nb-chart__hover-layer">
          <rect
            v-for="(category, ci) in categories"
            :key="`hover-${ci}`"
            :x="xScale(String(category))"
            :y="margin.top"
            :width="xScale.bandwidth"
            :height="Math.max(0, size.height - margin.top - margin.bottom)"
            fill="transparent"
            @mouseenter="hoverIndex = ci"
            @mousemove="(e) => updateTooltip(e, ci)"
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
import { computed, ref } from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartLegend from './shared/ChartLegend.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { band, linear, padDomain } from './shared/scales'
import { colorAt, DEFAULT_PALETTE } from './shared/palette'
import { useChartSize } from './shared/useChartSize'
import type { IBarChartProps } from './BarChart.d'

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

const categories = computed(() => (props.series[0]?.data ?? []).map((d) => d.x))

const yDomain = computed<[number, number]>(() => {
  const all = props.series.flatMap((s) => s.data.map((d) => d.y))
  if (!all.length) return [0, 1]
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  return padDomain(min, max, 0.05)
})

const xScale = computed(() =>
  band(
    categories.value.map((c) => String(c)),
    [margin.left, Math.max(margin.left, size.value.width - margin.right)],
    0.2,
  ),
)

const yScale = computed(() =>
  linear(yDomain.value, [
    Math.max(margin.top, size.value.height - margin.bottom),
    margin.top,
  ]),
)

const yTicks = computed(() => yScale.value.ticks(5))

const groupBandwidth = computed(() =>
  resolvedSeries.value.length
    ? xScale.value.bandwidth / resolvedSeries.value.length
    : xScale.value.bandwidth,
)

const barY = (v: number) => (v >= 0 ? yScale.value(v) : yScale.value(0))
const barHeight = (v: number) =>
  v >= 0
    ? Math.max(0, yScale.value(0) - yScale.value(v))
    : Math.max(0, yScale.value(v) - yScale.value(0))

const formatValue = (n: number) => {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const hoverIndex = ref<number | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const updateTooltip = (e: MouseEvent, ci: number) => {
  const target = e.currentTarget as SVGElement
  const svg = target.ownerSVGElement
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  tooltipPos.value = {
    x: e.clientX - rect.left + 12,
    y: e.clientY - rect.top + 12,
  }
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
}
</style>
