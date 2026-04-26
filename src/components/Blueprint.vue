<template>
  <div
    ref="containerRef"
    class="nb-blueprint"
    :class="{
      'is-panning': isPanning,
      'is-space': spaceHeld,
    }"
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

    <!-- Marquee selection overlay (rendered in viewport space) -->
    <div v-if="marquee" class="nb-blueprint__marquee" :style="marqueeStyle" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type {
  IBlueprintConnection,
  IBlueprintCardMove,
  IBlueprintProps,
} from './Blueprint.d'

const props = withDefaults(defineProps<IBlueprintProps>(), {
  connections: () => [],
})

const emit = defineEmits<{
  connect: [conn: IBlueprintConnection]
  disconnect: [conn: IBlueprintConnection]
  move: [moves: IBlueprintCardMove[]]
  'selection-change': [ids: string[]]
  focus: [id: string | null]
}>()

const containerRef = ref<HTMLDivElement>()
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const wireKey = ref(0)

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3.0
const DRAG_THRESHOLD = 4

// ── Selection state ───────────────────────────────────────────────────
//
// Two concepts:
// - "focused" (single card): the card the user last clicked without shift.
//   Clients use this for inspector panels. Emitted via the `focus` event.
// - "selected" (one or more cards): the set of cards that move/align together.
//   Emitted via `selection-change`.

const selectedIds = ref<Set<string>>(new Set())
const focusedId = ref<string | null>(null)

function setFocus(id: string | null) {
  focusedId.value = id
  emit('focus', id)
}

function setSelection(ids: string[]) {
  selectedIds.value = new Set(ids)
  emit('selection-change', ids)
}

function selectAll() {
  if (!containerRef.value) return
  const ids: string[] = []
  containerRef.value.querySelectorAll('[data-card-id]').forEach((el) => {
    const id = (el as HTMLElement).dataset.cardId
    if (id) ids.push(id)
  })
  setSelection(ids)
}

function deselectAll() {
  setSelection([])
  setFocus(null)
}

// ── Space key tracking (for pan mode) ─────────────────────────────────

const spaceHeld = ref(false)

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat) {
    spaceHeld.value = true
    e.preventDefault()
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    spaceHeld.value = false
  }
}

// ── Canvas mousedown dispatcher ───────────────────────────────────────

let isPanning = false
let panStartX = 0
let panStartY = 0

function onCanvasMouseDown(e: MouseEvent) {
  // Port interactions (wire dragging) take priority
  const portEl = (e.target as HTMLElement).closest('.nb-blueprint-card__port')
  if (portEl) return

  // Middle mouse button always pans
  if (e.button === 1) {
    startPan(e)
    return
  }

  // Space + left click = pan
  if (spaceHeld.value) {
    startPan(e)
    return
  }

  // Left click on a card = select + drag
  const cardEl = (e.target as HTMLElement).closest(
    '.nb-blueprint-card',
  ) as HTMLElement | null
  if (cardEl) {
    onCardMouseDown(e, cardEl)
    return
  }

  // Left click on empty canvas = marquee select
  startMarquee(e)
}

// ── Panning ───────────────────────────────────────────────────────────

function startPan(e: MouseEvent) {
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

// ── Zoom (focal-point) ────────────────────────────────────────────────

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

// ── Card drag ─────────────────────────────────────────────────────────

let isDraggingCards = false
let dragMouseStartX = 0
let dragMouseStartY = 0
let dragStartPositions = new Map<string, { x: number; y: number }>()
let dragDidMove = false

function getCardPosition(cardEl: HTMLElement): { x: number; y: number } {
  const wrapper = cardEl.parentElement
  if (!wrapper) return { x: 0, y: 0 }
  const style = wrapper.style.transform || ''
  const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)/)
  if (match) return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
  return { x: wrapper.offsetLeft, y: wrapper.offsetTop }
}

function setCardPosition(cardEl: HTMLElement, x: number, y: number) {
  const wrapper = cardEl.parentElement
  if (!wrapper) return
  wrapper.style.transform = `translate(${x}px, ${y}px)`
}

