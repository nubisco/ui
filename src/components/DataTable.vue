<template>
  <div
    :class="[
      'nb-data-table',
      `nb-data-table--${size}`,
      { 'nb-data-table--zebra': zebra },
      { 'nb-data-table--sticky': stickyHeader },
      { 'nb-data-table--fill': fill },
      { 'nb-data-table--stacked': stacked },
      { 'nb-data-table--stacked-headless': stacked && !stackedHead },
      { 'nb-data-table--expandable': hasExpandColumn },
    ]"
    v-bind="layerProps"
  >
    <!-- Toolbar, laid out as Carbon's: the title and description on their
         own at the top, then a strip of tools along the right with the last
         button flush in its corner. While rows are selected the batch bar
         covers that strip and nothing else, so the title stays readable and
         the rows below do not move: the strip keeps its height whichever of
         the two is showing. -->
    <div v-if="showToolbar" class="nb-data-table__toolbar">
      <div v-if="hasHeading" class="nb-data-table__toolbar-heading">
        <slot name="toolbar" :selected-count="selectedCount">
          <h2 v-if="title" class="nb-data-table__title">{{ title }}</h2>
          <p v-if="description" class="nb-data-table__description">
            {{ description }}
          </p>
        </slot>
      </div>
      <div v-if="hasToolsRow" class="nb-data-table__toolbar-row">
        <div
          v-if="$slots.search || $slots['toolbar-actions']"
          class="nb-data-table__toolbar-tools"
          :class="{ 'nb-data-table__toolbar-tools--search': !!$slots.search }"
          :inert="showBatchBar || undefined"
          :aria-hidden="showBatchBar || undefined"
        >
          <div v-if="$slots.search" class="nb-data-table__toolbar-search">
            <slot name="search" />
          </div>
          <slot name="toolbar-actions" />
        </div>

        <!-- Batch action bar, shown over the tools while rows are selected -->
        <div
          v-if="showBatchBar"
          class="nb-data-table__batch"
          role="region"
          aria-label="Table batch actions"
        >
          <span class="nb-data-table__batch-count">
            {{ selectedCount }} selected
          </span>
          <div class="nb-data-table__batch-actions">
            <slot
              name="batch-actions"
              :selected-keys="selectedKeys"
              :clear="clearSelection"
            />
          </div>
          <NbButton
            class="nb-data-table__batch-cancel"
            variant="ghost"
            :size="toolbarControlSize"
            @click="clearSelection"
          >
            Cancel
          </NbButton>
        </div>
      </div>
    </div>

    <!-- Scroll container: horizontal scroll for wide tables, vertical for sticky header -->
    <div class="nb-data-table__scroll">
      <table
        class="nb-data-table__table"
        :role="stacked ? 'table' : undefined"
        :aria-label="ariaLabel || title || undefined"
        :aria-busy="loading || undefined"
      >
        <colgroup>
          <col v-if="hasExpandColumn" class="nb-data-table__col-expand" />
          <col v-if="hasSelectColumn" class="nb-data-table__col-select" />
          <col
            v-for="col in visibleColumns"
            :key="`col-${col.key}`"
            :style="colStyle(col)"
          />
          <col v-if="hasRowActions" class="nb-data-table__col-actions" />
        </colgroup>

        <thead
          class="nb-data-table__head"
          :role="stacked ? 'rowgroup' : undefined"
        >
          <tr :role="stacked ? 'row' : undefined">
            <th
              v-if="hasExpandColumn"
              scope="col"
              class="nb-data-table__th nb-data-table__expand-cell"
            >
              <span class="nb-sr-only">Row details</span>
            </th>
            <th
              v-if="hasSelectColumn"
              scope="col"
              class="nb-data-table__th nb-data-table__select-cell"
            >
              <NbCheckbox
                v-if="selectable === 'multiple'"
                :model-value="allSelected"
                :indeterminate="someSelected"
                aria-label="Select all rows"
                @update:model-value="toggleAll"
              />
            </th>

            <th
              v-for="col in visibleColumns"
              :key="`th-${col.key}`"
              scope="col"
              :class="[
                'nb-data-table__th',
                `nb-data-table__th--${col.align || 'left'}`,
                { 'nb-data-table__th--sortable': col.sortable },
                { 'nb-data-table__th--sorted': isSorted(col) },
                stacked && col.phoneHidden && 'nb-data-table__th--phone-hidden',
              ]"
              :aria-sort="col.sortable ? ariaSortFor(col) : undefined"
            >
              <button
                v-if="col.sortable"
                type="button"
                class="nb-data-table__sort"
                @click="onSort(col)"
              >
                <span class="nb-data-table__th-label">
                  <slot :name="`header-${col.key}`" :column="col">
                    {{ col.header }}
                  </slot>
                </span>
                <NbIcon
                  :name="sortIcon(col)"
                  class="nb-data-table__sort-icon"
                  aria-hidden="true"
                />
              </button>
              <span v-else class="nb-data-table__th-label">
                <slot :name="`header-${col.key}`" :column="col">
                  {{ col.header }}
                </slot>
              </span>
            </th>

            <th
              v-if="hasRowActions"
              scope="col"
              class="nb-data-table__th nb-data-table__actions-cell"
            >
              <span class="nb-sr-only">Row actions</span>
            </th>
          </tr>
        </thead>

        <tbody
          class="nb-data-table__body"
          :role="stacked ? 'rowgroup' : undefined"
        >
          <!-- Loading: skeleton rows -->
          <template v-if="loading">
            <tr
              v-for="n in skeletonRows"
              :key="`skeleton-${n}`"
              class="nb-data-table__row nb-data-table__row--skeleton"
            >
              <td v-if="hasExpandColumn" class="nb-data-table__td" />
              <td v-if="hasSelectColumn" class="nb-data-table__td">
                <span
                  class="nb-data-table__skeleton nb-data-table__skeleton--box"
                />
              </td>
              <td
                v-for="col in visibleColumns"
                :key="`sk-${n}-${col.key}`"
                class="nb-data-table__td"
              >
                <span class="nb-data-table__skeleton" />
              </td>
              <td v-if="hasRowActions" class="nb-data-table__td">
                <span
                  class="nb-data-table__skeleton nb-data-table__skeleton--box"
                />
              </td>
            </tr>
          </template>

          <!-- Error state -->
          <tr v-else-if="error" class="nb-data-table__state-row">
            <td
              :colspan="totalColumns"
              class="nb-data-table__state nb-data-table__state--error"
            >
              <slot name="error" :error="error">
                <!-- The flex row lives on an inner NbGrid, never on the <td>.
                     A table cell set to `display: flex` drops out of the table
                     layout algorithm, so its colspan stops stretching it and
                     the content centres against the wrong box. -->
                <NbGrid
                  is="span"
                  align="center"
                  justify="center"
                  gap="xs"
                  class="nb-data-table__state-inner"
                >
                  <NbIcon name="warning-circle-fill" aria-hidden="true" />
                  <span>{{ error }}</span>
                </NbGrid>
              </slot>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-else-if="!rows.length" class="nb-data-table__state-row">
            <td
              :colspan="totalColumns"
              class="nb-data-table__state nb-data-table__state--empty"
            >
              <slot name="empty">
                <span>{{ emptyMessage || 'No data to display' }}</span>
              </slot>
            </td>
          </tr>

          <!-- Data rows -->
          <template v-else>
            <template v-for="(row, rowIndex) in rows" :key="keyFor(row)">
              <tr
                :class="[
                  'nb-data-table__row',
                  { 'nb-data-table__row--selected': isSelected(row) },
                  { 'nb-data-table__row--clickable': clickableRows },
                  hasExpandColumn && {
                    'nb-data-table__row--expanded': isExpanded(row),
                    'nb-data-table__row--even': rowIndex % 2 === 1,
                  },
                ]"
                :role="stacked ? 'row' : undefined"
                :aria-selected="
                  selectable !== 'none' ? isSelected(row) : undefined
                "
                :tabindex="clickableRows ? 0 : undefined"
                @click="onRowClick(row, rowIndex)"
                @keydown="onRowKeydown($event, row, rowIndex)"
                @keyup="onRowKeyup($event, row, rowIndex)"
              >
                <td
                  v-if="hasExpandColumn"
                  class="nb-data-table__td nb-data-table__expand-cell"
                  :role="stacked ? 'cell' : undefined"
                  @click.stop
                >
                  <button
                    type="button"
                    class="nb-data-table__expand"
                    :aria-expanded="isExpanded(row)"
                    :aria-controls="
                      isExpanded(row) ? detailId(rowIndex) : undefined
                    "
                    :aria-label="detailLabel(row, rowIndex)"
                    @click="toggleExpanded(row)"
                  >
                    <NbIcon
                      :name="iconCaretRight"
                      class="nb-data-table__expand-icon"
                      aria-hidden="true"
                    />
                  </button>
                </td>
                <td
                  v-if="hasSelectColumn"
                  class="nb-data-table__td nb-data-table__select-cell"
                  @click.stop
                  @mousedown="noteRangeModifier"
                  @keydown="noteRangeModifier"
                >
                  <NbCheckbox
                    v-if="selectable === 'multiple'"
                    :model-value="isSelected(row)"
                    :aria-label="`Select row ${rowIndex + 1}`"
                    @update:model-value="toggleRow(row, rowIndex)"
                  />
                  <input
                    v-else
                    type="radio"
                    class="nb-data-table__radio"
                    :name="radioName"
                    :checked="isSelected(row)"
                    :aria-label="`Select row ${rowIndex + 1}`"
                    @change="selectSingle(row)"
                  />
                </td>

                <td
                  v-for="col in visibleColumns"
                  :key="`td-${keyFor(row)}-${col.key}`"
                  :class="[
                    'nb-data-table__td',
                    `nb-data-table__td--${col.align || 'left'}`,
                    col.cellClass,
                    stacked && phoneCellClass(col),
                  ]"
                  :role="stacked ? 'cell' : undefined"
                  :data-label="stackOnPhone ? col.header : undefined"
                >
                  <slot
                    :name="`cell-${col.key}`"
                    :row="row"
                    :value="valueOf(col, row)"
                    :column="col"
                    :row-index="rowIndex"
                  >
                    <RenderCell
                      v-if="col.render"
                      :column="col"
                      :row="row"
                      :row-index="rowIndex"
                    />
                    <template v-else>{{
                      formatValue(valueOf(col, row))
                    }}</template>
                  </slot>
                </td>

                <td
                  v-if="hasRowActions"
                  class="nb-data-table__td nb-data-table__actions-cell"
                  @click.stop
                >
                  <slot name="row-actions" :row="row" :row-index="rowIndex" />
                </td>
              </tr>
              <!-- The row's detail: a full-width row directly under it, only
                 while expanded. The region inside the cell, not the cell, is
                 what the toggle controls, so the cell stays a table cell. -->
              <tr
                v-if="isExpanded(row)"
                class="nb-data-table__detail-row"
                :role="stacked ? 'row' : undefined"
              >
                <td
                  :colspan="totalColumns"
                  class="nb-data-table__detail-cell"
                  :role="stacked ? 'cell' : undefined"
                >
                  <div
                    :id="detailId(rowIndex)"
                    class="nb-data-table__detail"
                    role="region"
                    :aria-label="detailLabel(row, rowIndex)"
                  >
                    <slot name="row-detail" :row="row" :row-index="rowIndex" />
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Footer: NbPagination or any custom footer content -->
    <div v-if="$slots.footer" class="nb-data-table__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
  generic="T extends Record<string, unknown> = Record<string, unknown>"
