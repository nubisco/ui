<template>
  <div
    v-if="!closed"
    :class="[
      'nb-banner',
      `nb-banner--${props.status}`,
      `nb-banner--${props.variant}`,
      { 'nb-banner--flush': props.flush },
    ]"
    :role="isAlert ? 'alert' : 'status'"
    :aria-live="isAlert ? 'assertive' : 'polite'"
  >
    <NbIcon
      v-if="!props.hideIcon"
      :name="props.icon ?? iconMap[props.status]"
      :size="16"
      class="nb-banner__icon"
      aria-hidden="true"
    />
    <p class="nb-banner__body">
      <strong v-if="props.title" class="nb-banner__title">{{
        props.title
      }}</strong>
      <span v-if="hasDefaultSlot" class="nb-banner__text"><slot /></span>
    </p>
    <div v-if="hasActionSlot" class="nb-banner__actions">
      <slot name="action" />
    </div>
    <NbButton
      v-if="canDismiss"
      size="xxs"
      variant="ghost"
      icon="x"
      class="nb-banner__close"
      :aria-label="props.closeLabel"
      @click="dismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import NbIcon from './Icon.vue'
import NbButton from './Button.vue'
import { EBannerStatus, EBannerVariant, IBannerProps } from './Banner.d'

const props = withDefaults(
  defineProps<IBannerProps & { closeLabel?: string }>(),
  {
    status: EBannerStatus.Info,
    variant: EBannerVariant.Inline,
    dismissible: false,
    hideIcon: false,
    flush: false,
    closeLabel: 'Dismiss',
  },
)

const emit = defineEmits<{ (e: 'dismiss'): void }>()

const slots = useSlots()
const hasDefaultSlot = computed(() => !!slots.default)
const hasActionSlot = computed(() => !!slots.action)

// A callout states something that is still true after you stop looking at it,
// so it cannot be dismissed however it is configured. Enforcing it here rather
// than trusting callers is what keeps the two variants meaningfully different.
const canDismiss = computed(
  () => props.dismissible && props.variant !== EBannerVariant.Callout,
)

// Errors interrupt; everything else waits its turn. A polite warning that a
// screen reader announces mid-sentence is worse than one announced a beat late.
const isAlert = computed(() => props.status === EBannerStatus.Error)

const closed = ref(false)
function dismiss(): void {
  closed.value = true
  emit('dismiss')
}

const iconMap = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  error: 'warning-circle',
  neutral: 'note',
} as const
</script>

<style scoped lang="scss">
.nb-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--nb-base-unit);
  padding: calc(var(--nb-base-unit) * 1.5) calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-banner-border);
  border-radius: calc(var(--nb-base-unit) / 2);
  background: var(--nb-banner-bg);
  color: var(--nb-banner-fg);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-font-size-13, 13px);
  line-height: 1.5;

  // One pair of custom properties, set once per status, so every rule below
  // reads from the same place and a consumer can retint a single banner without
  // reaching into the internals.
  &--info {
    --nb-banner-bg: var(--nb-c-info-surface);
    --nb-banner-fg: var(--nb-c-on-info-surface);
    --nb-banner-border: var(--nb-c-info-surface-border);
  }
  &--success {
    --nb-banner-bg: var(--nb-c-success-surface);
    --nb-banner-fg: var(--nb-c-on-success-surface);
    --nb-banner-border: var(--nb-c-success-surface-border);
  }
  &--warning {
    --nb-banner-bg: var(--nb-c-warning-surface);
    --nb-banner-fg: var(--nb-c-on-warning-surface);
    --nb-banner-border: var(--nb-c-warning-surface-border);
  }
  &--error {
    --nb-banner-bg: var(--nb-c-danger-surface);
    --nb-banner-fg: var(--nb-c-on-danger-surface);
    --nb-banner-border: var(--nb-c-danger-surface-border);
  }
  &--neutral {
    --nb-banner-bg: var(--nb-c-neutral-surface);
    --nb-banner-fg: var(--nb-c-on-neutral-surface);
    --nb-banner-border: var(--nb-c-neutral-surface-border);
  }

  // Edge to edge inside a region that already has its own boundary, such as
  // NbShell's notification area. Only the bottom rule survives, because that is
  // the line that separates it from what follows.
  &--flush {
    border-radius: 0;
    border-inline: none;
    border-block-start: none;
  }

  &__icon {
    flex-shrink: 0;
    // Optical alignment with the first line of text rather than the box.
    margin-top: 2px;
    color: currentColor;
  }

  &__body {
    flex: 1;
    min-width: 0;
    margin: 0;
  }

  &__title {
    font-weight: var(--nb-font-weight-semibold, 600);

    // The title and the body are one paragraph, so they need a separator that
    // is not a line break. A space is enough and keeps it one sentence to a
    // screen reader.
    + .nb-banner__text::before {
      content: ' ';
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) / 2);
    flex-shrink: 0;
  }

  &__close {
    flex-shrink: 0;
    color: currentColor;
  }
}
</style>
