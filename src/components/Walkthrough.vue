<template>
  <Teleport :to="teleportTo">
    <div
      v-if="controller.active.value"
      class="nb-walkthrough"
      :class="{ 'nb-walkthrough--no-motion': reducedMotion }"
    >
      <svg
        class="nb-walkthrough--scrim"
        aria-hidden="true"
        :viewBox="`0 0 ${viewport.width} ${viewport.height}`"
        preserveAspectRatio="none"
        @click="onScrimClick"
      >
        <defs>
          <mask :id="maskId">
            <!--
              White and black here are mask coverage values (opaque / cut out),
              not theme colours: SVG masks read luminance, so these are the
              only two values that mean anything. The visible colour comes
              from --nb-c-scrim-strong on the masked rect below.
            -->
            <rect
              x="0"
              y="0"
              :width="viewport.width"
              :height="viewport.height"
              fill="white"
            />
            <rect
              v-if="spotlight"
              :x="spotlight.left"
              :y="spotlight.top"
              :width="spotlight.width"
              :height="spotlight.height"
              :rx="spotlightRadius"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          class="nb-walkthrough--scrim-fill"
          x="0"
          y="0"
          :width="viewport.width"
          :height="viewport.height"
          :mask="`url(#${maskId})`"
        />
        <rect
          v-if="spotlight"
          class="nb-walkthrough--ring"
          :x="spotlight.left"
          :y="spotlight.top"
          :width="spotlight.width"
          :height="spotlight.height"
          :rx="spotlightRadius"
        />
      </svg>

      <div
        ref="popoverRef"
        :class="[
          'nb-walkthrough--popover',
          `nb-walkthrough--popover-${placedSide}`,
          { 'nb-walkthrough--popover-centered': !spotlight },
        ]"
        v-bind="layerProps"
        role="dialog"
        aria-modal="true"
        :aria-label="resolvedLabels.dialog"
        :aria-labelledby="currentStep?.title ? titleId : undefined"
        :aria-describedby="bodyId"
        :style="popoverStyle"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <slot
          name="header"
          :step="currentStep"
          :index="stepIndex"
          :total="total"
        >
          <p
            v-if="currentStep?.title"
            :id="titleId"
            class="nb-walkthrough--title"
          >
            {{ currentStep.title }}
          </p>
        </slot>

        <div :id="bodyId" class="nb-walkthrough--body">
          <slot
            name="step"
            :step="currentStep"
            :index="stepIndex"
            :total="total"
          >
            {{ currentStep?.body }}
          </slot>
        </div>

        <div class="nb-walkthrough--footer">
          <p class="nb-walkthrough--progress" aria-live="polite">
            {{ resolvedLabels.progress(stepIndex + 1, total) }}
          </p>

          <slot
            name="actions"
            :step="currentStep"
            :index="stepIndex"
            :total="total"
            :back="onBack"
            :next="onNext"
            :skip="onSkip"
          >
            <div class="nb-walkthrough--actions">
              <NbButton
                v-if="!controller.isLast.value"
                variant="ghost"
                size="sm"
                @click="onSkip"
              >
                {{ resolvedLabels.skip }}
              </NbButton>
              <NbButton
                v-if="!controller.isFirst.value"
                variant="secondary"
                outlined
                size="sm"
                @click="onBack"
              >
                {{ resolvedLabels.back }}
              </NbButton>
              <NbButton variant="primary" size="sm" @click="onNext">
                {{
                  controller.isLast.value
                    ? resolvedLabels.done
                    : resolvedLabels.next
                }}
              </NbButton>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import NbButton from './Button.vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useWalkthrough } from '@/composables/useWalkthrough.composable'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { useReducedMotion } from '@/composables/useReducedMotion.composable'
import {
  placeAnchored,
  viewportSize,
  type TAnchorSide,
} from '@/utils/anchorPosition.helper'
import { isTargetVisible, resolveTourTarget } from '@/utils/tourTarget.helper'
import type {
  IWalkthrough,
  IWalkthroughLabels,
  IWalkthroughProps,
  IWalkthroughStep,
} from './Walkthrough.d'

const props = withDefaults(defineProps<IWalkthroughProps>(), {
  walkthrough: undefined,
  controller: undefined,
  autoStart: false,
  storage: undefined,
  labels: undefined,
  teleportTo: 'body',
  closeOnScrim: false,
  padding: 8,
})

