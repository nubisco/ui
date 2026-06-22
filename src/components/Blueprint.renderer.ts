import type {
  IBlueprintCard,
  IBlueprintConnection,
  TBlueprintBackground,
} from './Blueprint.types'
import type { BlueprintLiveData } from './blueprint-pixi/live-data'

export type { TBlueprintRenderer } from './Blueprint.types'

/**
 * One resolved wire ready to draw: the SVG path string (in canvas-local
 * coordinates), the connection it represents, its stroke colour, and
 * whether its source port is a MIDI port (drives flow/colour rules). This
 * is the shape NbBlueprint's `computedWires` produces and every renderer
 * consumes.
 */
export interface IBlueprintWire {
  path: string
  conn: IBlueprintConnection
  color: string
  isMidi: boolean
}

/**
 * The declarative input contract a Blueprint renderer (the DOM renderer
 * today, a PixiJS renderer in a later phase) accepts as props.
 *
 * NbBlueprint owns all gesture, selection, drag, and event logic and feeds
 * the renderer a pre-computed, already-culled scene: the camera
 * (`panX`/`panY`/`zoom` plus the `isTransforming` GPU-promotion hint), the
 * visible wires, and either the windowed visible cards (when `windowed`)
 * or the legacy host-owned default slot. The renderer's only job is to put
 * that scene on screen and report pointer interactions back up.
 *
 * A renderer is a Vue component so it can hold its own lifecycle (a Pixi
 * app, a canvas context) and react to these props. It must:
 *   - render the camera-transformed scene from `wires` + cards,
 *   - emit the wire pointer events below,
 *   - render the `card` scoped slot per visible card when `windowed`, else
 *     the `default` slot verbatim,
 *   - (PixiJS phase) expose an `IBlueprintRendererHandle` via the
 *     component ref so NbBlueprint can hit-test without a DOM to query.
 */
export interface IBlueprintRendererProps {
  /** Horizontal pan offset (screen px). */
  panX: number
  /** Vertical pan offset (screen px). */
  panY: number
  /** Zoom factor (1 = 100%). */
  zoom: number
  /** True while a pan/zoom gesture is in flight; renderers may use it to
   *  promote a GPU layer (DOM) or skip expensive work (Pixi). */
  isTransforming: boolean
  /** Visible, already-culled wires to draw. */
  wires: IBlueprintWire[]
  /** True when NbBlueprint owns the card v-for (the `cards` prop API);
   *  false for the legacy host-owned default-slot layout. */
  windowed: boolean
  /** The cards to mount this frame (windowed mode only). */
  visibleCards: IBlueprintCard[]
  /** The id-suffixed path of a wire currently being dragged from a port,
   *  or null. Drawn as a transient preview wire. */
  dragWire: string | null
  /** Whether a given connection should show its animated flow overlay.
   *  Centralises the `animateConnections` policy in NbBlueprint so renderers
   *  stay policy-free. */
  shouldFlow: (conn: IBlueprintConnection) => boolean
  /** Background pattern to draw behind the scene. */
  background: TBlueprintBackground
  /** Non-reactive live-value channel (wire levels, ...) the host writes at
   *  audio rate; the PixiJS renderer reads it on its throttled render tick. The
   *  DOM renderer ignores it. */
  liveData?: BlueprintLiveData
}

/**
 * Imperative handle a renderer exposes (via `defineExpose`) so NbBlueprint
 * can hit-test pointer positions against the scene.
 *
 * The DOM renderer does not need to implement this: its scene is real DOM
 * inside NbBlueprint's container, so NbBlueprint hit-tests with
 * `querySelector` / `isPointInStroke` directly. The PixiJS renderer, whose
 * scene is a canvas with no queryable DOM, must implement it. Both take
 * viewport (client) coordinates.
 */
export interface IBlueprintRendererHandle {
  /** Return the connection whose wire is under the given client point, or
   *  null. */
  hitTestWire: (clientX: number, clientY: number) => IBlueprintConnection | null
  /** Return the id of the card under the given client point, or null. */
  hitTestCard: (clientX: number, clientY: number) => string | null
}
