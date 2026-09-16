<template>
  <button
    ref="handleRef"
    type="button"
    :class="[
      'nb-drag-handle',
      `nb-drag-handle--${axis}`,
      {
        'nb-drag-handle--dragging': dragging,
        'nb-drag-handle--grabbed': grabbed,
      },
    ]"
    :aria-label="grabbed ? `${label}, picked up` : label"
    :aria-describedby="`${uid}-instructions`"
    :disabled="disabled"
    :draggable="native && !disabled ? 'true' : undefined"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @click="onClick"
    @keydown="onKeydown"
    @blur="onBlur"
    @dragstart="onNativeDragStart"
    @dragend="onNativeDragEnd"
  >
    <NbIcon
      v-if="axis === 'horizontal'"
      class="nb-drag-handle__glyph"
      name="dots-six"
      :size="size"
      aria-hidden="true"
    />
    <NbIcon
      v-else
      class="nb-drag-handle__glyph"
      name="dots-six-vertical"
      :size="size"
      aria-hidden="true"
    />
    <span :id="`${uid}-instructions`" class="nb-drag-handle__sr">
      {{ instructions }}
    </span>
    <span class="nb-drag-handle__sr" aria-live="polite">
      {{ announcement }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import NbIcon from './Icon.vue'
import { useStableId } from '@/composables/useStableId.composable'
import type {
  IDragHandleEvent,
  IDragHandleProps,
  TDragHandleDirection,
} from './DragHandle.d'

const props = withDefaults(defineProps<IDragHandleProps>(), {
  axis: 'vertical',
  size: 16,
  threshold: 4,
  native: false,
  instructions:
    'Press Space or Enter to pick up, arrow keys to move, Space or Enter to drop, Escape to cancel.',
  announcement: '',
  disabled: false,
})

/**
 * The handle reports the drag and owns none of it. Where a block may land,
 * what the drop indicator looks like and how the list reorders are the
 * host's, because a document editor, a table's rows and a table's columns all
 * answer those differently.
 */
const emit = defineEmits<{
  /** A pointer passed the threshold, a keyboard user picked up, or a native drag began. */
  'drag-start': [payload: IDragHandleEvent]
  /** The pointer moved, or a keyboard user pressed an arrow key while holding. */
  'drag-move': [payload: IDragHandleEvent]
  /** Released, dropped with Space or Enter, or focus left while holding. */
  'drag-end': [payload: IDragHandleEvent]
  /** Escape, a cancelled pointer, or `cancel()`. The host should undo any preview. */
  'drag-cancel': [payload: IDragHandleEvent]
}>()

const uid = useStableId({})
const handleRef = ref<HTMLButtonElement | null>(null)

/** A pointer drag is in progress (past the threshold). */
const dragging = ref(false)
/** A keyboard user has picked the item up. */
const grabbed = ref(false)

const GRABBING_CLASS = 'nb-drag-handle-grabbing'

// ── Pointer ───────────────────────────────────────────────────────────
//
// Pointer events rather than HTML drag and drop by default, for the reasons
// NbReorderList gives: they work on touch, and the host keeps control of the
// preview. `native` switches to drag and drop for hosts that need it.

let pointerId: number | null = null
let startX = 0
let startY = 0
/** Set when a press turned into a drag, so the click that follows is eaten. */
let suppressClick = false

function payload(
  via: IDragHandleEvent['via'],
  event: Event,
  extra: Partial<IDragHandleEvent> = {},
): IDragHandleEvent {
  return { via, deltaX: 0, deltaY: 0, event, ...extra }
}

function pointerPayload(event: PointerEvent): IDragHandleEvent {
  return payload('pointer', event, {
    clientX: event.clientX,
    clientY: event.clientY,
    deltaX: event.clientX - startX,
    deltaY: event.clientY - startY,
  })
}

function setDocumentGrabbing(on: boolean) {
  if (typeof document === 'undefined') return
  // The cursor has to be `grabbing` wherever the pointer goes, not only over
  // the handle it left behind, and text must not get selected on the way.
  document.documentElement.classList.toggle(GRABBING_CLASS, on)
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled || props.native || event.button !== 0) return
  if (grabbed.value) return
  pointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
  suppressClick = false
  // Capture keeps the moves coming when the pointer leaves the handle, which
  // it does immediately in any real drag.
  handleRef.value?.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return
  if (!dragging.value) {
    const distance = Math.hypot(event.clientX - startX, event.clientY - startY)
    if (distance < props.threshold) return
    dragging.value = true
    suppressClick = true
    setDocumentGrabbing(true)
    document.addEventListener('keydown', onDocumentKeydown, true)
    emit('drag-start', pointerPayload(event))
  }
  emit('drag-move', pointerPayload(event))
}

