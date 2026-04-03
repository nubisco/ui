<template>
  <component
    :is="to ? 'a' : href ? 'a' : 'button'"
    :class="[
      'nb-button',
      `nb-button--${variant}`,
      `nb-button--${size}`,
      { 'nb-button--outlined': outlined },
      { 'nb-button--loading': loading },
      { 'nb-button--icon-only': isIconOnly },
    ]"
    :href="to ? (typeof to === 'string' ? to : undefined) : (href ?? undefined)"
    :target="href ? target : undefined"
    :rel="href ? rel : undefined"
    :disabled="!href && !to ? disabled || loading : undefined"
    :aria-disabled="(href || to) && (disabled || loading) ? true : undefined"
    :type="!href && !to ? type : undefined"
    @click="disabled || loading ? undefined : $emit('click', $event)"
  >
    <slot />
    <div v-if="loading || icon" class="nb-button__decorations">
      <span v-if="loading" class="nb-button__spinner" aria-hidden="true" />
      <NbIcon
        v-else-if="icon"
        :name="icon"
        :size="iconSize"
        class="nb-button__icon"
      />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import { EButtonType, IButtonProps } from './Button.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IButtonProps>(), {
  variant: undefined,
  outlined: false,
  size: ESizeShort.Medium,
  disabled: false,
  loading: false,
  icon: undefined,
  type: EButtonType.Button,
  href: undefined,
  target: undefined,
  rel: undefined,
  to: undefined,
})

defineEmits<{ click: [event: MouseEvent] }>()

const slots = useSlots()
const isIconOnly = computed(
  () => !slots.default && !!(props.icon || props.loading),
)

const iconSizeMap: Record<string, number> = {
  xxs: 10,
  xs: 12,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 16,
  xxl: 20,
}
const iconSize = computed(() => iconSizeMap[props.size ?? 'md'] ?? 14)
</script>

