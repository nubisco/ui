<template>
  <nav
    class="nb-breadcrumbs"
    :class="{ 'nb-breadcrumbs--collapsed': collapsed }"
    aria-label="breadcrumb"
  >
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
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'

const props = withDefaults(
  defineProps<{
    /** Text rendered before the subtitle in regular weight. */
    title?: string
    /** Text rendered after the title in bold weight. */
    subtitle?: string
    /**
     * How the trail fits a phone topbar. `'phone'` shows only the last crumb
     * there, on one line with an ellipsis, and drops the brand: the page you
     * are on is the one piece a 360px bar has room for. `'none'` (the default)
     * renders the full trail at every width.
     */
    collapse?: 'none' | 'phone'
  }>(),
  { title: undefined, subtitle: undefined, collapse: 'none' },
)

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

const { phone } = usePhoneLayout()

// Only with a crumb to show: a trail that is all brand keeps its brand.
const collapsed = computed(
  () => props.collapse === 'phone' && phone.value && hasDefaultSlot.value,
)
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

// Phone, opted in: the last crumb alone, shrinking into an ellipsis rather
// than pushing the topbar's actions off screen. The class is only ever set by
// the component on a phone, so nothing here reaches a desktop.
.nb-breadcrumbs--collapsed {
  display: flex;
  min-width: 0;
  max-width: 100%;

  .nb-breadcrumbs__brand,
  .nb-breadcrumbs__sep {
    display: none;
  }

  .nb-breadcrumbs__crumbs {
    display: flex;
    min-width: 0;
  }

  .nb-breadcrumbs__crumbs > :not(:last-child) {
    display: none;
  }

  .nb-breadcrumbs__crumbs > :last-child {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &::before {
      content: none;
    }
  }
}
</style>
