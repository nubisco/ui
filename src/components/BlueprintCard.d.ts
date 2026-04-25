/** Data type for a pin (determines shape and color) */
export type TBlueprintPinDataType =
  | 'geometry'
  | 'celestial'
  | 'lighting'
  | 'effect'
  | 'surface'
  | 'audio'
  | 'entity'
  | 'number'
  | 'vector3'
  | 'color'
  | 'asset'
  | 'any'

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
}

/** Status indicator level */
export type TBlueprintCardStatus = 'valid' | 'warning' | 'error' | 'none'

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
}
