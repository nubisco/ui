<template>
  <span :class="['nb-badge', `nb-badge--${variant}`, `nb-badge--${size}`]">
    <span v-if="dot" class="nb-badge__dot" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { EBadgeVariant, EBadgeSize, IBadgeProps } from './Badge.d'

withDefaults(defineProps<IBadgeProps>(), {
  variant: EBadgeVariant.Grey,
  size: EBadgeSize.Medium,
  dot: false,
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

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
}
</style>
