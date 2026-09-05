<template>
  <div class="nb-demo-frame" :style="{ height: `${height}px` }">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * A viewport for a demo that fills its parent.
 *
 * `NbShell` (and anything else sized to 100% of its container) cannot be shown
 * in a docs column without being given a height, so every guidance page that
 * runs a shell puts one in a fixed-height, clipped box. That idiom was being
 * copy-pasted per page with the class prefix swapped; this is the one copy.
 *
 * Nothing about the component inside is changed. It is given a viewport.
 */
withDefaults(defineProps<{ height?: number }>(), { height: 300 })
</script>

<style scoped>
.nb-demo-frame {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}
</style>
