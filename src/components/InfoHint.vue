<template>
  <span class="nb-info-hint" :data-term="term || undefined">
    <button
      ref="triggerRef"
      type="button"
      class="nb-info-hint--trigger"
      :class="{ 'nb-info-hint--trigger-open': isOpen }"
      :aria-label="label ?? 'More information'"
      :aria-expanded="isOpen"
      :aria-describedby="isOpen ? popoverId : undefined"
      :disabled="disabled"
      @click.stop="onTriggerClick"
      @mousedown.stop
      @pointerdown.stop
      @keydown.stop="onTriggerKeydown"
      @mouseenter="onPointerEnter"
      @mouseleave="onPointerLeave"
      @focus="onFocus"
      @blur="onBlur"
    >
      <NbIcon :name="icon" :size="size" weight="regular" />
    </button>

    <Teleport :to="teleportTo">
      <div
        v-if="isOpen"
        :id="popoverId"
        ref="popoverRef"
        :class="[
          'nb-info-hint--popover',
          `nb-info-hint--popover-${placedSide}`,
        ]"
        v-bind="layerProps"
        role="tooltip"
        :style="popoverStyle"
        @click.stop
        @mousedown.stop
        @pointerdown.stop
        @mouseenter="onPointerEnter"
        @mouseleave="onPointerLeave"
      >
        <p v-if="title" class="nb-info-hint--title">{{ title }}</p>
        <div class="nb-info-hint--body">
          <slot>{{ text }}</slot>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import NbIcon from './Icon.vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import {
  placeAnchored,
  viewportSize,
  type TAnchorSide,
} from '@/utils/anchorPosition.helper'
import type { IInfoHintProps } from './InfoHint.d'

const props = withDefaults(defineProps<IInfoHintProps>(), {
  text: undefined,
  title: undefined,
  term: undefined,
  placement: 'top',
  size: 14,
  icon: 'info',
  label: undefined,
  openDelay: 120,
  closeDelay: 140,
  teleportTo: 'body',
  disabled: false,
})

const emit = defineEmits<{
  /** Popover became visible. */
  open: []
  /** Popover was dismissed. */
  close: []
  /**
   * The hint was deliberately activated (click / Enter / Space) rather than
   * merely hovered. Carries `term` so a host can open its glossary at the
   * matching entry.
   */
  activate: [term: string | undefined]
}>()

const popoverId = `${useStableId({})}-popover`

// The popover is teleported, so its DOM parent says nothing about depth. An
// overlay pins to the top layer and pushes anything slotted into it deeper
// from there, which is what keeps rich hint content on the right surface.
const { layerProps } = useSurfaceLayer({ overlay: true })

const triggerRef = ref<HTMLButtonElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

const isOpen = ref(false)
/**
 * A click (or Enter/Space) pins the popover open so it survives the pointer
 * leaving. This is what makes the hint usable on touch, where there is no
 * hover at all, and lets a keyboard user read a long description without
 * holding focus perfectly still.
 */
const isPinned = ref(false)
const placedSide = ref<TAnchorSide>(props.placement as TAnchorSide)
const position = ref({ top: 0, left: 0, arrowOffset: 50 })

let openTimer: ReturnType<typeof setTimeout> | undefined
let closeTimer: ReturnType<typeof setTimeout> | undefined

const popoverStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  '--nb-info-hint-arrow-offset': `${position.value.arrowOffset}%`,
}))

function clearTimers() {
  clearTimeout(openTimer)
  clearTimeout(closeTimer)
  openTimer = undefined
  closeTimer = undefined
}

function reposition() {
  const trigger = triggerRef.value
  const popover = popoverRef.value
  if (!trigger || !popover) return

  const anchor = trigger.getBoundingClientRect()
  const rect = popover.getBoundingClientRect()
  const placement = placeAnchored(
    anchor,
    { width: rect.width, height: rect.height },
    { side: props.placement as TAnchorSide, viewport: viewportSize() },
  )

  placedSide.value = placement.side
  position.value = {
    top: placement.top,
    left: placement.left,
    arrowOffset: placement.arrowOffset,
  }
}

function open() {
  if (props.disabled || isOpen.value) return
  clearTimers()
  isOpen.value = true
  emit('open')
  // Two frames: the first mounts the popover (zero-sized, unmeasurable), the
  // second has real dimensions to flip and clamp against.
  void nextTick(() => {
    reposition()
    requestAnimationFrame(reposition)
  })
}

function close() {
  if (!isOpen.value) return
  clearTimers()
  isOpen.value = false
  isPinned.value = false
  emit('close')
}

function onPointerEnter() {
  if (props.disabled) return
  clearTimeout(closeTimer)
  closeTimer = undefined
  if (isOpen.value) return
  openTimer = setTimeout(open, props.openDelay)
}

function onPointerLeave() {
  clearTimeout(openTimer)
  openTimer = undefined
  // A pinned popover is dismissed by click, Escape or outside-click, never by
  // the pointer wandering off: the user asked for it to stay.
  if (isPinned.value) return
  closeTimer = setTimeout(close, props.closeDelay)
}

/**
 * Clicks are swallowed (`@click.stop` in the template) so a hint can sit
 * inside a clickable card or table row without triggering the host's action.
 */