function onCardMouseDown(e: MouseEvent, cardEl: HTMLElement) {
  const cardId = cardEl.dataset.cardId
  if (!cardId) return

  // Record start positions BEFORE changing selection (selection changes can
  // trigger Vue re-renders that reset wrapper transforms).
  dragMouseStartX = e.clientX
  dragMouseStartY = e.clientY
  dragDidMove = false
  dragStartPositions = new Map()

  // Handle selection and focus
  if (e.shiftKey) {
    // Shift+click: toggle card in selection (no focus change)
    const next = new Set(selectedIds.value)
    if (next.has(cardId)) next.delete(cardId)
    else next.add(cardId)
    setSelection(Array.from(next))
  } else if (!selectedIds.value.has(cardId)) {
    // Click on unselected card: select and focus it
    setSelection([cardId])
    setFocus(cardId)
  } else {
    // Click on already-selected card: just set focus
    setFocus(cardId)
  }

  // Record start positions of all selected cards after selection is applied.
  // Use nextTick so Vue has finished re-rendering any reactive bindings
  // (e.g. :collapsed) before we read positions from the DOM.
  nextTick(() => {
    if (!containerRef.value) return
    for (const id of selectedIds.value) {
      const el = containerRef.value.querySelector(
        `[data-card-id="${id}"]`,
      ) as HTMLElement | null
      if (el) {
        dragStartPositions.set(id, getCardPosition(el))
      }
    }
  })

  document.addEventListener('mousemove', onCardDragMove)
  document.addEventListener('mouseup', onCardDragEnd)
}

function emitDragPositions() {
  if (!containerRef.value) return
  const moves: IBlueprintCardMove[] = []
  for (const id of dragStartPositions.keys()) {
    const el = containerRef.value.querySelector(
      `[data-card-id="${id}"]`,
    ) as HTMLElement | null
    if (el) {
      const pos = getCardPosition(el)
      moves.push({ id, x: Math.round(pos.x), y: Math.round(pos.y) })
    }
  }
  if (moves.length) emit('move', moves)
}

function onCardDragMove(e: MouseEvent) {
  const dx = (e.clientX - dragMouseStartX) / zoom.value
  const dy = (e.clientY - dragMouseStartY) / zoom.value

  if (
    !isDraggingCards &&
    Math.abs(dx * zoom.value) < DRAG_THRESHOLD &&
    Math.abs(dy * zoom.value) < DRAG_THRESHOLD
  ) {
    return
  }

  isDraggingCards = true
  dragDidMove = true

  if (!containerRef.value) return

  for (const [id, startPos] of dragStartPositions) {
    const el = containerRef.value.querySelector(
      `[data-card-id="${id}"]`,
    ) as HTMLElement | null
    if (el) {
      setCardPosition(el, startPos.x + dx, startPos.y + dy)
    }
  }

  // Emit move on every frame so the consumer's reactive data stays in sync
  // with the visual position. This prevents Vue re-renders from resetting
  // wrapper transforms during drag.
  emitDragPositions()
  wireKey.value++
}

function onCardDragEnd() {
  document.removeEventListener('mousemove', onCardDragMove)
  document.removeEventListener('mouseup', onCardDragEnd)

  if (dragDidMove) {
    emitDragPositions()
  }

  isDraggingCards = false
  dragDidMove = false
  dragStartPositions = new Map()
}

// ── Marquee selection ─────────────────────────────────────────────────

const marquee = ref<{
  x1: number
  y1: number
  x2: number
  y2: number
} | null>(null)

let marqueeShift = false

const marqueeStyle = computed(() => {
  if (!marquee.value) return {}
  const { x1, y1, x2, y2 } = marquee.value
  return {
    left: `${Math.min(x1, x2)}px`,
    top: `${Math.min(y1, y2)}px`,
    width: `${Math.abs(x2 - x1)}px`,
    height: `${Math.abs(y2 - y1)}px`,
  }
})

function startMarquee(e: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  marqueeShift = e.shiftKey

  // If no shift, deselect all first
  if (!marqueeShift) {
    setSelection([])
  }

  marquee.value = { x1: x, y1: y, x2: x, y2: y }
  document.addEventListener('mousemove', onMarqueeMove)
  document.addEventListener('mouseup', onMarqueeEnd)
}