function endPointer() {
  if (pointerId !== null) {
    handleRef.value?.releasePointerCapture?.(pointerId)
  }
  pointerId = null
  dragging.value = false
  setDocumentGrabbing(false)
  document.removeEventListener('keydown', onDocumentKeydown, true)
}

function onPointerUp(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return
  const wasDragging = dragging.value
  const detail = pointerPayload(event)
  endPointer()
  if (wasDragging) emit('drag-end', detail)
}

function onPointerCancel(event: PointerEvent) {
  if (pointerId === null || event.pointerId !== pointerId) return
  const wasDragging = dragging.value
  const detail = pointerPayload(event)
  endPointer()
  if (wasDragging) emit('drag-cancel', detail)
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !dragging.value) return
  event.preventDefault()
  event.stopPropagation()
  const detail = payload('pointer', event)
  endPointer()
  emit('drag-cancel', detail)
}

function onClick(event: MouseEvent) {
  // A press that became a drag must not also count as a click, or a handle
  // that opens a block menu on click opens it at the end of every drag.
  if (suppressClick) {
    suppressClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
}

// ── Native drag and drop ──────────────────────────────────────────────

function onNativeDragStart(event: DragEvent) {
  if (!props.native || props.disabled) return
  dragging.value = true
  emit(
    'drag-start',
    payload('native', event, {
      clientX: event.clientX,
      clientY: event.clientY,
    }),
  )
}

function onNativeDragEnd(event: DragEvent) {
  if (!props.native || !dragging.value) return
  dragging.value = false
  const detail = payload('native', event, {
    clientX: event.clientX,
    clientY: event.clientY,
  })
  // `dropEffect` is `none` when the drag was abandoned or refused.
  if (event.dataTransfer?.dropEffect === 'none') emit('drag-cancel', detail)
  else emit('drag-end', detail)
}

// ── Keyboard ──────────────────────────────────────────────────────────
//
// Pick up, move, drop, the same model as NbReorderList. Arrow keys do nothing
// until the item is picked up, so a screen reader user can move past a
// handle without moving the thing it belongs to.

let stepsX = 0
let stepsY = 0

const KEY_DIRECTIONS: Record<string, TDragHandleDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled || dragging.value) return

  if (event.key === ' ' || event.key === 'Enter') {
    // Handled here rather than left to the native click, so a pick-up never
    // also fires the host's click handler. Firefox still synthesises a click
    // from Space on keyup, so the next click is eaten as well.
    event.preventDefault()
    suppressClick = true
    if (grabbed.value) {
      grabbed.value = false
      emit('drag-end', payload('keyboard', event, keyboardDeltas()))
    } else {
      grabbed.value = true
      stepsX = 0
      stepsY = 0
      emit('drag-start', payload('keyboard', event))
    }
    return
  }

  if (!grabbed.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    grabbed.value = false
    emit('drag-cancel', payload('keyboard', event, keyboardDeltas()))
    return
  }

  if (event.key === 'Tab') {
    // Tabbing away while holding drops, like a blur. Handled by onBlur.
    return
  }

  const direction = KEY_DIRECTIONS[event.key]
  if (!direction) return
  const vertical = direction === 'up' || direction === 'down'
  if (props.axis === 'vertical' && !vertical) return
  if (props.axis === 'horizontal' && vertical) return

  event.preventDefault()
  if (direction === 'up') stepsY -= 1
  if (direction === 'down') stepsY += 1
  if (direction === 'left') stepsX -= 1
  if (direction === 'right') stepsX += 1
  emit(
    'drag-move',
    payload('keyboard', event, { ...keyboardDeltas(), direction }),
  )
}

