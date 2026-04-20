<template>
  <div class="nb-panel">
    <slot />
  </div>
</template>

<script setup lang="ts">
// No props — Panel is a plain surface container
</script>

<style lang="scss" scoped>
.nb-panel {
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  padding: calc(var(--nb-base-unit) * 2);
}
</style>
