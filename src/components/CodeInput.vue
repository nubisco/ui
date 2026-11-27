<template>
  <div :class="rootClass">
    <NbLabel v-if="label" :for="inputId" :disabled="disabled">
      {{ label }}
    </NbLabel>

    <!-- One real input over a row of drawn slots. The input keeps everything
         the platform gives a text field (paste, one-time-code autofill,
         password managers, selection, Backspace and the arrows) and gives a
         screen reader one field. The slots only mirror its value and its
         selection, so they are hidden from assistive technology. -->
    <div
      ref="fieldRef"
      :class="[
        'nb-code-input__field',
        { 'nb-code-input__field--shake': shaking },
      ]"
      @animationend="onShakeEnd"
    >
      <div class="nb-code-input__slots" aria-hidden="true">
        <template v-for="(group, g) in layout" :key="g">
          <span v-if="g > 0" class="nb-code-input__separator">{{
            separator
          }}</span>
          <span
            v-for="index in group"
            :key="index"
            ref="slotRefs"
            :class="slotClass(index)"
            :style="{ '--nb-code-input-index': index }"
            :data-index="index"
          >
            {{ value[index] ?? '' }}
            <span v-if="index === caretAt" class="nb-code-input__caret" />
          </span>
        </template>
      </div>

      <input
        :id="inputId"
        ref="inputRef"
        class="nb-code-input__input"
        type="text"
        :name="name"
        :value="value"
        :inputmode="mode === 'numeric' ? 'numeric' : 'text'"
        :autocomplete="autocomplete"
        :autocapitalize="uppercase ? 'characters' : 'off'"
        autocorrect="off"
        spellcheck="false"
        :disabled="disabled"
        :readonly="isReadonly"
        :aria-label="label ? undefined : nbStrings.codeInputLabel"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
        @beforeinput="onBeforeInput"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @click="onClick"
        @keyup="syncSelection"
        @select="syncSelection"
      />
    </div>

    <span :id="descriptionId" class="nb-code-input__sr-only">{{
      description
    }}</span>

    <!-- The room under the slots is kept whatever the state, so nothing
         below moves when a check starts, passes or fails. The error and the
         progress share one cell, and only one of them has content at a
         time. -->
    <div class="nb-code-input__status">
      <div
        :id="errorId"
        class="nb-code-input__error"
        aria-live="polite"
        aria-atomic="true"
      >
        <NbMessage v-if="error" variant="error" live="off">
          {{ error }}
        </NbMessage>
      </div>
      <NbInlineLoading
        class="nb-code-input__progress"
        :status="progressStatus"
        :label="nbStrings.codeInputVerifying"
        :finished-label="nbStrings.codeInputVerified"
        error-label=""
        :reserve-space="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbInlineLoading from './InlineLoading.vue'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { useStableId } from '@/composables/useStableId.composable'
import { joinDescribedBy } from '@/composables/useFieldMessage.composable'
import type { ICodeInputProps } from './CodeInput.d'

