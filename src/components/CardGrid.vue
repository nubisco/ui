<template>
  <div
    class="nb-card-grid"
    :data-gap="gap"
    :data-ratio="ratio ? ratio.replace(':', '-') : undefined"
    :style="style"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ICardGridProps } from './CardGrid.d'

const props = withDefaults(defineProps<ICardGridProps>(), {
  min: '260px',
  gap: 'md',
  fill: 'auto-fill',
})

// The whole component, really. Written out once here so no product has to
// remember the `minmax()` incantation or guess at a minimum width.
//
// `min(min, 100%)` rather than the bare minimum: on a container narrower than
// one card, a fixed minimum overflows instead of shrinking, which is exactly
// what a phone and a narrow inspector are.
const style = computed(() => ({
  gridTemplateColumns: `repeat(${props.fill}, minmax(min(${props.min}, 100%), 1fr))`,
}))
</script>

<style scoped lang="scss">
@use 'sass:list';
@use 'sass:map';
@use '../styles/variables/grid' as grid;

.nb-card-grid {
  display: grid;
}

// Gaps come off NbGrid's own scale, so a card grid and a grid beside it are
// spaced identically rather than nearly identically.
@each $name, $value in grid.$gap-ratios {
  .nb-card-grid[data-gap='#{$name}'] {
    gap: #{$value};
  }
}

// Every tile holds the ratio. A grid item with an aspect ratio aligns to the
// start rather than stretching, so a taller neighbour does not distort it,
// and its content can still grow it. Below `min` the column is the container
// and the tile keeps its shape at that width.
@each $ratio in grid.$grid-ratios {
  $w: list.nth($ratio, 1);
  $h: list.nth($ratio, 2);
  .nb-card-grid[data-ratio='#{$w}-#{$h}'] > :slotted(*) {
    aspect-ratio: #{$w} / #{$h};
  }
}
</style>
