<template>
  <div class="nb-spreadsheet" :class="{ 'nb-spreadsheet--editing': !!editing }">
    <div v-if="$slots.toolbar" class="nb-spreadsheet__toolbar">
      <slot name="toolbar" />
    </div>

    <div
      ref="scrollerRef"
      class="nb-spreadsheet__scroller"
      tabindex="0"
      @keydown="onKeydown"
      @copy="onCopy"
      @cut="onCut"
      @paste="onPaste"
      @scroll="onScroll"
    >
      <!-- ── CSS-grid layout: rows = header + body, columns = gutter + cols ── -->
      <div class="nb-spreadsheet__grid" :style="gridStyle">
        <!-- Header gutter cell -->
        <div
          v-if="showGutter"
          class="nb-spreadsheet__corner"
          :style="{ gridRow: 1, gridColumn: 1 }"
        />

        <!-- Header cells -->
        <div
          v-for="(col, ci) in orderedColumns"
          :key="`h-${col.id}`"
          class="nb-spreadsheet__header"
          :class="headerClass(col)"
          :style="headerStyle(col, ci)"
          @click="onHeaderClick(col)"
        >
          <span class="nb-spreadsheet__header-label">{{ col.label }}</span>
          <span
            v-if="sortBy && sortBy.columnId === col.id"
            class="nb-spreadsheet__sort"
            aria-hidden="true"
          >
            {{ sortBy.direction === 'asc' ? '▲' : '▼' }}
          </span>
          <span
            v-if="resizable"
            class="nb-spreadsheet__resize-handle"
            @mousedown.stop="startResize($event, col)"
          />
        </div>

        <!-- Row gutter + data cells -->
        <template v-for="(row, vi) in renderRows" :key="`r-${row.id}`">
          <div
            v-if="showGutter"
            class="nb-spreadsheet__gutter"
            :class="{
              'nb-spreadsheet__gutter--pinned-top': row.pinned === 'top',
              'nb-spreadsheet__gutter--pinned-bottom': row.pinned === 'bottom',
            }"
            :style="gutterStyle(vi, row)"
          >
            {{ row.gutterLabel ?? vi + 1 }}
          </div>
          <div
            v-for="(col, ci) in orderedColumns"
            :key="`c-${row.id}-${col.id}`"
            class="nb-spreadsheet__cell"
            :class="cellClass(row, col)"
            :style="cellStyle(row, col, vi, ci)"
            :title="cellTitle(row, col)"
            :data-cell="`${row.id}::${col.id}`"
            :data-row="row.id"
            :data-col="col.id"
            @mousedown="onCellMouseDown($event, row, col)"
            @mouseenter="onCellMouseEnter(row, col)"
            @dblclick="onCellDblClick(row, col)"
          >
            <span>{{ cellDisplay(row, col) }}</span>
          </div>
        </template>
      </div>

      <!-- Edit input overlay -->
      <input
        v-if="editing"
        ref="editorRef"
        v-model="editing.draft"
        class="nb-spreadsheet__editor"
        :style="editorStyle"
        :inputmode="editorInputMode"
        @blur="commitEdit(true)"
        @keydown.stop="onEditorKeydown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// The `computed` prop (ISpreadsheetProps.computed) intentionally shares a name
// with Vue's `computed`; the rule can't tell them apart in <script setup>.
// eslint-disable-next-line vue/no-dupe-keys
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import type {
  ISpreadsheetProps,
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetCellAttrs,
  ISpreadsheetChange,
  ISpreadsheetSelection,
  TSpreadsheetSortDir,
} from './Spreadsheet.d'

const props = withDefaults(defineProps<ISpreadsheetProps>(), {
  resizable: true,
  rowReorderable: false,
  showGutter: true,
  windowRows: 80,
  locale: 'pt-PT',
})

const emit = defineEmits<{
  commit: [change: ISpreadsheetChange]
  change: [changes: ISpreadsheetChange[]]
  selection: [sel: ISpreadsheetSelection | null]
  focus: [cell: { rowId: string; columnId: string } | null]
  'row-reorder': [{ rowId: string; toIndex: number }]
}>()

