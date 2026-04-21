export interface IBlueprintPort {
  /** Unique port identifier */
  id: string
  /** Display label (shown as tooltip) */
  label: string
  /** Port direction */
  type: 'input' | 'output'
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
  /** Position X on the canvas (in canvas units) */
  x?: number
  /** Position Y on the canvas (in canvas units) */
  y?: number
  /** Whether the card can be removed */
  removable?: boolean
}
