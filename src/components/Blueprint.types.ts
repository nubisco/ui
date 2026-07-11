import type { Ref } from 'vue'
import type {
  IBlueprintPort,
  TBlueprintCardStatus,
} from './BlueprintCard.types'
import type { BlueprintLiveData } from './blueprint-pixi/live-data'
import type { TWireActivityStyle } from './blueprint-pixi/pixi-scene'
export type { TWireActivityStyle } from './blueprint-pixi/pixi-scene'

export interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
  /**
   * Whether signal can currently flow through this wire. When false, the
   * wire still renders (the path stays visible) but the animated flow
   * overlay is suppressed and the path is dimmed. Undefined = treated as
   * active for back-compat with non-audio consumers.
   */
  active?: boolean
  /**
   * Linear amplitude (0..1) of audio flowing through this wire, used by
   * the `'levels'` value of `animateConnections`. The stroke colour
   * shifts green → yellow → red as `level` rises (anchored at 0.0 / 0.5
   * / 1.0 respectively). Ignored when `animateConnections` is anything
   * other than `'levels'`. MIDI wires (or wires whose `level` is
   * undefined) keep their card-accent colour.
   */
  level?: number
}

export interface IBlueprintCardMove {
  id: string
  y: number
  x: number
}

/**
 * Geometry for one card in the windowed (data-driven) rendering API.
 *
 * Pass an array of these as the `cards` prop and render each via the
 * `#card` scoped slot; Blueprint then owns the `v-for` and the absolute
 * position wrappers, and only mounts the cards whose box intersects the
 * (padded) viewport. Off-screen cards are never instantiated, so a graph
 * with thousands of nodes pays render cost only for what's on screen.
 *
 * Hosts typically pass their own richer card objects (extra fields are
 * preserved and handed straight back through the `#card` slot); only
 * `id`, `x`, and `y` are required.
 */
export interface IBlueprintCard {
  /** Stable identity. Must match the `id` of the NbBlueprintCard rendered
   *  in the slot and the node ids used in `connections`. */
  id: string
  /** Canvas-space left, in the same units as connection endpoints and the
   *  `move` event payload. */
  x: number
  /** Canvas-space top. */
  y: number
  /**
   * Visual data for the PixiJS renderer's native card painter. The DOM
   * renderer ignores this (it renders the real `#card` slot). The PixiJS
   * renderer draws cards natively while panning/zooming and at far zoom,
   * where it cannot run the Vue `#card` component; it reads this descriptor
   * (or, as a fallback, well-known top-level fields `title`/`color`/`ports`
   * on the card object) to paint a faithful card. Omit it and far/gesture
   * cards render as a plain accent-colored box with the id. See
   * [IBlueprintCardPaint].
   */
  paint?: IBlueprintCardPaint
  /**
   * Card box size in canvas units. Optional: when omitted the windowing
   * test falls back to `cardSizeEstimate`. Providing real sizes makes the
   * off-screen cull tighter (a tall card won't be dropped a frame early)
   * but is not required (the overscan band absorbs estimate error).
   */
  width?: number
  height?: number
  /**
   * GPU-rendered live meters for this card. The PixiJS renderer draws these
   * on the GPU (one batched layer for the whole graph) from the non-reactive
   * live channel, so a card full of audio meters animates without any Vue
   * re-render or per-element DOM/CSS write. Geometry is in card-local px (the
   * meter's box relative to the card's top-left). The DOM renderer ignores it.
   */
  meters?: IBlueprintMeter[]
}

/**
 * One GPU-drawn live meter on a card. Its `value` is read each render tick from
 * the blueprint's live channel under `id` (0..1) and drawn as a fill that grows
 * from the bottom, coloured green -> yellow -> red by level. No Vue, no per-frame
 * DOM write: the cost is a sprite scale + tint on the GPU.
 */
export interface IBlueprintMeter {
  /** Key into the live channel for this meter's current value (0..1). */
  id: string
  /** Meter box in card-local px (relative to the card's top-left). */
  x: number
  y: number
  w: number
  h: number
  /** `bar` = solid fill; `ladder` = solid fill behind static segment gaps. */
  kind?: 'bar' | 'ladder'
  /** Segment count for `ladder` (ignored for `bar`). Default 16. */
  segments?: number
}

/**
 * Visual descriptor the PixiJS renderer's native card painter draws from
 * (see `IBlueprintCard.paint`). A structured subset of the NbBlueprintCard
 * props: enough to paint a faithful card at far zoom and during gestures
 * without running the Vue component. All fields optional; the painter falls
 * back to an accent box when a field is missing.
 */
