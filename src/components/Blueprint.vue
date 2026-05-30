<template>
  <div
    ref="containerRef"
    class="nb-blueprint"
    :class="{
      'is-panning': isPanning,
      'is-space': spaceHeld,
    }"
    @mousedown="onCanvasMouseDown"
    @wheel="onWheel"
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
        <!-- One <g> per wire so the visible stroke and its invisible
             14 px hit-region stay siblings. The hit-region catches
             pointer events (cursor + mousedown + right-click); the
             visible stroke is decorative (pointer-events: none). The
             generous hit width makes endpoint-grab / right-click easy
             without thickening the drawn line. -->
        <g
          v-for="(wire, i) in computedWires"
          :key="i"
          class="nb-blueprint__wire-group"
        >
          <path
            :d="wire.path"
            fill="none"
            stroke="transparent"
            stroke-width="14"
            class="nb-blueprint__wire-hitregion"
            :data-wire-index="i"
            @mousedown="onWireMouseDown($event, wire.conn)"
            @contextmenu.prevent="onWireContextMenu($event, wire.conn)"
            @mousemove="onWireMouseMove($event, wire.conn)"
            @mouseleave="onWireMouseLeave(wire.conn)"
          />
          <path
            :d="wire.path"
            fill="none"
            :stroke="wire.color"
            stroke-width="1.5"
            class="nb-blueprint__wire"
            :class="{
              'nb-blueprint__wire--inactive': wire.conn.active === false,
            }"
            :style="{ filter: `drop-shadow(0 0 6px ${wire.color})` }"
            pointer-events="none"
          />
        </g>
        <!-- Animated flow overlay for each wire. Visibility comes from
             `shouldFlow` so 'never' / 'always' / 'on-activity' /
             'levels' all share one rule (instead of the template having
             to know about every mode). -->
        <path
          v-for="(wire, i) in computedWires"
          v-show="shouldFlow(wire.conn)"
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

    <!-- Marquee drag overlay (rendered in viewport space) -->
    <div
      v-if="marquee"
      class="nb-blueprint__marquee nb-blueprint__marquee--dragging"
      :style="marqueeStyle"
    />

    <!-- Persistent selection box around selected cards (marching ants, no fill) -->
    <svg
      v-if="selectionBox"
      class="nb-blueprint__selection-box"
      :style="selectionBox"
    >
      <rect
        x="0.75"
        y="0.75"
        :width="`calc(100% - 1.5px)`"
        :height="`calc(100% - 1.5px)`"
        rx="4"
        ry="4"
        fill="none"
        :stroke="'var(--nb-blueprint-marquee-border, var(--nb-c-primary, #6366f1))'"
        stroke-width="1.5"
        stroke-dasharray="6 4"
        class="nb-blueprint__selection-ants"
      />
    </svg>

    <!-- Wire context menu (right-click on a wire) -->
    <div
      v-if="wireMenu"
      class="nb-blueprint__wire-menu"
      :style="{ left: `${wireMenu.x}px`, top: `${wireMenu.y}px` }"
      role="menu"
      @click.stop
      @contextmenu.prevent
    >
      <slot
        name="wire-menu"
        :connection="wireMenu.conn"
        :close="closeWireMenu"
        :disconnect="() => disconnectFromMenu(wireMenu!.conn)"
      >
        <button
          type="button"
          class="nb-blueprint__wire-menu-item"
          @click="disconnectFromMenu(wireMenu.conn)"
        >
          Disconnect
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  provide,
} from 'vue'
import { NB_BLUEPRINT_CONTEXT } from './Blueprint.context'
import { createPortCache } from './blueprint-port-cache'
import type {
  IBlueprintConnection,
  IBlueprintCardMove,
  IBlueprintCardPortEvent,
  IBlueprintProps,
} from './Blueprint.d'

const props = withDefaults(defineProps<IBlueprintProps>(), {
  connections: () => [],
  animateConnections: 'never',
  wheelMode: 'auto',
})

