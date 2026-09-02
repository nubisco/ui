<template>
  <div
    class="nb-accordion-item"
    :class="{
      'nb-accordion-item--open': isOpen,
      'nb-accordion-item--disabled': disabled,
    }"
  >
    <div
      class="nb-accordion-item__heading"
      role="heading"
      :aria-level="headingLevel"
    >
      <button
        :id="`${uid}-header`"
        ref="headerRef"
        type="button"
        class="nb-accordion-item__header"
        :aria-expanded="isOpen"
        :aria-controls="`${uid}-panel`"
        :disabled="disabled"
        @click="onToggle"
        @keydown="onKeydown"
      >
        <NbIcon
          class="nb-accordion-item__chevron"
          name="caret-down"
          :size="16"
          aria-hidden="true"
        />
        <NbIcon v-if="icon" :name="icon" :size="16" />
        <span class="nb-accordion-item__title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="meta || $slots.meta" class="nb-accordion-item__meta">
          <slot name="meta">{{ meta }}</slot>
        </span>
      </button>
    </div>

    <!-- Kept in the DOM and hidden, rather than removed. An accordion is
         progressive disclosure, not lazy loading: the browser's find-in-page
         cannot reach content that is not there, and a consumer who wants the
         cost of a section deferred can do it themselves off the `toggle`
         event. `hidden` is what makes it inert for assistive tech too. -->
    <div
      :id="`${uid}-panel`"
      class="nb-accordion-item__panel"
      role="region"
      :aria-labelledby="`${uid}-header`"
      :hidden="!isOpen"
    >
      <div class="nb-accordion-item__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import type { IAccordionItemProps } from './Accordion.d'
import { NB_ACCORDION_CONTEXT } from './Accordion.context'
import NbIcon from './Icon.vue'
import { useStableId } from '../composables/useStableId.composable'

const props = withDefaults(defineProps<IAccordionItemProps>(), {
  id: undefined,
  title: '',
  icon: undefined,
  meta: '',
  disabled: false,
})

const group = inject(NB_ACCORDION_CONTEXT, null)

const stableId = useStableId(props)

const headingLevel = computed(() => group?.headingLevel?.value ?? 3)

// useStableId already honours props.id and falls back to a component-slugged
// instance id, so an item without an explicit id still gets one that survives
// re-render and is meaningful in the DOM.
const uid = computed(() => stableId)

const headerRef = ref<HTMLButtonElement | null>(null)
const isOpen = computed(() => group?.open.value.includes(uid.value) ?? false)

// Used outside an NbAccordion the item still renders, it just cannot open.
// That is a mistake worth making obvious rather than silently swallowing.
if (group) {
  const unregister = group.register(uid.value, () => headerRef.value)
  onBeforeUnmount(unregister)
}

function onToggle() {
  if (props.disabled) return
  group?.toggle(uid.value)
}

// The WAI-ARIA accordion pattern. Enter and Space come free with <button>;
// these are the extras that make a long accordion navigable without tabbing
// through every panel's contents to reach the next header.
const MOVES: Record<string, 'prev' | 'next' | 'first' | 'last'> = {
  ArrowUp: 'prev',
  ArrowDown: 'next',
  Home: 'first',
  End: 'last',
}

function onKeydown(event: KeyboardEvent) {
  const move = MOVES[event.key]
  if (!move || !group) return
  event.preventDefault()
  group.focusSibling(uid.value, move)
}
</script>

<style scoped lang="scss">
.nb-accordion-item {
  & + & {
    border-top: 1px solid var(--nb-c-border);
  }
}

// `role="heading"` on a div rather than an <h3>: the heading carries the
// outline level for assistive tech and the button inside carries the
// interaction, which is what lets a screen reader both list the sections and
// operate them. Using the role instead of the element also keeps the row out
// of reach of a host's `.container h3 { margin }`, which outranks a
// component's own scoped class and was adding 20px above every title.
.nb-accordion-item__heading {
  margin: 0;
  font: inherit;
  display: flex;
}

.nb-accordion-item__header {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  width: 100%;
  min-height: var(--nb-accordion-row-h);
  // Padding, not just the min-height. The title's line box is ~20px, so with a
  // fixed 8px block padding every row was at least 36px and `sm` never got
  // below `md`: the floor was never the thing deciding the height. This makes
  // the padding the difference and leaves min-height as a floor for a row whose
  // content happens to be shorter.
  padding: var(--nb-accordion-pad-y) var(--nb-accordion-pad-x);
  border: 0;
  background: transparent;
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-14);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: background 70ms linear;

  &:hover {
    background: var(--nb-c-surface-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }

  &:disabled {
    color: var(--nb-c-text-subtle);
    cursor: not-allowed;
  }

  // Hover and focus reach into the gutter on a flush accordion, so the target
  // still reads as a row rather than as bare text. Carbon does the same, and
  // for the same reason: flush removes the inset from the resting state only.
  .nb-accordion--flush & {
    padding-left: var(--nb-spacing-16);
    padding-right: var(--nb-spacing-16);
    margin-left: calc(-1 * var(--nb-spacing-16));
    margin-right: calc(-1 * var(--nb-spacing-16));
    width: calc(100% + var(--nb-spacing-16) * 2);
  }
}

.nb-accordion-item__title {
  flex: 1 1 auto;
  min-width: 0;
}

.nb-accordion-item__meta {
  flex: 0 0 auto;
  color: var(--nb-c-text-subtle);
  font-weight: var(--nb-font-weight-regular, 400);
  font-variant-numeric: tabular-nums;
}

.nb-accordion-item__chevron {
  flex: 0 0 auto;
  color: var(--nb-c-text-subtle);
  transition: transform 110ms cubic-bezier(0, 0, 0.38, 0.9);

  // Trailing by default, so every title starts on the same line as the type
  // around it. `order` rather than a second template keeps one DOM order for
  // assistive tech whichever way it is drawn.
  .nb-accordion--align-end & {
    order: 2;
    margin-left: auto;
  }

  .nb-accordion-item--open & {
    transform: rotate(180deg);
  }
}

.nb-accordion--align-end .nb-accordion-item__meta {
  order: 1;
}

.nb-accordion-item__body {
  padding: 0 var(--nb-accordion-pad-x) var(--nb-spacing-16);
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-14);
  line-height: 1.5;

  // Room for the chevron's column, so body copy lines up with the title rather
  // than with the icon that opens it.
  .nb-accordion--align-start & {
    padding-left: calc(var(--nb-accordion-pad-x) + var(--nb-spacing-24));
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-accordion-item__chevron,
  .nb-accordion-item__header {
    transition: none;
  }
}
</style>
