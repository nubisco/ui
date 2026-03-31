<template>
  <label
    :for="htmlFor"
    :class="[
      'nb-label',
      `nb-label--${size}`,
      { 'nb-label--required': required, 'nb-label--disabled': disabled },
    ]"
  >
    <slot />
    <span v-if="required" class="nb-label__asterisk" aria-hidden="true">*</span>
    <!-- Optional trailing content: badges, status pills, extra info -->
    <slot name="suffix" />
  </label>
</template>

<script setup lang="ts">
import { ELabelSize, ILabelProps } from './Label.d'

withDefaults(defineProps<ILabelProps>(), {
  htmlFor: undefined,
  required: false,
  disabled: false,
  size: ELabelSize.Medium,
})
</script>

<style scoped lang="scss">
.nb-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--nb-font-family-sans);
  font-weight: 500;
  color: var(--nb-c-text-muted);
  cursor: default;
  user-select: none;

  &--sm {
    font-size: var(--nb-font-size-12);
    letter-spacing: 0.02em;
  }
  &--md {
    font-size: var(--nb-font-size-12);
  }

  &--disabled {
    opacity: 0.45;
  }

  &__asterisk {
    color: var(--nb-c-danger);
    font-size: 1em;
    line-height: 1;
  }
}
</style>