const props = withDefaults(defineProps<ICodeInputProps>(), {
  modelValue: '',
  length: 6,
  groups: undefined,
  separator: '-',
  mode: 'numeric',
  uppercase: false,
  autocomplete: 'one-time-code',
  state: 'idle',
  error: '',
  label: undefined,
  size: 'md',
  autofocus: false,
  disabled: false,
  id: undefined,
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /**
   * The code reached its full length. Fired once for each value that gets
   * there, so a form can submit on it without submitting twice.
   */
  complete: [value: string]
}>()

const nbStrings = useNbStrings()
const inputId = useStableId(props)
const descriptionId = `${inputId}-description`
const errorId = `${inputId}-error`

const inputRef = ref<HTMLInputElement | null>(null)
const fieldRef = ref<HTMLElement | null>(null)
const slotRefs = ref<HTMLElement[]>([])

// ─── Shape ────────────────────────────────────────────────

/** The group sizes: `groups` when given, else one group of `length`. */
const groupSizes = computed<number[]>(() => {
  const sizes = (props.groups ?? [])
    .map((n) => Math.floor(n))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (sizes.length) return sizes
  const n = Math.floor(props.length)
  return [Number.isFinite(n) && n > 0 ? n : 6]
})

const total = computed(() => groupSizes.value.reduce((a, b) => a + b, 0))

/** The slot indexes of each group, in order. */
const layout = computed<number[][]>(() => {
  let next = 0
  return groupSizes.value.map((size) =>
    Array.from({ length: size }, () => next++),
  )
})

// ─── Value ────────────────────────────────────────────────

const allowed = computed(() =>
  props.mode === 'numeric' ? /^[0-9]$/ : /^[A-Za-z0-9]$/,
)

/** Only the characters the mode takes, in capitals when asked, cut to length. */
function sanitize(raw: string, limit = total.value): string {
  const text = props.uppercase ? raw.toUpperCase() : raw
  return [...text]
    .filter((c) => allowed.value.test(c))
    .join('')
    .slice(0, limit)
}

/*
 * The value lives here as well as in the parent, so the field works without
 * a v-model, and a parent that passes a value with a separator or spaces in
 * it still sees only the code.
 */
const value = ref(sanitize(props.modelValue ?? ''))
watch(
  () => [props.modelValue, total.value, props.mode, props.uppercase],
  () => {
    value.value = sanitize(props.modelValue ?? '')
  },
)

// The last value `complete` was fired for, so it fires once per value.
let completed: string | null = null
watch(value, (v) => {
  if (v.length < total.value) completed = null
})

function commit(next: string, caret: number) {
  const el = inputRef.value
  if (el && el.value !== next) el.value = next
  value.value = next
  if (next !== props.modelValue) emit('update:modelValue', next)
  if (el && document.activeElement === el) {
    const at = Math.min(caret, next.length)
    el.setSelectionRange(at, at)
  }
  syncSelection()
  if (next.length === total.value && next !== completed) {
    completed = next
    emit('complete', next)
  }
}

// ─── State ────────────────────────────────────────────────

const isReadonly = computed(
  () => props.state === 'verifying' || props.state === 'success',
)
const invalid = computed(() => props.state === 'error' || !!props.error)

const progressStatus = computed(() => {
  if (props.state === 'verifying') return 'active'
  if (props.state === 'success') return 'finished'
  return 'inactive'
})

/** "6 digits" or "8 characters": what the field expects, read with it. */
const description = computed(() =>
  props.mode === 'numeric'
    ? nbStrings.value.codeInputDigits(total.value)
    : nbStrings.value.codeInputCharacters(total.value),
)

const describedBy = computed(() =>
  joinDescribedBy(descriptionId, props.error ? errorId : undefined),
)

const rootClass = computed(() => [
  'nb-code-input',
  `nb-code-input--${props.size}`,
  `nb-code-input--${props.state}`,
  { 'nb-code-input--disabled': props.disabled },
])

// ─── Selection mirror ─────────────────────────────────────

const focused = ref(false)
const selStart = ref(0)
const selEnd = ref(0)

function syncSelection() {
  const el = inputRef.value
  if (!el) return
  const len = el.value.length
  selStart.value = el.selectionStart ?? len
  selEnd.value = el.selectionEnd ?? len
}

/*
 * The slot that takes the next character. A collapsed caret marks the slot
 * after it, or the last slot once the code is full. A selection marks every
 * slot it covers.
 */
const activeSlots = computed<Set<number>>(() => {
  const out = new Set<number>()
  if (!focused.value || props.disabled || isReadonly.value) return out
  const start = Math.min(selStart.value, selEnd.value)
  const end = Math.max(selStart.value, selEnd.value)
  if (start !== end) {
    for (let i = start; i < end && i < total.value; i++) out.add(i)
  } else {
    out.add(Math.min(start, total.value - 1))
  }
  return out
})

/** The empty slot where the caret is drawn, or -1. */
const caretAt = computed(() => {
  if (!focused.value || props.disabled || isReadonly.value) return -1
  const at = selStart.value
  if (at !== selEnd.value) return -1
  return at === value.value.length && at < total.value ? at : -1
})

function slotClass(index: number) {
  return [
    'nb-code-input__slot',
    {
      'nb-code-input__slot--filled': index < value.value.length,
      'nb-code-input__slot--active': activeSlots.value.has(index),
    },
  ]
}

function onSelectionChange() {
  if (document.activeElement === inputRef.value) syncSelection()
}

function onFocus() {
  focused.value = true
  document.addEventListener('selectionchange', onSelectionChange)
  // Focus from the keyboard lands after the last character. A click moves
  // the caret to the slot that was clicked, in onClick, which runs after.
  const el = inputRef.value
  if (el) {
    const len = el.value.length
    el.setSelectionRange(len, len)
  }
  syncSelection()
}

function onBlur() {
  focused.value = false
  document.removeEventListener('selectionchange', onSelectionChange)
}

/*
 * The input's own text is invisible, so where the browser put the caret
 * says nothing about the slot under the pointer. The caret goes before the
 * clicked slot instead, or after the last character when the slot is
 * still empty.
 */
function onClick(event: MouseEvent) {
  const el = inputRef.value
  if (!el || props.disabled) return
  const slots = [...slotRefs.value].sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index),
  )
  if (!slots.length) return
  const rtl = getComputedStyle(el).direction === 'rtl'
  let index = slots.length - 1
  for (let i = 0; i < slots.length; i++) {
    const r = slots[i].getBoundingClientRect()
    if (rtl ? event.clientX > r.left : event.clientX < r.right) {
      index = i
      break
    }
  }
  const at = Math.min(index, el.value.length)
  el.setSelectionRange(at, at)
  syncSelection()
}

