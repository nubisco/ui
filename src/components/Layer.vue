<template>
  <component :is="as" :class="layerClass">
    <slot :level="level" />
  </component>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue'
import {
  NB_LAYER_INJECTION_KEY,
  clampLayer,
  layerClassFor,
  type TLayerLevel,
} from '@/composables/useSurfaceLayer.composable'
import type { ILayerProps } from './Layer.d'

const props = withDefaults(defineProps<ILayerProps>(), {
  as: 'div',
  level: undefined,
})

const context = inject(NB_LAYER_INJECTION_KEY, null)

/**
 * With an explicit `level`, this is exactly `.nb-layer-N`: surfaces inside
 * paint N. Without one, it pushes its subtree one level deeper, the way
 * Carbon's `<Layer>` does.
 */
const level = computed<TLayerLevel>(() => {
  if (props.level !== undefined) return clampLayer(props.level)
  return clampLayer((context ? context.value : 1) + 1)
})

const layerClass = computed(() => layerClassFor(level.value))

// A context node, not a painted surface: it does not stamp the surface marker,
// so a surface directly inside it paints exactly `level`, matching what the
// bare CSS class has always done.
provide(
  NB_LAYER_INJECTION_KEY,
  computed(() => level.value),
)
</script>