// ─── State ─────────────────────────────────────────────────────────────────
const scrollerRef = useTemplateRef<HTMLDivElement>('scrollerRef')
const editorRef = useTemplateRef<HTMLInputElement>('editorRef')
const columnWidths = ref<Record<string, number>>({})
const sortBy = ref<{ columnId: string; direction: TSpreadsheetSortDir } | null>(
  null,
)

interface IFocusCell {
  rowId: string
  columnId: string
}
const focused = ref<IFocusCell | null>(null)
const selection = ref<ISpreadsheetSelection | null>(null)
const isSelecting = ref(false)
const editing = ref<{ rowId: string; columnId: string; draft: string } | null>(
  null,
)
const scrollTop = ref(0)
const undoStack = ref<ISpreadsheetChange[][]>([])
const redoStack = ref<ISpreadsheetChange[][]>([])

// ─── Derived: column ordering with pinned-left first, pinned-right last ────
const orderedColumns = computed<ISpreadsheetColumn[]>(() => {
  const left = props.columns.filter((c) => c.pinned === 'left')
  const right = props.columns.filter((c) => c.pinned === 'right')
  const mid = props.columns.filter((c) => !c.pinned)
  return [...left, ...mid, ...right]
})

function widthOf(col: ISpreadsheetColumn): number {
  return columnWidths.value[col.id] ?? col.width ?? 120
}

const gutterWidth = 44
const headerHeight = 32
const rowHeight = 28

const gridStyle = computed(() => {
  const cols =
    (props.showGutter ? `${gutterWidth}px ` : '') +
    orderedColumns.value.map((c) => `${widthOf(c)}px`).join(' ')
  return { gridTemplateColumns: cols }
})

// ─── Sorted + windowed rows ────────────────────────────────────────────────
const sortedDataRows = computed(() => {
  const data = props.rows.filter((r) => !r.pinned)
  if (!sortBy.value) return data
  const col = props.columns.find((c) => c.id === sortBy.value!.columnId)
  if (!col) return data
  const dir = sortBy.value.direction === 'asc' ? 1 : -1
  const cmp = (a: unknown, b: unknown) => {
    if (a == null && b == null) return 0
    if (a == null) return -1
    if (b == null) return 1
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * dir
    return String(a).localeCompare(String(b)) * dir
  }
  return [...data].sort((ra, rb) => cmp(ra.values[col.id], rb.values[col.id]))
})

const pinnedTopRows = computed(() =>
  props.rows.filter((r) => r.pinned === 'top'),
)
const pinnedBottomRows = computed(() =>
  props.rows.filter((r) => r.pinned === 'bottom'),
)

interface IRenderRow extends ISpreadsheetRow {
  __virtualIndex: number
  gutterLabel?: string
}

const renderRows = computed<IRenderRow[]>(() => {
  // Lightweight virtualization for the unpinned section.
  const visibleCount = Math.max(
    1,
    Math.ceil((scrollerRef.value?.clientHeight ?? 600) / rowHeight),
  )
  const buffer = Math.max(10, Math.floor(props.windowRows / 4))
  const startRaw =
    Math.floor(scrollTop.value / rowHeight) -
    pinnedTopRows.value.length -
    buffer
  const start = Math.max(0, startRaw)
  const end = Math.min(
    sortedDataRows.value.length,
    start + visibleCount + buffer * 2,
  )
  const top: IRenderRow[] = pinnedTopRows.value.map((r, i) => ({
    ...r,
    __virtualIndex: i,
    gutterLabel: '',
  }))
  const mid: IRenderRow[] = sortedDataRows.value
    .slice(start, end)
    .map((r, i) => ({
      ...r,
      __virtualIndex: start + i + pinnedTopRows.value.length,
    }))
  const bot: IRenderRow[] = pinnedBottomRows.value.map((r, i) => ({
    ...r,
    __virtualIndex:
      pinnedTopRows.value.length + sortedDataRows.value.length + i,
    gutterLabel: '',
  }))
  return [...top, ...mid, ...bot]
})

// ─── Cell helpers ──────────────────────────────────────────────────────────
function defaultFormat(col: ISpreadsheetColumn, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return ''
  if (col.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n)) return String(raw)
    return new Intl.NumberFormat(props.locale, {
      maximumFractionDigits: 4,
    }).format(n)
  }
  if (col.type === 'date') {
    const d = raw instanceof Date ? raw : new Date(raw as string)
    if (Number.isNaN(d.getTime())) return String(raw)
    return new Intl.DateTimeFormat(props.locale).format(d)
  }
  return String(raw)
}

