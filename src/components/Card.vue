<template>
  <component
    :is="tag"
    class="nb-card"
    :class="{
      'nb-card--horizontal': orientation === 'horizontal',
      'nb-card--interactive': isInteractive,
      'nb-card--selected': selected,
      'nb-card--disabled': disabled,
    }"
    v-bind="{ ...attrs, ...layerProps }"
    @click="onClick"
    @keydown="onKeydown"
  >
    <!-- The media: a cover image above the title, or a thumbnail beside it in
         the horizontal layout. A box of a fixed ratio, so a grid of cards
         lines up before any image has loaded, and a placeholder in the same
         box when there is no image or it fails to load, so a missing picture
         does not shorten one card in the row. -->
    <div
      v-if="hasMedia"
      class="nb-card__media"
      :class="[
        mediaLayerClass,
        { 'nb-card__media--empty': showPlaceholder && !$slots.media },
      ]"
      :style="mediaStyle"
    >
      <slot name="media">
        <img
          v-if="!showPlaceholder"
          class="nb-card__image"
          :src="image!"
          :alt="imageAlt"
          loading="lazy"
          decoding="async"
          @error="failed = true"
        />
        <NbIcon
          v-else
          class="nb-card__placeholder"
          :name="iconImage"
          :size="24"
          aria-hidden="true"
        />
      </slot>
    </div>

    <div v-if="icon || $slots.icon" class="nb-card__icon">
      <slot name="icon">
        <NbIcon :name="icon!" :size="20" aria-hidden="true" />
      </slot>
    </div>

    <div class="nb-card__head">
      <span class="nb-card__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="subtitle || $slots.subtitle" class="nb-card__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </div>

    <div v-if="$slots.default" class="nb-card__body">
      <slot />
    </div>

    <!-- Pushed to the bottom by the body's `flex: 1`, so a row of cards with
         different amounts of description still lines its footers up. That is
         the thing hand-rolled card grids most often get wrong. -->
    <div v-if="$slots.footer" class="nb-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import * as iconImage from '@nubisco/ui/icons/image'
import type { ICardProps } from './CardGrid.d'
import NbIcon from './Icon.vue'
import {
  clampLayer,
  layerClassFor,
  useSurfaceLayer,
} from '@/composables/useSurfaceLayer.composable'
import { useSurfaceLink } from './Card.link'

const props = withDefaults(defineProps<ICardProps>(), {
  title: '',
  subtitle: '',
  icon: undefined,
  orientation: 'vertical',
  image: undefined,
  imageAlt: '',
  imageRatio: undefined,
  imageFit: 'cover',
  href: undefined,
  to: undefined,
  target: undefined,
  clickable: false,
  selected: false,
  disabled: false,
})

const emit = defineEmits<{
  /** Activated by a click, Enter or Space. The event carries the modifier keys. */
  select: [event: MouseEvent | KeyboardEvent]
}>()
const slots = useSlots()

// `image` present at all, even empty, asks for the media box: a list of pages
// where some have no thumbnail yet still wants every card the same shape.
const hasMedia = computed(() => props.image !== undefined || !!slots.media)

// A broken URL draws the placeholder rather than the browser's broken-image
// glyph. Reset when the source changes, so a corrected URL gets its chance.
const failed = ref(false)
watch(
  () => props.image,
  () => {
    failed.value = false
  },
)
const showPlaceholder = computed(() => !props.image || failed.value)

// Custom properties rather than inline `aspect-ratio`, so a stylesheet can set
// the same two for a whole grid of cards without a prop on each.
const mediaStyle = computed(() => ({
  '--nb-card-image-ratio': props.imageRatio,
  '--nb-card-image-fit': props.imageFit,
}))

// A card paints a surface, so it takes part in the layer system exactly as
// NbPanel does: it paints the next layer down from wherever it sits and pushes
// its contents one deeper. It used to paint whatever `--nb-c-surface` it
// inherited, which is the surface of its CONTAINER, so a card straight on a
// page was the page's own colour (or, under the old shell ground, darker than
// it) instead of a card on it.
const { level, layerProps } = useSurfaceLayer()

// The media box sits one layer below the card, so an empty box (and the
// letterbox of a `contain` image) reads as a well in the card in both modes.
const mediaLayerClass = computed(() =>
  layerClassFor(clampLayer(level.value + 1)),
)

// Link, button or div, picked from what the card does. See Card.link.ts.
const { tag, attrs, isInteractive, onClick, onKeydown } = useSurfaceLink(
  props,
  (event) => emit('select', event),
)
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as breakpoints;

