export interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
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
