<template>
  <div :class="rootClasses">
    <!-- DEFAULT variant -->
    <template v-if="variant === 'default'">
      <NbLabel
        v-if="label"
        :for="inputId"
        :required="required"
        :disabled="isDisabled"
        >{{ label }}</NbLabel
      >

      <div class="nb-number-input__field-wrapper" :class="wrapperClasses">
        <input
          :id="inputId"
          ref="inputRef"
          :aria-invalid="ariaInvalid"
          :aria-describedby="describedBy"
          type="number"
          class="nb-number-input__field"
          :placeholder="placeholder"
          :min="min"
          :max="max"
          :step="step"
          :disabled="isDisabled"
          :required="required"
          @input="onInput"
          @blur="onBlur"
          @keydown.enter.prevent="() => inputRef?.blur()"
          @focus="focused = true"
        />

        <NbMessage
          v-if="error"
          variant="error"
          :icon-only="true"
          live="off"
          aria-hidden="true"
          class="nb-number-input__status"
          >{{ error }}</NbMessage
        >
        <NbMessage
          v-else-if="warning"
          variant="warning"
          :icon-only="true"
          live="off"
          aria-hidden="true"
          class="nb-number-input__status"
          >{{ warning }}</NbMessage
        >

        <!-- The steppers are for the pointer and touch. They are out of the
             tab order, as in Carbon, because the arrow keys on the field
             already step the value, and two extra stops per number field
             only slow a keyboard user down. At a limit a stepper is
             aria-disabled, which NbButton draws as disabled. -->
        <div class="nb-number-input__steppers">
          <span class="nb-number-input__divider" aria-hidden="true" />
          <NbButton
            variant="ghost"
            icon="minus"
            :size="resolvedSize"
            :label="nbStrings.numberInputDecrease"
            tooltip-position="top"
            class="nb-number-input__stepper"
            tabindex="-1"
            :class="{ 'nb-number-input__stepper--at-limit': isAtMin }"
            :disabled="isDisabled"
            :aria-disabled="isAtMin || undefined"
            @mousedown.prevent
            @click="decrement"
          />
          <span class="nb-number-input__divider" aria-hidden="true" />
          <NbButton
            variant="ghost"
            icon="plus"
            :size="resolvedSize"
            :label="nbStrings.numberInputIncrease"
            tooltip-position="top"
            class="nb-number-input__stepper"
            tabindex="-1"
            :class="{ 'nb-number-input__stepper--at-limit': isAtMax }"
            :disabled="isDisabled"
            :aria-disabled="isAtMax || undefined"
            @mousedown.prevent
            @click="increment"
          />
        </div>
      </div>

      <NbMessage
        v-if="error"
        :id="ids.error"
        :key="messageKey"
        variant="error"
        :live="messageLive"
        class="nb-number-input__message"
        >{{ error }}</NbMessage
      >
      <NbMessage
        v-else-if="warning"
        :id="ids.warning"
        :key="messageKey"
        variant="warning"
        :live="messageLive"
        class="nb-number-input__message"
        >{{ warning }}</NbMessage
      >
      <NbMessage
        v-else-if="helper"
        :id="ids.helper"
        :key="messageKey"
        variant="helper"
        :live="messageLive"
        class="nb-number-input__message"
        >{{ helper }}</NbMessage
      >
    </template>

    <!-- FLUID variant -->
    <template v-else-if="variant === 'fluid'">
      <div class="nb-number-input__field-wrapper" :class="wrapperClasses">
        <div v-if="label" class="nb-number-input__inner-header">
          <label :for="inputId" class="nb-number-input__inner-label">
            {{ label }}
            <span
              v-if="required"
              class="nb-number-input__asterisk"
              aria-hidden="true"
              >*</span
            >
          </label>
          <NbMessage
            v-if="helper && !error && !warning"
            :id="ids.helper"
            variant="helper"
            live="off"
            :icon-only="true"
            class="nb-number-input__inner-message"
            >{{ helper }}</NbMessage
          >
        </div>

        <div class="nb-number-input__fluid-row">
          <input
            :id="inputId"
            ref="inputRef"
            :aria-invalid="ariaInvalid"
            :aria-describedby="describedBy"
            type="number"
            class="nb-number-input__field"
            :placeholder="placeholder"
            :min="min"
            :max="max"
            :step="step"
            :disabled="isDisabled"
            :required="required"
            @input="onInput"
            @blur="onBlur"
            @keydown.enter.prevent="() => inputRef?.blur()"
            @focus="focused = true"
          />

          <NbMessage
            v-if="error"
            variant="error"
            :icon-only="true"
            live="off"
            aria-hidden="true"
            class="nb-number-input__status"
            >{{ error }}</NbMessage
          >
          <NbMessage
            v-else-if="warning"
            variant="warning"
            :icon-only="true"
            live="off"
            aria-hidden="true"
            class="nb-number-input__status"
            >{{ warning }}</NbMessage
          >

          <div class="nb-number-input__steppers">
            <span class="nb-number-input__divider" aria-hidden="true" />
            <NbButton
              variant="ghost"
              icon="minus"
              :size="resolvedSize"
              :label="nbStrings.numberInputDecrease"
              tooltip-position="top"
              class="nb-number-input__stepper"
              tabindex="-1"
              :class="{ 'nb-number-input__stepper--at-limit': isAtMin }"
              :disabled="isDisabled"
              :aria-disabled="isAtMin || undefined"
              @mousedown.prevent
              @click="decrement"
            />
            <span class="nb-number-input__divider" aria-hidden="true" />
            <NbButton
              variant="ghost"
              icon="plus"
              :size="resolvedSize"
              :label="nbStrings.numberInputIncrease"
              tooltip-position="top"
              class="nb-number-input__stepper"
              tabindex="-1"
              :class="{ 'nb-number-input__stepper--at-limit': isAtMax }"
              :disabled="isDisabled"
              :aria-disabled="isAtMax || undefined"
              @mousedown.prevent
              @click="increment"
            />
          </div>
        </div>
      </div>

      <NbMessage
        v-if="error"
        :id="ids.error"
        :key="messageKey"
        variant="error"
        :live="messageLive"
        class="nb-number-input__fluid-message"
        >{{ error }}</NbMessage
      >
      <NbMessage
        v-else-if="warning"
        :id="ids.warning"
        :key="messageKey"
        variant="warning"
        :live="messageLive"
        class="nb-number-input__fluid-message"
        >{{ warning }}</NbMessage
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { computed, onMounted, ref, watch } from 'vue'
import type { IFieldComponent } from '@/types/Props.d'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbButton from './Button.vue'
import { useStableId } from '@/composables/useStableId.composable'
import {
  joinDescribedBy,
  useFieldMessage,
} from '@/composables/useFieldMessage.composable'
import { useInputGroupField } from './InputGroup.context'