<style scoped lang="scss">
.nb-button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  border: none;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    box-shadow 0.15s;
  white-space: nowrap;
  outline: none;

  &:focus-visible {
    outline: 1px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }
  line-height: 1;
  position: relative;
  text-decoration: none;
  background: var(--nb-c-contrast);
  color: var(--nb-c-surface);
  padding-inline: calc(var(--nb-base-unit) * 2) calc(var(--nb-base-unit) * 8);
  &--xxs {
    height: calc(var(--nb-base-unit) * 2);
    padding-block: 0;
    font-size: var(--nb-font-size-12);
    --nb-button-icon-size: var(--nb-font-size-12);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 5);
  }
  &--xs {
    height: calc(var(--nb-base-unit) * 3);
    font-size: var(--nb-font-size-12);
    --nb-button-icon-size: var(--nb-font-size-12);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 5);
  }
  &--sm {
    height: calc(var(--nb-base-unit) * 4);
    font-size: var(--nb-font-size-12);
    --nb-button-icon-size: var(--nb-font-size-12);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 5);
  }
  &--md {
    height: calc(var(--nb-base-unit) * 5);
    font-size: var(--nb-font-size-14);
    --nb-button-icon-size: var(--nb-font-size-14);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 5);
  }
  &--lg {
    height: calc(var(--nb-base-unit) * 6);
    font-size: var(--nb-font-size-14);
    --nb-button-icon-size: var(--nb-font-size-14);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 5);
  }
  &--xl {
    height: calc(var(--nb-base-unit) * 8);
    padding-block: 14px;
    font-size: var(--nb-font-size-16);
    align-items: flex-start;
    --nb-button-icon-size: var(--nb-font-size-16);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 6);
    .nb-button__decorations {
      padding-top: calc(var(--nb-base-unit) * 2);
      align-items: start;
    }
  }
  &--xxl {
    height: calc(var(--nb-base-unit) * 16);
    padding-block: 14px;
    font-size: var(--nb-font-size-32);
    align-items: flex-start;
    --nb-button-icon-size: var(--nb-font-size-32);
    --nb-button-padding-end: calc(var(--nb-base-unit) * 8);
    .nb-button__decorations {
      padding-top: calc(var(--nb-base-unit) * 3);
      align-items: start;
    }
  }

  // Icon-only: no slot content → square button, icon centered and slightly larger
  &--icon-only {
    padding: 0;
    align-items: center;
    justify-content: center;

    &.nb-button--xxs {
      width: 16px;
      --nb-button-icon-size: 12px;
    }
    &.nb-button--xs {
      width: 24px;
      --nb-button-icon-size: 14px;
    }
    &.nb-button--sm {
      width: 32px;
      --nb-button-icon-size: 16px;
    }
    &.nb-button--md {
      width: 40px;
      --nb-button-icon-size: 18px;
    }
    &.nb-button--lg {
      width: 48px;
      --nb-button-icon-size: 20px;
    }
    &.nb-button--xl {
      width: 48px;
      --nb-button-icon-size: 20px;
    }
    &.nb-button--xxl {
      width: 64px;
      --nb-button-icon-size: 26px;
    }

    .nb-button__decorations {
      inset: 0;
      width: auto;
      padding-top: 0;
      align-items: center;
    }
  }

  /* Primary: dark brand */
  &--primary {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-primary-hover);
      color: var(--nb-c-primary-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-primary-active);
      color: var(--nb-c-primary-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-primary-hover-a11y);
    }
  }

  /* Secondary: subtle border */
  &--secondary {
    background: var(--nb-c-secondary);
    color: var(--nb-c-secondary-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-secondary-hover);
      color: var(--nb-c-secondary-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-secondary-active);
      color: var(--nb-c-secondary-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-secondary-hover-a11y);
    }
  }

  /* Ghost: transparent */
  &--ghost {
    background: transparent;
    color: var(--nb-c-contrast);
    border-bottom: 1px solid transparent;
    padding-inline: calc(var(--nb-base-unit) * 2) calc(var(--nb-base-unit) * 2);
    --nb-button-padding-end: auto;
    &:hover:not(:disabled) {
      background: var(--nb-c-primary-hover);
      color: var(--nb-c-primary-hover-a11y);
      border-color: var(--nb-c-grape-hyacinth-200);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-primary-active);
      color: var(--nb-c-primary-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-contrast);
    }
  }

  /* Warning: red */
  &--warning {
    background: var(--nb-c-warning);
    color: var(--nb-c-warning-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-warning-hover);
      color: var(--nb-c-warning-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-warning-active);
      color: var(--nb-c-warning-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-warning-hover-a11y);
    }
  }

  /* Danger: red */
  &--danger {
    background: var(--nb-c-danger);
    color: var(--nb-c-danger-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-danger-hover);
      color: var(--nb-c-danger-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-danger-active);
      color: var(--nb-c-danger-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-danger-hover-a11y);
    }
  }

  /* Success: green */
  &--success {
    background: var(--nb-c-success);
    color: var(--nb-c-success-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-success-hover);
      color: var(--nb-c-success-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-success-active);
      color: var(--nb-c-success-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-success-hover-a11y);
    }
  }

  &--info {
    background: var(--nb-c-info);
    color: var(--nb-c-info-a11y);
    &:hover:not(:disabled) {
      background: var(--nb-c-info-hover);
      color: var(--nb-c-info-hover-a11y);
    }
    &:active:not(:disabled) {
      background: var(--nb-c-info-active);
      color: var(--nb-c-info-active-a11y);
    }
    &:focus-visible {
      outline-color: var(--nb-c-info-hover-a11y);
    }
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
    &:focus-visible {
      outline-color: transparent;
    }
  }

  // Outlined modifier: transparent background, colored border and text
  // Applied to all variants except ghost (which has no bg by design)
  &--outlined:not(&--ghost) {
    background: transparent;
    color: var(--nb-c-contrast);
    border: 1px solid currentColor;
  }

  &--outlined {
    &.nb-button--primary {
      color: var(--nb-c-primary);
      &:hover:not(:disabled) {
        color: var(--nb-c-primary);
        background: color-mix(in srgb, var(--nb-c-primary) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-primary) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-primary);
      }
    }
    &.nb-button--secondary {
      color: var(--nb-c-secondary);
      &:hover:not(:disabled) {
        color: var(--nb-c-secondary);
        background: color-mix(in srgb, var(--nb-c-secondary) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-secondary) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-secondary);
      }
    }
    &.nb-button--danger {
      color: var(--nb-c-danger);
      &:hover:not(:disabled) {
        color: var(--nb-c-danger);
        background: color-mix(in srgb, var(--nb-c-danger) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-danger) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-danger);
      }
    }
    &.nb-button--warning {
      color: var(--nb-c-warning);
      &:hover:not(:disabled) {
        color: var(--nb-c-warning);
        background: color-mix(in srgb, var(--nb-c-warning) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-warning) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-warning);
      }
    }
    &.nb-button--success {
      color: var(--nb-c-success);
      &:hover:not(:disabled) {
        color: var(--nb-c-success);
        background: color-mix(in srgb, var(--nb-c-success) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-success) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-success);
      }
    }
    &.nb-button--info {
      color: var(--nb-c-info);
      &:hover:not(:disabled) {
        color: var(--nb-c-info);
        background: color-mix(in srgb, var(--nb-c-info) 8%, transparent);
      }
      &:active:not(:disabled) {
        background: color-mix(in srgb, var(--nb-c-info) 14%, transparent);
      }
      &:focus-visible {
        outline-color: var(--nb-c-info);
      }
    }
  }

  &--loading {
    cursor: wait;
    pointer-events: none;
  }

  &__decorations {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--nb-button-padding-end);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__spinner {
    width: var(--nb-button-icon-size, 14px);
    height: var(--nb-button-icon-size, 14px);
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: nb-spin 0.6s linear infinite;
  }

  @keyframes nb-spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
