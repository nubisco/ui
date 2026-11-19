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

    <!-- The formula bar: the active cell's reference, and its contents with
         a formula as written. Typing in it edits the cell. -->
    <div v-if="showFormulaBar" class="nb-spreadsheet__formula-bar">
      <span class="nb-spreadsheet__name-box">{{ nameBoxText }}</span>
      <span class="nb-spreadsheet__fx" aria-hidden="true">fx</span>
      <div class="nb-spreadsheet__bar-field">
        <div
          v-if="isFormulaDraft"
          class="nb-spreadsheet__mirror nb-spreadsheet__mirror--bar"
          aria-hidden="true"
        >
          <span :style="{ transform: `translateX(${-draftScroll.bar}px)` }"
            ><span
              v-for="(run, i) in draftRuns"
              :key="i"
              :class="run.colour ? `nb-spreadsheet__ref--${run.colour}` : ''"
              >{{ run.text }}</span
            ></span
          >
        </div>
        <input
          ref="barRef"
          class="nb-spreadsheet__bar-input"
          :class="{ 'nb-spreadsheet__input--formula': isFormulaDraft }"
          :value="barText"
          :readonly="!barEditable"
          :aria-label="strings.spreadsheetFormulaBar"
          v-bind="assistAria"
          autocomplete="off"
          spellcheck="false"
          @focus="onBarFocus"
          @input="onBarInput"
          @keydown.stop="editing && onEditorKeydown($event)"
          @keyup="updateAssist"
          @click="updateAssist"
          @blur="onEditorBlur"
          @scroll="onDraftScroll"
        />
      </div>
    </div>

    <!-- The scroller is the grid a screen reader sees. It keeps the focus
         while the person moves around, and names the active cell through
         aria-activedescendant, so no cell is ever in the tab order. -->
    <div
      ref="scrollerRef"
      class="nb-spreadsheet__scroller"
      :class="{ 'nb-spreadsheet__scroller--active': !!focused }"
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
          <template v-for="col in renderColumns" :key="`c-${row.id}-${col.id}`">
            <div
              v-if="!isCovered(row.id, col.id)"
              :id="cellId(row.id, col.id)"
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
          </template>
        </div>

        <!-- The cells a formula being edited refers to, boxed in its
             references' colours. -->
        <div
          v-for="box in refBoxes"
          :key="box.key"
          class="nb-spreadsheet__ref-box"
          :class="`nb-spreadsheet__ref--${box.colour}`"
          :style="box.style"
          aria-hidden="true"
        />
      </div>

      <!-- Edit input overlay -->
      <!-- A formula's references are coloured on a layer behind the
           editor's text, which is drawn transparent over it. -->
      <div
        v-if="editing && isFormulaDraft"
        class="nb-spreadsheet__editor nb-spreadsheet__mirror"
        :style="editorStyle"
        aria-hidden="true"
      >
        <span :style="{ transform: `translateX(${-draftScroll.cell}px)` }"
          ><span
            v-for="(run, i) in draftRuns"
            :key="i"
            :class="run.colour ? `nb-spreadsheet__ref--${run.colour}` : ''"
            >{{ run.text }}</span
          ></span
        >
      </div>
      <input
        v-if="editing"
        ref="editorRef"
        v-model="editing.draft"
        class="nb-spreadsheet__editor"
        :class="{ 'nb-spreadsheet__input--formula': isFormulaDraft }"
        :style="editorStyle"
        :inputmode="editorInputMode"
        :aria-label="editorLabel"
        v-bind="assistAria"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="next"
        @focus="onEditorFocus('cell')"
        @blur="onEditorBlur"
        @input="onDraftInput"
        @keyup="updateAssist"
        @click="updateAssist"
        @scroll="onDraftScroll"
        @keydown.stop="onEditorKeydown"
      />
    </div>

    <!-- Functions offered while a name is typed, and the call being typed
         into. Fixed to the viewport, so the sheet's own scroll box never
         clips them. -->
    <div
      v-if="editing && (assist || signature) && assistPosition"
      class="nb-spreadsheet__assist"
      :style="{
        left: `${assistPosition.left}px`,
        top: `${assistPosition.top}px`,
      }"
    >
      <ul
        v-if="assist"
        :id="assistId"
        class="nb-spreadsheet__assist-list"
        role="listbox"
        :aria-label="strings.spreadsheetFunctions"
      >
        <li
          v-for="(fn, i) in assist.items"
          :id="`${assistId}-${i}`"
          :key="fn.name"
          class="nb-spreadsheet__assist-option"
          :class="{
            'nb-spreadsheet__assist-option--active': i === assist.active,
          }"
          role="option"
          :aria-selected="i === assist.active"
          @mousedown.prevent="acceptAssist(i)"
        >
          <span class="nb-spreadsheet__assist-name">{{ fn.name }}</span>
          <span class="nb-spreadsheet__assist-description">{{
            fn.description
          }}</span>
        </li>
      </ul>
      <div
        v-else-if="signature"
        :id="`${assistId}-signature`"
        class="nb-spreadsheet__signature"
      >
        <span class="nb-spreadsheet__signature-call"
          ><template
            v-for="(part, i) in partOfSignature(signature.fn, signature.arg)"
            :key="i"
            ><strong v-if="part.current">{{ part.text }}</strong
            ><template v-else>{{ part.text }}</template></template
          ></span
        >
        <span class="nb-spreadsheet__assist-description">{{
          signature.fn.description
        }}</span>
      </div>
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
      <template v-if="sheetMode">
        <NbMenuDivider />
        <NbMenuItem
          v-if="selectionHasMerge"
          :label="strings.spreadsheetUnmerge"
          @select="unmergeSelection"
        />
        <NbMenuItem
          v-else
          :label="strings.spreadsheetMerge"
          :disabled="!canMerge"
          @select="mergeSelection"
        />
      </template>
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
  getCurrentInstance,
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
  TSpreadsheetStyles,
  ISpreadsheetCellStyle,
  ISpreadsheetCsvOptions,
  TSpreadsheetNumberFormat,
} from './Spreadsheet.d'
import {
  cleanStyle,
  formatNumber,
  isSheetError,
  mergeStyle,
  parseRange,
  rangesOverlap,
  rangeText,
  ruleMatches,
  type ISheetRange,
} from './spreadsheet/sheetLook'
import { parseCsv, toCsv } from '@/utils/csv.helper'
import {
  createFormulaSheet,
  findFunctions,
  fromSerial,
  parseDateText,
  toSerial,
  FORMULA_FUNCTIONS,
  isFormula,
  referencesIn,
  shiftFormula,
  syntaxForLocale,
  toCanonical,
  toLocalized,
  tokenize,
  type IFormulaFunction,
  type TFormulaValue,
} from '@/formula'

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
  formulas: true,
  formulaBar: undefined,
  conditionalFormats: undefined,
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
// The cells' look, `v-model:styles`, keyed like the cells in sheet mode and
// `rowId:columnId` in a table: what people set with Cmd/Ctrl+B, I and U and
// the exposed `applyStyle`. And sheet mode's merged
// ranges, `v-model:merges`, such as ['A1:C1']: a merge shows its first cell
// across the range, and keeps the cells under it out of sight. Unbound, the
// sheet keeps both for as long as it is on the page.
const styles = defineModel<TSpreadsheetStyles>('styles', {
  default: () => ({}),
})
const merges = defineModel<string[]>('merges', { default: () => [] })

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
  // Where the draft is typed: the cell's own editor or the formula bar.
  source?: 'cell' | 'bar'
} | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
let lastPointerType = ''
// One step of undo: the cell changes, and in sheet mode the styles and
// merges before and after, when the step changed them.
interface IUndoStep {
  changes: ISpreadsheetChange[]
  styles?: [TSpreadsheetStyles, TSpreadsheetStyles]
  merges?: [string[], string[]]
}
const undoStack = ref<IUndoStep[]>([])
const redoStack = ref<IUndoStep[]>([])

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
  // A merged range is part of the sheet even while it is empty.
  for (const m of sheetMerges.value) {
    rows = Math.max(rows, m.r2 + 1)
    columns = Math.max(columns, m.c2 + 1)
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

// A sheet-mode cell's place in the whole sheet, hidden rows and columns
// counted, which is what references, merges and formats are written in.
function sheetPosition(rowId: string, columnId: string) {
  return { r: Number(rowId) - 1, c: lettersToIndex(columnId) }
}

// ─── Merged ranges ─────────────────────────────────────────────────────────
// Merges in sheet positions. A single cell or a range that does not parse is
// not a merge, and neither is a whole column or row.
const sheetMerges = computed<ISheetRange[]>(() => {
  if (!sheetMode.value) return []
  const out: ISheetRange[] = []
  for (const text of merges.value) {
    const r = parseRange(text)
    if (!r || !Number.isFinite(r.r2) || !Number.isFinite(r.c2)) continue
    if (r.r1 === r.r2 && r.c1 === r.c2) continue
    out.push(r)
  }
  return out
})

// The same merges in view positions, over the rows and columns shown. A
// merge that is wholly hidden is not drawn, and one partly hidden spans what
// is left of it.
const viewMerges = computed<IBounds[]>(() => {
  const out: IBounds[] = []
  for (const m of sheetMerges.value) {
    let r1 = -1
    let r2 = -1
    let c1 = -1
    let c2 = -1
    for (let r = m.r1; r <= m.r2; r++) {
      const i = rowIndex.value.get(String(r + 1))
      if (i === undefined) continue
      if (r1 < 0) r1 = i
      r2 = i
    }
    for (let c = m.c1; c <= m.c2; c++) {
      const i = colIndex.value.get(indexToLetters(c))
      if (i === undefined) continue
      if (c1 < 0) c1 = i
      c2 = i
    }
    if (r1 < 0 || c1 < 0 || (r1 === r2 && c1 === c2)) continue
    out.push({ r1, r2, c1, c2 })
  }
  return out
})

// Every view position a merge covers, its first cell included.
const mergeByPosition = computed(() => {
  const map = new Map<string, IBounds>()
  for (const m of viewMerges.value)
    for (let r = m.r1; r <= m.r2; r++)
      for (let c = m.c1; c <= m.c2; c++) map.set(`${r}:${c}`, m)
  return map
})

function mergeAt(ri: number, ci: number): IBounds | undefined {
  return mergeByPosition.value.get(`${ri}:${ci}`)
}

// A merge shows its first cell across the range. The cells under it are not
// rendered, so a click anywhere on the range lands on the first cell.
function isCovered(rowId: string, columnId: string): boolean {
  if (!viewMerges.value.length) return false
  const ri = rowIndex.value.get(rowId) ?? -1
  const ci = colIndex.value.get(columnId) ?? -1
  const m = mergeAt(ri, ci)
  return !!m && (m.r1 !== ri || m.c1 !== ci)
}

// A selection that reaches into a merge takes all of it, as in a desktop
// spreadsheet, so a range never ends halfway across a merged cell.
function expandToMerges(b: IBounds): IBounds {
  if (!viewMerges.value.length) return b
  const out = { ...b }
  let grown = true
  while (grown) {
    grown = false
    for (const m of viewMerges.value) {
      if (!rangesOverlap(out, m)) continue
      if (m.r1 < out.r1 || m.r2 > out.r2 || m.c1 < out.c1 || m.c2 > out.c2) {
        out.r1 = Math.min(out.r1, m.r1)
        out.r2 = Math.max(out.r2, m.r2)
        out.c1 = Math.min(out.c1, m.c1)
        out.c2 = Math.max(out.c2, m.c2)
        grown = true
      }
    }
  }
  return out
}

// View bounds as a sheet range, for the merges and styles written in refs.
function sheetRangeOf(b: IBounds): ISheetRange {
  const rows = allRows.value
  const cols = orderedColumns.value
  const a = sheetPosition(rows[b.r1].id, cols[b.c1].id)
  const z = sheetPosition(rows[b.r2].id, cols[b.c2].id)
  return { r1: a.r, c1: a.c, r2: z.r, c2: z.c }
}

// Merges the active range into one cell, replacing any merge it overlaps.
function mergeSelection() {
  const b = selectionBounds.value
  if (!sheetMode.value || !b || (b.r1 === b.r2 && b.c1 === b.c2)) return
  const range = sheetRangeOf(b)
  const before = merges.value
  const after = [
    ...before.filter((t) => {
      const m = parseRange(t)
      return !m || !rangesOverlap(m, range)
    }),
    rangeText(range),
  ]
  pushUndo([], { merges: [before, after] })
  merges.value = after
}

// Splits every merge the selection touches back into cells.
function unmergeSelection() {
  if (!sheetMode.value || !allSelectionBounds.value.length) return
  const ranges = allSelectionBounds.value.map(sheetRangeOf)
  const before = merges.value
  const after = before.filter((t) => {
    const m = parseRange(t)
    return !m || !ranges.some((r) => rangesOverlap(m, r))
  })
  if (after.length === before.length) return
  pushUndo([], { merges: [before, after] })
  merges.value = after
}

const canMerge = computed(() => {
  const b = selectionBounds.value
  return !!b && (b.r1 !== b.r2 || b.c1 !== b.c2)
})

const selectionHasMerge = computed(() =>
  allSelectionBounds.value.some((b) =>
    viewMerges.value.some((m) => rangesOverlap(m, b)),
  ),
)

// ─── Cell styles and conditional formats ───────────────────────────────────
const parsedFormats = computed(() => {
  if (!sheetMode.value || !props.conditionalFormats?.length) return []
  const out: Array<{
    range: ISheetRange
    format: NonNullable<typeof props.conditionalFormats>[number]
  }> = []
  for (const format of props.conditionalFormats) {
    const range = parseRange(format.range)
    if (range) out.push({ range, format })
  }
  return out
})

// Table mode keys its styles `rowId:columnId`, and takes the style keys
// only once the host binds `v-model:styles`. Until then a table's look is
// the host's, and Cmd/Ctrl+B is still the browser's.
const hostProps = getCurrentInstance()?.vnode.props ?? {}
const stylesBound = 'styles' in hostProps || 'onUpdate:styles' in hostProps
const stylesOn = computed(() => sheetMode.value || stylesBound)

function styleKeyOf(rowId: string, columnId: string): string {
  return sheetMode.value ? cellRef(rowId, columnId) : `${rowId}:${columnId}`
}

function sameStyle(
  a: ISpreadsheetCellStyle | undefined,
  b: ISpreadsheetCellStyle | undefined,
): boolean {
  return a === b || JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
}

// A cell's look: its own style, then, in sheet mode, every conditional
// format that passes for it, in order.
function cellLook(
  rowId: string,
  columnId: string,
): ISpreadsheetCellStyle | undefined {
  if (!stylesOn.value) return undefined
  let look: ISpreadsheetCellStyle | undefined =
    styles.value[styleKeyOf(rowId, columnId)]
  if (!sheetMode.value || !parsedFormats.value.length) return look
  const { r, c } = sheetPosition(rowId, columnId)
  for (const { range, format } of parsedFormats.value) {
    if (r < range.r1 || r > range.r2 || c < range.c1 || c > range.c2) continue
    const formulaResult =
      format.rule.when === 'formula'
        ? evaluateRule(format.rule.formula, r - range.r1, c - range.c1)
        : undefined
    if (ruleMatches(format.rule, shownValue(rowId, columnId), formulaResult))
      look = mergeStyle(look, format.style)
  }
  return look
}

// Sets style keys on every selected cell. A key given as undefined or false
// is removed, so `applyStyle({ intent: undefined })` clears a colour.
function applyStyle(patch: Partial<ISpreadsheetCellStyle>) {
  if (!stylesOn.value) return
  const before = styles.value
  const after: TSpreadsheetStyles = { ...before }
  for (const { rowId, columnId } of selectedCells()) {
    const key = styleKeyOf(rowId, columnId)
    const next = cleanStyle({ ...before[key], ...patch })
    if (next) after[key] = next
    else delete after[key]
  }
  pushUndo([], { styles: [before, after] })
  styles.value = after
}

// Bold, italic, underline and strikethrough follow the active cell: on when
// it lacks them, off when it has them, for the whole selection.
function toggleStyle(key: 'bold' | 'italic' | 'underline' | 'strike') {
  const fc = focused.value
  if (!fc) return
  const on = !styles.value[styleKeyOf(fc.rowId, fc.columnId)]?.[key]
  applyStyle({ [key]: on })
}

function clearStyles() {
  applyStyle({
    bold: undefined,
    italic: undefined,
    underline: undefined,
    strike: undefined,
    align: undefined,
    intent: undefined,
    format: undefined,
  })
}

// ─── CSV ───────────────────────────────────────────────────────────────────
// The sheet as CSV. Sheet mode writes A1 to the last filled cell. Table mode
// writes a row of column labels, then every row in the order shown. Hidden
// columns and rows are part of the data, so both are written.
function exportCsv(options: ISpreadsheetCsvOptions = {}): string {
  const display = options.values === 'display'
  const cols = allOrderedColumns.value
  const out: unknown[][] = []
  if (sheetMode.value) {
    const { rows, columns } = dataBounds.value
    for (let r = 0; r < rows; r++) {
      const line: unknown[] = []
      for (let c = 0; c < columns; c++) {
        const rowId = String(r + 1)
        const columnId = indexToLetters(c)
        line.push(display ? textOf(rowId, columnId) : rawValue(rowId, columnId))
      }
      out.push(line)
    }
  } else {
    out.push(cols.map((c) => c.label))
    for (const row of [
      ...sourceRows.value.filter((r) => r.pinned === 'top'),
      ...sortedAllDataRows.value,
      ...sourceRows.value.filter((r) => r.pinned === 'bottom'),
    ]) {
      out.push(
        cols.map((col) =>
          display ? cellDisplay(row, col) : rawValue(row.id, col.id),
        ),
      )
    }
  }
  return toCsv(out, options.delimiter ?? ',')
}

// Replaces a sheet-mode sheet's cells with CSV text, as one step that undo
// takes back. Numbers are read as typed numbers are. Table mode's data is the
// host's, so there it does nothing: use `parseCsv` and set the rows.
function importCsv(text: string, delimiter?: string) {
  if (!sheetMode.value) return
  const next: TSpreadsheetCells = {}
  const dates: Array<{ key: string; format: TSpreadsheetNumberFormat }> = []
  parseCsv(text, delimiter).forEach((line, r) => {
    line.forEach((field, c) => {
      const key = `${indexToLetters(c)}${r + 1}`
      const value = parseSheetInput(field)
      if (value === null) return
      next[key] = value
      const date = typeof value === 'number' ? readDate(field) : null
      if (date) dates.push({ key, format: date.format })
    })
  })
  const nextStyles = dateStyles(dates)
  const current = cells.value ?? {}
  const changes: ISpreadsheetChange[] = []
  for (const key of new Set([...Object.keys(current), ...Object.keys(next)])) {
    const m = /^([A-Z]+)(\d+)$/.exec(key)
    if (!m) continue
    const before = current[key] ?? null
    const after = next[key] ?? null
    if (!sameValue(before, after))
      changes.push(makeChange(m[2], m[1], before, after))
  }
  if (!changes.length && !nextStyles) return
  pushUndo(changes, nextStyles ? { styles: [styles.value, nextStyles] } : {})
  if (changes.length) applyChanges(changes)
  if (nextStyles) styles.value = nextStyles
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
  const shown = new Set<number>()
  cols.forEach((c, i) => {
    const w = widthOf(c)
    if (c.pinned || (x + w >= from && x <= to)) shown.add(i)
    x += w
  })
  // As with rows: a merge that starts left of the window and reaches into
  // it keeps its first column.
  for (const m of viewMerges.value) {
    for (let c = m.c1 + 1; c <= m.c2; c++)
      if (shown.has(c)) {
        shown.add(m.c1)
        break
      }
  }
  return cols.filter((_, i) => shown.has(i))
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
  // A merge that starts above the window but reaches into it needs its first
  // row rendered, or the part in view would be blank.
  const firstInView = start + pinnedTopRows.value.length
  for (const m of viewMerges.value) {
    if (m.r1 >= firstInView || m.r2 < firstInView) continue
    const r = allRows.value[m.r1]
    if (r && !mid.some((x) => x.id === r.id))
      mid.unshift({ ...r, __virtualIndex: m.r1 })
  }
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
  const date = readDate(text)
  if (date) return date.value
  return input
}

// A number without a format reads as a desktop spreadsheet's General: the
// locale's decimal mark and no grouping, so a year is 2026, not 2,026. The
// `number` format groups thousands.
function formatSheetValue(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (typeof raw === 'number')
    return new Intl.NumberFormat(props.locale, {
      maximumFractionDigits: 10,
      useGrouping: false,
    }).format(raw)
  if (typeof raw === 'boolean') return raw ? 'TRUE' : 'FALSE'
  return String(raw)
}

// ─── Formulas ──────────────────────────────────────────────────────────────
// A sheet-mode cell holding text that starts with '=' is a formula. The
// cells keep its text, and the sheet shows what it works out to. The engine
// keeps each formula's parse between changes, so a change re-reads only the
// formulas whose text changed.
const formulaSheet = createFormulaSheet()
const NO_FORMULA_VALUES = new Map<string, TFormulaValue>()
const formulasOn = computed(() => sheetMode.value && props.formulas)
const formulaValues = computed(() =>
  formulasOn.value
    ? formulaSheet.compute(cells.value ?? {})
    : NO_FORMULA_VALUES,
)

// What a cell shows before it is formatted: a formula's result, or the
// value itself.
function shownValue(rowId: string, columnId: string): unknown {
  const raw = rawValue(rowId, columnId)
  if (formulasOn.value && isFormula(raw))
    return formulaValues.value.get(cellRef(rowId, columnId)) ?? null
  return raw
}

// A conditional format's formula, moved from the range's first cell to the
// one being styled, and worked out against the sheet as it stands.
function evaluateRule(formula: string, dRow: number, dCol: number): unknown {
  if (!sheetMode.value) return undefined
  // Reading the values first makes the engine's last compute the current one.
  void formulaValues.value
  const text = formula.startsWith('=') ? formula : `=${formula}`
  return formulaSheet.evaluate(shiftFormula(text, dRow, dCol))
}

// The text a sheet-mode cell shows: an error's code, a number in the cell's
// format, anything else as it is.
function textOf(rowId: string, columnId: string): string {
  const value = shownValue(rowId, columnId)
  if (isSheetError(value)) return value.error
  if (typeof value === 'number')
    return formatNumber(
      value,
      styles.value[cellRef(rowId, columnId)]?.format ??
        formulaFormat(rawValue(rowId, columnId)),
      props.locale,
    )
  return formatSheetValue(value)
}

// A formula whose result is a date or a time shows as one until the cell is
// given a format of its own, as a desktop spreadsheet shows =TODAY().
const DATE_RESULT = /^=\s*(DATE|TODAY|EDATE|EOMONTH|WORKDAY|DATEVALUE)\s*\(/i
const TIME_RESULT = /^=\s*(TIME|TIMEVALUE)\s*\(/i
const DATETIME_RESULT = /^=\s*NOW\s*\(/i
function formulaFormat(raw: unknown): TSpreadsheetNumberFormat | undefined {
  if (!formulasOn.value || !isFormula(raw)) return undefined
  if (DATE_RESULT.test(raw)) return { type: 'date' }
  if (TIME_RESULT.test(raw)) return { type: 'time' }
  if (DATETIME_RESULT.test(raw)) return { type: 'datetime' }
  // A date plus or minus days is still a date: =A2+30 takes A2's format, as
  // in a desktop spreadsheet.
  const first = DATE_ARITHMETIC.exec(raw)
  const format = first
    ? styles.value[`${first[1]}${first[2]}`]?.format
    : undefined
  if (format?.type === 'date' || format?.type === 'datetime') return format
  return undefined
}
const DATE_ARITHMETIC = /^=\s*\$?([A-Z]+)\$?(\d+)\s*[+-]\s*[\d.]+\s*$/

// ── Dates typed into a cell ──
// A date or a time typed into a sheet-mode cell is stored as a serial number,
// the days since 1899-12-30 with the time of day as the fraction, and the cell
// takes a date format so it still reads as a date. ISO dates always work, and
// so does the sheet's locale's short form: 19/11/2026 in pt-PT, 11/19/2026 in
// en-US.
const dateOrder = computed(() => {
  const parts = new Intl.DateTimeFormat(props.locale, {
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(2006, 0, 2)))
  return parts
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.type as 'day' | 'month' | 'year')
})

const LOCALE_DATE =
  /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/

function readDate(
  text: string,
): { value: number; format: TSpreadsheetNumberFormat } | null {
  const trimmed = text.trim()
  const iso = parseDateText(trimmed)
  if (iso !== null) {
    const hasDate = /^\d{4}-/.test(trimmed)
    const hasTime = trimmed.includes(':')
    return {
      value: iso,
      format: {
        type: hasDate && hasTime ? 'datetime' : hasTime ? 'time' : 'date',
      },
    }
  }
  const m = LOCALE_DATE.exec(trimmed)
  if (!m || dateOrder.value.length !== 3) return null
  const fields: Record<string, number> = {}
  dateOrder.value.forEach((part, i) => (fields[part] = Number(m[i + 1])))
  let { year } = fields
  const { month, day } = fields
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const value = toSerial(
    year,
    month,
    day,
    Number(m[4] ?? 0),
    Number(m[5] ?? 0),
    Number(m[6] ?? 0),
  )
  // A day the month does not have, such as 31/02, is not a date.
  if (fromSerial(value).day !== day) return null
  return { value, format: { type: m[4] ? 'datetime' : 'date' } }
}

// The styles a set of typed or pasted dates add: a date format on each cell
// that has no format yet. Null when there is nothing to add.
function dateStyles(
  dates: Array<{ key: string; format: TSpreadsheetNumberFormat }>,
): TSpreadsheetStyles | null {
  let next: TSpreadsheetStyles | null = null
  for (const { key, format } of dates) {
    if (styles.value[key]?.format) continue
    next ??= { ...styles.value }
    next[key] = { ...styles.value[key], format }
  }
  return next
}

// `typed` is a value a person typed, in which a formula is in the sheet's
// syntax. A pasted formula is already canonical: the sheet copied it.
function parseInput(
  col: ISpreadsheetColumn,
  input: string,
  typed = false,
): unknown {
  if (col.parse) return col.parse(input)
  const text = input.trim()
  if (typed && formulasOn.value && text.length > 1 && text.startsWith('='))
    return toCanonical(text, formulaSyntax.value)
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
  if (sheetMode.value) return textOf(row.id, col.id)
  const format = stylesOn.value
    ? styles.value[styleKeyOf(row.id, col.id)]?.format
    : undefined
  if (format && typeof raw === 'number')
    return formatNumber(raw, format, props.locale)
  return defaultFormat(col, raw)
}

function cellClass(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  const attrs = cellAttrsFor(row, col)
  const isFocused =
    focused.value?.rowId === row.id && focused.value?.columnId === col.id
  const lines = selectionLines(row.id, col.id)
  const look = cellLook(row.id, col.id)
  const alignClass =
    look?.align ??
    col.align ??
    (sheetMode.value
      ? typeof shownValue(row.id, col.id) === 'number'
        ? 'right'
        : 'left'
      : col.type === 'number' || col.type === 'date'
        ? 'right'
        : 'left')
  return {
    [`nb-spreadsheet__cell--${alignClass}`]: true,
    'nb-spreadsheet__cell--focused': isFocused,
    'nb-spreadsheet__cell--selected': lines.selected,
    'nb-spreadsheet__cell--edge-top': lines.top,
    'nb-spreadsheet__cell--edge-bottom': lines.bottom,
    'nb-spreadsheet__cell--edge-left': lines.left,
    'nb-spreadsheet__cell--edge-right': lines.right,
    'nb-spreadsheet__cell--readonly': isReadOnly(row, col),
    'nb-spreadsheet__cell--computed': !!attrs.computed || !!row.computed,
    'nb-spreadsheet__cell--pinned-top': row.pinned === 'top',
    'nb-spreadsheet__cell--pinned-bottom': row.pinned === 'bottom',
    'nb-spreadsheet__cell--fill': isCellInFill(row.id, col.id),
    'nb-spreadsheet__cell--fill-anchor': isFillHandleCell(row.id, col.id),
    'nb-spreadsheet__cell--bold': !!look?.bold,
    'nb-spreadsheet__cell--italic': !!look?.italic,
    'nb-spreadsheet__cell--underline': !!look?.underline,
    'nb-spreadsheet__cell--strike': !!look?.strike,
    [`nb-spreadsheet__cell--intent-${look?.intent}`]: !!look?.intent,
    'nb-spreadsheet__cell--error':
      sheetMode.value && isSheetError(shownValue(row.id, col.id)),
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
  const tooltip = cellAttrsFor(row, col).tooltip
  if (tooltip !== undefined) return tooltip
  // An error's code says little on its own, so its reason is the tooltip.
  const value = sheetMode.value ? shownValue(row.id, col.id) : undefined
  return isSheetError(value) ? value.message : ''
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
  return {
    'nb-spreadsheet__header--letters': kind === 'letters',
    'nb-spreadsheet__header--stacked': headerRows.value.length === 2,
    'nb-spreadsheet__header--sortable': kind === 'label' && !!col.sortable,
    'nb-spreadsheet__header--sorted': sortBy.value?.columnId === col.id,
    'nb-spreadsheet__header--selected': isColumnInSelection(ci),
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
  // A merge's first cell spans the whole range.
  const merge = viewMerges.value.length
    ? mergeAt(row.__virtualIndex, ci)
    : undefined
  if (merge)
    return {
      gridRow: `${gridRow} / span ${merge.r2 - merge.r1 + 1}`,
      gridColumn: `${baseCol} / span ${merge.c2 - merge.c1 + 1}`,
      ...sticky,
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
function boundsOf(sel: ISpreadsheetSelection | null): IBounds | null {
  if (!sel) return null
  const r1 = rowIndex.value.get(sel.startRowId) ?? -1
  const r2 = rowIndex.value.get(sel.endRowId) ?? -1
  const c1 = colIndex.value.get(sel.startColumnId) ?? -1
  const c2 = colIndex.value.get(sel.endColumnId) ?? -1
  if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return null
  return expandToMerges({
    r1: Math.min(r1, r2),
    r2: Math.max(r1, r2),
    c1: Math.min(c1, c2),
    c2: Math.max(c1, c2),
  })
}

const selectionBounds = computed(() => boundsOf(selection.value))

// Cmd/Ctrl-click adds a range, as desktop spreadsheets do. The ranges added
// before the current one are kept here, and `selection` stays the range the
// active cell is in. Any plain click or move drops them.
const extraSelections = ref<ISpreadsheetSelection[]>([])

const allSelectionBounds = computed(() => {
  const out: IBounds[] = []
  for (const sel of extraSelections.value) {
    const b = boundsOf(sel)
    if (b) out.push(b)
  }
  if (selectionBounds.value) out.push(selectionBounds.value)
  return out
})

function isPositionSelected(ri: number, ci: number): boolean {
  for (const b of allSelectionBounds.value) {
    if (ri >= b.r1 && ri <= b.r2 && ci >= b.c1 && ci <= b.c2) return true
  }
  return false
}

function isCellInSelection(rowId: string, columnId: string): boolean {
  return isPositionSelected(
    rowIndex.value.get(rowId) ?? -1,
    colIndex.value.get(columnId) ?? -1,
  )
}

// The lines a cell draws so the ranges read as boxes: ranges that touch
// share one, and each range on its own gets its own. A cell owns the grid
// lines on its right and bottom, so it draws those wherever the selection
// starts or stops across them, on either side. The first column and row have
// no cell before them to draw their left and top edges, so they draw them.
function selectionLines(rowId: string, columnId: string) {
  const ri = rowIndex.value.get(rowId) ?? -1
  const ci = colIndex.value.get(columnId) ?? -1
  const here = isPositionSelected(ri, ci)
  // A merged cell's lines are on the far side of the whole range.
  const merge = mergeAt(ri, ci)
  const right = merge ? merge.c2 : ci
  const bottom = merge ? merge.r2 : ri
  return {
    selected: here,
    right: here !== isPositionSelected(ri, right + 1),
    bottom: here !== isPositionSelected(bottom + 1, ci),
    left: here && ci === 0,
    top: here && ri === 0,
  }
}

function isRowInSelection(rowId: string): boolean {
  const ri = rowIndex.value.get(rowId) ?? -1
  return allSelectionBounds.value.some((b) => ri >= b.r1 && ri <= b.r2)
}

function isColumnInSelection(ci: number): boolean {
  return allSelectionBounds.value.some((b) => ci >= b.c1 && ci <= b.c2)
}

// Keeps the current range as an added one, before a Cmd/Ctrl-click starts
// the next.
function keepRange() {
  if (selection.value)
    extraSelections.value = [...extraSelections.value, selection.value]
}

function setFocus(
  rowId: string,
  columnId: string,
  extendSelection = false,
  add = false,
) {
  if (add) keepRange()
  else if (!extendSelection) extraSelections.value = []
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
  mode: 'new' | 'add' | 'extend' = 'new',
) {
  if (mode === 'add') keepRange()
  else if (mode === 'new') extraSelections.value = []
  focused.value = { rowId: anchorRowId, columnId: anchorColumnId }
  selection.value = start
  emit('focus', focused.value)
  emit('selection', selection.value)
}

function selectColumns(columnId: string, extend = false, add = false) {
  const rows = allRows.value
  if (!rows.length) return
  const anchor =
    extend && selection.value ? selection.value.startColumnId : columnId
  selectRange(
    rows[0].id,
    anchor,
    {
      startRowId: rows[0].id,
      startColumnId: anchor,
      endRowId: rows[rows.length - 1].id,
      endColumnId: columnId,
    },
    extend ? 'extend' : add ? 'add' : 'new',
  )
}

function selectRows(rowId: string, extend = false, add = false) {
  const cols = orderedColumns.value
  if (!cols.length) return
  const anchor = extend && selection.value ? selection.value.startRowId : rowId
  selectRange(
    anchor,
    cols[0].id,
    {
      startRowId: anchor,
      startColumnId: cols[0].id,
      endRowId: rowId,
      endColumnId: cols[cols.length - 1].id,
    },
    extend ? 'extend' : add ? 'add' : 'new',
  )
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
  // A formula waiting for an operand takes the cell as a reference, and the
  // edit stays open.
  if (editing.value && canPoint()) {
    e.preventDefault()
    pointFromMouse(row, col, e)
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
  setFocus(row.id, col.id, e.shiftKey, !e.shiftKey && (e.metaKey || e.ctrlKey))
  focusScroller()
  e.preventDefault()
  document.addEventListener('mouseup', stopSelecting, { once: true })
  if (tapOnActive && !isReadOnly(row, col)) {
    startEdit(row, col, editText(row.id, col.id), 'edit')
  }
}

function onCellMouseEnter(row: ISpreadsheetRow, col: ISpreadsheetColumn) {
  if (fillTarget.value) {
    onFillEnter(row.id, col.id)
    return
  }
  if (pointing.value?.dragging) {
    point(
      {
        ri: rowIndex.value.get(row.id) ?? 0,
        ci: colIndex.value.get(col.id) ?? 0,
      },
      true,
    )
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
  startEdit(row, col, editText(row.id, col.id), 'edit')
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
  else selectColumns(col.id, e.shiftKey, e.metaKey || e.ctrlKey)
}

function onGutterMouseDown(e: MouseEvent, row: ISpreadsheetRow) {
  if (e.button !== 0) return
  if (editing.value) commitEdit()
  focusScroller()
  selectRows(row.id, e.shiftKey, e.metaKey || e.ctrlKey)
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
  let ri = rowIndex.value.get(focused.value.rowId) ?? 0
  let ci = colIndex.value.get(focused.value.columnId) ?? 0
  // From a merged cell, a move starts at the edge it is going out of.
  const from = mergeAt(ri, ci)
  if (from) {
    if (dRow > 0) ri = from.r2
    if (dCol > 0) ci = from.c2
  }
  let nri = Math.max(0, Math.min(rows.length - 1, ri + dRow))
  let nci = Math.max(0, Math.min(orderedColumns.value.length - 1, ci + dCol))
  // And a move into a merge lands on its first cell.
  const into = mergeAt(nri, nci)
  if (into) {
    nri = into.r1
    nci = into.c1
  }
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
  // Bold, italic and underline, the keys every editor shares, in sheet mode
  // and in a table whose styles are bound.
  const styleKey = { b: 'bold', i: 'italic', u: 'underline' } as const
  const lower = e.key.toLowerCase()
  if (
    mod &&
    stylesOn.value &&
    !e.shiftKey &&
    !e.altKey &&
    (lower === 'b' || lower === 'i' || lower === 'u')
  ) {
    e.preventDefault()
    toggleStyle(styleKey[lower])
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
      extraSelections.value = []
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
        startEdit(fc.r, fc.c, editText(fc.r.id, fc.c.id), 'edit')
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
  editing.value = {
    rowId: row.id,
    columnId: col.id,
    draft,
    mode,
    source: 'cell',
  }
  pointing.value = null
  assist.value = null
  signature.value = null
  void nextTick(() => {
    const input = editorRef.value
    if (!input) return
    void nextTick(updateAssist)
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
  if (onAssistKeydown(e)) return
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
  pointing.value = null
  assist.value = null
  signature.value = null
  let value: unknown
  try {
    value = parseInput(col, draft, true)
  } catch {
    if (refocus) focusScroller()
    return
  }
  const before = rawValue(rowId, columnId)
  const date =
    sheetMode.value && typeof value === 'number' ? readDate(draft) : null
  const nextStyles = date
    ? dateStyles([{ key: cellRef(rowId, columnId), format: date.format }])
    : null
  if (!sameValue(before, value) || nextStyles) {
    const change = makeChange(rowId, columnId, before, value)
    const changes = sameValue(before, value) ? [] : [change]
    pushUndo(changes, nextStyles ? { styles: [styles.value, nextStyles] } : {})
    if (changes.length) applyChanges(changes)
    if (nextStyles) styles.value = nextStyles
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
// Every selected cell, once, across the added ranges too.
function selectedCells(): Array<{ rowId: string; columnId: string }> {
  const rows = allRows.value
  const cols = orderedColumns.value
  const seen = new Set<string>()
  const out: Array<{ rowId: string; columnId: string }> = []
  for (const b of allSelectionBounds.value) {
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = `${r}:${c}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ rowId: rows[r].id, columnId: cols[c].id })
      }
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

// What this sheet last put on the clipboard, and from where. Pasting the
// same text back moves its formulas by the distance pasted, and brings the
// copied cells' styles, as a desktop spreadsheet does. A cut moves both: the
// formulas unchanged, and the styles off the cells they came from.
let lastCopy: {
  text: string
  r: number
  c: number
  cut: boolean
  styles: Array<Array<ISpreadsheetCellStyle | undefined>>
  keys: string[]
} | null = null

function onCopy(e: ClipboardEvent) {
  const text = selectionText()
  if (text === null) return
  e.preventDefault()
  e.clipboardData?.setData('text/plain', text)
  const b = selectionBounds.value
  if (!b || (!sheetMode.value && !stylesOn.value)) return
  const rows = allRows.value
  const cols = orderedColumns.value
  const at = sheetMode.value
    ? sheetPosition(rows[b.r1].id, cols[b.c1].id)
    : { r: 0, c: 0 }
  const copied: Array<Array<ISpreadsheetCellStyle | undefined>> = []
  const keys: string[] = []
  for (let r = b.r1; r <= b.r2; r++) {
    const line: Array<ISpreadsheetCellStyle | undefined> = []
    for (let c = b.c1; c <= b.c2; c++) {
      const key = styleKeyOf(rows[r].id, cols[c].id)
      keys.push(key)
      line.push(stylesOn.value ? styles.value[key] : undefined)
    }
    copied.push(line)
  }
  lastCopy = { text, r: at.r, c: at.c, cut: false, styles: copied, keys }
}

function onCut(e: ClipboardEvent) {
  onCopy(e)
  if (lastCopy) lastCopy.cut = true
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
  const at = sheetMode.value
    ? sheetPosition(focused.value.rowId, focused.value.columnId)
    : null
  const ours = lastCopy && lastCopy.text === text ? lastCopy : null
  const shift =
    at && ours && !ours.cut ? { r: at.r - ours.r, c: at.c - ours.c } : null
  // The styles the paste brings: the copied cells' own, and a date format
  // for a date read from text that came from elsewhere.
  let nextStyles: TSpreadsheetStyles | null = null
  if (ours?.cut && stylesOn.value) {
    for (const key of ours.keys) {
      if (!styles.value[key]) continue
      nextStyles ??= { ...styles.value }
      delete nextStyles[key]
    }
  }
  const pastedDates: Array<{ key: string; format: TSpreadsheetNumberFormat }> =
    []
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
      if (shift && formulasOn.value && isFormula(value))
        value = shiftFormula(value, shift.r, shift.c)
      if (ours && stylesOn.value) {
        const key = styleKeyOf(rowId, columnId)
        const style = ours.styles[dr]?.[dc]
        const current = (nextStyles ?? styles.value)[key]
        if (!sameStyle(current, style)) {
          nextStyles ??= { ...styles.value }
          if (style) nextStyles[key] = style
          else delete nextStyles[key]
        }
      } else if (sheetMode.value && typeof value === 'number') {
        const date = readDate(cellText)
        if (date)
          pastedDates.push({
            key: cellRef(rowId, columnId),
            format: date.format,
          })
      }
      const before = rawValue(rowId, columnId)
      if (sameValue(before, value)) return
      changes.push(makeChange(rowId, columnId, before, value))
    })
  })
  if (pastedDates.length) {
    const base = nextStyles ?? styles.value
    for (const { key, format } of pastedDates) {
      if (base[key]?.format) continue
      nextStyles ??= { ...styles.value }
      nextStyles[key] = { ...base[key], format }
    }
  }
  if (changes.length === 0 && !nextStyles) return
  pushUndo(changes, nextStyles ? { styles: [styles.value, nextStyles] } : {})
  if (changes.length) applyChanges(changes)
  if (nextStyles) styles.value = nextStyles
  // A cut pastes once: the cells it came from are empty now.
  if (ours?.cut) lastCopy = null
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
// A fill works from one range, so the handle and the keys stand down while
// ranges have been added.
const fillEnabled = computed(
  () =>
    (props.fillHandle ?? sheetMode.value) && extraSelections.value.length === 0,
)

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

// A formula copied from one view position to another, its relative
// references moved by the distance between them, as a desktop spreadsheet
// moves them. Anything else is returned as it is.
function movedFormula(
  value: unknown,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): unknown {
  if (!formulasOn.value || !isFormula(value)) return value
  const rows = allRows.value
  const cols = orderedColumns.value
  if (!rows[fromRow] || !rows[toRow] || !cols[fromCol] || !cols[toCol])
    return value
  const a = sheetPosition(rows[fromRow].id, cols[fromCol].id)
  const b = sheetPosition(rows[toRow].id, cols[toCol].id)
  return shiftFormula(value, b.r - a.r, b.c - a.c)
}

// Fills `target`, which extends `source` along one axis.
function fillRange(source: IBounds, target: IBounds) {
  const rows = allRows.value
  const cols = orderedColumns.value
  const changes: ISpreadsheetChange[] = []
  // A fill copies each source cell's style along with its value.
  let nextStyles: TSpreadsheetStyles | null = null
  const write = (
    ri: number,
    ci: number,
    value: unknown,
    fromRi: number,
    fromCi: number,
  ) => {
    const row = rows[ri]
    const col = cols[ci]
    if (!row || !col || isReadOnly(row, col)) return
    const before = rawValue(row.id, col.id)
    const after = value === undefined ? null : value
    if (!sameValue(before, after))
      changes.push(makeChange(row.id, col.id, before, after))
    if (!stylesOn.value) return
    const style = styles.value[styleKeyOf(rows[fromRi].id, cols[fromCi].id)]
    const key = styleKeyOf(row.id, col.id)
    if (sameStyle(styles.value[key], style)) return
    nextStyles ??= { ...styles.value }
    if (style) nextStyles[key] = style
    else delete nextStyles[key]
  }
  const vertical = target.r1 !== source.r1 || target.r2 !== source.r2
  if (vertical) {
    const backward = target.r1 < source.r1
    const count = backward ? source.r1 - target.r1 : target.r2 - source.r2
    for (let c = source.c1; c <= source.c2; c++) {
      const src: unknown[] = []
      for (let r = source.r1; r <= source.r2; r++)
        src.push(rawValue(rows[r].id, cols[c].id))
      const k = source.r2 - source.r1 + 1
      seriesValues(src, count, backward).forEach((v, i) => {
        const to = backward ? source.r1 - 1 - i : source.r2 + 1 + i
        const from = backward ? source.r2 - (i % k) : source.r1 + (i % k)
        write(to, c, movedFormula(v, from, c, to, c), from, c)
      })
    }
  } else {
    const backward = target.c1 < source.c1
    const count = backward ? source.c1 - target.c1 : target.c2 - source.c2
    if (count <= 0) return
    for (let r = source.r1; r <= source.r2; r++) {
      const src: unknown[] = []
      for (let c = source.c1; c <= source.c2; c++)
        src.push(rawValue(rows[r].id, cols[c].id))
      const k = source.c2 - source.c1 + 1
      seriesValues(src, count, backward).forEach((v, i) => {
        const to = backward ? source.c1 - 1 - i : source.c2 + 1 + i
        const from = backward ? source.c2 - (i % k) : source.c1 + (i % k)
        write(r, to, movedFormula(v, r, from, r, to), r, from)
      })
    }
  }
  const restyled = nextStyles as TSpreadsheetStyles | null
  if (!changes.length && !restyled) return
  pushUndo(changes, restyled ? { styles: [styles.value, restyled] } : {})
  if (changes.length) applyChanges(changes)
  if (restyled) styles.value = restyled
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
    const kept = extraSelections.value.filter((sel) => boundsOf(sel))
    if (kept.length !== extraSelections.value.length)
      extraSelections.value = kept
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
    extraSelections.value = []
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

// ─── Formula editing ───────────────────────────────────────────────────────
// A formula is typed in the sheet's own syntax: in a locale with a decimal
// comma, `=SUM(A1;1,5)`. The cells keep the canonical text, `=SUM(A1,1.5)`,
// so a sheet reads the same whatever the locale of the person who wrote it.
const formulaSyntax = computed(() => syntaxForLocale(props.locale))

const showFormulaBar = computed(
  () => sheetMode.value && (props.formulaBar ?? formulasOn.value),
)

// The text a cell opens with for editing: a formula as written, in the
// sheet's syntax, and anything else as it is stored.
function editText(rowId: string, columnId: string): string {
  const raw = rawValue(rowId, columnId)
  if (raw === null || raw === undefined) return ''
  if (formulasOn.value && isFormula(raw))
    return toLocalized(raw, formulaSyntax.value)
  return String(raw)
}

const isFormulaDraft = computed(
  () => formulasOn.value && !!editing.value?.draft.startsWith('='),
)

// The input being typed into: the cell's editor or the formula bar.
function activeInput(): HTMLInputElement | null {
  if (!editing.value) return null
  return editing.value.source === 'bar' ? barRef.value : editorRef.value
}

// ── References in the draft ──
// Each reference in a formula being edited has a colour, the same in the
// text and on the grid, as in a desktop spreadsheet. The same reference
// written twice keeps one colour.
const REF_COLOURS = 8

const draftRefs = computed(() => {
  if (!isFormulaDraft.value || !editing.value) return []
  const colours = new Map<string, number>()
  return referencesIn(editing.value.draft, formulaSyntax.value).map((ref) => {
    const key = ref.text.replace(/\$/g, '').toUpperCase()
    if (!colours.has(key)) colours.set(key, (colours.size % REF_COLOURS) + 1)
    return { ...ref, colour: colours.get(key)! }
  })
})

// The draft as coloured runs, for the layer behind the input's text.
const draftRuns = computed(() => {
  if (!isFormulaDraft.value || !editing.value) return []
  const text = editing.value.draft
  const runs: Array<{ text: string; colour: number }> = []
  let at = 0
  for (const ref of draftRefs.value) {
    if (ref.start > at)
      runs.push({ text: text.slice(at, ref.start), colour: 0 })
    runs.push({ text: text.slice(ref.start, ref.end), colour: ref.colour })
    at = ref.end
  }
  if (at < text.length) runs.push({ text: text.slice(at), colour: 0 })
  return runs
})

// The first and last shown row or column of a stretch of the sheet, as view
// positions. Hidden ones are skipped, and a whole column stops at the end.
function viewStretch(
  from: number,
  to: number,
  size: number,
  indexOf: (i: number) => number | undefined,
): [number, number] | null {
  const last = Math.min(to, size - 1)
  let a: number | undefined
  let b: number | undefined
  for (let i = from; i <= last && a === undefined; i++) a = indexOf(i)
  for (let i = last; i >= from && b === undefined; i--) b = indexOf(i)
  return a === undefined || b === undefined ? null : [a, b]
}

// Boxes on the grid over the cells the draft refers to.
const refBoxes = computed(() => {
  const out: Array<{
    key: string
    colour: number
    style: Record<string, string>
  }> = []
  const head = headerRows.value.length
  for (const ref of draftRefs.value) {
    const rows = viewStretch(
      ref.range.r1,
      ref.range.r2,
      sheetSize.value.rows,
      (i) => rowIndex.value.get(String(i + 1)),
    )
    const cols = viewStretch(
      ref.range.c1,
      ref.range.c2,
      sheetSize.value.columns,
      (i) => colIndex.value.get(indexToLetters(i)),
    )
    if (!rows || !cols) continue
    out.push({
      key: `${ref.start}`,
      colour: ref.colour,
      style: {
        gridRow: `${rows[0] + 1 + head} / span ${rows[1] - rows[0] + 1}`,
        gridColumn: `${colOffset.value + 1 + cols[0]} / span ${cols[1] - cols[0] + 1}`,
      },
    })
  }
  return out
})

// An input's text scrolls inside it, and its coloured layer follows.
const draftScroll = ref({ cell: 0, bar: 0 })
function onDraftScroll(e: Event) {
  const input = e.target as HTMLInputElement
  draftScroll.value = {
    ...draftScroll.value,
    [input === barRef.value ? 'bar' : 'cell']: input.scrollLeft,
  }
}

// The combobox attributes both inputs carry while formulas are on.
const assistAria = computed(() => {
  if (!formulasOn.value) return {}
  return {
    role: 'combobox',
    'aria-autocomplete': 'list' as const,
    'aria-expanded': !!assist.value,
    'aria-controls': assist.value ? assistId : undefined,
    'aria-activedescendant': assist.value
      ? `${assistId}-${assist.value.active}`
      : undefined,
    'aria-describedby': signature.value ? `${assistId}-signature` : undefined,
  }
})

// ── Pointing ──
// While a formula waits for an operand, a click on a cell, or an arrow key
// in a cell opened by typing, writes that cell's reference into the formula
// instead of leaving it. A drag, or Shift with the arrows, makes it a range.
// Pointing again straight away replaces the reference just written.
const pointing = ref<{
  start: number
  end: number
  anchor: { ri: number; ci: number }
  cursor: { ri: number; ci: number }
  dragging: boolean
} | null>(null)

// After `=`, an opening bracket, a separator or an operator, a formula
// wants an operand, and that is where a reference can go.
function wantsOperand(text: string, caret: number): boolean {
  const before = text.slice(0, caret).trimEnd()
  if (!before.startsWith('=')) return false
  const last = before[before.length - 1]
  return (
    '=(+-*/^&<>,;:'.includes(last) || last === formulaSyntax.value.separator
  )
}

function canPoint(): boolean {
  const input = activeInput()
  if (!isFormulaDraft.value || !input || !editing.value) return false
  const caret = input.selectionStart ?? editing.value.draft.length
  if (pointing.value && caret === pointing.value.end) return true
  return wantsOperand(editing.value.draft, caret)
}

function refTextAt(ri: number, ci: number): string {
  const row = allRows.value[ri]
  const col = orderedColumns.value[ci]
  return row && col ? cellRef(row.id, col.id) : ''
}

// Writes the pointed cell or range into the draft, over the last pointed
// reference when the caret is still right after it.
function point(cursor: { ri: number; ci: number }, extend: boolean) {
  const input = activeInput()
  if (!editing.value || !input) return
  const text = editing.value.draft
  const caret = input.selectionStart ?? text.length
  const again = pointing.value && caret === pointing.value.end
  const start = again ? pointing.value!.start : caret
  const end = again ? pointing.value!.end : caret
  const anchor = extend && again ? pointing.value!.anchor : cursor
  const a = refTextAt(anchor.ri, anchor.ci)
  const b = refTextAt(cursor.ri, cursor.ci)
  if (!a || !b) return
  const r1 = Math.min(anchor.ri, cursor.ri)
  const r2 = Math.max(anchor.ri, cursor.ri)
  const c1 = Math.min(anchor.ci, cursor.ci)
  const c2 = Math.max(anchor.ci, cursor.ci)
  const written =
    r1 === r2 && c1 === c2
      ? refTextAt(r1, c1)
      : `${refTextAt(r1, c1)}:${refTextAt(r2, c2)}`
  editing.value.draft = text.slice(0, start) + written + text.slice(end)
  const next = start + written.length
  pointing.value = {
    start,
    end: next,
    anchor,
    cursor,
    dragging: pointing.value?.dragging ?? false,
  }
  void nextTick(() => {
    input.setSelectionRange(next, next)
    updateAssist()
  })
}

function pointFromKey(dRow: number, dCol: number, extend: boolean): boolean {
  if (!canPoint() || !editing.value) return false
  const from = pointing.value?.cursor ?? {
    ri: rowIndex.value.get(editing.value.rowId) ?? 0,
    ci: colIndex.value.get(editing.value.columnId) ?? 0,
  }
  const ri = Math.max(0, Math.min(allRows.value.length - 1, from.ri + dRow))
  const ci = Math.max(
    0,
    Math.min(orderedColumns.value.length - 1, from.ci + dCol),
  )
  point({ ri, ci }, extend)
  return true
}

function pointFromMouse(
  row: ISpreadsheetRow,
  col: ISpreadsheetColumn,
  e: MouseEvent,
) {
  const ri = rowIndex.value.get(row.id) ?? 0
  const ci = colIndex.value.get(col.id) ?? 0
  point({ ri, ci }, e.shiftKey)
  if (pointing.value) pointing.value.dragging = true
  document.addEventListener(
    'mouseup',
    () => {
      if (pointing.value) pointing.value.dragging = false
    },
    { once: true },
  )
}

// ── Functions as they are typed ──
// A name being typed offers the functions that start with it, and the caret
// inside a function's brackets shows how the function is called.
const assist = ref<{
  items: IFormulaFunction[]
  active: number
  start: number
  end: number
} | null>(null)
const signature = ref<{ fn: IFormulaFunction; arg: number } | null>(null)
const assistPosition = ref<{ left: number; top: number } | null>(null)
const assistId = `${baseId}-functions`

function updateAssist() {
  const input = activeInput()
  if (!input || !isFormulaDraft.value || !editing.value) {
    assist.value = null
    signature.value = null
    return
  }
  const text = editing.value.draft
  const caret = input.selectionStart ?? text.length
  const tokens = tokenize(text, formulaSyntax.value)
  const atCaret = tokens.find(
    (t) => t.end === caret && (t.type === 'name' || t.type === 'function'),
  )
  const items =
    atCaret && /^[A-Za-z][A-Za-z0-9.]*$/.test(atCaret.text)
      ? findFunctions(atCaret.text).slice(0, 8)
      : []
  assist.value =
    items.length &&
    !(
      items.length === 1 &&
      items[0].name === atCaret!.text.toUpperCase() &&
      text[caret] === '('
    )
      ? {
          items,
          active: Math.min(assist.value?.active ?? 0, items.length - 1),
          start: atCaret!.start,
          end: atCaret!.end,
        }
      : null
  // The innermost open call before the caret, and which argument it is on.
  const stack: Array<{ name: string | null; arg: number }> = []
  let previous: (typeof tokens)[number] | undefined
  // Separators inside an array's braces part its values, not the call's.
  let braces = 0
  for (const t of tokens) {
    if (t.start >= caret) break
    if (t.text === '{') braces++
    else if (t.text === '}') braces = Math.max(0, braces - 1)
    else if (braces) continue
    else if (t.type === 'paren' && t.text === '(')
      stack.push({
        name:
          previous?.type === 'function' ? previous.text.toUpperCase() : null,
        arg: 0,
      })
    else if (t.type === 'paren' && t.text === ')') stack.pop()
    else if (t.type === 'separator' && stack.length)
      stack[stack.length - 1].arg++
    if (t.type !== 'whitespace') previous = t
  }
  const open = stack[stack.length - 1]
  const fn = open?.name
    ? FORMULA_FUNCTIONS.find((f) => f.name === open.name)
    : undefined
  signature.value = fn && !assist.value ? { fn, arg: open!.arg } : null
  const rect = input.getBoundingClientRect()
  assistPosition.value = { left: rect.left, top: rect.bottom + 2 }
}

function acceptAssist(index = assist.value?.active ?? 0) {
  const a = assist.value
  const input = activeInput()
  if (!a || !editing.value || !input) return
  const name = a.items[index].name
  const text = editing.value.draft
  const tail = text.slice(a.end)
  const written = tail.startsWith('(') ? name : `${name}(`
  editing.value.draft = text.slice(0, a.start) + written + tail
  const caret = a.start + written.length + (tail.startsWith('(') ? 1 : 0)
  assist.value = null
  void nextTick(() => {
    input.focus({ preventScroll: true })
    input.setSelectionRange(caret, caret)
    updateAssist()
  })
}

// The keys the list and pointing take before the editor's own. True when
// the key was used.
function onAssistKeydown(e: KeyboardEvent): boolean {
  const a = assist.value
  if (a) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      a.active = (a.active + step + a.items.length) % a.items.length
      return true
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      acceptAssist()
      return true
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      assist.value = null
      return true
    }
  }
  const arrows: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  }
  const move = arrows[e.key]
  if (
    move &&
    editing.value?.mode === 'enter' &&
    !e.altKey &&
    !e.metaKey &&
    !e.ctrlKey
  ) {
    if (pointFromKey(move[0], move[1], e.shiftKey)) {
      e.preventDefault()
      return true
    }
  }
  return false
}

// Typing anything ends pointing: the next reference is a new one.
function onDraftInput() {
  pointing.value = null
  void nextTick(updateAssist)
}

function partOfSignature(fn: IFormulaFunction, arg: number) {
  const open = fn.syntax.indexOf('(')
  const close = fn.syntax.lastIndexOf(')')
  if (open < 0 || close < open) return [{ text: fn.syntax, current: false }]
  const params = fn.syntax.slice(open + 1, close).split(/,\s*/)
  // A variadic function's last listed parameter stands for the rest.
  const current = Math.min(arg, params.length - 1)
  const parts: Array<{ text: string; current: boolean }> = [
    { text: fn.syntax.slice(0, open + 1), current: false },
  ]
  params.forEach((p, i) => {
    if (i)
      parts.push({ text: `${formulaSyntax.value.separator} `, current: false })
    parts.push({ text: p, current: i === current })
  })
  parts.push({ text: fn.syntax.slice(close), current: false })
  return parts
}

// ── The formula bar ──
const barRef = useTemplateRef<HTMLInputElement>('barRef')

const nameBoxText = computed(() => {
  const b = selectionBounds.value
  if (!b || !focused.value) return ''
  if (b.r1 === b.r2 && b.c1 === b.c2)
    return cellRef(focused.value.rowId, focused.value.columnId)
  return `${refTextAt(b.r1, b.c1)}:${refTextAt(b.r2, b.c2)}`
})

const barText = computed(() => {
  if (editing.value) return editing.value.draft
  const fc = focused.value
  return fc ? editText(fc.rowId, fc.columnId) : ''
})

const barEditable = computed(() => {
  const fc = focusedCell()
  return !!fc && !isReadOnly(fc.r, fc.c)
})

// Focusing the bar opens the active cell for editing there, and the cell
// shows the draft as it is typed.
function onBarFocus() {
  if (editing.value) {
    editing.value.source = 'bar'
    return
  }
  const fc = focusedCell()
  if (!fc || isReadOnly(fc.r, fc.c)) return
  editing.value = {
    rowId: fc.r.id,
    columnId: fc.c.id,
    draft: editText(fc.r.id, fc.c.id),
    mode: 'edit',
    source: 'bar',
  }
}

function onBarInput(e: Event) {
  if (!editing.value) return
  editing.value.draft = (e.target as HTMLInputElement).value
  onDraftInput()
}

// Moving between the bar and the cell's editor keeps the edit open.
function onEditorBlur(e: FocusEvent) {
  const to = e.relatedTarget
  if (to && (to === barRef.value || to === editorRef.value)) return
  assist.value = null
  signature.value = null
  commitEdit(false)
}

function onEditorFocus(source: 'cell' | 'bar') {
  if (editing.value) editing.value.source = source
}

// ─── Undo / redo ───────────────────────────────────────────────────────────
function pushUndo(
  changes: ISpreadsheetChange[],
  layout: Omit<IUndoStep, 'changes'> = {},
) {
  undoStack.value.push({ changes, ...layout })
  redoStack.value = []
}

function undo() {
  const step = undoStack.value.pop()
  if (!step) return
  if (step.changes.length)
    applyChanges(
      step.changes.map((ch) => ({ ...ch, before: ch.after, after: ch.before })),
    )
  if (step.styles) styles.value = step.styles[0]
  if (step.merges) merges.value = step.merges[0]
  redoStack.value.push(step)
}

function redo() {
  const step = redoStack.value.pop()
  if (!step) return
  if (step.changes.length) applyChanges(step.changes)
  if (step.styles) styles.value = step.styles[1]
  if (step.merges) merges.value = step.merges[1]
  undoStack.value.push(step)
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

// The sheet never takes the focus on its own: a page decides where the
// keyboard starts, and the exposed `focus` is there for one that wants it here.
onMounted(() => {
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
  focus: (rowId: string, columnId: string) => {
    setFocus(rowId, columnId)
    focusScroller()
  },
  undo,
  redo,
  getSelection: () => selection.value,
  getSelections: () =>
    [...extraSelections.value, selection.value].filter(
      (s): s is ISpreadsheetSelection => !!s,
    ),
  selectAll,
  selectColumn: (columnId: string) => selectColumns(columnId),
  selectRow: (rowId: string) => selectRows(rowId),
  hideColumns,
  showColumns,
  hideRows,
  showRows,
  applyStyle,
  clearStyles,
  merge: mergeSelection,
  unmerge: unmergeSelection,
  exportCsv,
  importCsv,
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

// The ring around the whole grid shows only until a cell is active. From
// then on the active cell's own ring is where the focus is.
.nb-spreadsheet__scroller:focus-visible:not(.nb-spreadsheet__scroller--active) {
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

// Each range is boxed in the focus ring's colour, on the grid lines
// themselves (see selectionLines).
.nb-spreadsheet__cell--edge-right {
  border-right-color: var(--nbss-focus-ring);
}
.nb-spreadsheet__cell--edge-bottom {
  border-bottom-color: var(--nbss-focus-ring);
}
.nb-spreadsheet__cell--edge-top {
  box-shadow: inset 0 1px 0 var(--nbss-focus-ring);
}
.nb-spreadsheet__cell--edge-left {
  box-shadow: inset 1px 0 0 var(--nbss-focus-ring);
}
.nb-spreadsheet__cell--edge-top.nb-spreadsheet__cell--edge-left {
  box-shadow:
    inset 0 1px 0 var(--nbss-focus-ring),
    inset 1px 0 0 var(--nbss-focus-ring);
}

// Active cell: inset 2px focus ring, no offset, no jump on focus. Doubled
// up to win over the range's edge lines.
.nb-spreadsheet__cell.nb-spreadsheet__cell--focused {
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

// Sheet mode's cell styles. Colours are intents, painted with the library's
// status surface pairs, so they hold their contrast in both themes. A
// selected cell keeps the selection's tint over its colour.
.nb-spreadsheet__cell--bold {
  font-weight: 600;
}
.nb-spreadsheet__cell--italic {
  font-style: italic;
}
.nb-spreadsheet__cell--underline > span {
  text-decoration-line: underline;
}
.nb-spreadsheet__cell--strike > span {
  text-decoration-line: line-through;
}
.nb-spreadsheet__cell--underline.nb-spreadsheet__cell--strike > span {
  text-decoration-line: underline line-through;
}
@each $intent in neutral, info, success, warning, danger {
  .nb-spreadsheet__cell--intent-#{$intent}:not(
    .nb-spreadsheet__cell--selected
  ) {
    background: var(--nb-c-#{$intent}-surface);
    color: var(--nb-c-on-#{$intent}-surface);
  }
}
// A formula that could not be worked out shows its error code, in the
// danger colour, with the reason as the tooltip.
.nb-spreadsheet__cell--error {
  color: var(--nb-c-danger-a11y, var(--nb-c-danger));
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

// ─── Formulas ────────────────────────────────────────────────────────────
// The formula bar: the reference, then the contents, on the toolbar's
// surface with a hairline under it.
.nb-spreadsheet__formula-bar {
  display: flex;
  align-items: stretch;
  min-height: var(--nbss-header-height);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
}
.nb-spreadsheet__name-box {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 5rem;
  padding: 0 var(--nbss-cell-padding-x);
  border-right: 1px solid var(--nb-c-border);
  font-variant-numeric: tabular-nums;
  color: var(--nb-c-text);
}
.nb-spreadsheet__fx {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  font-style: italic;
  color: var(--nb-c-text-muted);
  border-right: 1px solid var(--nb-c-border);
}
.nb-spreadsheet__bar-field {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
}
.nb-spreadsheet__bar-input,
.nb-spreadsheet__mirror--bar {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  padding: 0 var(--nbss-cell-padding-x);
  background: transparent;
  color: var(--nb-c-text);
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.nb-spreadsheet__bar-input {
  position: relative;
  outline: none;
}
.nb-spreadsheet__bar-input:focus-visible {
  box-shadow: inset 0 0 0 2px var(--nbss-focus-ring);
}
.nb-spreadsheet__mirror--bar {
  position: absolute;
  inset: 0;
}

// The coloured layer behind a formula's text. It has the input's box and
// font, so its runs sit exactly under the input's transparent characters.
.nb-spreadsheet__mirror {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: pre;
  pointer-events: none;
}
.nb-spreadsheet__mirror > span {
  display: inline-block;
}
.nb-spreadsheet__input--formula {
  background: transparent;
  color: transparent;
  caret-color: var(--nb-c-text);
}
.nb-spreadsheet__input--formula::selection {
  color: transparent;
}

// The references' colours are the chart palette, which is built to tell
// eight series apart in either theme.
@for $i from 1 through 8 {
  .nb-spreadsheet__ref--#{$i} {
    --nbss-ref: var(--nb-c-chart-#{$i});
    color: var(--nbss-ref);
  }
}
.nb-spreadsheet__ref-box {
  position: relative;
  z-index: 3;
  pointer-events: none;
  border: 2px solid var(--nbss-ref);
  background: color-mix(in srgb, var(--nbss-ref) 12%, transparent);
}

// The function list and the call hint, as a menu surface.
.nb-spreadsheet__assist {
  position: fixed;
  z-index: 1000;
  max-width: 28rem;
  background: var(--nb-c-surface-raised, var(--nb-c-surface));
  color: var(--nb-c-text);
  border: 1px solid var(--nb-c-border);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: var(--nb-type-body-compact-size);
}
.nb-spreadsheet__assist-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}
.nb-spreadsheet__assist-option {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
}
.nb-spreadsheet__assist-option--active,
.nb-spreadsheet__assist-option:hover {
  background: var(--nb-c-surface-hover, var(--nb-c-surface));
}
.nb-spreadsheet__assist-name {
  font-weight: 600;
  flex: 0 0 auto;
}
.nb-spreadsheet__assist-description {
  color: var(--nb-c-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nb-spreadsheet__signature {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.375rem 0.75rem;
}

// iOS zooms into any field whose text is under 16px.
@include bp.phone-touch {
  .nb-spreadsheet__editor {
    font-size: var(--nb-type-body-lg-size);
  }
}
</style>