const emit = defineEmits<{
  /** Every step the user lands on, including the first. */
  'step-change': [step: IWalkthroughStep, index: number]
  /** The user reached the end and pressed Done. */
  finish: [walkthrough: IWalkthrough]
  /** The user bailed out (Skip, Escape, or scrim click). */
  skip: [walkthrough: IWalkthrough, index: number]
}>()

const EMPTY: IWalkthrough = { id: '', version: 1, steps: [] }

const DEFAULT_LABELS: IWalkthroughLabels = {
  back: 'Back',
  next: 'Next',
  skip: 'Skip',
  done: 'Done',
  progress: (current, total) => `Step ${current} of ${total}`,
  dialog: 'Product walkthrough',
}

/**
 * A host that needs to start the tour from outside the template passes a
 * controller from `useWalkthrough()`; otherwise the component owns one. Both
 * paths run the same state machine, so behaviour never forks.
 */
const controller =
  props.controller ??
  useWalkthrough(() => props.walkthrough ?? EMPTY, { storage: props.storage })

const baseId = useStableId({})
const maskId = `${baseId}-mask`
const titleId = `${baseId}-title`
const bodyId = `${baseId}-body`

const reducedMotion = useReducedMotion()

// Teleported overlay: its DOM parent says nothing about depth, so it pins to
// the top layer and pushes slotted step content deeper from there.
const { layerProps } = useSurfaceLayer({ overlay: true })

const popoverRef = ref<HTMLElement | null>(null)
const targetElement = ref<HTMLElement | null>(null)
const targetRect = ref<DOMRect | null>(null)
const viewport = ref(viewportSize())
const placedSide = ref<TAnchorSide>('bottom')
const popoverPosition = ref({ top: 0, left: 0 })

/**
 * Which way the user is travelling. It decides where to land when a step's
 * target is missing: going forward skips ahead, going back skips further
 * back, so a hidden element never traps the user in a loop between two steps.
 */
let travelDirection: 1 | -1 = 1
let previouslyFocused: HTMLElement | null = null
let targetObserver: ResizeObserver | null = null

/**
 * Last index announced via `step-change`. Starting a tour that was previously
 * left mid-run moves the index and flips `active` in the same tick, so both
 * watchers fire for the same step; this keeps the host from seeing it twice.
 */
let lastEmittedIndex = -1

const currentStep = computed(() => controller.step.value)
const stepIndex = computed(() => controller.stepIndex.value)
const total = computed(() => controller.stepCount.value)

const resolvedLabels = computed<IWalkthroughLabels>(() => ({
  ...DEFAULT_LABELS,
  ...(props.labels ?? {}),
}))

const spotlightPadding = computed(
  () => currentStep.value?.padding ?? props.padding,
)

/** The cut-out box: the target's rect grown by the step's padding, clamped to the viewport. */
const spotlight = computed(() => {
  const rect = targetRect.value
  if (!rect) return null
  const pad = spotlightPadding.value
  const left = Math.max(0, rect.left - pad)
  const top = Math.max(0, rect.top - pad)
  return {
    left,
    top,
    width: Math.min(viewport.value.width - left, rect.width + pad * 2),
    height: Math.min(viewport.value.height - top, rect.height + pad * 2),
  }
})

const spotlightRadius = computed(() => Math.min(8, spotlightPadding.value + 4))

const popoverStyle = computed(() => {
  if (!spotlight.value) return undefined
  return {
    top: `${popoverPosition.value.top}px`,
    left: `${popoverPosition.value.left}px`,
  }
})

function emitStepChange() {
  const step = currentStep.value
  if (!step || lastEmittedIndex === stepIndex.value) return
  lastEmittedIndex = stepIndex.value
  emit('step-change', step, stepIndex.value)
}

function measure() {
  viewport.value = viewportSize()
  const element = targetElement.value
  targetRect.value =
    element && element.isConnected ? element.getBoundingClientRect() : null
  reposition()
}

function reposition() {
  const box = spotlight.value
  const popover = popoverRef.value
  if (!box || !popover) return

  const rect = popover.getBoundingClientRect()
  const requested = currentStep.value?.placement ?? 'auto'
  // `auto` starts at `bottom` and lets the flip logic do the rest: below the
  // target is the least disruptive default, and the fallback chain already
  // handles targets near the bottom edge.
  const side: TAnchorSide =
    requested === 'auto' ? 'bottom' : (requested as TAnchorSide)

  const placement = placeAnchored(
    box,
    { width: rect.width, height: rect.height },
    { side, gap: 12, inset: 16, viewport: viewport.value },
  )

  placedSide.value = placement.side
  popoverPosition.value = { top: placement.top, left: placement.left }
}

