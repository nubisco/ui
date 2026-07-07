<template>
  <label :class="['nb-checkbox', { 'nb-checkbox--disabled': isDisabled }]">
    <span class="nb-checkbox__control">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="isDisabled"
        :indeterminate="indeterminate"
        class="nb-checkbox__input"
        @change="handleChange"
      />
      <span class="nb-checkbox__box">
        <svg
          v-if="modelValue && !indeterminate"
          class="nb-checkbox__check"
          viewBox="0 0 10 8"
          fill="none"
        >
          <path
            d="M1 4l3 3 5-6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span v-if="indeterminate" class="nb-checkbox__dash" />
      </span>
    </span>
    <span v-if="label" class="nb-checkbox__label">{{ label }}</span>
    <slot v-else />
  </label>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { ICheckboxProps } from './Checkbox.d'
import { NB_CHECKBOX_GROUP_CONTEXT } from './CheckboxGroup.context'

const props = withDefaults(defineProps<ICheckboxProps>(), {
  id: 'checkbox',
  modelValue: false,
  disabled: false,
  indeterminate: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

// Group-level disabled cascades to every child without prop-drilling
const group = inject(NB_CHECKBOX_GROUP_CONTEXT, null)
const isDisabled = computed(() => props.disabled || !!group?.disabled.value)

function handleChange(e: Event) {
  if (!isDisabled.value) {
    emit('update:modelValue', (e.target as HTMLInputElement).checked)
  }
}
</script>

<style scoped lang="scss">
.nb-checkbox {
  display: inline-flex;
  // Top-align so the box stays on the first line of multi-line labels
  align-items: flex-start;
  gap: 10px;
  min-height: 20px;
  cursor: pointer;
  user-select: none;
  font-family: var(--nb-font-family-sans);

  &--disabled {
    opacity: var(--nb-field-disabled-opacity, 0.45);
    cursor: not-allowed;
  }

  &__control {
    position: relative;
    flex-shrink: 0;
    // Centers the 16px box against the first 20px text line
    margin-top: 2px;
  }

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  &__box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 1px solid var(--nb-c-field-border);
    border-radius: 0;
    transition:
      background 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
    color: var(--nb-c-bg);
  }

  &__check {
    width: 10px;
    height: 8px;
  }

  &__dash {
    width: 8px;
    height: 2px;
    background: currentColor;
  }

  &__label {
    font-size: var(--nb-font-size-14);
    color: var(--nb-c-text);
    line-height: 1.4;
  }

  /* Checked / indeterminate state */
  &__input:checked ~ &__box,
  &__input:indeterminate ~ &__box {
    background: var(--nb-c-contrast);
    border-color: var(--nb-c-contrast);
  }

  /* Focus ring */
  &__input:focus-visible ~ &__box {
    box-shadow: 0 0 0 2px var(--nb-c-focus-ring);
  }

  &:hover:not(.nb-checkbox--disabled) &__box {
    border-color: var(--nb-c-primary);
  }
}
</style>
