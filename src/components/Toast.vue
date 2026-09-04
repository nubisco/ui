<template>
  <div
    :class="['nb-toast', `nb-toast--${variant}`]"
    :role="role"
    :aria-live="resolvedAriaLive"
    @mouseenter="onPointerEnter"
    @mouseleave="onPointerLeave"
  >
    <div class="nb-toast__icon">
      <NbIcon :name="iconMap[variant!]" :size="16" />
    </div>
    <div class="nb-toast__body">
      <!--
        Severity in words. The icon is aria-hidden inside NbIcon and the accent
        colour says nothing to a screen reader, so without this line
        "Could not reach the server" arrives with no indication that it is an
        error (WCAG 1.4.1: colour is not the only means of conveying
        information). It is read before the title because severity changes how
        the rest of the sentence should be heard. Pass statusLabel="" to remove
        it when the title already carries the word.
      -->
      <span v-if="resolvedStatusLabel" class="nb-toast__status">
        {{ resolvedStatusLabel }}
      </span>
      <p v-if="title" class="nb-toast__title">{{ title }}</p>
      <p class="nb-toast__message">{{ message }}</p>
      <button
        v-if="cta"
        class="nb-toast__cta"
        type="button"
        @click="
          () => {
            cta && cta.action()
            emit('action')
            emit('close')
          }
        "
      >
        {{ cta.label }}
      </button>
    </div>
    <button
      class="nb-toast__close"
      type="button"
      :aria-label="closeLabel"
      @click="emit('close')"
    >
      <NbIcon name="x" :size="14" />
    </button>
    <div
      v-if="duration"
      :key="cycle"
      class="nb-toast__progress"
      :style="{
        animationDuration: `${duration}ms`,
        animationPlayState: showPaused ? 'paused' : 'running',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import NbIcon from './Icon.vue'

export type TToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface IToastCta {
  label: string
  action: () => void
}

const props = withDefaults(
  defineProps<{
    variant?: TToastVariant
    title?: string
    message: string
    /**
     * Milliseconds the countdown bar represents. `0` draws no bar.
     *
     * When `managed` is false (a bare `NbToast`), this is also the toast's own
     * auto-dismiss timer. When `managed` is true, `NbToaster` owns the clock
     * and this value only sizes the bar.
     */
    duration?: number
    cta?: IToastCta
    /**
     * ARIA role. `NbToaster` sets `status` for success and info and `alert`
     * for warning and error. Declared as a real prop rather than left to
     * fallthrough attributes, so adding `inheritAttrs: false` or a wrapper
     * element here can never silently revert every success toast to `alert`.
     */
    role?: 'alert' | 'status' | 'none'
    /** Politeness. Defaults to `assertive` for errors, `polite` otherwise. */
    ariaLive?: 'assertive' | 'polite' | 'off'
    /**
     * Visually hidden severity word, read before the title. Defaults to the
     * English name of the variant; pass your own for another language, or an
     * empty string to suppress it.
     */
    statusLabel?: string
    /** Accessible name of the close button. Translate it per application. */
    closeLabel?: string
    /**
     * `true` when a host owns the clock. The toast then runs no timer of its
     * own and takes its pause state from `paused`, so a whole stack can stop
     * together instead of each item counting down on its own.
     */
    managed?: boolean
    /** Countdown held, when managed. Ignored otherwise. */
    paused?: boolean
    /** Bump to restart the countdown bar after the message changed. */
    cycle?: number
  }>(),
  {
    variant: 'info',
    title: undefined,
    duration: 4000,
    cta: undefined,
    role: 'alert',
    ariaLive: undefined,
    statusLabel: undefined,
    closeLabel: 'Close',
    managed: false,
    paused: false,
    cycle: 0,
  },
)

const emit = defineEmits<{ close: []; action: [] }>()

const selfPaused = ref(false)
const showPaused = computed(() =>
  props.managed ? props.paused : selfPaused.value,
)

