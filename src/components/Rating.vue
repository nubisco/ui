<template>
  <div v-if="readonly" :class="rootClass" role="img" :aria-label="spokenValue">
    <span
      v-for="star in stars"
      :key="star"
      :class="['nb-rating__star', `nb-rating__star--${shapeOf(star)}`]"
    >
      <NbIcon
        :icon="shapeOf(star) === 'half' ? iconStarHalf : iconStar"
        :weight="shapeOf(star) === 'empty' ? 'regular' : 'fill'"
        :size="iconSize"
      />
    </span>
  </div>
  <div
    v-else
    ref="rootRef"
    :class="rootClass"
    role="radiogroup"
    :aria-label="resolvedLabel"
    :aria-disabled="disabled || undefined"
    @keydown="onKeydown"
    @pointerleave="hovered = null"
  >
    <button
      v-for="star in stars"
      :key="star"
      type="button"
      role="radio"
      :class="[
        'nb-rating__star',
        'nb-rating__option',
        `nb-rating__star--${shapeOf(star)}`,
      ]"
      :aria-checked="star === selected"
      :aria-label="nbStrings.ratingStars(star)"
      :tabindex="star === tabStop ? 0 : -1"
      :disabled="disabled"
      :data-value="star"
      @click="select(star)"
      @pointerenter="onPointerEnter(star, $event)"
    >
      <NbIcon
        :icon="iconStar"
        :weight="shapeOf(star) === 'empty' ? 'regular' : 'fill'"
        :size="iconSize"
      />
    </button>
    <NbButton
      v-if="clearable && !disabled && selected !== null"
      class="nb-rating__clear"
      variant="ghost"
      :size="size"
      :icon="iconX"
      :label="nbStrings.ratingClear"
      @click="clear"
    />
  </div>
</template>

<script setup lang="ts">
import * as iconStar from '@nubisco/ui/icons/star'
import * as iconStarHalf from '@nubisco/ui/icons/star-half'
import * as iconX from '@nubisco/ui/icons/x'
import { computed, nextTick, ref } from 'vue'
import NbIcon from './Icon.vue'
import NbButton from './Button.vue'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import type { IRatingProps } from './Rating.d'

const props = withDefaults(defineProps<IRatingProps>(), {
  modelValue: null,
  max: 5,
  label: undefined,
  readonly: false,
  disabled: false,
  size: 'md',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const nbStrings = useNbStrings()
const rootRef = ref<HTMLElement | null>(null)
const hovered = ref<number | null>(null)

const count = computed(() => Math.max(1, Math.floor(props.max)))
const stars = computed(() =>
  Array.from({ length: count.value }, (_, i) => i + 1),
)

const iconSize = computed(
  () => (({ sm: 16, md: 20, lg: 24 }) as const)[props.size] ?? 20,
)

const rootClass = computed(() => [
  'nb-rating',
  `nb-rating--${props.size}`,
  {
    'nb-rating--readonly': props.readonly,
    'nb-rating--disabled': props.disabled,
  },
])

const resolvedLabel = computed(() => props.label ?? nbStrings.value.ratingLabel)

/** The value as a number in range, or null when not rated. */
const value = computed<number | null>(() => {
  const v = props.modelValue
  if (v === null || v === undefined || !Number.isFinite(v)) return null
  return Math.min(Math.max(v, 0), count.value)
})

/** The star that is checked: a whole star from 1 to max, or none. */
const selected = computed<number | null>(() => {
  if (value.value === null) return null
  const whole = Math.round(value.value)
  return whole >= 1 ? whole : null
})

/*
 * A radio group is one tab stop: the checked star holds it, or the first
 * star while nothing is rated.
 */
const tabStop = computed(() => selected.value ?? 1)

/*
 * Filled up to the value (or the star under the pointer), outlined after it.
 * Filled and empty differ in shape, the fill weight against the outline, so
 * the rating never rests on colour alone. Read only, a fraction draws a half
 * star.
 */
function shapeOf(star: number): 'full' | 'half' | 'empty' {
  if (!props.readonly) {
    const shown = hovered.value ?? selected.value ?? 0
    return star <= shown ? 'full' : 'empty'
  }
  const v = value.value ?? 0
  const halves = Math.round(v * 2) / 2
  if (star <= halves) return 'full'
  if (star - 0.5 === halves) return 'half'
  return 'empty'
}

/** "Quality, 4 of 5 stars", or "Quality, Not rated". */
const spokenValue = computed(() => {
  const strings = nbStrings.value
  const v = value.value
  const text =
    v === null
      ? strings.ratingNotRated
      : strings.ratingValue(Math.round(v * 10) / 10, count.value)
  return `${resolvedLabel.value}, ${text}`
})

function onPointerEnter(star: number, event: PointerEvent) {
  // A touch has no hover, and a preview left behind by one would stick.
  if (props.disabled || event.pointerType === 'touch') return
  hovered.value = star
}

function select(star: number) {
  if (props.disabled || star === selected.value) return
  emit('update:modelValue', star)
}

function clear() {
  if (props.disabled || selected.value === null) return
  emit('update:modelValue', null)
  focusStar(1)
}

function focusStar(star: number) {
  void nextTick(() => {
    rootRef.value?.querySelector<HTMLElement>(`[data-value="${star}"]`)?.focus()
  })
}

/*
 * Radio semantics: the arrows select as they move and wrap, Home and End go
 * to one star and to all of them. From not rated, forward starts at one
 * star and back at all of them. Delete and Backspace clear, when clearable.
 */
function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const n = count.value
  const current = selected.value
  let next: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    next = current === null ? 1 : (current % n) + 1
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    next = current === null ? n : ((current - 2 + n) % n) + 1
  } else if (event.key === 'Home') {
    next = 1
  } else if (event.key === 'End') {
    next = n
  } else if (
    (event.key === 'Delete' || event.key === 'Backspace') &&
    props.clearable
  ) {
    event.preventDefault()
    clear()
    return
  }
  if (next === null) return
  event.preventDefault()
  hovered.value = null
  select(next)
  focusStar(next)
}
</script>

<style lang="scss">
@use '../styles/logic/focus' as focus;
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

/*
 * A row of stars. Filled stars are the fill weight in the text colour, empty
 * ones the outline in the muted text colour: both clear 3:1 against every
 * layer in light and dark, and they differ in shape as well as in tone.
 */
.nb-rating {
  --nb-rating-star-pad: var(--nb-spacing-4);
  display: inline-flex;
  align-items: center;
  gap: 0;
  vertical-align: middle;

  &__star {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--nb-c-text-muted);

    &--full,
    &--half {
      color: var(--nb-c-text);
    }

    // star-half fills its left half. In a right-to-left row the stars run
    // the other way, so the half star turns with them.
    &--half:dir(rtl) {
      transform: scaleX(-1);
    }
  }

  &--readonly &__star + &__star {
    margin-inline-start: 2px;
  }

  &__option {
    appearance: none;
    margin: 0;
    padding: var(--nb-rating-star-pad);
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
    @include radius.standalone(control);

    &:hover:not(:disabled) {
      background: var(--nb-c-surface-hover);
    }

    &:focus-visible {
      @include focus.ring(transparent);
    }

    &:disabled {
      cursor: not-allowed;
    }

    // A fingertip on a phone touch screen: each star becomes a 44px square.
    // The desktop row is untouched.
    @include bp.phone-touch {
      min-width: 44px;
      min-height: 44px;
    }
  }

  &--disabled {
    opacity: var(--nb-field-disabled-opacity, 0.45);
  }

  &__clear.nb-button {
    margin-inline-start: var(--nb-spacing-4);
  }
}
</style>
