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
        <template v-for="row in renderRows" :key="`r-${row.id}`">
          <div
            v-if="showGutter"
            class="nb-spreadsheet__gutter"
            :class="{
              'nb-spreadsheet__gutter--pinned-top': row.pinned === 'top',
              'nb-spreadsheet__gutter--pinned-bottom': row.pinned === 'bottom',
            }"
            :style="gutterStyle(row)"
          >
            {{ gutterText(row) }}
          </div>
          <div
            v-for="(col, ci) in orderedColumns"
            :key="`c-${row.id}-${col.id}`"
            class="nb-spreadsheet__cell"
            :class="cellClass(row, col)"
            :style="cellStyle(row, col, ci)"
            :title="cellTitle(row, col)"
            :data-cell="`${row.id}::${col.id}`"
            :data-row="row.id"
            :data-col="col.id"
            @pointerdown="onCellPointerDown($event)"
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
        enterkeyhint="next"
        @blur="commitEdit(false)"
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
  gutterWidth: 44,
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
// `mode` follows the two editing states of a desktop spreadsheet. A cell
// opened by typing into it is in 'enter' mode, where the arrow keys commit
// and move on, so a column of numbers can be keyed in without reaching for
// the mouse. A cell opened with F2 or a double click is in 'edit' mode, where
// Left and Right move the caret inside the text instead.
const editing = ref<{
  rowId: string
  columnId: string
  draft: string
  mode: 'enter' | 'edit'
} | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
let lastPointerType = ''
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

// Defaults of --nbss-header-height and --nbss-row-height. Only the row
// virtualization estimates with them: scrolling measures the rendered cells.
const headerHeight = 36
const rowHeight = 32