const emit = defineEmits<{
  connect: [conn: IBlueprintConnection]
  disconnect: [conn: IBlueprintConnection]
  move: [moves: IBlueprintCardMove[]]
  'selection-change': [ids: string[]]
  focus: [id: string | null]
  /**
   * Fired when a card drag ends with the cursor over a wire's hit
   * region. The host decides what to do (typical: splice the dragged
   * card into the wire, channel-matched). Only emitted for single-
   * card drags — multi-card moves never fire this event.
   */
  'drop-on-wire': [cardId: string, conn: IBlueprintConnection]
  /**
   * Fires DURING a single-card drag whenever the cursor enters / exits
   * / changes a wire. `conn` is the wire under the cursor (or null
   * when the cursor isn't over a wire). Host can use this to show a
   * "drop here to splice" tooltip, highlight the wire, etc. Fires at
   * most once per state transition — not per mousemove — so it's
   * cheap to subscribe to.
   */
  'wire-hover': [cardId: string, conn: IBlueprintConnection | null]
  /**
   * Fires when the cursor moves over a wire's hit-region (independent
   * of any drag in progress). Use to render a tooltip showing
   * wire-level metadata (e.g. dBFS, name, channel). Payload includes
   * the wire and the screen coordinates so the host can position its
   * own tooltip without a second hit-test. Throttled by the native
   * mousemove cadence; subscribers should keep their handler cheap
   * (e.g. just update a ref the template reads).
   */
  'wire-mouseover': [
    conn: IBlueprintConnection,
    clientX: number,
    clientY: number,
  ]
  /** Cursor left the wire (or moved to a different one). Payload
   *  identifies the wire that lost the cursor so the host can decide
   *  whether to dismiss its tooltip (e.g. don't dismiss if the
   *  cursor moved straight to another wire). */
  'wire-mouseout': [conn: IBlueprintConnection]
}>()

const containerRef = ref<HTMLDivElement>()
const panX = ref(0)
const panY = ref(0)
const zoom = ref(1)
const wireKey = ref(0)

// Self-healing port-element cache: turns per-wire `querySelector` in
// computedWires / drag handlers / endpoint resolution from O(N) into
// O(1) after the first miss. Profiling a 30-wire back-canvas session
// showed querySelector as the leaf in 58.7 % of CPU samples; this is
// the fix for that hot path. The cache is pruned on the existing
// MutationObserver tick so detached entries don't pile up.
const portCache = createPortCache(() => containerRef.value)

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

/** True when the focused element is a text-entry surface (input,
 *  textarea, contenteditable). Space is a legitimate character there
 *  and must NOT be intercepted for canvas pan-mode — even though the
 *  keydown bubbles up to window-level. */
function isTextEntryFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  return (el as HTMLElement).isContentEditable === true
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat) {
    // Don't steal Space from inputs — typing " " in a sibling text
    // field (e.g. an inspector panel rendered alongside the canvas)
    // must keep working. Without this guard, every text input on a
    // page that hosts an NbBlueprint silently dropped spaces.
    if (isTextEntryFocused()) return
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

const CARD_DRAG_BLOCK_SELECTOR = [
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'a[href]',
  '[role="button"]',
  '[role="slider"]',
  '[contenteditable="true"]',
  '[data-no-card-drag]',
].join(', ')

function isCardDragBlocked(target: EventTarget | null) {
  const el = target instanceof Element ? target : null
  return !!el?.closest(CARD_DRAG_BLOCK_SELECTOR)
}

// ── Wheel passthrough ────────────────────────────────────────────────
//
// The canvas listens to `wheel` to pan / zoom. That blanket capture
// fights with controls inside cards that have their own wheel
// semantics (a knob users scroll to fine-tune, a scrollable inspector
// panel, an <input type=number> that increments on wheel, a popover
// list that scrolls). For each of those cases, panning the canvas
// underneath is the wrong outcome — the gesture clearly belongs to
// the control under the cursor.
//
// AAA rule: if a card-internal element either opts in explicitly
// (`[data-canvas-wheel-passthrough]`) or matches a known interactive
// role, OR if any ancestor between the target and the canvas root is
// actually scrollable AT this scroll position, the wheel event passes
// through. Pinch-zoom (wheel + ctrlKey) is always reserved for the
// canvas — the platform sends pinch as wheel+ctrl regardless of where
// the cursor sits, and "pinch zooms the inner control instead of the
// canvas" would be deeply surprising.
const CANVAS_WHEEL_PASSTHROUGH_SELECTOR = [
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="listbox"]',
  '[data-canvas-wheel-passthrough]',
  'input[type="range"]',
  'input[type="number"]',
].join(', ')

