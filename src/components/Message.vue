<template>
  <div
    :class="[
      'nb-message',
      `nb-message--${props.variant}`,
      { 'nb-message--icon-only': props.iconOnly },
    ]"
    :role="liveRole"
    :aria-live="liveMode"
  >
    <NbIcon :name="iconMap[props.variant]" size="sm" class="nb-message__icon" />
    <span class="nb-message__text"><slot /></span>
    <!-- CSS-powered tooltip shown on hover in icon-only mode. It wraps rather
         than truncating. In icon-only mode the text above is visually hidden,
         not removed, so the live region and a field's aria-describedby still
         read it; the tooltip itself is hidden from assistive tech. -->
    <span v-if="props.iconOnly" class="nb-message__tooltip" aria-hidden="true"
      ><slot
    /></span>
  </div>
</template>

<script setup lang="ts">
import * as iconWarningCircle from '@nubisco/ui/icons/warning-circle'
import * as iconWarning from '@nubisco/ui/icons/warning'
import * as iconCheckCircle from '@nubisco/ui/icons/check-circle'
import * as iconInfo from '@nubisco/ui/icons/info'
import { computed } from 'vue'
import NbIcon from './Icon.vue'
import { EMessageVariant, IMessageProps } from './Message.d'

const props = withDefaults(defineProps<IMessageProps>(), {
  variant: EMessageVariant.Helper,
  iconOnly: false,
  live: 'auto',
})

/*
 * `live="auto"` (the default) is a standalone message: a status region,
 * assertive for an error. A form field passes `off` while its message is the
 * one rendered with the page (read through aria-describedby on focus, never
 * shouted on load), then `alert` or `status` once the message changes.
 */
const liveRole = computed(() => {
  if (props.live === 'off') return undefined
  if (props.live === 'alert') return 'alert'
  return 'status'
})
const liveMode = computed(() => {
  if (props.live === 'off') return undefined
  if (props.live === 'alert') return 'assertive'
  if (props.live === 'status') return 'polite'
  return props.variant === 'error' ? 'assertive' : 'polite'
})

const iconMap = {
  error: iconWarningCircle,
  warning: iconWarning,
  // Deliberate counterpart to error's `warning-circle`: same circled family,
  // so the two outcomes of a validated field read as a matched pair.
  success: iconCheckCircle,
  helper: iconInfo,
} as const
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-message {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) / 2);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);

  &--error {
    color: var(--nb-c-danger);
  }
  &--warning {
    color: var(--nb-c-warning);
  }
  &--success {
    color: var(--nb-c-success);
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

    // Visually hidden rather than display:none, so a field's
    // aria-describedby still reads the text. Nothing moves on screen.
    .nb-message__text {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
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
    background: var(--nb-c-contrast);
    color: var(--nb-c-surface);
    padding: 6px 10px;
    @include radius.surface(popover);
    font-size: var(--nb-type-body-sm-size);
    font-weight: 400;
    width: max-content;
    max-width: 220px;
    white-space: normal;
    overflow-wrap: anywhere;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-50%) translateY(4px);
    transition:
      opacity var(--nb-motion-short) ease,
      transform var(--nb-motion-short) ease,
      visibility var(--nb-motion-short) ease;
    pointer-events: none;
    z-index: var(--nb-zindex-tooltip, 401);

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--nb-c-contrast);
    }
  }
}
</style>
