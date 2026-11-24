<template>
  <div
    class="nb-canvas-controls"
    :class="[`nb-canvas-controls--${position}`, `is-${orientation}`]"
    role="toolbar"
    :aria-label="label"
    :aria-orientation="orientation"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { NB_TOOLBAR } from './Toolbar.context'
import { NB_CANVAS_CONTROLS } from './CanvasControls.context'
import type { ICanvasControlsProps } from './CanvasControls.d'

const props = withDefaults(defineProps<ICanvasControlsProps>(), {
  position: 'bottom-right',
  orientation: 'vertical',
  size: 'sm',
})

/*
 * Every button inside takes the set's height unless it was given one, the
 * same way a toolbar sizes its buttons. Not flush: the buttons keep their
 * corners inside the rounded group.
 */
provide(NB_TOOLBAR, {
  size: computed(() => props.size),
  flush: computed(() => false),
})

provide(NB_CANVAS_CONTROLS, {
  orientation: computed(() => props.orientation),
})
</script>

<style scoped lang="scss">
/*
 * Floats over the canvas it is placed in: the canvas is the positioned
 * ancestor, and the controls sit one inset from its edge, above its content.
 */
.nb-canvas-controls {
  position: absolute;
  z-index: 1;
  display: flex;
  gap: var(--nb-base-unit);

  &.is-vertical {
    flex-direction: column;
  }
  &.is-horizontal {
    flex-direction: row;
  }

  &--top-left,
  &--top-center,
  &--top-right {
    top: var(--nb-canvas-controls-inset);
  }
  &--bottom-left,
  &--bottom-center,
  &--bottom-right {
    bottom: var(--nb-canvas-controls-inset);
  }
  &--top-left,
  &--bottom-left {
    inset-inline-start: var(--nb-canvas-controls-inset);
  }
  &--top-right,
  &--bottom-right {
    inset-inline-end: var(--nb-canvas-controls-inset);
  }
  &--top-center,
  &--bottom-center {
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
