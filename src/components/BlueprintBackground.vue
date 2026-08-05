<template>
  <!-- Camera-transformed backdrop. Reads the camera from useBlueprint() so it
       pans/zooms with the scene, exactly like the built-in renderer grid.
       Default transform-origin (centre) is intentional: the tiled pattern reads
       the same regardless of pan. `variant="none"` renders nothing. -->
  <div
    v-if="variant !== 'none'"
    class="nb-blueprint-background"
    :class="`nb-blueprint-background--${variant}`"
    :style="style"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBlueprint } from '../composables/useBlueprint.composable'
import type { IBlueprintBackgroundProps } from './BlueprintBackground.d'

const props = withDefaults(defineProps<IBlueprintBackgroundProps>(), {
  variant: 'dots',
  color: undefined,
  gap: 24,
  thickness: 1,
  secondaryColor: undefined,
  secondaryGap: undefined,
})

const bp = useBlueprint()

const transform = computed(
  () =>
    `translate(${bp.panX.value}px, ${bp.panY.value}px) scale(${bp.zoom.value})`,
)

// Camera transform plus the prop-driven CSS custom properties the SCSS below
// reads. Colour vars are only set when supplied, so an unset prop falls through
// to the themeable `--nb-blueprint-grid-*` defaults.
const style = computed(() => {
  const s: Record<string, string | undefined> = {
    transform: transform.value,
    willChange: bp.isTransforming.value ? 'transform' : undefined,
    '--_grid-gap': `${props.gap}px`,
    '--_thickness': `${props.thickness}px`,
  }
  if (props.color) s['--_grid-color'] = props.color
  if (props.secondaryColor) s['--_grid-major-color'] = props.secondaryColor
  if (props.secondaryGap != null)
    s['--_grid-major-gap'] = `${props.secondaryGap}px`
  return s
})
</script>

<style scoped lang="scss">
.nb-blueprint-background {
  --_grid-color: var(--nb-blueprint-grid-color, var(--nb-c-border));
  --_grid-major-color: var(--_grid-color);
  --_grid-gap: 24px;
  --_grid-major-gap: calc(var(--_grid-gap) * 5);
  --_thickness: 1px;

  position: absolute;
  inset: -2000px;
  background-size: var(--_grid-gap) var(--_grid-gap);
  pointer-events: none;
  opacity: 0.4;
  mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );

  &--dots {
    background-image: radial-gradient(
      circle,
      var(--_grid-color) var(--_thickness),
      transparent var(--_thickness)
    );
  }

  &--lines {
    background-image:
      linear-gradient(
        to right,
        var(--_grid-color) var(--_thickness),
        transparent var(--_thickness)
      ),
      linear-gradient(
        to bottom,
        var(--_grid-color) var(--_thickness),
        transparent var(--_thickness)
      );
  }

  // Minor cell lines at the base gap plus heavier major lines at the larger
  // stride (default gap x 5). The major lines are twice the minor thickness.
  &--grid {
    background-image:
      linear-gradient(
        to right,
        var(--_grid-color) var(--_thickness),
        transparent var(--_thickness)
      ),
      linear-gradient(
        to bottom,
        var(--_grid-color) var(--_thickness),
        transparent var(--_thickness)
      ),
      linear-gradient(
        to right,
        var(--_grid-major-color) calc(var(--_thickness) * 2),
        transparent calc(var(--_thickness) * 2)
      ),
      linear-gradient(
        to bottom,
        var(--_grid-major-color) calc(var(--_thickness) * 2),
        transparent calc(var(--_thickness) * 2)
      );
    background-size:
      var(--_grid-gap) var(--_grid-gap),
      var(--_grid-gap) var(--_grid-gap),
      var(--_grid-major-gap) var(--_grid-major-gap),
      var(--_grid-major-gap) var(--_grid-major-gap);
  }
}
</style>
