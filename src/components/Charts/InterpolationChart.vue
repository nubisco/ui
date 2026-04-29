<template>
  <ChartFrame
    :title="title"
    :subtitle="subtitle"
    :height="height"
    :show-legend="false"
  >
    <div ref="root" class="nb-interpolation-chart">
      <svg
        :width="size.width"
        :height="size.height"
        class="nb-chart__svg"
        role="img"
        :aria-label="title || 'Interpolation chart'"
        @mousemove="onMove"
        @mouseleave="onLeave"
        @mouseup="onUp"
        @dblclick="onDblClick"
        @contextmenu.prevent
      >
        <!-- Y-axis gridlines -->
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

        <!-- Y-axis labels -->
        <g class="nb-chart__axis">
          <text
            v-for="t in yTicks"
            :key="`yt-${t}`"
            :x="margin.left - 6"
            :y="yScale(t)"
            text-anchor="end"
            dominant-baseline="middle"
          >
            {{ formatNum(t) }}
          </text>
        </g>

        <!-- X-axis labels -->
        <g class="nb-chart__axis">
          <text
            v-for="t in xTicks"
            :key="`xt-${t}`"
            :x="xScale(t)"
            :y="size.height - margin.bottom + 14"
            text-anchor="middle"
          >
            {{ formatNum(t) }}
          </text>
        </g>

        <!-- X-axis line -->
        <line
          class="nb-chart__axis-line"
          :x1="margin.left"
          :x2="size.width - margin.right"
          :y1="size.height - margin.bottom"
          :y2="size.height - margin.bottom"
        />

        <!-- Y-axis label (rotated) -->
        <text
          v-if="outputLabel"
          class="nb-chart__axis-label"
          :x="12"
          :y="margin.top + plotHeight / 2"
          text-anchor="middle"
          :transform="`rotate(-90, 12, ${margin.top + plotHeight / 2})`"
        >
          {{ outputLabel }}
        </text>

        <!-- X-axis label -->
        <text
          v-if="inputLabel"
          class="nb-chart__axis-label"
          :x="margin.left + plotWidth / 2"
          :y="size.height - 2"
          text-anchor="middle"
        >
          {{ inputLabel }}
        </text>

        <!-- Area fill -->
        <path
          v-if="sortedPoints.length >= 2"
          class="nb-interpolation-chart__area"
          :d="areaPath"
          :fill="lineColor"
          opacity="0.12"
        />

        <!-- Line path -->
        <path
          v-if="sortedPoints.length >= 2"
          class="nb-interpolation-chart__line"
          :d="linePath"
          :stroke="lineColor"
          fill="none"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Draggable points -->
        <circle
          v-for="(pt, i) in sortedPoints"
          :key="`pt-${i}`"
          class="nb-interpolation-chart__point"
          :class="{
            'nb-interpolation-chart__point--editable': editable,
            'nb-interpolation-chart__point--dragging': draggingIndex === i,
            'nb-interpolation-chart__point--hover':
              hoverIndex === i && draggingIndex === null,
          }"
          :cx="xScale(pt.input)"
          :cy="yScale(pt.output)"
          :r="draggingIndex === i ? 7 : hoverIndex === i ? 6 : 5"
          :fill="lineColor"
          :stroke="pointStroke"
          stroke-width="2"
          @mousedown.prevent="onPointDown(i, $event)"
          @contextmenu.prevent="onPointContextMenu(i)"
        />

        <!-- Hover crosshair while dragging -->
        <g v-if="draggingIndex !== null">
          <line
            class="nb-interpolation-chart__crosshair"
            :x1="xScale(sortedPoints[draggingIndex].input)"
            :x2="xScale(sortedPoints[draggingIndex].input)"
            :y1="margin.top"
            :y2="size.height - margin.bottom"
          />
          <line
            class="nb-interpolation-chart__crosshair"
            :x1="margin.left"
            :x2="size.width - margin.right"
            :y1="yScale(sortedPoints[draggingIndex].output)"
            :y2="yScale(sortedPoints[draggingIndex].output)"
          />
        </g>
      </svg>

      <ChartTooltip
        :visible="showTooltip && tooltipVisible"
        :x="tooltipPos.x"
        :y="tooltipPos.y"
        :title="tooltipTitle"
        :rows="tooltipRows"
      />
    </div>
  </ChartFrame>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { linear, padDomain } from './shared/scales'
import { useChartSize } from './shared/useChartSize'
import type {
  IInterpolationChartProps,
  IInterpolationPoint,
} from './InterpolationChart.d'

