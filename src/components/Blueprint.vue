<template>
  <div
    ref="containerRef"
    class="nb-blueprint"
    @mousedown="onCanvasMouseDown"
    @wheel.prevent="onWheel"
  >
    <!-- Ambient gradient overlays -->
    <div class="nb-blueprint__ambient" />

    <!-- Grid background -->
    <div
      class="nb-blueprint__grid"
      :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }"
    />

    <!-- Panned + zoomed canvas -->
    <div
      class="nb-blueprint__canvas"
      :style="{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }"
    >
      <!-- Wire SVG layer -->
      <svg class="nb-blueprint__wires">
        <path
          v-for="(wire, i) in computedWires"
          :key="i"
          :d="wire.path"
          fill="none"
          :stroke="wire.color"
          stroke-width="1.5"
          class="nb-blueprint__wire"
          :style="{ filter: `drop-shadow(0 0 6px ${wire.color})` }"
          @click="$emit('disconnect', wire.conn)"
        />
        <!-- Animated flow overlay for each wire -->
        <path
          v-for="(wire, i) in computedWires"
          :key="`flow-${i}`"
          :d="wire.path"
          fill="none"
          :stroke="wire.color"
          stroke-width="1.5"
          stroke-dasharray="4 8"
          class="nb-blueprint__wire-flow"
          pointer-events="none"
        />
        <!-- Active wire being dragged -->
        <path
          v-if="dragWire"
          :d="dragWire"
          fill="none"
          stroke="var(--nb-c-primary)"
          stroke-width="2"
          stroke-dasharray="6 3"
          opacity="0.6"
        />
      </svg>

      <!-- Card slots -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { IBlueprintConnection, IBlueprintProps } from './Blueprint.d'

const props = withDefaults(defineProps<IBlueprintProps>(), {
  connections: () => [],
})

const emit = defineEmits<{
  connect: [conn: IBlueprintConnection]
  disconnect: [conn: IBlueprintConnection]
}>()

const containerRef = ref<HTMLDivElement>()
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const wireKey = ref(0)

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3.0

// ── Panning ────────────────────────────────────────────────────────────

let isPanning = false
let panStartX = 0
let panStartY = 0

function onCanvasMouseDown(e: MouseEvent) {
  if (
    (e.target as HTMLElement).closest(
      '.nb-blueprint-card, .nb-blueprint-card__port',
    )
  )
    return
  isPanning = true
  panStartX = e.clientX - panX.value
  panStartY = e.clientY - panY.value
  document.addEventListener('mousemove', onPanMove)
  document.addEventListener('mouseup', onPanEnd)
}

function onPanMove(e: MouseEvent) {
  if (!isPanning) return
  panX.value = e.clientX - panStartX
  panY.value = e.clientY - panStartY
  wireKey.value++
}

function onPanEnd() {
  isPanning = false
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onPanEnd)
}

// ── Zoom (focal-point) ─────────────────────────────────────────────────

function onWheel(e: WheelEvent) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return

  const oldZoom = zoom.value
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + delta))
  if (newZoom === oldZoom) return

  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const canvasX = (mouseX - panX.value) / oldZoom
  const canvasY = (mouseY - panY.value) / oldZoom

  panX.value = mouseX - canvasX * newZoom
  panY.value = mouseY - canvasY * newZoom
  zoom.value = newZoom
}

// ── Wire connections ───────────────────────────────────────────────────

// Dragging a new wire
const dragWire = ref<string | null>(null)
let dragFrom: { nodeId: string; portId: string; type: string } | null = null

function onPortMouseDown(data: {
  nodeId: string
  portId: string
  type: string
}) {
  dragFrom = data
  document.addEventListener('mousemove', onWireDrag)
  document.addEventListener('mouseup', onWireDragEnd)
}

function onWireDrag(e: MouseEvent) {
  if (!dragFrom || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left - panX.value) / zoom.value
  const my = (e.clientY - rect.top - panY.value) / zoom.value

  const fromEl = containerRef.value.querySelector(
    `[data-port="${dragFrom.nodeId}:${dragFrom.portId}"]`,
  ) as HTMLElement
  if (!fromEl) return

  const fromRect = fromEl.getBoundingClientRect()
  const fx =
    (fromRect.left + fromRect.width / 2 - rect.left - panX.value) / zoom.value
  const fy =
    (fromRect.top + fromRect.height / 2 - rect.top - panY.value) / zoom.value

  const cpx = Math.abs(mx - fx) * 0.5
  dragWire.value = `M ${fx} ${fy} C ${fx + cpx} ${fy}, ${mx - cpx} ${my}, ${mx} ${my}`
}

function onWireDragEnd() {
  dragFrom = null
  dragWire.value = null
  document.removeEventListener('mousemove', onWireDrag)
  document.removeEventListener('mouseup', onWireDragEnd)
}

