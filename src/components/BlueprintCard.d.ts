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
}