function isWheelPassthrough(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null
  if (!el) return false
  if (el.closest(CANVAS_WHEEL_PASSTHROUGH_SELECTOR)) return true
  // Walk ancestors looking for a node that scrolls AT THIS POSITION.
  // We check both axes since either a horizontal or vertical scroll
  // container should consume the event.
  let cur: Element | null = el
  while (cur && cur !== containerRef.value) {
    const cs = window.getComputedStyle(cur)
    const oy = cs.overflowY
    const ox = cs.overflowX
    const scrollsY =
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
      cur.scrollHeight > cur.clientHeight
    const scrollsX =
      (ox === 'auto' || ox === 'scroll' || ox === 'overlay') &&
      cur.scrollWidth > cur.clientWidth
    if (scrollsY || scrollsX) return true
    cur = cur.parentElement
  }
  return false
}

function onCanvasMouseDown(e: MouseEvent) {
  const target = e.target instanceof HTMLElement ? e.target : null

  // Port interactions (wire dragging) take priority
  const portEl = target?.closest('.nb-blueprint-card__port')
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
  const cardEl = target?.closest('.nb-blueprint-card') as HTMLElement | null
  if (cardEl) {
    onCardMouseDown(e, cardEl, !isCardDragBlocked(target))
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
  // No wireKey++: the wires SVG lives inside the panned-and-zoomed
  // canvas div, so the parent CSS transform updates wire positions
  // visually with zero JS work. computedWires's math is already
  // pan/zoom-independent (subtracts panX/panY and divides by zoom),
  // so a recompute here would do strictly redundant work and pay the
  // querySelector / getBoundingClientRect bill per wire per frame.
}

function onPanEnd() {
  isPanning = false
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onPanEnd)
}

// ── Zoom (focal-point) ────────────────────────────────────────────────

/** Cursor-anchored zoom: re-applies zoom such that the canvas point
 *  under the cursor stays under the cursor. `factor` > 1 zooms in. */
function zoomAt(clientX: number, clientY: number, factor: number) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  const oldZoom = zoom.value
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor))
  if (newZoom === oldZoom) return
  const mouseX = clientX - rect.left
  const mouseY = clientY - rect.top
  const canvasX = (mouseX - panX.value) / oldZoom
  const canvasY = (mouseY - panY.value) / oldZoom
  panX.value = mouseX - canvasX * newZoom
  panY.value = mouseY - canvasY * newZoom
  zoom.value = newZoom
}

function onWheel(e: WheelEvent) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return

  // Pinch-to-zoom on macOS reports as a wheel event with ctrlKey = true.
  // The wheelMode prop decides what plain wheel events do; pinch always
  // zooms regardless of wheelMode (otherwise pinching would scroll on
  // wheelMode='pan', which is never what users want).
  const isPinch = e.ctrlKey

  // Plain wheel inside a card-internal control (knob, slider, number
  // input, scrollable popover, opt-in element) belongs to the control
  // — do NOT preventDefault and do NOT pan/zoom the canvas. Pinch
  // always stays with the canvas regardless of target.
  if (!isPinch && isWheelPassthrough(e.target)) return

  // The canvas is going to handle this event; suppress the browser's
  // default (page scroll, pinch zoom of the document, history nav on
  // horizontal wheel) only now that we've decided we're consuming.
  e.preventDefault()

  let mode: 'zoom' | 'pan'
  if (isPinch) mode = 'zoom'
  else if (props.wheelMode === 'zoom') mode = 'zoom'
  else if (props.wheelMode === 'pan') mode = 'pan'
  else mode = 'pan' // 'auto' default: plain wheel pans, pinch zooms

  if (mode === 'zoom') {
    // Pinch deltaY is fine-grained; mouse-wheel deltaY is coarser. Same
    // formula either way — the resulting factor is roughly proportional
    // to the rotation, which is what users expect.
    const factor = 1 - e.deltaY * 0.01
    zoomAt(e.clientX, e.clientY, factor)
  } else {
    panX.value -= e.deltaX
    panY.value -= e.deltaY
    // No wireKey++: see onPanMove for the rationale. The parent
    // canvas's CSS transform handles wheel-pan visually.
  }
}

// ── Card drag ─────────────────────────────────────────────────────────

let isDraggingCards = false
// Most recent wire under the cursor during a card drag. Used to
// de-dup wire-hover events: we only emit when the value transitions
// (null → conn, conn → other, conn → null), not on every mousemove.
let lastHoverWireKey: string | null = null
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

