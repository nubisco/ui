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
  IBlueprintPort,
  IBlueprintProps,
  IBlueprintCardProps,
  IBlueprintConnectionEnd,
  TBlueprintCardStatus,
  TBlueprintKnownPinDataType,
  TBlueprintPinDataType,
  IChatThreadProps,
  IChatMessageProps,
  ILogLine,
  ILogViewProps,
  TLogLevel,
  ISidebarMenuItemProps,
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

// Blueprint: the pin data type is open (a known type, or any string), the
// card status gained `active` and `pending`, and the canvas takes `readonly`
// and `canConnect`. A port written before any of that must still check.
const legacyPort: IBlueprintPort = {
  id: 'in',
  label: 'In',
  type: 'input',
  dataType: 'audio:stereo',
}
const customPort: IBlueprintPort = {
  id: 'doc',
  label: 'Doc',
  type: 'output',
  dataType: 'doc:draft',
}
const knownType: TBlueprintKnownPinDataType = 'midi'
const openType: TBlueprintPinDataType = 'anything-at-all'
const workStatus: TBlueprintCardStatus = 'active'
const cardProps: Pick<IBlueprintCardProps, 'id' | 'title' | 'status'> = {
  id: 'c',
  title: 'C',
  status: 'pending',
}
const canvasProps: Pick<
  IBlueprintProps,
  'readonly' | 'canConnect' | 'editable'
> = {
  readonly: true,
  editable: false,
  canConnect: (from: IBlueprintConnectionEnd, to: IBlueprintConnectionEnd) =>
    from.type === 'output' && to.dataType !== 'midi',
}
// prettier-ignore
// @ts-expect-error - 'running' is not a TBlueprintCardStatus
const badStatus: TBlueprintCardStatus = 'running'
// prettier-ignore
// @ts-expect-error - an arbitrary string is not a known pin data type
const badKnownType: TBlueprintKnownPinDataType = 'doc:draft'
// prettier-ignore
// @ts-expect-error - a number is not a pin data type
const badPinType: TBlueprintPinDataType = 3

const threadProps: Pick<
  IChatThreadProps,
  'working' | 'composer' | 'disabled' | 'disabledReason' | 'stoppable'
> = {
  working: true,
  composer: true,
  disabled: true,
  disabledReason: 'The agent is not running',
  stoppable: true,
}
const messageProps: IChatMessageProps = {
  author: 'Assistant',
  picture: null,
  own: false,
  ai: true,
  aiExplain: 'Written by the workspace model.',
  time: new Date(),
}
const logLevel: TLogLevel = 'warning'
const logLines: ILogLine[] = [
  { text: 'started', time: Date.now(), level: 'info' },
  { id: 2, text: 'failed', level: 'error', marker: 'stderr' },
]
const logProps: ILogViewProps = { lines: ['plain', ...logLines], maxLines: 500 }
const liveItem: Pick<ISidebarMenuItemProps, 'label' | 'live' | 'liveLabel'> = {
  label: 'Runs',
  live: true,
  liveLabel: 'Running',
}
// prettier-ignore
// @ts-expect-error - 'fatal' is not a TLogLevel
const badLogLevel: TLogLevel = 'fatal'
// prettier-ignore
// @ts-expect-error - a log line needs its text
const badLogLine: ILogLine = { level: 'error' }
// prettier-ignore
// @ts-expect-error - a message needs its author
const badMessage: IChatMessageProps = { text: 'hi' }
export {
  threadProps,
  messageProps,
  logLevel,
  logLines,
  logProps,
  liveItem,
  badLogLevel,
  badLogLine,
  badMessage,
  legacyPort,
  customPort,
  knownType,
  openType,
  workStatus,
  cardProps,
  canvasProps,
  badStatus,
  badKnownType,
  badPinType,
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
