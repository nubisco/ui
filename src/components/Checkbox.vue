<template>
  <label :class="['nb-checkbox', { 'nb-checkbox--disabled': disabled }]">
    <span class="nb-checkbox__control">
      <input
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
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
import { ICheckboxProps } from './Checkbox.d'

const props = withDefaults(defineProps<ICheckboxProps>(), {
  id: 'checkbox',
  modelValue: false,
  disabled: false,
  indeterminate: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function handleChange(e: Event) {
  if (!props.disabled) {
    emit('update:modelValue', (e.target as HTMLInputElement).checked)
  }
}
</script>

<style scoped lang="scss">
.nb-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__control {
    position: relative;
    flex-shrink: 0;
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
    border: 1.5px solid var(--nb-c-border, #d0d0d0);
    border-radius: 4px;
    transition:
      background 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
    color: #fff;
  }

  &__check {
    width: 10px;
    height: 8px;
  }

  &__dash {
    width: 8px;
    height: 1.5px;
    background: currentColor;
    border-radius: 1px;
  }

  &__label {
    font-size: 13px;
    color: var(--nb-c-text, #1a1a2e);
    line-height: 1.4;
  }

  /* Checked / indeterminate state */
  &__input:checked ~ &__box,
  &__input:indeterminate ~ &__box {
    background: var(--nb-c-grape-hyacinth-500, #5856a9);
    border-color: var(--nb-c-grape-hyacinth-500, #5856a9);
  }

  /* Focus ring */
  &__input:focus-visible ~ &__box {
    box-shadow: 0 0 0 3px var(--nb-c-grape-hyacinth-200, #d6d5f2);
  }

  &:hover:not(.nb-checkbox--disabled) &__box {
    border-color: var(--nb-c-grape-hyacinth-400, #7b79c0);
  }
}
</style>
