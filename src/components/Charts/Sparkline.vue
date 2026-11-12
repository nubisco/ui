<template>
  <svg
    class="nb-sparkline"
    :class="{ 'nb-sparkline--animate': animate }"
    :style="rootStyle"
    :viewBox="viewBox"
    preserveAspectRatio="none"
    role="img"
    :aria-label="nbStrings.chartSparkline"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
      <!-- The wipe: a rectangle that grows from the left edge and reveals the
           line and its fill. It is wider than the viewBox on every side, so
           the stroke is never clipped, and it is attached only while the
           wipe runs. -->
      <clipPath v-if="animate" :id="clipId">
        <rect
          :key="runKey"
          class="nb-sparkline__wipe"
          x="-5"
          y="-5"
          :width="VIEW_W + 10"
          :height="VIEW_H + 10"
          @animationend="wiping = false"
        />
      </clipPath>
    </defs>
    <path
      v-if="fill && paths.area"
      :d="paths.area"
      :fill="`url(#${gradientId})`"
      :clip-path="clip"
      stroke="none"
    />
    <path
      v-if="paths.line"
      :d="paths.line"
      :stroke="color"
      :stroke-width="strokeWidth"
      :clip-path="clip"
      vector-effect="non-scaling-stroke"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { computed, ref, useId, watch } from 'vue'
import { useChartEntrance } from './shared/useChartEntrance'
import type { ISparklineProps } from './Sparkline.d'

const nbStrings = useNbStrings()

const props = withDefaults(defineProps<ISparklineProps>(), {
  color: 'var(--nb-c-primary)',
  height: 40,
  width: '100%',
  strokeWidth: 1.5,
  fill: true,
  smooth: true,
  animate: false,
})

// Internal viewBox space. Paths are computed in 0..VIEW_W by 0..VIEW_H,
// then preserveAspectRatio="none" lets the SVG stretch to the container.
const VIEW_W = 100
const VIEW_H = 30
const viewBox = `0 0 ${VIEW_W} ${VIEW_H}`

// Per-instance gradient id, prevents collisions when several sparklines
// render on the same page.
const gradientId = `nb-sparkline-grad-${useId()}`

const clipId = `nb-sparkline-wipe-${useId()}`

// The wipe replays when the data changes: see useChartEntrance. `wiping` keeps
// the clip on only for as long as the wipe runs.
const { runKey } = useChartEntrance(
  () => props.animate,
  () => props.data,
)
const wiping = ref(true)
const clip = computed(() =>
  props.animate && wiping.value ? `url(#${clipId})` : undefined,
)
watch(runKey, () => {
  wiping.value = true
})

const rootStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))

const paths = computed(() => {
  const data = props.data
  if (!data || data.length < 2) return { line: '', area: '' }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = VIEW_W / (data.length - 1)

  // Vertical padding so the line never touches the top or bottom edge,
  // which would clip the stroke under non-scaling-stroke at high widths.
  const padTop = VIEW_H * 0.08
  const usable = VIEW_H - padTop * 2

  const points = data.map((v, i) => ({
    x: i * step,
    y: VIEW_H - padTop - ((v - min) / range) * usable,
  }))

  let line = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  if (props.smooth) {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cp1x = prev.x + step * 0.45
      const cp1y = prev.y
      const cp2x = curr.x - step * 0.45
      const cp2y = curr.y
      line += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
    }
  } else {
    for (let i = 1; i < points.length; i++) {
      line += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`
    }
  }

  const last = points[points.length - 1]
  const area = `${line} L ${last.x.toFixed(2)} ${VIEW_H} L ${points[0].x.toFixed(2)} ${VIEW_H} Z`

  return { line, area }
})
</script>

<style lang="scss" scoped>
@use '../../styles/logic/motion' as motion;

.nb-sparkline {
  display: block;
  overflow: visible;
}

// Entrance: opt-in through `animate`. The clip grows from the left edge.
// `backwards` holds the empty first frame and lets go at the end.
.nb-sparkline__wipe {
  transform-box: view-box;
  transform-origin: 0 0;
  animation: nb-sparkline-wipe var(--nb-motion-long) var(--nb-ease-enter)
    backwards;
}

@keyframes nb-sparkline-wipe {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@include motion.reduced {
  .nb-sparkline__wipe {
    animation: none;
  }
}
</style>
