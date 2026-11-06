<template>
  <header class="nb-page-header" :class="{ 'nb-page-header--sticky': sticky }">
    <div v-if="$slots.eyebrow" class="nb-page-header__eyebrow">
      <slot name="eyebrow" />
    </div>
    <div class="nb-page-header__title-row">
      <div class="nb-page-header__heading">
        <h1 class="nb-page-header__title">
          <slot name="title">{{ title }}</slot>
        </h1>
        <span v-if="$slots.status" class="nb-page-header__status">
          <slot name="status" />
        </span>
      </div>
      <div
        v-if="actions?.length || $slots.actions"
        class="nb-page-header__actions"
      >
        <PrimaryActionScope owner="NbPageHeader">
          <NbActionGroup
            v-if="actions?.length"
            :items="actions"
            overflow="phone"
          />
          <slot name="actions" />
        </PrimaryActionScope>
      </div>
    </div>
    <div v-if="$slots.description" class="nb-page-header__description">
      <slot name="description" />
    </div>
    <div v-if="$slots.facts" class="nb-page-header__facts">
      <slot name="facts" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { Comment, Fragment, Text, onMounted, onUpdated, useSlots } from 'vue'
import type { VNode } from 'vue'
import NbActionGroup from './ActionGroup.vue'
import PrimaryActionScope from './PrimaryActionScope.vue'
import type { IPageHeaderProps } from './PageHeader.d'

withDefaults(defineProps<IPageHeaderProps>(), {
  title: undefined,
  actions: undefined,
  sticky: false,
})

const slots = useSlots()

/** How many things a slot renders side by side: comments and blank text do
 *  not count, fragments (a `v-for`, a `<template>`) are counted through. */
function countRendered(nodes: VNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.type === Comment) continue
    if (node.type === Text) {
      if (typeof node.children === 'string' && node.children.trim()) count++
      continue
    }
    if (node.type === Fragment) {
      if (Array.isArray(node.children)) {
        count += countRendered(node.children as VNode[])
      }
      continue
    }
    count++
  }
  return count
}

// One status per page, and it is a single badge: status indicators, rule 5.
// Four badges beside a title is the commonest way a record page shouts. Read
// the slot rather than the DOM, so the check costs nothing in production.
let warned = false
function checkStatus() {
  if (warned) return
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  const nodes = slots.status?.()
  if (!nodes || countRendered(nodes) <= 1) return
  warned = true
  console.warn(
    '[NbPageHeader] The status slot holds more than one element. A page ' +
      'header carries exactly one status badge: fold the rest into it, or move ' +
      'them into the facts. See https://docs.nubisco.io/ui/patterns/status-indicators',
  )
}
onMounted(checkStatus)
onUpdated(checkStatus)
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as breakpoints;

// The top of a page: where it sits, what it is called, what state it is in,
// the few facts that define it, and what can be done to it. The title is the
// largest type on the page and the action group holds the page's one primary.
.nb-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-8);
  min-inline-size: 0;
}

// For record views: the header stays in reach while the record scrolls under
// it. Sticky in the nearest scroll container, which inside NbShell is the main
// region, the frame's only one. The surface is the plane the header sits on,
// so nothing changes until something scrolls beneath it.
.nb-page-header--sticky {
  position: sticky;
  inset-block-start: 0;
  z-index: 2;
  padding-block: var(--nb-spacing-16) var(--nb-spacing-12);
  background: var(--nb-c-surface);
  border-block-end: 1px solid var(--nb-c-border);
}

.nb-page-header__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4) var(--nb-spacing-8);
  min-inline-size: 0;
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  color: var(--nb-c-text-muted);
}

.nb-page-header__title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--nb-spacing-16);
}

.nb-page-header__heading {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4) var(--nb-spacing-12);
  min-inline-size: 0;
}

// Under the header, not bare: a prose stylesheet around the page styles every
// h1 it contains. Regular weight at 24px: size alone carries the rank.
.nb-page-header__heading .nb-page-header__title {
  margin: 0;
  min-inline-size: 0;
  font-family: var(--nb-type-heading-03-family);
  font-size: var(--nb-type-heading-03-size);
  font-weight: var(--nb-font-weight-regular);
  line-height: var(--nb-type-heading-03-line-height);
  letter-spacing: var(--nb-type-heading-03-letter-spacing);
  color: var(--nb-c-text);
  overflow-wrap: anywhere;
}

.nb-page-header__status {
  display: inline-flex;
  align-items: center;
}

.nb-page-header__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--nb-spacing-8);
}

.nb-page-header__description {
  max-inline-size: 68ch;
  font-size: var(--nb-type-body-md-size);
  line-height: var(--nb-type-body-md-line-height);
  color: var(--nb-c-text-muted);

  > :deep(p) {
    margin: 0;
  }
}

.nb-page-header__facts {
  margin-block-start: var(--nb-spacing-4);
}

// On a phone the actions keep to their own corner: the action group has
// already folded to icons and a menu, so the title takes the rest of the row.
@include breakpoints.phone {
  .nb-page-header__title-row {
    gap: var(--nb-spacing-8);
  }
}
</style>
