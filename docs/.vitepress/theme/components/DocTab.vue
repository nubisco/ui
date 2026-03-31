<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue'
import type { Ref } from 'vue'

const props = defineProps<{
  name: string
}>()

const activeTab = inject<Ref<string>>('nb-active-tab')

const isActive = computed(() => {
  if (!activeTab) return true
  return activeTab.value === props.name
})
</script>
