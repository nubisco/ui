<template>
  <component
    :is="split ? 'div' : tag"
    class="nb-stat"
    :class="[
      `nb-stat--${status}`,
      `nb-stat--${size}`,
      {
        'nb-stat--interactive': isInteractive,
        'nb-stat--selected': selected,
        'nb-stat--disabled': disabled,
        'nb-stat--split': split,
      },
    ]"
    v-bind="rootProps"
    :aria-busy="loading ? true : undefined"
  >
    <!-- With a hint on an interactive tile the link or button is a sibling of
         the hint, stretched over the tile. An info button inside an <a> or a
         <button> is invalid HTML, and its click would also navigate. -->
    <component
      :is="tag"
      v-if="split"
      class="nb-stat__link"
      v-bind="attrs"
      :aria-labelledby="`${statId}-label ${statId}-value`"
      @click="onClick"
      @keydown="onKeydown"
    />

    <span v-if="hasHead" class="nb-stat__head">
      <NbIcon
        v-if="icon"
        :name="icon"
        :size="16"
        class="nb-stat__icon"
        aria-hidden="true"
      />
      <span :id="split ? `${statId}-label` : undefined" class="nb-stat__label">
        <slot name="label">{{ label }}</slot>
      </span>
      <NbInfoHint
        v-if="hint"
        class="nb-stat__hint"
        :text="hint"
        :title="hintTitle"
        :label="`${strings.infoHintLabel}: ${label}`"
        :size="16"
      />
      <NbIcon
        v-if="showArrow"
        :name="iconArrowRight"
        :size="16"
        class="nb-stat__arrow"
        aria-hidden="true"
      />
    </span>
    <span
      v-else
      :id="split ? `${statId}-label` : undefined"
      class="nb-stat__label"
    >
      <slot name="label">{{ label }}</slot>
    </span>

    <span :id="split ? `${statId}-value` : undefined" class="nb-stat__value">
      <NbSkeleton
        v-if="loading"
        variant="block"
        :height="skeletonHeight"
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
          size="sm"
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
import * as iconArrowRight from '@nubisco/ui/icons/arrow-right'
import NbIcon from './Icon.vue'
import NbSkeleton from './Skeleton.vue'
import NbInfoHint from './InfoHint.vue'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import type { IStatProps } from './Stat.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { useSurfaceLink } from './Card.link'
import { useStableId } from '@/composables/useStableId.composable'

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
  hint: undefined,
  hintTitle: undefined,
  icon: undefined,
  arrow: false,
})
// The hint is named after its tile, so four hints in a row are four different buttons to a screen reader.
const strings = useNbStrings()

const emit = defineEmits<{
  /** Activated by a click, Enter or Space. The event carries the modifier keys. */
  select: [event: MouseEvent | KeyboardEvent]
}>()

// A tile is a surface, so it takes part in the layer system as NbCard does.
const { layerProps } = useSurfaceLayer()

const { tag, attrs, isLink, isInteractive, onClick, onKeydown } =
  useSurfaceLink(props, (event) => emit('select', event))

const statId = useStableId({})

// An interactive tile that carries a hint splits in two: a plain <div> tile,
// with the link or button as a stretched sibling of the hint. Every other tile
// keeps being the link or button itself, exactly as before.
const split = computed(() => isInteractive.value && !!props.hint)
const showArrow = computed(() => props.arrow && isLink.value)
const hasHead = computed(() => !!props.icon || !!props.hint || showArrow.value)
const rootProps = computed(() =>
  split.value
    ? { ...layerProps.value }
    : {
        ...attrs.value,
        ...layerProps.value,
        onClick,
        onKeydown,
      },
)

// The placeholder stands where the figure will be, at the figure's own height,
// so the tile does not jump when the value arrives.
const skeletonHeight = computed(() => {
  if (props.size === 'lg') return 36
  if (props.size === 'sm') return 20
  return 28
})

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
@use '../styles/logic/motion' as motion;
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

// The row that holds the optional icon, the label, the hint and the arrow.
// Rendered only when one of them is asked for.
.nb-stat__head {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  min-width: 0;
  color: var(--nb-c-text-subtle);

  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }
}

.nb-stat__head > .nb-stat__label {
  min-width: 0;
  color: inherit;
}

.nb-stat__icon,
.nb-stat__arrow {
  flex: none;
}

// The arrow sits at the trailing edge and is quiet until the tile is hovered
// or focused.
.nb-stat__arrow {
  margin-inline-start: auto;
  opacity: 0.6;
  transition: opacity var(--nb-motion-micro) linear;
}

.nb-stat--interactive:hover .nb-stat__arrow,
.nb-stat--interactive:focus-visible .nb-stat__arrow,
.nb-stat--interactive:has(.nb-stat__link:focus-visible) .nb-stat__arrow {
  opacity: 1;
}

// The hint stays above the stretched link, so it takes its own clicks.
.nb-stat__hint {
  position: relative;
  z-index: 1;
  flex: none;
}

.nb-stat--split {
  position: relative;
}

.nb-stat__link {
  position: absolute;
  // Over the border too, so the focus ring wraps the whole tile.
  inset: -1px;
  z-index: 0;
  border-radius: inherit;
  cursor: pointer;
  text-decoration: none;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-stat__label {
  font-size: var(--nb-type-label-size);
  line-height: var(--nb-type-label-line-height);
  letter-spacing: var(--nb-type-label-letter-spacing);
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
  // heading-04's size at regular weight: the size carries the figure, so it
  // does not need the ink.
  font-size: var(--nb-type-heading-04-size);
  font-weight: var(--nb-font-weight-regular, 400);
  line-height: var(--nb-type-heading-04-line-height);
  letter-spacing: var(--nb-type-heading-04-letter-spacing);
  color: var(--nb-c-text);
  // Columns of figures line up, and a number that ticks does not jitter.
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;

  .nb-stat:not(.nb-stat--neutral) & {
    color: inherit;
  }

  .nb-stat--lg & {
    font-size: var(--nb-type-heading-05-size);
    line-height: var(--nb-type-heading-05-line-height);
  }

  .nb-stat--sm & {
    font-size: var(--nb-type-heading-02-size);
    line-height: var(--nb-type-heading-02-line-height);
  }
}

// The dense tile, for a KPI row that sits above a table or a chart and should
// not outweigh it. Tighter padding and a smaller figure: 59px tall without a
// delta, where `md` is 86px. Everything else (status grounds, link behaviour,
// the delta) is the same tile.
.nb-stat--sm {
  gap: var(--nb-spacing-2);
  padding: var(--nb-spacing-8) var(--nb-spacing-12);
}

.nb-stat__delta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4);
  font-size: var(--nb-type-body-sm-size);
  font-weight: var(--nb-type-body-sm-weight);
  line-height: var(--nb-type-body-sm-line-height);
  letter-spacing: var(--nb-type-body-sm-letter-spacing);
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
    background var(--nb-motion-micro) linear,
    border-color var(--nb-motion-micro) linear;

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
  // The selected edge, not the raw primary: in dark the primary alone falls
  // under 3:1 on the lighter layers (see accent.selected-edge).
  border-color: var(--nb-c-selected-edge);
  box-shadow: inset 0 0 0 1px var(--nb-c-selected-edge);
}

.nb-stat--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@include motion.reduced {
  .nb-stat--interactive,
  .nb-stat__arrow {
    transition: none;
  }
}
</style>
