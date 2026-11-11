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
          <!-- Carbon's footer: xl buttons that bleed to the dialog's edges,
               the secondary on the left and the primary on the right, which
               NbButtonSet places whatever order the slot is written in. -->
          <footer v-if="$slots.footer" class="nb-modal--footer">
            <NbButtonSet
              fluid
              size="xl"
              focus-order="rank"
              align="end"
              class="nb-modal--actions"
            >
              <slot name="footer" />
            </NbButtonSet>
          </footer>
          <!-- The close control is drawn in the top right corner and written
               last, so the tab order is Carbon's: the body, the primary, the
               secondary, and then the close. A form's first field, or the
               primary of a dialog without one, is where focus lands on open,
               not the way out. -->
          <NbCloseButton
            v-if="hasHeader"
            class="nb-modal--close"
            size="lg"
            :label="nbStrings.modalClose"
            :disabled="closeDisabled"
            :aria-disabled="closeDisabled ? 'true' : undefined"
            @click="emit('close')"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useNbStrings } from '@/composables/useNbStrings.composable'
import NbButtonSet from './ButtonSet.vue'
import NbCloseButton from './CloseButton.vue'
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
import {
  focusablesWithin,
  useFocusTrap,
} from '@/composables/useFocusTrap.composable'
import { useVisualViewportVar } from '@/composables/useVisualViewportVar.composable'
import { floatingSelector } from './Confirm.env'
import type { IModalProps } from './Modal.d'

const nbStrings = useNbStrings()

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
  closeAppearance: 'corner',
  closeOnEscape: true,
  trapFocus: true,
  floatingSelectors: undefined,
  initialFocus: undefined,
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

/**
 * The dialog holds keyboard focus for as long as it is open.
 *
 * The scrim makes the page behind unavailable to the eye but does nothing to
 * the tab order, so without this Tab walks out of the dialog and onto the
 * document underneath: this component's own showcase reproduced it in one
 * keypress while the page above it promised a focus trap.
 *
 * A wrapper that runs its own trap (NbConfirm, which has extra rules for its
 * pending state and its type-to-confirm gate) switches this off by prop rather
 * than having two traps pull focus in opposite directions.
 *
 * The floating list is shared with NbConfirm so that a teleported NbSelect
 * list opened from inside a dialog counts as inside it under both.
 */
function resolveInitialFocus(): HTMLElement | null {
  const target = props.initialFocus
  if (!target) return safeFirstStop()
  if (typeof target === 'function') return target()
  return contentRef.value?.querySelector<HTMLElement>(target) ?? null
}

/**
 * The default landing, which is the first tab stop with one exception.
 *
 * The footer's primary comes before its secondary in the tab order, so a
 * dialog with no fields opens on its primary, as Carbon's does. When that
 * primary is a filled danger button, Carbon puts first focus on Cancel
 * instead: a destructive default one Space away from a stray keypress is the
 * one landing a dialog must never pick. So the danger button is stepped over
 * to the next stop, which in a footer is the secondary.
 */
function safeFirstStop(): HTMLElement | null {
  const stops = focusablesWithin(contentRef.value)
  const first = stops[0]
  if (!first?.classList.contains('nb-button--danger')) return null
  if (first.classList.contains('nb-button--outlined')) return null
  return stops[1] ?? null
}

useFocusTrap({
  container: () => contentRef.value,
  active: () => props.open && props.trapFocus,
  initialFocus: resolveInitialFocus,
  floatingSelector: () => floatingSelector(props.floatingSelectors),
})

// On a phone the dialog is a sheet sized to the visible part of the page, so
// it follows the on-screen keyboard instead of hiding its footer behind it.
// The share is held only while open and only in the phone layout.
useVisualViewportVar(() => props.open)

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
  // A dropdown, menu or field inside the dialog that spent this Escape
  // closing itself has prevented it, and the press is not also the dialog's.
  if (e.defaultPrevented) return
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
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

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
  // The containing block for the close button in its corner.
  position: relative;
  background: var(--nb-c-surface);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  display: flex;
  flex-direction: column;
  // The dialog clips its own header and footer to its corner. Without this a
  // rounded dialog shows square header corners poking past the arc.
  overflow: hidden;
  // Teleported to <body>: it takes the appearance from the document and is
  // the outer surface of everything inside it.
  @include radius.surface(modal);
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
  flex-shrink: 0;
}

.nb-modal--title {
  padding: 16px 20px;
  // Clear of the close button, which sits over the header's end.
  padding-inline-end: calc(
    var(--nb-base-unit) * 6 + var(--nb-overlay-inset, 0px)
  );
  font-size: var(--nb-type-heading-01-size);
  font-weight: var(--nb-type-heading-01-weight);
  line-height: var(--nb-type-heading-01-line-height);
  letter-spacing: var(--nb-type-heading-01-letter-spacing);
  color: var(--nb-c-text);
}

