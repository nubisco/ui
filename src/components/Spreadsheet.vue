<template>
  <div
    ref="rootRef"
    class="nb-spreadsheet"
    :class="[
      `nb-spreadsheet--${size}`,
      {
        'nb-spreadsheet--editing': !!editing,
        'nb-spreadsheet--fit': fit,
        'nb-spreadsheet--two-headers': headerRows.length === 2,
        'nb-spreadsheet--filling': !!fillTarget,
      },
    ]"
    :style="rootStyle"
  >
    <div v-if="$slots.toolbar" class="nb-spreadsheet__toolbar">
      <slot name="toolbar" />
    </div>

    <!-- The scroller is the grid a screen reader sees. It keeps the focus
         while the person moves around, and names the active cell through
         aria-activedescendant, so no cell is ever in the tab order. -->
    <div
      ref="scrollerRef"
      class="nb-spreadsheet__scroller"
      tabindex="0"
      role="grid"
      aria-multiselectable="true"
      :aria-label="ariaLabel"
      :aria-rowcount="allRows.length + 1"
      :aria-colcount="orderedColumns.length + (showGutter ? 1 : 0)"
      :aria-activedescendant="activeCellId"
      @keydown="onKeydown"
      @copy="onCopy"
      @cut="onCut"
      @paste="onPaste"
      @scroll="onScroll"
    >
      <!-- ── CSS-grid layout: rows = header + body, columns = gutter + cols ──
           Each row is a `display: contents` box, so it carries the row role
           without taking a place in the grid: its cells are the grid items. -->
      <div class="nb-spreadsheet__grid" :style="gridStyle">
        <!-- One header row, or two with `column-headers="both"`: the column
             letters above the labels. -->
        <div
          v-for="(kind, hi) in headerRows"
          :key="`hr-${kind}`"
          class="nb-spreadsheet__row"
          role="row"
          :aria-rowindex="hi + 1"
        >
          <!-- Header gutter cell: a click selects the whole sheet. It spans
               every header row. -->
          <div
            v-if="showGutter && hi === 0"
            class="nb-spreadsheet__corner"
            role="columnheader"
            aria-colindex="1"
            :style="{ gridRow: `1 / span ${headerRows.length}`, gridColumn: 1 }"
            @mousedown.prevent="onCornerMouseDown"
            @contextmenu="onContextMenu($event, 'cell')"
          />

          <!-- Header cells -->
          <div
            v-for="col in renderColumns"
            :key="`h-${kind}-${col.id}`"
            class="nb-spreadsheet__header"
            :class="headerClass(col, ciOf(col), kind)"
            role="columnheader"
            :aria-colindex="ciOf(col) + colOffset + 1"
            :aria-sort="kind === 'label' ? ariaSortFor(col) : undefined"
            :aria-label="
              kind === 'letters' &&
              headerRows.length === 1 &&
              col.label &&
              !sheetMode
                ? `${columnLetter(col.id)} ${col.label}`
                : undefined
            "
            :data-header-col="kind === 'label' ? col.id : undefined"
            :data-header-row="hi"
            :style="headerStyle(col, ciOf(col), hi)"
            @mousedown="onHeaderMouseDown($event, col, kind)"
            @contextmenu="onContextMenu($event, 'column', undefined, col.id)"
          >
            <span
              v-if="kind === 'letters'"
              class="nb-spreadsheet__header-letter"
              :title="
                headerRows.length === 1 && !sheetMode ? col.label : undefined
              "
              >{{ columnLetter(col.id) }}</span
            >
            <template v-else>
              <span
                class="nb-spreadsheet__header-label"
                :title="compactHeaders.has(col.id) ? col.label : undefined"
                >{{
                  compactHeaders.has(col.id) ? col.shortLabel : col.label
                }}</span
              >
              <NbIcon
                v-if="col.sortable"
                :name="sortIcon(col)"
                class="nb-spreadsheet__sort"
                aria-hidden="true"
              />
            </template>
            <!-- Hidden columns leave a mark on the edge they were on. It is
                 out of the tab order like every other part of the grid: the
                 context menu shows them from the keyboard. -->
            <template v-if="hi === headerRows.length - 1">
              <button
                v-if="hiddenColumnsBefore.has(col.id)"
                type="button"
                tabindex="-1"
                class="nb-spreadsheet__unhide nb-spreadsheet__unhide--col-start"
                :title="
                  strings.spreadsheetShowColumns(
                    hiddenColumnsBefore.get(col.id)!.length,
                  )
                "
                :aria-label="
                  strings.spreadsheetShowColumns(
                    hiddenColumnsBefore.get(col.id)!.length,
                  )
                "
                @mousedown.stop.prevent
                @click="showColumns(hiddenColumnsBefore.get(col.id)!)"
              />
              <button
                v-if="
                  ciOf(col) === orderedColumns.length - 1 &&
                  hiddenColumnsAfter.length
                "
                type="button"
                tabindex="-1"
                class="nb-spreadsheet__unhide nb-spreadsheet__unhide--col-end"
                :title="
                  strings.spreadsheetShowColumns(hiddenColumnsAfter.length)
                "
                :aria-label="
                  strings.spreadsheetShowColumns(hiddenColumnsAfter.length)
                "
                @mousedown.stop.prevent
                @click="showColumns(hiddenColumnsAfter)"
              />
            </template>
            <span
              v-if="resizable"
              class="nb-spreadsheet__resize-handle"
              @mousedown.stop="startResize($event, col)"
            />
          </div>
        </div>

        <!-- Row gutter + data cells -->
        <div
          v-for="row in renderRows"
          :key="`r-${row.id}`"
          class="nb-spreadsheet__row"
          role="row"
          :aria-rowindex="row.__virtualIndex + 1 + headerRows.length"
        >
          <div
            v-if="showGutter"
            class="nb-spreadsheet__gutter"
            :class="{
              'nb-spreadsheet__gutter--pinned-top': row.pinned === 'top',
              'nb-spreadsheet__gutter--pinned-bottom': row.pinned === 'bottom',
              'nb-spreadsheet__gutter--selected': isRowInSelection(row.id),
            }"
            role="rowheader"
            aria-colindex="1"
            :style="gutterStyle(row)"
            @mousedown.prevent="onGutterMouseDown($event, row)"
            @contextmenu="onContextMenu($event, 'row', row.id)"
          >
            {{ gutterText(row) }}
            <button
              v-if="hiddenRowsBefore.has(row.id)"
              type="button"
              tabindex="-1"
              class="nb-spreadsheet__unhide nb-spreadsheet__unhide--row-start"
              :title="
                strings.spreadsheetShowRows(
                  hiddenRowsBefore.get(row.id)!.length,
                )
              "
              :aria-label="
                strings.spreadsheetShowRows(
                  hiddenRowsBefore.get(row.id)!.length,
                )
              "
              @mousedown.stop.prevent
              @click="showRows(hiddenRowsBefore.get(row.id)!)"
            />
            <button
              v-if="row.id === lastDataRowId && hiddenRowsAfter.length"
              type="button"
              tabindex="-1"
              class="nb-spreadsheet__unhide nb-spreadsheet__unhide--row-end"
              :title="strings.spreadsheetShowRows(hiddenRowsAfter.length)"
              :aria-label="strings.spreadsheetShowRows(hiddenRowsAfter.length)"
              @mousedown.stop.prevent
              @click="showRows(hiddenRowsAfter)"
            />
          </div>
          <div
            v-for="col in renderColumns"
            :id="cellId(row.id, col.id)"
            :key="`c-${row.id}-${col.id}`"
            class="nb-spreadsheet__cell"
            :class="cellClass(row, col)"
            role="gridcell"
            :aria-colindex="ciOf(col) + colOffset + 1"
            :aria-selected="isCellInSelection(row.id, col.id)"
            :aria-readonly="isReadOnly(row, col) || undefined"
            :style="cellStyle(row, col, ciOf(col))"
            :title="cellTitle(row, col)"
            :data-cell="`${row.id}::${col.id}`"
            :data-row="row.id"
            :data-col="col.id"
            @pointerdown="onCellPointerDown($event)"
            @mousedown="onCellMouseDown($event, row, col)"
            @mouseenter="onCellMouseEnter(row, col)"
            @dblclick="onCellDblClick(row, col)"
            @contextmenu="onContextMenu($event, 'cell', row.id, col.id)"
          >
            <span>{{ cellDisplay(row, col) }}</span>
            <!-- The fill handle: a mouse affordance, with Ctrl+D and Ctrl+R
                 doing the same from the keyboard. -->
            <span
              v-if="isFillHandleCell(row.id, col.id)"
              class="nb-spreadsheet__fill-handle"
              aria-hidden="true"
              @mousedown.stop.prevent="startFill"
            />
          </div>
        </div>
      </div>

      <!-- Edit input overlay -->
      <input
        v-if="editing"
        ref="editorRef"
        v-model="editing.draft"
        class="nb-spreadsheet__editor"
        :style="editorStyle"
        :inputmode="editorInputMode"
        :aria-label="editorLabel"
        enterkeyhint="next"
        @blur="commitEdit(false)"
        @keydown.stop="onEditorKeydown"
      />
    </div>

    <!-- The context menu, with `context-menu`. It acts on the selection,
         which a right click moves to the cell, column or row under it unless
         that is already selected. -->
    <NbMenu v-if="contextMenu" ref="menuRef" v-model:open="menuOpen" size="sm">
      <NbMenuItem
        :label="strings.spreadsheetCut"
        :shortcut="`${modKey}X`"
        @select="menuCut"
      />
      <NbMenuItem
        :label="strings.spreadsheetCopy"
        :shortcut="`${modKey}C`"
        @select="menuCopy"
      />
      <NbMenuItem
        :label="strings.spreadsheetPaste"
        :shortcut="`${modKey}V`"
        :disabled="!canReadClipboard"
        :disabled-reason="strings.spreadsheetPasteWithKeys"
        @select="menuPaste"
      />
      <NbMenuItem
        :label="strings.spreadsheetClear"
        shortcut="Delete"
        @select="clearSelection"
      />
      <template v-if="menuSortColumn">
        <NbMenuDivider />
        <NbMenuItem
          :label="strings.spreadsheetSortAscending"
          @select="sortColumn(menuSortColumn, 'asc')"
        />
        <NbMenuItem
          :label="strings.spreadsheetSortDescending"
          @select="sortColumn(menuSortColumn, 'desc')"
        />
      </template>
      <NbMenuDivider />
      <template v-if="menuKind !== 'row'">
        <NbMenuItem
          :label="strings.spreadsheetHideColumns(selectedColumnIds.length)"
          :disabled="selectedColumnIds.length >= orderedColumns.length"
          :disabled-reason="strings.spreadsheetKeepOneColumn"
          @select="hideColumns(selectedColumnIds)"
        />
        <NbMenuItem
          v-if="effectiveHiddenColumns.length"
          :label="strings.spreadsheetShowColumns(effectiveHiddenColumns.length)"
          @select="showColumns(effectiveHiddenColumns)"
        />
      </template>
      <template v-if="menuKind !== 'column'">
        <NbMenuItem
          :label="strings.spreadsheetHideRows(selectedRowIds.length)"
          :disabled="selectedRowIds.length >= allRows.length"
          :disabled-reason="strings.spreadsheetKeepOneRow"
          @select="hideRows(selectedRowIds)"
        />
        <NbMenuItem
          v-if="effectiveHiddenRows.length"
          :label="strings.spreadsheetShowRows(effectiveHiddenRows.length)"
          @select="showRows(effectiveHiddenRows)"
        />
      </template>
    </NbMenu>
  </div>
