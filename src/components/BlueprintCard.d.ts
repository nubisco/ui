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
  /** Display label (shown inline on the card) */
  label: string
  /** Port direction */
  type: 'input' | 'output'
  /** Data type for type-checking and visual styling */
  dataType?: TBlueprintPinDataType
  /** Whether this input is required for the node to be valid */
  required?: boolean
  /**
   * Optional list of sub-channels that make up this bundle port.
   * When set, the port renders as a single bundle pin (with a channel-count
   * badge) by default. The user can expand the bundle to expose individual
   * sub-pins, each addressable as `${port.id}/${channel.id}`.
   *
   * Connections that reference a sub-channel id remain visible when the
   * bundle is collapsed; the wire is routed to the bundle pin's center.
   */
  channels?: IBlueprintPortChannel[]
  /** When true, the bundle starts in the expanded state. Default false. */
  defaultExpanded?: boolean
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
}
