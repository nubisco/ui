<template>
  <div :class="rootClasses">
    <!-- DEFAULT variant: label above -->
    <NbLabel
      v-if="variant === 'default' && label"
      :id="labelId"
      class="nb-slider__label"
      >{{ label }}</NbLabel
    >

    <!-- Field box: display:contents in default (passthrough), styled in fluid -->
    <div class="nb-slider__field-box">
      <!-- FLUID variant: label inside the box -->
      <div v-if="variant === 'fluid' && label" class="nb-slider__inner-header">
        <label :id="labelId" class="nb-slider__inner-label">{{ label }}</label>
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
          <!--
            The bounds flank the track rather than sitting under its ends.

            Underneath, they pushed the track to the full width of the row
            while the number input beside it is inset by its own capsule, so
            nothing lined up: the track ran past everything else on the line.
            Inline, the track is shorter and its ends are the component's ends.
          -->
          <div class="nb-slider__track-row">
            <span v-if="showBounds" class="nb-slider__track-label">{{
              min
            }}</span>
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
                role="slider"
                :tabindex="disabled ? -1 : 0"
                :aria-valuemin="min"
                :aria-valuemax="max"
                :aria-valuenow="singleValue"
                :aria-labelledby="label ? labelId : undefined"
                :aria-disabled="disabled || undefined"
                :aria-invalid="invalid"
                :aria-describedby="messageId"
                :style="{ left: `${valueToPercent(singleValue)}%` }"
                @keydown="onHandleKeydown(null, $event)"
                @mousedown.stop="onHandleMousedown(null, $event)"
                @touchstart.stop.passive="onHandleTouchstart(null, $event)"
              />

              <!-- Range handles (triangles) -->
              <template v-else>
                <div
                  class="nb-slider__track__handle nb-slider__track__handle--low"
                  role="slider"
                  :tabindex="disabled ? -1 : 0"
                  :aria-valuemin="min"
                  :aria-valuemax="highValue"
                  :aria-valuenow="lowValue"
                  :aria-label="label ? undefined : 'Minimum'"
                  :aria-labelledby="
                    label ? `${labelId} ${baseId}-low` : undefined
                  "
                  :aria-disabled="disabled || undefined"
                  :aria-invalid="invalid"
                  :aria-describedby="messageId"
                  :style="{ left: `${valueToPercent(lowValue)}%` }"
                  @keydown="onHandleKeydown('low', $event)"
                  @mousedown.stop="onHandleMousedown('low', $event)"
                  @touchstart.stop.passive="onHandleTouchstart('low', $event)"
                />
                <div
                  class="nb-slider__track__handle nb-slider__track__handle--high"
                  role="slider"
                  :tabindex="disabled ? -1 : 0"
                  :aria-valuemin="lowValue"
                  :aria-valuemax="max"
                  :aria-valuenow="highValue"
                  :aria-label="label ? undefined : 'Maximum'"
                  :aria-labelledby="
                    label ? `${labelId} ${baseId}-high` : undefined
                  "
                  :aria-disabled="disabled || undefined"
                  :aria-invalid="invalid"
                  :aria-describedby="messageId"
                  :style="{ left: `${valueToPercent(highValue)}%` }"
                  @keydown="onHandleKeydown('high', $event)"
                  @mousedown.stop="onHandleMousedown('high', $event)"
                  @touchstart.stop.passive="onHandleTouchstart('high', $event)"
                />
                <div class="nb-slider__tick" />
                <span :id="`${baseId}-low`" class="nb-slider__sr-only">
                  Minimum
                </span>
                <span :id="`${baseId}-high`" class="nb-slider__sr-only">
                  Maximum
                </span>
              </template>
            </div>

            <span v-if="showBounds" class="nb-slider__track-label">{{
              max
            }}</span>
          </div>
        </NbGrid>

        <!-- Single slider: number input on the right -->
        <!-- Range: high number input on the right -->
        <NbNumberInput
          v-if="showInput"
          :size="variant === 'fluid' ? 'sm' : size"
          :model-value="readoutValue"
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
    <NbMessage
      v-if="messageVariant"
      :id="messageId"
      :key="messageKey"
      :variant="messageVariant"
      :live="messageLive"
      class="nb-slider__message"
      >{{ messageText }}</NbMessage
    >
  </div>
</template>

<script setup lang="ts">
import NbLabel from './Label.vue'
import NbGrid from './Grid.vue'
import NbNumberInput from './NumberInput.vue'
import NbMessage from './Message.vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import type { ISliderProps, TActiveHandle } from './Slider.d'
import { useStableId } from '@/composables/useStableId.composable'
import { useFieldMessage } from '@/composables/useFieldMessage.composable'

