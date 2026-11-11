<template>
  <div
    :class="[
      'nb-input-group',
      `nb-input-group--${size}`,
      { 'nb-input-group--disabled': disabled },
    ]"
  >
    <NbLabel
      v-if="label"
      :id="labelId"
      :for="controlId"
      :required="required"
      :disabled="disabled"
    >
      {{ label }}
    </NbLabel>

    <div
      class="nb-input-group__row"
      role="group"
      :aria-labelledby="label ? labelId : undefined"
    >
      <slot :size="size" :disabled="disabled" />
    </div>

    <NbMessage
      v-if="messageText"
      :id="messageId"
      :key="messageKey"
      :variant="messageVariant"
      :live="messageLive"
      class="nb-input-group__message"
    >
      {{ messageText }}
    </NbMessage>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import type { IInputGroupProps } from './InputGroup.d'
import { NB_INPUT_GROUP_CONTEXT } from './InputGroup.context'
import { useStableId } from '@/composables/useStableId.composable'
import { useFieldMessage } from '@/composables/useFieldMessage.composable'

const props = withDefaults(defineProps<IInputGroupProps>(), {
  label: '',
  helper: '',
  error: '',
  warning: '',
  size: 'md',
  disabled: false,
  required: false,
  id: undefined,
})

const autoId = useStableId({})
const controlId = computed(() => props.id ?? autoId)
const labelId = computed(() => `${controlId.value}-label`)

const {
  variant: fieldMessageVariant,
  text: messageText,
  messageId,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, controlId)
const messageVariant = computed(() => fieldMessageVariant.value ?? 'helper')

/*
 * The label is a real `<label for>`, so a click on it lands in the field.
 * It can only point at one control, and the first field to render takes it.
 * The row is also a named group, so every control in it is announced in the
 * context of the label, the button included.
 */
let claimed = false
provide(NB_INPUT_GROUP_CONTEXT, {
  size: computed(() => props.size),
  disabled: computed(() => props.disabled),
  status: computed(() => {
    if (props.error) return 'error'
    if (props.warning) return 'warning'
    return undefined
  }),
  describedBy: messageId,
  claimControlId: () => {
    if (claimed) return undefined
    claimed = true
    return controlId.value
  },
})
</script>

<style scoped lang="scss">
/*
 * The row is one control. Every box in it is the group's height, from the
 * scale fields and buttons share, and the edges where two boxes meet are
 * joined: no gap, the inner corners squared under the rounded appearance,
 * and the touching borders overlapped into one line.
 *
 * Under square there is nothing to join but the height: a field draws its
 * bottom rule and a button its fill, as they do anywhere else.
 */
.nb-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--nb-field-label-gap);
  min-width: 0;
  font-family: var(--nb-font-family-sans);
  --field-h: var(--nb-field-height-md);

  &--xs {
    --field-h: var(--nb-field-height-xs);
  }
  &--sm {
    --field-h: var(--nb-field-height-sm);
  }
  &--md {
    --field-h: var(--nb-field-height-md);
  }
  &--lg {
    --field-h: var(--nb-field-height-lg);
  }

  &__row {
    display: flex;
    // Tops, not stretch: a field that shows its own message below its box
    // must not pull the buttons beside it taller.
    align-items: flex-start;
    min-width: 0;

    // A field takes the room and shrinks first. A button keeps its own
    // width, so on a phone the row stays one row and the field gives way.
    > :deep(*) {
      flex: 1 1 auto;
      min-width: 0;
    }

    > :deep(.nb-button) {
      flex: 0 0 auto;
      height: var(--field-h);
    }

    > :deep(.nb-button--icon-only) {
      width: var(--field-h);
    }

    /*
     * The inner edges. A field reads `--nb-field-radius-start` and `-end`
     * (see `styles/logic/_field.scss`), so it squares the right corners
     * without knowing it is in a group. A button's corner is its own, so it
     * is set here.
     */
    > :deep(:not(:first-child)) {
      --nb-field-radius-start: 0;
      // One border where two boxes touch, not two side by side. Zero under
      // square, where a field has no side borders.
      margin-inline-start: calc(-1 * var(--nb-field-border-width, 0px));
    }

    > :deep(:not(:last-child)) {
      --nb-field-radius-end: 0;
    }

    > :deep(.nb-button:not(:first-child)) {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }

    > :deep(.nb-button:not(:last-child)) {
      border-start-end-radius: 0;
      border-end-end-radius: 0;
    }

    // The control with focus sits above its neighbours, so the border they
    // overlap never covers the edge of its ring.
    > :deep(:focus-within),
    > :deep(:focus-visible) {
      position: relative;
      z-index: 1;
    }
  }

  &__message {
    font-size: var(--nb-type-body-sm-size);
  }
}
</style>