// ─── Typing ───────────────────────────────────────────────

/*
 * A character typed over a filled slot replaces it rather than pushing the
 * rest along, which is what a row of boxes promises. A character the mode
 * does not take is refused before it lands. Everything else (paste, autofill,
 * deletion, a composition) goes through the native path and is filtered in
 * onInput.
 */
function onBeforeInput(event: InputEvent) {
  const el = inputRef.value
  if (!el || event.inputType !== 'insertText' || !event.data) return
  if ([...event.data].length !== 1) return
  const ch = sanitize(event.data, 1)
  if (!ch) {
    event.preventDefault()
    return
  }
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? start
  if (start !== end) return
  const current = value.value
  if (start < current.length) {
    event.preventDefault()
    commit(current.slice(0, start) + ch + current.slice(start + 1), start + 1)
  } else if (current.length >= total.value) {
    event.preventDefault()
  }
}

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const raw = el.value
  const caret = el.selectionStart ?? raw.length
  const next = sanitize(raw)
  commit(next, sanitize(raw.slice(0, caret)).length)
}

// ─── Error ────────────────────────────────────────────────

const shaking = ref(false)
let shakeTimer: ReturnType<typeof setTimeout> | undefined

function stopShakeTimer() {
  if (shakeTimer) {
    clearTimeout(shakeTimer)
    shakeTimer = undefined
  }
}

/** After the shake, or at once without one: empty, and focus back. */
function finishError() {
  stopShakeTimer()
  if (!shaking.value) return
  shaking.value = false
  if (props.disabled) {
    commit('', 0)
    return
  }
  inputRef.value?.focus()
  commit('', 0)
}

function onShakeEnd(event: AnimationEvent) {
  if (event.target === fieldRef.value) finishError()
}