>
import type { TIconSource } from '@/types/Glyph.d'
import * as iconArrowsDownUp from '@nubisco/ui/icons/arrows-down-up'
import * as iconArrowUp from '@nubisco/ui/icons/arrow-up'
import * as iconArrowDown from '@nubisco/ui/icons/arrow-down'
import * as iconCaretRight from '@nubisco/ui/icons/caret-right'
import {
  computed,
  getCurrentInstance,
  ref,
  useId,
  useSlots,
  watch,
  type FunctionalComponent,
} from 'vue'
import type {
  IDataTableColumn,
  IDataTableProps,
  IDataTableSortState,
  TSortDirection,
} from './DataTable.d'
import NbCheckbox from './Checkbox.vue'
import NbIcon from './Icon.vue'
import NbButton from './Button.vue'
import NbGrid from './Grid.vue'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'

const props = withDefaults(defineProps<IDataTableProps<T>>(), {
  size: 'lg',
  sortState: null,
  selectable: 'none',
  selected: () => [],
  loading: false,
  skeletonRows: 5,
  error: undefined,
  emptyMessage: undefined,
  stickyHeader: true,
  zebra: false,
  fill: false,
  title: undefined,
  description: undefined,
  ariaLabel: undefined,
  stackOnPhone: false,
  expanded: () => [],
})

