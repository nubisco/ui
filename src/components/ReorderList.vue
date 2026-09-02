<template>
  <ul
    ref="listRef"
    class="nb-reorder-list"
    :class="{ 'nb-reorder-list--dragging': dragIndex !== null }"
    role="list"
    :aria-label="label || undefined"
    :aria-describedby="`${uid}-hint`"
  >
    <li
      v-for="(item, index) in rows"
      :key="keyOf(item, index)"
      class="nb-reorder-list__row"
      :class="{
        'nb-reorder-list__row--dragging': dragIndex === index,
        'nb-reorder-list__row--lifted': liftedIndex === index,
        'nb-reorder-list__row--drop-before': dropLine === index,
        'nb-reorder-list__row--drop-after':
          dropLine === index + 1 && index === rows.length - 1,
      }"
      :data-index="index"
      @pointerdown="onPointerDown($event, index)"
    >
      <!-- The row itself is the control. It is focusable and carries the
           instructions, so a keyboard user meets one thing per row rather than
           a row and a separate grab button. -->
      <div
        class="nb-reorder-list__grab"
        :tabindex="disabled ? -1 : 0"
        role="button"
        :aria-disabled="disabled || undefined"
        :aria-label="rowLabel(index)"
        @keydown="onKeydown($event, index)"
        @blur="onBlur(index)"
      >
        <slot name="handle" :item="item" :index="index">
          <NbIcon
            class="nb-reorder-list__grip"
            name="dots-six-vertical"
            :size="16"
            aria-hidden="true"
          />
        </slot>
      </div>

      <div class="nb-reorder-list__content">
        <slot :item="item" :index="index">{{ item }}</slot>
      </div>
    </li>

    <!-- Instructions, and the live region that reports what happened. A
         pointer user watches the row move; a keyboard user gets told. -->
    <li :id="`${uid}-hint`" class="nb-reorder-list__sr">
      Press Space or Enter to pick up, arrow keys to move, Space or Enter to
      drop, Escape to cancel.
    </li>
    <li class="nb-reorder-list__sr" aria-live="assertive">
      {{ announcement }}
    </li>
  </ul>
</template>

<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { IReorderListProps } from './ReorderList.d'
import NbIcon from './Icon.vue'
import { useStableId } from '../composables/useStableId.composable'

