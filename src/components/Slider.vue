<template>
  <div :class="rootClasses">
    <!-- DEFAULT variant: label above -->
    <NbLabel v-if="variant === 'default' && label" class="nb-slider__label">{{
      label
    }}</NbLabel>

    <!-- Field box: display:contents in default (passthrough), styled in fluid -->
    <div class="nb-slider__field-box">
      <!-- FLUID variant: label inside the box -->
      <div v-if="variant === 'fluid' && label" class="nb-slider__inner-header">
        <label class="nb-slider__inner-label">{{ label }}</label>
      </div>

      <NbGrid dir="row" align="center" gap="sm" class="nb-slider__row">
        <!-- Range: low number input on the left -->
        <NbNumberInput
          v-if="range && showInput"
          :size="variant === 'fluid' ? 'sm' : size"
          :model-value="lowValue"
          :min="min"
          :max="highValue"
          :step="step"
          :disabled="disabled"
          class="nb-slider__input"
          @update:model-value="onLowInputChange"
          @change="onLowInputChange"
        />

        <!-- Track area -->
        <NbGrid
          dir="col"
          justify="end"
          gap="xs"
          class="nb-slider__track-area"
          :class="trackAreaClasses"
          grow
        >
          <div
            ref="trackRef"
            class="nb-slider__track"
            @mousedown="onTrackMousedown"
            @touchstart.passive="onTrackTouchstart"
          >
            <!-- Filled segment -->
            <div class="nb-slider__track__fill" :style="fillStyle" />

            <!-- Single handle (circle) -->
            <div
              v-if="!range"
              class="nb-slider__track__handle"
              :style="{ left: `${valueToPercent(singleValue)}%` }"
              @mousedown.stop="onHandleMousedown(null, $event)"
              @touchstart.stop.passive="onHandleTouchstart(null, $event)"
            />

            <!-- Range handles (triangles) -->
            <template v-else>
              <div
                class="nb-slider__track__handle nb-slider__track__handle--low"
                :style="{ left: `${valueToPercent(lowValue)}%` }"
                @mousedown.stop="onHandleMousedown('low', $event)"
                @touchstart.stop.passive="onHandleTouchstart('low', $event)"
              />
              <div
                class="nb-slider__track__handle nb-slider__track__handle--high"
                :style="{ left: `${valueToPercent(highValue)}%` }"
                @mousedown.stop="onHandleMousedown('high', $event)"
                @touchstart.stop.passive="onHandleTouchstart('high', $event)"
              />
              <div class="nb-slider__tick" />
            </template>
          </div>

          <!-- Min / max labels below track -->
          <div class="nb-slider__track-labels">
            <span class="nb-slider__track-label">{{ min }}</span>
            <span class="nb-slider__track-label">{{ max }}</span>
          </div>
        </NbGrid>

        <!-- Single slider: number input on the right -->
        <!-- Range: high number input on the right -->
        <NbNumberInput
          v-if="showInput"
          :size="variant === 'fluid' ? 'sm' : size"
          :model-value="range ? highValue : singleValue"
          :min="range ? lowValue : min"
          :max="max"
          :step="step"
          :disabled="disabled"
          class="nb-slider__input"
          @update:model-value="
            range ? onHighInputChange($event) : onSingleInputChange($event)
          "
          @change="
            range ? onHighInputChange($event) : onSingleInputChange($event)
          "
        />
      </NbGrid>
    </div>
    <!-- /__field-box -->

    <!-- Messages below -->
    <NbMessage v-if="error" variant="error" class="nb-slider__message">{{
      error
    }}</NbMessage>
    <NbMessage
      v-else-if="warning"
      variant="warning"
      class="nb-slider__message"
      >{{ warning }}</NbMessage
    >
    <NbMessage v-else-if="helper" variant="helper" class="nb-slider__message">{{
      helper
    }}</NbMessage>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import type { ISliderProps, TActiveHandle } from './Slider.d'

const props = withDefaults(defineProps<ISliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  range: false,
  disabled: false,
  showInput: true,
  size: ESizeShort.Medium,
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | [number, number]]
  change: [value: number | [number, number]]
}>()

const trackRef = ref<HTMLElement | null>(null)

const activeHandle = ref<TActiveHandle>(null)

// Derived values
const singleValue = computed<number>(() => {
  if (
    props.range ||
    props.modelValue === null ||
    props.modelValue === undefined
  ) {
    return props.min ?? 0
  }
  if (Array.isArray(props.modelValue))
    return (props.modelValue[0] as number) ?? props.min ?? 0
  return props.modelValue as number
})

const lowValue = computed<number>(() => {
  if (!props.range || !Array.isArray(props.modelValue)) return props.min ?? 0
  return (props.modelValue as [number, number])[0] ?? props.min ?? 0
})

