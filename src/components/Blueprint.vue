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

    <!-- Scene renderer. The DOM/SVG renderer draws the camera-transformed
         grid, wires, and cards today; a PixiJS (WebGL) renderer slots in as
         a sibling branch (chosen by `resolvedRenderer`) in a later phase.
         NbBlueprint keeps all gesture / selection / drag / event logic and
         feeds the renderer a pre-computed, already-culled scene, then
         forwards the `#card` (windowed) and default (legacy) slots. -->
    <BlueprintDomRenderer
      v-if="resolvedRenderer === 'dom'"
      :pan-x="panX"
      :pan-y="panY"
      :zoom="zoom"
      :is-transforming="isTransforming"
      :wires="computedWires"
      :windowed="!!props.cards"
      :visible-cards="visibleCards"
      :drag-wire="dragWire"
      :should-flow="shouldFlow"
      :background="background"
      @wire-mousedown="onWireMouseDown"
      @wire-contextmenu="onWireContextMenu"
      @wire-mousemove="onWireMouseMove"
      @wire-mouseleave="onWireMouseLeave"
    >
      <template #card="{ card }">
        <slot name="card" :card="card" />
      </template>
      <template #default>
        <slot />
      </template>
    </BlueprintDomRenderer>
    <BlueprintPixiRenderer
      v-else
      :pan-x="panX"
      :pan-y="panY"
      :zoom="zoom"
      :is-transforming="isTransforming"
      :wires="computedWires"
      :windowed="!!props.cards"
      :visible-cards="visibleCards"
      :drag-wire="dragWire"
      :should-flow="shouldFlow"
      :background="background"
      :live-data="liveData"
      @wire-mousedown="onWireMouseDown"
      @wire-contextmenu="onWireContextMenu"
      @wire-mousemove="onWireMouseMove"
      @wire-mouseleave="onWireMouseLeave"
      @unavailable="onPixiUnavailable"
    >
      <template #card="{ card }">
        <slot name="card" :card="card" />
      </template>
      <template #default>
        <slot />
      </template>
    </BlueprintPixiRenderer>

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

    <!-- Viewport-space chrome layer: optional NubiscoUI blueprint chrome
         (controls toolbar, minimap) and any host overlay. Rendered in both
         the windowed and legacy APIs (unlike the camera-transformed card
         slots), and positioned in screen space. Children opt back into
         pointer events; the layer itself is transparent to canvas gestures. -->
    <div class="nb-blueprint__chrome">
      <slot name="chrome" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  provide,
} from 'vue'
import {
  NB_BLUEPRINT_CONTEXT,
  NB_BLUEPRINT_CONTROLLER,
} from './Blueprint.context'
import {
  createPortCache,
  isCardPositionMutation,
  BLUEPRINT_CANVAS_CLASS,
} from './blueprint-port-cache'
import BlueprintDomRenderer from './BlueprintDomRenderer.vue'
import BlueprintPixiRenderer from './BlueprintPixiRenderer.vue'
import { BlueprintLiveData } from './blueprint-pixi/live-data'
import type {
  IBlueprintConnection,
  IBlueprintCard,
  IBlueprintCardMove,
  IBlueprintCardPortEvent,
  IBlueprintProps,
} from './Blueprint.types'

const props = withDefaults(defineProps<IBlueprintProps>(), {
  connections: () => [],
  animateConnections: 'never',
  wheelMode: 'auto',
  editable: false,
  renderer: 'auto',
  background: 'dots',
})

