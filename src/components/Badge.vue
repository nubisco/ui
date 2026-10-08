<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    :class="[
      'nb-badge',
      `nb-badge--${variant}`,
      `nb-badge--${size}`,
      {
        'nb-badge--placeholder': placeholder,
        'nb-badge--interactive': interactive,
      },
    ]"
  >
    <span v-if="dot" class="nb-badge__dot" />
    <NbIcon
      v-if="icon"
      :name="icon"
      :size="size === 'sm' ? 11 : 12"
      class="nb-badge__icon"
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { EBadgeVariant, EBadgeSize, IBadgeProps } from './Badge.d'
import NbIcon from './Icon.vue'

withDefaults(defineProps<IBadgeProps>(), {
  variant: EBadgeVariant.Grey,
  size: EBadgeSize.Medium,
  dot: false,
  icon: undefined,
  placeholder: false,
  interactive: false,
})
</script>

<style scoped lang="scss">
.nb-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  border-radius: 999px;
  white-space: nowrap;
  line-height: 1;

  &--sm {
    padding: 2px 7px;
    font-size: 10px;
  }
  &--md {
    padding: 3px 9px;
    font-size: 11px;
  }

  /* Variants */
  &--grey {
    background: color-mix(
      in srgb,
      var(--nb-c-text-subtle) 15%,
      var(--nb-c-surface)
    );
    color: var(--nb-c-text-muted);
  }
  &--blue {
    background: color-mix(in srgb, var(--nb-c-info) 12%, var(--nb-c-surface));
    color: var(--nb-c-info);
  }
  &--orange {
    background: color-mix(
      in srgb,
      var(--nb-c-warning) 12%,
      var(--nb-c-surface)
    );
    color: var(--nb-c-warning);
  }
  &--green {
    background: color-mix(
      in srgb,
      var(--nb-c-success) 12%,
      var(--nb-c-surface)
    );
    color: var(--nb-c-success);
  }
  &--red {
    background: color-mix(in srgb, var(--nb-c-danger) 12%, var(--nb-c-surface));
    color: var(--nb-c-danger);
  }
  &--purple {
    background: color-mix(
      in srgb,
      var(--nb-c-primary) 12%,
      var(--nb-c-surface)
    );
    color: var(--nb-c-primary);
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
