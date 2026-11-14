<template>
  <div
    :class="[
      'nb-button-set',
      `nb-button-set--stack-${stack}`,
      `nb-button-set--align-${align}`,
      `nb-button-set--${focusOrder}`,
      { 'nb-button-set--fluid': fluid },
      { 'nb-button-set--stacked': stacked },
    ]"
  >
    <component :is="node" v-for="node in ordered()" :key="node.key" />
  </div>
</template>

<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  computed,
  useSlots,
  type VNode,
} from 'vue'
import NbButton from './Button.vue'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import type { IButtonSetProps } from './ButtonSet.d'

/*
 * The reusable row of buttons: a dialog footer, a tour's Back and Next, the
 * actions under a form.
 *
 * The one rule it exists to enforce is where the primary goes. Carbon puts it
 * last in a row (on the right, where the eye finishes and the hand rests) and
 * first in a column (on top), and every hand-built footer in the fleet got one
 * of the two wrong at some width. So the set reads each child's `variant` and
 * places the primary itself, whatever order the slot was written in.
 *
 * Where the primary is drawn and where Tab finds it are two decisions.
 *
 * `focusOrder="rank"` (a dialog footer): the DOM is the rank order, the
 * primary first, then the others from the right-hand end of the row back to
 * the left. A row is drawn with `row-reverse` and a column with `column`, so
 * the same DOM gives the primary on the right in a row and on top in a
 * column, and the phone breakpoint is a stylesheet change. It is Carbon's
 * dialog focus order: Tab reaches the primary first and moves left through
 * the others, before it wraps to the close button.
 *
 * `focusOrder="reading"` (everywhere else): the DOM is the order the row is
 * read in, so Tab follows the eye. In a row the primary goes last (right),
 * in a column first (top), and the set re-renders when the phone layout
 * stacks it.
 */
const props = withDefaults(defineProps<IButtonSetProps>(), {
  fluid: false,
  stack: 'never',
  align: 'start',
  size: undefined,
  focusOrder: 'reading',
})

const { phone } = usePhoneLayout()
const stacked = computed(
  () => props.stack === 'always' || (props.stack === 'phone' && phone.value),
)

const slots = useSlots()

const MAX_BUTTONS = 3
let warned = false

/** The rendered children, with fragments (v-for, a forwarded slot) opened up. */
function flatten(nodes: VNode[], out: { node: VNode; index: number }[] = []) {
  for (const node of nodes) {
    if (node.type === Fragment && Array.isArray(node.children)) {
      flatten(node.children as VNode[], out)
      continue
    }
    // v-if placeholders and the whitespace between tags are not buttons.
    if (node.type === Comment) continue
    if (node.type === Text && String(node.children ?? '').trim() === '') {
      continue
    }
    out.push({ node, index: out.length })
  }
  return out
}

/*
 * A primary is a filled primary or a filled danger button: danger takes the
 * primary's place in a destructive set. Outlined (tertiary) is not, and
 * neither is anything that is not a variant at all. The template compiler
 * hands a bare `outlined` attribute through as an empty string, so presence
 * is what counts, not truthiness.
 */
function isPrimary(node: VNode): boolean {
  const p = (node.props ?? {}) as Record<string, unknown>
  if (p.variant !== 'primary' && p.variant !== 'danger') return false
  return !('outlined' in p) || p.outlined === false
}

function order(nodes: VNode[]): VNode[] {
  const items = flatten(nodes)
  let primary = -1
  for (let i = items.length - 1; i >= 0; i--) {
    if (isPrimary(items[i].node)) {
      primary = i
      break
    }
  }
  const others = items.filter((_, i) => i !== primary)
  const top = primary >= 0 ? [items[primary]] : []
  let ranked: typeof items
  if (props.focusOrder === 'rank') ranked = [...top, ...others.reverse()]
  // Reading order: the primary leads a column and closes a row.
  else if (stacked.value) ranked = [...top, ...others]
  else ranked = [...others, ...top]
  return ranked.map(({ node, index }) =>
    cloneVNode(node, {
      // Keyed by slot position, so moving a button in the DOM moves the same
      // button (and its focus) rather than patching one into another.
      key: node.key ?? `nb-button-set-${index}`,
      ...(props.size && node.type === NbButton ? { size: props.size } : {}),
    }),
  )
}

function warnTooMany(n: number) {
  if (warned || n <= MAX_BUTTONS) return
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  warned = true
  console.warn(
    `[NbButtonSet] ${n} buttons in one set. A set holds at most ${MAX_BUTTONS}: ` +
      'one primary and two others. Move the rest into an overflow menu or ' +
      'onto the page.',
  )
}

/*
 * Called from the template, so the slot is read inside this component's own
 * render: a button behind a `v-if` is ranked on the render that adds it, and
 * a parent that re-renders with a new v-for item re-ranks the buttons from
 * it. A functional child with no props did the first and not the second: Vue
 * never patches a child whose props and children did not change, so it kept
 * the old labels, a button that should have gone, and stale click handlers.
 */
function ordered() {
  const ranked = order(slots.default?.() ?? [])
  warnTooMany(ranked.length)
  return ranked
}
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as bp;

/*
 * The child rules are written from `.nb-button-set.nb-button-set--…`, two
 * classes deep, because they undo a button's own sizing (an xl button's
 * 20rem cap) and a tie with the button's scoped rule would leave the outcome
 * to stylesheet order.
 */
.nb-button-set {
  display: flex;
  flex-direction: row-reverse;
  align-items: stretch;
  gap: calc(var(--nb-base-unit) * 2);

  // The row runs from the right, so the ends swap: `start` gathers at the
  // left edge, which is the far end of a reversed row.
  &--align-start {
    justify-content: flex-end;
  }
  &--align-end {
    justify-content: flex-start;
  }

  /*
   * Fluid: equal widths with nothing between them but a 1px rule. The rule is
   * drawn on the side of each button that faces the one before it in the DOM,
   * which in a reversed row is its inline end. An inset shadow, so it costs
   * no width and the buttons stay exactly equal.
   */
  &.nb-button-set--fluid {
    gap: 0;

    > :deep(*) {
      flex: 1 1 0;
      min-width: 0;
      max-width: none;
    }

    > :deep(* + *:not(:focus-visible)) {
      box-shadow: inset -1px 0 0 0 var(--nb-c-border);
    }
  }
}

/*
 * Reading order: the DOM already runs the way the row is read, so the row is
 * drawn forwards, the ends mean what they say, and the fluid rule sits on
 * each button's inline start, facing the one before it.
 */
.nb-button-set.nb-button-set--reading {
  flex-direction: row;

  &.nb-button-set--align-start {
    justify-content: flex-start;
  }
  &.nb-button-set--align-end {
    justify-content: flex-end;
  }

  &.nb-button-set--fluid > :deep(* + *:not(:focus-visible)) {
    box-shadow: inset 1px 0 0 0 var(--nb-c-border);
  }
}

// Stacked: a column with the primary on top, every button the column's width.
@mixin stacked {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;

  > :deep(*) {
    max-width: none;
  }

  &.nb-button-set--fluid > :deep(* + *:not(:focus-visible)) {
    box-shadow: inset 0 1px 0 0 var(--nb-c-border);
  }
}

.nb-button-set.nb-button-set--stack-always,
.nb-button-set.nb-button-set--reading.nb-button-set--stacked {
  @include stacked;
}

@include bp.phone {
  .nb-button-set.nb-button-set--stack-phone {
    @include stacked;
  }
}
</style>