// The table paints the surface its toolbar, header and rows sit on, so it takes
// the current layer and deepens anything rendered into its cells.
const { layerProps } = useSurfaceLayer()

const emit = defineEmits<{
  sort: [state: IDataTableSortState]
  'update:selected': [keys: (string | number)[]]
  'row-click': [row: T, rowIndex: number]
  'update:expanded': [keys: (string | number)[]]
}>()

const slots = useSlots()
const radioName = `nb-data-table-select-${useId()}`

// The toolbar strip and the batch bar match the row height, up to 48px: an
// `xl` table keeps a 48px toolbar, as Carbon's does. The batch bar's Cancel
// takes the same size so it fills the bar.
const toolbarControlSize = computed(() =>
  props.size === 'xl' ? 'lg' : props.size,
)

// #region columns
const visibleColumns = computed(() =>
  props.columns.filter((col) => !col.hidden),
)

const hasSelectColumn = computed(() => props.selectable !== 'none')
const hasRowActions = computed(() => !!slots['row-actions'])
const hasExpandColumn = computed(() => !!slots['row-detail'])

const totalColumns = computed(
  () =>
    visibleColumns.value.length +
    (hasExpandColumn.value ? 1 : 0) +
    (hasSelectColumn.value ? 1 : 0) +
    (hasRowActions.value ? 1 : 0),
)

// #region phone
// Opt-in, and on a phone only: each row becomes a card. The table is still a
// table to assistive tech (the roles restore what `display` takes away), and
// off a phone, or without the prop, not one attribute of the markup changes.
const { phone } = usePhoneLayout()
const stacked = computed(() => props.stackOnPhone && phone.value)

// The row's title. The column marked `primary`, or else the first one that is
// neither hidden nor meta, so a table opted in with no other markup still
// reads as a list of named things.
const primaryKey = computed(
  () =>
    (
      visibleColumns.value.find((col) => col.primary) ??
      visibleColumns.value.find((col) => !col.phoneHidden && !col.phoneMeta)
    )?.key,
)

function phoneCellClass(col: IDataTableColumn<T>): string {
  if (col.phoneHidden) return 'nb-data-table__td--phone-hidden'
  if (col.key === primaryKey.value) return 'nb-data-table__td--primary'
  if (col.phoneMeta) return 'nb-data-table__td--meta'
  return 'nb-data-table__td--field'
}

// The header shrinks to what still works on a card: the sortable headers, as
// a row of sort chips, and the select-all box. With neither, or with no rows
// to act on, it goes entirely.
const stackedHead = computed(
  () =>
    !props.loading &&
    !props.error &&
    props.rows.length > 0 &&
    (props.selectable === 'multiple' ||
      visibleColumns.value.some((col) => col.sortable && !col.phoneHidden)),
)
// #endregion

function colStyle(col: IDataTableColumn<T>) {
  if (col.width == null) return undefined
  const width = typeof col.width === 'number' ? `${col.width}px` : col.width
  return { width }
}
// #endregion

// #region values
function valueOf(col: IDataTableColumn<T>, row: T): unknown {
  return row[col.key as keyof T]
}

