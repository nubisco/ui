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
import NbIcon from './Icon.vue'
import { useSlots, computed, Comment, Fragment, Text, type VNode } from 'vue'

defineProps<{
  /** Text rendered before the subtitle in regular weight. */
  title?: string
  /** Text rendered after the title in bold weight. */
  subtitle?: string
}>()

const slots = useSlots()

/**
 * Whether the slot renders ANYTHING, not merely whether it was passed.
 *
 * `!!slots.default?.()` is true for a slot that produces nothing: a `v-for`
 * over an empty list still returns a Fragment, and a `v-if` that fails still
 * returns a Comment placeholder. The separator between the brand and the crumbs
 * was drawn on that, so a view with no crumbs rendered "Nubisco CMS ›" with
 * nothing after the chevron.
 */
function rendersContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) return String(node.children ?? '').trim() !== ''
    if (node.type === Fragment)
      return rendersContent((node.children ?? []) as VNode[])
    return true
  })
}

const hasDefaultSlot = computed(() => rendersContent(slots.default?.() ?? []))
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

/* A trail of more than one crumb needs separators between them, not only
 * between the brand and the first. Without this "Home" and "Doodloop" render
 * as "Home Doodloop", which reads as one name rather than two levels.
 *
 * Drawn in CSS rather than as icon nodes because the crumbs arrive through a
 * slot: the component cannot interleave markup between children it does not
 * own without re-rendering them. Content, not a border, so it inherits the
 * text colour and scales with the font. */
.nb-breadcrumbs__crumbs > :not(:first-child)::before {
  content: '/';
  margin-inline-end: 0.35rem;
  color: var(--nb-c-text-subtle);
  font-weight: 400;
}
</style>
