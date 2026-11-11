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
    <NbCloseButton
      v-if="canDismiss"
      class="nb-banner__close"
      :label="props.closeLabel"
      @click="dismiss"
    />
  </div>
</template>

<script setup lang="ts">
import * as iconInfo from '@nubisco/ui/icons/info'
import * as iconCheckCircle from '@nubisco/ui/icons/check-circle'
import * as iconWarning from '@nubisco/ui/icons/warning'
import * as iconXCircle from '@nubisco/ui/icons/x-circle'
import * as iconNote from '@nubisco/ui/icons/note'
import { computed, ref, useSlots } from 'vue'
import NbIcon from './Icon.vue'
import NbCloseButton from './CloseButton.vue'
import { EBannerStatus, EBannerVariant, IBannerProps } from './Banner.d'

const props = withDefaults(
  defineProps<IBannerProps & { closeLabel?: string }>(),
  {
    status: EBannerStatus.Info,
    variant: EBannerVariant.Inline,
    dismissible: false,
    hideIcon: false,
    flush: false,
    closeLabel: undefined,
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
  info: iconInfo,
  success: iconCheckCircle,
  warning: iconWarning,
  error: iconXCircle,
  neutral: iconNote,
} as const
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/logic/focus' as focus;

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
  // The accent bar runs down the leading edge and the corner follows it. This
  // was pinned square with a note written when square was the only appearance;
  // under rounded a banner is a surface like any other.
  @include radius.surface(panel);
  background: var(--nb-banner-bg);
  color: var(--nb-banner-fg);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-type-body-compact-size);
  line-height: var(--nb-type-body-compact-line-height);
  letter-spacing: var(--nb-type-body-compact-letter-spacing);

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

  // Controls are taller than a line of text, so a banner carrying them is
  // taller than its words need. Pinning the text to the top then leaves it
  // riding high with the slack underneath. Centring the row is only correct
  // BECAUSE the actions are what set the height: without them the first-line
  // alignment above is what keeps a wrapping banner's icon beside its opening
  // sentence, so this is deliberately scoped rather than made the default.
  &:has(.nb-banner__actions) {
    align-items: center;
  }

  // Edge to edge inside a region that already has its own boundary, such as
  // NbShell's notification area. The status bar SURVIVES: it is the identity of
  // the thing, not decoration on it. Only the borders that would draw a box
  // inside an existing box go.
  &--flush {
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

  // Written as a descendant rather than a bare class so it outranks the prose
  // styles of whatever is hosting it. A plain `.nb-banner__body { margin: 0 }`
  // lost to the docs site's own `p` rule, which put 6.5px above the text and
  // 19.5px below it: the banner grew to 73px for one line of 13px type, the
  // padding read as lopsided, and the icon sat 6px above the sentence it
  // belongs to. Any app that styles paragraphs would have done the same.
  & &__body {
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
    // Centred rather than offset by a hard-coded guess: the controls in here
    // are whatever the caller put in, and their height is not knowable from a
    // stylesheet. An earlier version assumed 24px and was 3px out against a
    // 32px button.
    align-self: center;
  }

  /*
   * NbCloseButton at sm, the inline close every toast and banner shares, in
   * the banner's own ink. A ghost draws the page's text colour on the page's
   * hover grey, and neither belongs inside a tinted status ground: the grey is
   * a patch of the wrong surface in a red banner. So the glyph takes the
   * banner's foreground, which each status already pairs with its ground at
   * AA, and the hover is that same foreground mixed into the ground, which
   * stays legible whatever the status. The focus ring's inner band is the
   * banner's ground rather than the page's surface, for the same reason.
   */
  .nb-banner__close.nb-button--ghost {
    flex-shrink: 0;
    color: var(--nb-banner-fg);
    // Centred on the first line, like the icon: (1.5em line box - 32px) / 2.
    margin-block: calc((1.5em - 32px) / 2);

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--nb-banner-fg) 12%, transparent);
    }
    &:active:not(:disabled) {
      background: color-mix(in srgb, var(--nb-banner-fg) 20%, transparent);
    }
    &:focus-visible {
      @include focus.ring(var(--nb-banner-bg));
    }
  }
}
</style>
