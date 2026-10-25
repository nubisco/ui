<template>
  <component
    :is="tag"
    class="nb-stat"
    :class="[
      `nb-stat--${status}`,
      `nb-stat--${size}`,
      {
        'nb-stat--interactive': isInteractive,
        'nb-stat--selected': selected,
        'nb-stat--disabled': disabled,
      },
    ]"
    v-bind="{ ...attrs, ...layerProps }"
    :aria-busy="loading ? true : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <span class="nb-stat__label">
      <slot name="label">{{ label }}</slot>
    </span>

    <span class="nb-stat__value">
      <NbSkeleton
        v-if="loading"
        variant="block"
        :height="size === 'lg' ? 36 : 28"
        width="4.5ch"
        radius="sm"
      />
      <slot v-else name="value">{{ value }}</slot>
    </span>

    <span
      v-if="!loading && (delta || trend || comparison || $slots.delta)"
      class="nb-stat__delta"
      :class="trend ? `nb-stat__delta--${tone}` : null"
    >
      <slot name="delta">
        <NbIcon
          v-if="trendIcon"
          :name="trendIcon"
          :size="12"
          class="nb-stat__trend"
          aria-hidden="true"
        />
        <span v-if="delta">{{ delta }}</span>
        <span v-if="comparison" class="nb-stat__comparison">{{
          comparison
        }}</span>
      </slot>
    </span>
  </component>
</template>

<script setup lang="ts">
/**
 * One figure with its name: a count, a total, a rate. Optionally how it moved
 * (an arrow and a delta), a status colour, and a destination, which makes the
 * whole tile a link to the list the number counts.
 *
 * It is a sibling of NbCard rather than a card with a big title, because the
 * two are read in a different order. A card is read by its title. A tile is
 * read by its number, and the label only says what the number is, so the
 * number is the largest thing in it and the label sits small above.
 */
import { computed } from 'vue'
import * as iconArrowUpRight from '@nubisco/ui/icons/arrow-up-right'
import * as iconArrowDownRight from '@nubisco/ui/icons/arrow-down-right'
import * as iconMinus from '@nubisco/ui/icons/minus'
import NbIcon from './Icon.vue'
import NbSkeleton from './Skeleton.vue'
import type { IStatProps } from './Stat.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { useSurfaceLink } from './Card.link'

const props = withDefaults(defineProps<IStatProps>(), {
  value: undefined,
  status: 'neutral',
  delta: undefined,
  trend: undefined,
  invertTrend: false,
  comparison: undefined,
  size: 'md',
  loading: false,
  to: undefined,
  href: undefined,
  target: undefined,
  clickable: false,
  selected: false,
  disabled: false,
})

const emit = defineEmits<{ select: [] }>()

// A tile is a surface, so it takes part in the layer system as NbCard does.
const { layerProps } = useSurfaceLayer()

const { tag, attrs, isInteractive, onClick, onKeydown } = useSurfaceLink(
  props,
  () => emit('select'),
)

const trendIcon = computed(() => {
  if (props.trend === 'up') return iconArrowUpRight
  if (props.trend === 'down') return iconArrowDownRight
  if (props.trend === 'flat') return iconMinus
  return null
})

// Whether the movement is good news. The arrow always points the way the
// figure went, and only the colour follows `invertTrend`, so a falling error
// rate still points down and is still green.
const tone = computed<'positive' | 'negative' | 'neutral'>(() => {
  if (props.trend === 'up') return props.invertTrend ? 'negative' : 'positive'
  if (props.trend === 'down') return props.invertTrend ? 'positive' : 'negative'
  return 'neutral'
})
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-stat {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-4);
  box-sizing: border-box;
  min-width: 0;
  padding: var(--nb-spacing-16);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  @include radius.surface(panel);
  color: inherit;
  text-decoration: none;
  font-family: var(--nb-font-family-sans);

  // A status tile is filled with that status's quiet ground, and every word on
  // it is set in the matching ink, which is the pair the theme guarantees is
  // legible in light and dark.
  @each $status in info, success, warning, danger {
    &--#{$status} {
      background: var(--nb-c-#{$status}-surface);
      border-color: var(--nb-c-#{$status}-surface-border);
      color: var(--nb-c-on-#{$status}-surface);
    }
  }
}

.nb-stat__label {
  font-size: var(--nb-font-size-12);
  line-height: 1.4;
  color: var(--nb-c-text-subtle);
  overflow-wrap: anywhere;

  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }
}

.nb-stat__value {
  display: flex;
  align-items: center;
  min-height: 1em;
  font-size: var(--nb-font-size-28);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.1;
  color: var(--nb-c-text);
  // Columns of figures line up, and a number that ticks does not jitter.
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;

  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }

  .nb-stat--lg & {
    font-size: var(--nb-font-size-36);
  }
}

.nb-stat__delta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4);
  font-size: var(--nb-font-size-12);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.4;
  font-variant-numeric: tabular-nums;

  &--positive {
    color: var(--nb-c-success);
  }
  &--negative {
    color: var(--nb-c-danger);
  }
  &--neutral {
    color: var(--nb-c-text-subtle);
  }

  // On a tinted tile a green or red delta would fight the ground, so it takes
  // the tile's own ink and the arrow alone says which way.
  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }
}

.nb-stat__comparison {
  font-weight: var(--nb-font-weight-regular, 400);
  color: var(--nb-c-text-subtle);

  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }
}

.nb-stat--interactive {
  cursor: pointer;
  transition:
    background 70ms linear,
    border-color 70ms linear;

  &.nb-stat--neutral:hover {
    background: var(--nb-c-surface-hover);
    border-color: var(--nb-c-layer-border-2);
  }

  &:not(.nb-stat--neutral):hover {
    border-color: currentColor;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-stat--selected {
  border-color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

.nb-stat--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .nb-stat--interactive {
    transition: none;
  }
}
</style>
