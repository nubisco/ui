<template>
  <div
    :class="[
      'nb-data-table',
      `nb-data-table--${size}`,
      { 'nb-data-table--zebra': zebra },
      { 'nb-data-table--sticky': stickyHeader },
    ]"
  >
    <!-- Toolbar -->
    <div v-if="showToolbar" class="nb-data-table__toolbar">
      <!-- Batch action bar, shown over the toolbar while rows are selected -->
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
        <button
          type="button"
          class="nb-data-table__batch-cancel"
          @click="clearSelection"
        >
          Cancel
        </button>
      </div>

      <template v-else>
        <div class="nb-data-table__toolbar-heading">
          <slot name="toolbar" :selected-count="selectedCount">
            <div v-if="title || description">
              <h2 v-if="title" class="nb-data-table__title">{{ title }}</h2>
              <p v-if="description" class="nb-data-table__description">
                {{ description }}
              </p>
            </div>
          </slot>
        </div>
        <div
          v-if="$slots.search || $slots['toolbar-actions']"
          class="nb-data-table__toolbar-tools"
        >
          <slot name="search" />
          <slot name="toolbar-actions" />
        </div>
      </template>
    </div>

    <!-- Scroll container: horizontal scroll for wide tables, vertical for sticky header -->
    <div class="nb-data-table__scroll">
      <table
        class="nb-data-table__table"
        :aria-label="ariaLabel || title || undefined"
        :aria-busy="loading || undefined"
      >
        <colgroup>
          <col v-if="hasSelectColumn" class="nb-data-table__col-select" />
          <col
            v-for="col in visibleColumns"
            :key="`col-${col.key}`"
            :style="colStyle(col)"
          />
          <col v-if="hasRowActions" class="nb-data-table__col-actions" />
        </colgroup>

        <thead class="nb-data-table__head">
          <tr>
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

        <tbody class="nb-data-table__body">
          <!-- Loading: skeleton rows -->
          <template v-if="loading">
            <tr
              v-for="n in skeletonRows"
              :key="`skeleton-${n}`"
              class="nb-data-table__row nb-data-table__row--skeleton"
            >
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
                <NbIcon name="warning-circle-fill" aria-hidden="true" />
                <span>{{ error }}</span>
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
            <tr
              v-for="(row, rowIndex) in rows"
              :key="keyFor(row)"
              :class="[
                'nb-data-table__row',
                { 'nb-data-table__row--selected': isSelected(row) },
                { 'nb-data-table__row--clickable': clickableRows },
              ]"
              :aria-selected="
                selectable !== 'none' ? isSelected(row) : undefined
              "
              @click="onRowClick(row, rowIndex)"
            >
              <td
                v-if="hasSelectColumn"
                class="nb-data-table__td nb-data-table__select-cell"
                @click.stop
              >
                <NbCheckbox
                  v-if="selectable === 'multiple'"
                  :model-value="isSelected(row)"
                  :aria-label="`Select row ${rowIndex + 1}`"
                  @update:model-value="toggleRow(row)"
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
                ]"
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
import {
  computed,
  getCurrentInstance,
  useId,
  useSlots,
  type FunctionalComponent,
} from 'vue'
import { ESizeShort } from '@/types/Size.d'
import type {
  IDataTableColumn,
  IDataTableProps,
  IDataTableSortState,
  TSortDirection,
} from './DataTable.d'
import NbCheckbox from './Checkbox.vue'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IDataTableProps<T>>(), {
  size: ESizeShort.Medium,
  sortState: null,
  selectable: 'none',
  selected: () => [],
  loading: false,
  skeletonRows: 5,
  error: undefined,
  emptyMessage: undefined,
  stickyHeader: true,
  zebra: false,
  title: undefined,
  description: undefined,
  ariaLabel: undefined,
})

const emit = defineEmits<{
  sort: [state: IDataTableSortState]
  'update:selected': [keys: (string | number)[]]
  'row-click': [row: T, rowIndex: number]
}>()

const slots = useSlots()
const radioName = `nb-data-table-select-${useId()}`

// #region columns
const visibleColumns = computed(() =>
  props.columns.filter((col) => !col.hidden),
)

const hasSelectColumn = computed(() => props.selectable !== 'none')
const hasRowActions = computed(() => !!slots['row-actions'])

const totalColumns = computed(
  () =>
    visibleColumns.value.length +
    (hasSelectColumn.value ? 1 : 0) +
    (hasRowActions.value ? 1 : 0),
)

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

