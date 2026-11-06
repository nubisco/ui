<template>
  <li
    class="nb-contained-list-item"
    :class="{
      'nb-contained-list-item--interactive': isInteractive,
      'nb-contained-list-item--current': current,
      'nb-contained-list-item--disabled': disabled,
    }"
  >
    <component
      :is="tag"
      class="nb-contained-list-item__row"
      v-bind="attrs"
      :aria-current="ariaCurrent"
      :aria-disabled="disabled ? true : undefined"
      @click="onClick"
      @keydown="onKeydown"
    >
      <span v-if="$slots.leading" class="nb-contained-list-item__leading">
        <slot name="leading" />
      </span>
      <span class="nb-contained-list-item__main">
        <span class="nb-contained-list-item__title-line">
          <span v-if="itemKey" class="nb-contained-list-item__key">
            {{ itemKey }}
          </span>
          <span class="nb-contained-list-item__title">
            <slot>{{ title }}</slot>
          </span>
        </span>
        <span v-if="line || $slots.line" class="nb-contained-list-item__line">
          <slot name="line">{{ line }}</slot>
        </span>
      </span>
      <span v-if="$slots.trailing" class="nb-contained-list-item__trailing">
        <slot name="trailing" />
      </span>
    </component>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSurfaceLink } from './Card.link'
import type { IContainedListItemProps } from './ContainedList.d'

const props = withDefaults(defineProps<IContainedListItemProps>(), {
  title: undefined,
  itemKey: undefined,
  line: undefined,
  to: undefined,
  href: undefined,
  target: undefined,
  clickable: false,
  current: false,
  disabled: false,
})

const emit = defineEmits<{
  /** Activated by a click, Enter or Space. The event carries the modifier keys. */
  select: [event: MouseEvent | KeyboardEvent]
}>()

// The same element choice as NbCard: a link when it navigates, a button when
// it acts, a plain element when it does neither. The `<li>` stays the list
// item either way, so the list keeps its count for a screen reader.
const { tag, attrs, isLink, isInteractive, onClick, onKeydown } =
  useSurfaceLink(props, (event) => emit('select', event))

// `page` on a link: "this is the page you are on". `true` on anything else:
// "this is the current one of the set", the record open beside the list.
const ariaCurrent = computed(() => {
  if (!props.current) return undefined
  return isLink.value ? 'page' : 'true'
})
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as breakpoints;

.nb-contained-list-item + .nb-contained-list-item {
  border-block-start: 1px solid var(--nb-c-border);
}

.nb-contained-list-item__row {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-12);
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: var(--nb-contained-list-row-h, 40px);
  padding: var(--nb-spacing-4) var(--nb-spacing-8);
  color: inherit;
  text-align: start;
  text-decoration: none;
}

.nb-contained-list-item--interactive > .nb-contained-list-item__row {
  cursor: pointer;
  transition: background var(--nb-motion-micro) linear;

  &:hover {
    background: var(--nb-c-surface-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }
}

// The current row: a tint and an edge, the edge because the tint alone is
// close to the hover on some planes.
.nb-contained-list-item--current > .nb-contained-list-item__row {
  background: var(--nb-c-surface-selected, var(--nb-c-surface-hover));
  box-shadow: inset 2px 0 0 var(--nb-c-selected-edge);
}

.nb-contained-list-item--disabled > .nb-contained-list-item__row {
  opacity: 0.55;
  cursor: not-allowed;
}

.nb-contained-list-item__leading,
.nb-contained-list-item__trailing {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--nb-spacing-4);
}

.nb-contained-list-item__trailing {
  margin-inline-start: auto;
  color: var(--nb-c-text-muted);
  font-size: var(--nb-type-label-md-size);
}

.nb-contained-list-item__main {
  display: grid;
  flex: 1 1 auto;
  min-inline-size: 0;
}

.nb-contained-list-item__title-line {
  display: flex;
  align-items: baseline;
  gap: var(--nb-spacing-8);
  min-inline-size: 0;
}

.nb-contained-list-item__key {
  flex: none;
  font-family: var(--nb-font-family-mono);
  font-size: var(--nb-type-code-sm-size);
  font-weight: var(--nb-font-weight-regular);
  color: var(--nb-c-text-subtle);
}

.nb-contained-list-item__title {
  min-inline-size: 0;
  font-size: var(--nb-type-heading-compact-size, var(--nb-font-size-14));
  font-weight: var(
    --nb-type-heading-compact-weight,
    var(--nb-font-weight-semibold)
  );
  line-height: var(--nb-type-heading-compact-line-height, 1.3);
  color: var(--nb-c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-contained-list-item__line {
  min-inline-size: 0;
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  color: var(--nb-c-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// A row that acts is a whole-row target. On a phone touch screen it grows to
// 44px rather than taking an invisible hit area: the rows are stacked edge to
// edge, so a hit area would overlap the next row's and a tap on the line
// between them would be a coin toss.
@include breakpoints.phone-touch {
  .nb-contained-list-item--interactive > .nb-contained-list-item__row {
    min-block-size: max(44px, var(--nb-contained-list-row-h, 40px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-contained-list-item--interactive > .nb-contained-list-item__row {
    transition: none;
  }
}
</style>
