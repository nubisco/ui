/**
 * Tree component types.
 *
 * Carbon Design System-inspired tree view with layer system integration.
 */

export type TTreeDropPosition = 'before' | 'after' | 'inside'

export interface ITreeDropEvent {
  /** ID of the node being dragged */
  sourceId: string
  /** ID of the node being dropped onto */
  targetId: string
  /** Where relative to the target the drop occurred */
  position: TTreeDropPosition
}

export interface ITreeProps {
  /** Currently selected node ID (v-model) */
  modelValue?: string | null
  /** Compact mode: 24px rows instead of 32px */
  compact?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Enable drag and drop reordering */
  draggable?: boolean
}

export interface ITreeNodeProps {
  /** Unique node identifier */
  id: string
  /** Display label */
  label: string
  /** Icon name (from NbIcon) */
  icon?: string
  /** Whether the node is disabled */
  disabled?: boolean
  /** Depth level (auto-computed from nesting, override to set manually) */
  depth?: number | null
  /** Override tree-level draggable for this node (opt-in or opt-out) */
  draggable?: boolean | null
}

export interface ITreeDragState {
  /** ID of the node currently being dragged, or null */
  dragId: string | null
  /** ID of the current drop target node, or null */
  dropTargetId: string | null
  /** Drop position relative to the target */
  dropPosition: TTreeDropPosition | null
}

export interface ITreeContext {
  selectedId: string | null
  select: (id: string) => void
  toggle: (id: string) => void
  expandedIds: Set<string>
  compact: boolean
  draggable: boolean
  drag: ITreeDragState
  onDragStart: (id: string) => void
  onDragOver: (id: string, position: TTreeDropPosition) => void
  onDragLeave: (id: string) => void
  onDrop: () => void
  onDragEnd: () => void
  registerNode: (id: string, el: HTMLElement) => void
  unregisterNode: (id: string) => void
}