const props = withDefaults(defineProps<IInterpolationChartProps>(), {
  title: undefined,
  subtitle: undefined,
  height: 280,
  showLegend: false,
  showTooltip: true,
  showGrid: true,
  colors: () => [],
  modelValue: () => [],
  inputLabel: undefined,
  outputLabel: undefined,
  inputMin: 0,
  inputMax: 100,
  outputMin: 0,
  outputMax: 100,
  editable: true,
  minPoints: 2,
  inputStep: 0,
  outputStep: 0,
})

const emit = defineEmits<{
  'update:modelValue': [value: IInterpolationPoint[]]
}>()

const lineColor = 'var(--nb-c-grape-hyacinth-500)'
const pointStroke = 'var(--nb-c-surface)'

const margin = { top: 16, right: 16, bottom: 32, left: 48 }

const root = ref<HTMLElement | null>(null)
const size = useChartSize(root, { width: 480, height: 240 })

const plotWidth = computed(() =>
  Math.max(0, size.value.width - margin.left - margin.right),
)
const plotHeight = computed(() =>
  Math.max(0, size.value.height - margin.top - margin.bottom),
)

// Sort points by input on every render
const sortedPoints = computed(() =>
  [...props.modelValue].sort((a, b) => a.input - b.input),
)

// Scales
const xDomain = computed<[number, number]>(() => [
  props.inputMin,
  props.inputMax,
])
const yDomain = computed<[number, number]>(() => {
  const allY = sortedPoints.value.map((p) => p.output)
  const min = Math.min(props.outputMin, ...allY)
  const max = Math.max(props.outputMax, ...allY)
  return padDomain(min, max, 0.05)
})

const xScale = computed(() =>
  linear(xDomain.value, [margin.left, size.value.width - margin.right]),
)
const yScale = computed(() =>
  linear(yDomain.value, [size.value.height - margin.bottom, margin.top]),
)

const xTicks = computed(() => xScale.value.ticks(6))
const yTicks = computed(() => yScale.value.ticks(5))

// Invert pixel position back to data coordinates
const invertX = (px: number): number => {
  const [d0, d1] = xDomain.value
  const [r0, r1] = xScale.value.range
  const ratio = (px - r0) / (r1 - r0)
  return d0 + ratio * (d1 - d0)
}

const invertY = (py: number): number => {
  const [d0, d1] = yDomain.value
  const [r0, r1] = yScale.value.range
  const ratio = (py - r0) / (r1 - r0)
  return d0 + ratio * (d1 - d0)
}

// Snap a value to the nearest step (if step > 0)
const snap = (value: number, step: number): number => {
  if (!step || step <= 0) return value
  return Math.round(value / step) * step
}

// Clamp a number to [min, max]
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

// Round to reasonable precision
const round = (value: number, decimals = 1): number =>
  Math.round(value * 10 ** decimals) / 10 ** decimals

// SVG paths
const linePath = computed(() => {
  const pts = sortedPoints.value
  if (pts.length < 2) return ''
  return pts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${xScale.value(p.input)},${yScale.value(p.output)}`,
    )
    .join(' ')
})

const areaPath = computed(() => {
  const pts = sortedPoints.value
  if (pts.length < 2) return ''
  const baseline = size.value.height - margin.bottom
  const top = pts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${xScale.value(p.input)},${yScale.value(p.output)}`,
    )
    .join(' ')
  const lastX = xScale.value(pts[pts.length - 1].input)
  const firstX = xScale.value(pts[0].input)
  return `${top} L${lastX},${baseline} L${firstX},${baseline} Z`
})

// ---- Drag state ----
const draggingIndex = ref<number | null>(null)
const hoverIndex = ref<number | null>(null)

function emitUpdate(points: IInterpolationPoint[]) {
  const sorted = [...points].sort((a, b) => a.input - b.input)
  emit('update:modelValue', sorted)
}

function onPointDown(index: number, _e: MouseEvent) {
  if (!props.editable) return
  draggingIndex.value = index
  // Attach window listeners so dragging continues outside the SVG
  window.addEventListener('mousemove', onWindowMove)
  window.addEventListener('mouseup', onWindowUp)
}

function getSvgCoords(e: MouseEvent): { px: number; py: number } | null {
  const svgEl = root.value?.querySelector('svg')
  if (!svgEl) return null
  const rect = svgEl.getBoundingClientRect()
  return { px: e.clientX - rect.left, py: e.clientY - rect.top }
}

