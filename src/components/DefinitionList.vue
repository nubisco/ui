<template>
  <dl
    class="nb-definition-list"
    :class="[
      `nb-definition-list--${layout}`,
      {
        'nb-definition-list--dividers': dividers,
        'nb-definition-list--compact': compact,
      },
    ]"
    :style="{ '--nb-definition-list-term-w': termWidth }"
  >
    <!-- The items prop and the slot are alternatives, not layers: rendering
         both would silently interleave two sources of truth. -->
    <template v-if="items.length">
      <div
        v-for="(item, i) in items"
        :key="`${item.term}-${i}`"
        class="nb-definition-list__row"
      >
        <dt class="nb-definition-list__term">{{ item.term }}</dt>
        <dd class="nb-definition-list__value">
          <template v-if="isEmpty(item.value)">
            <span class="nb-definition-list__empty">{{
              item.empty ?? EMPTY
            }}</span>
          </template>
          <template v-else>{{ item.value }}</template>
        </dd>
      </div>
    </template>
    <slot v-else />
  </dl>
</template>

<script setup lang="ts">
import type { IDefinitionListProps } from './DefinitionList.d'

withDefaults(defineProps<IDefinitionListProps>(), {
  items: () => [],
  layout: 'columns',
  termWidth: 'minmax(6rem, 0.38fr)',
  dividers: false,
  compact: false,
})

/** En dash, not a blank. A row that renders nothing looks like a bug or a
 *  missing fact; a dash says "asked, and the answer is nothing". */
const EMPTY = '–'

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}
</script>

<style scoped lang="scss">
// The grid lives on each ROW, never on the <dl>.
//
// This is the whole reason the component exists. A grid on the list makes
// every child a grid item, so a `<dt>` and `<dd>` pair is only aligned by
// luck: add a heading, a divider, or a form field inside the list and it gets
// pulled into the columns too. That is precisely how the CMS shipped a
// definition list that swallowed two form fields. Per-row grids cannot do
// that, because a row only ever contains its own term and value.
.nb-definition-list {
  --nb-definition-list-row-y: var(--nb-spacing-8);

  display: flex;
  flex-direction: column;
  margin: 0;

  &--compact {
    --nb-definition-list-row-y: var(--nb-spacing-4);
  }
}

// Every row selector is `:deep`. A row written into the default slot is an
// NbDefinitionListItem rendered by the CONSUMER's template, so its root carries
// the consumer's scope attribute, not this component's. Without `:deep` the
// grid never applied to slotted rows: terms and values stacked with no columns
// and no row spacing, while the dt/dd rules below (already `:deep`) still did.
:deep(.nb-definition-list__row) {
  display: grid;
  gap: var(--nb-spacing-4) var(--nb-spacing-16);
  padding-block: var(--nb-definition-list-row-y);
  align-items: baseline;
}

.nb-definition-list--dividers
  :deep(.nb-definition-list__row + .nb-definition-list__row) {
  border-top: 1px solid var(--nb-c-border);
}

.nb-definition-list--columns :deep(.nb-definition-list__row) {
  grid-template-columns: var(--nb-definition-list-term-w) 1fr;
}

.nb-definition-list--stacked :deep(.nb-definition-list__row) {
  grid-template-columns: 1fr;
}

// Responds to the container it is in, not the viewport. An inspector is narrow
// while the window is wide, and a media query cannot tell the difference.
.nb-definition-list--auto {
  container-type: inline-size;
}

.nb-definition-list--auto :deep(.nb-definition-list__row) {
  grid-template-columns: 1fr;
}

@container (min-width: 360px) {
  .nb-definition-list--auto :deep(.nb-definition-list__row) {
    grid-template-columns: var(--nb-definition-list-term-w) 1fr;
  }
}

// `:deep` for the same reason: these also have to reach the dt and dd of rows
// written into the slot.
:deep(.nb-definition-list__term) {
  margin: 0;
  font-size: var(--nb-font-size-12);
  line-height: 1.4;
  color: var(--nb-c-text-subtle);
  overflow-wrap: anywhere;
}

:deep(.nb-definition-list__value) {
  margin: 0;
  font-size: var(--nb-font-size-14);
  line-height: 1.4;
  color: var(--nb-c-text);
  min-width: 0;
  overflow-wrap: anywhere;
}

:deep(.nb-definition-list__empty) {
  color: var(--nb-c-text-subtle);
}
</style>
