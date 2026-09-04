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
}

export type {
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardColumnMoveEvent,
  IBoardProps,
}

export type {
  IBoardColumn as NbBoardColumn,
  IBoardLane as NbBoardLane,
  IBoardItem as NbBoardItem,
  IBoardMoveEvent as NbBoardMoveEvent,
  IBoardColumnMoveEvent as NbBoardColumnMoveEvent,
  IBoardProps as NbBoardProps,
}
