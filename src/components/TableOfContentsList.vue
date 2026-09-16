<template>
  <!-- A nested list of in-page links, because that is what a table of contents
       is to assistive technology: links, grouped by section. Links are in the
       tab order, unlike a tree's rows. -->
  <ol :class="['nb-toc-list', { 'nb-toc-list--nested': nested }]">
    <li v-for="node in nodes" :key="node.id" class="nb-toc-list__item">
      <a
        :class="[
          'nb-toc-list__link',
          { 'nb-toc-list__link--active': node.id === active },
        ]"
        :href="`#${node.id}`"
        :aria-current="node.id === active ? 'location' : undefined"
        :data-id="node.id"
        @click="onClick($event, node)"
        >{{ node.label }}</a
      >
      <TableOfContentsList
        v-if="node.children.length > 0"
        :nodes="node.children"
        :active="active"
        nested
        @go="(item) => emit('go', item)"
      />
    </li>
  </ol>
</template>

<script setup lang="ts">
import type { ITableOfContentsNode } from './TableOfContents.d'

defineOptions({ name: 'TableOfContentsList' })

defineProps<{
  nodes: ITableOfContentsNode[]
  active: string | null
  nested?: boolean
}>()

const emit = defineEmits<{ go: [item: ITableOfContentsNode] }>()

function onClick(event: MouseEvent, node: ITableOfContentsNode) {
  // A modified click opens the link the browser's way (new tab, new window),
  // which a real href makes possible. Only a plain click scrolls in place.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (event.button !== 0) return
  event.preventDefault()
  emit('go', node)
}
</script>

<style scoped lang="scss">
.nb-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;

  &--nested {
    padding-inline-start: calc(var(--nb-base-unit) * 1.5);
  }
}

// Reset explicitly: prose styles in the host space list items and lists apart,
// which opened uneven gaps between sections. The docs layout's own
// `.nb-layout__body li` outranks a single scoped class, so the reset carries
// one more class than that.
.nb-toc-list.nb-toc-list,
.nb-toc-list > .nb-toc-list__item {
  margin: 0;
}

.nb-toc-list__link {
  display: block;
  padding-block: calc(var(--nb-base-unit) * 0.25);
  padding-inline: var(--nb-base-unit);
  border-inline-start: 2px solid transparent;
  color: var(--nb-c-text-subtle);
  font-family: var(--nb-type-body-sm-family);
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  text-decoration: none;
  overflow-wrap: anywhere;

  &:hover {
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }

  // The section being read: an accent rule on the reading edge.
  &--active {
    border-inline-start-color: var(--nb-c-primary);
    color: var(--nb-c-text);
    font-weight: 600;
  }
}
</style>
