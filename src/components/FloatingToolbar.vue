<template>
  <Teleport :to="teleportTo">
    <div
      v-if="open && anchor"
      ref="toolbarRef"
      :class="[
        'nb-floating-toolbar',
        `nb-floating-toolbar--${placedSide}`,
        `nb-floating-toolbar--${orientation}`,
        { 'nb-floating-toolbar--anchor-hidden': anchorHidden },
      ]"
      v-bind="layerProps"
      role="toolbar"
      :aria-label="label"
      :aria-orientation="orientation"
      :style="toolbarStyle"
      @mousedown="onMouseDown"
      @keydown="onKeydown"
      @focusin="onFocusIn"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import {
  placeAnchored,
  viewportSize,
  type IAnchorRect,
  type TAnchorSide,
} from '@/utils/anchorPosition.helper'
import type {
  IFloatingToolbarProps,
  TFloatingToolbarAnchor,
} from './FloatingToolbar.d'

const props = withDefaults(defineProps<IFloatingToolbarProps>(), {
  open: false,
  anchor: null,
  placement: 'top',
  gap: 8,
  orientation: 'horizontal',
  teleportTo: 'body',
})

const emit = defineEmits<{
  /** Escape was pressed inside the toolbar. The host decides what closes. */
  close: []
  'update:open': [value: boolean]
}>()

// Teleported, so its DOM parent says nothing about depth. Same as NbInfoHint:
// an overlay pins to the top layer.
const { layerProps } = useSurfaceLayer({ overlay: true })

const toolbarRef = ref<HTMLElement | null>(null)
const placedSide = ref<TAnchorSide>(props.placement as TAnchorSide)
const position = ref({ top: 0, left: 0 })
const anchorHidden = ref(false)
/** Index of the control that holds the toolbar's single tab stop. */
const activeIndex = ref(0)

const toolbarStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
}))

function readAnchor(anchor: TFloatingToolbarAnchor): IAnchorRect {
  // Re-read on every call rather than cached: an element or a virtual anchor
  // is live, and reading it here is what keeps the toolbar on a selection
  // while the page scrolls underneath it.
  if ('getBoundingClientRect' in anchor) return anchor.getBoundingClientRect()
  return anchor
}

function reposition() {
  const toolbar = toolbarRef.value
  if (!toolbar || !props.anchor) return

  const anchor = readAnchor(props.anchor)
  const viewport = viewportSize()
  // An anchor scrolled right out of view would otherwise leave the toolbar
  // clamped to the viewport edge, acting on text nobody can see.
  anchorHidden.value =
    viewport.width > 0 &&
    viewport.height > 0 &&
    (anchor.top + anchor.height < 0 ||
      anchor.top > viewport.height ||
      anchor.left + anchor.width < 0 ||
      anchor.left > viewport.width)

  // Layout size, not getBoundingClientRect: the entrance animation scales the
  // toolbar to 0.96, and a transformed rectangle measured on the first frame
  // left the toolbar about 2px off centre for good (measured in Chromium).
  const size = { width: toolbar.offsetWidth, height: toolbar.offsetHeight }
  const placement = placeAnchored(anchor, size, {
    side: props.placement as TAnchorSide,
    gap: props.gap,
    viewport,
  })
  placedSide.value = placement.side
  position.value = { top: placement.top, left: placement.left }
}

// ── Roving tabindex ──────────────────────────────────────────────────
//
// The toolbar is one tab stop. Arrow keys move between its controls, which is
// the WAI-ARIA toolbar pattern, and what stops a twelve-button formatting bar
// from costing twelve presses of Tab.

const FOCUSABLE =
  'button, [role="button"], a[href], input, select, textarea, [tabindex]'

function items(): HTMLElement[] {
  const toolbar = toolbarRef.value
  if (!toolbar) return []
  return Array.from(toolbar.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      !(el as HTMLButtonElement).disabled &&
      el.getAttribute('aria-hidden') !== 'true' &&
      // A nested composite (a select's listbox) manages its own focus.
      el.closest('[role="toolbar"]') === toolbar,
  )
}

