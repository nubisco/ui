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
}

interface IBoardProps {
  /** Column definitions (one per status/stage). */
  columns: IBoardColumn[]
  /** Items to display on the board. Each item must have an `id` and `columnId`. */
  items: IBoardItem[]
  /** Optional swim lanes. When provided, the board renders horizontal lane rows. */
  lanes?: IBoardLane[]
}

export type {
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardProps,
}

export type {
  IBoardColumn as NbBoardColumn,
  IBoardLane as NbBoardLane,
  IBoardItem as NbBoardItem,
  IBoardMoveEvent as NbBoardMoveEvent,
  IBoardProps as NbBoardProps,
}
