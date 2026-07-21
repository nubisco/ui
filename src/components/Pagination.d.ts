import type { ESizeShort } from '@/types/Size.d'

/**
 * NbPagination: footer companion for `NbDataTable` (usable standalone). Fully
 * controlled: it emits `update:page` / `update:pageSize` and renders whatever
 * `page`, `pageSize` and `total` you pass back, so it works for server-side
 * paging without change.
 */
export interface IPaginationProps {
  /** Current 1-based page number. */
  page: number
  /** Rows shown per page. */
  pageSize: number
  /** Total number of rows across all pages. */
  total: number
  /** Selectable page sizes. Default `[10, 20, 30, 40, 50]`. */
  pageSizeOptions?: number[]
  /** Control density. Matches the shared `ESizeShort` scale. Default `md`. */
  size?: ESizeShort | 'sm' | 'md' | 'lg'
  /** Disables all controls. */
  disabled?: boolean
  /** Label before the page-size select. Default `Items per page:`. */
  pageSizeLabel?: string
  /** Noun used in the range read-out, e.g. `... of 240 items`. Default `items`. */
  itemLabel?: string
}

export interface IPaginationEmits {
  /** New 1-based page (`v-model:page`). */
  'update:page': [page: number]
  /** New page size (`v-model:pageSize`). Page resets to 1 alongside. */
  'update:pageSize': [pageSize: number]
}

export type {
  IPaginationProps as NbPaginationProps,
  IPaginationEmits as NbPaginationEmits,
}
