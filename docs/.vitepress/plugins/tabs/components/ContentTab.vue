<template>
  <div
    v-if="selected === label"
    :id="`panel-${label}-${uid}`"
    :class="{
      'content-tabs__content': true,
      preview: label.toLowerCase() === 'preview',
    }"
    role="tabpanel"
    tabindex="-1"
    :aria-labelledby="`tab-${label}-${uid}`"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useTabsSingleState } from './useTabsSingleState'

defineProps<{ label: string }>()

const { uid, selected } = useTabsSingleState()
</script>

<style lang="scss" scoped>
.content-tabs__content {
  &:not(.preview) {
    padding: var(--nb-base-unit);
  }
  > :first-child:first-child {
    margin-top: 0;
  }
  > :last-child:last-child {
    margin-bottom: 0;
  }
  > :deep(div[class*='language-']) {
    border-radius: 8px;
    margin: 16px 0px;
  }
}
</style>