const props = withDefaults(defineProps<IReorderListProps<T>>(), {
  modelValue: () => [],
  itemKey: undefined,
  handle: false,
  disabled: false,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [items: T[]]
  reorder: [event: { from: number; to: number; via: 'pointer' | 'keyboard' }]
}>()

const uid = useStableId({})
const listRef = ref<HTMLElement | null>(null)
const rows = computed(() => props.modelValue)

function keyOf(item: T, index: number): string | number {
  const k = props.itemKey
  if (typeof k === 'function') return k(item, index)
  if (typeof k === 'string')
    return (item as Record<string, unknown>)?.[k] as string | number
  return index
}

function labelOf(index: number): string {
  const item = rows.value[index] as unknown
  if (item && typeof item === 'object') {
    const named = item as Record<string, unknown>
    const guess = named.label ?? named.name ?? named.title
    if (typeof guess === 'string') return guess
  }
  return String(item ?? `Item ${index + 1}`)
}

function rowLabel(index: number): string {
  const base = `${labelOf(index)}, ${index + 1} of ${rows.value.length}`
  return liftedIndex.value === index ? `${base}, picked up` : base
}

// ── Moving ────────────────────────────────────────────────────────────

const announcement = ref('')

/** The single place the array changes, so pointer and keyboard cannot drift
 *  apart in how they reorder or in what they emit. */
function move(from: number, to: number, via: 'pointer' | 'keyboard') {
  if (from === to || from < 0 || to < 0) return
  const next = [...rows.value]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  emit('update:modelValue', next)
  emit('reorder', { from, to, via })
  announcement.value = `${labelOf(from)} moved to position ${to + 1} of ${next.length}`
}

// ── Keyboard ──────────────────────────────────────────────────────────
//
// Pick up, move, drop. The alternative, arrow keys moving the row directly,
// looks simpler but gives a screen reader user no way to browse the list
// without rearranging it.
const liftedIndex = ref<number | null>(null)

function onKeydown(event: KeyboardEvent, index: number) {
  if (props.disabled) return

  if (event.key === 'Escape' && liftedIndex.value !== null) {
    event.preventDefault()
    liftedIndex.value = null
    announcement.value = 'Move cancelled'
    return
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    if (liftedIndex.value === index) {
      liftedIndex.value = null
      announcement.value = `${labelOf(index)} dropped at position ${index + 1}`
    } else {
      liftedIndex.value = index
      announcement.value = `${labelOf(index)} picked up, position ${index + 1} of ${rows.value.length}`
    }
    return
  }

  const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
  if (!delta) return
  event.preventDefault()

  const to = index + delta
  if (to < 0 || to >= rows.value.length) return

  if (liftedIndex.value === index) {
    move(index, to, 'keyboard')
    liftedIndex.value = to
    // Focus follows the row, not the position, or a held row would be dropped
    // by the next arrow press landing on a different row.
    void focusRow(to)
  } else {
    void focusRow(to)
  }
}

async function focusRow(index: number) {
  await Promise.resolve()
  const el = listRef.value?.querySelector<HTMLElement>(
    `[data-index="${index}"] .nb-reorder-list__grab`,
  )
  el?.focus()
}

function onBlur(index: number) {
  // Dropping on blur rather than leaving a row held indefinitely: a lifted row
  // the user has tabbed away from is a trap, and there is nothing to cancel.
  if (liftedIndex.value === index) liftedIndex.value = null
}

// ── Pointer ───────────────────────────────────────────────────────────
//
// Pointer events rather than HTML5 drag and drop: drag events cannot be
// styled consistently across browsers, do not fire on touch without a
// polyfill, and give no control over the drop indicator's position.
const dragIndex = ref<number | null>(null)
const dropLine = ref<number | null>(null)

function onPointerDown(event: PointerEvent, index: number) {
  if (props.disabled || event.button !== 0) return
  const target = event.target as HTMLElement
  // With `handle`, only the handle starts a drag; without it, anything that is
  // not itself interactive does.
  const fromHandle = !!target.closest('.nb-reorder-list__grab')
  if (props.handle && !fromHandle) return
  if (!fromHandle && target.closest('button, a, input, select, textarea'))
    return

  // A row picked up by keyboard is stale the moment a pointer takes over, and
  // leaving it outlined says something is held when nothing is.
  liftedIndex.value = null
  dragIndex.value = index
  dropLine.value = index
  suppressSelection()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

// Dragging a row otherwise paints a text selection across whatever the pointer
// travels over. It has to be suppressed on the DOCUMENT, not just on the list:
// the pointer leaves the list constantly during a drag, and a selection that
// starts on a row happily extends into the paragraph below it.
//
// Done by hand rather than with a CSS class because a scoped component cannot
// style the document, and restored to whatever the host had rather than to a
// hardcoded value.
let previousUserSelect: string | null = null

function suppressSelection() {
  if (typeof document === 'undefined' || previousUserSelect !== null) return
  previousUserSelect = document.body.style.userSelect
  document.body.style.userSelect = 'none'
  document.body.style.setProperty('-webkit-user-select', 'none')
}

function restoreSelection() {
  if (typeof document === 'undefined' || previousUserSelect === null) return
  document.body.style.userSelect = previousUserSelect
  document.body.style.removeProperty('-webkit-user-select')
  previousUserSelect = null
}

function onPointerMove(event: PointerEvent) {
  if (dragIndex.value === null || !listRef.value) return
  const rowEls = [
    ...listRef.value.querySelectorAll<HTMLElement>('[data-index]'),
  ]
  // Which gap the pointer is nearest. Comparing against each row's midpoint
  // rather than hit-testing rows means the indicator keeps up when the pointer
  // is between rows or past the end of the list.
  let line = rowEls.length
  for (const el of rowEls) {
    const r = el.getBoundingClientRect()
    if (event.clientY < r.top + r.height / 2) {
      line = Number(el.dataset.index)
      break
    }
  }
  dropLine.value = line
}

function onPointerUp() {
  const from = dragIndex.value
  const line = dropLine.value
  cleanupPointer()
  if (from === null || line === null) return
  // The insertion line counts positions between rows, so a row moving down
  // lands one index earlier once it is removed from its old place.
  const to = line > from ? line - 1 : line
  move(from, to, 'pointer')
}

function cleanupPointer() {
  restoreSelection()
  dragIndex.value = null
  dropLine.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

onBeforeUnmount(cleanupPointer)
</script>

<style scoped lang="scss">
.nb-reorder-list {
  // The gap between rows is the drop indicator's home, so it is owned here as
  // a token rather than left to a `margin-top` on the rows: a host that styles
  // `li` margins (VitePress does) was silently turning a 4px gap into 12px,
  // and the indicator was then floating in a gap it had not been sized for.
  --nb-reorder-list-gap: var(--nb-spacing-4);

  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nb-reorder-list-gap);
}

// While a row is in flight the gap opens up, so the indicator has room to be a
// bar rather than a hairline squeezed between two borders.
.nb-reorder-list--dragging {
  --nb-reorder-list-gap: var(--nb-spacing-12);
  // The document-level suppression above is what actually does the work; this
  // covers the list itself for the frame between pointerdown and the handler.
  user-select: none;
  -webkit-user-select: none;
}

// Deliberately over-specified. The rows are `<li>`, and a host that styles
// `some-container li { margin }` writes a rule of higher specificity than a
// component's own scoped class: VitePress does exactly that, and it was adding
// 8px to every gap, so the indicator sat off-centre in a gap it had not been
// sized against. Naming the list as well as the row outranks it.
.nb-reorder-list .nb-reorder-list__row {
  margin: 0;
}

.nb-reorder-list__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  padding: var(--nb-spacing-8);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  // Squared, like the rest of the library. NbPanel sets no radius at all and
  // the scale stops early on purpose; a list row is not the place to spend it.
  border-radius: 0;
  transition:
    background 70ms linear,
    margin 110ms cubic-bezier(0, 0, 0.38, 0.9);

  &:hover {
    background: var(--nb-c-surface-hover);
  }
}

// The row being dragged stays in place and dims, rather than following the
// pointer. A row that moves under the cursor competes with the drop indicator
// for the user's attention, and the indicator is the part that says what will
// actually happen.
.nb-reorder-list__row--dragging {
  opacity: 0.4;
}

// Picked up by keyboard: outlined, because there is no pointer to show where
// the row is going and the outline is what says "this one is in your hand".
.nb-reorder-list__row--lifted {
  border-color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

// The drop indicator, centred in the gap the row would land in. Three pixels
// and full width, because at two it read as a border on the row below it
// rather than as a line between two rows, which is the whole message.
.nb-reorder-list__row--drop-before::before,
.nb-reorder-list__row--drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--nb-c-primary);
  pointer-events: none;
  z-index: 1;
}

.nb-reorder-list__row--drop-before::before {
  top: calc(-1 * (var(--nb-reorder-list-gap) / 2) - 1.5px);
}

.nb-reorder-list__row--drop-after::after {
  bottom: calc(-1 * (var(--nb-reorder-list-gap) / 2) - 1.5px);
}

.nb-reorder-list__grab {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  color: var(--nb-c-text-subtle);
  cursor: grab;
  // Stops the browser starting its own native drag of the grip glyph, which
  // shows a ghost image and competes with the drop indicator.
  -webkit-user-drag: none;

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
  }

  .nb-reorder-list--dragging & {
    cursor: grabbing;
  }
}

.nb-reorder-list__content {
  flex: 1 1 auto;
  min-width: 0;
  font-size: var(--nb-font-size-14);
  color: var(--nb-c-text);
}

// Visually hidden, still announced.
.nb-reorder-list__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .nb-reorder-list__row {
    transition: none;
  }
}
</style>
