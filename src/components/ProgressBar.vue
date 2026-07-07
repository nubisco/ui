<template>
  <div :class="rootClasses">
    <div v-if="label" class="nb-progress-bar__header">
      <NbLabel>{{ label }}</NbLabel>
      <NbIcon
        v-if="statusIcon"
        :name="statusIcon"
        :size="14"
        class="nb-progress-bar__status-icon"
      />
    </div>

    <div
      class="nb-progress-bar__track"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="ariaValueNow"
    >
      <div class="nb-progress-bar__bar" :style="barStyle" />
    </div>

    <NbMessage
      v-if="helper"
      :variant="messageVariant"
      class="nb-progress-bar__message"
    >
      {{ helper }}
    </NbMessage>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  EProgressBarSize,
  EProgressBarStatus,
  IProgressBarProps,
} from './ProgressBar.d'
import { EMessageVariant } from './Message.d'

const props = withDefaults(defineProps<IProgressBarProps>(), {
  id: 'progress-bar',
  value: undefined,
  max: 100,
  helper: undefined,
  size: EProgressBarSize.Medium,
  status: EProgressBarStatus.Active,
})

// No value while active means the bar is still waiting for a measurable total
const indeterminate = computed(
  () => props.value == null && props.status === EProgressBarStatus.Active,
)

const fraction = computed(() => {
  // Finished and error always show a full bar, matching Carbon
  if (props.status !== EProgressBarStatus.Active) return 1
  if (props.value == null || props.max <= 0) return 0
  return Math.min(Math.max(props.value / props.max, 0), 1)
})

const ariaValueNow = computed(() =>
  indeterminate.value ? undefined : fraction.value * props.max,
)

const rootClasses = computed(() => [
  'nb-progress-bar',
  `nb-progress-bar--${props.size}`,
  `nb-progress-bar--${props.status}`,
  { 'nb-progress-bar--indeterminate': indeterminate.value },
])

const barStyle = computed(() => ({
  transform: `scaleX(${fraction.value})`,
}))

const statusIcon = computed(() => {
  if (props.status === EProgressBarStatus.Finished) return 'check-circle'
  if (props.status === EProgressBarStatus.Error) return 'warning-circle'
  return null
})

const messageVariant = computed(() =>
  props.status === EProgressBarStatus.Error
    ? EMessageVariant.Error
    : EMessageVariant.Helper,
)
</script>

<style scoped lang="scss">
.nb-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 48px;
  font-family: var(--nb-font-family-sans);

  // ── Header: label left, status icon right ────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__status-icon {
    flex-shrink: 0;
  }

  // ── Track ─────────────────────────────────────────────────────────────────────
  &__track {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: var(--nb-base-unit);
    background: var(--nb-c-discrete);
  }

  &--sm &__track {
    height: calc(var(--nb-base-unit) / 2);
  }

  // ── Bar: scaleX keeps the fill animation on the compositor ───────────────────
  &__bar {
    width: 100%;
    height: 100%;
    background: var(--nb-c-primary);
    transform: scaleX(0);
    transform-origin: 0 center;
    transition:
      transform 0.15s ease,
      background 0.15s;
  }

  // ── Status colors ─────────────────────────────────────────────────────────────
  &--finished &__bar {
    background: var(--nb-c-success);
  }

  &--finished &__status-icon {
    color: var(--nb-c-success);
  }

  &--error &__bar {
    background: var(--nb-c-danger);
  }

  &--error &__status-icon {
    color: var(--nb-c-danger);
  }

  // ── Indeterminate: sweeping stripe, Carbon geometry and timing ───────────────
  &--indeterminate &__bar {
    display: none;
  }

  &--indeterminate &__track::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
      90deg,
      var(--nb-c-primary) 12.5%,
      transparent 12.5%
    );
    background-position-x: 0%;
    background-size: 200% 100%;
    animation: nb-progress-bar-indeterminate 1400ms linear infinite;
  }

  // ── Message ───────────────────────────────────────────────────────────────────
  &__message {
    font-size: var(--nb-font-size-12);
  }

  @keyframes nb-progress-bar-indeterminate {
    0% {
      background-position-x: 25%;
    }

    80%,
    100% {
      background-position-x: -105%;
    }
  }
}
</style>