/** The animation's length in ms, or 0 when none runs (reduced motion). */
function shakeDuration(el: HTMLElement): number {
  const style = getComputedStyle(el)
  if (!style.animationName || style.animationName === 'none') return 0
  const first = (style.animationDuration || '').split(',')[0].trim()
  const n = parseFloat(first)
  if (!Number.isFinite(n)) return 0
  return first.endsWith('ms') ? n : n * 1000
}

watch(
  () => props.state,
  (state, previous) => {
    if (state !== 'error' || previous === 'error') {
      if (state !== 'error' && shaking.value) {
        stopShakeTimer()
        shaking.value = false
      }
      return
    }
    shaking.value = true
    void nextTick(() => {
      const el = fieldRef.value
      const ms = el ? shakeDuration(el) : 0
      if (ms <= 0) {
        finishError()
        return
      }
      // animationend is the signal. The timer is a floor for a tab that is
      // not painting, where it never comes.
      shakeTimer = setTimeout(finishError, ms + 100)
    })
  },
)

// ─── Lifecycle and the exposed methods ────────────────────

function focus() {
  const el = inputRef.value
  if (!el) return
  el.focus()
  const len = el.value.length
  el.setSelectionRange(len, len)
  syncSelection()
}

function clear() {
  inputRef.value?.focus()
  commit('', 0)
}

onMounted(() => {
  if (props.autofocus && !props.disabled) focus()
})

onBeforeUnmount(() => {
  stopShakeTimer()
  document.removeEventListener('selectionchange', onSelectionChange)
})

defineExpose({ focus, clear })
</script>

<style lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;

/*
 * A row of slots drawn under one transparent input. Each slot is a box in
 * the field colours, and the active one carries the focus ring. The slots
 * shrink together when the row is wider than its container, so six slots
 * fit a phone at any size and the desktop row is never touched.
 */
