<template>
  <Teleport to="body" :disabled="!isPageOverlay">
    <div
      v-if="visible"
      v-bind="$attrs"
      :id="elementId"
      ref="rootEl"
      :class="rootClasses"
      :tabindex="isPageOverlay ? -1 : undefined"
      :role="announces ? 'status' : undefined"
      :aria-live="announces ? 'polite' : undefined"
      :aria-hidden="isDecorative ? 'true' : undefined"
    >
      <svg
        class="nb-spinner__ring"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <circle class="nb-spinner__track" cx="16" cy="16" r="14" />
        <circle class="nb-spinner__arc" cx="16" cy="16" r="14" />
      </svg>

      <!-- The visible text and the announced text are two different nodes on
           purpose. The visible one is aria-hidden, so it is never read twice;
           the announced one is the live region's content and starts empty. -->
      <span
        v-if="showLabel && !isDecorative"
        class="nb-spinner__label"
        aria-hidden="true"
        >{{ label }}</span
      >

      <span v-if="announces" class="nb-spinner__announcement">{{
        announced
      }}</span>

      <!-- A way out of a long block. The overlay subtree is the one thing a
           page overlay does not inert, so a button placed here is reachable
           while everything behind the scrim is not. `aria-live="off"` keeps it
           out of the status region the root declares: a cancel button is a
           control, not part of the sentence being announced. -->
      <div
        v-if="$slots.default"
        class="nb-spinner__actions"
        aria-live="off"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useReducedMotion } from '@/composables/useReducedMotion.composable'
import {
  ESpinnerOverlay,
  ESpinnerSize,
  ESpinnerTone,
  ISpinnerProps,
} from './Spinner.d'
import {
  claimPageOverlay,
  containRegion,
  isBasePageOverlay,
  releasePageOverlay,
} from './Spinner.overlay'
import { announceLoadingComplete } from '@/composables/useLoadingAnnouncer.composable'

// The root is a <Teleport>, so Vue has no single element to fall attributes
// through to. Binding $attrs on the ring's own wrapper keeps `class`, `style`
// and every aria-* a caller passes landing where they did before the page
// overlay learned to leave the tree.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ISpinnerProps>(), {
  id: undefined,
  size: ESpinnerSize.Medium,
  label: 'Loading',
  showLabel: false,
  overlay: ESpinnerOverlay.None,
  tone: ESpinnerTone.Primary,
  delay: 0,
  completeLabel: undefined,
  decorative: false,
})

const elementId = useStableId(props)
// Identity for the page-overlay stack. Not the DOM id: two app instances on one
// page can generate the same id, and two claims must never collapse into one.
const overlayKey = Symbol('nb-spinner-page-overlay')
const rootEl = ref<HTMLElement | null>(null)
const reducedMotion = useReducedMotion()

const isPageOverlay = computed(() => props.overlay === ESpinnerOverlay.Page)
const isContainerOverlay = computed(
  () => props.overlay === ESpinnerOverlay.Container,
)

/**
 * `decorative` is ignored by a page overlay, and this is the only place in the
 * component where a prop does not do what it says.
 *
 * A decorative spinner is one whose loading state something else is already
 * announcing: a button that swapped its own label, a row that owns a live
 * region. A scrim over the entire viewport has no such owner. It is the only
 * thing on the screen, it is the element that holds focus, and marking it
 * `aria-hidden` would leave a screen reader user focused on a node that
 * reports nothing at all. So a page overlay always keeps its name.
 */
const isDecorative = computed(() => props.decorative && !isPageOverlay.value)
const announces = computed(() => !isDecorative.value)

// ── Delay ────────────────────────────────────────────────────────────────────
// A spinner that appears and vanishes inside 100ms reads as a glitch, so the
// delay gates rendering entirely rather than hiding an already-mounted ring:
// nothing is in the accessibility tree during the delay, so no live region
// announces a load that is already over.
//
// The timer is armed by a watcher rather than by onMounted, so `:delay` is a
// live prop: raising it while the spinner is still hidden pushes the reveal
// out, and lowering it to 0 shows the ring immediately. Re-delaying a spinner
// that is ALREADY visible is deliberately not supported: taking an announced
// indicator back out of the accessibility tree is worse than leaving it.
const visible = ref(props.delay <= 0)
let delayTimer: ReturnType<typeof setTimeout> | undefined

function clearDelay() {
  if (delayTimer) {
    clearTimeout(delayTimer)
    delayTimer = undefined
  }
}

watch(
  () => props.delay,
  (delay) => {
    if (visible.value) return
    clearDelay()
    if (delay <= 0) {
      visible.value = true
      return
    }
    delayTimer = setTimeout(() => {
      delayTimer = undefined
      visible.value = true
    }, delay)
  },
  { immediate: true },
)

