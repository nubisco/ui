<template>
  <div class="nb-card-grid" :data-gap="gap" :style="style">
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
</style>
