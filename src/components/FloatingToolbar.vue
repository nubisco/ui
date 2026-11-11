<template>
  <Teleport :to="teleportTo">
    <div
      v-if="open && anchor"
      ref="toolbarRef"
      :class="[
        'nb-floating-toolbar',
        `nb-floating-toolbar--${placedSide}`,
        `nb-floating-toolbar--${orientation}`,
        {
          'nb-floating-toolbar--anchor-hidden': anchorHidden && !docked,
          'nb-floating-toolbar--docked': docked,
        },
      ]"
      v-bind="layerProps"
      role="toolbar"
      :aria-label="label"
      :aria-orientation="orientation"
      :style="docked ? undefined : toolbarStyle"
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
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { useVisualViewportVar } from '@/composables/useVisualViewportVar.composable'
import { useRovingFocus } from '@/composables/useRovingFocus.composable'
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
  dock: 'none',
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
// the WAI-ARIA toolbar pattern, shared with NbToolbar. Fields join the set
// here: a formatting bar's link field is one of its tools.

const roving = useRovingFocus(toolbarRef, {
  orientation: () => props.orientation,
  includeFields: true,
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
    emit('update:open', false)
    return
  }
  roving.onKeydown(event)
}

const onFocusIn = roving.onFocusIn

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
const focus = roving.focus

// ── Lifecycle ────────────────────────────────────────────────────────

// The roving focus watches the toolbar's own controls coming and going (a
// link button only for links), so only the page listeners live here.
function attach() {
  window.addEventListener('resize', reposition)
  // capture: true also catches scrolls in nested containers, which is where
  // an editor usually scrolls.
  window.addEventListener('scroll', reposition, true)
}

function detach() {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', reposition)
  window.removeEventListener('scroll', reposition, true)
}

const visible = computed(() => props.open && !!props.anchor)

/*
 * dock="phone": on a phone the toolbar leaves the selection and becomes a bar
 * across the bottom of the visible viewport, on top of the keyboard. A
 * toolbar floated over a selection on a phone covers the line being edited,
 * fights the system's own selection menu and is half off a narrow screen.
 *
 * Positioning keeps running underneath, it is just not bound, so leaving the
 * phone layout puts the toolbar straight back on its anchor. The anchor-hidden
 * rule does not apply to the bar: it is the editor's toolbar while docked,
 * and hiding it whenever the selection scrolls under the keyboard would only
 * make it flicker.
 */
const { phone } = usePhoneLayout()
const docked = computed(() => props.dock === 'phone' && phone.value)
useVisualViewportVar(() => visible.value && props.dock === 'phone')

watch(
  visible,
  (value) => {
    if (typeof window === 'undefined') return
    detach()
    if (!value) return
    roving.activeIndex.value = 0
    // Two frames: the first mounts the toolbar (zero-sized, unmeasurable),
    // the second has real dimensions to flip and clamp against. Focus is
    // deliberately left where it is.
    void nextTick(() => {
      attach()
      roving.sync()
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
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

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

  animation: nb-floating-toolbar-in var(--nb-motion-medium) var(--nb-ease-enter);
}

.nb-floating-toolbar--vertical {
  flex-direction: column;
  align-items: stretch;
}

.nb-floating-toolbar--anchor-hidden {
  visibility: hidden;
}

// The class is only set in the phone layout. The media query repeats the
// gate so that no rule here can ever reach a desktop.
@include bp.phone {
  .nb-floating-toolbar--docked {
    inset-inline: 0;
    top: auto;
    // The bottom of the visible viewport, which is the top of the keyboard
    // while one is up. Without the visual viewport properties it is the
    // screen's bottom edge.
    bottom: max(0px, calc(100% - var(--nb-vvt, 0px) - var(--nb-vvh, 100%)));
    border-inline: 0;
    border-bottom: 0;
    border-radius: 0;
    padding-bottom: calc(
      var(--nb-base-unit) * 0.5 + env(safe-area-inset-bottom)
    );
    // More controls than fit scroll sideways rather than wrap or clip.
    overflow-x: auto;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    // A full-width bar growing out of a point reads as a glitch.
    animation: none;

    > :deep(*) {
      flex-shrink: 0;
    }

    :deep(button),
    :deep([role='button']) {
      min-block-size: 44px;
      min-inline-size: 44px;
    }
  }
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

// Reduced motion drops the scale and keeps the fade: the toolbar still
// arrives, it just does not grow.
@include motion.reduced {
  .nb-floating-toolbar {
    animation-name: nb-floating-toolbar-fade;
  }
}

@keyframes nb-floating-toolbar-fade {
  from {
    opacity: 0;
  }
}
</style>