// Which renderer actually draws the scene. The DOM renderer is always
// available and is the synchronous default; the PixiJS (WebGL) renderer is
// detected asynchronously on mount (WebGL support + the optional `pixi.js`
// peer dependency loading), so the first frame is DOM and it swaps to Pixi
// once `pixiAvailable` flips. `pixiFailed` forces DOM permanently if Pixi
// reports it could not initialise. The public API is identical across both.
const pixiAvailable = ref(false)
const pixiFailed = ref(false)
const resolvedRenderer = computed<'dom' | 'pixi'>(() =>
  props.renderer !== 'dom' && pixiAvailable.value && !pixiFailed.value
    ? 'pixi'
    : 'dom',
)

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(
      c.getContext('webgl2') ||
      c.getContext('webgl') ||
      c.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

function warnPixiUnavailable(detail: string) {
  if (props.renderer === 'pixi') {
    console.warn(
      `[NubiscoUI] Blueprint renderer="pixi" unavailable (${detail}); using the DOM renderer.`,
    )
  }
}

onMounted(async () => {
  if (props.renderer === 'dom' || typeof window === 'undefined') return
  if (!hasWebGL()) {
    warnPixiUnavailable('no WebGL')
    return
  }
  try {
    // Preload the peer dependency so the swap to the Pixi renderer doesn't
    // flash a frame without a scene. A missing optional peer dep lands here.
    await import('pixi.js')
    pixiAvailable.value = true
  } catch {
    warnPixiUnavailable('pixi.js not installed')
  }
})

// The Pixi renderer reports here if WebGL/context init fails after mount.
function onPixiUnavailable(reason: unknown) {
  pixiFailed.value = true
  warnPixiUnavailable(reason instanceof Error ? reason.message : 'init failed')
}

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

// Non-reactive live-value channel. The host writes high-frequency values (wire
// levels, ...) into this at audio rate with zero Vue reactivity; the PixiJS
// renderer reads it on its throttled, render-on-demand tick. Created once and
// stable for the component's life, so the host can grab it from the controller
// and keep a reference.
const liveData = new BlueprintLiveData()

// Pan/zoom live inside a single root compositing layer, so without a hint
// every pan or zoom frame re-rasterizes the whole canvas (all cards + the
// wire SVG) instead of just re-compositing it — the dominant cost on a busy
// graph. We promote the panned/zoomed canvas to its own GPU layer ONLY while
// a gesture is in flight (via `will-change: transform`), then drop the layer
// shortly after the gesture settles so it costs no memory at rest. `isTransforming`
// drives that hint; `markTransforming()` is called from every pan/zoom path.
const isTransforming = ref(false)
let transformIdleTimer: ReturnType<typeof setTimeout> | undefined
function markTransforming() {
  isTransforming.value = true
  if (transformIdleTimer) clearTimeout(transformIdleTimer)
  // Keep the layer alive a beat past the last pan/zoom frame so a continuous
  // gesture (or wheel-momentum) never demotes mid-flight; 220ms is below the
  // threshold where idle memory matters but above typical inter-frame gaps.
  transformIdleTimer = setTimeout(() => {
    isTransforming.value = false
  }, 220)
}

// ── Settled camera (the core of the perf model) ───────────────────────
//
// The live camera (panX/panY/zoom) drives ONLY the GPU transform of the
// canvas, so panning/zooming is a pure composite at 60fps with zero per-wire
// or per-card JS. The expensive passes (card windowing + wire culling) instead
// read this *settled* camera, which tracks the live one but updates at most
// ~10x/sec during a gesture and snaps exactly when the gesture ends. So the
// work that actually costs (mounting card subtrees, rebuilding the visible wire
// set) runs at a bounded rate, never per frame, which is what keeps a heavy
// graph from freezing while you drag. A generous overscan (see windowing)
// covers the gap so cards/wires are already mounted before they scroll in.
const settledPanX = ref(0)
const settledPanY = ref(0)
const settledZoom = ref(1)
const SETTLE_THROTTLE_MS = 100
let lastSettleTs = 0

function snapSettledCamera() {
  settledPanX.value = panX.value
  settledPanY.value = panY.value
  settledZoom.value = zoom.value
  lastSettleTs = performance.now()
}

watch([panX, panY, zoom], () => {
  // Programmatic / settled move (no gesture in flight): apply at once so view
  // fit, zoom buttons, etc. take effect immediately.
  if (!isTransforming.value) {
    snapSettledCamera()
    return
  }
  // During a gesture: leading-edge throttle, so a long continuous pan still
  // mounts cards / re-culls wires ~10x/sec (never per frame). The exact final
  // position is captured by the isTransforming watch when the gesture settles.
  if (performance.now() - lastSettleTs >= SETTLE_THROTTLE_MS)
    snapSettledCamera()
})
watch(isTransforming, (t: boolean) => {
  if (!t) snapSettledCamera()
})
// Container size in screen px, kept reactive so the card-windowing cull
// (visibleCards) re-runs on resize, not only on pan/zoom. Seeded on mount
// and maintained by a ResizeObserver.
const viewportSize = ref({ w: 0, h: 0 })

// Self-healing port-element cache: turns per-wire `querySelector` in
// computedWires / drag handlers / endpoint resolution from O(N) into
// O(1) after the first miss. Profiling a 30-wire back-canvas session
// showed querySelector as the leaf in 58.7 % of CPU samples; this is
// the fix for that hot path. The cache is pruned on the existing
// MutationObserver tick so detached entries don't pile up.
const portCache = createPortCache(() => containerRef.value)

// Port-position cache: stores each port's center in pre-transform
// container-local coords plus the cardId it belongs to. computedWires
// (the wire-rendering hot path) previously did 2 × N
// getBoundingClientRect calls per recompute — gBCR was the #2 leaf in
// the profile (8.6 %) after querySelector. With this cache, dragging
// one card only invalidates that card's port positions; every other
// wire's endpoint is served from cache. The MutationObserver below
// drives per-card invalidation: each mutation's target carries us to
// the affected data-card-id, and we drop only that card's entries.
const portPositions = new Map<
  string,
  { cardId: string; x: number; y: number }
>()
function invalidatePortPositionsForCard(cardId: string) {
  for (const [k, v] of portPositions) {
    if (v.cardId === cardId) portPositions.delete(k)
  }
}
function clearAllPortPositions() {
  portPositions.clear()
}
/** Resolve a port's centre in pre-transform local coords. Caches
 *  result; reads are free; only the first hit pays gBCR. Returns
 *  null if the port element can't be resolved. */
function getPortCenter(
  nodeId: string,
  portId: string,
  containerRect: DOMRect,
): { x: number; y: number } | null {
  const key = `${nodeId}:${portId}`
  const hit = portPositions.get(key)
  if (hit) return { x: hit.x, y: hit.y }
  const el = portCache.get(nodeId, portId)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const x =
    (r.left + r.width / 2 - containerRect.left - panX.value) / zoom.value
  const y = (r.top + r.height / 2 - containerRect.top - panY.value) / zoom.value
  const card = el.closest('[data-card-id]') as HTMLElement | null
  const cardId = card?.getAttribute('data-card-id') ?? ''
  portPositions.set(key, { cardId, x, y })
  return { x, y }
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3.0
const DRAG_THRESHOLD = 4

// Wire culling: how far (in screen px) outside the visible frame a wire's
// bounding box may sit and still be rendered. The band absorbs the gap
// between a fast pan moving the canvas and the next computedWires re-run,
// so wires never flash in at the edge. Converted to local units (÷ zoom)
// at use so the band is a constant ~this many on-screen pixels at any zoom.
const WIRE_CULL_MARGIN_PX = 240

// Card windowing: overscan band (screen px) around the viewport within
// which cards are kept mounted. Wider than the wire band because mounting
// a card is heavier than a path and a card popping in is more jarring than
// a wire; the slack means a fast pan reveals already-mounted cards rather
// than a frame of blanks.
const CARD_OVERSCAN_PX = 400

// Fallback card box used by the windowing cull when a card omits
// width/height and no `cardSizeEstimate` is supplied. Deliberately on the
// generous side: over-estimating size only renders a few extra edge cards,
// whereas under-estimating could cull a card that's actually peeking in.
const DEFAULT_CARD_SIZE = { width: 260, height: 200 }

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
  // Windowed mode: the DOM only holds on-screen cards, so select from the
  // authoritative `cards` prop instead, otherwise Ctrl+A would silently
  // skip everything scrolled off.
  if (props.cards) {
    setSelection(props.cards.map((c) => c.id))
    return
  }
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
  markTransforming()
  panX.value = e.clientX - panStartX
  panY.value = e.clientY - panStartY
  // No wireKey++: the wires SVG lives inside the panned-and-zoomed canvas
  // div, so the parent CSS transform repositions every wire visually with
  // zero per-wire JS. computedWires does still re-run on pan (it reads
  // panX/panY/zoom for the viewport cull), but that pass only rebuilds the
  // on-screen wires from cached endpoints, it does not move them, the CSS
  // transform does. Bumping wireKey on top would add nothing.
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

// Zoom by a step anchored at the viewport center. Used by the controls
// toolbar (and exposed on the controller) so a zoom button keeps the middle
// of the canvas put, the way a user expects, rather than zooming toward the
// origin.
const ZOOM_STEP = 1.2
function zoomAtCenter(factor: number) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor)
}
function zoomIn() {
  zoomAtCenter(ZOOM_STEP)
}
function zoomOut() {
  zoomAtCenter(1 / ZOOM_STEP)
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
  // Promote the canvas to its own layer for the duration of the gesture so
  // wheel-pan / pinch-zoom re-composite instead of repaint.
  markTransforming()

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

/** The position wrapper for a card is the element whose left/top places
 *  it on the canvas: the direct child of `.nb-blueprint__canvas` that
 *  contains the card. Walk up to find it rather than assuming
 *  `parentElement`, so it's correct for both the windowed API (Blueprint
 *  renders the wrapper) and the legacy slot API (host renders it),
 *  regardless of any extra nesting the host's `#card` template adds. */
function positionWrapperOf(cardEl: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = cardEl
  while (el?.parentElement) {
    if (el.parentElement.classList.contains(BLUEPRINT_CANVAS_CLASS)) return el
    el = el.parentElement
  }
  return cardEl.parentElement
}

function getCardPosition(cardEl: HTMLElement): { x: number; y: number } {
  const wrapper = positionWrapperOf(cardEl)
  if (!wrapper) return { x: 0, y: 0 }
  // New: cards position via left/top so they don't become per-card
  // GPU layers (which would force re-rasterization of every card on
  // zoom). Fall back to the legacy translate(x,y) for consumers that
  // still position via transform.
  const lx = parseFloat(wrapper.style.left)
  const ly = parseFloat(wrapper.style.top)
  if (!Number.isNaN(lx) && !Number.isNaN(ly)) return { x: lx, y: ly }
  const style = wrapper.style.transform || ''
  const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)/)
  if (match) return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
  return { x: wrapper.offsetLeft, y: wrapper.offsetTop }
}