function defaultParse(col: ISpreadsheetColumn, input: string): unknown {
  if (input === '') return null
  if (col.type === 'number') {
    const cleaned = input.replace(/\s/g, '').replace(',', '.')
    const n = Number(cleaned)
    if (!Number.isFinite(n)) throw new Error('Invalid number')
    return n
  }
  if (col.type === 'date') {
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
    return d.toISOString().slice(0, 10)
  }
  return input
}

function rawValue(rowId: string, columnId: string): unknown {
  const row = props.rows.find((r) => r.id === rowId)
  if (!row) return undefined
  // Prefer raw value, fall back to computed function
  const v = row.values[columnId]
  if (v !== undefined) return v
  if (props.computed) return props.computed(rowId, columnId, rawValue)
  return undefined
}

function cellAttrsFor(
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
): ISpreadsheetCellAttrs {
  if (!props.cellAttrs) return {}
  return props.cellAttrs(row.id, col.id, row, col) ?? {}
}

function cellDisplay(row: ISpreadsheetRow, col: ISpreadsheetColumn): string {
  const attrs = cellAttrsFor(row, col)
  if (attrs.display !== undefined) return attrs.display
  const raw = rawValue(row.id, col.id)
  return col.format ? col.format(raw, row) : defaultFormat(col, raw)
}

function cellClass(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  const attrs = cellAttrsFor(row, col)
  const isFocused =
    focused.value?.rowId === row.id && focused.value?.columnId === col.id
  const isInSelection = isCellInSelection(row.id, col.id)
  const alignClass =
    col.align ??
    (col.type === 'number' || col.type === 'date' ? 'right' : 'left')
  return {
    [`nb-spreadsheet__cell--${alignClass}`]: true,
    'nb-spreadsheet__cell--focused': isFocused,
    'nb-spreadsheet__cell--selected': isInSelection,
    'nb-spreadsheet__cell--readonly': isReadOnly(row, col),
    'nb-spreadsheet__cell--computed': !!attrs.computed || !!row.computed,
    'nb-spreadsheet__cell--pinned-top': row.pinned === 'top',
    'nb-spreadsheet__cell--pinned-bottom': row.pinned === 'bottom',
    [attrs.className ?? '']: !!attrs.className,
    [row.className ?? '']: !!row.className,
  }
}

function isReadOnly(row: ISpreadsheetRow, col: ISpreadsheetColumn): boolean {
  if (row.computed) return true
  if (col.readOnly) return true
  const attrs = cellAttrsFor(row, col)
  return !!attrs.readOnly || !!attrs.computed
}

function cellTitle(row: ISpreadsheetRow, col: ISpreadsheetColumn): string {
  return cellAttrsFor(row, col).tooltip ?? ''
}

function headerClass(col: ISpreadsheetColumn) {
  return {
    'nb-spreadsheet__header--sortable': !!col.sortable,
    'nb-spreadsheet__header--pinned-left': col.pinned === 'left',
    'nb-spreadsheet__header--pinned-right': col.pinned === 'right',
  }
}

function pinnedLeftOffset(col: ISpreadsheetColumn): number {
  if (col.pinned !== 'left') return 0
  let off = props.showGutter ? gutterWidth : 0
  for (const c of orderedColumns.value) {
    if (c.id === col.id) break
    if (c.pinned === 'left') off += widthOf(c)
  }
  return off
}

function pinnedRightOffset(col: ISpreadsheetColumn): number {
  if (col.pinned !== 'right') return 0
  let off = 0
  const cols = [...orderedColumns.value].reverse()
  for (const c of cols) {
    if (c.id === col.id) break
    if (c.pinned === 'right') off += widthOf(c)
  }
  return off
}

function headerStyle(col: ISpreadsheetColumn, ci: number) {
  const baseCol = (props.showGutter ? 2 : 1) + ci
  const sticky: Record<string, string> = {}
  if (col.pinned === 'left') {
    sticky.position = 'sticky'
    sticky.left = `${pinnedLeftOffset(col)}px`
    sticky.zIndex = '3'
  } else if (col.pinned === 'right') {
    sticky.position = 'sticky'
    sticky.right = `${pinnedRightOffset(col)}px`
    sticky.zIndex = '3'
  }
  return { gridRow: 1, gridColumn: baseCol, ...sticky }
}

