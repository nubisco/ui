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
   * Card box size in canvas units. Optional: when omitted the windowing
   * test falls back to `cardSizeEstimate`. Providing real sizes makes the
   * off-screen cull tighter (a tall card won't be dropped a frame early)
   * but is not required (the overscan band absorbs estimate error).
   */
  width?: number
  height?: number
}

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