function onWindowMove(e: MouseEvent) {
  if (draggingIndex.value === null) return
  const coords = getSvgCoords(e)
  if (!coords) return

  const rawInput = invertX(coords.px)
  const rawOutput = invertY(coords.py)

  const points = [...sortedPoints.value]
  const idx = draggingIndex.value

  // Clamp input between neighbors (points cannot cross each other)
  const minInput = idx > 0 ? points[idx - 1].input + 0.1 : props.inputMin
  const maxInput =
    idx < points.length - 1 ? points[idx + 1].input - 0.1 : props.inputMax

  const newInput = round(
    snap(clamp(rawInput, minInput, maxInput), props.inputStep),
  )
  const newOutput = round(
    snap(clamp(rawOutput, props.outputMin, props.outputMax), props.outputStep),
  )

  points[idx] = { input: newInput, output: newOutput }
  emitUpdate(points)
}

function onWindowUp() {
  draggingIndex.value = null
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('mouseup', onWindowUp)
}

function onMove(e: MouseEvent) {
  if (draggingIndex.value !== null) return
  const coords = getSvgCoords(e)
  if (!coords) return

  // Find nearest point
  let nearest = -1
  let minDist = Infinity
  for (let i = 0; i < sortedPoints.value.length; i++) {
    const pt = sortedPoints.value[i]
    const dx = xScale.value(pt.input) - coords.px
    const dy = yScale.value(pt.output) - coords.py
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      nearest = i
    }
  }
  hoverIndex.value = minDist < 20 ? nearest : null

  // Update tooltip position
  tooltipPos.value = { x: coords.px + 12, y: coords.py - 12 }
}

function onLeave() {
  if (draggingIndex.value === null) {
    hoverIndex.value = null
  }
}

function onUp() {
  if (draggingIndex.value !== null) {
    draggingIndex.value = null
    window.removeEventListener('mousemove', onWindowMove)
    window.removeEventListener('mouseup', onWindowUp)
  }
}

// Double-click to add a point
function onDblClick(e: MouseEvent) {
  if (!props.editable) return
  const coords = getSvgCoords(e)
  if (!coords) return

  const rawInput = invertX(coords.px)
  const rawOutput = invertY(coords.py)

  // Only add within the plot area
  if (rawInput < props.inputMin || rawInput > props.inputMax) return
  if (rawOutput < props.outputMin || rawOutput > props.outputMax) return

  const newInput = round(
    snap(clamp(rawInput, props.inputMin, props.inputMax), props.inputStep),
  )
  const newOutput = round(
    snap(clamp(rawOutput, props.outputMin, props.outputMax), props.outputStep),
  )

  const points = [...sortedPoints.value, { input: newInput, output: newOutput }]
  emitUpdate(points)
}

// Right-click to remove a point
function onPointContextMenu(index: number) {
  if (!props.editable) return
  if (sortedPoints.value.length <= props.minPoints) return
  const points = sortedPoints.value.filter((_, i) => i !== index)
  emitUpdate(points)
}

// Clean up window listeners
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMove)
  window.removeEventListener('mouseup', onWindowUp)
})

// ---- Tooltip ----
const tooltipPos = ref({ x: 0, y: 0 })

const tooltipVisible = computed(() => {
  return hoverIndex.value !== null || draggingIndex.value !== null
})

const tooltipTitle = computed(() => {
  const idx = draggingIndex.value ?? hoverIndex.value
  if (idx === null) return ''
  return `Point ${idx + 1}`
})

const tooltipRows = computed(() => {
  const idx = draggingIndex.value ?? hoverIndex.value
  if (idx === null || idx >= sortedPoints.value.length) return []
  const pt = sortedPoints.value[idx]
  return [
    {
      label: props.inputLabel || 'Input',
      value: formatNum(pt.input),
      color: lineColor,
    },
    {
      label: props.outputLabel || 'Output',
      value: formatNum(pt.output),
      color: lineColor,
    },
  ]
})

const formatNum = (n: number) => {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
</script>

<style lang="scss" scoped>
.nb-interpolation-chart {
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

.nb-chart__axis-label {
  font-family: var(--nb-font-family-sans);
  font-size: 10px;
  fill: var(--nb-c-text-muted);
  letter-spacing: 0.02em;
}

.nb-interpolation-chart__line {
  pointer-events: none;
}

.nb-interpolation-chart__area {
  pointer-events: none;
}

.nb-interpolation-chart__point {
  transition: r 120ms ease;

  &--editable {
    cursor: grab;
  }

  &--dragging {
    cursor: grabbing;
  }

  &--hover {
    filter: brightness(1.15);
  }
}

.nb-interpolation-chart__crosshair {
  stroke: var(--nb-c-component-plain-border);
  stroke-dasharray: 3 3;
  stroke-width: 1;
  pointer-events: none;
  opacity: 0.5;
}
</style>