.nb-card {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-4);
  padding: var(--nb-spacing-16);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  // A card is a panel-role surface, and it publishes its corner so that
  // anything inset inside it (a media strip, a nested panel) can be
  // concentric with it rather than guessing.
  @include radius.surface(panel);
  color: inherit;
  text-decoration: none;
  // Cards in a grid are stretched to the row's height by default; this is what
  // lets the footer sit on the bottom edge rather than under the description.
  height: 100%;
}

.nb-card--interactive {
  cursor: pointer;
  transition:
    background 70ms linear,
    border-color 70ms linear;

  &:hover {
    background: var(--nb-c-surface-hover);
    border-color: var(--nb-c-layer-border-2);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-card--selected {
  border-color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

.nb-card--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

// ── Media ───────────────────────────────────────────────────────────────
//
// Vertical: a cover across the top of the card, full bleed. It cancels the
// card's padding and takes the card's own corner minus its border on the top
// two corners, so the picture and the card read as one object.
//
// Horizontal: a thumbnail in its own column, inset by the padding, with a
// corner concentric with the card's.

.nb-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: var(--nb-card-image-ratio, 16 / 9);
  margin: calc(-1 * var(--nb-spacing-16)) calc(-1 * var(--nb-spacing-16))
    var(--nb-spacing-8);
  border-radius: max(0px, calc(var(--nb-radius-context, 0px) - 1px))
    max(0px, calc(var(--nb-radius-context, 0px) - 1px)) 0 0;
  // The box carries the next layer's class, so this is one step below the
  // card wherever the card sits.
  background: var(--nb-c-surface);
  color: var(--nb-c-text-subtle);
}

.nb-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--nb-card-image-fit, cover);
}

// A slotted image or video fills the box the same way the built-in one does.
.nb-card__media > :slotted(img),
.nb-card__media > :slotted(video),
.nb-card__media > :slotted(picture) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--nb-card-image-fit, cover);
}

.nb-card__icon {
  display: flex;
  align-items: center;
  color: var(--nb-c-text-subtle);
  margin-bottom: var(--nb-spacing-4);
}

.nb-card__head {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-2);
  min-width: 0;
}

.nb-card__title {
  font-size: var(--nb-font-size-14);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.3;
  color: var(--nb-c-text);
  overflow-wrap: anywhere;
}

.nb-card__subtitle {
  font-size: var(--nb-font-size-12);
  line-height: 1.4;
  color: var(--nb-c-text-subtle);
}

.nb-card__body {
  flex: 1 1 auto;
  margin-top: var(--nb-spacing-8);
  font-size: var(--nb-font-size-12);
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

.nb-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4);
  margin-top: var(--nb-spacing-12);
}

// ── Horizontal ──────────────────────────────────────────────────────────
//
// The media, icon or logo in a column of its own on the left, and the title,
// text and footer stacked on the right. For a launcher of apps or a list of
// pages: the tile is read by its name, and the picture beside it says which one
// at a glance. A grid rather than a wrapper element, so the markup of the
// vertical card does not change.

.nb-card--horizontal {
  --nb-card-media-width: 96px;

  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  column-gap: var(--nb-spacing-12);
  row-gap: 0;
  align-items: start;

  > .nb-card__media,
  > .nb-card__icon {
    grid-column: 1;
    grid-row: 1 / -1;
    align-self: start;
    margin: 0;
  }

  > .nb-card__head {
    grid-column: 2;
    grid-row: 1;
  }

  > .nb-card__body {
    grid-column: 2;
    grid-row: 2;
    // Beside a logo the description is one line under the name, not a
    // separate paragraph.
    margin-top: var(--nb-spacing-4);
  }

  > .nb-card__footer {
    grid-column: 2;
    grid-row: 3;
  }

  > .nb-card__media {
    width: var(--nb-card-media-width);
    border: 1px solid var(--nb-c-border);
    @include radius.inset(calc(var(--nb-spacing-16) + 1px));
  }

  // Only one thing sits in the left column. With both, the media wins and the
  // icon is not drawn twice over it.
  > .nb-card__media ~ .nb-card__icon {
    display: none;
  }
}

// On a phone a horizontal card stays horizontal: that is what makes a list of
// tiles scannable in one column. Only the thumbnail narrows, so the name keeps
// the room it needs.
@include breakpoints.phone {
  .nb-card--horizontal {
    --nb-card-media-width: 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-card--interactive {
    transition: none;
  }
}
</style>