/*
 * NbCloseButton at lg, 48px, Carbon's close for a dialog. Written last in the
 * DOM for the tab order and placed in the top right corner here. It is inset
 * from the corner by the overlay inset rather than flush in it: flush was
 * tolerable while every corner was square, and against a rounded corner the
 * button's hover and focus rectangle cuts across the arc.
 */
.nb-modal--close {
  position: absolute;
  inset-block-start: var(--nb-overlay-inset, 0px);
  inset-inline-end: var(--nb-overlay-inset, 0px);
  z-index: 1;
}

.nb-modal--body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: var(--nb-c-text);
}

/*
 * Carbon's footer. The buttons are xl (64px), bleed to the dialog's edges and
 * have square corners even under the rounded appearance: they are the bottom
 * edge of the dialog, not buttons placed on it, and the dialog's own corner
 * clips the outer two. One button spans the right half. Two share the row.
 * Three are a quarter each, gathered on the right, with the left quarter
 * left empty: Carbon's "each is 25% of the modal width and aligned to the
 * right side".
 */
.nb-modal--footer {
  flex-shrink: 0;
}

.nb-modal--footer .nb-modal--actions {
  :deep(> .nb-button) {
    border-radius: 0;
  }

  // One button: the right half. The row runs from the right, so it is the
  // first (and only) item that is capped.
  :deep(> :only-child) {
    flex: 0 0 50%;
  }

  // Three buttons: a quarter each, on the right.
  :deep(> :first-child:nth-last-child(3)),
  :deep(> :first-child:nth-last-child(3) ~ *) {
    flex: 0 0 25%;
  }
}

/* Transitions.
 *
 * One event, one timing: the scrim and the dialog share a duration and a
 * curve in each direction, so the whole thing reads as one surface. The
 * entrance settles (enter curve, medium); the exit commits (exit curve,
 * short): a dialog that leaves as slowly as it arrived looks as if it changed
 * its mind. */
@include motion.dialog(nb-modal, '.nb-modal--content');

// The phone layout. A centred box with a 20px margin wastes a third of a
// phone's width and puts the actions out of the thumb's reach, so the dialog
// comes up from the bottom edge instead: `sm` (confirmations, short forms) as
// a sheet as tall as its content, every larger size as a full screen.
//
// Heights come from the visual viewport (useVisualViewportVar), not from the
// overlay's inset: 0, because the layout viewport keeps its height when the
// keyboard opens and the footer would sit under the keys. The overlay itself
// is moved onto the visible box, so `flex-end` means "just above the
// keyboard".
@include bp.phone {
  .nb-modal--overlay {
    padding: 0;
    align-items: flex-end;
    inset: var(--nb-vvt, 0px) 0 auto;
    height: var(--nb-vvh, 100dvh);
  }

  .nb-modal--content--sm {
    max-width: 100%;
    max-height: var(--nb-vvh, 100dvh);
    // Square where the sheet meets the screen edge, rounded where it meets
    // the page.
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  .nb-modal--content--md,
  .nb-modal--content--lg,
  .nb-modal--content--xl,
  .nb-modal--content--immersive {
    max-width: 100%;
    height: var(--nb-vvh, 100dvh);
    max-height: var(--nb-vvh, 100dvh);
    // Full screen has no corners, and the close control's highlight follows.
    @include radius.surface(null, 0px);
    // Clear of the status bar when the page draws under it (viewport-fit=cover).
    // Zero everywhere else. Inside the height, not added to it.
    box-sizing: border-box;
    padding-top: env(safe-area-inset-top);
  }

  // The footer is the last thing on the screen, so it clears the home
  // indicator. The header and footer already never shrink, so they stay put
  // while the body scrolls between them.
  .nb-modal--footer {
    padding-bottom: env(safe-area-inset-bottom);
  }

  // A sheet slides up from the edge it belongs to. The scrim still fades.
  .nb-modal-enter-from,
  .nb-modal-leave-to {
    .nb-modal--content {
      transform: translateY(100%);
      opacity: 1;
    }
  }
}

// Without motion the sheet only fades, like the scrim: the fade is the
// feedback, the travel was the decoration. The mixin's own reduced rule
// comes before the phone layout above, so the sheet is cancelled here.
@include motion.reduced {
  .nb-modal-enter-from,
  .nb-modal-leave-to {
    .nb-modal--content {
      transform: none;
      opacity: 0;
    }
  }
}
</style>