// ── Announcing that it is loading ────────────────────────────────────────────
// A live region that is inserted into the document and filled in the same
// frame is frequently missed: assistive tech has nothing to compare the
// contents against, so there is no update to report. The region therefore goes
// in empty and the label is written on the following task, which makes it a
// change to a region that was already being watched. This is the same reason
// `announceLoadingComplete` waits before writing, and the reason
// NbInlineLoading keeps its text node mounted while inactive.
const announced = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined

function clearAnnounce() {
  if (announceTimer) {
    clearTimeout(announceTimer)
    announceTimer = undefined
  }
}

watch(
  [visible, announces, () => props.label],
  ([isVisible, isLive, label]) => {
    clearAnnounce()
    if (!isVisible || !isLive) {
      announced.value = ''
      return
    }
    // A label that changes on a region that has already spoken is a genuine
    // update and needs no second empty frame, but the first one always does.
    if (announced.value !== '') {
      announced.value = label
      return
    }
    announceTimer = setTimeout(() => {
      announceTimer = undefined
      announced.value = label
    }, 0)
  },
  { immediate: true },
)

// ── Blocking ─────────────────────────────────────────────────────────────────
// `position: fixed` resolves against the nearest transformed, filtered or
// contained ancestor rather than the viewport, and a sidebar with a transition
// on it is enough to break that. Teleporting to <body> removes the question,
// and it is also what makes containment honest: the overlay's siblings are the
// application, so they can be marked inert while it is up.
//
// A container overlay is the same idea one level down. It covers its parent,
// so its parent's other children are the region it is blocking. Without that,
// the scrim stops the mouse and nothing else and a keyboard user tabs into a
// form that is visibly unavailable.
type TClaimMode = 'page' | 'container' | null

let claimedMode: TClaimMode = null
let releaseRegion: (() => void) | null = null

function release() {
  if (claimedMode === null) return
  const previous = claimedMode
  claimedMode = null
  if (previous === 'page') releasePageOverlay(overlayKey)
  releaseRegion?.()
  releaseRegion = null
}

function syncClaim() {
  const wanted: TClaimMode = !visible.value
    ? null
    : isPageOverlay.value
      ? 'page'
      : isContainerOverlay.value
        ? 'container'
        : null

  if (wanted === claimedMode) return
  // Switching mode releases first, so a spinner whose `overlay` prop changes
  // mid-load cannot leave a page claim standing behind a container one.
  release()
  if (wanted === null) return

  const el = rootEl.value
  if (!el) return
  claimedMode = wanted
  if (wanted === 'page') {
    claimPageOverlay(overlayKey, el)
    return
  }
  const container = el.parentElement
  if (container) releaseRegion = containRegion(container, el)
}

// Post flush, so the node is in the document before focus is moved into it.
watch([visible, () => props.overlay], syncClaim, { flush: 'post' })
onMounted(syncClaim)

// ── Completion ───────────────────────────────────────────────────────────────
// The spinner is removed the instant the work is done, which is exactly when a
// screen reader user most needs to be told something. The message is handed to
// a shared live region that outlives this component, because a region that is
// being torn down cannot speak. Only for a spinner that was actually seen and
// actually announced: a delay that outran the request announced no load, so it
// has no completion to report, and a decorative spinner is deliberately silent
// on both halves. A load that ended in failure suppresses this from the place
// that knows it failed (see useLoadingAnnouncer.composable.ts).
onBeforeUnmount(() => {
  if (visible.value && announces.value) {
    announceLoadingComplete(props.completeLabel)
  }
  clearDelay()
  clearAnnounce()
  release()
})

const rootClasses = computed(() => [
  'nb-spinner',
  `nb-spinner--${props.size}`,
  `nb-spinner--tone-${props.tone}`,
  `nb-spinner--overlay-${props.overlay}`,
  {
    'nb-spinner--with-label': props.showLabel && !isDecorative.value,
    'nb-spinner--reduced-motion': reducedMotion.value,
    // Two page overlays at once (a tenant switch fired while a save was still
    // blocking) would otherwise paint two scrims and double the darkness.
    // Only the one that got there first is allowed to paint.
    'nb-spinner--overlay-stacked':
      isPageOverlay.value && visible.value && !isBasePageOverlay(overlayKey),
  },
])
</script>

