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
    background: #e8e8ee;
    color: #555566;
  }
  &--blue {
    background: #dbeafe;
    color: #1d4ed8;
  }
  &--orange {
    background: #fef3c7;
    color: #92400e;
  }
  &--green {
    background: #d1fae5;
    color: #065f46;
  }
  &--red {
    background: #fee2e2;
    color: #991b1b;
  }
  &--purple {
    background: var(--nb-c-grape-hyacinth-100, #eeedf9);
    color: var(--nb-c-grape-hyacinth-600, #444480);
  }
  &--primary {
    background: var(--nb-c-grape-hyacinth-500, #5856a9);
    color: #fff;
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
