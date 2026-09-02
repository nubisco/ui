/** Data type for a pin (determines shape and color) */
export type TBlueprintPinDataType =
  | 'geometry'
  | 'celestial'
  | 'lighting'
  | 'effect'
  | 'surface'
  | 'audio'
  | 'audio:mono'
  | 'audio:stereo'
  | 'audio:bus'
  | 'midi'
  | 'midi:rechannelized'
  | 'control'
  | 'entity'
  | 'number'
  | 'vector3'
  | 'color'
  | 'asset'
  | 'any'

/** A single sub-channel within a multi-channel bundle port. */
export interface IBlueprintPortChannel {
  /**
   * Unique within the parent port. When the port is expanded, the rendered
   * pin's data-port attribute and emitted port id is `${port.id}/${channel.id}`.
   */
  id: string
  /** Display label shown in the pin tooltip, e.g. "L", "R", "Ch 3". */
  label: string
}

/**
 * Visual shape for a single pin.
 *
 * Shape is the target a user aims a wire at, so it deliberately does NOT vary
 * with `dataType`: a target that changes form per port is one they have to
 * re-learn each time, and a rotated or shrunken silhouette converges with the
 * default pill as soon as the canvas is zoomed out. What a port carries is
 * expressed by `signal` (solid vs striped) and `color` instead, neither of
 * which touches the pin's outline.
 *
 *   - `'pill'` (default): the canonical connector tab, flat against the card
 *     and rounded on its outer end.
 *   - `'square'`: a sharp box, tangent to the card edge.
 *   - `'circle'`: a small dot. Its smaller target de-emphasises the port.
 *
 * Reach for a variant only when a port needs to be told apart from its
 * immediate neighbours on the same card, never as a way to encode type.
 */
export type TBlueprintPortShape = 'pill' | 'square' | 'circle'

/**
 * Visual size for a single pin. Independent of shape. `'md'` is the
 * default — `'sm'` shrinks the pin (good for secondary / metadata
 * ports), `'lg'` enlarges (good for primary audio ins / outs that
 * need to be visually emphasised).
 */
/**
 * Whether a port carries a continuously varying quantity or discrete events.
 *
 * This is the library's own axis, deliberately independent of `dataType`,
 * which is a domain taxonomy that will keep growing. Analog and digital is
 * the distinction that changes how a port behaves rather than what it is
 * called, and it drives two things:
 *
 *   - **Decoration.** Digital pins are striped, analog pins are solid. Same
 *     silhouette either way: a pin is a target the user aims a wire at, and
 *     changing its shape by type makes that aim less predictable for no gain.
 *     Texture separates them without touching form or the colour channel,
 *     which `dataType` already spends.
 *   - **Activity.** An analog port shows a level, filling in proportion to
 *     what is flowing. A digital port has no meaningful level, so it pulses
 *     once per event instead. See `portLevels` and `activePorts`.
 *
 * Defaults are derived from `dataType`, so existing ports get the right
 * behaviour without being touched. Set it explicitly to override.
 */
export type TBlueprintPortSignal = 'analog' | 'digital'

export type TBlueprintPortSize = 'sm' | 'md' | 'lg'

/**
 * How tightly a card packs its chrome. Set once on `NbBlueprint` and every
 * card in the canvas inherits it; a card can still override its own.
 *
 *   - `'default'`: 40px header, category line visible, 24px parameter rows.
 *   - `'compact'`: 28px header, category hidden, 20px parameter rows. Meant
 *     for graphs past roughly twenty nodes, where the header of every card is
 *     more of the canvas than the graph is.
 *
 * Density changes chrome only. It never changes port geometry, because a pin
 * that moves when the view setting changes would drag every wire with it.
 */
export type TBlueprintDensity = 'default' | 'compact'

