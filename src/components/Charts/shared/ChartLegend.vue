<template>
  <ul class="nb-chart__legend">
    <li v-for="item in items" :key="item.label" class="nb-chart__legend-item">
      <span
        class="nb-chart__legend-swatch"
        :style="{ background: item.color }"
      />
      <span class="nb-chart__legend-label">{{ item.label }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
interface ILegendItem {
  label: string
  color: string
}

defineProps<{ items: ILegendItem[] }>()
</script>

<style lang="scss" scoped>
.nb-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 1.5);
  margin: calc(var(--nb-base-unit) * 1) 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);

  &-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &-label {
    line-height: 1;
  }
}
</style>
