<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, toRef } from 'vue'

const props = defineProps<{ variant: 'compact' | 'verbose' }>()

// Internal helper: re-provides the shell sidebar variant for a subtree.
// Used by NbSidebarMenuItem to force children inside the compact-mode flyout
// to render as verbose rows even though the surrounding sidebar is compact.
provide('nb-shell-sidebar-variant', toRef(props, 'variant'))
</script>
