<template>
  <div :id="componentInternalId" :class="rootClasses">
    <ol
      ref="listRef"
      class="nb-stepper__list"
      role="list"
      :aria-label="ariaLabel || labels.progress"
      @keydown="onKeydown"
      @focusin="onFocusin"
      @focusout="onFocusout"
    >
      <slot />
    </ol>

    <!-- Announced, never seen. The step markers change colour when the flow
         advances, which tells a sighted user everything and a screen-reader
         user nothing: no focus moves and no text they are reading changes. -->
    <p class="nb-stepper__announcement" role="status" aria-live="polite">
      {{ announcement }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUpdated,
  provide,
  ref,
  toRef,
  watch,
} from 'vue'
import { EStepperOrientation, EStepperSize, IStepperProps } from './Stepper.d'
import { NB_STEPPER_CONTEXT, type IStepperEntry } from './Stepper.context'
import { useStableId } from '@/composables/useStableId.composable'

const props = withDefaults(defineProps<IStepperProps>(), {
  id: undefined,
  modelValue: undefined,
  orientation: EStepperOrientation.Horizontal,
  size: EStepperSize.Medium,
  navigable: false,
  furthest: undefined,
  ariaLabel: undefined,
  labels: undefined,
  announce: true,
})

const emit = defineEmits<{
  'update:modelValue': [index: number]
  /** The user picked an earlier step. Only ever fired when `navigable`. */
  change: [index: number]
}>()

const componentInternalId = useStableId(props)
const listRef = ref<HTMLElement | null>(null)

const DEFAULT_LABELS = {
  progress: 'Progress',
  announcement: 'Step {step} of {total}: {label}',
  complete: 'Complete',
  current: 'Current step',
  incomplete: 'Not started',
  disabled: 'Unavailable',
  invalid: 'Needs attention',
}

const labels = computed(() => ({ ...DEFAULT_LABELS, ...(props.labels ?? {}) }))

// Uncontrolled unless the consumer binds modelValue. A stepper that only
// reports where a wizard already is does not need state in the parent.
const internalCurrent = ref(props.modelValue ?? 0)
const current = computed(() =>
  props.modelValue === undefined ? internalCurrent.value : props.modelValue,
)

// The high-water mark. Going back to step 1 must not lock steps 2 and 3 again,
// so reachability is measured against the furthest step ever reached rather
// than against the current one. A consumer resuming a saved flow passes
// `furthest` instead, because the component cannot know what a previous
// session got through.
const reached = ref(current.value)
watch(current, (value) => {
  if (value > reached.value) reached.value = value
})
const furthest = computed(() => props.furthest ?? reached.value)

// ── Registry, in document order ───────────────────────────────────────
//
// A step cannot know its own number, whether it is reachable, or whether it is
// the one step carrying tabindex="0". The parent answers all three, and the
// only honest answer is the one the DOM gives: `order` is re-derived from
// document position, never from the order children happened to call setup().
//
// Mount order is a lie the moment a step is v-if'd into the middle of the list
// or a v-for is reordered, and the docs recommend exactly that v-for. Getting
// it wrong is not a cosmetic bug: it renumbers the markers, flips complete and
// incomplete, and moves aria-current onto the wrong <li>.
const entries: IStepperEntry[] = []
const order = ref<string[]>([])

function syncOrder() {
  const live = entries.map((entry, at) => ({
    uid: entry.uid,
    node: entry.el(),
    at,
  }))

  // Registration order is the tiebreak, not the answer: it is correct for the
  // first render (children set up in template order, before any node exists)
  // and is what keeps the very first paint right instead of numbering every
  // marker "1" until the mounted hook runs.
  live.sort((a, b) => {
    if (!a.node || !b.node) return a.at - b.at
    return a.node.compareDocumentPosition(b.node) &
      Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1
  })

  const next = live.map((item) => item.uid)
  const changed =
    next.length !== order.value.length ||
    next.some((uid, at) => uid !== order.value[at])
  if (changed) order.value = next
}

function register(entry: IStepperEntry) {
  entries.push(entry)
  syncOrder()
  return () => {
    const at = entries.findIndex((e) => e.uid === entry.uid)
    if (at >= 0) entries.splice(at, 1)
    syncOrder()
  }
}

// Every re-render of the list is a chance for the DOM to disagree with the
// registry: a step appeared, went away, or moved. Re-deriving costs one
// comparison per step and only writes when the answer actually changed, so it
// settles in a single extra tick rather than looping.
onMounted(syncOrder)
onUpdated(syncOrder)

const disabledAt = (index: number) => {
  const uid = order.value[index]
  return entries.find((entry) => entry.uid === uid)?.disabled.value ?? false
}

function clickable(index: number, disabled: boolean): boolean {
  if (!props.navigable || disabled) return false
  if (index < 0 || index === current.value) return false
  return index <= furthest.value
}

// ── Roving tabindex ───────────────────────────────────────────────────
//
// The group takes one Tab stop and the arrow keys move inside it, so a
// five-step indicator does not cost five Tab presses on the way to the form it
// sits above. The stop follows focus: arrow to step 3, Tab away, Shift+Tab
// back and you land on step 3, not back at step 1.
const focusedIndex = ref(-1)

