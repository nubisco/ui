<template>
  <nav
    :class="['nb-pagination', `nb-pagination--${size}`]"
    :aria-label="'Pagination'"
  >
    <div class="nb-pagination__left">
      <label class="nb-pagination__page-size">
        <span class="nb-pagination__label">{{ pageSizeLabel }}</span>
        <span class="nb-pagination__select-wrap">
          <select
            class="nb-pagination__select"
            :value="pageSize"
            :disabled="disabled"
            @change="onPageSizeChange"
          >
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <NbIcon name="caret-down" class="nb-pagination__select-caret" />
        </span>
      </label>
      <span class="nb-pagination__range" aria-live="polite">
        {{ rangeStart }}–{{ rangeEnd }} of {{ total }} {{ itemLabel }}
      </span>
    </div>

    <div class="nb-pagination__right">
      <span class="nb-pagination__page-of">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        type="button"
        class="nb-pagination__nav"
        :disabled="disabled || currentPage <= 1"
        aria-label="Previous page"
        @click="goTo(currentPage - 1)"
      >
        <NbIcon name="caret-left" />
      </button>
      <button
        type="button"
        class="nb-pagination__nav"
        :disabled="disabled || currentPage >= totalPages"
        aria-label="Next page"
        @click="goTo(currentPage + 1)"
      >
        <NbIcon name="caret-right" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import { IPaginationProps } from './Pagination.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IPaginationProps>(), {
  pageSizeOptions: () => [10, 20, 30, 40, 50],
  size: ESizeShort.Medium,
  disabled: false,
  pageSizeLabel: 'Items per page:',
  itemLabel: 'items',
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / Math.max(1, props.pageSize))),
)
// Clamp the reported page into range so a stale/out-of-bounds `page` prop still
// renders sane read-outs and button states.
const currentPage = computed(() =>
  Math.min(Math.max(1, props.page), totalPages.value),
)
const rangeStart = computed(() =>
  props.total === 0 ? 0 : (currentPage.value - 1) * props.pageSize + 1,
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * props.pageSize, props.total),
)

function goTo(page: number) {
  const next = Math.min(Math.max(1, page), totalPages.value)
  if (next !== props.page) emit('update:page', next)
}

function onPageSizeChange(e: Event) {
  const next = Number((e.target as HTMLSelectElement).value)
  emit('update:pageSize', next)
  // Reset to the first page so the range stays valid (Carbon behaviour).
  if (props.page !== 1) emit('update:page', 1)
}
</script>

<style scoped lang="scss">
.nb-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 2);
  border-top: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-13);
  padding-inline: calc(var(--nb-base-unit) * 2);
  min-height: calc(var(--nb-base-unit) * 6);

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) * 2);
  }

  &__page-size {
    display: inline-flex;
    align-items: center;
    gap: var(--nb-base-unit);
    cursor: pointer;
  }

  &__label {
    color: var(--nb-c-text-muted);
    white-space: nowrap;
  }

  &__select-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  &__select {
    appearance: none;
    font: inherit;
    color: var(--nb-c-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 2px calc(var(--nb-base-unit) * 2.5) 2px var(--nb-base-unit);
    cursor: pointer;
    outline: none;

    &:hover:not(:disabled) {
      background: var(--nb-c-surface-hover);
    }
    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: -1px;
    }
    &:disabled {
      cursor: not-allowed;
      opacity: var(--nb-field-disabled-opacity);
    }
  }

  &__select-caret {
    position: absolute;
    right: calc(var(--nb-base-unit) / 2);
    pointer-events: none;
    font-size: var(--nb-font-size-12);
    color: var(--nb-c-text-muted);
  }

  &__range {
    color: var(--nb-c-text-muted);
    white-space: nowrap;
  }

  &__page-of {
    color: var(--nb-c-text-muted);
    white-space: nowrap;
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--nb-base-unit) * 4);
    height: calc(var(--nb-base-unit) * 4);
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--nb-c-text);
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) {
      background: var(--nb-c-surface-hover);
    }
    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: -1px;
    }
    &:disabled {
      color: var(--nb-c-text-subtle);
      cursor: not-allowed;
    }
  }

  // Density
  &--sm {
    font-size: var(--nb-font-size-12);
    min-height: calc(var(--nb-base-unit) * 5);
  }
  &--lg {
    min-height: calc(var(--nb-base-unit) * 7);
  }
}
</style>