function cellStyle(
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
  vi: number,
  ci: number,
) {
  const baseCol = (props.showGutter ? 2 : 1) + ci
  const gridRow = vi + 2
  const sticky: Record<string, string> = {}
  if (col.pinned === 'left') {
    sticky.position = 'sticky'
    sticky.left = `${pinnedLeftOffset(col)}px`
    sticky.zIndex = '2'
  } else if (col.pinned === 'right') {
    sticky.position = 'sticky'
    sticky.right = `${pinnedRightOffset(col)}px`
    sticky.zIndex = '2'
  }
  if (row.pinned === 'top' || row.pinned === 'bottom') {
    sticky.position = 'sticky'
    sticky.zIndex = String(Math.max(Number(sticky.zIndex ?? 0), 2))
    if (row.pinned === 'top') sticky.top = `${headerHeight}px`
    if (row.pinned === 'bottom') sticky.bottom = '0'
  }
  return { gridRow, gridColumn: baseCol, ...sticky }
}

function gutterStyle(vi: number, row: ISpreadsheetRow) {
  const sticky: Record<string, string> = {
    position: 'sticky',
    left: '0',
    zIndex: '2',
  }
  if (row.pinned === 'top') {
    sticky.top = `${headerHeight}px`
    sticky.zIndex = '4'
  }
  if (row.pinned === 'bottom') {
    sticky.bottom = '0'
    sticky.zIndex = '4'
  }
  return { gridRow: vi + 2, gridColumn: 1, ...sticky }
}

// ─── Selection helpers ─────────────────────────────────────────────────────
function isCellInSelection(rowId: string, columnId: string): boolean {
  if (!selection.value) return false
  const rowIds = [
    ...pinnedTopRows.value,
    ...sortedDataRows.value,
    ...pinnedBottomRows.value,
  ].map((r) => r.id)
  const colIds = orderedColumns.value.map((c) => c.id)
  const r1 = rowIds.indexOf(selection.value.startRowId)
  const r2 = rowIds.indexOf(selection.value.endRowId)
  const c1 = colIds.indexOf(selection.value.startColumnId)
  const c2 = colIds.indexOf(selection.value.endColumnId)
  const ri = rowIds.indexOf(rowId)
  const ci = colIds.indexOf(columnId)
  return (
    ri >= Math.min(r1, r2) &&
    ri <= Math.max(r1, r2) &&
    ci >= Math.min(c1, c2) &&
    ci <= Math.max(c1, c2)
  )
}

function setFocus(rowId: string, columnId: string, extendSelection = false) {
  focused.value = { rowId, columnId }
  if (extendSelection && selection.value) {
    selection.value = {
      ...selection.value,
      endRowId: rowId,
      endColumnId: columnId,
    }
  } else {
    selection.value = {
      startRowId: rowId,
      startColumnId: columnId,
      endRowId: rowId,
      endColumnId: columnId,
    }
  }
  emit('focus', focused.value)
  emit('selection', selection.value)
}

// ─── Mouse selection ───────────────────────────────────────────────────────
function onCellMouseDown(
  e: MouseEvent,
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
) {
  if (editing.value) commitEdit(true)
  isSelecting.value = true
  setFocus(row.id, col.id, e.shiftKey)
  scrollerRef.value?.focus()
  e.preventDefault()
  document.addEventListener('mouseup', stopSelecting, { once: true })
}

function onCellMouseEnter(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  if (!isSelecting.value || !selection.value) return
  selection.value = {
    ...selection.value,
    endRowId: row.id,
    endColumnId: col.id,
  }
  emit('selection', selection.value)
}

function stopSelecting() {
  isSelecting.value = false
}

function onCellDblClick(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  if (!isReadOnly(row, col)) startEdit(row, col, '')
}