const nbStrings = useNbStrings()

export interface INumberInputProps extends IFieldComponent {
  modelValue?: number | null
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<INumberInputProps>(), {
  modelValue: null,
  label: '',
  placeholder: '',
  helper: '',
  error: '',
  warning: '',
  min: undefined,
  max: undefined,
  step: 1,
  variant: 'default',
  size: 'md',
  disabled: false,
  required: false,
  id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)

// Positional, so two fields never share an id.
const autoId = useStableId({})
// Inside an NbInputGroup the group's size, disabled state and message win,
// and the first field takes the id the group's label points at.
const group = useInputGroupField(props, autoId)
const inputId = group.id
const resolvedSize = group.size
const isDisabled = group.disabled
const {
  ids,
  messageId,
  invalid,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, inputId)
const describedBy = computed(() =>
  joinDescribedBy(messageId.value, group.describedBy.value),
)
const ariaInvalid = computed(
  () => invalid.value ?? (group.status.value === 'error' ? 'true' : undefined),
)
const hasError = computed(() => !!props.error || group.status.value === 'error')
const hasWarning = computed(
  () =>
    !hasError.value && (!!props.warning || group.status.value === 'warning'),
)
const isAtMin = computed(
  () =>
    props.min !== undefined &&
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue <= props.min,
)
const isAtMax = computed(
  () =>
    props.max !== undefined &&
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue >= props.max,
)

function clamp(value: number): number {
  let v = value
  if (props.min !== undefined) v = Math.max(props.min, v)
  if (props.max !== undefined) v = Math.min(props.max, v)
  return v
}

function syncDisplay(val: number | null | undefined) {
  if (!inputRef.value) return
  inputRef.value.value = val !== null && val !== undefined ? String(val) : ''
}

onMounted(() => syncDisplay(props.modelValue))

watch(
  () => props.modelValue,
  (val) => {
    if (!focused.value) syncDisplay(val)
  },
)

function increment() {
  const current = props.modelValue ?? 0
  const next = clamp(current + props.step)
  emit('update:modelValue', next)
  emit('change', next)
  syncDisplay(next)
}

function decrement() {
  const current = props.modelValue ?? 0
  const next = clamp(current - props.step)
  emit('update:modelValue', next)
  emit('change', next)
  syncDisplay(next)
}

function onInput() {
  if (!inputRef.value) return
  const raw = inputRef.value.value
  if (raw === '') {
    emit('update:modelValue', null)
  } else {
    const num = parseFloat(raw)
    if (!isNaN(num)) emit('update:modelValue', num)
  }
}

function onBlur() {
  focused.value = false
  if (!inputRef.value) return
  const raw = inputRef.value.value
  if (raw === '') {
    emit('update:modelValue', null)
    emit('change', null)
    return
  }
  const num = parseFloat(raw)
  if (!isNaN(num)) {
    const clamped = clamp(num)
    emit('update:modelValue', clamped)
    emit('change', clamped)
    syncDisplay(clamped)
  }
}

const rootClasses = computed(() => [
  'nb-number-input',
  `nb-number-input--${props.variant}`,
  `nb-number-input--${resolvedSize.value}`,
  {
    'nb-number-input--error': hasError.value,
    'nb-number-input--warning': hasWarning.value,
    'nb-number-input--disabled': isDisabled.value,
  },
])

const wrapperClasses = computed(() => ({
  'nb-number-input__field-wrapper--focused': focused.value,
  'nb-number-input__field-wrapper--error': hasError.value,
  'nb-number-input__field-wrapper--warning': hasWarning.value,
  'nb-number-input__field-wrapper--disabled': isDisabled.value,
}))

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped lang="scss">
@use '../styles/logic/touch' as touch;
@use '../styles/logic/field' as field;

.nb-number-input {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--nb-field-label-gap);
  font-family: var(--nb-font-family-sans, sans-serif);
  --field-h: var(--nb-field-height-md);