function onCardMouseDown(e: MouseEvent, cardEl: HTMLElement, allowDrag = true) {
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

  if (!allowDrag) return

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

  // Single-card drag → also probe wire-under-cursor so the host can
  // preview a splice. Multi-card moves never fire wire-hover (same
  // gate as drop-on-wire below). De-duped by composite key so we emit
  // only on transitions, not on every mousemove tick.
  if (dragStartPositions.size === 1) {
    const [draggedId] = dragStartPositions.keys()
    if (draggedId) {
      const conn = wireUnderPoint(e.clientX, e.clientY)
      const key = conn
        ? `${conn.fromNode}/${conn.fromPort}|${conn.toNode}/${conn.toPort}`
        : null
      if (key !== lastHoverWireKey) {
        lastHoverWireKey = key
        emit('wire-hover', draggedId, conn)
      }
    }
  }
}

/** Find the wire whose hit-region sits under the given client point.
 *  Uses SVG `isPointInStroke` per path so the dragged card overlapping
 *  the cursor doesn't shadow the wire (which `elementsFromPoint` would
 *  hit-test in DOM stack order). Returns the connection or null. */
function wireUnderPoint(
  clientX: number,
  clientY: number,
): IBlueprintConnection | null {
  if (!containerRef.value) return null
  const hitRegions = containerRef.value.querySelectorAll<SVGPathElement>(
    '.nb-blueprint__wire-hitregion',
  )
  for (const path of hitRegions) {
    const svg = path.ownerSVGElement
    if (!svg) continue
    // Translate client → SVG-local coords using the SVG's CTM.
    const ctm = svg.getScreenCTM()
    if (!ctm) continue
    const inv = ctm.inverse()
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const local = pt.matrixTransform(inv)
    if (path.isPointInStroke(local)) {
      const idx = parseInt(path.getAttribute('data-wire-index') ?? '-1', 10)
      const wire = idx >= 0 ? computedWires.value[idx] : undefined
      if (wire) return wire.conn
    }
  }
  return null
}