const highValue = computed<number>(() => {
  if (!props.range || !Array.isArray(props.modelValue)) return props.max ?? 100
  return (props.modelValue as [number, number])[1] ?? props.max ?? 100
})

// Track helpers
function valueToPercent(v: number): number {
  const minV = props.min ?? 0
  const maxV = props.max ?? 100
  if (maxV === minV) return 0
  return ((v - minV) / (maxV - minV)) * 100
}

function percentToValue(pct: number): number {
  const minV = props.min ?? 0
  const maxV = props.max ?? 100
  const stepV = props.step ?? 1
  const raw = minV + (pct / 100) * (maxV - minV)
  const stepped = Math.round(raw / stepV) * stepV
  return Math.max(minV, Math.min(maxV, stepped))
}

function getPercentFromEvent(e: MouseEvent | TouchEvent): number {
  if (!trackRef.value) return 0
  const rect = trackRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
}

// Fill style
const fillStyle = computed(() => {
  if (!props.range) {
    return { left: '0%', width: `${valueToPercent(singleValue.value)}%` }
  }
  const leftPct = valueToPercent(lowValue.value)
  const rightPct = valueToPercent(highValue.value)
  return { left: `${leftPct}%`, width: `${rightPct - leftPct}%` }
})

// Emit helpers
function emitSingle(value: number) {
  emit('update:modelValue', value)
}

function emitRange(low: number, high: number) {
  emit('update:modelValue', [low, high])
}

// Input change handlers
function onSingleInputChange(val: number | null) {
  if (val === null) return
  const minV = props.min ?? 0
  const maxV = props.max ?? 100
  emitSingle(Math.max(minV, Math.min(maxV, val)))
}

function onLowInputChange(val: number | null) {
  if (val === null) return
  const minV = props.min ?? 0
  const clamped = Math.max(minV, Math.min(highValue.value, val))
  emitRange(clamped, highValue.value)
}

function onHighInputChange(val: number | null) {
  if (val === null) return
  const maxV = props.max ?? 100
  const clamped = Math.max(lowValue.value, Math.min(maxV, val))
  emitRange(lowValue.value, clamped)
}

// Drag handling
function resolveHandle(pct: number): TActiveHandle {
  if (!props.range) return null
  const lowPct = valueToPercent(lowValue.value)
  const highPct = valueToPercent(highValue.value)
  return Math.abs(pct - lowPct) <= Math.abs(pct - highPct) ? 'low' : 'high'
}

function applyDrag(pct: number) {
  const val = percentToValue(pct)
  if (!props.range) {
    emitSingle(val)
    return
  }
  if (activeHandle.value === 'low') {
    const clamped = Math.min(val, highValue.value)
    emitRange(clamped, highValue.value)
  } else {
    const clamped = Math.max(val, lowValue.value)
    emitRange(lowValue.value, clamped)
  }
}

function onMousemove(e: MouseEvent) {
  if (props.disabled) return
  applyDrag(getPercentFromEvent(e))
}

function onMouseup(e: MouseEvent) {
  if (!props.disabled) {
    const val = props.range
      ? ([lowValue.value, highValue.value] as [number, number])
      : singleValue.value
    emit('change', val)
    applyDrag(getPercentFromEvent(e))
  }
  stopDrag()
}

function onTouchmove(e: TouchEvent) {
  if (props.disabled) return
  applyDrag(getPercentFromEvent(e))
}

function onTouchend(e: TouchEvent) {
  if (!props.disabled) {
    const val = props.range
      ? ([lowValue.value, highValue.value] as [number, number])
      : singleValue.value
    emit('change', val)
    applyDrag(getPercentFromEvent(e))
  }
  stopTouchDrag()
}

function startDrag() {
  document.addEventListener('mousemove', onMousemove)
  document.addEventListener('mouseup', onMouseup)
}

function stopDrag() {
  activeHandle.value = null
  document.removeEventListener('mousemove', onMousemove)
  document.removeEventListener('mouseup', onMouseup)
}

function startTouchDrag() {
  document.addEventListener('touchmove', onTouchmove, { passive: true })
  document.addEventListener('touchend', onTouchend)
}

function stopTouchDrag() {
  activeHandle.value = null
  document.removeEventListener('touchmove', onTouchmove)
  document.removeEventListener('touchend', onTouchend)
}

function onTrackMousedown(e: MouseEvent) {
  if (props.disabled) return
  const pct = getPercentFromEvent(e)
  activeHandle.value = resolveHandle(pct)
  applyDrag(pct)
  startDrag()
}

function onTrackTouchstart(e: TouchEvent) {
  if (props.disabled) return
  const pct = getPercentFromEvent(e)
  activeHandle.value = resolveHandle(pct)
  applyDrag(pct)
  startTouchDrag()
}