const props = withDefaults(defineProps<ISliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  range: false,
  disabled: false,
  showInput: true,
  showBounds: true,
  size: ESizeShort.Medium,
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | [number, number]]
  change: [value: number | [number, number]]
}>()

const trackRef = ref<HTMLElement | null>(null)

const autoId = useStableId({})
const baseId = computed(() => props.id ?? autoId)
const labelId = computed(() => `${baseId.value}-label`)
const {
  variant: messageVariant,
  text: messageText,
  messageId,
  invalid,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, baseId)

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

// Decimal precision implied by `step` (0.01 -> 2), used to round the numeric
// readout so an off-grid value like 0.35433 shows as 0.35 instead of
// overflowing the field. The slider position keeps the exact value.
const stepDecimals = computed<number>(() => {
  const s = props.step ?? 1
  if (!isFinite(s) || s <= 0) return 0
  const str = String(s)
  const dot = str.indexOf('.')
  return dot === -1 ? 0 : str.length - dot - 1
})
function roundToStep(v: number): number {
  const d = stepDecimals.value
  return d > 0 ? Number(v.toFixed(d)) : Math.round(v)
}
const readoutValue = computed<number>(() =>
  roundToStep(props.range ? highValue.value : singleValue.value),
)

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

/**
 * The handles are the slider (role="slider"), so they take the keys the
 * WAI-ARIA slider pattern names: arrows by one step, Page Up and Page Down by
 * ten, Home and End to the ends. A range handle stops at the other one.
 */
function onHandleKeydown(handle: TActiveHandle, e: KeyboardEvent) {
  if (props.disabled) return
  const minV = props.min ?? 0
  const maxV = props.max ?? 100
  const stepV = props.step ?? 1
  const current =
    handle === 'low'
      ? lowValue.value
      : handle === 'high'
        ? highValue.value
        : singleValue.value
  let next: number
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = current + stepV
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      next = current - stepV
      break
    case 'PageUp':
      next = current + stepV * 10
      break
    case 'PageDown':
      next = current - stepV * 10
      break
    case 'Home':
      next = minV
      break
    case 'End':
      next = maxV
      break
    default:
      return
  }
  e.preventDefault()
  next = roundToStep(next)
  let value: number | [number, number]
  if (handle === 'low') {
    value = [Math.max(minV, Math.min(highValue.value, next)), highValue.value]
  } else if (handle === 'high') {
    value = [lowValue.value, Math.max(lowValue.value, Math.min(maxV, next))]
  } else {
    value = Math.max(minV, Math.min(maxV, next))
  }
  emit('update:modelValue', value)
  emit('change', value)
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
  gap: var(--nb-field-label-gap);
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
      font-size: var(--nb-type-body-sm-size);
      font-weight: var(--nb-font-weight-semibold, 600);
      color: var(--nb-c-text-muted);
      letter-spacing: var(--nb-type-body-sm-letter-spacing);
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
    // Readout width is a knob so dense containers (e.g. .nb-inspector) can make
    // it compact or content-sized without a specificity fight.
    width: var(--nb-slider-readout-width, 160px);
  }

  // Track area: fills remaining space
  &__track-area {
    // flex: 1;
    // Knob so a narrow container can let the track shrink instead of the row
    // overflowing (default keeps a comfortable minimum).
    min-width: var(--nb-slider-track-min-width, 80px);
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

      &:focus-visible {
        outline: 2px solid var(--nb-c-focus-ring);
        outline-offset: 2px;
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

  // A range handle is clipped to a triangle, which clips its outline too, so
  // the track carries the ring while either handle has keyboard focus.
  &--range &__track:has(.nb-slider__track__handle:focus-visible) {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 6px;
  }

  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
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

  /*
   * The track and its bounds on one line.
   *
   * `min-width: 0` on the track is what lets it shrink between two labels
   * instead of pushing them out of the row.
   */
  &__track-row {
    display: flex;
    align-items: center;
    gap: var(--nb-spacing-8);
    width: 100%;
    min-width: 0;
  }

  &__track-row .nb-slider__track {
    flex: 1;
    min-width: 0;
  }

  &__track-label {
    flex-shrink: 0;
    // Tabular figures so the track does not shift as the bounds change width.
    font-variant-numeric: tabular-nums;
    font-size: var(--nb-type-body-sm-size);
    color: var(--nb-c-field-border);
    line-height: 1;
    user-select: none;
  }

  &__message {
    font-size: var(--nb-type-body-sm-size);
  }
}
</style>