function onCardDragEnd(e?: MouseEvent) {
  document.removeEventListener('mousemove', onCardDragMove)
  document.removeEventListener('mouseup', onCardDragEnd)

  if (dragDidMove) {
    emitDragPositions()

    // Drop-on-wire: only fire for single-card drags. Multi-card moves
    // are deliberately excluded — the gesture is "pick up THIS card and
    // drop it on a wire to splice", not "move a selection over a wire".
    // Host decides what to do with the event (typical: splice via
    // its existing wire-bundle / planSplice helpers).
    if (e && dragStartPositions.size === 1) {
      const [draggedId] = dragStartPositions.keys()
      if (draggedId) {
        const conn = wireUnderPoint(e.clientX, e.clientY)
        if (conn) emit('drop-on-wire', draggedId, conn)
      }
    }
  }

  isDraggingCards = false
  dragDidMove = false
  dragStartPositions = new Map()
  // Final wire-hover null so the host can clear any preview UI (a
  // tooltip / wire highlight) it surfaced during the drag.
  if (lastHoverWireKey !== null) {
    const [draggedId] = dragStartPositions.keys()
    if (draggedId) emit('wire-hover', draggedId, null)
    lastHoverWireKey = null
  }
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

// Persistent selection box: bounding rect of all selected cards (2+ only)
const selectionBox = computed(() => {
  void wireKey.value // recompute when cards move
  if (selectedIds.value.size < 2 || !containerRef.value) return null
  // Don't show while actively dragging a marquee
  if (marquee.value) return null

  const containerRect = containerRef.value.getBoundingClientRect()
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  const pad = 8

  for (const id of selectedIds.value) {
    const el = containerRef.value.querySelector(
      `[data-card-id="${id}"]`,
    ) as HTMLElement | null
    if (!el) continue
    const cr = el.getBoundingClientRect()
    const x = cr.left - containerRect.left
    const y = cr.top - containerRect.top
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + cr.width)
    maxY = Math.max(maxY, y + cr.height)
  }

  if (minX === Infinity) return null

  return {
    left: `${minX - pad}px`,
    top: `${minY - pad}px`,
    width: `${maxX - minX + pad * 2}px`,
    height: `${maxY - minY + pad * 2}px`,
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
// When non-null, the active drag is a "rewire" of an existing wire's
// endpoint rather than the creation of a fresh wire. dragFrom holds
// the FIXED end (the side that stays put); on a successful drop we
// emit disconnect(original) + connect(new). Reactive so we can hide
// the original wire while it's being moved.
const dragRewireOriginal = ref<IBlueprintConnection | null>(null)
const REWIRE_GRAB_THRESHOLD = 40 // canvas units from endpoint to count as a grab

function onPortMouseDown(data: {
  nodeId: string
  portId: string
  type: string
}) {
  dragFrom = data
  dragRewireOriginal.value = null
  document.addEventListener('mousemove', onWireDrag)
  document.addEventListener('mouseup', onWireDragEnd)
}

/** Mousedown on a wire path — if the click landed near one of the
 *  endpoints, start a rewire drag with the OPPOSITE end as anchor.
 *  Mid-wire clicks do nothing, but we still stopPropagation so a
 *  marquee selection doesn't start from inside a wire (the wire IS an
 *  interactive element; the user shouldn't get marquee-rectangle
 *  feedback while trying to grab it). */
function onWireMouseDown(event: MouseEvent, conn: IBlueprintConnection) {
  if (event.button !== 0) return
  // Always halt the canvas's marquee/pan path. The wire owns this
  // mousedown — even if we don't end up starting a rewire below.
  event.stopPropagation()
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const cx = (event.clientX - rect.left - panX.value) / zoom.value
  const cy = (event.clientY - rect.top - panY.value) / zoom.value

  const fromEl = findPortEl(conn.fromNode, conn.fromPort)
  const toEl = findPortEl(conn.toNode, conn.toPort)
  if (!fromEl || !toEl) return

  const fr = fromEl.getBoundingClientRect()
  const tr = toEl.getBoundingClientRect()
  const fx = (fr.left + fr.width / 2 - rect.left - panX.value) / zoom.value
  const fy = (fr.top + fr.height / 2 - rect.top - panY.value) / zoom.value
  const tx = (tr.left + tr.width / 2 - rect.left - panX.value) / zoom.value
  const ty = (tr.top + tr.height / 2 - rect.top - panY.value) / zoom.value

  const distFrom = Math.hypot(cx - fx, cy - fy)
  const distTo = Math.hypot(cx - tx, cy - ty)
  if (Math.min(distFrom, distTo) > REWIRE_GRAB_THRESHOLD) return

  // Already stopped propagation above; preventDefault here so the
  // browser doesn't try to start a text-selection drag.
  event.preventDefault()

  // Closer end is the one being moved; the other becomes the anchor.
  const grabFrom = distFrom < distTo
  const anchor = grabFrom
    ? { nodeId: conn.toNode, portId: conn.toPort, type: 'input' }
    : { nodeId: conn.fromNode, portId: conn.fromPort, type: 'output' }

  dragFrom = anchor
  dragRewireOriginal.value = conn
  document.addEventListener('mousemove', onWireDrag)
  document.addEventListener('mouseup', onWireDragEnd)
}

// ── Provide port handlers so child NbBlueprintCards can self-wire ─────
//
// Without this, every consumer of NbBlueprint had to manually forward the
// `port-mousedown` / `port-mouseup` events from each card to the blueprint's
// onPortMouseDown / onPortMouseUp methods. With provide/inject, cards
// nested inside an NbBlueprint pick this up automatically and drag-to-
// connect works out of the box.
provide(NB_BLUEPRINT_CONTEXT, {
  onPortDown: (e: IBlueprintCardPortEvent) => onPortMouseDown(e),
  onPortUp: (e: IBlueprintCardPortEvent) => onPortMouseUp(e),
})

// ── Wire context menu (right-click on a wire) ─────────────────────────

const wireMenu = ref<{
  x: number
  y: number
  conn: IBlueprintConnection
} | null>(null)

function onWireContextMenu(event: MouseEvent, conn: IBlueprintConnection) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  wireMenu.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    conn,
  }
}

function onWireMouseMove(event: MouseEvent, conn: IBlueprintConnection) {
  // Fires per native mousemove tick. Cheap — just forward; the host
  // decides whether to render a tooltip and at what cadence. Throttle
  // there if needed; do not throttle here (subscribers like an
  // active-position readout WANT the per-frame updates).
  emit('wire-mouseover', conn, event.clientX, event.clientY)
}

function onWireMouseLeave(conn: IBlueprintConnection) {
  emit('wire-mouseout', conn)
}

function closeWireMenu() {
  wireMenu.value = null
}

function disconnectFromMenu(conn: IBlueprintConnection) {
  emit('disconnect', conn)
  closeWireMenu()
}

function onDocumentMouseDown(e: MouseEvent) {
  if (!wireMenu.value) return
  const menu = (e.target as HTMLElement).closest('.nb-blueprint__wire-menu')
  if (!menu) closeWireMenu()
}

function onDocumentKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && wireMenu.value) closeWireMenu()
}

