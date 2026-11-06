<template>
  <div
    class="nb-structured-list"
    :class="{
      'nb-structured-list--condensed': condensed,
      'nb-structured-list--flush': flush,
    }"
    role="table"
    :aria-label="ariaLabel"
    :style="{ '--nb-structured-list-columns': tracks }"
  >
    <div class="nb-structured-list__head" role="rowgroup">
      <div
        class="nb-structured-list__row nb-structured-list__row--head"
        role="row"
      >
        <span
          v-for="column in columns"
          :key="column.key"
          class="nb-structured-list__header"
          :class="{ 'nb-structured-list__cell--end': column.align === 'end' }"
          role="columnheader"
        >
          {{ column.label }}
        </span>
      </div>
    </div>
    <div class="nb-structured-list__body" role="rowgroup">
      <div
        v-for="(row, index) in rows"
        :key="keyOf(row, index)"
        class="nb-structured-list__row"
        role="row"
      >
        <span
          v-for="column in columns"
          :key="column.key"
          class="nb-structured-list__cell"
          :class="{ 'nb-structured-list__cell--end': column.align === 'end' }"
          role="cell"
          :data-label="column.label"
        >
          <slot
            :name="`cell-${column.key}`"
            :row="row"
            :value="row[column.key]"
          >
            <span
              v-if="isEmpty(row[column.key])"
              class="nb-structured-list__empty"
            >
              {{ empty }}
            </span>
            <template v-else>{{ row[column.key] }}</template>
          </slot>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IStructuredListProps } from './StructuredList.d'

const props = withDefaults(defineProps<IStructuredListProps>(), {
  rowKey: undefined,
  condensed: false,
  flush: false,
  ariaLabel: undefined,
  empty: '–',
})

// One template for every row, the header row included, so the columns line up
// without the list itself being the grid. Each row is its own grid, which is
// what keeps NbDefinitionList safe: a row only ever lays out its own cells.
const tracks = computed(() =>
  props.columns.map((column) => column.width ?? 'minmax(0, 1fr)').join(' '),
)

function keyOf(row: Record<string, unknown>, index: number): string | number {
  if (typeof props.rowKey === 'function') return props.rowKey(row, index)
  const field = props.rowKey ?? 'id'
  const value = row[field]
  return typeof value === 'string' || typeof value === 'number' ? value : index
}

/** A dash, not a blank: "asked, and the answer is nothing". */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as breakpoints;

// Read-only rows with column headers: the sub-items of a record, a list of
// roles and their counts. Lighter than NbDataTable (no toolbar, no sorting, no
// selection, no paging) and, unlike NbDefinitionList, more than two columns.
.nb-structured-list {
  --nb-structured-list-pad-y: var(--nb-spacing-16);
  --nb-structured-list-pad-x: var(--nb-spacing-16);

  display: flex;
  flex-direction: column;
  min-inline-size: 0;

  &--condensed {
    --nb-structured-list-pad-y: var(--nb-spacing-8);
  }

  &--flush {
    --nb-structured-list-pad-x: 0px;
  }
}

.nb-structured-list__row {
  display: grid;
  grid-template-columns: var(--nb-structured-list-columns);
  column-gap: var(--nb-spacing-16);
  align-items: baseline;
  padding: var(--nb-structured-list-pad-y) var(--nb-structured-list-pad-x);
  border-block-end: 1px solid var(--nb-c-border);
}

.nb-structured-list__header {
  min-inline-size: 0;
  font-size: var(--nb-type-label-md-size);
  font-weight: var(--nb-type-label-md-weight);
  line-height: var(--nb-type-label-md-line-height);
  color: var(--nb-c-text-muted);
}

.nb-structured-list__cell {
  min-inline-size: 0;
  font-size: var(--nb-type-body-md-size);
  line-height: var(--nb-type-body-md-line-height);
  color: var(--nb-c-text-muted);
  overflow-wrap: anywhere;
}

// The first column names the row, so it reads at full strength.
.nb-structured-list__cell:first-child {
  color: var(--nb-c-text);
}

.nb-structured-list__cell--end {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.nb-structured-list__empty {
  color: var(--nb-c-text-subtle);
}

// On a phone a row of four columns is four words each. The rows stack instead:
// the first cell is the row's title, every other cell takes its column header
// as a label, and the header row goes (its labels are on the cells now).
@include breakpoints.phone {
  .nb-structured-list__row {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--nb-spacing-2);
  }

  .nb-structured-list__row--head {
    display: none;
  }

  .nb-structured-list__cell {
    text-align: start;
  }

  .nb-structured-list__cell:not(:first-child)::before {
    content: attr(data-label) ': ';
    color: var(--nb-c-text-subtle);
  }
}
</style>