</template>

<script setup lang="ts">
// The `computed` prop (ISpreadsheetProps.computed) intentionally shares a name
// with Vue's `computed`; the rule can't tell them apart in <script setup>.
import {
  // eslint-disable-next-line vue/no-dupe-keys
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import * as iconArrowsDownUp from '@nubisco/ui/icons/arrows-down-up'
import * as iconArrowUp from '@nubisco/ui/icons/arrow-up'
import * as iconArrowDown from '@nubisco/ui/icons/arrow-down'
import NbIcon from './Icon.vue'
import NbMenu from './Menu.vue'
import NbMenuItem from './MenuItem.vue'
import NbMenuDivider from './MenuDivider.vue'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { useStableId } from '@/composables/useStableId.composable'
import type {
  ISpreadsheetProps,
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetCellAttrs,
  ISpreadsheetChange,
  ISpreadsheetSelection,
  TSpreadsheetCells,
  TSpreadsheetColumnHeaders,
  TSpreadsheetSize,
  TSpreadsheetSortDir,
  TSpreadsheetValue,
} from './Spreadsheet.d'

const props = withDefaults(defineProps<ISpreadsheetProps>(), {
  columns: () => [],
  rows: () => [],
  resizable: true,
  rowReorderable: false,
  showGutter: true,
  gutterWidth: 44,
  windowRows: 80,
  locale: 'pt-PT',
  fit: false,
  size: 'sm',
  ariaLabel: undefined,
  columnHeaders: 'label',
  contextMenu: false,
  extent: 'data',
  fillHandle: undefined,
})

// The ids of the hidden columns and rows. Bind them to keep them, or leave
// them unbound and the sheet keeps them itself.
const hiddenColumns = defineModel<string[]>('hiddenColumns', {
  default: () => [],
})
const hiddenRows = defineModel<string[]>('hiddenRows', { default: () => [] })

// Sheet mode: bound, the cells are the data, keyed 'A1', and the sheet makes
// its own columns and rows over them. Left unbound, the sheet is in table
// mode and the host's `columns` and `rows` are the data.
const cells = defineModel<TSpreadsheetCells>('cells')

const emit = defineEmits<{
  commit: [change: ISpreadsheetChange]
  change: [changes: ISpreadsheetChange[]]
  selection: [sel: ISpreadsheetSelection | null]
  focus: [cell: { rowId: string; columnId: string } | null]
  'row-reorder': [{ rowId: string; toIndex: number }]
  'column-resize': [{ columnId: string; width: number }]
}>()

const strings = useNbStrings()

// ─── State ─────────────────────────────────────────────────────────────────
const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const scrollerRef = useTemplateRef<HTMLDivElement>('scrollerRef')
const editorRef = useTemplateRef<HTMLInputElement>('editorRef')
const columnWidths = ref<Record<string, number>>({})
const sortBy = ref<{ columnId: string; direction: TSpreadsheetSortDir } | null>(
  null,
)
const baseId = useStableId({})

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

// ─── Sheet mode ────────────────────────────────────────────────────────────
const sheetMode = computed(() => cells.value !== undefined)

// A CSS grid lays out at most 10,000 lines in some browsers, so a sheet that
// grows on its own stops short of that. 'infinite' grows by a block at a time
// as the person scrolls towards its end.
const SHEET_MAX_ROWS = 9_000
const SHEET_MAX_COLUMNS = 1_000
const GROW_ROWS = 100
const GROW_COLUMNS = 26

// 'A' is 0, 'Z' is 25, 'AA' is 26: the inverse of indexToLetters.
function lettersToIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

// The last filled row and column, as counts.
const dataBounds = computed(() => {
  let rows = 0
  let columns = 0
  for (const key of Object.keys(cells.value ?? {})) {
    const m = /^([A-Z]+)(\d+)$/.exec(key)
    if (!m) continue
    rows = Math.max(rows, Number(m[2]))
    columns = Math.max(columns, lettersToIndex(m[1]) + 1)
  }
  return { rows, columns }
})

const grownRows = ref(GROW_ROWS)
const grownColumns = ref(GROW_COLUMNS)

// The most a sheet can grow to by typing, pasting or filling.
const sheetLimit = computed(() => {
  const ext = props.extent
  if (typeof ext === 'object')
    return {
      rows: Math.min(SHEET_MAX_ROWS, ext.maxRows ?? SHEET_MAX_ROWS),
      columns: Math.min(SHEET_MAX_COLUMNS, ext.maxColumns ?? SHEET_MAX_COLUMNS),
    }
  return { rows: SHEET_MAX_ROWS, columns: SHEET_MAX_COLUMNS }
})

const sheetSize = computed(() => {
  const ext = props.extent
  const data = dataBounds.value
  const limit = sheetLimit.value
  let rows = data.rows
  let columns = data.columns
  if (ext === 'infinite') {
    rows = Math.max(rows, grownRows.value)
    columns = Math.max(columns, grownColumns.value)
  } else if (typeof ext === 'object') {
    rows = Math.max(rows, ext.minRows ?? 1)
    columns = Math.max(columns, ext.minColumns ?? 1)
  }
  return {
    rows: Math.max(1, Math.min(limit.rows, rows)),
    columns: Math.max(1, Math.min(limit.columns, columns)),
  }
})

const NO_VALUES: Record<string, unknown> = Object.freeze({}) as Record<
  string,
  unknown
>

// In sheet mode a column's id is its letter and a row's id is its number, so
// a cell's reference is the two side by side.
const sourceColumns = computed<ISpreadsheetColumn[]>(() => {
  if (!sheetMode.value) return props.columns
  return Array.from({ length: sheetSize.value.columns }, (_, i) => {
    const id = indexToLetters(i)
    return { id, label: id }
  })
})
const sourceRows = computed<ISpreadsheetRow[]>(() => {
  if (!sheetMode.value) return props.rows
  return Array.from({ length: sheetSize.value.rows }, (_, i) => ({
    id: String(i + 1),
    values: NO_VALUES,
  }))
})

function cellRef(rowId: string, columnId: string): string {
  return `${columnId}${rowId}`
}

// ─── Derived: column ordering with pinned-left first, pinned-right last ────
// Every column in the order the sheet lays them out, hidden ones included.
// A column's letter is its place here, so hiding C leaves A, B, D, as in a
// desktop spreadsheet.
const allOrderedColumns = computed<ISpreadsheetColumn[]>(() => {
  const left = sourceColumns.value.filter((c) => c.pinned === 'left')
  const right = sourceColumns.value.filter((c) => c.pinned === 'right')
  const mid = sourceColumns.value.filter((c) => !c.pinned)
  return [...left, ...mid, ...right]
})

const hiddenColumnSet = computed(() => new Set(hiddenColumns.value))
const hiddenRowSet = computed(() => new Set(hiddenRows.value))

// The columns the sheet shows. Selection, the clipboard and the keyboard all
// work on these, so a hidden column is skipped, never edited unseen.
const orderedColumns = computed<ISpreadsheetColumn[]>(() =>
  allOrderedColumns.value.filter((c) => !hiddenColumnSet.value.has(c.id)),
)

// Hidden ids the host passed that name no column or row are ignored.
const effectiveHiddenColumns = computed(() =>
  allOrderedColumns.value
    .filter((c) => hiddenColumnSet.value.has(c.id))
    .map((c) => c.id),
)
const effectiveHiddenRows = computed(() =>
  sourceRows.value.filter((r) => hiddenRowSet.value.has(r.id)).map((r) => r.id),
)

// ─── Column letters ────────────────────────────────────────────────────────
const columnLetters = computed(
  () =>
    new Map(
      allOrderedColumns.value.map((c, i) => [c.id, indexToLetters(i)] as const),
    ),
)

// 0 is A, 25 is Z, 26 is AA: bijective base 26, as spreadsheets count.
function indexToLetters(index: number): string {
  let n = index + 1
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}

function columnLetter(columnId: string): string {
  return columnLetters.value.get(columnId) ?? ''
}

const headerRows = computed<Array<'letters' | 'label'>>(() => {
  const mode: TSpreadsheetColumnHeaders = props.columnHeaders
  // A sheet-mode column has no name but its letter.
  if (sheetMode.value || mode === 'letters') return ['letters']
  if (mode === 'both') return ['letters', 'label']
  return ['label']
})

// Where hidden columns sit: before which shown column, or after the last.
// Each group gets one mark, which shows that group again.
const hiddenColumnsBefore = computed(() => {
  const out = new Map<string, string[]>()
  let pending: string[] = []
  for (const c of allOrderedColumns.value) {
    if (hiddenColumnSet.value.has(c.id)) pending.push(c.id)
    else if (pending.length) {
      out.set(c.id, pending)
      pending = []
    }
  }
  return out
})
const hiddenColumnsAfter = computed(() => {
  const out: string[] = []
  for (let i = allOrderedColumns.value.length - 1; i >= 0; i--) {
    const c = allOrderedColumns.value[i]
    if (!hiddenColumnSet.value.has(c.id)) break
    out.unshift(c.id)
  }
  return out
})

// The gutter is the first column a screen reader counts.
const colOffset = computed(() => (props.showGutter ? 1 : 0))

// Lookups by id. Every cell asks for its row, its column and its place in
// the selection on each render, so a linear search there grows with the
// square of the sheet.
const rowsById = computed(
  () => new Map(sourceRows.value.map((r) => [r.id, r] as const)),
)
const columnsById = computed(
  () => new Map(sourceColumns.value.map((c) => [c.id, c] as const)),
)
const colIndex = computed(
  () => new Map(orderedColumns.value.map((c, i) => [c.id, i] as const)),
)

function widthOf(col: ISpreadsheetColumn): number {
  return columnWidths.value[col.id] ?? col.width ?? 120
}

// Carbon's row heights. The header is as tall as a row, as Carbon's is. Only
// the row virtualization estimates with them: scrolling measures the cells.
const SIZE_PX: Record<TSpreadsheetSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
}
const defaultRowHeight = computed(() => SIZE_PX[props.size] ?? SIZE_PX.sm)
// The least a fitted row shrinks to. Below it the text crowds the borders.
const minFitRowHeight = 20