function setCardPosition(cardEl: HTMLElement, x: number, y: number) {
  const wrapper = positionWrapperOf(cardEl)
  if (!wrapper) return
  // Use left/top instead of transform so cards don't become per-card
  // GPU layers. On an absolute-positioned sibling, the layout cost is
  // incremental (no flow effect on other cards) and the visible
  // result during drag is indistinguishable from transform-based.
  wrapper.style.left = `${x}px`
  wrapper.style.top = `${y}px`
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

// ── Coordinate transforms ─────────────────────────────────────────────
// Shared by sibling chrome (minimap pan, controls "zoom to point") and
// host apps. Viewport space is client px (MouseEvent.clientX/Y); canvas
// space is the units cards and connection endpoints use. The math mirrors
// zoomAt's focal-point conversion: canvas = (client - containerOrigin -
// pan) / zoom.
function screenToCanvas(clientX: number, clientY: number) {
  const rect = containerRef.value?.getBoundingClientRect()
  const ox = rect?.left ?? 0
  const oy = rect?.top ?? 0
  return {
    x: (clientX - ox - panX.value) / zoom.value,
    y: (clientY - oy - panY.value) / zoom.value,
  }
}

function canvasToScreen(x: number, y: number) {
  const rect = containerRef.value?.getBoundingClientRect()
  const ox = rect?.left ?? 0
  const oy = rect?.top ?? 0
  return {
    clientX: x * zoom.value + panX.value + ox,
    clientY: y * zoom.value + panY.value + oy,
  }
}

// Advisory edit-mode flag for optional chrome (controls toolbar). Does not
// gate pan/zoom/selection, which are always interactive.
const isEditMode = computed(() => props.editable)

// Full controller for sibling chrome (background, minimap, controls) and
// host apps, consumed via `useBlueprint()`. Superset of the card context
// above; cards keep using the narrow NB_BLUEPRINT_CONTEXT for port drags.
provide(NB_BLUEPRINT_CONTROLLER, {
  panX,
  panY,
  zoom,
  selectedIds,
  focusedId,
  selectAll,
  deselectAll,
  centerView,
  fitToView,
  resetView,
  zoomIn,
  zoomOut,
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  distributeHorizontally,
  distributeVertically,
  autoLayout,
  screenToCanvas,
  canvasToScreen,
  isEditMode,
  viewportSize,
  isTransforming,
  live: liveData,
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

// resolveWireColor was the third remaining hot path after the cache +
// position fixes: it ran `getComputedStyle().getPropertyValue(...)` per
// wire per recompute, which forced a style flush. Profiles showed
// getPropertyValue at 2 % and trim at 2.5 % of leaf samples. Cache by
// port element — the card's accent color is per-card and effectively
// static, and the cache invalidates naturally when the port element
// detaches (WeakMap entry GC'd).
const wireColorCache = new WeakMap<HTMLElement, string>()
function resolveWireColor(fromPortEl: HTMLElement): string {
  const cached = wireColorCache.get(fromPortEl)
  if (cached) return cached
  const card = fromPortEl.closest('.nb-blueprint-card') as HTMLElement | null
  let color = 'var(--nb-c-primary)'
  if (card) {
    const raw = getComputedStyle(card)
      .getPropertyValue('--nb-card-color')
      .trim()
    if (raw && !raw.startsWith('var(')) color = raw
  }
  wireColorCache.set(fromPortEl, color)
  return color
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

  // Viewport cull. Reading pan/zoom here deliberately opts the wire pass
  // back into pan/zoom reactivity (the inverse of the pure-CSS pan fast
  // path, see onPanMove) so the rendered set updates as the frame moves.
  // The trade is worth it past a few hundred wires: an off-screen wire
  // costs zero DOM nodes instead of three <path>s the browser must still
  // lay out and composite. Endpoint lookups are cached (portPositions), so
  // the per-frame cost on a pan is an O(M) arithmetic bbox test plus path
  // building for only the on-screen wires. The visible region is expressed
  // in pre-transform local coords to match what getPortCenter returns:
  // local = (screen − pan) / zoom.
  // Cull against the *settled* camera, not the live one, so the visible wire
  // set is rebuilt at a bounded rate (never per pan frame). The wires move with
  // the canvas's CSS/WebGL transform meanwhile; only the membership lags, and
  // the cull margin covers the gap until the next settle.
  const z = settledZoom.value
  const margin = WIRE_CULL_MARGIN_PX / z
  const visMinX = (0 - settledPanX.value) / z - margin
  const visMaxX = (rect.width - settledPanX.value) / z + margin
  const visMinY = (0 - settledPanY.value) / z - margin
  const visMaxY = (rect.height - settledPanY.value) / z + margin

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
      // Position resolution hits the portPositions cache (port centre in
      // pre-transform local coords, invalidated per-card on MutationObserver
      // ticks); element resolution via portCache is deferred until after the
      // cull so off-screen wires skip it entirely.
      const from = getPortCenter(conn.fromNode, conn.fromPort, rect)
      const to = getPortCenter(conn.toNode, conn.toPort, rect)
      if (!from || !to) return null
      const fx = from.x
      const fy = from.y
      const tx = to.x
      const ty = to.y

      // The cubic stays within the bbox of its four control points
      // (P0, P1=(fx+cpx,fy), P2=(tx−cpx,ty), P3); test that against the
      // padded viewport. The control points share the endpoints' y, so
      // the y extent is just [min,max](fy,ty).
      const cpx = Math.abs(tx - fx) * 0.4
      const c1x = fx + cpx
      const c2x = tx - cpx
      const wMinX = Math.min(fx, c1x, c2x, tx)
      const wMaxX = Math.max(fx, c1x, c2x, tx)
      const wMinY = fy < ty ? fy : ty
      const wMaxY = fy < ty ? ty : fy
      if (
        wMaxX < visMinX ||
        wMinX > visMaxX ||
        wMaxY < visMinY ||
        wMinY > visMaxY
      ) {
        return null
      }

      // Element resolution hits portCache (data-port → HTMLElement, O(1)
      // after first miss); only on-screen wires reach here.
      const fromEl = findPortEl(conn.fromNode, conn.fromPort)
      if (!fromEl) return null

      const path = `M ${fx} ${fy} C ${c1x} ${fy}, ${c2x} ${ty}, ${tx} ${ty}`
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

// ── Card windowing ────────────────────────────────────────────────────
//
// When the host drives cards through the `cards` prop (+ `#card` slot),
// Blueprint owns the v-for and mounts only the cards that matter for the
// current frame: those whose box intersects the padded viewport, plus the
// endpoint cards of any wire that crosses it (so a wire never vanishes
// mid-canvas just because one end scrolled off, see the note below). Far
// off-screen cards are never instantiated. Reading pan/zoom/viewportSize
// makes this re-run as the frame moves, exactly like the wire cull.

const cardSize = (c: IBlueprintCard): { w: number; h: number } => {
  const est = props.cardSizeEstimate ?? DEFAULT_CARD_SIZE
  return { w: c.width ?? est.width, h: c.height ?? est.height }
}

const visibleCards = computed<IBlueprintCard[]>(() => {
  const list = props.cards
  if (!list || list.length === 0) return []

  // Window against the *settled* camera so card subtrees mount/unmount at a
  // bounded rate instead of every pan frame (mounting a heavy card mid-gesture
  // is what froze the canvas). The overscan keeps soon-to-be-visible cards
  // mounted ahead of the settle.
  const z = settledZoom.value
  const margin = CARD_OVERSCAN_PX / z
  const visMinX = (0 - settledPanX.value) / z - margin
  const visMaxX = (viewportSize.value.w - settledPanX.value) / z + margin
  const visMinY = (0 - settledPanY.value) / z - margin
  const visMaxY = (viewportSize.value.h - settledPanY.value) / z + margin

  const intersects = (
    aMinX: number,
    aMinY: number,
    aMaxX: number,
    aMaxY: number,
  ): boolean =>
    aMaxX >= visMinX && aMinX <= visMaxX && aMaxY >= visMinY && aMinY <= visMaxY

  const byId = new Map<string, IBlueprintCard>()
  const mounted = new Set<string>()
  for (const c of list) {
    byId.set(c.id, c)
    const { w, h } = cardSize(c)
    if (intersects(c.x, c.y, c.x + w, c.y + h)) mounted.add(c.id)
  }

  // Keep wires whole across the viewport edge. A wire's rendered path uses
  // precise port DOM (computedWires), which only exists once both endpoint
  // cards are mounted; so if a wire's *approximate* path (output = right-
  // edge midpoint, input = left-edge midpoint, same bezier as the renderer)
  // crosses the viewport, force both its cards to mount. This is bounded by
  // the number of on-screen wires, not the total card count.
  for (const conn of props.connections) {
    const a = byId.get(conn.fromNode)
    const b = byId.get(conn.toNode)
    if (!a || !b) continue
    if (mounted.has(a.id) && mounted.has(b.id)) continue
    const sa = cardSize(a)
    const sb = cardSize(b)
    const fx = a.x + sa.w
    const fy = a.y + sa.h / 2
    const tx = b.x
    const ty = b.y + sb.h / 2
    const cpx = Math.abs(tx - fx) * 0.4
    const wMinX = Math.min(fx, fx + cpx, tx - cpx, tx)
    const wMaxX = Math.max(fx, fx + cpx, tx - cpx, tx)
    const wMinY = fy < ty ? fy : ty
    const wMaxY = fy < ty ? ty : fy
    if (intersects(wMinX, wMinY, wMaxX, wMaxY)) {
      mounted.add(a.id)
      mounted.add(b.id)
    }
  }

  return list.filter((c) => mounted.has(c.id))
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
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  // Windowed mode: measure the full graph from the `cards` prop, not the
  // DOM (which only holds on-screen cards), since fit/center must frame every
  // card, not just the visible ones.
  if (props.cards) {
    if (props.cards.length === 0) return null
    for (const c of props.cards) {
      const { w, h } = cardSize(c)
      minX = Math.min(minX, c.x)
      minY = Math.min(minY, c.y)
      maxX = Math.max(maxX, c.x + w)
      maxY = Math.max(maxY, c.y + h)
    }
    return { minX, minY, maxX, maxY }
  }

  if (!containerRef.value) return null
  const cards = containerRef.value.querySelectorAll('[data-card-id]')
  if (cards.length === 0) return null

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
  // Null when the card isn't currently mounted (windowed mode, scrolled
  // off): we still emit its move so the host repositions it, we just can't
  // write the DOM for it. Alignment always has a live el (you select what
  // you can see); auto-layout over the whole graph may not.
  el: HTMLElement | null
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
    // Write the DOM only for mounted cards; unmounted ones (windowed mode)
    // are repositioned purely through the emitted move, which the host
    // folds back into `cards`, and the wrapper picks up the new left/top
    // when (if) the card scrolls back into view.
    if (info.el) setCardPosition(info.el, info.x, info.y)
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

  // Collect all cards. Windowed mode: drive the layout from the `cards`
  // prop (the DOM only holds on-screen cards) and use measured size for any
  // card that happens to be mounted, falling back to declared/estimated
  // size otherwise. Legacy mode: read every card straight from the DOM.
  const allCards: TSelectedCardInfo[] = []
  if (props.cards) {
    for (const c of props.cards) {
      const el = containerRef.value.querySelector(
        `[data-card-id="${c.id}"]`,
      ) as HTMLElement | null
      const { w, h } = cardSize(c)
      allCards.push({
        id: c.id,
        el,
        x: c.x,
        y: c.y,
        w: c.width ?? el?.offsetWidth ?? w,
        h: c.height ?? el?.offsetHeight ?? h,
      })
    }
  } else {
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
  }

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
      // Category lives in the card DOM; unmounted cards (windowed mode)
      // contribute '' and simply sort first within their layer.
      const catA =
        a.el?.querySelector('.nb-blueprint-card__tag')?.textContent ?? ''
      const catB =
        b.el?.querySelector('.nb-blueprint-card__tag')?.textContent ?? ''
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

const observer = new MutationObserver((mutations) => {
  // Cards can come and go (added/removed by the host); evict any
  // cached port refs whose elements are no longer attached, so the
  // cache doesn't grow stale and the next findPortEl miss does a
  // fresh querySelector instead of returning a detached node.
  portCache.prune()
  // Drop port positions for only the cards whose style actually
  // changed (typically just the one being dragged). Childlist
  // mutations (card mount/unmount) blow the whole position cache
  // since we can't trace removed subtrees back to their cardId.
  let topologyChanged = false
  let positionChanged = false
  for (const m of mutations) {
    if (m.type === 'childList') {
      topologyChanged = true
      continue
    }
    // CRITICAL: only style mutations on a card POSITION WRAPPER move
    // ports. The wrapper is a direct child of `.nb-blueprint__canvas`
    // (that's where the slotted cards live and where setCardPosition
    // writes left/top). A style mutation deeper inside a card — a
    // fader writing its fill/cap percentage on every drag tick, a
    // meter animating its bar, a knob rotating — does NOT move ports,
    // so it must be ignored. Without this guard, interacting with any
    // in-card control recomputes every wire in the graph each frame,
    // which is exactly the "faders are slow as hell" symptom.
    if (!isCardPositionMutation(m.target)) continue
    positionChanged = true
    const card = (m.target as HTMLElement).querySelector('[data-card-id]')
    const cardId = card?.getAttribute('data-card-id')
    if (cardId) invalidatePortPositionsForCard(cardId)
  }
  if (topologyChanged) clearAllPortPositions()
  // Only repaint wires when something that actually affects them changed.
  if (topologyChanged || positionChanged) wireKey.value++
})

// Track container size for the card-windowing cull. Guarded because
// ResizeObserver isn't present in every test/SSR environment; the seed
// from getBoundingClientRect covers the common case and pan/zoom re-runs
// the cull regardless, so a missing observer only means "no live resize".
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    const r = containerRef.value.getBoundingClientRect()
    viewportSize.value = { w: r.width, h: r.height }
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const cr = entries[0]?.contentRect
        if (cr) viewportSize.value = { w: cr.width, h: cr.height }
      })
      resizeObserver.observe(containerRef.value)
    }
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
  resizeObserver?.disconnect()
  if (transformIdleTimer) clearTimeout(transformIdleTimer)
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
  zoomIn,
  zoomOut,
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
  isTransforming,
  // Live-value channel (wire levels, ...)
  live: liveData,
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
.nb-blueprint__chrome {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;

  // Chrome children (toolbar, minimap) opt back into pointer events.
  :deep(> *) {
    pointer-events: auto;
  }
}

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

// Camera-transformed scene styles (grid, canvas, wires) live with the
// renderer in BlueprintDomRenderer.vue. The styles below are NbBlueprint's
// own viewport-space chrome (ambient, marquee, selection box, wire menu).

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