function syncTabStops() {
  const list = items()
  if (!list.length) return
  if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
  if (activeIndex.value < 0) activeIndex.value = 0
  list.forEach((el, index) => {
    const value = index === activeIndex.value ? '0' : '-1'
    if (el.getAttribute('tabindex') !== value)
      el.setAttribute('tabindex', value)
  })
}

function focusIndex(index: number) {
  const list = items()
  if (!list.length) return
  activeIndex.value = (index + list.length) % list.length
  syncTabStops()
  list[activeIndex.value].focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
    emit('update:open', false)
    return
  }

  const target = event.target as HTMLElement
  // Arrow keys inside a text field move the caret, not the toolbar.
  if (target.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }

  const vertical = props.orientation === 'vertical'
  const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
  const next = vertical ? 'ArrowDown' : 'ArrowRight'

  const list = items()
  const current = list.indexOf(target)
  if (current === -1) return

  if (event.key === next) {
    event.preventDefault()
    focusIndex(current + 1)
  } else if (event.key === previous) {
    event.preventDefault()
    focusIndex(current - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusIndex(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusIndex(list.length - 1)
  }
}

function onFocusIn(event: FocusEvent) {
  const index = items().indexOf(event.target as HTMLElement)
  if (index === -1) return
  activeIndex.value = index
  syncTabStops()
}

/**
 * The toolbar must never take focus from what it acts on. A mousedown on a
 * button focuses the button, which blurs the editor, and an editor that loses
 * focus collapses or forgets the selection the button was about to format.
 * Cancelling the mousedown keeps focus where it was while the click still
 * fires. Text fields are left alone, because they genuinely need focus.
 */
function onMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
    return
  }
  event.preventDefault()
}

/** Moves keyboard focus into the toolbar, onto its current tab stop. */
function focus() {
  focusIndex(activeIndex.value)
}

// ── Lifecycle ────────────────────────────────────────────────────────

let observer: MutationObserver | undefined

function attach() {
  window.addEventListener('resize', reposition)
  // capture: true also catches scrolls in nested containers, which is where
  // an editor usually scrolls.
  window.addEventListener('scroll', reposition, true)
  if (typeof MutationObserver !== 'undefined' && toolbarRef.value) {
    // Buttons come and go with the selection (a link button only for links),
    // and a disabled one cannot hold the tab stop.
    observer = new MutationObserver(() => syncTabStops())
    observer.observe(toolbarRef.value, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled'],
    })
  }
}

function detach() {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', reposition)
  window.removeEventListener('scroll', reposition, true)
  observer?.disconnect()
  observer = undefined
}

const visible = computed(() => props.open && !!props.anchor)

watch(
  visible,
  (value) => {
    if (typeof window === 'undefined') return
    detach()
    if (!value) return
    activeIndex.value = 0
    // Two frames: the first mounts the toolbar (zero-sized, unmeasurable),
    // the second has real dimensions to flip and clamp against. Focus is
    // deliberately left where it is.
    void nextTick(() => {
      attach()
      syncTabStops()
      reposition()
      requestAnimationFrame(reposition)
    })
  },
  { immediate: true },
)

watch(
  () => [props.anchor, props.placement, props.gap],
  () => {
    if (visible.value) void nextTick(reposition)
  },
)

onBeforeUnmount(detach)

defineExpose({ reposition, focus, el: toolbarRef })
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-floating-toolbar {
  // --nb-c-surface / --nb-c-border come from the nb-layer-* class that
  // useSurfaceLayer binds, so this reads them rather than naming a depth.
  position: fixed;
  z-index: var(--nb-zindex-menu);
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 0.5);
  padding: calc(var(--nb-base-unit) * 0.5);
  border: 1px solid var(--nb-c-border);
  @include radius.surface(popover);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
  white-space: nowrap;

  animation: nb-floating-toolbar-in var(--nb-animation-fast) ease-out;
}

.nb-floating-toolbar--vertical {
  flex-direction: column;
  align-items: stretch;
}

.nb-floating-toolbar--anchor-hidden {
  visibility: hidden;
}

@keyframes nb-floating-toolbar-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-floating-toolbar {
    animation: none;
  }
}
</style>