function toggleRow(row: T) {
  const key = keyFor(row)
  const next = new Set(props.selected)
  if (next.has(key)) next.delete(key)
  else next.add(key)
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

const showBatchBar = computed(
  () =>
    props.selectable !== 'none' &&
    selectedCount.value > 0 &&
    !!slots['batch-actions'],
)
// #endregion

// #region toolbar
const hasToolbarContent = computed(
  () =>
    !!props.title ||
    !!props.description ||
    !!slots.toolbar ||
    !!slots.search ||
    !!slots['toolbar-actions'],
)
const showToolbar = computed(
  () => hasToolbarContent.value || showBatchBar.value,
)
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

function sortIcon(col: IDataTableColumn<T>): string {
  if (!isSorted(col)) return 'arrows-down-up'
  return props.sortState!.direction === 'asc' ? 'arrow-up' : 'arrow-down'
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
// #endregion
</script>

<style scoped lang="scss">
.nb-data-table {
  --nb-dt-row-height: calc(var(--nb-base-unit) * 6);
  --nb-dt-cell-pad-x: calc(var(--nb-base-unit) * 2);
  --nb-dt-font-size: var(--nb-font-size-14);

  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  border: 1px solid var(--nb-c-border);
  border-radius: 6px;
  overflow: hidden;
  font-size: var(--nb-dt-font-size);

  // Density
  &--sm {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 4);
    --nb-dt-cell-pad-x: calc(var(--nb-base-unit) * 1.5);
    --nb-dt-font-size: var(--nb-font-size-13);
  }
  &--lg {
    --nb-dt-row-height: calc(var(--nb-base-unit) * 8);
    --nb-dt-cell-pad-x: calc(var(--nb-base-unit) * 2.5);
  }

  // ── Toolbar ──────────────────────────────────────────────
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--nb-base-unit) * 2);
    min-height: calc(var(--nb-base-unit) * 6);
    padding-inline: var(--nb-dt-cell-pad-x);
    border-bottom: 1px solid var(--nb-c-border);
  }

  &__toolbar-heading {
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: var(--nb-font-size-16);
    font-weight: 600;
    line-height: 1.3;
  }

  &__description {
    margin: 2px 0 0;
    font-size: var(--nb-font-size-13);
    color: var(--nb-c-text-muted);
  }

  &__toolbar-tools {
    display: flex;
    align-items: center;
    gap: var(--nb-base-unit);
    flex-shrink: 0;
  }

  // Batch action bar (selection mode)
  &__batch {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) * 2);
    width: 100%;
    height: 100%;
    color: var(--nb-c-primary-a11y);
  }

  &__batch-count {
    font-weight: 600;
    color: var(--nb-c-primary);
  }

  &__batch-actions {
    display: flex;
    align-items: center;
    gap: var(--nb-base-unit);
    flex: 1;
  }

  &__batch-cancel {
    border: none;
    background: transparent;
    color: var(--nb-c-primary);
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    padding: calc(var(--nb-base-unit) / 2) var(--nb-base-unit);
    border-radius: 4px;

    &:hover {
      background: var(--nb-c-surface-hover);
    }
    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: -1px;
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
  &__th {
    height: var(--nb-dt-row-height);
    padding-inline: var(--nb-dt-cell-pad-x);
    text-align: left;
    font-weight: 600;
    font-size: inherit;
    color: var(--nb-c-text);
    background: var(--nb-c-surface-raised);
    border-bottom: 1px solid var(--nb-c-border);
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
    font-weight: 600;
    text-align: inherit;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--nb-c-surface-hover);
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
  &__td {
    height: var(--nb-dt-row-height);
    padding-inline: var(--nb-dt-cell-pad-x);
    padding-block: calc(var(--nb-base-unit) / 2);
    border-bottom: 1px solid var(--nb-c-border);
    vertical-align: middle;
    color: var(--nb-c-text);

    &--center {
      text-align: center;
    }
    &--right {
      text-align: right;
    }
  }

  &__row {
    transition: background 0.15s;

    &:hover .nb-data-table__td {
      background: var(--nb-c-surface-hover);
    }

    &--clickable {
      cursor: pointer;
    }

    &--selected .nb-data-table__td {
      background: color-mix(
        in srgb,
        var(--nb-c-primary) 10%,
        var(--nb-c-surface)
      );
    }
  }

  &--zebra &__row:nth-child(even) &__td {
    background: var(--nb-c-bg-soft);
  }
  &--zebra &__row:hover &__td {
    background: var(--nb-c-surface-hover);
  }

  // Last row: drop the trailing border for a clean edge
  &__body &__row:last-child &__td {
    border-bottom: none;
  }

  // ── Selection + actions columns ──────────────────────────
  &__col-select {
    width: calc(var(--nb-base-unit) * 6);
  }
  &__col-actions {
    width: calc(var(--nb-base-unit) * 6);
  }

  &__select-cell,
  &__actions-cell {
    text-align: center;
    white-space: nowrap;
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

  // ── Sticky header ────────────────────────────────────────
  &--sticky &__head &__th {
    position: sticky;
    top: 0;
    z-index: 1;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--nb-base-unit);
    }
  }

  // ── Skeleton loading ─────────────────────────────────────
  &__skeleton {
    display: block;
    height: 12px;
    width: 100%;
    max-width: 180px;
    border-radius: 4px;
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

  &__footer {
    // NbPagination brings its own top border; nothing needed here.
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
