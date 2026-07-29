<template>
  <nav
    :class="['nb-pagination', `nb-pagination--${size}`]"
    :aria-label="'Pagination'"
  >
    <div class="nb-pagination__left">
      <!-- <label> wrapping the control: NbSelect's trigger is a <button>,
           which is a labelable element, so the visible text names it without
           a duplicate aria-label. -->
      <label class="nb-pagination__page-size">
        <span class="nb-pagination__label">{{ pageSizeLabel }}</span>
        <NbSelect
          size="xs"
          :model-value="pageSize"
          :options="pageSizeSelectOptions"
          :disabled="disabled"
          @update:model-value="onPageSizeChange"
        />
      </label>
      <span class="nb-pagination__range" aria-live="polite">
        {{ rangeStart }}–{{ rangeEnd }} of {{ total }} {{ itemLabel }}
      </span>
    </div>

    <div class="nb-pagination__right">
      <span class="nb-pagination__page-of">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <NbButton
        class="nb-pagination__nav"
        variant="ghost"
        :size="controlSize"
        icon="caret-left"
        :disabled="disabled || currentPage <= 1"
        aria-label="Previous page"
        @click="goTo(currentPage - 1)"
      />
      <NbButton
        class="nb-pagination__nav"
        variant="ghost"
        :size="controlSize"
        icon="caret-right"
        :disabled="disabled || currentPage >= totalPages"
        aria-label="Next page"
        @click="goTo(currentPage + 1)"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import { IPaginationProps } from './Pagination.d'
import type { ISelectOption } from './Select.d'
import NbButton from './Button.vue'
import NbSelect from './Select.vue'

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

// `size` is published as the enum OR its raw literals for ergonomics. Both
// carry the same runtime values, so narrow once for children that type their
// own prop as the enum.
const controlSize = computed(() => props.size as ESizeShort)

// A `pageSize` the host set outside `pageSizeOptions` (a saved preference, a
// deep link, a smaller last page) has no matching <option>, which leaves the
// native select with selectedIndex -1 and renders a blank control. Fold the
// live value into the list so the select always shows what is actually in use.
const resolvedPageSizeOptions = computed(() =>
  props.pageSizeOptions.includes(props.pageSize)
    ? props.pageSizeOptions
    : [...props.pageSizeOptions, props.pageSize].sort((a, b) => a - b),
)

const pageSizeSelectOptions = computed<ISelectOption[]>(() =>
  resolvedPageSizeOptions.value.map((value) => ({
    label: String(value),
    value,
  })),
)

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

function onPageSizeChange(value: unknown) {
  const next = Number(value)
  if (!Number.isFinite(next) || next === props.pageSize) return
  emit('update:pageSize', next)
  // Reset to the first page so the range stays valid (Carbon behaviour).
  if (props.page !== 1) emit('update:page', 1)
}
</script>

<style scoped lang="scss">
.nb-pagination {
  // Single source of truth for the bar's height: the nav controls are
  // squares of exactly this size. Deriving their width from a stretched
  // height instead (aspect-ratio) sizes them after flex has already
  // allocated the smaller intrinsic width, so they overflow the bar.
  --nb-pg-bar-h: calc(var(--nb-base-unit) * 6);

  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 2);
  border-top: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-13);
  // No trailing inset: the nav controls run flush to the bar's end edge.
  padding-inline: calc(var(--nb-base-unit) * 2) 0;
  min-height: var(--nb-pg-bar-h);

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) * 2);
  }

  &__right {
    // stretch so the nav controls can take the bar's full height, and no
    // gap so their dividers sit flush against each other. `align-self`
    // opts this group out of the bar's own `align-items: center`, which
    // would otherwise shrink-wrap it and leave nothing to stretch into.
    align-self: stretch;
    align-items: stretch;
    gap: 0;
  }

  &__page-size {
    display: inline-flex;
    align-items: center;
    gap: var(--nb-base-unit);
    cursor: pointer;

    // NbSelect has a fragment root (field + teleported dropdown), so Vue
    // skips attribute inheritance and a class on the component never lands.
    // Reach it from here instead. It only needs to shrink to its content:
    // this is a dense strip, not a form, so the field's default block width
    // would leave a wide empty trigger.
    :deep(.nb-select) {
      width: auto;
      min-width: calc(var(--nb-base-unit) * 9);
    }
  }

  &__label {
    color: var(--nb-c-text-muted);
    white-space: nowrap;
  }

  // The page-size control is an NbSelect (xs). It only needs to shrink to
  // its content here: the bar is a dense strip, not a form, so the field's
  // default full-width block sizing would leave a wide empty trigger.
  &__select {
    width: auto;
    min-width: calc(var(--nb-base-unit) * 8);
  }

  &__range {
    color: var(--nb-c-text-muted);
    white-space: nowrap;
  }

  &__page-of {
    display: inline-flex;
    align-items: center;
    color: var(--nb-c-text-muted);
    white-space: nowrap;
    padding-inline-end: calc(var(--nb-base-unit) * 2);
  }

  // Nav controls are NbButton (ghost, icon-only); only the bar-specific
  // geometry lives here. Square, bar-height and divider-led, so they read
  // as part of the bar rather than as floating buttons. Chained classes so
  // this outranks NbButton's own per-size `height` and icon-only `width`
  // rules, which otherwise tie on specificity and win on source order.
  &__nav.nb-button.nb-button--icon-only {
    width: var(--nb-pg-bar-h);
    height: var(--nb-pg-bar-h);
    border-inline-start: 1px solid var(--nb-c-border);
  }

  // Density
  &--sm {
    --nb-pg-bar-h: calc(var(--nb-base-unit) * 5);

    font-size: var(--nb-font-size-12);
  }
  &--lg {
    --nb-pg-bar-h: calc(var(--nb-base-unit) * 7);
  }
}
</style>
