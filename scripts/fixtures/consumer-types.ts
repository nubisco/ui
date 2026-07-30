/**
 * Stand-in for an external consumer. Type-checked against the BUILT `dist`
 * (not `src`) by `scripts/verify-consumer-types.mjs`, because every type bug
 * this guards against is invisible from inside the repo: the library
 * type-checks its own source, where all the type modules exist.
 *
 * 1.53.0 shipped `dist/main.d.ts` re-exporting `./components/DataTable.d`, a
 * module the build never emitted. Under the usual `skipLibCheck: true` that
 * failure is silent: the names still import, but every one of them degrades to
 * `any`, so a consumer's typed column API stops checking anything at all.
 *
 * Hence the `@ts-expect-error` probes below. A plain "does it compile" fixture
 * passes happily against `any`. These only pass when the types genuinely
 * resolve, because `any` would accept the bad values and leave the directives
 * unused, which tsc reports.
 */
import type {
  IDataTableColumn,
  IDataTableProps,
  IDataTableSortState,
  TColumnAlign,
  TDataTableSelectable,
  TSortDirection,
  IPaginationProps,
} from '@nubisco/ui'

interface Member {
  id: number
  name: string
  role: string
}

const columns: IDataTableColumn<Member>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', align: 'center' },
]

const sort: IDataTableSortState = { key: 'name', direction: 'asc' }
const direction: TSortDirection = 'desc'
const align: TColumnAlign = 'right'
const selectable: TDataTableSelectable = 'multiple'

const tableProps: Pick<
  IDataTableProps<Member>,
  'columns' | 'rows' | 'rowKey'
> = {
  columns,
  rows: [],
  rowKey: 'id',
}

const pagination: Pick<IPaginationProps, 'page' | 'pageSize' | 'total'> = {
  page: 1,
  pageSize: 10,
  total: 95,
}

// Kept on ONE line each: @ts-expect-error only suppresses the line directly
// after it, so a multi-line object literal puts the real error out of its
// reach and the directive reports as unused for the wrong reason.
// prettier-ignore
// @ts-expect-error - a number is not a column definition
const notAColumn: IDataTableColumn<Member> = 42
// prettier-ignore
// @ts-expect-error - 'middle' is not a TColumnAlign
const badAlign: IDataTableColumn<Member> = { key: 'n', header: 'N', align: 'middle' }
// prettier-ignore
// @ts-expect-error - 'sideways' is not a TSortDirection
const badDirection: IDataTableSortState = { key: 'n', direction: 'sideways' }

export {
  columns,
  sort,
  direction,
  align,
  selectable,
  tableProps,
  pagination,
  notAColumn,
  badAlign,
  badDirection,
}
