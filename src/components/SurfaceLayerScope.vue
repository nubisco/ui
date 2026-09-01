<template>
  <slot />
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import {
  clampLayer,
  NB_LAYER_INJECTION_KEY,
  type TLayerLevel,
} from '@/composables/useSurfaceLayer.composable'

// Internal helper: publishes "the next surface below here paints `level`" for a
// slot subtree, without rendering an element and without painting a surface of
// its own.
//
// `useSurfaceLayer()` provides the same context, but it provides it for the
// whole component that calls it. A component that owns several regions at
// different depths (NbShell: chrome at 1, the page ground at 0) needs the
// context scoped to one subtree instead, and a real element in between would
// change the layout. Prefer `<NbLayer>` in application code: it is the public
// version of this, and it does render an element.
const props = defineProps<{ level: TLayerLevel }>()

provide(
  NB_LAYER_INJECTION_KEY,
  computed(() => clampLayer(props.level)),
)
</script>