function onTriggerClick() {
  if (props.disabled) return
  if (isPinned.value) {
    close()
    return
  }
  isPinned.value = true
  open()
  emit('activate', props.term)
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isOpen.value) {
      event.preventDefault()
      close()
    }
    return
  }
  // Enter and Space are left to the browser: they synthesise a click on a
  // native button, which onTriggerClick already handles.
}

function onFocus() {
  if (props.disabled) return
  clearTimeout(closeTimer)
  closeTimer = undefined
  open()
}

function onBlur(event: FocusEvent) {
  // A pinned popover survives blur: clicking into the popover to read or
  // select its text moves focus off the button, and closing there would make
  // the content unreachable. Outside-click and Escape still dismiss it.
  if (isPinned.value) return
  const next = event.relatedTarget as Node | null
  if (next && popoverRef.value?.contains(next)) return
  close()
}

function onDocumentPointerDown(event: PointerEvent | MouseEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (triggerRef.value?.contains(target)) return
  if (popoverRef.value?.contains(target)) return
  close()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

// Listeners exist only while the popover does. A hint is a leaf that can be
// rendered hundreds of times in a table, so an always-on document listener per
// instance would be a real cost.
watch(isOpen, (value) => {
  if (typeof document === 'undefined') return
  if (value) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    document.addEventListener('keydown', onDocumentKeydown)
    window.addEventListener('resize', reposition)
    // capture: true also catches scrolls in nested containers, which is where
    // a hint inside a scrolling table would otherwise drift off its anchor.
    window.addEventListener('scroll', reposition, true)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
    document.removeEventListener('keydown', onDocumentKeydown)
    window.removeEventListener('resize', reposition)
    window.removeEventListener('scroll', reposition, true)
  }
})

watch(
  () => props.disabled,
  (value) => {
    if (value) close()
  },
)

onBeforeUnmount(() => {
  clearTimers()
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  document.removeEventListener('keydown', onDocumentKeydown)
  window.removeEventListener('resize', reposition)
  window.removeEventListener('scroll', reposition, true)
})

defineExpose({ open, close, isOpen })
</script>

<style scoped lang="scss">
.nb-info-hint {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.nb-info-hint--trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--nb-c-text-subtle);
  cursor: help;
  border-radius: var(--nb-radius-pill);
  transition: color var(--nb-animation-fast) ease;

  &:hover,
  &.nb-info-hint--trigger-open {
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
    color: var(--nb-c-text);
  }

  &:disabled {
    cursor: default;
    color: var(--nb-c-component-disabled);
  }
}

.nb-info-hint--popover {
  // --nb-c-surface / --nb-c-border come from the nb-layer-* class that
  // useSurfaceLayer binds, so this reads them rather than naming a depth.
  position: fixed;
  z-index: var(--nb-zindex-tooltip);
  max-width: calc(var(--nb-base-unit) * 34); // 272px
  padding: calc(var(--nb-base-unit) * 1.25) calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
  text-align: left;

  animation: nb-info-hint-in var(--nb-animation-fast) ease-out;
}

.nb-info-hint--title {
  margin: 0 0 calc(var(--nb-base-unit) * 0.5);
  font-family: var(--nb-type-label-md-family);
  font-size: var(--nb-type-label-md-size);
  font-weight: var(--nb-type-label-md-weight);
  line-height: var(--nb-type-label-md-line-height);
  color: var(--nb-c-text);
}

.nb-info-hint--body {
  font-family: var(--nb-type-body-sm-family);
  font-size: var(--nb-type-body-sm-size);
  font-weight: var(--nb-type-body-sm-weight);
  line-height: var(--nb-type-body-sm-line-height);
  color: var(--nb-c-text-muted);

  :deep(p) {
    margin: 0 0 calc(var(--nb-base-unit) * 0.5);

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(code) {
    font-family: var(--nb-font-family-mono);
    font-size: var(--nb-font-size-11);
  }
}

// Arrow: a rotated square clipped by the popover edge. Two pseudo-elements
// would be needed for a bordered triangle; a rotated square inherits the
// border and background tokens for free.
.nb-info-hint--popover::after {
  content: '';
  position: absolute;
  width: var(--nb-base-unit);
  height: var(--nb-base-unit);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  transform: rotate(45deg);
}

.nb-info-hint--popover-top::after {
  bottom: calc(var(--nb-base-unit) / -2 - 1px);
  left: var(--nb-info-hint-arrow-offset, 50%);
  margin-left: calc(var(--nb-base-unit) / -2);
  border-top: none;
  border-left: none;
}

.nb-info-hint--popover-bottom::after {
  top: calc(var(--nb-base-unit) / -2 - 1px);
  left: var(--nb-info-hint-arrow-offset, 50%);
  margin-left: calc(var(--nb-base-unit) / -2);
  border-bottom: none;
  border-right: none;
}

.nb-info-hint--popover-left::after {
  right: calc(var(--nb-base-unit) / -2 - 1px);
  top: var(--nb-info-hint-arrow-offset, 50%);
  margin-top: calc(var(--nb-base-unit) / -2);
  border-bottom: none;
  border-left: none;
}

.nb-info-hint--popover-right::after {
  left: calc(var(--nb-base-unit) / -2 - 1px);
  top: var(--nb-info-hint-arrow-offset, 50%);
  margin-top: calc(var(--nb-base-unit) / -2);
  border-top: none;
  border-right: none;
}

@keyframes nb-info-hint-in {
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
  .nb-info-hint--popover {
    animation: none;
  }

  .nb-info-hint--trigger {
    transition: none;
  }
}
</style>
