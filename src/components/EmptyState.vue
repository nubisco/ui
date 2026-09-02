<template>
  <div
    class="nb-empty-state"
    :class="[
      `nb-empty-state--${size}`,
      `nb-empty-state--${kind}`,
      { 'nb-empty-state--bordered': bordered },
    ]"
  >
    <div v-if="resolvedIcon || $slots.icon" class="nb-empty-state__icon">
      <slot name="icon">
        <NbIcon :name="resolvedIcon!" :size="size === 'sm' ? 24 : 32" />
      </slot>
    </div>

    <div v-if="title || $slots.title" class="nb-empty-state__title">
      <slot name="title">{{ title }}</slot>
    </div>

    <div
      v-if="description || $slots.default"
      class="nb-empty-state__description"
    >
      <slot>{{ description }}</slot>
    </div>

    <!-- One action, or at most one plus a quieter escape. Carbon's guidance is
         explicit that an empty state covering several options stops being
         guidance and becomes a menu. -->
    <div v-if="$slots.actions" class="nb-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IEmptyStateProps } from './EmptyState.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IEmptyStateProps>(), {
  title: '',
  description: '',
  icon: undefined,
  kind: 'empty',
  size: 'md',
  bordered: false,
})

// Distinct icons per kind, because the four situations are genuinely
// different and a single generic mark would make them look like one.
const ICONS: Record<string, string> = {
  empty: 'tray',
  'no-results': 'magnifying-glass',
  error: 'warning-circle',
  forbidden: 'lock-simple',
}

const resolvedIcon = computed(() =>
  props.icon === null ? null : (props.icon ?? ICONS[props.kind] ?? ICONS.empty),
)
</script>

<style scoped lang="scss">
.nb-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  // Spacing comes from `gap`, and the children carry no margin at all. An
  // empty state is chrome, not prose, and it is routinely dropped inside a
  // container that styles `p` and `div` margins for prose; gap is the one
  // axis those rules cannot reach.
  gap: var(--nb-spacing-4);
  padding: var(--nb-spacing-32) var(--nb-spacing-16);
  // Centred prose is hard to read past a couple of lines, so the copy is
  // capped well before the container is.
  --nb-empty-state-measure: 44ch;

  &--sm {
    padding: var(--nb-spacing-16);
    --nb-empty-state-measure: 36ch;
  }

  &--bordered {
    border: 1px dashed var(--nb-c-border);
    border-radius: var(--nb-radius-xs);
  }
}

.nb-empty-state__icon {
  color: var(--nb-c-text-subtle);
  margin: 0 0 var(--nb-spacing-8);
  display: flex;
}

// An error is the one kind that earns colour: it is the only one where
// something went wrong rather than simply not existing yet.
.nb-empty-state--error .nb-empty-state__icon {
  color: var(--nb-c-status-error);
}

.nb-empty-state__title {
  margin: 0;
  font-size: var(--nb-font-size-14);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.4;
  color: var(--nb-c-text);
}

.nb-empty-state--md .nb-empty-state__title {
  font-size: var(--nb-font-size-16);
}

.nb-empty-state__description {
  margin: 0;
  max-width: var(--nb-empty-state-measure);
  font-size: var(--nb-font-size-14);
  line-height: 1.5;
  color: var(--nb-c-text-subtle);
}

.nb-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--nb-spacing-8);
  margin: var(--nb-spacing-12) 0 0;
}
</style>
