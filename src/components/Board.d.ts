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
}

export type {
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardNestEvent,
  IBoardColumnMoveEvent,
  IBoardProps,
}

export type {
  IBoardColumn as NbBoardColumn,
  IBoardLane as NbBoardLane,
  IBoardItem as NbBoardItem,
  IBoardMoveEvent as NbBoardMoveEvent,
  IBoardNestEvent as NbBoardNestEvent,
  IBoardColumnMoveEvent as NbBoardColumnMoveEvent,
  IBoardProps as NbBoardProps,
}