const tabbable = computed(() => {
  if (
    focusedIndex.value >= 0 &&
    clickable(focusedIndex.value, disabledAt(focusedIndex.value))
  ) {
    return focusedIndex.value
  }
  return order.value.findIndex((_, index) =>
    clickable(index, disabledAt(index)),
  )
})

// Tracked because focus can be destroyed rather than moved. A step's click
// target is a <button> only while it is reachable, so the moment the flow
// lands on the step the user is standing on, `<component :is>` swaps that
// button for a <div> and the browser drops focus to <body>: the next Tab
// restarts at the top of the page, which for a stepper sitting above a form
// means walking the whole document again.
const lastFocused = ref<HTMLElement | null>(null)

function onFocusin(event: FocusEvent) {
  const target = event.target as HTMLElement | null
  lastFocused.value = target
  const li = target?.closest?.('[data-nb-step]')
  const uid = (li as HTMLElement | null)?.dataset?.nbStep
  if (!uid) return
  const at = order.value.indexOf(uid)
  if (at >= 0) focusedIndex.value = at
}

/**
 * `relatedTarget` is not evidence, so it is not what this trusts.
 *
 * Removing a focused element from the DOM fires focusout with a null
 * `relatedTarget` in Firefox, and that removal is exactly the button-to-div
 * swap `restoreFocus` exists to repair: reading the null as "focus left the
 * group" would switch the repair off in the only browser that reports it.
 * jsdom fires nothing at all here, so a test could never tell us either. What
 * is checked instead is the node we last saw focused: if it is still in the
 * document, focus genuinely moved somewhere and the group should keep its
 * hands off. If it is gone, focus was destroyed rather than moved.
 */
function onFocusout(event: FocusEvent) {
  const to = event.relatedTarget as Node | null
  if (to && listRef.value?.contains(to)) return
  if (to) {
    lastFocused.value = null
    return
  }
  const from = event.target as HTMLElement | null
  if (from && !listRef.value?.contains(from)) lastFocused.value = null
}

/**
 * Put focus back where the tab stop went.
 *
 * Only ever runs when the group held focus and then lost it to nothing, which
 * is the element-swap case. If focus went somewhere on purpose (the user
 * tabbed on, the wizard focused the new step's heading) it is left alone:
 * stealing focus back from a heading a screen reader has just started reading
 * would be worse than the bug this fixes.
 */
async function restoreFocus() {
  const previous = lastFocused.value
  // Never held focus, or gave it away on purpose. Either way, not ours.
  if (!previous) return

  // After the re-render, because the swap that destroys focus is the render.
  await nextTick()
  const list = listRef.value
  if (!list) return

  // Somebody has focus inside the group already, so nothing was lost.
  const active = document.activeElement
  if (active && active !== document.body && list.contains(active)) return

  // The node we last saw focused survived the render and is still ours: put
  // focus back on it rather than on whatever the tab stop has moved to, which
  // keeps the user where they were.
  if (
    previous.isConnected &&
    list.contains(previous) &&
    previous.matches('[data-nb-stepper-button]')
  ) {
    previous.focus()
    return
  }

  const targets = buttons()
  if (!targets.length) {
    // Nothing in the group is focusable any more, which is the honest end of
    // a finished flow. Focus is not parked on a dead element; the caller's
    // own focus management takes it from here.
    lastFocused.value = null
    return
  }
  // `tabbable` indexes steps; `targets` only holds the ones that are still
  // buttons, so the two lists do not line up. Match on the step's id.
  const uid = order.value[tabbable.value]
  const target =
    targets.find(
      (node) =>
        node.closest<HTMLElement>('[data-nb-step]')?.dataset.nbStep === uid,
    ) ?? targets[0]
  target.focus()
  lastFocused.value = target
}

function select(index: number, disabled: boolean) {
  if (!clickable(index, disabled)) return
  if (props.modelValue === undefined) internalCurrent.value = index
  emit('update:modelValue', index)
  emit('change', index)
}

provide(NB_STEPPER_CONTEXT, {
  current,
  furthest,
  orientation: toRef(props, 'orientation'),
  size: toRef(props, 'size'),
  navigable: toRef(props, 'navigable'),
  labels,
  order,
  tabbable,
  register,
  clickable,
  select,
})

const rootClasses = computed(() => [
  'nb-stepper',
  `nb-stepper--${props.orientation}`,
  `nb-stepper--${props.size}`,
  { 'nb-stepper--navigable': props.navigable },
])

// ── Telling a screen reader the flow moved ────────────────────────────
//
// The wizard around the stepper may or may not move focus when it advances.
// If it does, `announce` turns this off; if it does not, this is the only
// notification a screen-reader user gets, so it defaults on. Read out of the
// DOM rather than off the `label` prop so a #label slot still announces.
const announcement = ref('')

