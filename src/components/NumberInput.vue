<template>
  <div :class="rootClasses">
    <!-- DEFAULT variant -->
    <template v-if="variant === 'default'">
      <NbLabel
        v-if="label"
        :for="inputId"
        :required="required"
        :disabled="disabled"
        >{{ label }}</NbLabel
      >

      <div class="nb-number-input__field-wrapper" :class="wrapperClasses">
        <input
          :id="inputId"
          ref="inputRef"
          type="number"
          class="nb-number-input__field"
          :placeholder="placeholder"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
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
          class="nb-number-input__status"
          >{{ error }}</NbMessage
        >
        <NbMessage
          v-else-if="warning"
          variant="warning"
          :icon-only="true"
          class="nb-number-input__status"
          >{{ warning }}</NbMessage
        >

        <div class="nb-number-input__steppers">
          <button
            type="button"
            class="nb-number-input__stepper"
            :class="{ 'nb-number-input__stepper--at-limit': isAtMin }"
            :disabled="disabled"
            aria-label="Decrease"
            @mousedown.prevent
            @click="decrement"
          >
            <NbIcon name="minus" :size="16" />
          </button>
          <button
            type="button"
            class="nb-number-input__stepper"
            :class="{ 'nb-number-input__stepper--at-limit': isAtMax }"
            :disabled="disabled"
            aria-label="Increase"
            @mousedown.prevent
            @click="increment"
          >
            <NbIcon name="plus" :size="16" />
          </button>
        </div>
      </div>

      <NbMessage
        v-if="error"
        variant="error"
        class="nb-number-input__message"
        >{{ error }}</NbMessage
      >
      <NbMessage
        v-else-if="warning"
        variant="warning"
        class="nb-number-input__message"
        >{{ warning }}</NbMessage
      >
      <NbMessage
        v-else-if="helper"
        variant="helper"
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
            variant="helper"
            :icon-only="true"
            class="nb-number-input__inner-message"
            >{{ helper }}</NbMessage
          >
        </div>

        <div class="nb-number-input__fluid-row">
          <input
            :id="inputId"
            ref="inputRef"
            type="number"
            class="nb-number-input__field"
            :placeholder="placeholder"
            :min="min"
            :max="max"
            :step="step"
            :disabled="disabled"
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
            class="nb-number-input__status"
            >{{ error }}</NbMessage
          >
          <NbMessage
            v-else-if="warning"
            variant="warning"
            :icon-only="true"
            class="nb-number-input__status"
            >{{ warning }}</NbMessage
          >

          <div class="nb-number-input__steppers">
            <button
              type="button"
              class="nb-number-input__stepper"
              :class="{ 'nb-number-input__stepper--at-limit': isAtMin }"
              :disabled="disabled"
              aria-label="Decrease"
              @mousedown.prevent
              @click="decrement"
            >
              <NbIcon name="minus" :size="16" />
            </button>
            <button
              type="button"
              class="nb-number-input__stepper"
              :class="{ 'nb-number-input__stepper--at-limit': isAtMax }"
              :disabled="disabled"
              aria-label="Increase"
              @mousedown.prevent
              @click="increment"
            >
              <NbIcon name="plus" :size="16" />
            </button>
          </div>
        </div>
      </div>

      <NbMessage
        v-if="error"
        variant="error"
        class="nb-number-input__fluid-message"
        >{{ error }}</NbMessage
      >
      <NbMessage
        v-else-if="warning"
        variant="warning"
        class="nb-number-input__fluid-message"
        >{{ warning }}</NbMessage
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import type { IFieldComponent } from '@/types/Props.d'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbIcon from './Icon.vue'

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

const autoId = `nb-number-input-${useId()}`
const inputId = computed(() => props.id ?? autoId)

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
  `nb-number-input--${props.size}`,
  {
    'nb-number-input--error': !!props.error,
    'nb-number-input--warning': !props.error && !!props.warning,
    'nb-number-input--disabled': props.disabled,
  },
])

const wrapperClasses = computed(() => ({
  'nb-number-input__field-wrapper--focused': focused.value,
  'nb-number-input__field-wrapper--error': !!props.error,
  'nb-number-input__field-wrapper--warning': !props.error && !!props.warning,
  'nb-number-input__field-wrapper--disabled': props.disabled,
}))

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped lang="scss">
.nb-number-input {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
  font-family: var(--nb-font-family-sans, sans-serif);
  --field-h: var(--nb-field-height-md);

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
    border-bottom: 1px solid var(--nb-c-field-border);
    height: var(--field-h);
    box-sizing: border-box;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &--focused {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: -2px;
    }

    &--error {
      border: 1px solid var(--nb-c-danger);
      box-shadow: none;
    }

    &--warning {
      border: 1px solid var(--nb-c-warning);
      box-shadow: none;
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
    font-weight: 400;
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

  &__stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--nb-c-text);
    transition: background 0.15s;
    padding: 0;
    flex-shrink: 0;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: var(--nb-c-field-border);
    }

    &:hover:not(:disabled):not(.nb-number-input__stepper--at-limit) {
      background: var(--nb-c-discrete);
    }

    &:disabled {
      cursor: not-allowed;
    }

    &--at-limit {
      opacity: var(--nb-field-disabled-opacity);
      cursor: not-allowed;
    }
  }

  &__message,
  &__fluid-message {
    font-size: var(--nb-font-size-12);
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
      font-size: var(--nb-font-size-12);
      font-weight: 500;
      color: var(--nb-c-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.02em;
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
      font-size: 15px;
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