function observeTarget(element: HTMLElement | null) {
  targetObserver?.disconnect()
  targetObserver = null
  if (!element || typeof ResizeObserver === 'undefined') return
  // A target can change size without the window resizing or the page
  // scrolling: a sidebar expanding, a table loading rows, a lazily-rendered
  // chart. Without this the spotlight drifts off it silently.
  targetObserver = new ResizeObserver(() => measure())
  targetObserver.observe(element)
}

function scrollTargetIntoView(element: HTMLElement) {
  element.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: reducedMotion.value ? 'auto' : 'smooth',
  })
}

/**
 * Points the spotlight at the current step, skipping over steps whose target
 * is not on screen. One retry frame is allowed first: a target belonging to a
 * panel that opens as the tour starts is legitimately absent for a tick, and
 * skipping it on that basis would be wrong.
 *
 * Skipping re-enters through the `stepIndex` watcher rather than looping here,
 * so there is exactly one code path that reacts to a step change. `skipChain`
 * is the loop breaker for a tour whose targets are all missing.
 */
let skipChain = 0

async function syncTarget(retry = true) {
  if (!controller.active.value) return
  const step = currentStep.value
  if (!step) return

  if (!step.target) {
    skipChain = 0
    targetElement.value = null
    observeTarget(null)
    measure()
    return
  }

  let element = resolveTourTarget(step.target)

  if (!isTargetVisible(element) && retry) {
    await nextTick()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    // The tour may have been skipped, or moved on, while we waited.
    if (!controller.active.value || currentStep.value !== step) return
    element = resolveTourTarget(step.target)
  }

  if (isTargetVisible(element)) {
    skipChain = 0
    targetElement.value = element
    observeTarget(element)
    scrollTargetIntoView(element as HTMLElement)
    measure()
    return
  }

  const nextIndex = stepIndex.value + travelDirection
  if (++skipChain > total.value || nextIndex < 0 || nextIndex >= total.value) {
    // Nothing left in this direction that can be shown: end the run rather
    // than leaving an empty spotlight over a dimmed page.
    skipChain = 0
    await handleFinish()
    return
  }
  controller.goTo(nextIndex)
}

function focusablesInPopover(): HTMLElement[] {
  const root = popoverRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    void onSkip()
    return
  }

  if (event.key !== 'Tab') return

  // Focus trap. The page behind the scrim is not interactive, so letting Tab
  // walk out of the dialog would strand the user on invisible controls.
  const focusables = focusablesInPopover()
  if (focusables.length === 0) {
    event.preventDefault()
    popoverRef.value?.focus()
    return
  }

  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const activeEl = document.activeElement as HTMLElement | null

  if (event.shiftKey && (activeEl === first || activeEl === popoverRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && activeEl === last) {
    event.preventDefault()
    first.focus()
  }
}

function onScrimClick() {
  if (props.closeOnScrim) void onSkip()
}

function onNext() {
  travelDirection = 1
  if (controller.isLast.value) {
    void handleFinish()
    return
  }
  controller.next()
}

function onBack() {
  travelDirection = -1
  controller.back()
}

async function handleFinish() {
  const definition = controller.walkthrough.value
  await controller.finish()
  emit('finish', definition)
}

async function onSkip() {
  const definition = controller.walkthrough.value
  const index = stepIndex.value
  await controller.skip()
  emit('skip', definition, index)
}

function bindWindowListeners() {
  window.addEventListener('resize', measure)
  // capture: true so scrolls inside nested containers reach us too — a target
  // living in a scrollable panel is the common case, not the exception.
  window.addEventListener('scroll', measure, true)
}

function unbindWindowListeners() {
  window.removeEventListener('resize', measure)
  window.removeEventListener('scroll', measure, true)
}

watch(
  () => controller.active.value,
  async (active) => {
    if (active) {
      travelDirection = 1
      skipChain = 0
      lastEmittedIndex = -1
      previouslyFocused = (document.activeElement as HTMLElement) ?? null
      bindWindowListeners()
      await nextTick()
      await syncTarget()
      // Focus the dialog itself rather than the first button: a screen reader
      // then announces the title and body before the controls.
      popoverRef.value?.focus()
      emitStepChange()
    } else {
      unbindWindowListeners()
      observeTarget(null)
      targetElement.value = null
      targetRect.value = null
      // Returning focus to whatever opened the tour is what makes Escape
      // feel like a dismissal rather than a teleport.
      previouslyFocused?.focus?.()
      previouslyFocused = null
      lastEmittedIndex = -1
    }
  },
)