const gridStyle = computed(() => {
  const cols =
    (props.showGutter ? `${props.gutterWidth}px ` : '') +
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
  let off = props.showGutter ? props.gutterWidth : 0
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

// The grid row comes from the row's place in the whole sheet, not its place
// in the rendered window, so rows above the window keep their height and a
// virtualized row lands where it belongs.
function cellStyle(row: IRenderRow, col: ISpreadsheetColumn, ci: number) {
  const baseCol = (props.showGutter ? 2 : 1) + ci
  const gridRow = row.__virtualIndex + 2
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
    Object.assign(sticky, pinnedRowOffset(row))
  }
  return { gridRow, gridColumn: baseCol, ...sticky }
}

// Rows pinned to the same edge stack instead of sharing one slot: each sits
// one row height further in than the one nearer the edge.
function pinnedRowOffset(row: ISpreadsheetRow): Record<string, string> {
  if (row.pinned === 'top') {
    const i = pinnedTopRows.value.findIndex((r) => r.id === row.id)
    return {
      top: `calc(var(--nbss-header-height) + var(--nbss-row-height) * ${Math.max(0, i)})`,
    }
  }
  if (row.pinned === 'bottom') {
    const rows = pinnedBottomRows.value
    const i = rows.findIndex((r) => r.id === row.id)
    return {
      bottom: `calc(var(--nbss-row-height) * ${Math.max(0, rows.length - 1 - i)})`,
    }
  }
  return {}
}

function gutterText(row: IRenderRow): string {
  if (row.label !== undefined) return row.label
  if (row.gutterLabel !== undefined) return row.gutterLabel
  return String(row.__virtualIndex - pinnedTopRows.value.length + 1)
}

function gutterStyle(row: IRenderRow) {
  const sticky: Record<string, string> = {
    position: 'sticky',
    left: '0',
    zIndex: '2',
  }
  if (row.pinned) {
    Object.assign(sticky, pinnedRowOffset(row))
    sticky.zIndex = '4'
  }
  return { gridRow: row.__virtualIndex + 2, gridColumn: 1, ...sticky }
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
function onCellPointerDown(e: PointerEvent) {
  lastPointerType = e.pointerType
}

function onCellMouseDown(
  e: MouseEvent,
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
) {
  // A tap on the cell that is already active opens it for editing. On a
  // touch screen there is no key to type into the cell, and the keyboard only
  // appears for a focused field.
  const tapOnActive =
    lastPointerType === 'touch' &&
    !e.shiftKey &&
    focused.value?.rowId === row.id &&
    focused.value?.columnId === col.id
  lastPointerType = ''
  if (editing.value) commitEdit()
  isSelecting.value = true
  setFocus(row.id, col.id, e.shiftKey)
  focusScroller()
  e.preventDefault()
  document.addEventListener('mouseup', stopSelecting, { once: true })
  if (tapOnActive && !isReadOnly(row, col)) {
    const raw = rawValue(row.id, col.id)
    startEdit(row, col, raw == null ? '' : String(raw), 'edit')
  }
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
  if (isReadOnly(row, col)) return
  const raw = rawValue(row.id, col.id)
  startEdit(row, col, raw == null ? '' : String(raw), 'edit')
}

// Focus never scrolls: the sheet decides what is in view, so moving focus
// between the scroller and the editor cannot throw the view back to the top.
function focusScroller() {
  scrollerRef.value?.focus({ preventScroll: true })
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
  const rowId = allRows[nri].id
  const columnId = orderedColumns.value[nci].id
  setFocus(rowId, columnId, extendSelection)
  scrollIntoView(rowId, columnId)
}

// Row and column ids are the host's, so they are quoted before going into an
// attribute selector. CSS.escape would do it too, but not every DOM has it.
function quoteAttr(value: string): string {
  return value.replace(/["\\]/g, '\\$&')
}

function measuredHeight(selector: string): number {
  const el = scrollerRef.value?.querySelector<HTMLElement>(selector)
  return el ? el.offsetHeight : 0
}

function stickyRowsHeight(rows: ISpreadsheetRow[]): number {
  let h = 0
  for (const r of rows) h += measuredHeight(`[data-row="${quoteAttr(r.id)}"]`)
  return h
}

function stickyColumnsWidth(side: 'left' | 'right'): number {
  let w = side === 'left' && props.showGutter ? props.gutterWidth : 0
  for (const c of orderedColumns.value) if (c.pinned === side) w += widthOf(c)
  return w
}

// Brings a cell into the part of the scroller that the sticky header, pinned
// rows and pinned columns leave uncovered, moving the view only as far as it
// has to. Pinned cells are always in view, so they never scroll.
function scrollIntoView(rowId: string, columnId?: string) {
  const view = scrollerRef.value
  if (!view) return
  const idx = sortedDataRows.value.findIndex((r) => r.id === rowId)
  if (idx >= 0) {
    // Every row has the same height (grid-auto-rows), so the row's top is
    // arithmetic once the rendered sizes are measured. That also holds for a
    // row the virtualization has not rendered yet.
    const headerH = measuredHeight('.nb-spreadsheet__header') || headerHeight
    const rowH = measuredHeight('.nb-spreadsheet__cell') || rowHeight
    const top = headerH + (pinnedTopRows.value.length + idx) * rowH
    const coverTop = headerH + stickyRowsHeight(pinnedTopRows.value)
    const coverBottom = stickyRowsHeight(pinnedBottomRows.value)
    if (top - coverTop < view.scrollTop) view.scrollTop = top - coverTop
    else if (top + rowH > view.scrollTop + view.clientHeight - coverBottom)
      view.scrollTop = top + rowH - view.clientHeight + coverBottom
  }
  const col = columnId
    ? orderedColumns.value.find((c) => c.id === columnId)
    : undefined
  if (col && !col.pinned) {
    let left = props.showGutter ? props.gutterWidth : 0
    for (const c of orderedColumns.value) {
      if (c.id === col.id) break
      left += widthOf(c)
    }
    const width = widthOf(col)
    const coverLeft = stickyColumnsWidth('left')
    const coverRight = stickyColumnsWidth('right')
    if (left - coverLeft < view.scrollLeft) view.scrollLeft = left - coverLeft
    else if (left + width > view.scrollLeft + view.clientWidth - coverRight)
      view.scrollLeft = left + width - view.clientWidth + coverRight
  }
  onScroll()
}

function onScroll() {
  scrollTop.value = scrollerRef.value?.scrollTop ?? 0
  scrollLeft.value = scrollerRef.value?.scrollLeft ?? 0
}

function focusedCell() {
  if (!focused.value) return null
  const r = props.rows.find((rr) => rr.id === focused.value!.rowId)
  const c = props.columns.find((cc) => cc.id === focused.value!.columnId)
  return r && c ? { r, c } : null
}

function isPrintable(e: KeyboardEvent): boolean {
  return !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1
}

function onKeydown(e: KeyboardEvent) {
  if (editing.value) {
    // Keys that arrive before the editor has taken focus belong to it, so a
    // fast typist loses nothing between the first key and the second.
    if (e.target !== editorRef.value) {
      if (isPrintable(e)) {
        e.preventDefault()
        editing.value.draft += e.key
      } else onEditorKeydown(e)
    }
    return
  }
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
      moveBy(e.shiftKey ? -1 : 1, 0)
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
    case 'F2': {
      e.preventDefault()
      const fc = focusedCell()
      if (fc && !isReadOnly(fc.r, fc.c)) {
        const raw = rawValue(fc.r.id, fc.c.id)
        startEdit(fc.r, fc.c, raw == null ? '' : String(raw), 'edit')
      }
      break
    }
    default: {
      if (!isPrintable(e)) break
      const fc = focusedCell()
      if (fc && !isReadOnly(fc.r, fc.c)) {
        e.preventDefault()
        startEdit(fc.r, fc.c, e.key, 'enter')
      }
    }
  }
}

// ─── Edit lifecycle ────────────────────────────────────────────────────────
function startEdit(
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
  draft: string,
  mode: 'enter' | 'edit',
) {
  scrollIntoView(row.id, col.id)
  editing.value = { rowId: row.id, columnId: col.id, draft, mode }
  void nextTick(() => {
    const input = editorRef.value
    if (!input) return
    input.focus({ preventScroll: true })
    // Typed into: the caret goes after what was typed, so the next key adds
    // to it. Opened with F2 or a double click: the whole value is selected.
    if (mode === 'enter') {
      const end = input.value.length
      input.setSelectionRange(end, end)
    } else input.select()
  })
}

const editorInputMode = computed(() => {
  if (!editing.value) return undefined
  const col = props.columns.find((c) => c.id === editing.value!.columnId)
  if (col?.type === 'number') return 'decimal'
  return 'text'
})

// The editor is positioned inside the scroller's content, so a cell's place
// on screen is turned into content coordinates by adding the scroll offset.
// Without it, a cell below the fold puts the editor near the top of the
// content, and focusing it scrolls the sheet back up.
const editorStyle = computed(() => {
  if (!editing.value) return { display: 'none' }
  const view = scrollerRef.value
  const cell = view?.querySelector<HTMLElement>(
    `[data-cell="${quoteAttr(`${editing.value.rowId}::${editing.value.columnId}`)}"]`,
  )
  if (!view || !cell) return { display: 'none' }
  const rect = cell.getBoundingClientRect()
  const scrollRect = view.getBoundingClientRect()
  return {
    top: `${rect.top - scrollRect.top - view.clientTop + scrollTop.value}px`,
    left: `${rect.left - scrollRect.left - view.clientLeft + scrollLeft.value}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

function onEditorKeydown(e: KeyboardEvent) {
  const mode = editing.value?.mode
  let move: [number, number] | null = null
  switch (e.key) {
    case 'Enter':
      move = [e.shiftKey ? -1 : 1, 0]
      break
    case 'Tab':
      move = [0, e.shiftKey ? -1 : 1]
      break
    case 'ArrowDown':
      move = [1, 0]
      break
    case 'ArrowUp':
      move = [-1, 0]
      break
    case 'ArrowLeft':
      if (mode === 'enter') move = [0, -1]
      break
    case 'ArrowRight':
      if (mode === 'enter') move = [0, 1]
      break
    case 'Escape':
      e.preventDefault()
      editing.value = null
      focusScroller()
      return
  }
  if (!move) return
  e.preventDefault()
  commitEdit()
  moveBy(move[0], move[1])
}

// `refocus` is off for a blur: the person has moved somewhere else on the
// page, and the sheet must not pull focus back from there.
function commitEdit(refocus = true) {
  if (!editing.value) return
  const { rowId, columnId, draft } = editing.value
  // Cleared first: focusing the scroller blurs the editor, and its blur
  // handler must find nothing left to commit.
  editing.value = null
  const col = props.columns.find((c) => c.id === columnId)
  if (!col) return
  let value: unknown
  try {
    value = col.parse ? col.parse(draft) : defaultParse(col, draft)
  } catch {
    if (refocus) focusScroller()
    return
  }
  const before = rawValue(rowId, columnId)
  if (before !== value) {
    const change: ISpreadsheetChange = { rowId, columnId, before, after: value }
    pushUndo([change])
    emit('commit', change)
    emit('change', [change])
  }
  if (refocus) focusScroller()
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
  focusScroller()
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
@use '../../styles/variables/breakpoints' as bp;

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

// The grid is as wide as its columns. A grid box only as wide as the
// scroller lets its columns overflow it, and a sticky cell cannot leave its
// parent's box, so the gutter and pinned-left columns would scroll away once
// the sheet scrolled further right than the scroller is wide.
.nb-spreadsheet__grid {
  display: grid;
  grid-auto-rows: var(--nbss-row-height);
  position: relative;
  width: max-content;
  min-width: 100%;
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
// 2px primary on hover, full height for an easy hit target. The header is
// sticky, which already anchors it: making it relative here would unstick it.
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
  padding: 0 0.375rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  user-select: none;
}

// A pinned row's header names it (a total, a reference row), and reads with
// the same weight as the row's cells.
.nb-spreadsheet__gutter--pinned-top,
.nb-spreadsheet__gutter--pinned-bottom {
  color: var(--nb-c-text);
  font-weight: 600;
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

// iOS zooms into any field whose text is under 16px.
@include bp.phone-touch {
  .nb-spreadsheet__editor {
    font-size: 16px;
  }
}
</style>