<style scoped lang="scss">
.nb-spinner {
  display: inline-flex;
  align-items: center;
  gap: var(--nb-base-unit);
  font-family: var(--nb-font-family-sans);
  color: var(--nb-c-primary);

  // ── Diameter: exactly half the field height of the same size step, so a
  // spinner dropped into an md button is optically centred with no nudging ──
  --nb-spinner-diameter: calc(var(--nb-field-height-md) / 2);

  &--xs {
    --nb-spinner-diameter: calc(var(--nb-field-height-xs) / 2);
  }

  &--sm {
    --nb-spinner-diameter: calc(var(--nb-field-height-sm) / 2);
  }

  &--md {
    --nb-spinner-diameter: calc(var(--nb-field-height-md) / 2);
  }

  &--lg {
    --nb-spinner-diameter: calc(var(--nb-field-height-lg) / 2);
  }

  &--tone-inherit {
    color: inherit;
  }

  // ── Ring ────────────────────────────────────────────────────────────────────
  &__ring {
    display: block;
    flex-shrink: 0;
    width: var(--nb-spinner-diameter);
    height: var(--nb-spinner-diameter);
  }

  &__track,
  &__arc {
    fill: none;
    stroke-width: 4;
  }

  &__track {
    stroke: var(--nb-c-discrete);
  }

  &__arc {
    stroke: currentcolor;
    stroke-linecap: round;
    // Circumference of r=14 is ~87.96. A 22 unit dash is a quarter turn.
    stroke-dasharray: 22 66;
    transform-origin: 50% 50%;
    animation: nb-spinner-spin 900ms linear infinite;
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  // Only meaningful on an overlay, where it is the caller's escape hatch out
  // of a block that has run long. Spaced from the ring rather than crowded
  // against it, because it is a decision, not a caption.
  &__actions {
    display: flex;
    gap: var(--nb-base-unit);
    align-items: center;
    margin-top: var(--nb-base-unit);
  }

  // ── Label ───────────────────────────────────────────────────────────────────
  &__label {
    font-size: var(--nb-font-size-12);
    line-height: 1.4;
    color: var(--nb-c-text-muted);
  }

  // The live region's contents. Always present, never visible: the visible
  // label is a separate, aria-hidden node.
  &__announcement {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    border: 0;
    clip-path: inset(50%);
  }

  // ── Overlays ────────────────────────────────────────────────────────────────
  &--overlay-container,
  &--overlay-page {
    display: flex;
    flex-direction: column;
    gap: var(--nb-base-unit);
    align-items: center;
    justify-content: center;
    background: var(--nb-c-scrim);

    .nb-spinner__label {
      color: var(--nb-c-white);
    }
  }

  &--overlay-container {
    position: absolute;
    inset: 0;
    // Above table headers and inspector chrome inside the same container,
    // below anything that escapes it.
    z-index: var(--nb-zindex-pageheader);
  }

  &--overlay-page {
    position: fixed;
    inset: 0;
    // Exactly the modal layer, not one above it, and that is the whole
    // arbitration rule made visible: teleported siblings at equal z-index
    // paint in document order, so a dialog opened after the spinner paints
    // over it and a spinner raised over an open dialog covers it. Focus
    // follows the same order, because the elements this overlay marked inert
    // are the ones that existed when it claimed. Paint and focus cannot
    // disagree.
    z-index: var(--nb-zindex-modal);

    // The scrim only exists once. A second page overlay still blocks, it just
    // does not repaint the darkness.
    &.nb-spinner--overlay-stacked {
      background: transparent;
    }

    // Never draw a focus ring on the scrim itself: focus is parked there for
    // containment, not because the user went there.
    &:focus {
      outline: none;
    }
  }

  @keyframes nb-spinner-spin {
    to {
      transform: rotate(360deg);
    }
  }

  // A frozen ring says "broken", not "working". Under reduced motion the arc
  // becomes a complete ring that breathes in opacity: no rotation, no
  // translation, but still visibly alive, which is the whole job of the
  // component. The class and the media query carry the same rules so the
  // behaviour survives both a runtime preference change and a first paint
  // before any script has run.
  @media (prefers-reduced-motion: reduce) {
    .nb-spinner__arc {
      stroke-dasharray: none;
      animation: nb-spinner-breathe 1600ms ease-in-out infinite;
    }
  }

  &--reduced-motion &__arc {
    stroke-dasharray: none;
    animation: nb-spinner-breathe 1600ms ease-in-out infinite;
  }

  @keyframes nb-spinner-breathe {
    0%,
    100% {
      stroke-opacity: 0.25;
    }

    50% {
      stroke-opacity: 1;
    }
  }

  // ── Windows high contrast ───────────────────────────────────────────────────
  // Forced colours throw away every author colour, which would leave the track
  // and the arc the same system colour: a plain grey circle with no motion cue
  // and, worse, a scrim that resolves to Canvas and hides the page behind an
  // opaque nothing. Repaint deliberately: the arc takes the text colour, the
  // track drops out, and the scrim keeps a visible border so the blocked page
  // is still legible as blocked.
  @media (forced-colors: active) {
    color: CanvasText;

    .nb-spinner__arc {
      forced-color-adjust: none;
      stroke: CanvasText;
    }

    .nb-spinner__track {
      forced-color-adjust: none;
      stroke: Canvas;
    }

    &.nb-spinner--overlay-container,
    &.nb-spinner--overlay-page {
      background: Canvas;
      outline: 1px solid CanvasText;
      outline-offset: -1px;
    }

    .nb-spinner__label {
      color: CanvasText;
    }
  }
}
</style>