function keyboardDeltas() {
  return { deltaX: stepsX, deltaY: stepsY }
}

let pointerDownElsewhere = false

function onDocumentPointerDown() {
  pointerDownElsewhere = true
}

watch(grabbed, (value) => {
  if (typeof document === 'undefined') return
  if (value) {
    pointerDownElsewhere = false
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  }
})

/**
 * Leaving the handle while holding drops the item, as NbReorderList does: a
 * held item the user has tabbed away from is a trap, and there is nothing
 * left to cancel with.
 *
 * One exception. A host that reorders by moving DOM nodes moves the focused
 * handle too, and the browser drops focus from a node when it moves. That blur
 * is not the user leaving, so when focus went nowhere (no related target, no
 * click elsewhere) and the handle is still in the document, focus is put back
 * and the item stays held.
 */
function onBlur(event: FocusEvent) {
  if (!grabbed.value) return
  if (!event.relatedTarget && !pointerDownElsewhere) {
    requestAnimationFrame(() => {
      const handle = handleRef.value
      const active = document.activeElement
      // Focus already came back (the host restored it, or an earlier frame
      // did): nothing left to decide.
      if (active && active === handle) return
      if (
        grabbed.value &&
        handle?.isConnected &&
        (!active || active === document.body)
      ) {
        handle.focus({ preventScroll: true })
        return
      }
      if (grabbed.value) dropOnBlur(event)
    })
    return
  }
  dropOnBlur(event)
}

function dropOnBlur(event: FocusEvent) {
  grabbed.value = false
  emit('drag-end', payload('keyboard', event, keyboardDeltas()))
}

/** Cancels whatever drag is in progress, pointer or keyboard. */
function cancel() {
  const event = new Event('cancel')
  if (dragging.value) {
    const via = props.native ? 'native' : 'pointer'
    endPointer()
    emit('drag-cancel', payload(via, event))
  } else if (grabbed.value) {
    grabbed.value = false
    emit('drag-cancel', payload('keyboard', event, keyboardDeltas()))
  }
}

watch(
  () => props.disabled,
  (value) => {
    if (value) cancel()
  },
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  setDocumentGrabbing(false)
  document.removeEventListener('keydown', onDocumentKeydown, true)
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

defineExpose({ cancel, dragging, grabbed, el: handleRef })
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-drag-handle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: calc(var(--nb-base-unit) * 0.25);
  border: none;
  @include radius.standalone;
  background: transparent;
  color: var(--nb-c-text-subtle);
  cursor: grab;
  // Without this a touch drag scrolls the page instead of moving the item.
  touch-action: none;
  user-select: none;
  // Stops the browser starting its own drag of the glyph, which shows a ghost
  // image. A `native` handle sets `draggable` and gets the drag it asked for.
  -webkit-user-drag: none;
  transition:
    color var(--nb-animation-fast) ease,
    background-color var(--nb-animation-fast) ease;

  &:hover {
    color: var(--nb-c-text);
    background: var(--nb-c-surface-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
    color: var(--nb-c-text);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--nb-c-component-disabled);
    background: transparent;
  }
}

.nb-drag-handle[draggable='true'] {
  -webkit-user-drag: element;
}

.nb-drag-handle--dragging {
  cursor: grabbing;
  color: var(--nb-c-text);
}

// Picked up by keyboard: outlined in the primary colour, as NbReorderList
// marks a held row, because there is no pointer to show what is in hand.
.nb-drag-handle--grabbed {
  color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

.nb-drag-handle__glyph {
  pointer-events: none;
}

// Visually hidden, still announced.
.nb-drag-handle__sr {
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
  .nb-drag-handle {
    transition: none;
  }
}
</style>

<style lang="scss">
// Unscoped on purpose: set on <html> for the length of a pointer drag, so the
// cursor stays `grabbing` over whatever the pointer crosses.
html.nb-drag-handle-grabbing,
html.nb-drag-handle-grabbing * {
  cursor: grabbing !important;
  user-select: none !important;
}
</style>