export interface IBlueprintPort {
  /** Unique port identifier */
  id: string
  /** Display label (shown in the tooltip and, when showLabel is true, inline) */
  label: string
  /** Port direction */
  type: 'input' | 'output'
  /** Data type for type-checking and visual styling */
  dataType?: TBlueprintPinDataType
  /** Whether this input is required for the node to be valid */
  required?: boolean
  /**
   * Optional list of sub-channels that make up a multi-channel port.
   * When set, the port always renders as N discrete pins (one per channel),
   * each addressable as `${port.id}/${channel.id}`. Useful as a declarative
   * shorthand for stereo / multi-bus / multi-MIDI ports without writing N
   * separate port entries by hand.
   *
   * The pin's tooltip combines the parent and channel labels
   * (e.g. "Stereo Out . L"); when inline labels are enabled, the channel
   * label is what appears next to the pin (e.g. "L").
   */
  channels?: IBlueprintPortChannel[]
  /**
   * Whether the port's label is rendered inline next to the pin (in addition
   * to the tooltip). Overrides the card-level `showPortLabels` default.
   */
  showLabel?: boolean
  /**
   * Explicit shape override. Beats the `dataType`-derived default.
   * Use when two ports of the same dataType need to look different
   * (e.g. a "trigger" output styled distinctly from a "value"
   * output, both `dataType: 'control'`).
   */
  shape?: TBlueprintPortShape
  /**
   * Explicit color override (any CSS color). Beats the
   * `dataType`-derived default. Use when a single card carries
   * multiple ports of the same type that need to be told apart at
   * a glance (e.g. red bypass-input vs green bypass-output).
   */
  color?: string
  /**
   * Explicit size override. Default `'md'`. Use `'sm'` to
   * de-emphasise a metadata port; use `'lg'` to flag a primary
   * connection.
   */
  size?: TBlueprintPortSize
  /**
   * Whether this port carries a continuous quantity or discrete events.
   * Beats the `dataType`-derived default. Drives the pin's decoration and
   * which activity treatment it uses.
   */
  signal?: TBlueprintPortSignal
}

/** Status indicator level */
export type TBlueprintCardStatus = 'valid' | 'warning' | 'error' | 'none'

/** Parameter row displayed inside the card body */
export interface IBlueprintCardParameter {
  /** Parameter label */
  label: string
  /** Display value */
  value: string | number
  /** Optional unit suffix (e.g. "blocks", "ms") */
  unit?: string
  /** Optional progress bar (0 to 100). When set, a thin bar renders below the row. */
  bar?: number
}

/**
 * Card-level default for inline port labels. Individual ports can opt in/out
 * via `IBlueprintPort.showLabel`. Use `'left'` for input-side labels (typical
 * for an audio interface with named inputs), `'right'` for output-side, etc.
 */
export type TBlueprintPortLabelMode = 'left' | 'right' | 'both' | false

export interface IBlueprintCardProps {
  /** Unique card identifier */
  id: string
  /** Card title */
  title: string
  /** Card accent color (CSS color string) */
  color?: string
  /** Whether the card is enabled (shows toggle) */
  enabled?: boolean
  /** Whether the card is currently selected */
  selected?: boolean
  /** Category label shown below the title */
  category?: string
  /** Input/output port definitions */
  ports?: IBlueprintPort[]
  /** IDs of ports that are currently connected (filled style) */
  connectedPorts?: string[]
  /**
   * IDs of ports currently carrying signal. Active pins keep their
   * connected fill and add a subtle pulsing glow so the user can trace
   * the live signal at a glance. Optional for non-audio consumers.
   */
  activePorts?: string[]
  /** Position X on the canvas (in canvas units) */
  x?: number
  /** Position Y on the canvas (in canvas units) */
  y?: number
  /** Whether the card can be removed */
  removable?: boolean
  /** Whether the card is collapsed (shows only title bar) */
  collapsed?: boolean
  /** Status indicator (valid, warning, error) */
  status?: TBlueprintCardStatus
  /** Compact preview text shown on the card body */
  preview?: string
  /** Structured parameter rows displayed in the card body */
  parameters?: IBlueprintCardParameter[]
  /**
   * Default for inline port labels. Per-port `showLabel` always wins.
   * Default: false (tooltip only).
   */
  showPortLabels?: TBlueprintPortLabelMode
  /**
   * Signal level per port id, **0 to 1** (not 0 to 100), clamped. A port
   * present here fills from the bottom in proportion to its level, so a quiet
   * port looks quiet and a hot one looks hot. Ports in `activePorts` but
   * absent here render as a solid fill instead.
   *
   * The scale is normalised on purpose: the library has no opinion on what
   * the quantity is. An audio host maps dBFS onto 0 to 1 with whatever curve
   * suits its meters, which is a decision only it can make.
   *
   * Only meaningful for analog ports. A digital port has no level; it pulses
   * per event instead, driven by `activePorts`.
   *
   * This replaces the old behaviour, where every active port ran the same
   * looping ring forever and carried no information beyond "wired and live".
   */
  portLevels?: Record<string, number>
  /**
   * Chrome density. Inherited from the parent `NbBlueprint` when unset, so
   * setting it here overrides the canvas for this card only.
   */
  density?: TBlueprintDensity
}
