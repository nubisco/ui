<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    :class="[
      'nb-badge',
      `nb-badge--${intent}`,
      `nb-badge--${size}`,
      {
        'nb-badge--placeholder': placeholder,
        'nb-badge--interactive': interactive,
      },
    ]"
  >
    <span v-if="dot" class="nb-badge__dot" />
    <NbIcon v-if="icon" :name="icon" size="1.2em" class="nb-badge__icon" />
    <slot />
  </component>
</template>

<script lang="ts">
// Module scope, so a deprecated variant warns once per application rather
// than once per badge on a page that renders a hundred of them.
const warnedVariants = new Set<string>()
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { EBadgeVariant, EBadgeSize, IBadgeProps } from './Badge.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IBadgeProps>(), {
  variant: EBadgeVariant.Neutral,
  size: EBadgeSize.Medium,
  dot: false,
  icon: undefined,
  placeholder: false,
  interactive: false,
})

// The colour-named variants, kept as aliases of the intent each one was used
// for. They render as that intent, so an application that has not moved yet
// already gets the measured pair instead of the old washes (orange measured
// 1.88:1 at this size).
const deprecatedAliases: Record<string, `${EBadgeVariant}`> = {
  grey: 'neutral',
  blue: 'info',
  green: 'success',
  orange: 'warning',
  red: 'danger',
  purple: 'primary',
}

const intent = computed(() => deprecatedAliases[props.variant] ?? props.variant)

watch(
  () => props.variant,
  (variant) => {
    const to = deprecatedAliases[variant]
    if (!to || warnedVariants.has(variant)) return
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'production'
    ) {
      return
    }
    warnedVariants.add(variant)
    console.warn(
      `[NbBadge] variant="${variant}" is deprecated and renders as ` +
        `variant="${to}". Badge variants name what the badge means, not ` +
        'its colour.',
    )
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.nb-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: var(--nb-font-weight-semibold, 600);
  // Counts sit in badges: digits of one width, so 9 to 10 does not jump.
  font-variant-numeric: tabular-nums;
  border-radius: 999px;
  white-space: nowrap;
  line-height: 1;

  &--sm {
    padding: 2px 7px;
    font-size: var(--nb-type-body-sm-size);
  }
  &--md {
    padding: 3px 9px;
    font-size: var(--nb-type-body-sm-size);
  }

  /*
   * Intents. Each one is the status surface pair the theme already measures
   * (tests/badgeContrast.test.ts): the quiet ground and the ink that stays
   * legible on it, 8.04:1 or better in light. In dark the ground is a 16%
   * wash over whatever plane the badge sits on, so the pair is measured
   * composited over all four layers.
   */
  @each $intent in (neutral, info, success, warning, danger) {
    &--#{$intent} {
      background: var(--nb-c-#{$intent}-surface);
      color: var(--nb-c-on-#{$intent}-surface);
    }
  }
  &--primary {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
  }

  /* A value not set yet. Its 1px border would make it 2px taller than a
     filled badge, so the padding gives that pixel back on each side and the
     two stand exactly as tall side by side. */
  &--placeholder {
    background: transparent;
    border: 1px dashed
      color-mix(in srgb, var(--nb-c-text-subtle) 55%, transparent);
    color: var(--nb-c-text-subtle);
    font-style: italic;
  }
  &--placeholder#{&}--sm {
    padding: 1px 6px;
  }
  &--placeholder#{&}--md {
    padding: 2px 8px;
  }

  /* A button that looks like a badge. The reset keeps the badge's own type
     and box, and the states say it can be pressed. */
  &--interactive {
    font-family: inherit;
    border-width: 0;
    margin: 0;
    cursor: pointer;

    &:hover {
      filter: brightness(0.96);
    }

    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: 1px;
    }
  }
  &--interactive#{&}--placeholder {
    border-width: 1px;

    &:hover {
      filter: none;
      color: var(--nb-c-text-muted);
      border-color: var(--nb-c-text-subtle);
      background: var(--nb-c-surface-hover);
    }
  }

  &__icon {
    flex-shrink: 0;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
}
</style>