const iconMap: Record<TToastVariant, string> = {
  success: 'check-circle',
  error: 'warning-circle',
  warning: 'warning',
  info: 'info',
}

/** English defaults. Every one of them is overridable per toast. */
const statusWords: Record<TToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
}

const resolvedStatusLabel = computed(() =>
  props.statusLabel === undefined
    ? statusWords[props.variant]
    : props.statusLabel,
)

const resolvedAriaLive = computed(
  () => props.ariaLive ?? (props.variant === 'error' ? 'assertive' : 'polite'),
)

let timer: ReturnType<typeof setTimeout> | null = null
let remaining = props.duration ?? 0
let startedAt = 0

function startTimer() {
  if (props.managed || !remaining) return
  startedAt = Date.now()
  timer = setTimeout(() => emit('close'), remaining)
}

function onPointerEnter() {
  if (props.managed) return
  pauseProgress()
}

function onPointerLeave() {
  if (props.managed) return
  resumeProgress()
}

function pauseProgress() {
  if (!remaining || selfPaused.value) return
  selfPaused.value = true
  if (timer) clearTimeout(timer)
  remaining -= Date.now() - startedAt
}

function resumeProgress() {
  if (!remaining || !selfPaused.value) return
  selfPaused.value = false
  startTimer()
}

onMounted(startTimer)
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

watch(
  () => props.duration,
  (val) => {
    if (timer) clearTimeout(timer)
    remaining = val ?? 0
    startTimer()
  },
)
</script>

<style scoped lang="scss">
@use '../styles/variables/breakpoints' as bp;

/*
 * Every value here reads from a --nb-* token. The earlier revision carried
 * raw px and hardcoded hex fallbacks (a fallback is a second, unthemed colour
 * that nobody ever sees fail), plus a fixed black-alpha shadow that was tuned
 * for the light theme and read as a smudge on the dark one. The shadow now
 * mixes from --nb-c-scrim, which the theme already deepens under .dark.
 */
.nb-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--nb-spacing-10);
  padding: var(--nb-spacing-12) var(--nb-spacing-14);
  background: var(--nb-c-bg);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  box-shadow: 0 var(--nb-spacing-4) var(--nb-spacing-16)
    color-mix(in srgb, var(--nb-c-scrim) 35%, transparent);
  /* Narrower than the content box on a small phone, so the stack can never
     push the viewport wide. min() rather than a media query because the
     constraint is the container, not the device. */
  min-width: min(17.5rem, 100%);
  max-width: min(23.75rem, 100%);
  overflow: hidden;
  font-family: var(--nb-font-family-sans);

  &--success .nb-toast__icon {
    color: var(--nb-c-success);
  }
  &--error .nb-toast__icon {
    color: var(--nb-c-danger);
  }
  &--warning .nb-toast__icon {
    color: var(--nb-c-warning);
  }
  &--info .nb-toast__icon {
    color: var(--nb-c-info);
  }

  /*
   * Logical, not physical. The accent rule marks the edge the toast is read
   * from, so in an Arabic or Hebrew build it belongs on the right, where the
   * host has already put the stack: `.nb-toaster--top-start` anchors with
   * `inset-inline-start`, so a `border-left` here would leave the rule on the
   * far side of the toast from the edge it is meant to mark.
   */
  &--success {
    border-inline-start: 3px solid var(--nb-c-success);
  }
  &--error {
    border-inline-start: 3px solid var(--nb-c-danger);
  }
  &--warning {
    border-inline-start: 3px solid var(--nb-c-warning);
  }
  &--info {
    border-inline-start: 3px solid var(--nb-c-info);
  }

  @media (max-width: #{bp.$bp-md - 1}px) {
    min-width: 0;
    max-width: 100%;
  }
}

.nb-toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.nb-toast__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-2);
}

/* Read, not seen. Kept in the flow with zero size rather than display:none,
   which would take it out of the accessibility tree as well. */