// ─── Keyboard ──────────────────────────────────────────────────────────────
function moveBy(dRow: number, dCol: number, extendSelection = false) {
  if (!focused.value) {
    const first = orderedColumns.value[0]
    const firstRow = renderRows.value[0]
    if (first && firstRow) setFocus(firstRow.id, first.id)
    return
  }
  const allRows = [
    ...pinnedTopRows.value,
    ...sortedDataRows.value,
    ...pinnedBottomRows.value,
  ]
  const ri = allRows.findIndex((r) => r.id === focused.value!.rowId)
  const ci = orderedColumns.value.findIndex(
    (c) => c.id === focused.value!.columnId,
  )
  const nri = Math.max(0, Math.min(allRows.length - 1, ri + dRow))
  const nci = Math.max(0, Math.min(orderedColumns.value.length - 1, ci + dCol))
  setFocus(allRows[nri].id, orderedColumns.value[nci].id, extendSelection)
  scrollIntoView(allRows[nri].id)
}

function scrollIntoView(rowId: string) {
  // Only data rows trigger scroll; pinned rows are always visible.
  const idx = sortedDataRows.value.findIndex((r) => r.id === rowId)
  if (idx < 0 || !scrollerRef.value) return
  const top = idx * rowHeight
  const view = scrollerRef.value
  if (top < view.scrollTop) view.scrollTop = top
  else if (top + rowHeight > view.scrollTop + view.clientHeight - headerHeight)
    view.scrollTop = top - view.clientHeight + headerHeight + rowHeight
}

function onScroll() {
  scrollTop.value = scrollerRef.value?.scrollTop ?? 0
}

function onKeydown(e: KeyboardEvent) {
  if (editing.value) return
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
    return
  }
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      moveBy(1, 0, e.shiftKey)
      break
    case 'ArrowUp':
      e.preventDefault()
      moveBy(-1, 0, e.shiftKey)
      break
    case 'ArrowLeft':
      e.preventDefault()
      moveBy(0, -1, e.shiftKey)
      break
    case 'ArrowRight':
      e.preventDefault()
      moveBy(0, 1, e.shiftKey)
      break
    case 'Tab':
      e.preventDefault()
      moveBy(0, e.shiftKey ? -1 : 1)
      break
    case 'Enter':
      e.preventDefault()
      if (focused.value) {
        const r = props.rows.find((rr) => rr.id === focused.value!.rowId)
        const c = props.columns.find((cc) => cc.id === focused.value!.columnId)
        if (r && c && !isReadOnly(r, c)) startEdit(r, c, '')
      }
      break
    case 'Escape':
      selection.value = null
      emit('selection', null)
      break
    case 'Delete':
    case 'Backspace':
      e.preventDefault()
      clearSelection()
      break
    case 'F2':
      e.preventDefault()
      if (focused.value) {
        const r = props.rows.find((rr) => rr.id === focused.value!.rowId)
        const c = props.columns.find((cc) => cc.id === focused.value!.columnId)
        if (r && c && !isReadOnly(r, c)) {
          const raw = rawValue(r.id, c.id)
          startEdit(r, c, raw == null ? '' : String(raw))
        }
      }
      break
    default:
      if (
        focused.value &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.length === 1
      ) {
        const r = props.rows.find((rr) => rr.id === focused.value!.rowId)
        const c = props.columns.find((cc) => cc.id === focused.value!.columnId)
        if (r && c && !isReadOnly(r, c)) {
          e.preventDefault()
          startEdit(r, c, e.key)
        }
      }
  }
}

// ─── Edit lifecycle ────────────────────────────────────────────────────────
function startEdit(
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
  draft: string,
) {
  editing.value = { rowId: row.id, columnId: col.id, draft }
  void nextTick(() => {
    editorRef.value?.focus()
    editorRef.value?.select()
  })
}

const editorInputMode = computed(() => {
  if (!editing.value) return undefined
  const col = props.columns.find((c) => c.id === editing.value!.columnId)
  if (col?.type === 'number') return 'decimal'
  return 'text'
})

