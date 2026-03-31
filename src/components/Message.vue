<template>
  <div
    :class="[
      'nb-message',
      `nb-message--${props.variant}`,
      { 'nb-message--icon-only': props.iconOnly },
    ]"
    role="status"
    :aria-live="props.variant === 'error' ? 'assertive' : 'polite'"
  >
    <NbIcon
      :name="iconMap[props.variant]"
      :size="14"
      class="nb-message__icon"
    />
    <span v-if="!props.iconOnly" class="nb-message__text"><slot /></span>
    <!-- CSS-powered tooltip shown on hover in icon-only mode -->
    <span v-if="props.iconOnly" class="nb-message__tooltip" aria-hidden="true"
      ><slot
    /></span>
  </div>
</template>

<script setup lang="ts">
import { EMessageVariant, IMessageProps } from './Message.d'

const props = withDefaults(defineProps<IMessageProps>(), {
  variant: EMessageVariant.Helper,
  iconOnly: false,
})

const iconMap = {
  error: 'warning-circle',
  warning: 'warning',
  helper: 'info',
} as const
</script>

<style scoped lang="scss">
.nb-message {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) / 2);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-font-size-12);
  line-height: 1.4;

  &--error {
    color: var(--nb-c-danger);
  }
  &--warning {
    color: var(--nb-c-warning);
  }
  &--helper {
    color: var(--nb-c-text-subtle);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
  }

  /* Icon-only: hide text, show CSS tooltip on hover */
  &--icon-only {
    position: relative;
    cursor: default;

    .nb-message__text {
      display: none;
    }

    &:hover .nb-message__tooltip,
    &:focus-within .nb-message__tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
  }

  &__tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: var(--nb-c-plain-black-800, #1f2937);
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 400;
    white-space: nowrap;
    max-width: 220px;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-50%) translateY(4px);
    transition:
      opacity 0.15s ease,
      transform 0.15s ease,
      visibility 0.15s ease;
    pointer-events: none;
    z-index: var(--nb-zindex-tooltip, 401);

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--nb-c-plain-black-800, #1f2937);
    }
  }
}
</style>
