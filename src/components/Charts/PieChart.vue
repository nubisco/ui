<template>
  <ChartFrame
    :title="title"
    :subtitle="subtitle"
    :height="height"
    :show-legend="showLegend && resolvedData.length > 0"
  >
    <div ref="root" class="nb-pie-chart">
      <svg
        :width="size.width"
        :height="size.height"
        class="nb-chart__svg"
        role="img"
        :aria-label="title || 'Pie chart'"
        @mouseleave="hoverIndex = null"
      >
        <g :transform="`translate(${cx}, ${cy})`">
          <path
            v-for="(slice, i) in slices"
            :key="`slice-${i}`"
            class="nb-chart__slice"
            :class="{ 'is-dim': hoverIndex !== null && hoverIndex !== i }"
            :d="slice.path"
            :fill="slice.color"
            @mouseenter="hoverIndex = i"
            @mousemove="(e) => updateTooltip(e)"
          />
          <template v-if="labels !== 'none'">
            <text
              v-for="(slice, i) in slices"
              :key="`lab-${i}`"
              class="nb-chart__slice-label"
              :x="slice.labelX"
              :y="slice.labelY"
              text-anchor="middle"
              dominant-baseline="middle"
              :style="{ fill: slice.labelColor }"
            >
              {{ slice.labelText }}
            </text>
          </template>
        </g>
      </svg>

      <ChartTooltip
        :visible="showTooltip && hoverIndex !== null"
        :x="tooltipPos.x"
        :y="tooltipPos.y"
        :rows="tooltipRows"
      />
    </div>

    <template #legend>
      <ChartLegend
        :items="resolvedData.map((d) => ({ label: d.label, color: d.color }))"
      />
    </template>
  </ChartFrame>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartLegend from './shared/ChartLegend.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { colorAt, DEFAULT_PALETTE } from './shared/palette'
import { useChartSize } from './shared/useChartSize'
import type { IPieChartProps } from './PieChart.d'

const props = withDefaults(defineProps<IPieChartProps>(), {
  title: undefined,
  subtitle: undefined,
  height: 280,
  showLegend: true,
  showTooltip: true,
  colors: () => DEFAULT_PALETTE,
  data: () => [],
  innerRadius: 0,
  labels: 'percent',
})

const root = ref<HTMLElement | null>(null)
const size = useChartSize(root, { width: 280, height: 240 })

const resolvedData = computed(() =>
  props.data.map((d, i) => ({
    label: d.label,
    value: d.value,
    color: d.color ?? colorAt(i, props.colors),
  })),
)

const total = computed(() =>
  resolvedData.value.reduce((acc, d) => acc + Math.max(0, d.value), 0),
)

const cx = computed(() => size.value.width / 2)
const cy = computed(() => size.value.height / 2)
const radius = computed(() =>
  Math.max(0, Math.min(size.value.width, size.value.height) / 2 - 8),
)
const innerR = computed(
  () => Math.max(0, Math.min(0.95, props.innerRadius)) * radius.value,
)

interface ISlice {
  path: string
  color: string
  labelX: number
  labelY: number
  labelText: string
  labelColor: string
  startAngle: number
  endAngle: number
  value: number
  label: string
}

const slices = computed<ISlice[]>(() => {
  if (!total.value) return []
  let angle = -Math.PI / 2
  const out: ISlice[] = []
  for (let i = 0; i < resolvedData.value.length; i++) {
    const d = resolvedData.value[i]
    const portion = Math.max(0, d.value) / total.value
    const start = angle
    const end = angle + portion * Math.PI * 2
    angle = end
    const path = arcPath(start, end, innerR.value, radius.value)
    const mid = (start + end) / 2
    const labelR =
      innerR.value > 0 ? (innerR.value + radius.value) / 2 : radius.value * 0.65
    const labelX = Math.cos(mid) * labelR
    const labelY = Math.sin(mid) * labelR
    const labelText =
      props.labels === 'percent'
        ? `${Math.round(portion * 100)}%`
        : props.labels === 'value'
          ? String(d.value)
          : ''
    out.push({
      path,
      color: d.color,
      labelX,
      labelY,
      labelText,
      labelColor: 'var(--nb-c-white)',
      startAngle: start,
      endAngle: end,
      value: d.value,
      label: d.label,
    })
  }
  return out
})

const arcPath = (
  start: number,
  end: number,
  r0: number,
  r1: number,
): string => {
  // Full-circle slice: render as ring with two half-arcs to keep SVG happy.
  if (Math.abs(end - start) >= Math.PI * 2 - 1e-6) {
    const top = `M ${r1} 0 A ${r1} ${r1} 0 1 1 ${-r1} 0 A ${r1} ${r1} 0 1 1 ${r1} 0 Z`
    if (r0 <= 0) return top
    const innerLoop = `M ${r0} 0 A ${r0} ${r0} 0 1 0 ${-r0} 0 A ${r0} ${r0} 0 1 0 ${r0} 0 Z`
    return `${top} ${innerLoop}`
  }
  const x0 = Math.cos(start) * r1
  const y0 = Math.sin(start) * r1
  const x1 = Math.cos(end) * r1
  const y1 = Math.sin(end) * r1
  const large = end - start > Math.PI ? 1 : 0
  if (r0 <= 0) {
    return `M 0 0 L ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} Z`
  }
  const ix0 = Math.cos(end) * r0
  const iy0 = Math.sin(end) * r0
  const ix1 = Math.cos(start) * r0
  const iy1 = Math.sin(start) * r0
  return [
    `M ${x0} ${y0}`,
    `A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1}`,
    `L ${ix0} ${iy0}`,
    `A ${r0} ${r0} 0 ${large} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}

const hoverIndex = ref<number | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const updateTooltip = (e: MouseEvent) => {
  const target = e.currentTarget as SVGElement
  const svg = target.ownerSVGElement
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  tooltipPos.value = {
    x: e.clientX - rect.left + 12,
    y: e.clientY - rect.top + 12,
  }
}

const tooltipRows = computed(() => {
  if (hoverIndex.value === null) return []
  const slice = slices.value[hoverIndex.value]
  if (!slice) return []
  const pct = total.value ? Math.round((slice.value / total.value) * 100) : 0
  return [
    {
      label: slice.label,
      value: `${slice.value} (${pct}%)`,
      color: slice.color,
    },
  ]
})
</script>

<style lang="scss" scoped>
.nb-pie-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.nb-chart__svg {
  display: block;
}

.nb-chart__slice {
  transition: opacity 120ms ease;
  &.is-dim {
    opacity: 0.35;
  }
}

.nb-chart__slice-label {
  font-family: var(--nb-font-family-sans);
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}
</style>