// ─── Fit: fill the parent ──────────────────────────────────────────────────
const { phoneTouch } = usePhoneLayout()
const fitRowHeight = ref<number | null>(null)
const rowHeight = computed(() => fitRowHeight.value ?? defaultRowHeight.value)

// The rows are measured against the root, whose height is the parent's and
// never its content's, so shrinking them cannot feed back into the space
// they are measured against. The scroller is only as tall as its rows, so
// the whole pixels the rounding leaves over fall outside the sheet instead
// of showing as an empty band under its last row.
function measureFit() {
  const root = rootRef.value
  const view = scrollerRef.value
  const count = allRows.value.length
  if (!props.fit || phoneTouch.value || !root || !view || !count) {
    fitRowHeight.value = null
    return
  }
  const toolbar = root.querySelector<HTMLElement>('.nb-spreadsheet__toolbar')
  // The scroller's borders, and a horizontal scrollbar when there is one.
  const chrome = view.offsetHeight - view.clientHeight
  const space = root.clientHeight - (toolbar?.offsetHeight ?? 0) - chrome
  const each = Math.floor((space - headHeight()) / count)
  fitRowHeight.value = Math.min(
    defaultRowHeight.value,
    Math.max(minFitRowHeight, each),
  )
}

let sizeObserver: ResizeObserver | null = null

const rootStyle = computed(() =>
  fitRowHeight.value === null
    ? undefined
    : { '--nbss-row-height': `${fitRowHeight.value}px` },
)

// A fitted column is at least its width and takes an equal share of what is
// left. Pinned columns keep their width, so the sticky offsets stay exact.
const gridStyle = computed(() => {
  const cols =
    (props.showGutter ? `${props.gutterWidth}px ` : '') +
    orderedColumns.value
      .map((c) =>
        props.fit && !c.pinned
          ? `minmax(${widthOf(c)}px, 1fr)`
          : `${widthOf(c)}px`,
      )
      .join(' ')
  // The first track is the header's own height. Left to the auto rows, it
  // was a row tall and the header covered the top of the first row. Every
  // row then has a track of its own, so the grid is its full height while
  // the virtualization renders only the rows in view.
  const head =
    headerRows.value.length === 2
      ? 'var(--nbss-letter-height) var(--nbss-header-height)'
      : 'var(--nbss-header-height)'
  return {
    gridTemplateColumns: cols,
    gridTemplateRows: `${head} repeat(${Math.max(1, allRows.value.length)}, var(--nbss-row-height))`,
  }
})

// ─── Column window ─────────────────────────────────────────────────────────
// A wide sheet renders the columns in view, a screen either side, and the
// pinned ones. Every column keeps its track, so the grid is its full width.
// A fitted sheet shares out the width, so it renders every column.
const COLUMN_WINDOW_FROM = 50

const renderColumns = computed<ISpreadsheetColumn[]>(() => {
  const cols = orderedColumns.value
  if (props.fit || cols.length <= COLUMN_WINDOW_FROM) return cols
  const view = scrollerRef.value?.clientWidth || 1200
  const from = scrollLeft.value - view
  const to = scrollLeft.value + view * 2
  let x = props.showGutter ? props.gutterWidth : 0
  const out: ISpreadsheetColumn[] = []
  for (const c of cols) {
    const w = widthOf(c)
    if (c.pinned || (x + w >= from && x <= to)) out.push(c)
    x += w
  }
  return out
})

function ciOf(col: ISpreadsheetColumn): number {
  return colIndex.value.get(col.id) ?? 0
}

// ─── Short header labels ───────────────────────────────────────────────────
// While any `label` does not fit its column, every column with a `shortLabel`
// shows it, so a header row never mixes "January" with "Feb". A label's
// natural width is measured while it is the one rendered, so the choice does
// not flip back and forth as the short one takes its place.
const compactHeaders = ref<Set<string>>(new Set())
const fullLabelWidths = new Map<string, number>()

function measureHeaders() {
  const view = scrollerRef.value
  if (!view) return
  const shortened: string[] = []
  let tooNarrow = false
  let unmeasured = false
  for (const col of sourceColumns.value) {
    if (!col.shortLabel) continue
    const el = view.querySelector<HTMLElement>(
      `[data-header-col="${quoteAttr(col.id)}"] .nb-spreadsheet__header-label`,
    )
    if (!el) continue
    const key = `${col.id}::${col.label}`
    if (!compactHeaders.value.has(col.id)) {
      fullLabelWidths.set(key, el.scrollWidth)
    }
    const natural = fullLabelWidths.get(key)
    if (natural === undefined) {
      // The label changed while the short one showed: show it to measure it.
      unmeasured = true
      continue
    }
    shortened.push(col.id)
    if (natural > el.clientWidth) tooNarrow = true
  }
  compactHeaders.value = new Set(tooNarrow ? shortened : [])
  if (unmeasured) void nextTick(measureHeaders)
}

watch(
  () => [props.columns, columnWidths.value],
  () => void nextTick(measureHeaders),
  { deep: true },
)

