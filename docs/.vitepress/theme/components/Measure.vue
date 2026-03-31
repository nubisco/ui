<template>
  <component :is="as" class="vp-measure" v-rulers="rulersValue">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_OPTIONS } from '../directives/rulers'
import type { RulersOptions } from '../directives/rulers'

type MeasureBinding = boolean | RulersOptions

interface MeasureProps extends RulersOptions {
  as?: string
  rulers?: boolean
}

const props = withDefaults(defineProps<MeasureProps>(), {
  as: 'div',
  rulers: true,
  ...DEFAULT_OPTIONS,
})

const rulersValue = computed<MeasureBinding>(() => props)
</script>

<style scoped lang="scss">
.vp-measure {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
  flex: 0 0 auto;
  align-self: flex-start;
  justify-self: start;
  vertical-align: top;
  max-width: 100%;
}
</style>
