<template>
  <div
    class="nb-contained-list"
    :class="[
      `nb-contained-list--${size}`,
      { 'nb-contained-list--scroll': !!maxHeight },
    ]"
    :style="maxHeight ? { '--nb-contained-list-max-h': maxHeight } : undefined"
  >
    <div v-if="hasHeader" class="nb-contained-list__header">
      <component
        :is="headingLevel"
        v-if="title"
        :id="headingId"
        class="nb-contained-list__title"
      >
        {{ title }}
      </component>
      <span v-if="$slots.meta" class="nb-contained-list__meta">
        <slot name="meta" />
      </span>
      <div v-if="$slots.actions" class="nb-contained-list__actions">
        <slot name="actions" />
      </div>
    </div>
    <ul
      class="nb-contained-list__items"
      role="list"
      :aria-labelledby="title ? headingId : undefined"
      :aria-label="!title ? ariaLabel : undefined"
    >
      <slot />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useStableId } from '@/composables/useStableId.composable'
import type { IContainedListProps } from './ContainedList.d'

const props = withDefaults(defineProps<IContainedListProps>(), {
  title: undefined,
  headingLevel: 'h3',
  size: 'md',
  maxHeight: undefined,
  ariaLabel: undefined,
})

const slots = useSlots()
const hasHeader = computed(
  () => !!props.title || !!slots.meta || !!slots.actions,
)

// The heading names the list, so a screen reader announces "Waiting on you,
// list, 5 items" rather than a bare list.
const headingId = useStableId({})
</script>

<style scoped lang="scss">
// A list for a small space: a panel, a tile, an aside, a disclosure. Each row
// is a key, a title, a line under it and something at the end, which is the
// row every product otherwise writes by hand.
.nb-contained-list {
  --nb-contained-list-row-h: 40px;

  display: flex;
  flex-direction: column;
  min-inline-size: 0;

  &--sm {
    --nb-contained-list-row-h: 32px;
  }

  &--lg {
    --nb-contained-list-row-h: 48px;
  }

  &--scroll {
    max-block-size: var(--nb-contained-list-max-h);
    overflow-y: auto;
  }
}

// Sticky in any scrolling ancestor, and over the list's own scroll when it has
// `max-height`. The surface is the plane the list sits on, so the rows pass
// under it rather than through it, and nothing shows while nothing scrolls.
.nb-contained-list__header {
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  min-block-size: var(--nb-contained-list-row-h);
  padding-inline: var(--nb-spacing-8);
  background: var(--nb-c-surface);
  border-block-end: 1px solid var(--nb-c-border);
}

.nb-contained-list__header .nb-contained-list__title {
  margin: 0;
  min-inline-size: 0;
  font-size: var(--nb-type-heading-compact-size);
  font-weight: var(
    --nb-type-heading-compact-weight,
    var(--nb-font-weight-semibold)
  );
  line-height: var(--nb-type-heading-compact-line-height, 1.3);
  color: var(--nb-c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-contained-list__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  font-size: var(--nb-type-label-sm-size);
  color: var(--nb-c-text-muted);
}

.nb-contained-list__actions {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  margin-inline-start: auto;
}

.nb-contained-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
