<template>
  <div
    :class="[
      'nb-data-table',
      `nb-data-table--${size}`,
      { 'nb-data-table--zebra': zebra },
      { 'nb-data-table--sticky': stickyHeader },
      { 'nb-data-table--fill': fill },
    ]"
    v-bind="layerProps"
  >
    <!-- Toolbar. The heading and tools stay mounted while rows are selected
         and the batch bar covers them as an overlay. Swapping the toolbar's
         contents instead would resize it (a title + description toolbar is
         taller than the bar), shifting every row down the moment the first
         checkbox is ticked and moving the next checkbox out from under the
         user's cursor. -->
    <div v-if="showToolbar" class="nb-data-table__toolbar">
      <div
        class="nb-data-table__toolbar-heading"
        :inert="showBatchBar || undefined"
        :aria-hidden="showBatchBar || undefined"
      >
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
        :inert="showBatchBar || undefined"
        :aria-hidden="showBatchBar || undefined"
      >
        <slot name="search" />
        <slot name="toolbar-actions" />
      </div>

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
        <NbButton
          class="nb-data-table__batch-cancel"
          variant="ghost"
          :size="controlSize"
          @click="clearSelection"
        >
          Cancel
        </NbButton>
      </div>
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
  ref,
  useId,
  useSlots,
  watch,
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
import NbButton from './Button.vue'
import NbGrid from './Grid.vue'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'

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
  fill: false,
  title: undefined,
  description: undefined,
  ariaLabel: undefined,
})

// The table paints the bordered surface its toolbar, header and rows sit on, so
// it takes the current layer and deepens anything rendered into its cells.
const { layerProps } = useSurfaceLayer()

const emit = defineEmits<{
  sort: [state: IDataTableSortState]
  'update:selected': [keys: (string | number)[]]
  'row-click': [row: T, rowIndex: number]
}>()

const slots = useSlots()
const radioName = `nb-data-table-select-${useId()}`

// `size` is published as the enum OR its raw literals for ergonomics. Both
// carry the same runtime values, so narrow once for children that type their
// own prop as the enum.
const controlSize = computed(() => props.size as ESizeShort)

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

// #region toolbar
const hasToolbarContent = computed(
  () =>
    !!props.title ||
    !!props.description ||
    !!slots.toolbar ||
    !!slots.search ||
    !!slots['toolbar-actions'],
)
// `canShowBatchBar`, not `showBatchBar`: a table with batch actions but no
// toolbar content would otherwise grow a toolbar strip the moment the first
// row is selected, reintroducing exactly the reflow the overlay avoids.
// Reserving the strip up front keeps the geometry identical in both states.
const showToolbar = computed(
  () => hasToolbarContent.value || canShowBatchBar.value,
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
    position: relative; // containing block for the batch overlay
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

  // Batch action bar (selection mode). Carbon overlays the toolbar with a
  // solid brand-filled bar and inverse content, so selection mode is
  // unmistakable. The bar owns the toolbar's inline padding because it
  // bleeds to both edges.
  // Overlay, not a sibling in flow: covering the toolbar leaves its height
  // (and therefore every row below it) exactly where it was.
  &__batch {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) * 2);
    padding-inline: var(--nb-dt-cell-pad-x);
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
  }

  &__batch-count {
    font-weight: 600;
    color: inherit;
  }

  &__batch-actions {
    display: flex;
    align-items: center;
    gap: var(--nb-base-unit);
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

    // Neutral, not a brand tint. A 10% --nb-c-primary wash read as an
    // unexplained violet; selection is already signalled by the checkbox and
    // the batch bar, so the row only needs to sit one layer proud of the
    // surface. Selected+hover goes one neutral step further using
    // --nb-c-contrast (black/white per theme) so it stays hue-free.
    &--selected .nb-data-table__td {
      background: var(--nb-c-bg-soft);
    }

    &--selected:hover .nb-data-table__td {
      background: color-mix(
        in srgb,
        var(--nb-c-contrast) 6%,
        var(--nb-c-bg-soft)
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