function onHandleMousedown(handle: TActiveHandle, _e: MouseEvent) {
  if (props.disabled) return
  activeHandle.value = props.range ? handle : null
  startDrag()
}

function onHandleTouchstart(handle: TActiveHandle, _e: TouchEvent) {
  if (props.disabled) return
  activeHandle.value = props.range ? handle : null
  startTouchDrag()
}

onBeforeUnmount(() => {
  stopDrag()
  stopTouchDrag()
})

// CSS classes
const rootClasses = computed(() => [
  'nb-slider',
  `nb-slider--${props.size}`,
  `nb-slider--${props.variant}`,
  {
    'nb-slider--range': props.range,
    'nb-slider--disabled': props.disabled,
    'nb-slider--error': !!props.error,
    'nb-slider--warning': !props.error && !!props.warning,
  },
])

const trackAreaClasses = computed(() => ({
  'nb-slider__track-area--error': !!props.error,
  'nb-slider__track-area--warning': !props.error && !!props.warning,
}))
</script>

<style scoped lang="scss">
.nb-slider {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
  font-family: var(--nb-font-family-sans, sans-serif);

  &--disabled {
    opacity: var(--nb-field-disabled-opacity);
    pointer-events: none;
  }

  &__label {
    // label sits outside the row, handled by NbLabel default layout
  }

  // ── Field box: invisible passthrough in default, field container in fluid ──
  &__field-box {
    display: contents; // default: children participate directly in .nb-slider's flex
  }

  // ── Fluid variant ───────────────────────────────────────────────────────────
  &--fluid {
    gap: 4px;

    .nb-slider__field-box {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      background: var(--nb-c-field-bg);
      border-bottom: 1px solid var(--nb-c-field-border);
      padding-top: calc(var(--nb-base-unit) * 1);
      min-height: calc(var(--nb-base-unit) * 8);
    }

    .nb-slider__inner-header {
      display: flex;
      align-items: center;
      padding: 0 var(--nb-field-padding-h);
      margin-bottom: 4px;
    }

    .nb-slider__inner-label {
      flex: 1;
      min-width: 0;
      font-family: var(--nb-font-family-sans);
      font-size: var(--nb-font-size-12);
      font-weight: 500;
      color: var(--nb-c-text-muted);
      letter-spacing: 0.02em;
      cursor: default;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nb-slider__row {
      padding: 0 var(--nb-field-padding-h) 4px;
    }

    // Strip the inner NbNumberInput's own field-box appearance
    .nb-slider__input :deep(.nb-number-input__field-wrapper) {
      background: transparent;
      border-bottom: none;
    }
  }

  &__row {
    // layout owned by NbGrid (dir="row", align="center", gap="sm")
  }

  &__input {
    flex: 0 0 auto;
    width: 160px;
  }

  // Track area: fills remaining space
  &__track-area {
    // flex: 1;
    min-width: 80px;
    // display: flex;
    // flex-direction: column;
    // justify-content: center;
    // gap: 3px;

    // Validation: recolor the track and fill
    &--error .nb-slider__track {
      background: color-mix(in srgb, var(--nb-c-danger) 30%, transparent);

      .nb-slider__track__fill {
        background: var(--nb-c-danger);
      }

      .nb-slider__track__handle {
        background: var(--nb-c-danger);
      }
    }

    &--warning .nb-slider__track {
      background: color-mix(in srgb, var(--nb-c-warning) 30%, transparent);

      .nb-slider__track__fill {
        background: var(--nb-c-warning);
      }

      .nb-slider__track__handle {
        background: var(--nb-c-warning);
      }
    }
  }

  // Track
  &__track {
    position: relative;
    height: 2px;
    background: var(--nb-c-field-border);
    cursor: pointer;
    margin: 5px 0;

    &__fill {
      position: absolute;
      height: 2px;
      background: var(--nb-c-text);
      top: 0;
      pointer-events: none;
    }

    &__handle {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--nb-c-text);
      top: 50%;
      transform: translate(-50%, -50%);
      cursor: grab;
      z-index: 1;

      &:active {
        cursor: grabbing;
      }

      &--low {
        border-radius: 0;
        clip-path: polygon(0 50%, 100% 0, 100% 100%);
      }

      &--high {
        border-radius: 0;
        clip-path: polygon(100% 50%, 0 0, 0 100%);
      }
    }
  }

  &__tick {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 8px;
    background: var(--nb-c-field-border);
    pointer-events: none;
  }

  &__track-labels {
    display: flex;
    justify-content: space-between;
  }

  &__track-label {
    font-size: 11px;
    color: var(--nb-c-field-border);
    line-height: 1;
    user-select: none;
  }

  &__message {
    font-size: 11px;
  }
}
</style>
