<template>
  <div
    :id="elementId"
    :class="rootClasses"
    :style="rootStyle"
    :role="label ? 'status' : undefined"
    :aria-live="label ? 'polite' : undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <!-- The live region goes in empty and the label is written on the next
         task. A region inserted and filled in the same frame has nothing to
         compare against, so the update is frequently never reported: the same
         reason useLoadingAnnouncer waits before writing. -->
    <span v-if="label" class="nb-skeleton__label">{{ announced }}</span>

    <!-- aria-busy belongs on the thing that is being built, not on the live
         region. On a live region it means "hold every update until I say
         otherwise", and since a skeleton is unmounted rather than flipped to
         busy=false, that promise is never kept and the label is never spoken.
         The shapes are the stand-in content, so they carry it. -->
    <div class="nb-skeleton__lines" aria-busy="true">
      <span
        v-for="(lineStyle, index) in lineStyles"
        :key="index"
        class="nb-skeleton__line"
      >
        <span class="nb-skeleton__fill" :style="lineStyle" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useReducedMotion } from '@/composables/useReducedMotion.composable'
import { announceLoadingComplete } from '@/composables/useLoadingAnnouncer.composable'
import {
  ESkeletonVariant,
  ISkeletonProps,
  TSkeletonTypeSet,
} from './Skeleton.d'

const props = withDefaults(defineProps<ISkeletonProps>(), {
  id: undefined,
  variant: ESkeletonVariant.Text,
  type: undefined,
  lines: 1,
  lastLineWidth: '60%',
  width: undefined,
  height: undefined,
  radius: 'sm',
  animated: true,
  label: undefined,
  completeLabel: undefined,
})

const elementId = useStableId(props)
const reducedMotion = useReducedMotion()