const editorStyle = computed(() => {
  if (!editing.value) return { display: 'none' }
  const cell = scrollerRef.value?.querySelector<HTMLElement>(
    `[data-cell="${editing.value.rowId}::${editing.value.columnId}"]`,
  )
  if (!cell) return { display: 'none' }
  const rect = cell.getBoundingClientRect()
  const scrollRect = scrollerRef.value!.getBoundingClientRect()
  return {
    top: `${rect.top - scrollRect.top}px`,
    left: `${rect.left - scrollRect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

function onEditorKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    commitEdit(false)
    moveBy(1, 0)
  } else if (e.key === 'Tab') {
    e.preventDefault()
    commitEdit(false)
    moveBy(0, e.shiftKey ? -1 : 1)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    editing.value = null
    scrollerRef.value?.focus()
  }
}

function commitEdit(_blurOnly: boolean) {
  if (!editing.value) return
  const { rowId, columnId, draft } = editing.value
  const col = props.columns.find((c) => c.id === columnId)
  if (!col) {
    editing.value = null
    return
  }
  let value: unknown
  try {
    value = col.parse ? col.parse(draft) : defaultParse(col, draft)
  } catch {
    editing.value = null
    return
  }
  const before = rawValue(rowId, columnId)
  if (before === value) {
    editing.value = null
    return
  }
  const change: ISpreadsheetChange = { rowId, columnId, before, after: value }
  pushUndo([change])
  emit('commit', change)
  emit('change', [change])
  editing.value = null
  scrollerRef.value?.focus()
}

// ─── Bulk clear / clipboard ────────────────────────────────────────────────
function selectedCells(): Array<{ rowId: string; columnId: string }> {
  if (!selection.value) return []
  const allRows = [
    ...pinnedTopRows.value,
    ...sortedDataRows.value,
    ...pinnedBottomRows.value,
  ].map((r) => r.id)
  const cols = orderedColumns.value.map((c) => c.id)
  const r1 = allRows.indexOf(selection.value.startRowId)
  const r2 = allRows.indexOf(selection.value.endRowId)
  const c1 = cols.indexOf(selection.value.startColumnId)
  const c2 = cols.indexOf(selection.value.endColumnId)
  const out: Array<{ rowId: string; columnId: string }> = []
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      out.push({ rowId: allRows[r], columnId: cols[c] })
    }
  }
  return out
}

function clearSelection() {
  const cells = selectedCells()
  const changes: ISpreadsheetChange[] = []
  for (const { rowId, columnId } of cells) {
    const row = props.rows.find((r) => r.id === rowId)
    const col = props.columns.find((c) => c.id === columnId)
    if (!row || !col || isReadOnly(row, col)) continue
    const before = rawValue(rowId, columnId)
    if (before === null || before === undefined || before === '') continue
    changes.push({ rowId, columnId, before, after: null })
  }
  if (changes.length === 0) return
  pushUndo(changes)
  for (const ch of changes) emit('commit', ch)
  emit('change', changes)
}

function onCopy(e: ClipboardEvent) {
  const cells = selectedCells()
  if (cells.length === 0) return
  const allRows = [
    ...pinnedTopRows.value,
    ...sortedDataRows.value,
    ...pinnedBottomRows.value,
  ].map((r) => r.id)
  const cols = orderedColumns.value.map((c) => c.id)
  const r1 = Math.min(
    allRows.indexOf(selection.value!.startRowId),
    allRows.indexOf(selection.value!.endRowId),
  )
  const r2 = Math.max(
    allRows.indexOf(selection.value!.startRowId),
    allRows.indexOf(selection.value!.endRowId),
  )
  const c1 = Math.min(
    cols.indexOf(selection.value!.startColumnId),
    cols.indexOf(selection.value!.endColumnId),
  )
  const c2 = Math.max(
    cols.indexOf(selection.value!.startColumnId),
    cols.indexOf(selection.value!.endColumnId),
  )
  const rows: string[] = []
  for (let r = r1; r <= r2; r++) {
    const parts: string[] = []
    for (let c = c1; c <= c2; c++) {
      const raw = rawValue(allRows[r], cols[c])
      parts.push(raw == null ? '' : String(raw))
    }
    rows.push(parts.join('\t'))
  }
  e.preventDefault()
  e.clipboardData?.setData('text/plain', rows.join('\n'))
}

function onCut(e: ClipboardEvent) {
  onCopy(e)
  clearSelection()
}

function onPaste(e: ClipboardEvent) {
  if (!focused.value) return
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (!text) return
  e.preventDefault()
  const matrix = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.split('\t'))
  const allRows = [
    ...pinnedTopRows.value,
    ...sortedDataRows.value,
    ...pinnedBottomRows.value,
  ].map((r) => r.id)
  const cols = orderedColumns.value.map((c) => c.id)
  const baseR = allRows.indexOf(focused.value.rowId)
  const baseC = cols.indexOf(focused.value.columnId)
  const changes: ISpreadsheetChange[] = []
  matrix.forEach((line, dr) => {
    line.forEach((cellText, dc) => {
      const rowId = allRows[baseR + dr]
      const columnId = cols[baseC + dc]
      if (!rowId || !columnId) return
      const row = props.rows.find((r) => r.id === rowId)
      const col = props.columns.find((c) => c.id === columnId)
      if (!row || !col || isReadOnly(row, col)) return
      let value: unknown
      try {
        value = col.parse ? col.parse(cellText) : defaultParse(col, cellText)
      } catch {
        return
      }
      const before = rawValue(rowId, columnId)
      if (before === value) return
      changes.push({ rowId, columnId, before, after: value })
    })
  })
  if (changes.length === 0) return
  pushUndo(changes)
  for (const ch of changes) emit('commit', ch)
  emit('change', changes)
}

// ─── Resize ────────────────────────────────────────────────────────────────
function startResize(e: MouseEvent, col: ISpreadsheetColumn) {
  const startX = e.clientX
  const startW = widthOf(col)
  const min = col.minWidth ?? 60
  const onMove = (mv: MouseEvent) => {
    const next = Math.max(min, startW + (mv.clientX - startX))
    columnWidths.value = { ...columnWidths.value, [col.id]: next }
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ─── Sort ──────────────────────────────────────────────────────────────────
function onHeaderClick(col: ISpreadsheetColumn) {
  if (!col.sortable) return
  if (sortBy.value?.columnId === col.id) {
    sortBy.value =
      sortBy.value.direction === 'asc'
        ? { columnId: col.id, direction: 'desc' }
        : null
  } else {
    sortBy.value = { columnId: col.id, direction: 'asc' }
  }
}

// ─── Undo / redo ───────────────────────────────────────────────────────────
function pushUndo(changes: ISpreadsheetChange[]) {
  undoStack.value.push(changes)
  redoStack.value = []
}

function undo() {
  const group = undoStack.value.pop()
  if (!group) return
  const reverted: ISpreadsheetChange[] = group.map((ch) => ({
    ...ch,
    before: ch.after,
    after: ch.before,
  }))
  for (const ch of reverted) emit('commit', ch)
  emit('change', reverted)
  redoStack.value.push(group)
}

function redo() {
  const group = redoStack.value.pop()
  if (!group) return
  for (const ch of group) emit('commit', ch)
  emit('change', group)
  undoStack.value.push(group)
}

onMounted(() => {
  scrollerRef.value?.focus()
})

// Expose for parents
defineExpose({
  focus: (rowId: string, columnId: string) => setFocus(rowId, columnId),
  undo,
  redo,
  getSelection: () => selection.value,
})
</script>

<style lang="scss" scoped>
// ─── NbSpreadsheet — Carbon-aligned data spreadsheet ──────────────────────
//
// Visual language follows IBM Carbon's Data Spreadsheet:
// - Compact 32px rows, hairline borders, dense typography.
// - The active cell has a 2px primary outline (inside the cell, not around it).
// - Header sits in --nb-c-surface and the body in --nb-c-surface-raised so the
//   component reads correctly on any `.nb-layer-N` parent.
// - Cell hover is a 1-level lift via --nb-c-surface-hover.
//
// Token map (NubiscoUI surface API):
//   --nb-c-surface         : header + footer base
//   --nb-c-surface-raised  : body cell base
//   --nb-c-surface-hover   : row/cell hover
//   --nb-c-border          : every line
//   --nb-c-text / muted    : foreground hierarchy
//   --nb-c-primary / 100   : focus + selection
//
// Anything component-local (focus ring width, header height) is a CSS custom
// property at the root scope so callers can override per instance.

.nb-spreadsheet {
  --nbss-row-height: 32px;
  --nbss-header-height: 36px;
  --nbss-cell-padding-x: 0.625rem;
  --nbss-focus-ring: var(--nb-c-primary, #6a40d0);

  display: flex;
  flex-direction: column;
  border: 1px solid var(--nb-c-border);
  border-radius: 4px;
  background: var(--nb-c-surface-raised, var(--nb-c-surface));
  color: var(--nb-c-text);
  overflow: hidden;
  font-family: var(--nb-font-family-sans, system-ui);
  font-size: 0.8125rem;
  line-height: 1.25;
}

.nb-spreadsheet__toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  min-height: var(--nbss-header-height);
}

.nb-spreadsheet__scroller {
  position: relative;
  overflow: auto;
  max-height: 70vh;
  outline: none;
}
.nb-spreadsheet__scroller:focus-visible {
  box-shadow: inset 0 0 0 2px var(--nbss-focus-ring);
}

.nb-spreadsheet__grid {
  display: grid;
  grid-auto-rows: var(--nbss-row-height);
  position: relative;
}

// ─── Header row ──────────────────────────────────────────────────────────
.nb-spreadsheet__corner {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 5;
  background: var(--nb-c-surface);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  height: var(--nbss-header-height);
}

.nb-spreadsheet__header {
  position: sticky;
  top: 0;
  z-index: 3;
  height: var(--nbss-header-height);
  display: flex;
  align-items: center;
  padding: 0 var(--nbss-cell-padding-x);
  background: var(--nb-c-surface);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.16px;
  text-transform: uppercase;
  color: var(--nb-c-text);
  user-select: none;
}

.nb-spreadsheet__header--sortable {
  cursor: pointer;
}
.nb-spreadsheet__header--sortable:hover {
  background: var(--nb-c-surface-hover, var(--nb-c-surface));
}
.nb-spreadsheet__header-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-spreadsheet__sort {
  margin-left: 0.25rem;
  font-size: 0.625rem;
  color: var(--nb-c-text-muted);
}

// Resize handle: absolutely anchored to the right edge of the header so it
// doesn't shift when neighbouring headers reflow. Hairline by default,
// 2px primary on hover, full height for an easy hit target.
.nb-spreadsheet__header {
  position: relative;
}
.nb-spreadsheet__resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
  &::after {
    content: '';
    position: absolute;
    top: 25%;
    right: 2px;
    width: 2px;
    height: 50%;
    background: transparent;
    transition: background 0.12s ease;
  }
  &:hover::after {
    background: var(--nb-c-primary, #6a40d0);
  }
}

// ─── Row gutter (left index column) ──────────────────────────────────────
.nb-spreadsheet__gutter {
  background: var(--nb-c-surface);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  color: var(--nb-c-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

// ─── Data cells ──────────────────────────────────────────────────────────
.nb-spreadsheet__cell {
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  padding: 0 var(--nbss-cell-padding-x);
  display: flex;
  align-items: center;
  background: var(--nb-c-surface-raised, var(--nb-c-surface));
  color: var(--nb-c-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: cell;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.08s linear;
}

.nb-spreadsheet__cell--left {
  justify-content: flex-start;
}
.nb-spreadsheet__cell--center {
  justify-content: center;
}
.nb-spreadsheet__cell--right {
  justify-content: flex-end;
}

.nb-spreadsheet__cell:hover {
  background: var(--nb-c-surface-hover, var(--nb-c-surface));
}

.nb-spreadsheet__cell--selected {
  background: var(
    --nb-c-primary-100,
    color-mix(
      in srgb,
      var(--nb-c-primary, #6a40d0) 12%,
      var(--nb-c-surface-raised, white)
    )
  );
}

// Active cell: inset 2px primary outline, no offset, no jump on focus.
.nb-spreadsheet__cell--focused {
  box-shadow: inset 0 0 0 2px var(--nbss-focus-ring);
  z-index: 2;
}

.nb-spreadsheet__cell--readonly {
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
}
.nb-spreadsheet__cell--computed {
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  font-weight: 600;
}
.nb-spreadsheet__cell--pinned-bottom {
  font-weight: 600;
}

// Subtle shadow on the right edge of the rightmost pinned-left column
// indicates "more content to the right" — same idea as Carbon's sticky cols.
.nb-spreadsheet__cell[style*='position: sticky'][style*='left']
  + .nb-spreadsheet__cell:not([style*='position: sticky']) {
  box-shadow: -4px 0 4px -4px rgba(0, 0, 0, 0.12);
}

.nb-spreadsheet__editor {
  position: absolute;
  z-index: 10;
  border: 2px solid var(--nbss-focus-ring);
  background: var(--nb-c-surface-raised, white);
  color: var(--nb-c-text);
  padding: 0 calc(var(--nbss-cell-padding-x) - 2px);
  font: inherit;
  font-variant-numeric: tabular-nums;
  outline: none;
}
</style>
