interface IBoardColumn {
  /** Unique column identifier. */
  id: string
  /** Display label for the column header. */
  label: string
  /** Optional accent color for the column header border. */
  color?: string
}

interface IBoardLane {
  /** Unique lane identifier. Use `null` for the catch-all/backlog lane. */
  id: string | null
  /** Display label for the lane header. */
  label: string
}

interface IBoardItem {
  /** Unique item identifier. */
  id: string
  /** Which column this item belongs to. */
  columnId: string
  /** Which lane this item belongs to (optional, only used when lanes are provided). */
  laneId?: string | null
  /** Arbitrary payload passed through to the card slot. */
  [key: string]: unknown
}

interface IBoardMoveEvent {
  /** The ID of the item that was moved. */
  itemId: string
  /** The column the item was moved from. */
  fromColumnId: string
  /** The column the item was moved to. */
  toColumnId: string
  /** The lane the item was moved from (only when lanes are used). */
  fromLaneId?: string | null
  /** The lane the item was moved to (only when lanes are used). */
  toLaneId?: string | null
  /**
   * Index the item should occupy in the destination cell's item sequence,
   * counted with the moved item itself excluded. 0 is the top of the cell.
   */
  toIndex: number
  /** ID of the item that ends up directly above the moved item, or null at the top. */
  beforeItemId: string | null
  /** ID of the item that ends up directly below the moved item, or null at the bottom. */
  afterItemId: string | null
}

interface IBoardNestEvent {
  /** The ID of the item that was dropped onto another. */
  itemId: string
  /** The ID of the item it was dropped onto. */
  ontoItemId: string
  /** The column the dragged item came from. */
  fromColumnId: string
  /** The lane it came from (only when lanes are used). */
  fromLaneId?: string | null
}

/** Several selected cards moved to one place together. */
interface IBoardMoveManyEvent {
  /** The cards that moved, in board order: column by column, top to bottom. */
  itemIds: string[]
  /** The column they all moved to. */
  toColumnId: string
  /** The lane they moved to (only when lanes are used). */
  toLaneId?: string | null
  /** The card left directly above them, or null at the top. Never one of them. */
  beforeItemId: string | null
  /** The card left directly below them, or null at the bottom. Never one of them. */
  afterItemId: string | null
}

interface IBoardColumnMoveEvent {
  /** The ID of the column that was moved. */
  columnId: string
  /** Index the column should occupy in the `columns` array after the move. */
  toIndex: number
}

interface IBoardProps {
  /** Column definitions (one per status/stage). */
  columns: IBoardColumn[]
  /** Items to display on the board. Each item must have an `id` and `columnId`. */
  items: IBoardItem[]
  /** Optional swim lanes. When provided, the board renders horizontal lane rows. */
  lanes?: IBoardLane[]
  /**
   * Allow columns to be reordered by dragging their headers. Off by default;
   * when on, dropping a header on another column emits `column-move`.
   */
  reorderableColumns?: boolean
  /**
   * Allow a card to be dropped ONTO another card, rather than only between
   * cards. Off by default, and off is exactly what every board did before
   * this existed.
   *
   * With it on, a card's middle half nests and its top and bottom quarters
   * still insert, so reordering keeps a target at both ends of every card.
   * The board emits `nest` and changes nothing itself, the same contract as
   * `move`: what nesting means is the host's business, and this component
   * has no opinion about whether the result is a subtask, a child or a part.
   */
  nestable?: boolean
  /**
   * Let the reader select several cards: Cmd or Ctrl-click toggles one,
   * Shift-click takes a run within a cell, X toggles the focused card and
   * Escape clears. Dragging (or picking up with the keyboard) a selected card
   * moves the whole selection and emits `move-many` instead of `move`. A
   * `batch-actions` slot, when given, shows a bar of actions for the
   * selection. Off by default, and off is exactly what every board did
   * before this existed.
   */
  selectable?: boolean
  /** The selected item ids. Use with `v-model:selected`. */
  selected?: string[]
}

export type {
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardNestEvent,
  IBoardColumnMoveEvent,
  IBoardMoveManyEvent,
  IBoardProps,
}

export type {
  IBoardColumn as NbBoardColumn,
  IBoardLane as NbBoardLane,
  IBoardItem as NbBoardItem,
  IBoardMoveEvent as NbBoardMoveEvent,
  IBoardNestEvent as NbBoardNestEvent,
  IBoardColumnMoveEvent as NbBoardColumnMoveEvent,
  IBoardMoveManyEvent as NbBoardMoveManyEvent,
  IBoardProps as NbBoardProps,
}
