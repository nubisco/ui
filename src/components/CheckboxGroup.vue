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

    <NbMessage
      v-if="messageVariant"
      :id="messageId"
      :key="messageKey"
      :variant="messageVariant"
      :live="messageLive"
      class="nb-checkbox-group__message"
    >
      {{ messageText }}
    </NbMessage>
  </div>
</template>

<script setup lang="ts">
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import { computed, provide } from 'vue'
import { ECheckboxGroupDirection, ICheckboxGroupProps } from './CheckboxGroup.d'
import { NB_CHECKBOX_GROUP_CONTEXT } from './CheckboxGroup.context'
import { useStableId } from '@/composables/useStableId.composable'
import { useFieldMessage } from '@/composables/useFieldMessage.composable'

const props = withDefaults(defineProps<ICheckboxGroupProps>(), {
  id: 'checkbox-group',
  direction: ECheckboxGroupDirection.Vertical,
  disabled: false,
  error: undefined,
  warning: undefined,
  helper: undefined,
})

// `id` defaults to 'checkbox-group', shared by every instance, so the
// generated base is used unless a consumer set one.
const autoId = useStableId({})
const baseId = computed(() =>
  props.id && props.id !== 'checkbox-group' ? props.id : autoId,
)
const {
  variant: messageVariant,
  text: messageText,
  messageId,
  invalid,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, baseId)

provide(NB_CHECKBOX_GROUP_CONTEXT, {
  disabled: computed(() => props.disabled),
  // Each checkbox carries the group's validation state: aria-invalid is not
  // valid on role="group", so it goes on the controls themselves.
  invalid,
  describedBy: messageId,
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
    font-size: var(--nb-type-body-sm-size);
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