// ─── Sorted + windowed rows ────────────────────────────────────────────────
// Every unpinned row in sorted order, hidden ones included. A row's number
// is its place here, so hiding row 3 leaves 1, 2, 4.
const sortedAllDataRows = computed(() => {
  const data = sourceRows.value.filter((r) => !r.pinned)
  if (!sortBy.value) return data
  const col = columnsById.value.get(sortBy.value.columnId)
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

const rowNumbers = computed(
  () => new Map(sortedAllDataRows.value.map((r, i) => [r.id, i + 1] as const)),
)

const isShown = (r: ISpreadsheetRow) => !hiddenRowSet.value.has(r.id)
const sortedDataRows = computed(() => sortedAllDataRows.value.filter(isShown))
const pinnedTopRows = computed(() =>
  sourceRows.value.filter((r) => r.pinned === 'top' && isShown(r)),
)
const pinnedBottomRows = computed(() =>
  sourceRows.value.filter((r) => r.pinned === 'bottom' && isShown(r)),
)

// Where hidden data rows sit, as for columns. A hidden pinned row has no
// edge to mark, and comes back from the context menu.
const hiddenRowsBefore = computed(() => {
  const out = new Map<string, string[]>()
  let pending: string[] = []
  for (const r of sortedAllDataRows.value) {
    if (!isShown(r)) pending.push(r.id)
    else if (pending.length) {
      out.set(r.id, pending)
      pending = []
    }
  }
  return out
})
const hiddenRowsAfter = computed(() => {
  const out: string[] = []
  const rows = sortedAllDataRows.value
  for (let i = rows.length - 1; i >= 0; i--) {
    if (isShown(rows[i])) break
    out.unshift(rows[i].id)
  }
  return out
})
const lastDataRowId = computed(
  () => sortedDataRows.value[sortedDataRows.value.length - 1]?.id,
)

// Every row in the order the sheet shows it, and each row's place in it.
const allRows = computed(() => [
  ...pinnedTopRows.value,
  ...sortedDataRows.value,
  ...pinnedBottomRows.value,
])
const rowIndex = computed(
  () => new Map(allRows.value.map((r, i) => [r.id, i] as const)),
)

interface IRenderRow extends ISpreadsheetRow {
  __virtualIndex: number
  gutterLabel?: string
}

const renderRows = computed<IRenderRow[]>(() => {
  // Lightweight virtualization for the unpinned section.
  const visibleCount = Math.max(
    1,
    Math.ceil((scrollerRef.value?.clientHeight ?? 600) / rowHeight.value),
  )
  const buffer = Math.max(10, Math.floor(props.windowRows / 4))
  const startRaw =
    Math.floor(scrollTop.value / rowHeight.value) -
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

// A sheet-mode cell takes what is typed as a number when it reads as one,
// in the sheet's locale or with a point, and as text otherwise.
const decimalSeparator = computed(
  () =>
    new Intl.NumberFormat(props.locale)
      .formatToParts(1.5)
      .find((p) => p.type === 'decimal')?.value ?? '.',
)

function parseSheetInput(input: string): TSpreadsheetValue {
  const text = input.trim()
  if (text === '') return null
  if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text)) return Number(text)
  if (decimalSeparator.value === ',' && /^[-+]?(\d+,?\d*|,\d+)$/.test(text))
    return Number(text.replace(',', '.'))
  return input
}

function formatSheetValue(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'number')
    return new Intl.NumberFormat(props.locale, {
      maximumFractionDigits: 10,
    }).format(raw)
  if (typeof raw === 'boolean') return raw ? 'TRUE' : 'FALSE'
  return String(raw)
}

function parseInput(col: ISpreadsheetColumn, input: string): unknown {
  if (col.parse) return col.parse(input)
  if (sheetMode.value) return parseSheetInput(input)
  return defaultParse(col, input)
}

function rawValue(rowId: string, columnId: string): unknown {
  if (sheetMode.value) {
    const v = cells.value?.[cellRef(rowId, columnId)]
    if (v !== undefined) return v
    if (props.computed) return props.computed(rowId, columnId, rawValue)
    return undefined
  }
  const row = rowsById.value.get(rowId)
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
  if (col.format) return col.format(raw, row)
  return sheetMode.value ? formatSheetValue(raw) : defaultFormat(col, raw)
}

function cellClass(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  const attrs = cellAttrsFor(row, col)
  const isFocused =
    focused.value?.rowId === row.id && focused.value?.columnId === col.id
  const isInSelection = isCellInSelection(row.id, col.id)
  const alignClass =
    col.align ??
    (sheetMode.value
      ? typeof rawValue(row.id, col.id) === 'number'
        ? 'right'
        : 'left'
      : col.type === 'number' || col.type === 'date'
        ? 'right'
        : 'left')
  return {
    [`nb-spreadsheet__cell--${alignClass}`]: true,
    'nb-spreadsheet__cell--focused': isFocused,
    'nb-spreadsheet__cell--selected': isInSelection,
    'nb-spreadsheet__cell--readonly': isReadOnly(row, col),
    'nb-spreadsheet__cell--computed': !!attrs.computed || !!row.computed,
    'nb-spreadsheet__cell--pinned-top': row.pinned === 'top',
    'nb-spreadsheet__cell--pinned-bottom': row.pinned === 'bottom',
    'nb-spreadsheet__cell--fill': isCellInFill(row.id, col.id),
    'nb-spreadsheet__cell--fill-anchor': isFillHandleCell(row.id, col.id),
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

// Ids go into an attribute, so they are positions, not the host's own ids,
// which may hold anything.
function cellId(rowId: string, columnId: string): string {
  return `${baseId}-r${rowIndex.value.get(rowId)}-c${colIndex.value.get(columnId)}`
}

const activeCellId = computed(() =>
  focused.value
    ? cellId(focused.value.rowId, focused.value.columnId)
    : undefined,
)

function headerClass(
  col: ISpreadsheetColumn,
  ci: number,
  kind: 'letters' | 'label',
) {
  const bounds = selectionBounds.value
  return {
    'nb-spreadsheet__header--letters': kind === 'letters',
    'nb-spreadsheet__header--stacked': headerRows.value.length === 2,
    'nb-spreadsheet__header--sortable': kind === 'label' && !!col.sortable,
    'nb-spreadsheet__header--sorted': sortBy.value?.columnId === col.id,
    'nb-spreadsheet__header--selected':
      !!bounds && ci >= bounds.c1 && ci <= bounds.c2,
    'nb-spreadsheet__header--pinned-left': col.pinned === 'left',
    'nb-spreadsheet__header--pinned-right': col.pinned === 'right',
    'nb-spreadsheet__header--last': ci === orderedColumns.value.length - 1,
  }
}

function ariaSortFor(col: ISpreadsheetColumn) {
  if (!col.sortable) return undefined
  if (sortBy.value?.columnId !== col.id) return 'none'
  return sortBy.value.direction === 'asc' ? 'ascending' : 'descending'
}

// Carbon's three states: the unsorted arrows show on hover only, and the
// sorted column keeps its arrow.
function sortIcon(col: ISpreadsheetColumn) {
  if (sortBy.value?.columnId !== col.id) return iconArrowsDownUp
  return sortBy.value.direction === 'asc' ? iconArrowUp : iconArrowDown
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

// The letters row sticks to the top, and the labels under it.
function headerStyle(col: ISpreadsheetColumn, ci: number, hi: number) {
  const baseCol = colOffset.value + 1 + ci
  const sticky: Record<string, string> = {
    top: hi === 0 ? '0' : 'var(--nbss-letter-height)',
  }
  if (col.pinned === 'left') {
    sticky.position = 'sticky'
    sticky.left = `${pinnedLeftOffset(col)}px`
    sticky.zIndex = '3'
  } else if (col.pinned === 'right') {
    sticky.position = 'sticky'
    sticky.right = `${pinnedRightOffset(col)}px`
    sticky.zIndex = '3'
  }
  return { gridRow: hi + 1, gridColumn: baseCol, ...sticky }
}

// The grid row comes from the row's place in the whole sheet, not its place
// in the rendered window, so rows above the window keep their height and a
// virtualized row lands where it belongs.
function cellStyle(row: IRenderRow, col: ISpreadsheetColumn, ci: number) {
  const baseCol = colOffset.value + 1 + ci
  const gridRow = row.__virtualIndex + 1 + headerRows.value.length
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
      top: `calc(var(--nbss-head-height) + var(--nbss-row-height) * ${Math.max(0, i)})`,
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
  return String(rowNumbers.value.get(row.id) ?? '')
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
  return {
    gridRow: row.__virtualIndex + 1 + headerRows.value.length,
    gridColumn: 1,
    ...sticky,
  }
}

// ─── Selection helpers ─────────────────────────────────────────────────────
// The selection as row and column positions, worked out once per change
// rather than once per cell.
const selectionBounds = computed(() => {
  const sel = selection.value
  if (!sel) return null
  const r1 = rowIndex.value.get(sel.startRowId) ?? -1
  const r2 = rowIndex.value.get(sel.endRowId) ?? -1
  const c1 = colIndex.value.get(sel.startColumnId) ?? -1
  const c2 = colIndex.value.get(sel.endColumnId) ?? -1
  if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return null
  return {
    r1: Math.min(r1, r2),
    r2: Math.max(r1, r2),
    c1: Math.min(c1, c2),
    c2: Math.max(c1, c2),
  }
})

function isCellInSelection(rowId: string, columnId: string): boolean {
  const b = selectionBounds.value
  if (!b) return false
  const ri = rowIndex.value.get(rowId) ?? -1
  const ci = colIndex.value.get(columnId) ?? -1
  return ri >= b.r1 && ri <= b.r2 && ci >= b.c1 && ci <= b.c2
}

function isRowInSelection(rowId: string): boolean {
  const b = selectionBounds.value
  if (!b) return false
  const ri = rowIndex.value.get(rowId) ?? -1
  return ri >= b.r1 && ri <= b.r2
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

// Selects whole rows and columns, as a spreadsheet's headers do. The active
// cell is the first cell of the range's anchor, and Shift grows the range
// from the anchor already there.
function selectRange(
  anchorRowId: string,
  anchorColumnId: string,
  start: ISpreadsheetSelection,
) {
  focused.value = { rowId: anchorRowId, columnId: anchorColumnId }
  selection.value = start
  emit('focus', focused.value)
  emit('selection', selection.value)
}

function selectColumns(columnId: string, extend = false) {
  const rows = allRows.value
  if (!rows.length) return
  const anchor =
    extend && selection.value ? selection.value.startColumnId : columnId
  selectRange(rows[0].id, anchor, {
    startRowId: rows[0].id,
    startColumnId: anchor,
    endRowId: rows[rows.length - 1].id,
    endColumnId: columnId,
  })
}

function selectRows(rowId: string, extend = false) {
  const cols = orderedColumns.value
  if (!cols.length) return
  const anchor = extend && selection.value ? selection.value.startRowId : rowId
  selectRange(anchor, cols[0].id, {
    startRowId: anchor,
    startColumnId: cols[0].id,
    endRowId: rowId,
    endColumnId: cols[cols.length - 1].id,
  })
}

function selectAll() {
  const rows = allRows.value
  const cols = orderedColumns.value
  if (!rows.length || !cols.length) return
  selectRange(rows[0].id, cols[0].id, {
    startRowId: rows[0].id,
    startColumnId: cols[0].id,
    endRowId: rows[rows.length - 1].id,
    endColumnId: cols[cols.length - 1].id,
  })
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
  // A right click is for the context menu, which works on the selection it
  // lands in, so it never starts a drag or moves a selection it is inside.
  if (e.button === 2) {
    lastPointerType = ''
    return
  }
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
  if (fillTarget.value) {
    onFillEnter(row.id, col.id)
    return
  }
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

// A sortable column's header sorts, as it always has. Any other header
// selects its column, and the gutter selects its row.
function onHeaderMouseDown(
  e: MouseEvent,
  col: ISpreadsheetColumn,
  kind: 'letters' | 'label' = 'label',
) {
  if (e.button !== 0) return
  e.preventDefault()
  if (editing.value) commitEdit()
  focusScroller()
  // A letter always selects: with two header rows, the labels sort and the
  // letters above them select.
  if (col.sortable && (kind === 'label' || headerRows.value.length === 1))
    toggleSort(col)
  else selectColumns(col.id, e.shiftKey)
}

function onGutterMouseDown(e: MouseEvent, row: ISpreadsheetRow) {
  if (e.button !== 0) return
  if (editing.value) commitEdit()
  focusScroller()
  selectRows(row.id, e.shiftKey)
}

function onCornerMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  if (editing.value) commitEdit()
  focusScroller()
  selectAll()
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
  const rows = allRows.value
  const ri = rowIndex.value.get(focused.value.rowId) ?? 0
  const ci = colIndex.value.get(focused.value.columnId) ?? 0
  const nri = Math.max(0, Math.min(rows.length - 1, ri + dRow))
  const nci = Math.max(0, Math.min(orderedColumns.value.length - 1, ci + dCol))
  const rowId = rows[nri].id
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

// Every header row, measured, or estimated before the first render.
function headHeight(): number {
  let h = 0
  headerRows.value.forEach((kind, hi) => {
    h +=
      measuredHeight(`[data-header-row="${hi}"]`) ||
      (kind === 'letters' && hi === 0 && headerRows.value.length === 2
        ? 24
        : defaultRowHeight.value)
  })
  return h
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
    const headerH = headHeight()
    const rowH = measuredHeight('.nb-spreadsheet__cell') || rowHeight.value
    const top = headerH + (pinnedTopRows.value.length + idx) * rowH
    const coverTop = headerH + stickyRowsHeight(pinnedTopRows.value)
    const coverBottom = stickyRowsHeight(pinnedBottomRows.value)
    if (top - coverTop < view.scrollTop) view.scrollTop = top - coverTop
    else if (top + rowH > view.scrollTop + view.clientHeight - coverBottom)
      view.scrollTop = top + rowH - view.clientHeight + coverBottom
  }
  const col = columnId ? columnsById.value.get(columnId) : undefined
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
  const view = scrollerRef.value
  scrollTop.value = view?.scrollTop ?? 0
  scrollLeft.value = view?.scrollLeft ?? 0
  if (view) growNearEnd(view)
}

// An infinite sheet adds a block of rows or columns once the view comes
// within a screen of its end.
function growNearEnd(view: HTMLElement) {
  if (!sheetMode.value || props.extent !== 'infinite') return
  const { rows, columns } = sheetSize.value
  if (
    view.clientHeight > 0 &&
    view.scrollTop + view.clientHeight * 2 >= view.scrollHeight &&
    rows < SHEET_MAX_ROWS
  )
    grownRows.value = Math.min(SHEET_MAX_ROWS, rows + GROW_ROWS)
  if (
    view.clientWidth > 0 &&
    view.scrollLeft + view.clientWidth * 2 >= view.scrollWidth &&
    columns < SHEET_MAX_COLUMNS
  )
    grownColumns.value = Math.min(SHEET_MAX_COLUMNS, columns + GROW_COLUMNS)
}

function focusedCell() {
  if (!focused.value) return null
  const r = rowsById.value.get(focused.value.rowId)
  const c = columnsById.value.get(focused.value.columnId)
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
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
    return
  }
  if (mod && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    selectAll()
    return
  }
  if (
    mod &&
    fillEnabled.value &&
    !e.shiftKey &&
    !e.altKey &&
    (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'r')
  ) {
    e.preventDefault()
    fillFromEdge(e.key.toLowerCase() === 'd' ? 'down' : 'right')
    return
  }
  // The spreadsheet keys for a whole column and a whole row. Shift+Space has
  // to be caught here: it is printable, and would otherwise open the cell.
  if (e.key === ' ' && (e.ctrlKey || e.shiftKey) && !e.metaKey && !e.altKey) {
    const fc = focused.value
    if (!fc) return
    e.preventDefault()
    if (e.ctrlKey) selectColumns(fc.columnId)
    else selectRows(fc.rowId)
    return
  }
  // Alt+Shift+Left and Right narrow and widen the active column, a step of
  // the 8px grid at a time: the keyboard's way to the resize handle.
  if (
    e.altKey &&
    e.shiftKey &&
    !mod &&
    (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
  ) {
    const col = focused.value
      ? columnsById.value.get(focused.value.columnId)
      : undefined
    if (!props.resizable || !col) return
    e.preventDefault()
    const step = e.key === 'ArrowRight' ? RESIZE_STEP : -RESIZE_STEP
    resizeColumn(col, widthOf(col) + step)
    return
  }
  if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
    if (!props.contextMenu || !focused.value) return
    e.preventDefault()
    openMenuAtActiveCell()
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
  const col = columnsById.value.get(editing.value.columnId)
  if (col?.type === 'number') return 'decimal'
  return 'text'
})

// The editor sits outside the rows, so it names the cell it edits: the
// column's label and the row's, as the headers show them.
const editorLabel = computed(() => {
  if (!editing.value) return undefined
  if (sheetMode.value)
    return cellRef(editing.value.rowId, editing.value.columnId)
  const col = columnsById.value.get(editing.value.columnId)
  const row = rowsById.value.get(editing.value.rowId)
  const rowName =
    row?.label ?? String(rowNumbers.value.get(row?.id ?? '') ?? '')
  return [col?.label, rowName].filter(Boolean).join(' ')
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
  const col = columnsById.value.get(columnId)
  if (!col) return
  let value: unknown
  try {
    value = parseInput(col, draft)
  } catch {
    if (refocus) focusScroller()
    return
  }
  const before = rawValue(rowId, columnId)
  if (!sameValue(before, value)) {
    const change = makeChange(rowId, columnId, before, value)
    pushUndo([change])
    applyChanges([change])
  }
  if (refocus) focusScroller()
}

// An empty cell reads as undefined in sheet mode and is written as null, so
// the two are the same value.
function sameValue(a: unknown, b: unknown): boolean {
  return a === b || ((a === undefined || a === null) && b === null)
}

function makeChange(
  rowId: string,
  columnId: string,
  before: unknown,
  after: unknown,
): ISpreadsheetChange {
  const change: ISpreadsheetChange = { rowId, columnId, before, after }
  if (sheetMode.value) change.cell = cellRef(rowId, columnId)
  return change
}

// The host applies a table-mode change. A sheet-mode change is written into
// the cells here, and the host hears about it the same way.
function applyChanges(changes: ISpreadsheetChange[]) {
  if (sheetMode.value) {
    const next: TSpreadsheetCells = { ...cells.value }
    for (const ch of changes) {
      const key = cellRef(ch.rowId, ch.columnId)
      if (ch.after === null || ch.after === undefined || ch.after === '')
        delete next[key]
      else next[key] = ch.after as TSpreadsheetValue
    }
    cells.value = next
  }
  for (const ch of changes) emit('commit', ch)
  emit('change', changes)
}

// ─── Bulk clear / clipboard ────────────────────────────────────────────────
function selectedCells(): Array<{ rowId: string; columnId: string }> {
  const b = selectionBounds.value
  if (!b) return []
  const rows = allRows.value
  const cols = orderedColumns.value
  const out: Array<{ rowId: string; columnId: string }> = []
  for (let r = b.r1; r <= b.r2; r++) {
    for (let c = b.c1; c <= b.c2; c++) {
      out.push({ rowId: rows[r].id, columnId: cols[c].id })
    }
  }
  return out
}

function clearSelection() {
  const cells = selectedCells()
  const changes: ISpreadsheetChange[] = []
  for (const { rowId, columnId } of cells) {
    const row = rowsById.value.get(rowId)
    const col = columnsById.value.get(columnId)
    if (!row || !col || isReadOnly(row, col)) continue
    const before = rawValue(rowId, columnId)
    if (before === null || before === undefined || before === '') continue
    changes.push(makeChange(rowId, columnId, before, null))
  }
  if (changes.length === 0) return
  pushUndo(changes)
  applyChanges(changes)
}

// The selection as tab-separated values, the format other spreadsheets
// read and write.
function selectionText(): string | null {
  const b = selectionBounds.value
  if (!b) return null
  const allRowIds = allRows.value.map((r) => r.id)
  const cols = orderedColumns.value.map((c) => c.id)
  const rows: string[] = []
  for (let r = b.r1; r <= b.r2; r++) {
    const parts: string[] = []
    for (let c = b.c1; c <= b.c2; c++) {
      const raw = rawValue(allRowIds[r], cols[c])
      parts.push(raw == null ? '' : String(raw))
    }
    rows.push(parts.join('\t'))
  }
  return rows.join('\n')
}

function onCopy(e: ClipboardEvent) {
  const text = selectionText()
  if (text === null) return
  e.preventDefault()
  e.clipboardData?.setData('text/plain', text)
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
  pasteText(text)
}

function pasteText(text: string) {
  if (!focused.value || !text) return
  const matrix = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.split('\t'))
  const width = Math.max(...matrix.map((line) => line.length))
  const allRowIds = growRowIds(
    allRows.value.map((r) => r.id),
    (rowIndex.value.get(focused.value.rowId) ?? 0) + matrix.length,
  )
  const cols = growColumnIds(
    orderedColumns.value.map((c) => c.id),
    (colIndex.value.get(focused.value.columnId) ?? 0) + width,
  )
  const baseR = rowIndex.value.get(focused.value.rowId) ?? 0
  const baseC = colIndex.value.get(focused.value.columnId) ?? 0
  const changes: ISpreadsheetChange[] = []
  matrix.forEach((line, dr) => {
    line.forEach((cellText, dc) => {
      const rowId = allRowIds[baseR + dr]
      const columnId = cols[baseC + dc]
      if (!rowId || !columnId) return
      // A row or column the paste grows the sheet into has no entry yet.
      const row = rowsById.value.get(rowId) ?? { id: rowId, values: NO_VALUES }
      const col = columnsById.value.get(columnId) ?? {
        id: columnId,
        label: columnId,
      }
      if (isReadOnly(row, col)) return
      let value: unknown
      try {
        value = parseInput(col, cellText)
      } catch {
        return
      }
      const before = rawValue(rowId, columnId)
      if (sameValue(before, value)) return
      changes.push(makeChange(rowId, columnId, before, value))
    })
  })
  if (changes.length === 0) return
  pushUndo(changes)
  applyChanges(changes)
}

// A paste past the end of a sheet-mode sheet grows it, up to its limit, as
// a desktop spreadsheet does. A table-mode sheet ends where its rows do.
function growRowIds(ids: string[], needed: number): string[] {
  if (!sheetMode.value || needed <= ids.length) return ids
  const out = [...ids]
  const rows = sortedAllDataRows.value
  let next = Number(rows[rows.length - 1]?.id ?? 0) + 1
  while (out.length < needed && next <= sheetLimit.value.rows)
    out.push(String(next++))
  return out
}

function growColumnIds(ids: string[], needed: number): string[] {
  if (!sheetMode.value || needed <= ids.length) return ids
  const out = [...ids]
  let next = allOrderedColumns.value.length
  while (out.length < needed && next < sheetLimit.value.columns)
    out.push(indexToLetters(next++))
  return out
}

// ─── Fill ──────────────────────────────────────────────────────────────────
// The fill handle sits on the selection's last cell. Dragging it down, up or
// sideways fills the cells it passes: numbers that step evenly carry the
// series on, and anything else repeats. Ctrl+D and Ctrl+R copy the first row
// or column of the selection over the rest, for the keyboard.
const fillEnabled = computed(() => props.fillHandle ?? sheetMode.value)

interface IBounds {
  r1: number
  r2: number
  c1: number
  c2: number
}
const fillTarget = ref<IBounds | null>(null)

function isFillHandleCell(rowId: string, columnId: string): boolean {
  const b = selectionBounds.value
  if (!fillEnabled.value || !b || editing.value) return false
  return (
    rowIndex.value.get(rowId) === b.r2 && colIndex.value.get(columnId) === b.c2
  )
}

function isCellInFill(rowId: string, columnId: string): boolean {
  const t = fillTarget.value
  if (!t) return false
  const ri = rowIndex.value.get(rowId) ?? -1
  const ci = colIndex.value.get(columnId) ?? -1
  return (
    ri >= t.r1 &&
    ri <= t.r2 &&
    ci >= t.c1 &&
    ci <= t.c2 &&
    !isCellInSelection(rowId, columnId)
  )
}

function startFill(e: MouseEvent) {
  if (e.button !== 0) return
  fillTarget.value = selectionBounds.value ? { ...selectionBounds.value } : null
  document.addEventListener('mouseup', endFill, { once: true })
}

// The fill grows along one axis only: the one the pointer has moved further
// past the selection on.
function onFillEnter(rowId: string, columnId: string) {
  const b = selectionBounds.value
  if (!b || !fillTarget.value) return
  const ri = rowIndex.value.get(rowId) ?? -1
  const ci = colIndex.value.get(columnId) ?? -1
  const dr = ri > b.r2 ? ri - b.r2 : ri < b.r1 ? ri - b.r1 : 0
  const dc = ci > b.c2 ? ci - b.c2 : ci < b.c1 ? ci - b.c1 : 0
  if (Math.abs(dr) >= Math.abs(dc))
    fillTarget.value = {
      ...b,
      r1: Math.min(b.r1, b.r1 + dr),
      r2: Math.max(b.r2, b.r2 + dr),
    }
  else
    fillTarget.value = {
      ...b,
      c1: Math.min(b.c1, b.c1 + dc),
      c2: Math.max(b.c2, b.c2 + dc),
    }
}

function endFill() {
  const b = selectionBounds.value
  const t = fillTarget.value
  fillTarget.value = null
  if (!b || !t) return
  fillRange(b, t)
  const rows = allRows.value
  const cols = orderedColumns.value
  selection.value = {
    startRowId: rows[t.r1].id,
    startColumnId: cols[t.c1].id,
    endRowId: rows[t.r2].id,
    endColumnId: cols[t.c2].id,
  }
  emit('selection', selection.value)
}

// The values that follow `source` for `count` cells. Two or more numbers
// with the same step between them carry on the series, either way.
function seriesValues(
  source: unknown[],
  count: number,
  backward: boolean,
): unknown[] {
  const k = source.length
  const numeric =
    k >= 2 && source.every((v) => typeof v === 'number' && Number.isFinite(v))
  const nums = source as number[]
  const step = numeric ? (nums[k - 1] - nums[0]) / (k - 1) : 0
  const even =
    numeric && nums.every((v, i) => Math.abs(v - (nums[0] + step * i)) < 1e-9)
  return Array.from({ length: count }, (_, i) => {
    if (even) {
      const v = backward
        ? nums[0] - step * (i + 1)
        : nums[k - 1] + step * (i + 1)
      return Math.round(v * 1e10) / 1e10
    }
    return backward ? source[k - 1 - (i % k)] : source[i % k]
  })
}

// Fills `target`, which extends `source` along one axis.
function fillRange(source: IBounds, target: IBounds) {
  const rows = allRows.value
  const cols = orderedColumns.value
  const changes: ISpreadsheetChange[] = []
  const write = (ri: number, ci: number, value: unknown) => {
    const row = rows[ri]
    const col = cols[ci]
    if (!row || !col || isReadOnly(row, col)) return
    const before = rawValue(row.id, col.id)
    const after = value === undefined ? null : value
    if (!sameValue(before, after))
      changes.push(makeChange(row.id, col.id, before, after))
  }
  const vertical = target.r1 !== source.r1 || target.r2 !== source.r2
  if (vertical) {
    const backward = target.r1 < source.r1
    const count = backward ? source.r1 - target.r1 : target.r2 - source.r2
    for (let c = source.c1; c <= source.c2; c++) {
      const src: unknown[] = []
      for (let r = source.r1; r <= source.r2; r++)
        src.push(rawValue(rows[r].id, cols[c].id))
      seriesValues(src, count, backward).forEach((v, i) =>
        write(backward ? source.r1 - 1 - i : source.r2 + 1 + i, c, v),
      )
    }
  } else {
    const backward = target.c1 < source.c1
    const count = backward ? source.c1 - target.c1 : target.c2 - source.c2
    if (count <= 0) return
    for (let r = source.r1; r <= source.r2; r++) {
      const src: unknown[] = []
      for (let c = source.c1; c <= source.c2; c++)
        src.push(rawValue(rows[r].id, cols[c].id))
      seriesValues(src, count, backward).forEach((v, i) =>
        write(r, backward ? source.c1 - 1 - i : source.c2 + 1 + i, v),
      )
    }
  }
  if (!changes.length) return
  pushUndo(changes)
  applyChanges(changes)
}

// Ctrl+D copies the selection's first row down over the rest of it, and
// Ctrl+R its first column to the right. On a single row or column they copy
// the one before it in. One row or column of source always repeats.
function fillFromEdge(direction: 'down' | 'right') {
  const b = selectionBounds.value
  if (!b) return
  if (direction === 'down') {
    const top = b.r1 === b.r2 ? b.r1 - 1 : b.r1
    if (top < 0) return
    fillRange({ ...b, r1: top, r2: top }, { ...b, r1: top, r2: b.r2 })
  } else {
    const left = b.c1 === b.c2 ? b.c1 - 1 : b.c1
    if (left < 0) return
    fillRange({ ...b, c1: left, c2: left }, { ...b, c1: left, c2: b.c2 })
  }
}

// ─── Resize ────────────────────────────────────────────────────────────────
const RESIZE_STEP = 8

function setColumnWidth(col: ISpreadsheetColumn, width: number): number {
  const next = Math.max(col.minWidth ?? 60, Math.round(width))
  columnWidths.value = { ...columnWidths.value, [col.id]: next }
  return next
}

function resizeColumn(col: ISpreadsheetColumn, width: number) {
  const before = widthOf(col)
  const next = setColumnWidth(col, width)
  if (next !== before) emit('column-resize', { columnId: col.id, width: next })
}

// A drag tells the host once, when it ends, not on every pixel.
function startResize(e: MouseEvent, col: ISpreadsheetColumn) {
  const startX = e.clientX
  const startW = widthOf(col)
  const onMove = (mv: MouseEvent) => {
    setColumnWidth(col, startW + (mv.clientX - startX))
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    const width = widthOf(col)
    if (width !== startW) emit('column-resize', { columnId: col.id, width })
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ─── Sort ──────────────────────────────────────────────────────────────────
function toggleSort(col: ISpreadsheetColumn) {
  if (sortBy.value?.columnId === col.id) {
    sortBy.value =
      sortBy.value.direction === 'asc'
        ? { columnId: col.id, direction: 'desc' }
        : null
  } else {
    sortBy.value = { columnId: col.id, direction: 'asc' }
  }
}

function sortColumn(col: ISpreadsheetColumn, direction: TSpreadsheetSortDir) {
  sortBy.value = { columnId: col.id, direction }
}

// ─── Hide and show ─────────────────────────────────────────────────────────
// A sheet always keeps one column and one row in view: with none, there is
// no cell left to hold the focus or open the menu that shows them again.
function hideColumns(ids: string[]) {
  const shown = orderedColumns.value.filter((c) => !ids.includes(c.id))
  if (!shown.length) return
  hiddenColumns.value = [...new Set([...hiddenColumns.value, ...ids])]
}

function showColumns(ids: string[]) {
  hiddenColumns.value = hiddenColumns.value.filter((id) => !ids.includes(id))
}

function hideRows(ids: string[]) {
  const shown = allRows.value.filter((r) => !ids.includes(r.id))
  if (!shown.length) return
  hiddenRows.value = [...new Set([...hiddenRows.value, ...ids])]
}

function showRows(ids: string[]) {
  hiddenRows.value = hiddenRows.value.filter((id) => !ids.includes(id))
}

// The shown neighbour of an item that has just been hidden: the next one,
// or the one before when it was the last.
function nearestShown<T extends { id: string }>(
  all: T[],
  id: string,
  shown: (item: T) => boolean,
): string | undefined {
  const i = all.findIndex((x) => x.id === id)
  if (i < 0) return undefined
  for (let j = i + 1; j < all.length; j++) if (shown(all[j])) return all[j].id
  for (let j = i - 1; j >= 0; j--) if (shown(all[j])) return all[j].id
  return undefined
}

// Hiding the active cell's column or row moves the focus to its neighbour,
// so a keyboard user keeps a place in the sheet. A selection that reached
// into what was hidden is dropped.
watch([orderedColumns, allRows], () => {
  const fc = focused.value
  if (!fc) return
  const colShown = colIndex.value.has(fc.columnId)
  const rowShown = rowIndex.value.has(fc.rowId)
  if (colShown && rowShown) {
    if (selection.value && !selectionBounds.value) {
      selection.value = null
      emit('selection', null)
    }
    return
  }
  const everyRow = [
    ...sourceRows.value.filter((r) => r.pinned === 'top'),
    ...sortedAllDataRows.value,
    ...sourceRows.value.filter((r) => r.pinned === 'bottom'),
  ]
  const columnId = colShown
    ? fc.columnId
    : nearestShown(allOrderedColumns.value, fc.columnId, (c) =>
        colIndex.value.has(c.id),
      )
  const rowId = rowShown
    ? fc.rowId
    : nearestShown(everyRow, fc.rowId, (r) => rowIndex.value.has(r.id))
  if (columnId && rowId) setFocus(rowId, columnId)
  else {
    focused.value = null
    selection.value = null
    emit('focus', null)
    emit('selection', null)
  }
})

// ─── Context menu ──────────────────────────────────────────────────────────
type TMenuKind = 'cell' | 'column' | 'row'
const menuRef = useTemplateRef<InstanceType<typeof NbMenu>>('menuRef')
const menuOpen = ref(false)
const menuKind = ref<TMenuKind>('cell')
const modKey =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    ? '⌘'
    : 'Ctrl+'
// Reading the clipboard needs the async API. Where it is missing the item
// stays, disabled, and says to use the keys.
const canReadClipboard =
  typeof navigator !== 'undefined' && !!navigator.clipboard?.readText

const selectedColumnIds = computed(() => {
  const b = selectionBounds.value
  if (!b) return []
  return orderedColumns.value.slice(b.c1, b.c2 + 1).map((c) => c.id)
})
const selectedRowIds = computed(() => {
  const b = selectionBounds.value
  if (!b) return []
  return allRows.value.slice(b.r1, b.r2 + 1).map((r) => r.id)
})

// Whole columns or whole rows, as a header click or Ctrl+Space selects.
function selectionShape(): TMenuKind {
  const b = selectionBounds.value
  if (!b) return 'cell'
  const fullHeight = b.r1 === 0 && b.r2 === allRows.value.length - 1
  const fullWidth = b.c1 === 0 && b.c2 === orderedColumns.value.length - 1
  if (fullHeight && !fullWidth) return 'column'
  if (fullWidth && !fullHeight) return 'row'
  return 'cell'
}

// Sorting is offered on a single sortable column.
const menuSortColumn = computed(() => {
  if (menuKind.value !== 'column' || selectedColumnIds.value.length !== 1)
    return null
  const col = columnsById.value.get(selectedColumnIds.value[0])
  return col?.sortable ? col : null
})

function onContextMenu(
  e: MouseEvent,
  kind: TMenuKind,
  rowId?: string,
  columnId?: string,
) {
  if (!props.contextMenu) return
  e.preventDefault()
  if (editing.value) commitEdit()
  const b = selectionBounds.value
  if (kind === 'column' && columnId) {
    const ci = colIndex.value.get(columnId) ?? -1
    if (selectionShape() !== 'column' || !b || ci < b.c1 || ci > b.c2)
      selectColumns(columnId)
  } else if (kind === 'row' && rowId) {
    const ri = rowIndex.value.get(rowId) ?? -1
    if (selectionShape() !== 'row' || !b || ri < b.r1 || ri > b.r2)
      selectRows(rowId)
  } else if (rowId && columnId) {
    if (!isCellInSelection(rowId, columnId)) setFocus(rowId, columnId)
  } else selectAll()
  focusScroller()
  openMenu(kind, e.clientX, e.clientY)
}

function openMenuAtActiveCell() {
  const fc = focused.value
  if (!fc) return
  scrollIntoView(fc.rowId, fc.columnId)
  const cell = scrollerRef.value?.querySelector<HTMLElement>(
    `[data-cell="${quoteAttr(`${fc.rowId}::${fc.columnId}`)}"]`,
  )
  const rect = cell?.getBoundingClientRect()
  openMenu(selectionShape(), rect?.left ?? 0, rect?.bottom ?? 0)
}

function openMenu(kind: TMenuKind, x: number, y: number) {
  menuKind.value = kind
  menuRef.value?.setPositionXY(x, y)
  menuOpen.value = true
}

function menuCopy() {
  const text = selectionText()
  if (text !== null) void navigator.clipboard?.writeText(text).catch(() => {})
}

function menuCut() {
  menuCopy()
  clearSelection()
}

function menuPaste() {
  void navigator.clipboard
    ?.readText()
    .then(pasteText)
    .catch(() => {})
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
  applyChanges(reverted)
  redoStack.value.push(group)
}

function redo() {
  const group = redoStack.value.pop()
  if (!group) return
  applyChanges(group)
  undoStack.value.push(group)
}

watch(
  () => [
    props.fit,
    allRows.value.length,
    phoneTouch.value,
    props.size,
    props.columnHeaders,
  ],
  () => measureFit(),
)

onMounted(() => {
  focusScroller()
  measureFit()
  measureHeaders()
  if (typeof ResizeObserver !== 'undefined' && scrollerRef.value) {
    sizeObserver = new ResizeObserver(() => {
      measureFit()
      measureHeaders()
    })
    sizeObserver.observe(scrollerRef.value)
    if (rootRef.value) sizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => sizeObserver?.disconnect())

// Expose for parents
defineExpose({
  focus: (rowId: string, columnId: string) => setFocus(rowId, columnId),
  undo,
  redo,
  getSelection: () => selection.value,
  selectAll,
  selectColumn: (columnId: string) => selectColumns(columnId),
  selectRow: (rowId: string) => selectRows(rowId),
  hideColumns,
  showColumns,
  hideRows,
  showRows,
})
</script>

<style lang="scss" scoped>
@use '../styles/variables/breakpoints' as bp;

// ─── NbSpreadsheet: Carbon-aligned data spreadsheet ───────────────────────
//
// Carbon has no spreadsheet of its own (its data table guidelines rule that
// use out), so the sheet takes the data table's rules and adds what a grid of
// cells needs:
// - Carbon's row sizes, xs to lg (24, 32, 40, 48px), with the header as tall
//   as a row.
// - The column and row headers are Carbon's column header: $layer-accent
//   (--nb-c-surface-accent) and heading-compact-01, sentence case.
// - Cells are body-compact-01 in tabular figures, hairline borders between.
// - The active cell has a 2px focus ring inside the cell, not around it.
// - A selected range is $layer-selected (--nb-c-surface-selected), neutral,
//   not a brand tint.
//
// Token map (NubiscoUI surface API):
//   --nb-c-surface-accent  : column and row headers, the corner
//   --nb-c-surface         : toolbar, read-only and computed cells
//   --nb-c-surface-raised  : editable cells
//   --nb-c-surface-hover   : cell hover
//   --nb-c-surface-selected: a selected range and its headers
//   --nb-c-border          : every line
//   --nb-c-text / muted    : foreground hierarchy
//   --nb-c-focus-ring      : the active cell and the editor
//
// Anything component-local (focus ring, row and header height) is a CSS
// custom property at the root scope so callers can override per instance.

.nb-spreadsheet {
  --nbss-row-height: 32px;
  --nbss-header-height: 32px;
  // The letters row above the labels, with `column-headers="both"`. The
  // whole header block is --nbss-head-height, which pinned rows sit under.
  --nbss-letter-height: 24px;
  --nbss-head-height: var(--nbss-header-height);
  --nbss-cell-padding-x: 0.625rem;
  --nbss-focus-ring: var(--nb-c-focus-ring, var(--nb-c-primary));

  display: flex;
  flex-direction: column;
  border: 1px solid var(--nb-c-border);
  border-radius: 4px;
  background: var(--nb-c-surface-raised, var(--nb-c-surface));
  color: var(--nb-c-text);
  overflow: hidden;
  font-family: var(--nb-font-family-sans, system-ui);
  font-size: var(--nb-type-body-compact-size);
  line-height: var(--nb-type-body-compact-line-height);
}

// The letters above the labels: the header block is both rows.
.nb-spreadsheet--two-headers {
  --nbss-head-height: calc(
    var(--nbss-letter-height) + var(--nbss-header-height)
  );
}

// Carbon's sizes. The header always matches the row.
.nb-spreadsheet--xs {
  --nbss-row-height: 24px;
  --nbss-header-height: 24px;
}
.nb-spreadsheet--md {
  --nbss-row-height: 40px;
  --nbss-header-height: 40px;
}
.nb-spreadsheet--lg {
  --nbss-row-height: 48px;
  --nbss-header-height: 48px;
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
// Fit: the root takes the parent's height, which is what the rows are
// measured against, and draws nothing. The sheet you see is the toolbar and
// the scroller, which is as tall as its rows and scrolls once they do not fit.
.nb-spreadsheet--fit {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.nb-spreadsheet--fit .nb-spreadsheet__toolbar {
  border: 1px solid var(--nb-c-border);
  border-radius: 4px 4px 0 0;
}
.nb-spreadsheet--fit .nb-spreadsheet__scroller {
  flex: 0 1 auto;
  min-height: 0;
  max-height: none;
  border: 1px solid var(--nb-c-border);
  border-radius: 4px;
  background: var(--nb-c-surface-raised, var(--nb-c-surface));
}
.nb-spreadsheet--fit .nb-spreadsheet__toolbar + .nb-spreadsheet__scroller {
  border-top: 0;
  border-radius: 0 0 4px 4px;
}
// A fitted grid is the scroller's width, and only its columns' least widths
// push it wider. At max-content the shared columns would grow to their
// longest label first, and the sheet would scroll where it could have fit.
.nb-spreadsheet--fit .nb-spreadsheet__grid {
  width: auto;
  min-width: min-content;
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

// A row only carries the row role: its cells are the grid's items.
.nb-spreadsheet__row {
  display: contents;
}

// ─── Header row ──────────────────────────────────────────────────────────
.nb-spreadsheet__corner {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 5;
  background: var(--nb-c-surface-accent);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  height: var(--nbss-head-height);
  cursor: cell;
}

.nb-spreadsheet__header {
  position: sticky;
  top: 0;
  z-index: 3;
  height: var(--nbss-header-height);
  display: flex;
  align-items: center;
  gap: var(--nb-base-unit, 0.25rem);
  padding: 0 var(--nbss-cell-padding-x);
  background: var(--nb-c-surface-accent);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  font-size: var(--nb-type-heading-compact-size);
  font-weight: var(--nb-type-heading-compact-weight);
  line-height: var(--nb-type-heading-compact-line-height);
  letter-spacing: var(--nb-type-heading-compact-letter-spacing);
  color: var(--nb-c-text);
  cursor: cell;
  user-select: none;
  transition: background var(--nb-motion-quick) ease;
}

.nb-spreadsheet__header--sortable {
  cursor: pointer;
}
.nb-spreadsheet__header--sortable:hover {
  background: var(--nb-c-surface-accent-hover);
}
.nb-spreadsheet__header--selected {
  background: var(--nb-c-surface-selected);
}
.nb-spreadsheet__header-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Carbon's sort arrows: hidden until the header is hovered, and kept, in the
// primary colour, on the sorted column.
.nb-spreadsheet__sort {
  flex-shrink: 0;
  font-size: var(--nb-type-body-compact-size);
  color: var(--nb-c-text-subtle, var(--nb-c-text-muted));
  opacity: 0;
  transition: opacity var(--nb-motion-quick) ease;
}
.nb-spreadsheet__header--sortable:hover .nb-spreadsheet__sort {
  opacity: 1;
}
.nb-spreadsheet__header--sorted .nb-spreadsheet__sort {
  opacity: 1;
  color: var(--nb-c-primary);
}

// Column letters: centred, as a spreadsheet's are, and set in the body face
// so they read as a coordinate rather than a name. In the row above the
// labels they are a compact band that never sorts.
.nb-spreadsheet__header--letters {
  justify-content: center;
  font-weight: var(--nb-type-body-compact-weight, 400);
  letter-spacing: 0;
  color: var(--nb-c-text-muted);
}
.nb-spreadsheet__header--letters.nb-spreadsheet__header--stacked {
  height: var(--nbss-letter-height);
  font-size: var(--nb-type-body-sm-size);
}
.nb-spreadsheet__header--letters.nb-spreadsheet__header--selected {
  color: var(--nb-c-text);
}
.nb-spreadsheet__header-letter {
  overflow: hidden;
  white-space: nowrap;
}

// The mark hidden columns and rows leave: a double rule on the edge they
// were on, in the strong border colour, and the primary colour under the
// pointer. A click shows that group again.
.nb-spreadsheet__unhide {
  position: absolute;
  z-index: 2;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  &::before {
    content: '';
    position: absolute;
    border-color: var(--nb-c-border-strong, var(--nb-c-text-muted));
    border-style: solid;
    border-width: 0;
    transition: border-color var(--nb-motion-quick) ease;
  }
  &:hover::before {
    border-color: var(--nb-c-primary);
  }
}
.nb-spreadsheet__unhide--col-start,
.nb-spreadsheet__unhide--col-end {
  top: 0;
  width: 8px;
  height: 100%;
  &::before {
    top: 0;
    bottom: 0;
    left: 2px;
    width: 3px;
    border-left-width: 1px;
    border-right-width: 1px;
  }
}
.nb-spreadsheet__unhide--col-start {
  left: -1px;
}
// Clear of the resize handle on the same edge.
.nb-spreadsheet__unhide--col-end {
  right: 4px;
}
.nb-spreadsheet__unhide--row-start,
.nb-spreadsheet__unhide--row-end {
  left: 0;
  width: 100%;
  height: 8px;
  &::before {
    left: 0;
    right: 0;
    top: 2px;
    height: 3px;
    border-top-width: 1px;
    border-bottom-width: 1px;
  }
}
.nb-spreadsheet__unhide--row-start {
  top: -1px;
}
.nb-spreadsheet__unhide--row-end {
  bottom: 0;
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
    transition: background var(--nb-motion-quick) ease;
  }
  &:hover::after {
    background: var(--nb-c-primary, #6a40d0);
  }
}

// The last handle stays inside the sheet. Hanging past its edge it made the
// grid a few pixels wider than the scroller, which scrolled for nothing.
.nb-spreadsheet__header--last .nb-spreadsheet__resize-handle {
  right: 0;
}

// ─── Row gutter (left index column) ──────────────────────────────────────
.nb-spreadsheet__gutter {
  background: var(--nb-c-surface-accent);
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  color: var(--nb-c-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.375rem;
  font-size: var(--nb-type-body-sm-size);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  cursor: cell;
  user-select: none;
}

// A pinned row's header names it (a total, a reference row), and reads with
// the same weight as the row's cells.
.nb-spreadsheet__gutter--pinned-top,
.nb-spreadsheet__gutter--pinned-bottom {
  color: var(--nb-c-text);
  font-weight: 600;
}

.nb-spreadsheet__gutter--selected {
  background: var(--nb-c-surface-selected);
  color: var(--nb-c-text);
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
  transition: background-color var(--nb-motion-micro) linear;
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
  background: var(--nb-c-surface-selected);
}

// Active cell: inset 2px focus ring, no offset, no jump on focus.
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
.nb-spreadsheet__cell--readonly.nb-spreadsheet__cell--selected,
.nb-spreadsheet__cell--computed.nb-spreadsheet__cell--selected {
  background: var(--nb-c-surface-selected);
}
.nb-spreadsheet__cell--pinned-bottom {
  font-weight: 600;
}

// Subtle shadow on the right edge of the rightmost pinned-left column
// indicates "more content to the right", the same idea as Carbon's sticky
// columns.
.nb-spreadsheet__cell[style*='position: sticky'][style*='left']
  + .nb-spreadsheet__cell:not([style*='position: sticky']) {
  box-shadow: -4px 0 4px -4px rgba(0, 0, 0, 0.12);
}

// The fill handle: a square on the selection's last corner, in the focus
// ring's colour. The cells a drag will fill take a dashed outline.
.nb-spreadsheet__cell--fill-anchor {
  position: relative;
}
.nb-spreadsheet__fill-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 6px;
  height: 6px;
  background: var(--nbss-focus-ring);
  box-shadow: 0 0 0 1px var(--nb-c-surface-raised, var(--nb-c-surface));
  cursor: crosshair;
  z-index: 3;
}
.nb-spreadsheet__cell--fill {
  outline: 1px dashed var(--nb-c-border-strong);
  outline-offset: -2px;
}
.nb-spreadsheet--filling,
.nb-spreadsheet--filling .nb-spreadsheet__cell {
  cursor: crosshair;
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
    font-size: var(--nb-type-body-lg-size);
  }
}
</style>
