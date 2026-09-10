<template>
  <div class="nb-panel" v-bind="layerProps">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import type { IPanelProps } from './Panel.d'

const props = withDefaults(defineProps<IPanelProps>(), {
  layer: undefined,
})

// Panel paints a surface, so it takes the current layer and pushes everything
// inside it one level deeper. `layer` forces an absolute level when needed.
const { layerProps } = useSurfaceLayer({ level: () => props.layer })
</script>

<style lang="scss" scoped>
@use '../styles/logic/radius' as radius;

.nb-panel {
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  padding: calc(var(--nb-base-unit) * 2);
  @include radius.surface(panel);
}
</style>