watch(current, (index) => {
  const uid = order.value[index]
  const node = entries.find((entry) => entry.uid === uid)?.el() ?? null

  if (props.announce) {
    const label =
      node?.querySelector('.nb-stepper__label')?.textContent?.trim() ?? ''
    announcement.value = labels.value.announcement
      .replace('{step}', String(index + 1))
      .replace('{total}', String(order.value.length))
      .replace('{label}', label)
      .replace(/[:,\-\s]+$/, '')
  }

  void restoreFocus()

  // Only when the row actually scrolls. A stepper that fits is left alone:
  // scrolling a page because a marker changed colour is worse than not.
  const list = listRef.value
  if (list && node && list.scrollWidth > list.clientWidth) {
    node.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }
})

// ── Keyboard ──────────────────────────────────────────────────────────
//
// Focus moves, it does not select: pressing an arrow key must not navigate a
// wizard away from a half-filled form. Enter and Space do that, and they come
// free with the button element.
function buttons(): HTMLElement[] {
  return Array.from(
    listRef.value?.querySelectorAll<HTMLElement>('[data-nb-stepper-button]') ??
      [],
  )
}

function move(offset: number) {
  const list = buttons()
  if (!list.length) return
  const at = list.indexOf(document.activeElement as HTMLElement)
  const from = at < 0 ? 0 : at + offset
  list[(from + list.length) % list.length]?.focus()
}

function jump(to: 'first' | 'last') {
  const list = buttons()
  if (!list.length) return
  ;(to === 'first' ? list[0] : list[list.length - 1]).focus()
}

function onKeydown(event: KeyboardEvent) {
  const horizontal = props.orientation === EStepperOrientation.Horizontal
  switch (event.key) {
    case 'ArrowRight':
      if (!horizontal) return
      move(1)
      break
    case 'ArrowLeft':
      if (!horizontal) return
      move(-1)
      break
    case 'ArrowDown':
      if (horizontal) return
      move(1)
      break
    case 'ArrowUp':
      if (horizontal) return
      move(-1)
      break
    case 'Home':
      jump('first')
      break
    case 'End':
      jump('last')
      break
    default:
      return
  }
  event.preventDefault()
}
</script>

<style scoped lang="scss">
// The stepper is a row of markers joined by a rule, and the rule is the whole
// point: it is what makes four labels read as one sequence rather than as four
// links. Markers are squared (--nb-radius-sm) because everything else in this
// library that holds a glyph is, and a circle here would be the only round
// thing on a form page.
//
// The root is a wrapper rather than the <ol> itself so the list can be the
// scroll container and the live region can sit outside it: an <ol> may only
// contain <li>, and a <p role="status"> inside one is invalid markup that
// assistive tech is entitled to ignore.
.nb-stepper {
  // Containing block for the live region below. Without it, a 1px absolutely
  // positioned <p> escapes to whatever positioned ancestor the consumer
  // happens to have, which on a scrolled panel is a stray pixel of overflow.
  position: relative;

  --nb-stepper-marker: 24px;
  --nb-stepper-gap: var(--nb-spacing-8);
  --nb-stepper-label-size: var(--nb-font-size-14);
  --nb-stepper-marker-size: var(--nb-font-size-12);
  --nb-stepper-line: 2px;
  // The narrow-viewport contract. Steps never compress past this; the list
  // scrolls instead. Five steps at 8rem need 40rem, so a 360px phone scrolls
  // rather than rendering five 70px columns with one word each.
  --nb-stepper-step-min: 8rem;

  font-family: var(--nb-font-family-sans);

  &--sm {
    --nb-stepper-marker: 20px;
    --nb-stepper-gap: var(--nb-spacing-8);
    --nb-stepper-label-size: var(--nb-font-size-12);
    --nb-stepper-marker-size: var(--nb-font-size-11);
    --nb-stepper-step-min: 6.5rem;
  }
}

.nb-stepper__list {
  display: flex;
  margin: 0;
  // Vertical padding, not zero: the focus ring on a step body is drawn with a
  // 2px outline offset and would be sliced off by the scroll container.
  padding-block: var(--nb-spacing-4);
  padding-inline: 0;
  list-style: none;
}

// Horizontal: every step takes an equal share so the connectors are equal
// lengths, which is what stops the sequence reading as if step 3 were further
// away than step 2. Below the width that allows, the row scrolls: a squashed
// step is unreadable, and a scrolled one is merely off screen.
.nb-stepper--horizontal .nb-stepper__list {
  flex-direction: row;
  inline-size: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  // The row is scrolled by advancing the flow, not by the user reaching for
  // it, so the movement has to be traceable: a marker that teleports reads as
  // a different list. Cancelled outright under prefers-reduced-motion below,
  // which is the whole reason the property is set here rather than left to
  // the default.
  scroll-behavior: smooth;
  scrollbar-width: thin;
}

.nb-stepper--vertical .nb-stepper__list {
  flex-direction: column;
}

.nb-stepper__announcement {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (prefers-reduced-motion: reduce) {
  .nb-stepper__list {
    scroll-behavior: auto;
  }
}
</style>