export interface IBlueprintCardPaint {
  /** Card title drawn in the header. */
  title?: string
  /** Accent color (CSS color string); drives the top bar and outline. */
  color?: string
  /** Category label under the title. */
  category?: string
  /** Status dot (valid / warning / error / none). */
  status?: TBlueprintCardStatus
  /** Whether the card is collapsed (header only). */
  collapsed?: boolean
  /** Port definitions; the painter places pins on the left/right edges. */
  ports?: IBlueprintPort[]
  /** Ids of ports drawn as connected (filled). */
  connectedPorts?: string[]
  /** Ids of ports drawn as active (glow). */
  activePorts?: string[]
}

/** How NbBlueprint should pick a renderer. `'auto'` resolves to `'pixi'`
 *  when a WebGL-capable client renderer is available, else `'dom'`. */
export type TBlueprintRenderer = 'auto' | 'dom' | 'pixi'

/** Built-in canvas background pattern. Color and spacing are themable via
 *  `--nb-blueprint-grid-color` and `--nb-blueprint-grid-gap`. */
export type TBlueprintBackground = 'dots' | 'lines' | 'none'

export interface IBlueprintProps {
  /**
   * Wire connections between card ports.
   */
  connections?: IBlueprintConnection[]
  /**
   * Card geometry for the windowed rendering API. When provided, Blueprint
   * owns the card `v-for` and position wrappers and renders each card
   * through the `#card` scoped slot, mounting only the cards whose box (or
   * a wire crossing the viewport) is on screen. When omitted, the default
   * slot is rendered verbatim and the host owns card layout (legacy API,
   * no windowing). The two modes are mutually exclusive: if `cards` is set,
   * the default slot is ignored.
   */
  cards?: IBlueprintCard[]
  /**
   * Fallback card box size (canvas units) for the windowing cull, used for
   * any card whose `width`/`height` is not given. Defaults to roughly one
   * standard card. Only affects how tightly off-screen cards are culled;
   * the overscan band means a loose estimate just renders a few extra
   * cards near the edges rather than dropping visible ones.
   */
  cardSizeEstimate?: { width: number; height: number }
  /**
   * Wire animation policy.
   *
   *   - `'never'` (default): static wires; no flow overlay, no colour
   *     shift. Cheapest path; right for non-signal-bearing graphs.
   *   - `'always'`: animate every wire continuously.
   *   - `'on-activity'`: animate iff `connection.active === true`. Wires
   *     with `active === false` render dimmed without flow.
   *   - `'levels'`: same activity gating as `'on-activity'`, plus audio
   *     wires colour-shift green → yellow → red based on
   *     `connection.level` (0..1). MIDI wires (and wires without a
   *     `level` field) keep their card-accent colour.
   */
  animateConnections?: 'never' | 'always' | 'on-activity' | 'levels'
  /**
   * How the 'on-activity' animation represents a live wire: 'flow' (a
   * directional comet), 'pulse' (brightness), or 'vibrate' (a plucked-string
   * oscillation). Defaults to 'flow'. Only wires actually carrying signal
   * animate (the renderer gates on live level).
   */
  activityStyle?: TWireActivityStyle
  /**
   * Wheel-event policy for the canvas:
   *
   *   - `'auto'` (default): macOS pinch-to-zoom (`ctrlKey === true`)
   *     zooms cursor-anchored; plain two-finger / wheel scroll pans.
   *     Matches current behaviour, no breaking change.
   *   - `'zoom'`: every wheel event becomes a cursor-anchored zoom.
   *     Right for node editors where panning has its own gesture (e.g.
   *     space + drag) and the wheel is the natural zoom verb.
   *   - `'pan'`: every wheel event pans, never zooms.
   */
  wheelMode?: 'auto' | 'zoom' | 'pan'
  /**
   * Whether the blueprint is in edit mode. Surfaced through the injected
   * controller as `isEditMode` so optional chrome (a controls toolbar,
   * etc.) can show itself only while editing. Purely advisory: it does not
   * change pan/zoom/selection behaviour, which are always interactive.
   * Default false.
   */
  editable?: boolean
  /**
   * Which rendering backend to draw the scene with.
   *
   *   - `'auto'` (default): use the PixiJS (WebGL) renderer when a
   *     WebGL-capable client renderer is available, else fall back to the
   *     DOM/SVG renderer. SSR always uses DOM.
   *   - `'dom'`: force the DOM/SVG renderer (today's behaviour).
   *   - `'pixi'`: force the PixiJS renderer; falls back to DOM with a
   *     dev-time warning when it is not available.
   *
   * The public API (props, events, exposed methods) is identical across
   * renderers; only the draw layer changes.
   */
  renderer?: TBlueprintRenderer
  /**
   * Canvas background pattern. `'dots'` (default) is the standard dot grid,
   * `'lines'` a ruled grid, `'none'` an empty canvas. Color and spacing are
   * themable via `--nb-blueprint-grid-color` and `--nb-blueprint-grid-gap`.
   */
  background?: TBlueprintBackground
  /**
   * Per-wire classifier for `autoLayout()`'s signal-flow banding. The layout
   * groups cards into subsystems along the signal path, so it needs to tell
   * the primary signal wires (drive depth + adjacency) from control / side-chain
   * hints (the source card simply joins the target's lane) and from wires to
   * skip entirely (e.g. MIDI). Return `'signal'`, `'control'`, or `'ignore'`
   * per connection. Defaults to treating every wire as `'signal'`, which
   * reproduces plain signal-flow banding.
   */
  layoutEdgeKind?: (
    conn: IBlueprintConnection,
  ) => 'signal' | 'control' | 'ignore'
}

