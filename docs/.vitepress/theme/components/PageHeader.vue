<template>
  <div class="page-header">
    <h1 class="page-header__title">{{ title }}</h1>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title?: string
}>()
</script>

<style lang="scss" scoped>
.page-header {
  background: var(--nb-c-black);
  color: var(--nb-c-white);
  min-height: calc(var(--nb-base-unit) * 24);
  display: flex;
  align-items: flex-end;
  padding: calc(var(--nb-base-unit) * 4);

  &__title {
    font-size: clamp(2rem, 5vw, calc(var(--nb-base-unit) * 9));
    font-weight: 300;
    line-height: 1;
    margin: 0;
    letter-spacing: -0.01em;
  }
}
</style>
