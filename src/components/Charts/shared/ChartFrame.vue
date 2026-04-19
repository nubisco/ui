<template>
  <figure class="nb-chart" :style="{ height: cssHeight }">
    <figcaption v-if="title || subtitle" class="nb-chart__header">
      <h4 v-if="title" class="nb-chart__title">{{ title }}</h4>
      <p v-if="subtitle" class="nb-chart__subtitle">{{ subtitle }}</p>
    </figcaption>
    <div ref="viewport" class="nb-chart__viewport">
      <slot />
    </div>
    <slot v-if="showLegend" name="legend" />
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    height?: number | string
    showLegend?: boolean
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    height: 280,
    showLegend: true,
  },
)

const viewport = ref<HTMLElement | null>(null)

// Accept number, plain numeric string ("240"), or any valid CSS length
// ("240px", "100%", "20rem"). Plain numerics get a px suffix so docs can
// write `height="240"` without the v-bind colon.
const cssHeight = computed(() => {
  const h = props.height
  if (typeof h === 'number') return `${h}px`
  if (/^\d+(\.\d+)?$/.test(h)) return `${h}px`
  return h
})

defineExpose({ viewport })
</script>

<style lang="scss" scoped>
.nb-chart {
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
  position: relative;
  font-family: var(--nb-font-family-sans);
  color: var(--nb-c-text);

  &__header {
    margin-bottom: calc(var(--nb-base-unit) * 1);
  }

  &__title {
    margin: 0;
    font-size: var(--nb-font-size-16);
    font-weight: 600;
    line-height: 1.3;
    color: var(--nb-c-text);
  }

  &__subtitle {
    margin: 2px 0 0;
    font-size: var(--nb-font-size-12);
    color: var(--nb-c-text-muted);
    line-height: 1.4;
  }

  &__viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
  }
}
</style>
