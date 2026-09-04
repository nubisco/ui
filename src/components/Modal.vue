<template>
  <Teleport to="body">
    <Transition name="nb-modal">
      <div v-if="open" class="nb-modal--overlay" @click.self="onOverlayClick">
        <div
          ref="contentRef"
          :class="['nb-modal--content', `nb-modal--content--${size}`]"
          v-bind="layerProps"
          :role="role"
          aria-modal="true"
          :aria-labelledby="labelledBy ?? (hasHeader ? titleId : undefined)"
          :aria-describedby="describedBy"
          :aria-busy="busy ? 'true' : undefined"
          tabindex="-1"
          @click.stop
        >
          <header v-if="hasHeader" class="nb-modal--header">
            <span :id="titleId" class="nb-modal--title">
              <slot name="header">{{ title }}</slot>
            </span>
            <button
              class="nb-modal--close"
              aria-label="Close"
              :disabled="closeDisabled"
              :aria-disabled="closeDisabled ? 'true' : undefined"
              @click="emit('close')"
            >
              <NbIcon name="x" />
            </button>
          </header>
          <main
            ref="bodyRef"
            class="nb-modal--body"
            :tabindex="scrollable ? 0 : undefined"
            :role="scrollable ? 'region' : undefined"
            :aria-labelledby="
              scrollable
                ? (labelledBy ?? (hasHeader ? titleId : undefined))
                : undefined
            "
          >
            <slot />
          </main>
          <NbGrid
            is="footer"
            v-if="$slots.footer"
            justify="end"
            class="nb-modal--footer"
            distributed
          >
            <slot name="footer" />
          </NbGrid>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue'
import { ESizeShort } from '@/types/Size.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import {
  acquireScrollLock,
  releaseScrollLock,
} from '@/composables/useScrollLock.composable'
import type { IModalProps } from './Modal.d'

const props = withDefaults(defineProps<IModalProps>(), {
  title: undefined,
  open: false,
  size: ESizeShort.Medium,
  closeOnOverlay: true,
  role: 'dialog',
  labelledBy: undefined,
  describedBy: undefined,
  busy: false,
  closeDisabled: false,
  closeOnEscape: true,
})

const emit = defineEmits<{ close: [] }>()

const slots = useSlots()
const hasHeader = computed(() => !!slots.header || !!props.title)

const titleId = `nb-modal-title-${useId()}`
const contentRef = ref<HTMLElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)

// The dialog is teleported to the document body, so its DOM parent says nothing
// about depth. An overlay pins to the top layer and pushes its own content
// deeper from there.
const { layerProps } = useSurfaceLayer({ overlay: true })

function onOverlayClick() {
  if (props.closeOnOverlay) emit('close')
}

// This instance's share of the counted page-scroll lock.
let locked = false

function lockScroll() {
  if (locked) return
  locked = true
  acquireScrollLock()
}

function unlockScroll() {
  if (!locked) return
  locked = false
  releaseScrollLock()
}

/**
 * A body long enough to scroll has to be reachable by keyboard, so it is
 * marked `role="region"` with `tabindex="0"` only while it actually
 * overflows: a two-line dialog does not grow a stop in its tab order for
 * nothing.
 *
 * Overflow is not a property of the moment the dialog opened. The viewport
 * resizes, slot content arrives from a fetch, and a translated string is
 * longer than the English one, so the decision is driven by observers rather
 * than computed once. Entering the state uses a small dead zone and leaving
 * it demands a genuine fit, so a pixel of rounding cannot flicker the region
 * in and out of the tab order.
 */
const scrollable = ref(false)

function measure() {
  const body = bodyRef.value
  if (!body) return
  const overflow = body.scrollHeight - body.clientHeight
  if (!scrollable.value && overflow > 4) scrollable.value = true
  else if (scrollable.value && overflow <= 0) scrollable.value = false
}

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

