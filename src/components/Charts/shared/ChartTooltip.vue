<template>
  <Transition name="nb-chart-tooltip">
    <div
      v-if="visible"
      class="nb-chart__tooltip"
      :style="{
        transform: `translate(${x}px, ${y}px)`,
      }"
      role="tooltip"
    >
      <div v-if="title" class="nb-chart__tooltip-title">{{ title }}</div>
      <ul class="nb-chart__tooltip-rows">
        <li
          v-for="(row, i) in rows"
          :key="`${row.label}-${i}`"
          class="nb-chart__tooltip-row"
        >
          <span
            class="nb-chart__tooltip-swatch"
            :style="{ background: row.color }"
          />
          <span class="nb-chart__tooltip-label">{{ row.label }}</span>
          <span class="nb-chart__tooltip-value">{{ row.value }}</span>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface ITooltipRow {
  label: string
  value: string | number
  color: string
}

defineProps<{
  visible: boolean
  x: number
  y: number
  title?: string
  rows: ITooltipRow[]
}>()
</script>

<style lang="scss" scoped>
.nb-chart__tooltip {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-component-plain-border);
  border-radius: 4px;
  padding: calc(var(--nb-base-unit) * 0.75) calc(var(--nb-base-unit) * 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text);
  min-width: 80px;
  z-index: 2;
  will-change: transform;

  &-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--nb-c-text);
  }

  &-rows {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 6px;
  }

  &-swatch {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  &-label {
    color: var(--nb-c-text-muted);
  }

  &-value {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
}

.nb-chart-tooltip-enter-active,
.nb-chart-tooltip-leave-active {
  transition: opacity 120ms ease;
}
.nb-chart-tooltip-enter-from,
.nb-chart-tooltip-leave-to {
  opacity: 0;
}
</style>
