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
      :size="18"
      weight="fill"
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
    <button
      v-if="canDismiss"
      type="button"
      class="nb-banner__close"
      :aria-label="props.closeLabel"
      @click="dismiss"
    >
      <NbIcon name="x" :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import NbIcon from './Icon.vue'
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

// Filled weight, so the shape has to carry the meaning on its own: a filled
// `warning` is a solid triangle, a filled `warning-circle` a solid disc. Each
// status gets a distinct silhouette, because colour is not allowed to be the
// only difference between them.
const iconMap = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  error: 'x-circle',
  neutral: 'note',
} as const
</script>

<style scoped lang="scss">
.nb-banner {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--nb-base-unit) * 1.5);
  padding: calc(var(--nb-base-unit) * 1.5) calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-banner-border);
  // The status bar. A saturated edge against a quiet ground is what makes a
  // notification readable at a glance from across the page, before any of the
  // words are: the ground alone is too pale to carry the status on its own.
  border-inline-start: 3px solid var(--nb-banner-accent);
  border-radius: calc(var(--nb-base-unit) / 2);
  background: var(--nb-banner-bg);
  color: var(--nb-banner-fg);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-font-size-13, 13px);
  line-height: 1.5;

  // Three custom properties, set once per status, so every rule below reads
  // from the same place and a consumer can retint a single banner without
  // reaching into the internals. The accent is the SATURATED semantic colour,
  // deliberately not the surface: it is doing the opposite job.
  &--info {
    --nb-banner-bg: var(--nb-c-info-surface);
    --nb-banner-fg: var(--nb-c-on-info-surface);
    --nb-banner-border: var(--nb-c-info-surface-border);
    --nb-banner-accent: var(--nb-c-info);
  }
  &--success {
    --nb-banner-bg: var(--nb-c-success-surface);
    --nb-banner-fg: var(--nb-c-on-success-surface);
    --nb-banner-border: var(--nb-c-success-surface-border);
    --nb-banner-accent: var(--nb-c-success);
  }
  &--warning {
    --nb-banner-bg: var(--nb-c-warning-surface);
    --nb-banner-fg: var(--nb-c-on-warning-surface);
    --nb-banner-border: var(--nb-c-warning-surface-border);
    --nb-banner-accent: var(--nb-c-warning);
  }
  &--error {
    --nb-banner-bg: var(--nb-c-danger-surface);
    --nb-banner-fg: var(--nb-c-on-danger-surface);
    --nb-banner-border: var(--nb-c-danger-surface-border);
    --nb-banner-accent: var(--nb-c-danger);
  }
  &--neutral {
    --nb-banner-bg: var(--nb-c-neutral-surface);
    --nb-banner-fg: var(--nb-c-on-neutral-surface);
    --nb-banner-border: var(--nb-c-neutral-surface-border);
    --nb-banner-accent: var(--nb-c-component-plain);
  }

  // Edge to edge inside a region that already has its own boundary, such as
  // NbShell's notification area. The status bar SURVIVES: it is the identity of
  // the thing, not decoration on it. Only the borders that would draw a box
  // inside an existing box go.
  &--flush {
    border-radius: 0;
    border-inline-end: none;
    border-block-start: none;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--nb-banner-accent);
    // Optically centred on the FIRST line rather than on the box, so a banner
    // that wraps to three lines keeps its icon beside the sentence it belongs
    // to: (1.5em line box - 18px glyph) / 2.
    margin-block-start: calc((1.5em - 18px) / 2);
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

  // Everything in the row hangs off the FIRST line of text, not off the middle
  // of a box whose height depends on how much body copy there happens to be.
  // A banner that wraps to three lines keeps its icon and its close button
  // beside the sentence they belong to, which is where the eye looks for them.
  &__actions {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) / 2);
    flex-shrink: 0;
    margin-block-start: calc((1.5em - 24px) / 2);
  }

  // Not an NbButton: ghost's hover fills with the PRIMARY colour, which lands a
  // purple rectangle inside a red banner. Same treatment NbToast gives its own
  // close button, tinted from the banner rather than from the theme.
  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: currentColor;
    cursor: pointer;
    opacity: 0.7;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;
    margin-block-start: calc((1.5em - 22px) / 2);

    &:hover {
      opacity: 1;
      background: color-mix(in srgb, currentColor 12%, transparent);
    }

    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 1px;
      opacity: 1;
    }
  }
}
</style>