function observeBody() {
  const body = bodyRef.value
  if (!body) return
  // Opening runs this from the watcher and again from onMounted on the first
  // frame, so the previous pair is disconnected rather than leaked.
  stopObserving()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(body)
  }
  // The box can keep its size while its contents grow past it, which is
  // exactly the case a ResizeObserver on the box cannot see.
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => measure())
    mutationObserver.observe(body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
  measure()
}

function stopObserving() {
  resizeObserver?.disconnect()
  resizeObserver = null
  mutationObserver?.disconnect()
  mutationObserver = null
}

watch(
  () => props.open,
  async (val) => {
    if (val) lockScroll()
    else unlockScroll()
    await nextTick()
    if (val) observeBody()
    else {
      stopObserving()
      scrollable.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  unlockScroll()
  stopObserving()
})

/**
 * Escape closes the topmost dialog only. Every instance listens on the
 * document, so without this test a stack of two modals answered one keypress
 * twice and the user lost both. "Topmost" is the last `aria-modal` element in
 * document order, which is the paint order of teleported overlays.
 */
function isTopmost(): boolean {
  const el = contentRef.value
  if (!el) return false
  const all = Array.from(
    document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
  )
  return all.length === 0 || all[all.length - 1] === el
}

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (!props.open || !props.closeOnEscape || props.closeDisabled) return
  if (!isTopmost()) return
  emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  if (props.open) observeBody()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({ dialogEl: () => contentRef.value, bodyEl: () => bodyRef.value })
</script>

<style scoped lang="scss">
@use 'sass:list';

// The margin the dialog keeps from the viewport edge at every size. It is the
// overlay's padding, and the immersive cap subtracts it, so the two cannot
// drift apart.
$modal-margin: 20px;

.nb-modal--overlay {
  position: fixed;
  inset: 0;
  background: var(--nb-c-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--nb-zindex-modal);
  padding: $modal-margin;
}

.nb-modal--content {
  background: var(--nb-c-surface);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  --parent-radius: 8px;
}

// Size caps for both dimensions: height stays content-driven up to the cap
// (percentages resolve against the padded overlay). Ratios follow Carbon.
$modal-sizes: (
  sm: (
    520px,
    72%,
  ),
  md: (
    720px,
    84%,
  ),
  lg: (
    960px,
    96%,
  ),
  xl: (
    1280px,
    98%,
  ),
  immersive: (
    1600px,
    100%,
  ),
);

// The caps need no viewport arithmetic of their own: the content box is
// width: 100% inside an overlay that is inset: 0 with its own padding, so a
// max-width of 1600px already resolves to min(1600px, viewport - margin), and
// the percentage heights resolve against that same padded box. Every size
// therefore collapses toward full width on a small viewport, keeps its
// margins, and never overflows.
@each $name, $dims in $modal-sizes {
  .nb-modal--content--#{$name} {
    max-width: list.nth($dims, 1);
    max-height: list.nth($dims, 2);
  }
}

// Mobile browsers size a fixed inset: 0 box to the layout viewport, which the
// address bar can overhang. The tallest size is the only one that ever reaches
// that edge, so it alone also caps against the dynamic viewport. Identical to
// 100% on desktop.
.nb-modal--content--immersive {
  max-height: min(100%, calc(100dvh - #{$modal-margin * 2}));
}

.nb-modal--header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.nb-modal--title {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--nb-c-text);
}

.nb-modal--close {
  width: calc(var(--nb-base-unit) * 7);
  height: calc(var(--nb-base-unit) * 7);
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--nb-c-bg-soft);
    color: var(--nb-c-text);
  }
}

.nb-modal--body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: var(--nb-c-text);
}

.nb-modal--footer {
  flex-shrink: 0;

  :deep(> :only-child) {
    max-width: 50%;
  }
}

/* Transitions */
.nb-modal-enter-active,
.nb-modal-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
  .nb-modal--content {
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
}
.nb-modal-enter-from {
  opacity: 0;
  .nb-modal--content {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
.nb-modal-leave-to {
  opacity: 0;
  .nb-modal--content {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
</style>