function onPortMouseUp(data: { nodeId: string; portId: string; type: string }) {
  if (!dragFrom) return
  if (dragFrom.nodeId === data.nodeId) return
  if (dragFrom.type === data.type) return

  const from = dragFrom.type === 'output' ? dragFrom : data
  const to = dragFrom.type === 'output' ? data : dragFrom

  emit('connect', {
    fromNode: from.nodeId,
    fromPort: from.portId,
    toNode: to.nodeId,
    toPort: to.portId,
  })

  dragFrom = null
  dragWire.value = null
}

// ── Wire paths ─────────────────────────────────────────────────────────

function resolveWireColor(fromPortEl: HTMLElement): string {
  // Walk up to the card and read its accent color
  const card = fromPortEl.closest('.nb-blueprint-card') as HTMLElement | null
  if (card) {
    const color = getComputedStyle(card)
      .getPropertyValue('--nb-card-color')
      .trim()
    if (color && !color.startsWith('var(')) return color
  }
  return 'var(--nb-c-primary)'
}

const computedWires = computed(() => {
  void wireKey.value // reactive dependency for re-computation
  if (!containerRef.value) return []

  const rect = containerRef.value.getBoundingClientRect()
  return props.connections
    .map((conn) => {
      const fromEl = containerRef.value!.querySelector(
        `[data-port="${conn.fromNode}:${conn.fromPort}"]`,
      ) as HTMLElement
      const toEl = containerRef.value!.querySelector(
        `[data-port="${conn.toNode}:${conn.toPort}"]`,
      ) as HTMLElement

      if (!fromEl || !toEl) return null

      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()
      const fx = (fr.left + fr.width / 2 - rect.left - panX.value) / zoom.value
      const fy = (fr.top + fr.height / 2 - rect.top - panY.value) / zoom.value
      const tx = (tr.left + tr.width / 2 - rect.left - panX.value) / zoom.value
      const ty = (tr.top + tr.height / 2 - rect.top - panY.value) / zoom.value

      const cpx = Math.abs(tx - fx) * 0.4
      const path = `M ${fx} ${fy} C ${fx + cpx} ${fy}, ${tx - cpx} ${ty}, ${tx} ${ty}`
      const color = resolveWireColor(fromEl)
      return { path, conn, color }
    })
    .filter(Boolean) as {
    path: string
    conn: IBlueprintConnection
    color: string
  }[]
})

// ── Public API ─────────────────────────────────────────────────────────

function centerView() {
  zoom.value = 1
  if (!containerRef.value) return

  const cards = containerRef.value.querySelectorAll('.nb-blueprint-card')
  if (cards.length === 0) {
    panX.value = 0
    panY.value = 0
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  cards.forEach((card) => {
    const cr = card.getBoundingClientRect()
    const x = (cr.left - rect.left - panX.value) / zoom.value
    const y = (cr.top - rect.top - panY.value) / zoom.value
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + cr.width / zoom.value)
    maxY = Math.max(maxY, y + cr.height / zoom.value)
  })

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  panX.value = rect.width / 2 - cx
  panY.value = rect.height / 2 - cy
}

// Re-compute wires when DOM changes
const observer = new MutationObserver(() => {
  wireKey.value++
})
onMounted(() => {
  if (containerRef.value) {
    observer.observe(containerRef.value, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }
  nextTick(() => nextTick(centerView))
})
onBeforeUnmount(() => observer.disconnect())

// Expose for external port event wiring
defineExpose({ centerView, onPortMouseDown, onPortMouseUp, panX, panY, zoom })
</script>

<style scoped lang="scss">
.nb-blueprint {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: var(--nb-c-layer-0, var(--nb-c-bg));
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// Ambient radial gradients for atmosphere
.nb-blueprint__ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(
      ellipse 80% 50% at 50% 0%,
      rgba(139, 124, 255, 0.04),
      transparent 60%
    ),
    radial-gradient(
      ellipse 60% 40% at 80% 100%,
      rgba(255, 157, 74, 0.03),
      transparent 60%
    );
}

.nb-blueprint__grid {
  position: absolute;
  inset: -2000px;
  background-image: radial-gradient(
    circle,
    var(--nb-c-border) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  pointer-events: none;
  opacity: 0.4;
  // Fade dots at edges with a radial mask
  mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );
}

.nb-blueprint__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.nb-blueprint__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.nb-blueprint__wire {
  pointer-events: stroke;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.8;
    stroke-width: 3;
  }
}

.nb-blueprint__wire-flow {
  opacity: 0.55;
  animation: nb-wire-flow 2.4s linear infinite;
}

@keyframes nb-wire-flow {
  to {
    stroke-dashoffset: -24;
  }
}
</style>
