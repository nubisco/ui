<template>
  <div :class="rootClasses" role="group" :aria-label="label || undefined">
    <NbLabel v-if="label" :disabled="disabled">{{ label }}</NbLabel>

    <div
      :class="[
        'nb-checkbox-group__items',
        `nb-checkbox-group__items--${direction}`,
      ]"
    >
      <slot />
    </div>

    <NbMessage v-if="error" variant="error" class="nb-checkbox-group__message">
      {{ error }}
    </NbMessage>
    <NbMessage
      v-else-if="warning"
      variant="warning"
      class="nb-checkbox-group__message"
    >
      {{ warning }}
    </NbMessage>
    <NbMessage
      v-else-if="helper"
      variant="helper"
      class="nb-checkbox-group__message"
    >
      {{ helper }}
    </NbMessage>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { ECheckboxGroupDirection, ICheckboxGroupProps } from './CheckboxGroup.d'
import { NB_CHECKBOX_GROUP_CONTEXT } from './CheckboxGroup.context'

const props = withDefaults(defineProps<ICheckboxGroupProps>(), {
  id: 'checkbox-group',
  direction: ECheckboxGroupDirection.Vertical,
  disabled: false,
  error: undefined,
  warning: undefined,
  helper: undefined,
})

provide(NB_CHECKBOX_GROUP_CONTEXT, {
  disabled: computed(() => props.disabled),
})

const rootClasses = computed(() => [
  'nb-checkbox-group',
  {
    'nb-checkbox-group--error': !!props.error,
    'nb-checkbox-group--warning': !props.error && !!props.warning,
    'nb-checkbox-group--disabled': props.disabled,
  },
])
</script>

<style scoped lang="scss">
.nb-checkbox-group {
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--nb-font-family-sans);

  // ── Items ─────────────────────────────────────────────────────────────────────
  &__items {
    display: flex;
    gap: 6px;

    &--vertical {
      flex-direction: column;
    }

    &--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  // ── Message ───────────────────────────────────────────────────────────────────
  &__message {
    font-size: var(--nb-font-size-12);
  }

  // ── Error state: danger borders and fills on child checkboxes ────────────────
  &--error {
    :deep(.nb-checkbox__box) {
      border-color: var(--nb-c-danger);
    }

    :deep(.nb-checkbox__input:checked ~ .nb-checkbox__box),
    :deep(.nb-checkbox__input:indeterminate ~ .nb-checkbox__box) {
      background: var(--nb-c-danger);
      border-color: var(--nb-c-danger);
    }
  }
}
</style>