function formatValue(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

// Functional component that renders a column's `render` function. Kept out of
// the template's expression position so vue-tsc is happy with the VNode return.
const RenderCell: FunctionalComponent<{
  column: IDataTableColumn<T>
  row: T
  rowIndex: number
}> = (cellProps) =>
  cellProps.column.render?.(
    cellProps.row,
    valueOf(cellProps.column, cellProps.row),
    cellProps.rowIndex,
  ) ?? null
RenderCell.props = ['column', 'row', 'rowIndex']
// #endregion

// #region identity + selection
function keyFor(row: T): string | number {
  const rk = props.rowKey
  if (typeof rk === 'function') return rk(row)
  return row[rk] as string | number
}

const selectedSet = computed(() => new Set(props.selected))
const selectedKeys = computed(() => props.selected)
const selectedCount = computed(() => props.selected.length)

function isSelected(row: T): boolean {
  return selectedSet.value.has(keyFor(row))
}

// Keys of the rows currently rendered (a single page in server-side paging).
const pageKeys = computed(() => props.rows.map((row) => keyFor(row)))
const allSelected = computed(
  () =>
    pageKeys.value.length > 0 &&
    pageKeys.value.every((k) => selectedSet.value.has(k)),
)
const someSelected = computed(
  () =>
    !allSelected.value && pageKeys.value.some((k) => selectedSet.value.has(k)),
)

// Anchor for shift-range selection: the last row toggled WITHOUT shift.
// It deliberately survives shift-clicks so repeated shift-clicks re-range
// from the same origin, the way file lists behave.
const rangeAnchor = ref<number | null>(null)
// Whether the interaction currently in flight had shift held. Captured from
// the pointer/key event because NbCheckbox's update:model-value carries no
// original event.
let rangeExtend = false

function noteRangeModifier(event: MouseEvent | KeyboardEvent) {
  rangeExtend = event.shiftKey
}

// A page change invalidates row indices, so drop the anchor with it.
watch(pageKeys, () => {
  rangeAnchor.value = null
})

function toggleRow(row: T, rowIndex: number) {
  const key = keyFor(row)
  const next = new Set(props.selected)
  // The clicked row decides the direction; the range follows it, so
  // shift-clicking a selected row clears the whole span.
  const selecting = !next.has(key)
  const anchor = rangeAnchor.value

  const apply = (target: string | number) => {
    if (selecting) next.add(target)
    else next.delete(target)
  }

  if (rangeExtend && anchor !== null && anchor !== rowIndex) {
    const from = Math.min(anchor, rowIndex)
    const to = Math.max(anchor, rowIndex)
    for (let i = from; i <= to; i++) {
      const target = props.rows[i]
      if (target) apply(keyFor(target))
    }
  } else {
    apply(key)
    rangeAnchor.value = rowIndex
  }

  rangeExtend = false
  emit('update:selected', [...next])
}

function selectSingle(row: T) {
  emit('update:selected', [keyFor(row)])
}

// Add/remove every row on the current page, preserving off-page selections.
function toggleAll() {
  const next = new Set(props.selected)
  if (allSelected.value) {
    pageKeys.value.forEach((k) => next.delete(k))
  } else {
    pageKeys.value.forEach((k) => next.add(k))
  }
  emit('update:selected', [...next])
}

function clearSelection() {
  emit('update:selected', [])
}

// Whether this table can EVER raise the batch bar, regardless of the current
// selection. Used to reserve the toolbar strip up front.
const canShowBatchBar = computed(
  () => props.selectable !== 'none' && !!slots['batch-actions'],
)
const showBatchBar = computed(
  () => canShowBatchBar.value && selectedCount.value > 0,
)
// #endregion

// #region expansion
// Opt-in through the `#row-detail` slot, and controlled like selection: the
// toggle emits the next set of keys and the table shows what `expanded` holds.
const detailIdBase = `nb-data-table-detail-${useId()}`
const expandedSet = computed(() => new Set(props.expanded))

function isExpanded(row: T): boolean {
  return hasExpandColumn.value && expandedSet.value.has(keyFor(row))
}

function toggleExpanded(row: T) {
  const key = keyFor(row)
  const next = props.expanded.filter((k) => k !== key)
  if (next.length === props.expanded.length) next.push(key)
  emit('update:expanded', next)
}

function detailId(rowIndex: number): string {
  return `${detailIdBase}-${rowIndex}`
}

// Names both the toggle and the region it opens after the row's title (the
// same column a phone card uses as its title), so a screen reader hears which
// row's details these are, not "row 3".
function detailLabel(row: T, rowIndex: number): string {
  const col = visibleColumns.value.find((c) => c.key === primaryKey.value)
  const title = col ? formatValue(valueOf(col, row)).trim() : ''
  return `Details for ${title || `row ${rowIndex + 1}`}`
}
// #endregion

// #region toolbar
// The heading (title, description or a custom `#toolbar`) and the strip of
// tools are separate rows, and each renders only when it has something in it.
const hasHeading = computed(
  () => !!props.title || !!props.description || !!slots.toolbar,
)
// `canShowBatchBar`, not `showBatchBar`: a table with batch actions but no
// tools would otherwise grow a strip the moment the first row is selected,
// reintroducing exactly the reflow the overlay avoids. Reserving the strip up
// front keeps the geometry identical in both states.
const hasToolsRow = computed(
  () => !!slots.search || !!slots['toolbar-actions'] || canShowBatchBar.value,
)
const showToolbar = computed(() => hasHeading.value || hasToolsRow.value)
// #endregion

// #region sorting
function isSorted(col: IDataTableColumn<T>): boolean {
  return (
    !!props.sortState &&
    props.sortState.key === col.key &&
    props.sortState.direction !== 'none'
  )
}

function ariaSortFor(
  col: IDataTableColumn<T>,
): 'ascending' | 'descending' | 'none' {
  if (!isSorted(col)) return 'none'
  return props.sortState!.direction === 'asc' ? 'ascending' : 'descending'
}

function sortIcon(col: IDataTableColumn<T>): TIconSource {
  if (!isSorted(col)) return iconArrowsDownUp
  return props.sortState!.direction === 'asc' ? iconArrowUp : iconArrowDown
}

// Cycle none → asc → desc → none, matching Carbon.
function nextDirection(current: TSortDirection): TSortDirection {
  if (current === 'asc') return 'desc'
  if (current === 'desc') return 'none'
  return 'asc'
}

function onSort(col: IDataTableColumn<T>) {
  const current =
    props.sortState && props.sortState.key === col.key
      ? props.sortState.direction
      : 'none'
  emit('sort', { key: col.key, direction: nextDirection(current) })
}
// #endregion

// #region rows
// Rows get the pointer affordance only when the host is listening for clicks.
const instance = getCurrentInstance()
const clickableRows = computed(() => !!instance?.vnode.props?.onRowClick)

function onRowClick(row: T, rowIndex: number) {
  emit('row-click', row, rowIndex)
}

// A clickable row is in the tab order and answers the keys a button does:
// Enter on keydown, Space on keyup, with the keydown cancelled so Space does
// not scroll the page. Only a key pressed on the row itself counts. A key
// typed into a checkbox, a button or a field inside the row is that
// control's, and bubbles up here without activating the row.
function isOwnKey(event: KeyboardEvent): boolean {
  return (
    clickableRows.value &&
    event.target === event.currentTarget &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  )
}

function onRowKeydown(event: KeyboardEvent, row: T, rowIndex: number) {
  if (!isOwnKey(event)) return
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!event.repeat) onRowClick(row, rowIndex)
  } else if (event.key === ' ') {
    event.preventDefault()
  }
}