function onMarqueeMove(e: MouseEvent) {
  if (!marquee.value || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  marquee.value.x2 = e.clientX - rect.left
  marquee.value.y2 = e.clientY - rect.top
}

function onMarqueeEnd() {
  document.removeEventListener('mousemove', onMarqueeMove)
  document.removeEventListener('mouseup', onMarqueeEnd)

  if (!marquee.value || !containerRef.value) {
    marquee.value = null
    return
  }

  const containerRect = containerRef.value.getBoundingClientRect()
  const { x1, y1, x2, y2 } = marquee.value
  const mLeft = Math.min(x1, x2)
  const mTop = Math.min(y1, y2)
  const mRight = Math.max(x1, x2)
  const mBottom = Math.max(y1, y2)

  // If the marquee is tiny (a click, not a drag), treat as deselect-all
  if (
    Math.abs(x2 - x1) < DRAG_THRESHOLD &&
    Math.abs(y2 - y1) < DRAG_THRESHOLD
  ) {
    if (!marqueeShift) {
      setSelection([])
      setFocus(null)
    }
    marquee.value = null
    return
  }

  // Find cards whose bounding rects intersect the marquee
  const hitIds: string[] = marqueeShift ? [...selectedIds.value] : []
  containerRef.value.querySelectorAll('[data-card-id]').forEach((el) => {
    const cardRect = el.getBoundingClientRect()
    const cx = cardRect.left - containerRect.left
    const cy = cardRect.top - containerRect.top
    const cRight = cx + cardRect.width
    const cBottom = cy + cardRect.height

    if (cx < mRight && cRight > mLeft && cy < mBottom && cBottom > mTop) {
      const id = (el as HTMLElement).dataset.cardId
      if (id && !hitIds.includes(id)) hitIds.push(id)
    }
  })

  setSelection(hitIds)
  marquee.value = null
}

// ── Wire connections ──────────────────────────────────────────────────

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

// ── Wire paths ────────────────────────────────────────────────────────

function resolveWireColor(fromPortEl: HTMLElement): string {
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
  void wireKey.value
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

// ── View controls ─────────────────────────────────────────────────────

function getCardsBounds(): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} | null {
  if (!containerRef.value) return null
  const cards = containerRef.value.querySelectorAll('[data-card-id]')
  if (cards.length === 0) return null

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  cards.forEach((card) => {
    const el = card as HTMLElement
    const pos = getCardPosition(el)
    const w = el.offsetWidth
    const h = el.offsetHeight
    minX = Math.min(minX, pos.x)
    minY = Math.min(minY, pos.y)
    maxX = Math.max(maxX, pos.x + w)
    maxY = Math.max(maxY, pos.y + h)
  })

  return { minX, minY, maxX, maxY }
}

function centerView() {
  zoom.value = 1
  if (!containerRef.value) return

  const bounds = getCardsBounds()
  if (!bounds) {
    panX.value = 0
    panY.value = 0
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  panX.value = rect.width / 2 - cx
  panY.value = rect.height / 2 - cy
}

function fitToView(padding = 40) {
  if (!containerRef.value) return

  const bounds = getCardsBounds()
  if (!bounds) {
    resetView()
    return
  }

  const rect = containerRef.value.getBoundingClientRect()
  const contentW = bounds.maxX - bounds.minX
  const contentH = bounds.maxY - bounds.minY

  if (contentW <= 0 || contentH <= 0) {
    centerView()
    return
  }

  const availW = rect.width - padding * 2
  const availH = rect.height - padding * 2
  const scaleX = availW / contentW
  const scaleY = availH / contentH
  const newZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)),
  )

  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  zoom.value = newZoom
  panX.value = rect.width / 2 - cx * newZoom
  panY.value = rect.height / 2 - cy * newZoom
}

function resetView() {
  panX.value = 0
  panY.value = 0
  zoom.value = 1
}

// ── Alignment and distribution ────────────────────────────────────────

