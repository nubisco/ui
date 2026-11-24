<template>
  <div
    class="nb-canvas-controls-group"
    :class="`is-${orientation}`"
    :role="label ? 'group' : undefined"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { NB_CANVAS_CONTROLS } from './CanvasControls.context'
import type { ICanvasControlsGroupProps } from './CanvasControls.d'

defineProps<ICanvasControlsGroupProps>()

const controls = inject(NB_CANVAS_CONTROLS, null)
const orientation = computed(() => controls?.orientation.value ?? 'horizontal')
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

/*
 * One raised island on the canvas: the layer above the ground, a border,
 * the canvas-controls corner and lift. Anything goes inside (ghost icon
 * buttons, a select, a switch), packed tight.
 */
.nb-canvas-controls-group {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) / 4);
  padding: calc(var(--nb-base-unit) / 2);
  border: 1px solid var(--nb-c-border);
  @include radius.surface($radius: var(--nb-canvas-controls-radius));
  background: var(--nb-c-layer-1, var(--nb-c-bg));
  box-shadow: var(--nb-canvas-controls-shadow);

  &.is-vertical {
    flex-direction: column;
  }
}
</style>
