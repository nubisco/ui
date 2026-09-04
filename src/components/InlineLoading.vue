<template>
  <div
    :id="elementId"
    :class="rootClasses"
    :style="rootStyle"
    role="status"
    :aria-live="liveness"
  >
    <NbSpinner
      v-if="status === 'active'"
      class="nb-inline-loading__spinner"
      size="sm"
      tone="inherit"
      decorative
    />
    <NbIcon
      v-else-if="statusIcon"
      class="nb-inline-loading__icon"
      :name="statusIcon"
      :size="16"
      aria-hidden="true"
    />

    <!-- Always rendered, empty while inactive: the reserved width has to
         exist before the first label lands in it, otherwise the row still
         jumps on the very transition this component is here to smooth.

         The slot receives the resolved text so the common case stays a
         one-liner, and the uncommon one (a failure that has to offer a retry,
         or a saved state that links to what was saved) can put real markup
         where the string was. -->
    <span class="nb-inline-loading__text">
      <slot :status="status" :text="text">{{ text }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useStableId } from '@/composables/useStableId.composable'
import NbSpinner from './Spinner.vue'
import { EInlineLoadingStatus, IInlineLoadingProps } from './InlineLoading.d'

const props = withDefaults(defineProps<IInlineLoadingProps>(), {
  id: undefined,
  status: EInlineLoadingStatus.Inactive,
  label: 'Saving',
  finishedLabel: 'Saved',
  errorLabel: 'Could not save',
  dwell: 1600,
  reserveSpace: true,
})

const emit = defineEmits<{
  /**
   * Fired once `dwell` has elapsed in the `finished` state. Return `status` to
   * `inactive` here, or navigate away. Without this the success message either
   * disappears too fast to read or stays on screen forever.
   */
  (event: 'success'): void
}>()

const elementId = useStableId(props)

let timer: ReturnType<typeof setTimeout> | undefined

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
}

// The dwell is armed by entering `finished`, and disarmed by leaving it. A
// parent that flips finished -> active again (a second save started before the
// first confirmation faded) must not get a stale `success` afterwards, which
// is the bug in every hand-rolled version of this we found.
watch(
  () => props.status,
  (status) => {
    clearTimer()
    if (status !== EInlineLoadingStatus.Finished) return
    timer = setTimeout(() => {
      timer = undefined
      emit('success')
    }, props.dwell)
  },
  { immediate: true },
)

onBeforeUnmount(clearTimer)

const text = computed(() => {
  switch (props.status) {
    case EInlineLoadingStatus.Active:
      return props.label
    case EInlineLoadingStatus.Finished:
      return props.finishedLabel
    case EInlineLoadingStatus.Error:
      return props.errorLabel
    default:
      return ''
  }
})

const statusIcon = computed(() => {
  if (props.status === EInlineLoadingStatus.Finished) return 'check-circle'
  if (props.status === EInlineLoadingStatus.Error) return 'warning-circle'
  return null
})

// Silence while inactive: an empty polite region is harmless, but `off` also
// stops a screen reader announcing the node when it is first inserted.
// Failures interrupt, progress and success wait their turn.
const liveness = computed(() => {
  if (props.status === EInlineLoadingStatus.Inactive) return 'off'
  if (props.status === EInlineLoadingStatus.Error) return 'assertive'
  return 'polite'
})

const rootClasses = computed(() => [
  'nb-inline-loading',
  `nb-inline-loading--${props.status}`,
])

// Character-count reservation, not pixel-perfect measurement: it keeps the
// longest of the three labels from shoving the row when the text swaps, and
// costs no layout pass. `ch` under a proportional face is approximate, hence
// the small allowance.
const rootStyle = computed(() => {
  if (!props.reserveSpace) return undefined
  const longest = Math.max(
    props.label.length,
    props.finishedLabel.length,
    props.errorLabel.length,
  )
  return { '--nb-inline-loading-reserve': `${longest + 1}ch` }
})
</script>

<style scoped lang="scss">
.nb-inline-loading {
  display: inline-flex;
  gap: calc(var(--nb-base-unit) / 2);
  align-items: center;
  min-height: var(--nb-field-height-sm);
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-font-size-12);
  line-height: 1.4;
  color: var(--nb-c-text-muted);

  &__spinner,
  &__icon {
    flex-shrink: 0;
  }

  &__text {
    min-width: var(--nb-inline-loading-reserve, 0);
  }

  &--finished {
    color: var(--nb-c-success);
  }

  &--error {
    color: var(--nb-c-danger);
  }
}
</style>
