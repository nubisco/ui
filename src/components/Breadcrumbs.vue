<template>
  <nav class="nb-breadcrumbs" aria-label="breadcrumb">
    <!-- Brand prefix (title + subtitle) -->
    <span v-if="title || subtitle" class="nb-breadcrumbs__brand">
      <span v-if="title" class="nb-breadcrumbs__title">{{ title }}</span>
      <span v-if="subtitle" class="nb-breadcrumbs__subtitle">{{
        subtitle
      }}</span>
    </span>

    <!-- Separator between brand and crumbs (only when both exist) -->
    <NbIcon
      v-if="(title || subtitle) && hasDefaultSlot"
      name="caret-right"
      size="sm"
      class="nb-breadcrumbs__sep"
    />

    <!-- Crumb items injected via default slot -->
    <span v-if="hasDefaultSlot" class="nb-breadcrumbs__crumbs">
      <slot />
    </span>
  </nav>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue'

defineProps<{
  /** Text rendered before the subtitle in regular weight. */
  title?: string
  /** Text rendered after the title in bold weight. */
  subtitle?: string
}>()

const slots = useSlots()
const hasDefaultSlot = computed(() => !!slots.default?.())
</script>

<style lang="scss" scoped>
.nb-breadcrumbs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  line-height: 1;
}

.nb-breadcrumbs__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3em;
}

.nb-breadcrumbs__title {
  font-weight: 400;
  color: var(--nb-c-text);
}

.nb-breadcrumbs__subtitle {
  font-weight: 700;
  color: var(--nb-c-text);
}

.nb-breadcrumbs__sep {
  color: var(--nb-c-text-subtle);
  flex-shrink: 0;
}

.nb-breadcrumbs__crumbs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  color: var(--nb-c-text);
}
</style>