// See the comment in the template: the region is mounted empty and filled a
// task later, so what assistive tech sees is a change rather than an insertion.
const announced = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.label,
  (label) => {
    if (announceTimer) {
      clearTimeout(announceTimer)
      announceTimer = undefined
    }
    if (!label) {
      announced.value = ''
      return
    }
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

// A skeleton disappears at the moment the content lands, taking its own live
// region with it, so the arrival of the thing the user was waiting for is the
// one event nothing announces. The message goes to a shared region that
// survives this component. See useLoadingAnnouncer.composable.ts.
//
// This fires on every unmount, including the one caused by a failure, because
// a component cannot read a prop that changed on the same render that removed
// it: Vue does not update props on the way out. The failure path is the half
// that knows, so it is the half that speaks: call
// `suppressLoadingAnnouncement()` where the error is caught, or let
// `useInlineLoading` do it for you. The skeleton page documents the pattern.
onBeforeUnmount(() => {
  if (announceTimer) clearTimeout(announceTimer)
  announceLoadingComplete(props.completeLabel)
})

/**
 * The list is closed on purpose. `type` ends up inside a `var(--nb-type-*)`
 * reference, and an unchecked value would silently resolve to nothing, which
 * collapses the skeleton to zero height: the exact layout shift the component
 * exists to prevent, made invisible by a typo.
 */
const TYPE_SETS: readonly TSkeletonTypeSet[] = [
  'label-sm',
  'label-md',
  'label-lg',
  'body-sm',
  'body-md',
  'body-lg',
  'code-sm',
  'code-md',
  'code-lg',
  'heading-01',
  'heading-02',
  'heading-03',
  'heading-04',
  'heading-05',
  'heading-06',
]

const typeSet = computed<TSkeletonTypeSet>(() => {
  if (props.type && TYPE_SETS.includes(props.type)) return props.type
  return props.variant === ESkeletonVariant.Heading ? 'heading-02' : 'body-md'
})

const isTextual = computed(
  () =>
    props.variant === ESkeletonVariant.Text ||
    props.variant === ESkeletonVariant.Heading,
)

const lineCount = computed(() => {
  if (props.variant !== ESkeletonVariant.Text) return 1
  return Math.max(1, Math.floor(props.lines))
})

function toLength(value: string | number | undefined): string | undefined {
  if (value == null) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

// Only the last line of a multi-line paragraph is short. A single line keeps
// the full width, because one short line reads as a truncated value rather
// than as flowing text.
const lineStyles = computed(() =>
  Array.from({ length: lineCount.value }, (_unused, index) => {
    const isLast = index === lineCount.value - 1
    if (
      props.variant === ESkeletonVariant.Text &&
      lineCount.value > 1 &&
      isLast
    )
      return { width: props.lastLineWidth }
    return undefined
  }),
)

const rootClasses = computed(() => [
  'nb-skeleton',
  `nb-skeleton--${props.variant}`,
  `nb-skeleton--radius-${props.radius}`,
  {
    'nb-skeleton--static': !props.animated,
    'nb-skeleton--reduced-motion': reducedMotion.value,
  },
])

const rootStyle = computed(() => {
  const style: Record<string, string> = {}

  if (isTextual.value) {
    // The line box, not the ink: height is font-size x line-height, exactly
    // what the real text will occupy, and the grey bar sits centred inside it.
    // This is why swapping content in does not move anything below.
    style['--nb-skeleton-font-size'] = `var(--nb-type-${typeSet.value}-size)`
    style['--nb-skeleton-line-height'] =
      `var(--nb-type-${typeSet.value}-line-height)`
  }

  if (props.variant === ESkeletonVariant.Circle) {
    // A circle has one measurement. Whichever of the two the caller reached
    // for drives both axes, so an avatar placeholder cannot come out oval.
    const size = toLength(props.height ?? props.width)
    if (size) {
      style.width = size
      style['--nb-skeleton-height'] = size
    }
    return style
  }

  const width = toLength(props.width)
  if (width) style.width = width

  const height = toLength(props.height)
  if (height && !isTextual.value) style['--nb-skeleton-height'] = height

  return style
})
</script>

<style scoped lang="scss">
.nb-skeleton {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) / 2);
  width: 100%;

  --nb-skeleton-height: calc(var(--nb-base-unit) * 8);
  --nb-skeleton-radius: var(--nb-radius-sm);

  &--radius-none {
    --nb-skeleton-radius: var(--nb-radius-none);
  }

  &--radius-xs {
    --nb-skeleton-radius: var(--nb-radius-xs);
  }

  &--radius-sm {
    --nb-skeleton-radius: var(--nb-radius-sm);
  }

  &--radius-md {
    --nb-skeleton-radius: var(--nb-radius-md);
  }

  &--radius-lg {
    --nb-skeleton-radius: var(--nb-radius-lg);
  }

  &--radius-pill {
    --nb-skeleton-radius: var(--nb-radius-pill);
  }

  // The shapes themselves. Separated from the root because the root is the
  // live region and this is the busy content it stands in for.
  &__lines {
    display: flex;
    flex-direction: column;
    gap: calc(var(--nb-base-unit) / 2);
    width: 100%;
  }

  // ── Line box: the reserved space ────────────────────────────────────────────
  &__line {
    display: flex;
    align-items: center;
    width: 100%;
  }

  &--text &__line,
  &--heading &__line {
    font-size: var(--nb-skeleton-font-size);
    height: calc(var(--nb-skeleton-font-size) * var(--nb-skeleton-line-height));
  }

  &--block &__line,
  &--circle &__line {
    height: var(--nb-skeleton-height);
  }

  &--circle {
    width: var(--nb-skeleton-height);
  }

  // ── Fill: the visible grey ──────────────────────────────────────────────────
  &__fill {
    width: 100%;
    border-radius: var(--nb-skeleton-radius);
    background-color: var(--nb-c-discrete);
    background-image: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--nb-c-surface) 60%, transparent) 50%,
      transparent 100%
    );
    background-repeat: no-repeat;
    background-size: 240% 100%;
    animation: nb-skeleton-sweep 1600ms linear infinite;
  }

  // Text ink covers roughly two thirds of its line box, so the bar does too:
  // a bar filling the whole line box reads as a solid block, not as text.
  &--text &__fill,
  &--heading &__fill {
    height: 0.68em;
  }

  &--block &__fill,
  &--circle &__fill {
    height: 100%;
  }

  &--circle &__fill {
    border-radius: var(--nb-radius-pill);
  }

  &--static &__fill {
    animation: none;
    background-image: none;
  }

  // ── Announcement ────────────────────────────────────────────────────────────
  &__label {
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

  @keyframes nb-skeleton-sweep {
    from {
      background-position: 150% 0;
    }

    to {
      background-position: -50% 0;
    }
  }

  // A travelling highlight is exactly the kind of motion reduced-motion asks
  // us to drop, but a dead grey block reads as broken layout. The bar fades in
  // place instead: no movement, still alive.
  @media (prefers-reduced-motion: reduce) {
    // Scoped away from --static so `animated: false` stays genuinely still.
    &:not(.nb-skeleton--static) .nb-skeleton__fill {
      background-image: none;
      animation: nb-skeleton-fade 2000ms ease-in-out infinite;
    }
  }

  // Same rules from the runtime preference, so flipping the OS setting with
  // the page already open takes effect without a reload.
  &--reduced-motion:not(.nb-skeleton--static) .nb-skeleton__fill {
    background-image: none;
    animation: nb-skeleton-fade 2000ms ease-in-out infinite;
  }

  @keyframes nb-skeleton-fade {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  // ── Windows high contrast ───────────────────────────────────────────────────
  // Forced colours replace every background with Canvas, which turns the fill
  // into a blank rectangle on a blank page: the placeholder disappears and the
  // screen reads as empty rather than as loading. Opt the fill out and paint it
  // from the system palette, outlined so it is legible against either scheme.
  @media (forced-colors: active) {
    &__fill {
      forced-color-adjust: none;
      background-color: Canvas;
      background-image: none;
      border: 1px solid CanvasText;
    }

    // Ink height plus a border would overflow the reserved line box, so the
    // textual variants trade the shimmer for an underline-weight bar.
    &--text &__fill,
    &--heading &__fill {
      background-color: CanvasText;
      border: 0;
    }
  }
}
</style>
