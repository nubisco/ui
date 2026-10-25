<template>
  <component :is="as" :class="layerClass" :[NB_LAYER_CONTEXT_ATTRIBUTE]="''">
    <slot :level="level" />
  </component>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import {
  NB_LAYER_CONTEXT_ATTRIBUTE,
  NB_LAYER_INJECTION_KEY,
  useSurfaceLayer,
} from '@/composables/useSurfaceLayer.composable'
import type { ILayerProps } from './Layer.d'

const props = withDefaults(defineProps<ILayerProps>(), {
  as: 'div',
  level: undefined,
})

/**
 * With an explicit `level`, this is exactly `.nb-layer-N`: surfaces inside
 * paint N.
 *
 * Without one, it takes the level a surface placed here would paint, which is
 * one step above its surroundings: layer 1 directly in NbShell's main region
 * (the layer-0 ground), layer 2 inside a layer-1 panel. It is resolved exactly
 * as a surface resolves its own depth, so it also honours a hand-written
 * `.nb-layer-N` container above it.
 *
 * It used to add one on top of the context, but the context already names the
 * level of the NEXT surface, so the step was counted twice: in the main region
 * a bare NbLayer came out at layer 2, where the theming docs promise 1.
 *
 * `provideContext: false` because this is a context node, not a painted
 * surface: it publishes its own level, so a surface directly inside it paints
 * exactly that level, which is what the bare CSS class has always done.
 */
const { level, layerClass } = useSurfaceLayer({
  level: () => props.level,
  provideContext: false,
})

provide(
  NB_LAYER_INJECTION_KEY,
  computed(() => level.value),
)
</script>