function onRowKeyup(event: KeyboardEvent, row: T, rowIndex: number) {
  if (!isOwnKey(event) || event.key !== ' ') return
  event.preventDefault()
  onRowClick(row, rowIndex)
}
// #endregion
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

.nb-data-table {
  /*
   * Carbon's data table, mapped onto our tokens. Carbon names the colours by
   * role, and each role lands on the token that plays it here:
   *
   *   $layer                 --nb-c-surface (the layer this table paints)
   *   $layer-hover           --nb-c-surface-hover
   *   $layer-accent          --nb-dt-accent: the surface one step toward
   *                          --nb-c-contrast, darker in light, lighter in dark
   *   $layer-accent-hover    --nb-dt-accent-hover, one step further
   *   $layer-selected        --nb-dt-accent, as Carbon's own themes have it
   *   $border-subtle         --nb-c-border (the layer ramp's border is the
   *                          one scripts/audit-contrast.mjs measures against
   *                          Carbon's border-subtle)
   *   $text-primary          --nb-c-text
   *   $text-secondary        --nb-c-text-muted
   *
   * and the type: heading-03 (the title, 20px) is our heading-02 type set,
   * heading-compact-01 (the header, 14px semibold) is label-lg, and
   * body-compact-01 (description and cells, 14px regular) is body-md.
   */
  --nb-dt-accent: color-mix(
    in srgb,
    var(--nb-c-contrast) 10%,
    var(--nb-c-surface)
  );
  --nb-dt-accent-hover: color-mix(
    in srgb,
    var(--nb-c-contrast) 16%,
    var(--nb-c-surface)
  );
  // Carbon's sizes. Every one keeps the same 16px cell padding and 14px type:
  // only the row height changes.
  --nb-dt-row-height: calc(var(--nb-base-unit) * 6);
  --nb-dt-toolbar-height: calc(var(--nb-base-unit) * 6);
  --nb-dt-cell-pad-x: var(--nb-spacing-16);
  --nb-dt-font-size: var(--nb-type-body-md-size);

  display: flex;
  flex-direction: column;
  width: 100%;
  // Carbon draws no box around a table: the layer it paints is the edge.
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
  /*
   * The shell is a panel-role surface. `overflow: hidden` is what makes the
   * corner work: the toolbar, the sticky header and the footer are attached
   * surfaces that run to the shell's edges, so they are clipped by its corner
   * rather than each needing a corner of their own. That is also why they
   * must not round themselves: two rounded boxes meeting at a shared edge
   * leave a visible notch.
   */
  @include radius.surface(panel);
  overflow: hidden;
  font-size: var(--nb-dt-font-size);
  line-height: var(--nb-type-body-md-line-height);

  // Density
  &--xs {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 3);
    --nb-dt-toolbar-height: calc(var(--nb-base-unit) * 3);
  }
  &--sm {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 4);
    --nb-dt-toolbar-height: calc(var(--nb-base-unit) * 4);
  }
  &--md {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 5);
    --nb-dt-toolbar-height: calc(var(--nb-base-unit) * 5);
  }
  // Extra large is for two lines of content, so the cells sit at the top
  // with Carbon's 16px above them instead of centring one line in 64px.
  &--xl {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 8);
  }

  // ── Toolbar ──────────────────────────────────────────────
  &__toolbar {
    display: flex;
    flex-direction: column;
  }

  // Carbon's title block: 16px above, 24px below, 16px at the sides.
  &__toolbar-heading {
    min-width: 0;
    padding: var(--nb-spacing-16) var(--nb-dt-cell-pad-x) var(--nb-spacing-24);
  }

  // Under the heading, not bare: a prose stylesheet around the table (a docs
  // page, a CMS body) styles every h2 and p it contains, and would otherwise
  // outrank a single class with its margins.
  &__toolbar-heading &__title {
    margin: 0;
    font-family: var(--nb-type-heading-02-family);
    font-size: var(--nb-type-heading-02-size);
    font-weight: var(--nb-type-heading-02-weight);
    line-height: var(--nb-type-heading-02-line-height);
    letter-spacing: var(--nb-type-heading-02-letter-spacing);
    color: var(--nb-c-text);
  }

  &__toolbar-heading &__description {
    margin: var(--nb-spacing-2) 0 0;
    font-size: var(--nb-type-body-md-size);
    line-height: var(--nb-type-body-md-line-height);
    color: var(--nb-c-text-muted);
  }

  // The strip of tools. It is as tall as a row (48px at most) and its
  // buttons fill that height, so the last one sits flush in the corner over
  // the header, the way Carbon's primary button does.
  &__toolbar-row {
    position: relative; // containing block for the batch overlay
    display: flex;
    min-height: var(--nb-dt-toolbar-height);
  }

  &__toolbar-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: flex-end;
    flex: 1 1 auto;
    min-width: 0;

    // The buttons in the strip: full height, square corners where they meet
    // the header and each other, icon-only ones square. An action group
    // passed in is laid out the same way.
    > :deep(.nb-button),
    > :deep(.nb-action-group > .nb-button) {
      height: auto;
      min-height: var(--nb-dt-toolbar-height);
      border-radius: 0;
    }

    > :deep(.nb-button--icon-only),
    > :deep(.nb-action-group > .nb-button--icon-only) {
      width: var(--nb-dt-toolbar-height);
    }

    > :deep(.nb-action-group) {
      align-items: stretch;
      gap: 0;
    }
  }

  // A search field takes whatever width the buttons leave, and moves to a
  // line of its own when that is too little (a phone, a narrow card).
  &__toolbar-search {
    display: flex;
    align-items: center;
    flex: 1 1 16rem;
    min-width: 0;
    padding-inline: var(--nb-dt-cell-pad-x) var(--nb-spacing-8);

    > :deep(*) {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  // Batch action bar (selection mode). Carbon overlays the tools with a solid
  // brand-filled bar and inverse content, so selection mode is unmistakable.
  // Overlay, not a sibling in flow: covering the strip leaves its height (and
  // therefore every row below it) exactly where it was. Its buttons fill its
  // height like the tools do, and Cancel sits flush in the corner.
  &__batch {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: stretch;
    gap: var(--nb-spacing-16);
    padding-inline-start: var(--nb-dt-cell-pad-x);
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);

    :deep(.nb-button) {
      height: auto;
      min-height: var(--nb-dt-toolbar-height);
      border-radius: 0;
    }
  }

  &__batch-count {
    display: flex;
    align-items: center;
    font-weight: var(--nb-font-weight-semibold);
    color: inherit;
  }

  &__batch-actions {
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    flex: 1;
  }

  // Ghost-on-brand: inherit the bar's inverse foreground rather than the
  // ghost variant's default text colour, which is tuned for the surface.
  &__batch-cancel,
  &__batch-actions :deep(.nb-button--ghost) {
    color: inherit;

    &:hover:not(:disabled) {
      background: var(--nb-c-primary-hover, rgb(255 255 255 / 0.16));
    }
  }

  // ── Scroll region ────────────────────────────────────────
  &__scroll {
    width: 100%;
    overflow: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }

  // ── Header ───────────────────────────────────────────────
  // Carbon's column header: $layer-accent, heading-compact-01, no rule under
  // it (the change of fill is the edge).
  &__th {
    height: var(--nb-dt-row-height);
    padding-inline: var(--nb-dt-cell-pad-x);
    text-align: left;
    font-size: var(--nb-type-label-lg-size);
    font-weight: var(--nb-type-label-lg-weight);
    line-height: var(--nb-type-label-lg-line-height);
    color: var(--nb-c-text);
    background: var(--nb-dt-accent);
    white-space: nowrap;
    vertical-align: middle;

    &--center {
      text-align: center;
    }
    &--right {
      text-align: right;
    }

    &--sortable {
      padding: 0;
    }
  }

  &__sort {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--nb-base-unit);
    width: 100%;
    height: var(--nb-dt-row-height);
    padding-inline: var(--nb-dt-cell-pad-x);
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--nb-dt-accent-hover);
    }
    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: -1px;
    }
  }

  &__th--center &__sort {
    justify-content: center;
  }
  &__th--right &__sort {
    flex-direction: row-reverse;
  }

  &__sort-icon {
    flex-shrink: 0;
    font-size: var(--nb-font-size-14);
    color: var(--nb-c-text-subtle);
    opacity: 0;
    transition: opacity 0.15s;
  }

  &__th--sortable:hover &__sort-icon {
    opacity: 1;
  }
  &__th--sorted &__sort-icon {
    opacity: 1;
    color: var(--nb-c-primary);
  }

  // ── Body ─────────────────────────────────────────────────
  // Carbon's row: $layer, body-compact-01 in $text-secondary, a
  // $border-subtle rule under every row and no vertical rules.
  &__td {
    height: var(--nb-dt-row-height);
    padding-inline: var(--nb-dt-cell-pad-x);
    padding-block: calc(var(--nb-base-unit) / 2);
    border-bottom: 1px solid var(--nb-c-border);
    vertical-align: middle;
    color: var(--nb-c-text-muted);

    &--center {
      text-align: center;
    }
    &--right {
      text-align: right;
    }
  }

  &__row {
    transition: background 0.15s;

    // Hovered and selected rows lift their text to $text-primary.
    &:hover .nb-data-table__td {
      background: var(--nb-c-surface-hover);
      color: var(--nb-c-text);
    }

    &--clickable {
      cursor: pointer;
    }

    // Inset, so the scroll region's overflow cannot clip it on the first and
    // last rows. Only on keyboard focus: a click on a row draws nothing.
    &--clickable:focus-visible {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }

    // Neutral, not a brand tint. A 10% --nb-c-primary wash read as an
    // unexplained violet. Selection is already signalled by the checkbox and
    // the batch bar. Carbon's $layer-selected is its $layer-accent, and
    // selected+hover goes one step further, so both stay hue-free.
    &--selected .nb-data-table__td {
      background: var(--nb-dt-accent);
      color: var(--nb-c-text);
    }

    &--selected:hover .nb-data-table__td {
      background: var(--nb-dt-accent-hover);
    }
  }

  // Zebra stripes take $layer-accent, as Carbon's do.
  &--zebra:not(&--expandable) &__row:nth-child(even) &__td {
    background: var(--nb-dt-accent);
  }
  // An open detail row is a sibling of the data rows, so it would flip the
  // parity of every row after it. An expandable table counts data rows only.
  &--zebra#{&}--expandable &__row--even &__td,
  &--zebra#{&}--expandable &__row--even + &__detail-row &__detail-cell {
    background: var(--nb-dt-accent);
  }
  &--zebra &__row:hover &__td {
    background: var(--nb-c-surface-hover);
  }
  &--zebra &__row--selected &__td {
    background: var(--nb-dt-accent-hover);
  }

  // Extra large rows hold two lines: the content starts 16px down.
  &--xl &__td {
    vertical-align: top;
    padding-top: var(--nb-spacing-16);
  }

  // ── Selection + actions columns ──────────────────────────
  &__col-select {
    width: calc(var(--nb-base-unit) * 6);
  }
  &__col-actions {
    width: calc(var(--nb-base-unit) * 6);
  }
  &__col-expand {
    width: calc(var(--nb-base-unit) * 6);
  }

  /*
   * The control columns must not be squeezable.
   *
   * A `width` on a <col> is a suggestion under `table-layout: auto`, not a
   * floor: as soon as another column asks for the remaining space, the browser
   * is free to compress these, and the select column collapsed from 48px to
   * 17px with the checkbox pressed up against the column divider. A min-width
   * on the cells is honoured, so the floor goes there.
   *
   * At the floor the control centres with even clearance either side, which
   * is what keeps it off the divider.
   */
  &__select-cell,
  &__actions-cell,
  &__expand-cell {
    text-align: center;
    white-space: nowrap;
    min-width: calc(var(--nb-base-unit) * 6);
  }

  &__select-cell {
    padding-inline: 0;
    width: calc(var(--nb-base-unit) * 6);
  }

  &__radio {
    width: 16px;
    height: 16px;
    accent-color: var(--nb-c-primary);
    cursor: pointer;
    margin: 0;
  }

  &__actions-cell {
    padding-inline: var(--nb-base-unit);
  }

  // ── Expandable rows ──────────────────────────────────────
  &__expand-cell {
    padding-inline: 0;
    width: calc(var(--nb-base-unit) * 6);
  }

  &__expand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--nb-base-unit) * 4);
    height: calc(var(--nb-base-unit) * 4);
    padding: 0;
    border: none;
    background: transparent;
    color: var(--nb-c-text-muted);
    @include radius.standalone(control);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;

    &:hover {
      background: var(--nb-c-surface-hover);
      color: var(--nb-c-text);
    }
    &:focus-visible {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }
  }

  &__expand-icon {
    font-size: var(--nb-font-size-14);
    transition: transform 0.15s;
  }

  &__expand[aria-expanded='true'] &__expand-icon {
    transform: rotate(90deg);
  }

  // The open row and its detail read as one unit: no rule between them, and
  // the detail carries the rule the row gave up.
  &__row--expanded &__td {
    border-bottom-color: transparent;
  }

  &__detail-cell {
    padding: calc(var(--nb-base-unit) * 1.5) var(--nb-dt-cell-pad-x);
    border-bottom: 1px solid var(--nb-c-border);
    color: var(--nb-c-text);
  }

  // ── Sticky header ────────────────────────────────────────
  &--sticky &__head &__th {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  // ── Fill ─────────────────────────────────────────────────
  // Opt-in via the `fill` prop: the table becomes a flex item that fills its
  // parent and scrolls internally, so a consumer drops it into a bounded
  // layout without writing any table-specific CSS.
  //
  // This only bites when an ancestor bounds the height, i.e. a flex column
  // with `min-height: 0` (NbShell's `.nb-shell__content-row` already is one).
  // Without that the parent grows to fit the rows and nothing scrolls.
  &--fill {
    flex: 1;
    min-height: 0;
  }

  // The scroll region takes the leftover space. `min-height: 0` lets it
  // shrink below its content, which is what moves the scrollbar onto the body
  // instead of the page, and what gives the sticky header something to stick
  // against.
  &--fill &__scroll {
    flex: 1;
    min-height: 0;
  }

  // Toolbar and footer keep their intrinsic height instead of being squeezed
  // as the body grows.
  &--fill &__toolbar,
  &--fill &__footer {
    flex: none;
  }

  // ── States ───────────────────────────────────────────────
  &__state {
    padding: calc(var(--nb-base-unit) * 6) var(--nb-dt-cell-pad-x);
    text-align: center;
    color: var(--nb-c-text-muted);

    :deep(*) {
      vertical-align: middle;
    }

    &--error {
      color: var(--nb-c-danger);
    }
  }

  // Inline so the cell's `text-align: center` still centres it, and the
  // cell itself stays a real table-cell honouring its colspan.
  &__state-inner {
    display: inline-flex;
  }

  // ── Skeleton loading ─────────────────────────────────────
  &__skeleton {
    display: block;
    height: 12px;
    width: 100%;
    max-width: 180px;
    background: linear-gradient(
      90deg,
      var(--nb-c-bg-soft) 25%,
      var(--nb-c-surface-hover) 37%,
      var(--nb-c-bg-soft) 63%
    );
    background-size: 400% 100%;
    animation: nb-data-table-shimmer 1.4s ease infinite;

    &--box {
      width: 16px;
      height: 16px;
      margin-inline: auto;
    }
  }

  // NbPagination brings its own top border. Pulled up by its width, it lands
  // on the last row's rule instead of doubling it.
  &__footer {
    position: relative;
    margin-top: -1px;
  }
}