  &--xs {
    --field-h: var(--nb-field-height-xs);
    --nb-field-font-size: var(--nb-type-body-compact-size);
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

  &__field-wrapper {
    position: relative;
    display: flex;
    align-items: stretch;
    background: var(--nb-c-field-bg);
    // The same box NbTextInput and NbSelect draw, so a number sitting in a row
    // of fields keeps their silhouette under either appearance.
    /*
     * One colour for all four sides, and the WIDTH decides which are drawn.
     *
     * The colour must not be aliased through a second token set by the
     * appearance block. That block lives on `<html>`, so `var()` inside it
     * substitutes there, against the palette in force at the root, and the
     * resolved value then inherits down unchanged. A page that switches mode
     * on a wrapper rather than on `<html>` (which is how the documentation
     * previews and any per-region dark area work) therefore got LIGHT sides
     * and a DARK bottom rule on the same field. Naming the token here instead
     * resolves it against the element's own palette, so all four edges always
     * agree.
     */
    border: var(--nb-field-border-width, 0) solid var(--nb-c-field-border);
    // Always 1px, and the only edge square draws.
    border-bottom: 1px solid var(--nb-c-field-border);
    @include field.radius;
    height: var(--field-h);
    box-sizing: border-box;
    transition:
      border-color var(--nb-motion-short),
      box-shadow var(--nb-motion-short);

    &--focused {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }

    &--error {
      /*
       * `border-color` sets all four sides, but only the sides that have a
       * width can show: square draws none, so the state reads on the bottom
       * rule alone; rounded draws all four, so the state rings the capsule.
       * One rule, both idioms.
       */
      border-color: var(--nb-c-danger);
      box-shadow: inset 0 calc(-1px * var(--nb-field-status-emphasis, 1)) 0 0
        var(--nb-c-danger);
    }

    &--warning {
      /*
       * `border-color` sets all four sides, but only the sides that have a
       * width can show: square draws none, so the state reads on the bottom
       * rule alone; rounded draws all four, so the state rings the capsule.
       * One rule, both idioms.
       */
      border-color: var(--nb-c-warning);
      box-shadow: inset 0 calc(-1px * var(--nb-field-status-emphasis, 1)) 0 0
        var(--nb-c-warning);
    }

    &--disabled {
      opacity: var(--nb-field-disabled-opacity);
      cursor: not-allowed;
    }
  }

  &__field {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 var(--nb-field-padding-h);
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: var(--nb-field-font-size);
    // Below 16px iOS zooms the page in when the field takes focus.
    @include touch.touch-field-text;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    color: var(--nb-c-text);

    // Hide native number spinners
    appearance: none;
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__status {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 4px;
  }

  &__steppers {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }

  /*
   * The steppers are NbButtons: ghost, icon-only, named by `label`, and the
   * same size as the field, so they get the shared hover, the shared focus
   * ring and a tooltip instead of a hand-made square that drew no ring at
   * all. Each is as wide as the field is tall (40px at md, as before) and
   * fills the field's height inside its border, so the pair still reads as
   * one two-segment control at the end of the box. ArrowUp and ArrowDown on
   * the input itself still step, natively.
   */
  &__steppers .nb-number-input__stepper {
    // Knob so dense containers (e.g. .nb-inspector) can narrow the steppers.
    width: var(--nb-number-input-stepper-width, var(--field-h));
    height: auto;
    align-self: stretch;
    flex-shrink: 0;
  }

  // The rule between the input and each stepper: half the field's height,
  // centred, so the two segments read as parts of one box.
  &__divider {
    align-self: center;
    flex-shrink: 0;
    width: 1px;
    height: 50%;
    background: var(--nb-c-field-border);
  }

  &__message,
  &__fluid-message {
    font-size: var(--nb-type-body-sm-size);
  }

  // FLUID variant
  &--fluid {
    .nb-number-input__field-wrapper {
      // When a label is present inside: expand to column layout
      &:has(.nb-number-input__inner-header) {
        flex: 1;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        height: auto;
        min-height: calc(var(--nb-base-unit) * 8);
        padding-top: 8px;
      }
    }

    .nb-number-input__inner-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 var(--nb-field-padding-h);
      margin-bottom: 4px;
    }

    .nb-number-input__inner-label {
      flex: 1;
      min-width: 0;
      font-size: var(--nb-type-overline-size);
      font-weight: var(--nb-type-overline-weight);
      color: var(--nb-c-text-muted);
      text-transform: var(--nb-type-overline-text-transform);
      letter-spacing: var(--nb-type-overline-letter-spacing);
      cursor: default;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nb-number-input__asterisk {
      color: var(--nb-c-danger);
    }

    .nb-number-input__fluid-row {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .nb-number-input__field {
      height: auto;
      flex: 1;
      padding: 6px var(--nb-field-padding-h) 10px;
      font-size: var(--nb-type-body-compact-size);
      @include touch.touch-field-text;
    }

    .nb-number-input__steppers {
      align-self: stretch;
    }

    .nb-number-input__stepper {
      height: 100%;
    }
  }
}
</style>