function findPortEl(nodeId: string, portId: string): HTMLElement | null {
  return portCache.get(nodeId, portId)
}

function onWireDrag(e: MouseEvent) {
  if (!dragFrom || !containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  const mx = (e.clientX - rect.left - panX.value) / zoom.value
  const my = (e.clientY - rect.top - panY.value) / zoom.value

  const fromEl = findPortEl(dragFrom.nodeId, dragFrom.portId)
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
  // Drop on empty canvas: cancel everything. If a port handler emitted
  // a connect/disconnect first it will have already cleared dragFrom,
  // so this is idempotent.
  dragFrom = null
  dragRewireOriginal.value = null
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
  const newConn: IBlueprintConnection = {
    fromNode: from.nodeId,
    fromPort: from.portId,
    toNode: to.nodeId,
    toPort: to.portId,
  }

  const original = dragRewireOriginal.value
  if (original) {
    // Rewiring an existing wire's endpoint. Skip if the user dropped
    // it back where it came from (no change, no churn for consumers).
    const sameAsOriginal =
      original.fromNode === newConn.fromNode &&
      original.fromPort === newConn.fromPort &&
      original.toNode === newConn.toNode &&
      original.toPort === newConn.toPort
    if (!sameAsOriginal) {
      emit('disconnect', original)
      emit('connect', newConn)
    }
  } else {
    emit('connect', newConn)
  }

  dragFrom = null
  dragRewireOriginal.value = null
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

/** True iff the port carries MIDI data. Used by `'levels'` mode to skip
 *  the level → colour gradient on MIDI wires (they should still animate
 *  on activity but stay their card-accent colour). */
function isMidiPort(portEl: HTMLElement): boolean {
  const dt = portEl.getAttribute('data-port-data-type') ?? ''
  return dt === 'midi' || dt.startsWith('midi:')
}

/** Map a level (0..1) to a colour on the green → yellow → red ramp.
 *  Level <= 0.5 interpolates green → yellow; > 0.5 interpolates yellow
 *  → red. Uses simple linear RGB blending; the perceptual gradient that
 *  meter UIs draw is busy enough to make this look right without going
 *  to OKLCh. */
function levelToColor(level: number): string {
  const l = Math.max(0, Math.min(1, level))
  // Anchors: green (#22c55e) → yellow (#facc15) → red (#ef4444).
  const green = [34, 197, 94]
  const yellow = [250, 204, 21]
  const red = [239, 68, 68]
  let r: number[], g: number[], t: number
  if (l <= 0.5) {
    r = green
    g = yellow
    t = l * 2
  } else {
    r = yellow
    g = red
    t = (l - 0.5) * 2
  }
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${mix(r[0]!, g[0]!)}, ${mix(r[1]!, g[1]!)}, ${mix(r[2]!, g[2]!)})`
}

const computedWires = computed(() => {
  void wireKey.value
  if (!containerRef.value) return []

  const rect = containerRef.value.getBoundingClientRect()
  const rewiring = dragRewireOriginal.value
  return props.connections
    .filter(
      (c) =>
        // While the user is dragging an endpoint, suppress the original
        // wire so only the rubber-band is visible. The wire reappears
        // on commit (replaced) or cancel (restored).
        !rewiring ||
        c.fromNode !== rewiring.fromNode ||
        c.fromPort !== rewiring.fromPort ||
        c.toNode !== rewiring.toNode ||
        c.toPort !== rewiring.toPort,
    )
    .map((conn) => {
      const fromEl = findPortEl(conn.fromNode, conn.fromPort)
      const toEl = findPortEl(conn.toNode, conn.toPort)

      if (!fromEl || !toEl) return null

      const fr = fromEl.getBoundingClientRect()
      const tr = toEl.getBoundingClientRect()
      const fx = (fr.left + fr.width / 2 - rect.left - panX.value) / zoom.value
      const fy = (fr.top + fr.height / 2 - rect.top - panY.value) / zoom.value
      const tx = (tr.left + tr.width / 2 - rect.left - panX.value) / zoom.value
      const ty = (tr.top + tr.height / 2 - rect.top - panY.value) / zoom.value

      const cpx = Math.abs(tx - fx) * 0.4
      const path = `M ${fx} ${fy} C ${fx + cpx} ${fy}, ${tx - cpx} ${ty}, ${tx} ${ty}`
      const baseColor = resolveWireColor(fromEl)
      // Levels-mode colour overlay: only audio wires shift; MIDI keeps
      // its accent. Activity gating still applies — an inactive wire
      // ignores `level` (the flow overlay is hidden anyway).
      const isMidi = isMidiPort(fromEl)
      let color = baseColor
      if (
        props.animateConnections === 'levels' &&
        conn.active !== false &&
        !isMidi &&
        typeof conn.level === 'number'
      ) {
        color = levelToColor(conn.level)
      }
      return { path, conn, color, isMidi }
    })
    .filter(Boolean) as {
    path: string
    conn: IBlueprintConnection
    color: string
    isMidi: boolean
  }[]
})

/** Should the flow overlay run for this wire under the current
 *  animation policy? Centralised so the template stays compact. */
function shouldFlow(conn: IBlueprintConnection): boolean {
  if (props.animateConnections === 'never') return false
  if (props.animateConnections === 'always') return true
  // 'on-activity' and 'levels' both gate on the active flag.
  return conn.active !== false
}

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
  // Cards can come and go (added/removed by the host); evict any
  // cached port refs whose elements are no longer attached, so the
  // cache doesn't grow stale and the next findPortEl miss does a
  // fresh querySelector instead of returning a detached node.
  portCache.prune()
  wireKey.value++
})

onMounted(() => {
  if (containerRef.value) {
    observer.observe(containerRef.value, {
      childList: true,
      subtree: true,
      // Only watch `style` changes. The observer exists to recompute wire
      // paths when card wrappers move (their transform lives in the style
      // attribute). Watching all attributes meant our own SVG-attribute
      // updates (d, class, data-active) fed back into wireKey++ and pegged
      // the JS thread when many wires + pins were active.
      attributes: true,
      attributeFilter: ['style'],
    })
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  document.addEventListener('mousedown', onDocumentMouseDown)
  document.addEventListener('keydown', onDocumentKeyDown)
  nextTick(() => nextTick(fitToView))
})

onBeforeUnmount(() => {
  observer.disconnect()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
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
  // Visible stroke is now decorative only; the sibling hit-region
  // path catches all pointer events. Hover styling moves to the
  // hit-region so the visual still reacts when the user mouses near
  // the wire.
  pointer-events: none;
  opacity: 0.55;
  transition: opacity 0.15s;

  // Inactive wires stay visible but dim, no flow.
  &--inactive {
    opacity: 0.25;
  }
}

.nb-blueprint__wire-hitregion {
  // Generous 14 px transparent stroke makes the wire easy to grab
  // with a mouse / trackpad. Keeps the visible wire skinny while
  // the interaction surface is comfortable.
  pointer-events: stroke;
  cursor: pointer;

  // Hover sibling-target: when the hit-region is hovered, the
  // corresponding visible wire (next sibling in source order) bumps
  // its width / opacity for tactile feedback.
  &:hover + .nb-blueprint__wire {
    opacity: 0.85;
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
  border-radius: 4px;
  pointer-events: none;
  z-index: 10;

  // While actively dragging: show a light fill
  &--dragging {
    background: var(--nb-blueprint-marquee-bg, rgba(99, 102, 241, 0.08));
  }
}

.nb-blueprint__selection-box {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  overflow: visible;
}

.nb-blueprint__selection-ants {
  animation: nb-marching-ants 0.6s linear infinite;
}

@keyframes nb-marching-ants {
  to {
    stroke-dashoffset: -10;
  }
}

// ── Wire context menu ──────────────────────────────────────────────────

.nb-blueprint__wire-menu {
  position: absolute;
  z-index: 20;
  min-width: 140px;
  padding: 4px;
  background: var(--nb-c-layer-2, #1a1c22);
  border: 1px solid var(--nb-c-border, #2a2d35);
  border-radius: 6px;
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nb-blueprint__wire-menu-item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--nb-c-text);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--nb-c-layer-3, #232838);
  }
}
</style>