.nb-code-input {
  --nb-code-input-slot-w: 44px;
  --nb-code-input-slot-h: var(--nb-field-height-lg);
  --nb-code-input-font-size: var(--nb-type-heading-02-size);
  --nb-code-input-gap: var(--nb-spacing-8);
  // The offset between one slot and the next as the code turns green. It is
  // a delay between slots, not a duration: each slot's own change reads
  // --nb-motion-quick.
  --nb-code-input-stagger: 30ms;

  display: inline-flex;
  flex-direction: column;
  gap: var(--nb-field-label-gap);
  min-width: 0;
  max-width: 100%;
  vertical-align: top;
  font-family: var(--nb-font-family-sans);

  &--sm {
    --nb-code-input-slot-w: 36px;
    --nb-code-input-slot-h: var(--nb-field-height-md);
    --nb-code-input-font-size: var(--nb-type-heading-01-size);
  }

  &--lg {
    --nb-code-input-slot-w: 52px;
    --nb-code-input-slot-h: calc(var(--nb-base-unit) * 7);
    --nb-code-input-font-size: var(--nb-type-heading-03-size);
  }

  &__field {
    position: relative;
    display: flex;
    min-width: 0;
    max-width: 100%;
  }

  &__field--shake {
    animation: nb-code-input-shake var(--nb-motion-long) var(--nb-ease-standard);
  }

  &__slots {
    display: flex;
    align-items: center;
    gap: var(--nb-code-input-gap);
    min-width: 0;
    max-width: 100%;
  }

  &__slot {
    position: relative;
    display: flex;
    // A width, not only a flex basis: an empty slot's intrinsic width is
    // otherwise its border, and the row would size itself to its gaps. It
    // still shrinks (min-width 0) when the container is narrower.
    flex: 0 1 auto;
    width: var(--nb-code-input-slot-w);
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: var(--nb-code-input-slot-h);
    box-sizing: border-box;
    background: var(--nb-c-field-bg);
    border: 1px solid var(--nb-c-field-border);
    @include radius.standalone(control-sm);
    color: var(--nb-c-text);
    font-family: var(--nb-font-family-mono);
    font-size: var(--nb-code-input-font-size);
    font-weight: 400;
    line-height: 1;
    transition:
      border-color var(--nb-motion-short) var(--nb-ease-standard),
      box-shadow var(--nb-motion-short) var(--nb-ease-standard),
      opacity var(--nb-motion-short) var(--nb-ease-standard);

    &--active {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }
  }

  &__separator {
    flex: none;
    color: var(--nb-c-text-muted);
    font-family: var(--nb-font-family-mono);
    font-size: var(--nb-code-input-font-size);
    line-height: 1;
  }

  &__caret {
    position: absolute;
    top: 25%;
    bottom: 25%;
    left: 50%;
    width: 1px;
    background: var(--nb-c-text);
    // A loop: a text caret's blink, at the pace of a native one.
    animation: nb-code-input-caret 1000ms step-end infinite;
  }

  /*
   * The real input, over the slots and as large as the row, so a tap
   * anywhere on the code focuses it. Its text, caret and selection are
   * invisible: the slots draw them. The text is never below 16px, or iOS
   * zooms the page in when it takes focus.
   */
  &__input {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    appearance: none;
    background: transparent;
    color: transparent;
    caret-color: transparent;
    font-size: max(16px, var(--nb-field-font-size));
    cursor: text;
    // Forced colours would paint the hidden text back over the slots.
    forced-color-adjust: none;

    &::selection {
      background: transparent;
      color: transparent;
    }

    // Autofill paints its own fill over the field. Clipped to the text,
    // which is transparent, it paints nothing. Two rules, because a browser
    // that does not know one of the selectors drops the whole list.
    &:autofill {
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &:-webkit-autofill {
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &:disabled {
      cursor: not-allowed;
    }

    &:read-only {
      cursor: default;
    }
  }

  &__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  &__status {
    display: grid;
    min-height: var(--nb-field-height-sm);

    > * {
      grid-area: 1 / 1;
      align-self: center;
    }
  }

  &__error:empty {
    display: none;
  }

  // ─── States ─────────────────────────────────────────────

  // Checking: the code stays readable, quieter, while the indicator turns.
  &--verifying &__slot {
    opacity: 0.6;
  }

  // Accepted: the borders turn from left to right, one slot after another.
  &--success &__slot {
    border-color: var(--nb-c-success);
    box-shadow: inset 0 0 0 1px var(--nb-c-success);
    transition:
      border-color var(--nb-motion-quick) var(--nb-ease-enter),
      box-shadow var(--nb-motion-quick) var(--nb-ease-enter);
    transition-delay: calc(
      var(--nb-code-input-index, 0) * var(--nb-code-input-stagger)
    );
  }

  &--success .nb-inline-loading__icon {
    animation: nb-code-input-fade-in var(--nb-motion-short) var(--nb-ease-enter);
  }

  &--error &__slot {
    border-color: var(--nb-c-danger);
    box-shadow: inset 0 0 0 1px var(--nb-c-danger);
  }

  &--disabled &__slot {
    background: var(--nb-c-field-bg-disabled, var(--nb-c-field-bg));
    border-color: var(--nb-c-field-border-disabled, var(--nb-c-field-border));
    opacity: var(--nb-field-disabled-opacity);
  }

  // Reduced motion: no shake, no stagger and a steady caret. The colours and
  // the message carry the result on their own.
  @include motion.reduced {
    &__field--shake,
    &__caret,
    &--success .nb-inline-loading__icon {
      animation: none;
    }

    &--success &__slot {
      transition-delay: 0s;
    }
  }
}

// One horizontal shake: three swings of 6px, back to rest.
@keyframes nb-code-input-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-6px);
  }

  45% {
    transform: translateX(6px);
  }

  70% {
    transform: translateX(-6px);
  }

  90% {
    transform: translateX(0);
  }
}

@keyframes nb-code-input-caret {
  50% {
    opacity: 0;
  }
}

@keyframes nb-code-input-fade-in {
  from {
    opacity: 0;
  }
}
</style>