/** A point in canvas space (the same units as card `x`/`y` and the
 *  `move` event payload). */
export interface IBlueprintCanvasPoint {
  x: number
  y: number
}

/** A point in viewport space (client pixels, e.g. `MouseEvent.clientX/Y`). */
export interface IBlueprintScreenPoint {
  clientX: number
  clientY: number
}

/**
 * The full controller NbBlueprint provides via `inject` (key
 * `NB_BLUEPRINT_CONTROLLER`). It is a superset of
 * `IBlueprintCardContext`: child cards keep injecting the narrow card
 * context for port dragging, while sibling chrome (background, minimap,
 * controls toolbar) and host apps reach the camera, selection, view
 * actions, and coordinate transforms through this richer surface. Mirror
 * of `defineExpose` plus coordinate helpers and an edit-mode flag.
 *
 * Obtain it from inside a NbBlueprint subtree with `useBlueprint()`.
 */
export interface IBlueprintController {
  /** Live, writable horizontal pan offset (screen px). */
  panX: Ref<number>
  /** Live, writable vertical pan offset (screen px). */
  panY: Ref<number>
  /** Live, writable zoom factor (1 = 100%). */
  zoom: Ref<number>
  /** Live set of selected card ids. */
  selectedIds: Ref<Set<string>>
  /** Live focused card id (single-card inspector target), or null. */
  focusedId: Ref<string | null>
  selectAll: () => void
  deselectAll: () => void
  /** Reset zoom to 1 and centre the graph in the viewport. */
  centerView: () => void
  /** Zoom/pan so the whole graph fits, with optional padding (px). */
  fitToView: (padding?: number) => void
  /** Reset pan to 0,0 and zoom to 1. */
  resetView: () => void
  /** Zoom in one step, anchored at the viewport center. */
  zoomIn: () => void
  /** Zoom out one step, anchored at the viewport center. */
  zoomOut: () => void
  alignLeft: () => void
  alignCenter: () => void
  alignRight: () => void
  alignTop: () => void
  alignMiddle: () => void
  alignBottom: () => void
  distributeHorizontally: () => void
  distributeVertically: () => void
  autoLayout: () => void
  /** Convert viewport (client) coordinates to canvas coordinates. */
  screenToCanvas: (clientX: number, clientY: number) => IBlueprintCanvasPoint
  /** Convert canvas coordinates to viewport (client) coordinates. */
  canvasToScreen: (x: number, y: number) => IBlueprintScreenPoint
  /** Live edit-mode flag, derived from the `editable` prop. */
  isEditMode: Ref<boolean>
  /** Live viewport size in screen px (the blueprint container). Used by the
   *  minimap to draw the visible-area rectangle. */
  viewportSize: Ref<{ w: number; h: number }>
  /** True while a pan/zoom gesture is in flight (drops ~220ms after the last
   *  gesture frame). A host can read this to pause expensive per-card content
   *  (live meters) during a gesture, so the cards stay static and cheap to
   *  composite while moving. */
  isTransforming: Ref<boolean>
  /** Forwarded port handlers (same as the narrow card context). */
  onPortDown: (event: IBlueprintCardPortEvent) => void
  onPortUp: (event: IBlueprintCardPortEvent) => void
  /** Non-reactive live-value channel. Write high-frequency values (wire levels
   *  keyed `from|fromPort|to|toPort`, 0..1) here at audio rate with zero Vue
   *  cost; the PixiJS renderer reads them on its throttled GPU tick. */
  live: BlueprintLiveData
}

/**
 * Payload of the port-mousedown / port-mouseup events emitted by
 * NbBlueprintCard, and what NbBlueprint's injected port handlers expect.
 */
export interface IBlueprintCardPortEvent {
  nodeId: string
  portId: string
  type: 'input' | 'output'
}

/**
 * Shape NbBlueprint provides via inject so its child cards can drive wire
 * dragging without the parent app forwarding port events manually. The
 * runtime InjectionKey lives in `Blueprint.context.ts` (this file is an
 * ambient `.d.ts` and can only carry types).
 */
export interface IBlueprintCardContext {
  onPortDown: (event: IBlueprintCardPortEvent) => void
  onPortUp: (event: IBlueprintCardPortEvent) => void
}