// ── Stacked on a phone (stackOnPhone) ──────────────────────
// Each row becomes a card: the primary cell is its title, the meta cells share
// one muted line under it, and every other cell is a label and value pair read
// from `data-label`. The class only exists while the phone layout is on, and
// the rules are inside the phone query as well, so neither can reach a desktop.
//
// Flex rather than grid, because the meta cells need to sit side by side on
// one line however many there are. The `::before` of the row is a zero-height
// line break between the title line and the meta line.
@include bp.phone {
  .nb-data-table.nb-data-table--stacked {
    .nb-data-table__table,
    .nb-data-table__body {
      display: block;
    }

    // Widths were set for columns, and there are no columns any more.
    colgroup {
      display: none;
    }

    .nb-data-table__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      column-gap: var(--nb-spacing-12);
      padding: var(--nb-spacing-12) var(--nb-dt-cell-pad-x);
      border-bottom: 1px solid var(--nb-c-border);

      &::before {
        content: '';
        order: 2;
        flex-basis: 100%;
        height: 0;
      }

      // The row, not each cell, carries the hover and selected tints, or the
      // gaps between cells would show through.
      &:hover {
        background: var(--nb-c-surface-hover);
      }

      &--selected {
        background: var(--nb-dt-accent);
      }
    }

    .nb-data-table__body .nb-data-table__row:last-child {
      border-bottom: none;
    }

    // An expandable card: the toggle leads the title line, and the open
    // detail is a block straight under its card, inside the same rule.
    .nb-data-table__expand-cell {
      order: 1;
      flex: none;
      width: auto;
      min-width: 0;
    }

    .nb-data-table__row--expanded {
      border-bottom-color: transparent;
    }

    .nb-data-table__detail-row,
    .nb-data-table__detail-cell {
      display: block;
    }

    .nb-data-table__detail-cell {
      padding: 0 var(--nb-dt-cell-pad-x) var(--nb-spacing-12);
    }

    .nb-data-table__row .nb-data-table__td,
    .nb-data-table__row:hover .nb-data-table__td,
    .nb-data-table__row--selected .nb-data-table__td,
    &.nb-data-table--zebra .nb-data-table__row .nb-data-table__td {
      height: auto;
      min-width: 0;
      padding: 0;
      border: none;
      background: transparent;
      text-align: start;
    }

    // First line: the select control, the title, the row actions.
    .nb-data-table__select-cell,
    .nb-data-table__actions-cell {
      order: 1;
      flex: none;
      width: auto;
      min-width: 0;
    }

    .nb-data-table__td--primary {
      order: 1;
      flex: 1 1 0;
      font-weight: 600;
      overflow-wrap: break-word;
    }

    .nb-data-table__td--meta {
      order: 3;
      flex: 0 1 auto;
      margin-top: var(--nb-spacing-2);
      font-size: var(--nb-font-size-13);
      color: var(--nb-c-text-muted);
    }

    .nb-data-table__td--field {
      order: 4;
      display: flex;
      align-items: baseline;
      gap: var(--nb-spacing-8);
      flex-basis: 100%;
      margin-top: var(--nb-spacing-4);
      overflow-wrap: break-word;

      &[data-label]:not([data-label=''])::before {
        content: attr(data-label);
        flex: 0 0 min(40%, 8rem);
        font-size: var(--nb-font-size-13);
        color: var(--nb-c-text-muted);
      }
    }

    .nb-data-table__td--phone-hidden,
    .nb-data-table__th--phone-hidden {
      display: none;
    }

    // Skeleton rows have no column roles, so they stack as plain lines.
    .nb-data-table__row--skeleton .nb-data-table__td {
      flex-basis: 100%;
      order: 4;
    }

    // States are one cell spanning the table. As a block it no longer needs
    // the colspan, and it gets a compact height that fits a phone screen.
    .nb-data-table__state-row,
    .nb-data-table__state {
      display: block;
    }

    .nb-data-table__state {
      padding: var(--nb-spacing-24) var(--nb-dt-cell-pad-x);
    }

    // The header becomes a strip of sort chips (and the select-all box). The
    // strip, not each cell, is what sticks.
    .nb-data-table__head {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--nb-dt-accent);

      tr {
        display: flex;
        align-items: center;
        gap: var(--nb-spacing-4);
        padding: var(--nb-spacing-4) var(--nb-spacing-8);
        overflow-x: auto;
        scrollbar-width: none;
        overscroll-behavior-x: contain;
      }
    }

    .nb-data-table__th {
      display: none;
      position: static;
      height: auto;
      padding: 0;
      border: none;
      background: transparent;
    }

    .nb-data-table__th--sortable:not(.nb-data-table__th--phone-hidden),
    .nb-data-table__head .nb-data-table__select-cell {
      display: flex;
      flex: none;
      align-items: center;
    }

    .nb-data-table__head .nb-data-table__select-cell {
      padding-inline: var(--nb-spacing-8);
      min-block-size: 32px;
    }

    .nb-data-table__sort {
      width: auto;
      height: 32px;
      padding-inline: var(--nb-spacing-12);
      border: 1px solid var(--nb-c-border);
      @include radius.standalone(control);
      font-weight: 500;
    }

    // There is no hover on a phone, so the arrows are always shown, or a
    // sortable chip would look like a label.
    .nb-data-table__sort-icon {
      opacity: 1;
    }

    &.nb-data-table--stacked-headless .nb-data-table__head {
      display: none;
    }
  }
}

@include bp.phone-touch {
  .nb-data-table.nb-data-table--stacked {
    .nb-data-table__sort {
      height: 44px;
    }

    .nb-data-table__head .nb-data-table__select-cell {
      min-block-size: 44px;
    }

    .nb-data-table__expand {
      width: 44px;
      height: 44px;
    }
  }
}

@keyframes nb-data-table-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.nb-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