type TSelectedCardInfo = {
  id: string
  el: HTMLElement
  x: number
  y: number
  w: number
  h: number
}

function getSelectedCardInfos(): TSelectedCardInfo[] {
  if (!containerRef.value) return []
  const infos: TSelectedCardInfo[] = []
  for (const id of selectedIds.value) {
    const el = containerRef.value.querySelector(
      `[data-card-id="${id}"]`,
    ) as HTMLElement | null
    if (!el) continue
    const pos = getCardPosition(el)
    infos.push({
      id,
      el,
      x: pos.x,
      y: pos.y,
      w: el.offsetWidth,
      h: el.offsetHeight,
    })
  }
  return infos
}

function applyPositions(infos: TSelectedCardInfo[]) {
  const moves: IBlueprintCardMove[] = []
  for (const info of infos) {
    setCardPosition(info.el, info.x, info.y)
    moves.push({ id: info.id, x: Math.round(info.x), y: Math.round(info.y) })
  }
  if (moves.length) {
    wireKey.value++
    emit('move', moves)
  }
}

function alignLeft() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const target = Math.min(...infos.map((c) => c.x))
  infos.forEach((c) => (c.x = target))
  applyPositions(infos)
}

function alignCenter() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const centers = infos.map((c) => c.x + c.w / 2)
  const target = centers.reduce((a, b) => a + b, 0) / centers.length
  infos.forEach((c) => (c.x = target - c.w / 2))
  applyPositions(infos)
}

function alignRight() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const target = Math.max(...infos.map((c) => c.x + c.w))
  infos.forEach((c) => (c.x = target - c.w))
  applyPositions(infos)
}

function alignTop() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const target = Math.min(...infos.map((c) => c.y))
  infos.forEach((c) => (c.y = target))
  applyPositions(infos)
}

function alignMiddle() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const centers = infos.map((c) => c.y + c.h / 2)
  const target = centers.reduce((a, b) => a + b, 0) / centers.length
  infos.forEach((c) => (c.y = target - c.h / 2))
  applyPositions(infos)
}

function alignBottom() {
  const infos = getSelectedCardInfos()
  if (infos.length < 2) return
  const target = Math.max(...infos.map((c) => c.y + c.h))
  infos.forEach((c) => (c.y = target - c.h))
  applyPositions(infos)
}

function distributeHorizontally() {
  const infos = getSelectedCardInfos()
  if (infos.length < 3) return
  infos.sort((a, b) => a.x - b.x)
  const first = infos[0]
  const last = infos[infos.length - 1]
  const totalWidth = infos.reduce((sum, c) => sum + c.w, 0)
  const totalSpace = last.x + last.w - first.x - totalWidth
  const gap = totalSpace / (infos.length - 1)
  let cursor = first.x + first.w + gap
  for (let i = 1; i < infos.length - 1; i++) {
    infos[i].x = cursor
    cursor += infos[i].w + gap
  }
  applyPositions(infos)
}

function distributeVertically() {
  const infos = getSelectedCardInfos()
  if (infos.length < 3) return
  infos.sort((a, b) => a.y - b.y)
  const first = infos[0]
  const last = infos[infos.length - 1]
  const totalHeight = infos.reduce((sum, c) => sum + c.h, 0)
  const totalSpace = last.y + last.h - first.y - totalHeight
  const gap = totalSpace / (infos.length - 1)
  let cursor = first.y + first.h + gap
  for (let i = 1; i < infos.length - 1; i++) {
    infos[i].y = cursor
    cursor += infos[i].h + gap
  }
  applyPositions(infos)
}

// ── Auto-layout ───────────────────────────────────────────────────────

