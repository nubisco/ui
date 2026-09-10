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
/*
 * The page banner.
 *
 * It was 192px of pure black under a 72px title, which is a magazine cover on
 * top of a reference page: it pushed the first sentence below the fold on a
 * laptop and was the heaviest thing in the documentation by a wide margin.
 *
 * It now takes the same chrome colour as the header above it, so the two read
 * as one band rather than two competing ones, and the title steps down to a
 * size that still leads the page without dominating it.
 */
.page-header {
  background: var(--nb-shell-sidebar-bg);
  color: var(--nb-c-white);
  min-height: calc(var(--nb-base-unit) * 13);
  display: flex;
  align-items: flex-end;
  padding: calc(var(--nb-base-unit) * 2.5) calc(var(--nb-base-unit) * 4);

  &__title {
    font-size: clamp(1.5rem, 3vw, calc(var(--nb-base-unit) * 4.5));
    font-weight: 400;
    line-height: 1.15;
    margin: 0;
    letter-spacing: -0.01em;
  }
}
</style>