watch(
  () => controller.stepIndex.value,
  async () => {
    if (!controller.active.value) return
    emitStepChange()
    await syncTarget()
  },
)

// A controller passed in from the host is the host's to drive; auto-starting
// it here would fight whatever policy the host already applied to it.
if (props.autoStart && !props.controller) {
  void nextTick(() => controller.maybeAutoStart())
}

onBeforeUnmount(() => {
  unbindWindowListeners()
  observeTarget(null)
})

defineExpose({
  start: controller.start,
  restart: controller.restart,
  next: controller.next,
  back: controller.back,
  skip: onSkip,
  finish: handleFinish,
  goTo: controller.goTo,
  active: controller.active,
  stepIndex: controller.stepIndex,
  controller,
})
</script>

<style scoped lang="scss">
.nb-walkthrough {
  position: fixed;
  inset: 0;
  z-index: var(--nb-zindex-modal);
}

.nb-walkthrough--scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.nb-walkthrough--scrim-fill {
  fill: var(--nb-c-scrim-strong);
}

// The ring is not decoration, it is what delineates the spotlight.
//
// In light mode the cut-out separates from the dim on fill alone (5.93:1), but
// in dark the page ground is already near-black (L* 4.6), so dimming it cannot
// produce a visible hole: cut-out against dim measures ~1.05:1 at every scrim
// alpha. The ring carries it instead, at 4.38:1 against the dim and 4.04:1
// against the cut-out. Do not remove it to "simplify" the overlay, and do not
// swap it for a neutral: the contrast is the point.
.nb-walkthrough--ring {
  fill: none;
  stroke: var(--nb-c-primary);
  stroke-width: 2;
}

.nb-walkthrough--popover {
  // --nb-c-surface / --nb-c-border come from the nb-layer-* class that
  // useSurfaceLayer binds, so this reads them rather than naming a depth.
  position: absolute;
  width: calc(var(--nb-base-unit) * 40); // 320px
  max-width: calc(100vw - var(--nb-base-unit) * 4);
  padding: calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-lg);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  box-shadow: 0 calc(var(--nb-base-unit) * 1.5) calc(var(--nb-base-unit) * 4)
    var(--nb-c-scrim);
  animation: nb-walkthrough-in var(--nb-animation-fast) ease-out;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

// Steps without a target (intro / outro) sit in the middle of the viewport.
.nb-walkthrough--popover-centered {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.nb-walkthrough--title {
  margin: 0 0 calc(var(--nb-base-unit) * 0.75);
  font-family: var(--nb-type-heading-01-family);
  font-size: var(--nb-type-heading-01-size);
  font-weight: var(--nb-type-heading-01-weight);
  line-height: var(--nb-type-heading-01-line-height);
  color: var(--nb-c-text);
}

.nb-walkthrough--body {
  font-family: var(--nb-type-body-md-family);
  font-size: var(--nb-type-body-md-size);
  font-weight: var(--nb-type-body-md-weight);
  line-height: var(--nb-type-body-md-line-height);
  color: var(--nb-c-text-muted);

  :deep(p) {
    margin: 0 0 calc(var(--nb-base-unit) * 0.75);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.nb-walkthrough--footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nb-base-unit);
  margin-top: calc(var(--nb-base-unit) * 2);
  padding-top: calc(var(--nb-base-unit) * 1.5);
  border-top: 1px solid var(--nb-c-border);
}

.nb-walkthrough--progress {
  margin: 0;
  font-family: var(--nb-type-label-sm-family);
  font-size: var(--nb-type-label-sm-size);
  font-weight: var(--nb-type-label-sm-weight);
  line-height: var(--nb-type-label-sm-line-height);
  // Subtle is the right tier here and the ramp is built for it: the token is
  // deliberately held to AA (4.5:1), not AAA, and measures 6.78:1 light /
  // 4.50:1 dark on the overlay layer. A step counter is orientation, not
  // something you have to read to operate the tour, which is exactly the use
  // the theming guide reserves it for. Muted would clear AAA but flatten the
  // hierarchy, since the body copy above is already muted.
  color: var(--nb-c-text-subtle);
  white-space: nowrap;
}

.nb-walkthrough--actions {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 0.75);
}

// Opacity only: the centred variant carries a translate(-50%, -50%) of its
// own, and a keyframe that also animated transform would fight it.
@keyframes nb-walkthrough-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.nb-walkthrough--no-motion .nb-walkthrough--popover {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .nb-walkthrough--popover {
    animation: none;
  }
}
</style>