function autoLayout(options?: {
  gapX?: number
  gapY?: number
  padding?: number
}) {
  if (!containerRef.value) return

  const gapX = options?.gapX ?? 80
  const gapY = options?.gapY ?? 40
  const padding = options?.padding ?? 60

  // Collect all cards
  const allCards: TSelectedCardInfo[] = []
  containerRef.value.querySelectorAll('[data-card-id]').forEach((el) => {
    const htmlEl = el as HTMLElement
    const id = htmlEl.dataset.cardId
    if (!id) return
    const pos = getCardPosition(htmlEl)
    allCards.push({
      id,
      el: htmlEl,
      x: pos.x,
      y: pos.y,
      w: htmlEl.offsetWidth,
      h: htmlEl.offsetHeight,
    })
  })

  if (!allCards.length) return

  const cardMap = new Map(allCards.map((c) => [c.id, c]))

  // Build adjacency from connections (directed: from -> to)
  const outEdges = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  for (const c of allCards) {
    outEdges.set(c.id, [])
    inDegree.set(c.id, 0)
  }
  for (const conn of props.connections) {
    if (!cardMap.has(conn.fromNode) || !cardMap.has(conn.toNode)) continue
    outEdges.get(conn.fromNode)!.push(conn.toNode)
    inDegree.set(conn.toNode, (inDegree.get(conn.toNode) ?? 0) + 1)
  }

  // Topological layering (Kahn's algorithm)
  const layers: string[][] = []
  const assigned = new Set<string>()
  const queue: string[] = []

  // Start with nodes that have no incoming edges
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  while (queue.length > 0) {
    const layer = [...queue]
    layers.push(layer)
    layer.forEach((id) => assigned.add(id))
    queue.length = 0

    for (const id of layer) {
      for (const next of outEdges.get(id) ?? []) {
        const newDeg = (inDegree.get(next) ?? 1) - 1
        inDegree.set(next, newDeg)
        if (newDeg === 0 && !assigned.has(next)) {
          queue.push(next)
        }
      }
    }
  }

  // Add any remaining cards (cycles or disconnected) to the last layer
  const unassigned = allCards.filter((c) => !assigned.has(c.id))
  if (unassigned.length) {
    layers.push(unassigned.map((c) => c.id))
  }

  // Compute positions: each layer is a column, cards stacked vertically
  let cursorX = padding
  for (const layer of layers) {
    let maxWidth = 0
    let cursorY = padding

    // Sort within layer by category (from card DOM) for grouping
    const sorted = layer.map((id) => cardMap.get(id)!).filter(Boolean)
    sorted.sort((a, b) => {
      const catA =
        a.el.querySelector('.nb-blueprint-card__tag')?.textContent ?? ''
      const catB =
        b.el.querySelector('.nb-blueprint-card__tag')?.textContent ?? ''
      return catA.localeCompare(catB)
    })

    for (const card of sorted) {
      card.x = cursorX
      card.y = cursorY
      cursorY += card.h + gapY
      maxWidth = Math.max(maxWidth, card.w)
    }

    cursorX += maxWidth + gapX
  }

  // Apply positions
  applyPositions(allCards)
}

// ── Lifecycle ─────────────────────────────────────────────────────────

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
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  nextTick(() => nextTick(fitToView))
})

onBeforeUnmount(() => {
  observer.disconnect()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

// ── Expose ────────────────────────────────────────────────────────────

defineExpose({
  // View
  centerView,
  fitToView,
  resetView,
  // Selection and focus
  selectedIds,
  focusedId,
  selectAll,
  deselectAll,
  // Alignment and distribution
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  // Auto-layout
  autoLayout,
  // Ports
  onPortMouseDown,
  onPortMouseUp,
  // State
  panX,
  panY,
  zoom,
})
</script>

<style scoped lang="scss">
.nb-blueprint {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: var(--nb-c-layer-0, var(--nb-c-bg));
  cursor: crosshair;

  &.is-space {
    cursor: grab;
  }

  &.is-panning {
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
      var(--nb-blueprint-ambient-1, rgba(139, 124, 255, 0.04)),
      transparent 60%
    ),
    radial-gradient(
      ellipse 60% 40% at 80% 100%,
      var(--nb-blueprint-ambient-2, rgba(255, 157, 74, 0.03)),
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

.nb-blueprint__marquee {
  position: absolute;
  border: 1.5px dashed
    var(--nb-blueprint-marquee-border, var(--nb-c-primary, #6366f1));
  background: var(--nb-blueprint-marquee-bg, rgba(99, 102, 241, 0.08));
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;
}
</style>
