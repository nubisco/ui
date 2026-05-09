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

export interface IBlueprintProps {
  /**
   * Wire connections between card ports.
   */
  connections?: IBlueprintConnection[]
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