.nb-toast__status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.nb-toast__title {
  margin: 0;
  font-size: var(--nb-font-size-13);
  font-weight: var(--nb-font-weight-semibold);
  color: var(--nb-c-text);
  line-height: var(--nb-line-height-normal);
  /* A copied identifier or a URL has no space to break at. Without this it
     runs under the close button and is clipped by overflow: hidden. */
  overflow-wrap: anywhere;
}

.nb-toast__message {
  margin: 0;
  font-size: var(--nb-font-size-13);
  color: var(--nb-c-text-muted);
  line-height: var(--nb-line-height-normal);
  overflow-wrap: anywhere;
}

.nb-toast__cta {
  margin-top: var(--nb-spacing-4);
  padding: 0;
  border: none;
  background: none;
  font-family: inherit;
  font-size: var(--nb-font-size-12);
  font-weight: var(--nb-font-weight-semibold);
  color: var(--nb-c-primary);
  cursor: pointer;
  text-align: left;
  line-height: var(--nb-line-height-none);

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

.nb-toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--nb-spacing-24);
  height: var(--nb-spacing-24);
  border: none;
  background: transparent;
  border-radius: var(--nb-radius-sm);
  color: var(--nb-c-text-subtle);
  cursor: pointer;
  transition:
    background var(--nb-animation-fast),
    color var(--nb-animation-fast);
  margin-top: -1px;

  &:hover {
    background: var(--nb-c-bg-soft);
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

/*
 * How long is left. One implementation, whether the toast times itself or a
 * host times it: when managed, `paused` comes from the queue so all three
 * bars stop together, and `cycle` remounts the element so an updated message
 * restarts the bar instead of continuing another message's countdown.
 */
.nb-toast__progress {
  position: absolute;
  bottom: 0;
  inset-inline-start: 0;
  height: 2px;
  width: 100%;
  background: currentColor;
  opacity: 0.25;
  /* The bar drains towards the end of the line, so its anchor follows the
     writing direction the same way the accent rule does. `transform-origin`
     takes no logical keyword, so the RTL case is spelled out. */
  transform-origin: left;
  animation: nb-toast-progress linear forwards;

  [dir='rtl'] & {
    transform-origin: right;
  }
}

/*
 * Windows high contrast.
 *
 * Forced colours discard box shadows and override every author colour, which
 * takes away both of the things that make a toast read as a toast: the lift
 * that separates it from the page underneath, and the accent rule that is its
 * only non-text severity cue. Repainting from the system palette gives the
 * boundary back. The severity hues cannot come back (forced colours has no
 * four-way severity palette to spend, and inventing one with
 * `forced-color-adjust: none` would opt the close button out of the user's
 * own contrast settings, which is the opposite of the point), so severity
 * falls to the two channels that survive: the per-variant icon glyph, which
 * differs in shape and not only in hue, and the visually hidden severity word
 * in `.nb-toast__status`, which is why that word is not decoration.
 */
@media (forced-colors: active) {
  .nb-toast {
    background: Canvas;
    color: CanvasText;
    border: 1px solid CanvasText;
    box-shadow: none;
  }

  .nb-toast--success,
  .nb-toast--error,
  .nb-toast--warning,
  .nb-toast--info {
    border-inline-start-width: 3px;
  }

  /* Without this the glyph resolves to the same colour as the surface behind
     it and the only remaining shape cue disappears. */
  .nb-toast__icon {
    color: CanvasText;
  }

  /* The countdown is information, so it needs a colour that is guaranteed to
     differ from Canvas. Opacity survives forced colours, so it is dropped
     here or the bar would be a quarter-visible Highlight smear. */
  .nb-toast__progress {
    background: Highlight;
    opacity: 1;
  }
}

@keyframes nb-toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/*
 * Reduced motion keeps the bar, because it is information rather than
 * decoration, but stops it sliding: it steps rather than sweeps, so nothing
 * is animating continuously in the corner of the eye.
 */
@media (prefers-reduced-motion: reduce) {
  .nb-toast__progress {
    animation-timing-function: steps(8, end);
  }
}
</style>
