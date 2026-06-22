<template>
  <svg
    class="nb-blueprint-minimap"
    :class="`nb-blueprint-minimap--${position}`"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    role="img"
    aria-label="Blueprint minimap"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
  >
    <rect
      class="nb-blueprint-minimap__bg"
      x="0"
      y="0"
      :width="width"
      :height="height"
      rx="8"
    />
    <g v-if="layout">
      <rect
        v-for="node in nodes"
        :key="node.id"
        class="nb-blueprint-minimap__node"
        :x="node.x"
        :y="node.y"
        :width="node.w"
        :height="node.h"
        :fill="node.color"
        rx="1.5"
      />
      <rect
        class="nb-blueprint-minimap__viewport"
        :x="viewportRect.x"
        :y="viewportRect.y"
        :width="viewportRect.w"
        :height="viewportRect.h"
        rx="2"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IBlueprintCard } from './Blueprint.types'
import type { IBlueprintMinimapProps } from './BlueprintMinimap.d'
import { useBlueprint } from '../composables/useBlueprint.composable'

const DEFAULT_W = 220
const DEFAULT_H = 120
const PAD = 10

const props = withDefaults(defineProps<IBlueprintMinimapProps>(), {
  position: 'bottom-left',
  width: 200,
  height: 140,
  pannable: true,
  nodeColor: undefined,
})

const bp = useBlueprint()

interface IBox {
  x: number
  y: number
  w: number
  h: number
}

function cardBox(c: IBlueprintCard): IBox {
  return {
    x: c.x,
    y: c.y,
    w: c.width ?? DEFAULT_W,
    h: c.height ?? DEFAULT_H,
  }
}

// Current viewport in world (canvas) coordinates.
const worldViewport = computed<IBox>(() => {
  const { w, h } = bp.viewportSize.value
  const z = bp.zoom.value || 1
  return { x: -bp.panX.value / z, y: -bp.panY.value / z, w: w / z, h: h / z }
})

// World bounds: union of all card boxes and the current viewport, so the
// viewport indicator is always in frame even when panned away from content.
const worldBounds = computed(() => {
  const boxes = props.cards.map(cardBox)
  boxes.push(worldViewport.value)
  if (!boxes.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  return { minX, minY, maxX, maxY }
})

// Mapping from world space into the minimap's pixel box (scale + centered
// offset), fitting the bounds with padding.
const layout = computed(() => {
  const b = worldBounds.value
  if (!b) return null
  const cw = Math.max(1, b.maxX - b.minX)
  const ch = Math.max(1, b.maxY - b.minY)
  const scale = Math.min(
    (props.width - PAD * 2) / cw,
    (props.height - PAD * 2) / ch,
  )
  const offX = (props.width - cw * scale) / 2
  const offY = (props.height - ch * scale) / 2
  return { minX: b.minX, minY: b.minY, scale, offX, offY }
})

function toMini(x: number, y: number): [number, number] {
  const l = layout.value!
  return [l.offX + (x - l.minX) * l.scale, l.offY + (y - l.minY) * l.scale]
}

const nodes = computed(() => {
  if (!layout.value) return []
  const l = layout.value
  return props.cards.map((c) => {
    const box = cardBox(c)
    const [x, y] = toMini(box.x, box.y)
    const loose = c as IBlueprintCard & {
      paint?: { color?: string }
      color?: string
    }
    return {
      id: c.id,
      x,
      y,
      w: Math.max(1, box.w * l.scale),
      h: Math.max(1, box.h * l.scale),
      color:
        props.nodeColor ??
        loose.paint?.color ??
        loose.color ??
        'var(--nb-c-text-muted, #9090a0)',
    }
  })
})

const viewportRect = computed(() => {
  const l = layout.value
  const v = worldViewport.value
  if (!l) return { x: 0, y: 0, w: 0, h: 0 }
  const [x, y] = toMini(v.x, v.y)
  return { x, y, w: v.w * l.scale, h: v.h * l.scale }
})

// ── Pan interaction ──────────────────────────────────────────────────
const dragging = ref(false)

function recenter(ev: PointerEvent): void {
  const l = layout.value
  if (!l) return
  const svg = ev.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const mx = ev.clientX - rect.left
  const my = ev.clientY - rect.top
  // Minimap pixel -> world.
  const wx = (mx - l.offX) / l.scale + l.minX
  const wy = (my - l.offY) / l.scale + l.minY
  // Center the viewport on that world point.
  const { w, h } = bp.viewportSize.value
  const z = bp.zoom.value || 1
  bp.panX.value = w / 2 - wx * z
  bp.panY.value = h / 2 - wy * z
}

function onPointerDown(ev: PointerEvent): void {
  if (!props.pannable) return
  dragging.value = true
  ;(ev.currentTarget as SVGSVGElement).setPointerCapture?.(ev.pointerId)
  recenter(ev)
}
function onPointerMove(ev: PointerEvent): void {
  if (dragging.value) recenter(ev)
}
function onPointerUp(ev: PointerEvent): void {
  dragging.value = false
  ;(ev.currentTarget as SVGSVGElement).releasePointerCapture?.(ev.pointerId)
}
</script>

<style scoped lang="scss">
.nb-blueprint-minimap {
  position: absolute;
  z-index: 1;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 18%);
  cursor: pointer;
  touch-action: none;

  &--top-left {
    top: 12px;
    left: 12px;
  }
  &--top-right {
    top: 12px;
    right: 12px;
  }
  &--bottom-left {
    bottom: 12px;
    left: 12px;
  }
  &--bottom-right {
    bottom: 12px;
    right: 12px;
  }
}

.nb-blueprint-minimap__bg {
  fill: var(--nb-c-layer-1, var(--nb-c-bg));
  stroke: var(--nb-c-border);
  stroke-width: 1;
}

.nb-blueprint-minimap__node {
  opacity: 0.7;
}

.nb-blueprint-minimap__viewport {
  fill: var(--nb-c-primary, #6366f1);
  fill-opacity: 0.12;
  stroke: var(--nb-c-primary, #6366f1);
  stroke-width: 1.5;
}
</style>
