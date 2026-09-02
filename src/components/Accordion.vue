<template>
  <div
    class="nb-accordion"
    :class="[
      `nb-accordion--${size}`,
      `nb-accordion--align-${align}`,
      { 'nb-accordion--flush': flush },
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue'
import type { IAccordionProps } from './Accordion.d'
import { NB_ACCORDION_CONTEXT } from './Accordion.context'

const props = withDefaults(defineProps<IAccordionProps>(), {
  modelValue: undefined,
  multiple: false,
  flush: false,
  align: 'end',
  size: 'md',
  headingLevel: 3,
})

const emit = defineEmits<{
  'update:modelValue': [ids: string[]]
  /** Fired whenever an item opens or closes, with the item and its new state.
   *  Cheaper to consume than diffing `modelValue` when a consumer only wants
   *  to lazily load one section's content. */
  toggle: [id: string, open: boolean]
}>()

// Uncontrolled unless the consumer binds modelValue. Keeping an internal ref
// rather than requiring v-model means the common case, an accordion that just
// opens and closes, needs no state in the parent at all.
const internalOpen = ref<string[]>([])
const open = computed<string[]>(() =>
  props.modelValue === undefined ? internalOpen.value : props.modelValue,
)

function setOpen(next: string[]) {
  if (props.modelValue === undefined) internalOpen.value = next
  emit('update:modelValue', next)
}

function toggle(id: string) {
  const isOpen = open.value.includes(id)
  if (isOpen) setOpen(open.value.filter((v) => v !== id))
  else setOpen(props.multiple ? [...open.value, id] : [id])
  emit('toggle', id, !isOpen)
}

// ── Roving focus over the headers ─────────────────────────────────────
//
// Items register themselves so the group can answer "which header is after
// this one", which a single item cannot know. Registration order is mount
// order, which is DOM order for a static list; items are re-sorted by document
// position on use so a v-for that reorders still moves focus correctly.
const items: { id: string; el: () => HTMLElement | null }[] = []

function register(id: string, el: () => HTMLElement | null) {
  items.push({ id, el })
  return () => {
    const i = items.findIndex((it) => it.id === id)
    if (i >= 0) items.splice(i, 1)
  }
}

function focusSibling(id: string, to: 'prev' | 'next' | 'first' | 'last') {
  const live = items
    .map((it) => ({ ...it, node: it.el() }))
    .filter((it) => it.node && !it.node.hasAttribute('disabled'))
    .sort((a, b) =>
      a.node!.compareDocumentPosition(b.node!) &
      Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
    )
  if (!live.length) return
  const at = live.findIndex((it) => it.id === id)
  const target =
    to === 'first'
      ? live[0]
      : to === 'last'
        ? live[live.length - 1]
        : to === 'next'
          ? live[(at + 1) % live.length]
          : live[(at - 1 + live.length) % live.length]
  target?.node?.focus()
}

provide(NB_ACCORDION_CONTEXT, {
  open,
  multiple: toRef(props, 'multiple'),
  align: toRef(props, 'align'),
  size: toRef(props, 'size'),
  flush: toRef(props, 'flush'),
  headingLevel: toRef(props, 'headingLevel'),
  toggle,
  register,
  focusSibling,
})
</script>

<style scoped lang="scss">
// The accordion is a stack of rules, not a stack of boxes. Carbon draws it as
// dividing lines rather than as bordered cards, and the reason holds here: an
// accordion sits in page body, where a border per section would compete with
// whatever surface it is already on.
.nb-accordion {
  --nb-accordion-pad-x: var(--nb-spacing-16);
  --nb-accordion-pad-y: var(--nb-spacing-10);
  --nb-accordion-row-h: 40px;

  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);

  &--sm {
    // 4px padding gives a 28px content box; min-height floors it to 32, which
    // is the one size where the floor still does the work.
    --nb-accordion-pad-y: var(--nb-spacing-4);
    --nb-accordion-row-h: 32px;
  }

  &--lg {
    --nb-accordion-pad-y: var(--nb-spacing-14);
    --nb-accordion-row-h: 48px;
  }

  // Flush: the rules stay, the inset goes. For a panel or sidebar, where the
  // inset would push titles out of line with the content above them and put
  // two nearly-touching rules on the page.
  &--flush {
    --nb-accordion-pad-x: 0px;
    border-left: 0;
    border-right: 0;
  }
}
</style>
