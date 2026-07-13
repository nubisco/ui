<template>
  <div ref="rootRef" :class="rootClasses">
    <!-- DEFAULT variant -->
    <template v-if="variant === 'default'">
      <slot v-if="$slots.label" name="label" />
      <NbLabel
        v-else-if="label && !perFieldLabels"
        :for="inputId"
        :required="required"
        :disabled="disabled"
      >
        {{ label }}
      </NbLabel>

      <NbGrid
        dir="row"
        :gap="type === 'range' ? 'sm' : undefined"
        class="nb-date-picker__fields"
      >
        <!-- Start / single date input -->
        <div class="nb-date-picker__col">
          <NbLabel
            v-if="perFieldLabels && label"
            :for="inputId"
            :required="required"
            :disabled="disabled"
          >
            {{ label }}
          </NbLabel>
          <div
            class="nb-date-picker__input-wrapper"
            :class="startWrapperClasses"
          >
            <input
              :id="inputId"
              ref="inputRef"
              v-bind="$attrs"
              type="text"
              class="nb-date-picker__field"
              :value="displayValue"
              :placeholder="placeholder || dateFormatHint"
              :disabled="disabled"
              :readonly="readonly"
              :required="required"
              :name="name"
              :aria-invalid="error ? true : undefined"
              :aria-describedby="startDescribedBy"
              @input="onTextInput($event)"
              @focus="onFocus"
              @blur="onBlur"
              @keydown="onInputKeydown"
            />
            <button
              v-if="type !== 'simple'"
              type="button"
              class="nb-date-picker__icon"
              :disabled="disabled || readonly"
              tabindex="-1"
              :aria-label="
                modelValue
                  ? `Change date, ${formatForDisplay(modelValue)}`
                  : 'Choose date'
              "
              @click="toggleCalendar"
            >
              <NbIcon name="calendar" :size="16" />
            </button>
          </div>
        </div>

        <!-- End date input (range only) -->
        <div v-if="type === 'range'" class="nb-date-picker__col">
          <NbLabel
            v-if="perFieldLabels"
            :for="endInputId"
            :required="required"
            :disabled="disabled"
          >
            {{ endLabel }}
          </NbLabel>
          <div class="nb-date-picker__input-wrapper" :class="endWrapperClasses">
            <input
              :id="endInputId"
              ref="endInputRef"
              type="text"
              class="nb-date-picker__field"
              :value="endDisplayValue"
              :placeholder="endPlaceholder || dateFormatHint"
              :disabled="disabled"
              :readonly="readonly"
              :required="required"
              :aria-invalid="endError ? true : undefined"
              :aria-describedby="endDescribedBy"
              @input="onEndTextInput($event)"
              @focus="onFocus"
              @blur="onBlur"
              @keydown="onInputKeydown"
            />
            <button
              type="button"
              class="nb-date-picker__icon"
              :disabled="disabled || readonly"
              tabindex="-1"
              :aria-label="
                endValue
                  ? `Change end date, ${formatForDisplay(endValue)}`
                  : 'Choose end date'
              "
              @click="toggleCalendar"
            >
              <NbIcon name="calendar" :size="16" />
            </button>
          </div>
        </div>
      </NbGrid>

      <NbMessage
        v-if="startMessage"
        :id="startMsgId"
        :variant="startMessage.variant"
        class="nb-date-picker__message"
        >{{ startMessage.text }}</NbMessage
      >
      <NbMessage
        v-if="endMessage"
        :id="endMsgId"
        :variant="endMessage.variant"
        class="nb-date-picker__message"
        >{{ endMessage.text }}</NbMessage
      >
      <NbMessage
        v-if="!startMessage && !endMessage && helper"
        :id="helperId"
        variant="helper"
        class="nb-date-picker__message"
        >{{ helper }}</NbMessage
      >
    </template>

    <!-- FLUID variant -->
    <template v-else-if="variant === 'fluid'">
      <NbGrid
        dir="row"
        :gap="type === 'range' ? 'sm' : undefined"
        class="nb-date-picker__fields"
      >
        <div
          class="nb-date-picker__input-wrapper nb-date-picker__input-wrapper--fluid"
          :class="startWrapperClasses"
        >
          <div
            v-if="label || $slots.label || startFluidMessage"
            class="nb-date-picker__inner-header"
          >
            <slot v-if="$slots.label" name="label" />
            <label v-else :for="inputId" class="nb-date-picker__inner-label">
              {{ label }}
              <span
                v-if="required"
                class="nb-date-picker__asterisk"
                aria-hidden="true"
                >*</span
              >
            </label>
            <NbMessage
              v-if="startFluidMessage"
              :variant="startFluidMessage.variant"
              icon-only
              class="nb-date-picker__inner-message"
            >
              {{ startFluidMessage.text }}
            </NbMessage>
          </div>
          <div class="nb-date-picker__fluid-row">
            <input
              :id="inputId"
              ref="inputRef"
              v-bind="$attrs"
              type="text"
              class="nb-date-picker__field"
              :value="displayValue"
              :placeholder="placeholder || dateFormatHint"
              :disabled="disabled"
              :readonly="readonly"
              :required="required"
              :name="name"
              :aria-invalid="error ? true : undefined"
              @input="onTextInput($event)"
              @focus="onFocus"
              @blur="onBlur"
              @keydown="onInputKeydown"
            />
            <button
              v-if="type !== 'simple'"
              type="button"
              class="nb-date-picker__icon"
              :disabled="disabled || readonly"
              tabindex="-1"
              :aria-label="
                modelValue
                  ? `Change date, ${formatForDisplay(modelValue)}`
                  : 'Choose date'
              "
              @click="toggleCalendar"
            >
              <NbIcon name="calendar" :size="16" />
            </button>
          </div>
        </div>

        <div
          v-if="type === 'range'"
          class="nb-date-picker__input-wrapper nb-date-picker__input-wrapper--fluid"
          :class="endWrapperClasses"
        >
          <div
            v-if="endFluidLabel || endMessage"
            class="nb-date-picker__inner-header"
          >
            <label :for="endInputId" class="nb-date-picker__inner-label">
              {{ endFluidLabel }}
              <span
                v-if="required"
                class="nb-date-picker__asterisk"
                aria-hidden="true"
                >*</span
              >
            </label>
            <NbMessage
              v-if="endMessage"
              :variant="endMessage.variant"
              icon-only
              class="nb-date-picker__inner-message"
            >
              {{ endMessage.text }}
            </NbMessage>
          </div>
          <div class="nb-date-picker__fluid-row">
            <input
              :id="endInputId"
              ref="endInputRef"
              type="text"
              class="nb-date-picker__field"
              :value="endDisplayValue"
              :placeholder="endPlaceholder || dateFormatHint"
              :disabled="disabled"
              :readonly="readonly"
              :required="required"
              :aria-invalid="endError ? true : undefined"
              @input="onEndTextInput($event)"
              @focus="onFocus"
              @blur="onBlur"
              @keydown="onInputKeydown"
            />
            <button
              type="button"
              class="nb-date-picker__icon"
              :disabled="disabled || readonly"
              tabindex="-1"
              :aria-label="
                endValue
                  ? `Change end date, ${formatForDisplay(endValue)}`
                  : 'Choose end date'
              "
              @click="toggleCalendar"
            >
              <NbIcon name="calendar" :size="16" />
            </button>
          </div>
        </div>
      </NbGrid>
    </template>
  </div>

  <!-- Calendar dialog teleported to body -->
  <Teleport to="body">
    <div
      v-if="calendarOpen"
      ref="calendarRef"
      role="dialog"
      aria-modal="true"
      :aria-label="label ? `${label} calendar` : 'Date picker'"
      class="nb-date-picker__calendar"
      :style="calendarStyle"
      @keydown="onCalendarKeydown"
      @mousedown.prevent
    >
      <!-- Calendar header -->
      <div class="nb-date-picker__cal-header">
        <button
          type="button"
          class="nb-date-picker__cal-nav"
          aria-label="Previous year"
          @click="prevYear"
        >
          <NbIcon name="caret-double-left" :size="16" />
        </button>
        <button
          type="button"
          class="nb-date-picker__cal-nav"
          aria-label="Previous month"
          @click="prevMonth"
        >
          <NbIcon name="caret-left" :size="16" />
        </button>
        <span
          :id="calTitleId"
          class="nb-date-picker__cal-title"
          aria-live="polite"
        >
          {{ calMonthLabel }}
        </span>
        <button
          type="button"
          class="nb-date-picker__cal-nav"
          aria-label="Next month"
          @click="nextMonth"
        >
          <NbIcon name="caret-right" :size="16" />
        </button>
        <button
          type="button"
          class="nb-date-picker__cal-nav"
          aria-label="Next year"
          @click="nextYear"
        >
          <NbIcon name="caret-double-right" :size="16" />
        </button>
      </div>

      <!-- Day grid -->
      <table
        role="grid"
        :aria-labelledby="calTitleId"
        class="nb-date-picker__cal-table"
      >
        <thead>
          <tr class="nb-date-picker__cal-weekdays">
            <th
              v-for="d in weekdayData"
              :key="d.narrow"
              scope="col"
              class="nb-date-picker__cal-weekday"
              :abbr="d.full"
            >
              {{ d.narrow }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in calRows" :key="ri">
            <td
              v-for="cell in row"
              :key="cell.key"
              role="gridcell"
              :aria-selected="cell.isSelected || undefined"
              :aria-disabled="cell.isDisabled || undefined"
            >
              <button
                type="button"
                class="nb-date-picker__cal-day"
                :class="{
                  'nb-date-picker__cal-day--outside': !cell.inMonth,
                  'nb-date-picker__cal-day--today': cell.isToday,
                  'nb-date-picker__cal-day--selected': cell.isSelected,
                  'nb-date-picker__cal-day--in-range': cell.inRange,
                  'nb-date-picker__cal-day--range-start': cell.isRangeStart,
                  'nb-date-picker__cal-day--range-end': cell.isRangeEnd,
                  'nb-date-picker__cal-day--disabled': cell.isDisabled,
                  'nb-date-picker__cal-day--focused': cell.date === focusedDate,
                }"
                :tabindex="cell.date === focusedDate ? 0 : -1"
                :disabled="cell.isDisabled"
                :aria-label="formatDayLabel(cell.date)"
                :data-date="cell.date"
                @click="selectDay(cell.date)"
              >
                {{ cell.day }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from 'vue'
import type { IDatePickerProps } from './DatePicker.d'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbIcon from './Icon.vue'
import NbGrid from './Grid.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<IDatePickerProps>(), {
  modelValue: null,
  type: 'single',
  endValue: null,
  variant: 'default',
  size: 'md',
  label: '',
  placeholder: '',
  endPlaceholder: '',
  endLabel: '',
  helper: '',
  error: '',
  warning: '',
  endError: '',
  endWarning: '',
  disabled: false,
  required: false,
  readonly: false,
  min: undefined,
  max: undefined,
  disabledDates: undefined,
  weekStart: 1,
  locale: undefined,
  id: undefined,
  name: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'update:endValue': [value: string | null]
  change: [value: string | null]
}>()

const autoId = `nb-date-picker-${useId()}`
const inputId = computed(() => props.id ?? autoId)
const endInputId = computed(() => `${inputId.value}-end`)
const helperId = computed(() => `${inputId.value}-helper`)
const startMsgId = computed(() => `${inputId.value}-message`)
const endMsgId = computed(() => `${inputId.value}-end-message`)
const calTitleId = computed(() => `${inputId.value}-cal-title`)

const focusedField = ref<'start' | 'end' | null>(null)
const focused = computed(() => focusedField.value !== null)
const calendarOpen = ref(false)
const focusedDate = ref<string>(toIso(new Date()))
const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const endInputRef = ref<HTMLInputElement | null>(null)
const calendarRef = ref<HTMLElement | null>(null)
const calendarStyle = ref({
  position: 'fixed' as const,
  top: '0px',
  left: '0px',
  zIndex: '9999',
})

// Which field is active for range picking
const rangeTarget = ref<'start' | 'end'>('start')

const resolvedLocale = computed(
  () => props.locale || navigator.language || 'pt-PT',
)

const dateFormatHint = computed(() => {
  const parts = new Intl.DateTimeFormat(resolvedLocale.value).formatToParts(
    new Date(2000, 0, 15),
  )
  return parts
    .map((p) => {
      if (p.type === 'day') return 'dd'
      if (p.type === 'month') return 'mm'
      if (p.type === 'year') return 'yyyy'
      return p.value
    })
    .join('')
})

function formatForDisplay(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(resolvedLocale.value)
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(resolvedLocale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const displayValue = computed(() => formatForDisplay(props.modelValue ?? null))
const endDisplayValue = computed(() => formatForDisplay(props.endValue ?? null))

// ── Validation messages ────────────────────────────────────
// Range fields validate independently: `error`/`warning` mark only the
// start field, `endError`/`endWarning` only the end field, so users can
// tell which of the two needs correction.
interface IFieldMessage {
  variant: 'error' | 'warning' | 'helper'
  text: string
}

const startMessage = computed<IFieldMessage | null>(() => {
  if (props.error) return { variant: 'error', text: props.error }
  if (props.warning) return { variant: 'warning', text: props.warning }
  return null
})

const endMessage = computed<IFieldMessage | null>(() => {
  if (props.type !== 'range') return null
  if (props.endError) return { variant: 'error', text: props.endError }
  if (props.endWarning) return { variant: 'warning', text: props.endWarning }
  return null
})

// Fluid variant surfaces messages as an icon-only NbMessage inside the
// field header, matching NbTextInput's fluid behaviour.
const startFluidMessage = computed<IFieldMessage | null>(() => {
  if (startMessage.value) return startMessage.value
  if (props.helper) return { variant: 'helper', text: props.helper }
  return null
})

const startDescribedBy = computed(() => {
  if (props.variant !== 'default') return undefined
  if (startMessage.value) return startMsgId.value
  return props.helper ? helperId.value : undefined
})

const endDescribedBy = computed(() => {
  if (props.variant !== 'default') return undefined
  if (endMessage.value) return endMsgId.value
  return props.helper ? helperId.value : undefined
})

// Range with an explicit endLabel renders one label per field
const perFieldLabels = computed(
  () => props.type === 'range' && !!props.endLabel,
)

const endFluidLabel = computed(() => props.endLabel || props.endPlaceholder)

// ── Date constraints ───────────────────────────────────────
function isDateDisabled(iso: string): boolean {
  if (props.min != null && iso < props.min) return true
  if (props.max != null && iso > props.max) return true
  if (!props.disabledDates) return false
  return typeof props.disabledDates === 'function'
    ? props.disabledDates(iso)
    : props.disabledDates.includes(iso)
}

function parseInput(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed + 'T00:00:00')
    return isNaN(d.getTime()) ? null : trimmed
  }
  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    return toIso(d)
  }
  return null
}

function onTextInput(e: Event) {
  const text = (e.target as HTMLInputElement).value
  const parsed = parseInput(text)
  if (parsed && isDateDisabled(parsed)) return
  if (parsed || text === '') {
    emit('update:modelValue', parsed)
    emit('change', parsed)
  }
}

function onEndTextInput(e: Event) {
  const text = (e.target as HTMLInputElement).value
  const parsed = parseInput(text)
  if (parsed && isDateDisabled(parsed)) return
  if (parsed || text === '') {
    emit('update:endValue', parsed)
  }
}

function onFocus(e: FocusEvent) {
  focusedField.value = e.target === endInputRef.value ? 'end' : 'start'
  if (props.type !== 'simple' && !props.readonly) {
    rangeTarget.value = focusedField.value
    if (calendarOpen.value) {
      // Already open: re-anchor the calendar under the newly focused field
      updateCalendarPosition()
    } else {
      openCalendar()
    }
  }
}

function onBlur() {
  focusedField.value = null
}

function onInputKeydown(e: KeyboardEvent) {
  if (props.type === 'simple' || props.readonly) return

  switch (e.key) {
    case 'Escape':
      if (calendarOpen.value) {
        closeCalendar()
        e.preventDefault()
      }
      break
    case 'ArrowDown':
      e.preventDefault()
      if (!calendarOpen.value) {
        openCalendar()
      }
      nextTick(focusDayInGrid)
      break
    case 'Enter':
      if (!calendarOpen.value) {
        e.preventDefault()
        openCalendar()
        nextTick(focusDayInGrid)
      }
      break
  }
}

// ── Calendar open/close ────────────────────────────────────
function updateCalendarPosition() {
  // Anchor to the active field: the end wrapper when picking the range end
  const wrappers = rootRef.value?.querySelectorAll(
    '.nb-date-picker__input-wrapper',
  )
  if (!wrappers?.length) return
  const wrapper =
    rangeTarget.value === 'end' && wrappers.length > 1
      ? wrappers[1]
      : wrappers[0]
  const rect = wrapper.getBoundingClientRect()
  calendarStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    zIndex: '9999',
  }
}

function openCalendar() {
  if (props.disabled || props.readonly || props.type === 'simple') return
  if (calendarOpen.value) return

  calendarOpen.value = true

  // Determine which date to focus: the selected value, or today
  const targetDate =
    rangeTarget.value === 'end' && props.endValue
      ? props.endValue
      : props.modelValue
  const target = targetDate ? new Date(targetDate + 'T00:00:00') : new Date()
  calYear.value = target.getFullYear()
  calMonth.value = target.getMonth()
  focusedDate.value = targetDate || toIso(new Date())

  updateCalendarPosition()
}

function closeCalendar() {
  if (!calendarOpen.value) return
  calendarOpen.value = false

  // Return focus to the triggering input
  nextTick(() => {
    if (rangeTarget.value === 'end' && endInputRef.value) {
      endInputRef.value.focus()
    } else {
      inputRef.value?.focus()
    }
  })
}

function toggleCalendar() {
  if (calendarOpen.value) {
    closeCalendar()
  } else {
    rangeTarget.value = 'start'
    openCalendar()
    nextTick(focusDayInGrid)
  }
}

function focusDayInGrid() {
  nextTick(() => {
    const btn = calendarRef.value?.querySelector<HTMLButtonElement>(
      `[data-date="${focusedDate.value}"]`,
    )
    btn?.focus()
  })
}

function selectDay(dateStr: string) {
  if (isDateDisabled(dateStr)) return
  if (props.type === 'range') {
    if (rangeTarget.value === 'start') {
      emit('update:modelValue', dateStr)
      emit('change', dateStr)
      rangeTarget.value = 'end'
      // Focus the end input and keep calendar open
      focusedDate.value = dateStr
      nextTick(() => endInputRef.value?.focus())
    } else {
      if (props.modelValue && dateStr < props.modelValue) {
        emit('update:endValue', props.modelValue)
        emit('update:modelValue', dateStr)
        emit('change', dateStr)
      } else {
        emit('update:endValue', dateStr)
      }
      closeCalendar()
    }
  } else {
    emit('update:modelValue', dateStr)
    emit('change', dateStr)
    closeCalendar()
  }
}

// ── Calendar grid keyboard navigation (WAI-ARIA pattern) ───
function onCalendarKeydown(e: KeyboardEvent) {
  const d = new Date(focusedDate.value + 'T00:00:00')
  let handled = true

  switch (e.key) {
    case 'ArrowRight':
      moveFocusBy(d, 1)
      break
    case 'ArrowLeft':
      moveFocusBy(d, -1)
      break
    case 'ArrowDown':
      moveFocusBy(d, 7)
      break
    case 'ArrowUp':
      moveFocusBy(d, -7)
      break
    case 'Home':
      moveFocusToWeekEdge(d, 'start')
      break
    case 'End':
      moveFocusToWeekEdge(d, 'end')
      break
    case 'PageUp':
      if (e.shiftKey) {
        moveFocusToMonth(d, -12)
      } else {
        moveFocusToMonth(d, -1)
      }
      break
    case 'PageDown':
      if (e.shiftKey) {
        moveFocusToMonth(d, 12)
      } else {
        moveFocusToMonth(d, 1)
      }
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      selectDay(focusedDate.value)
      return
    case 'Escape':
      closeCalendar()
      break
    case 'Tab':
      // Close the calendar and let focus move naturally back to the input
      closeCalendar()
      return
    default:
      handled = false
  }

  if (handled) e.preventDefault()
}

function moveFocusBy(current: Date, days: number) {
  const next = new Date(current)
  next.setDate(next.getDate() + days)
  setFocusedDate(next)
}

function moveFocusToWeekEdge(current: Date, edge: 'start' | 'end') {
  let dow = current.getDay()
  if (props.weekStart === 1) {
    dow = dow === 0 ? 6 : dow - 1
  }
  const offset = edge === 'start' ? -dow : 6 - dow
  const next = new Date(current)
  next.setDate(next.getDate() + offset)
  setFocusedDate(next)
}

function moveFocusToMonth(current: Date, monthDelta: number) {
  const next = new Date(current)
  next.setMonth(next.getMonth() + monthDelta)
  // If the target month doesn't have that day (e.g. Jan 31 -> Feb),
  // clamp to the last day of the target month
  if (next.getDate() !== current.getDate()) {
    next.setDate(0) // last day of previous month
  }
  setFocusedDate(next)
}

function setFocusedDate(d: Date) {
  const iso = toIso(d)
  // Focus stays within min/max bounds; individually disabled dates remain
  // focusable (but not selectable) so keyboard users can traverse them
  if (props.min != null && iso < props.min) return
  if (props.max != null && iso > props.max) return

  focusedDate.value = iso
  // Update the calendar month view if the date moved outside the current month
  calYear.value = d.getFullYear()
  calMonth.value = d.getMonth()
  focusDayInGrid()
}

// ── Click outside ──────────────────────────────────────────
function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const inRoot = rootRef.value?.contains(target) ?? false
  const inCalendar = calendarRef.value?.contains(target) ?? false
  if (!inRoot && !inCalendar) closeCalendar()
}

function onScrollOrResize() {
  if (calendarOpen.value) updateCalendarPosition()
}

watch(calendarOpen, (val) => {
  if (val) {
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
  } else {
    document.removeEventListener('mousedown', onClickOutside)
    window.removeEventListener('scroll', onScrollOrResize, true)
    window.removeEventListener('resize', onScrollOrResize)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

// ── Mini calendar state ────────────────────────────────────
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth())

// Move the visible month by a delta, keeping the focused day-of-month
// (clamped to the target month's length)
function shiftCalendar(monthDelta: number) {
  const total = calYear.value * 12 + calMonth.value + monthDelta
  calYear.value = Math.floor(total / 12)
  calMonth.value = ((total % 12) + 12) % 12
  const curDay = new Date(focusedDate.value + 'T00:00:00').getDate()
  const lastDay = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  focusedDate.value = toIso(
    new Date(calYear.value, calMonth.value, Math.min(curDay, lastDay)),
  )
  focusDayInGrid()
}

const prevMonth = () => shiftCalendar(-1)
const nextMonth = () => shiftCalendar(1)
const prevYear = () => shiftCalendar(-12)
const nextYear = () => shiftCalendar(12)

const calMonthLabel = computed(() => {
  const d = new Date(calYear.value, calMonth.value, 1)
  const fmt = d.toLocaleDateString(resolvedLocale.value, {
    month: 'long',
    year: 'numeric',
  })
  return fmt.charAt(0).toUpperCase() + fmt.slice(1)
})

// Weekday labels with both narrow (display) and full (abbr for screen readers)
const weekdayData = computed(() => {
  const result: { narrow: string; full: string }[] = []
  const base = new Date(2024, 0, props.weekStart === 0 ? 7 : 1)
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const narrow = d
      .toLocaleDateString(resolvedLocale.value, { weekday: 'narrow' })
      .toUpperCase()
    const full = d.toLocaleDateString(resolvedLocale.value, { weekday: 'long' })
    result.push({ narrow, full: full.charAt(0).toUpperCase() + full.slice(1) })
  }
  return result
})

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayStr = computed(() => toIso(new Date()))

interface ICalDay {
  key: string
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  inRange: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  isDisabled: boolean
}

const calCells = computed<ICalDay[]>(() => {
  const year = calYear.value
  const month = calMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDow = firstDay.getDay()
  if (props.weekStart === 1) {
    startDow = startDow === 0 ? 6 : startDow - 1
  }

  const result: ICalDay[] = []
  const mv = props.modelValue ?? null
  const ev = props.endValue ?? null
  const rangeStart = mv && ev ? (mv < ev ? mv : ev) : null
  const rangeEnd = mv && ev ? (mv < ev ? ev : mv) : null

  function makeCell(d: Date, inMonth: boolean): ICalDay {
    const dateStr = toIso(d)
    return {
      key: dateStr,
      date: dateStr,
      day: d.getDate(),
      inMonth,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === mv || dateStr === ev,
      inRange:
        rangeStart != null &&
        rangeEnd != null &&
        dateStr > rangeStart &&
        dateStr < rangeEnd,
      isRangeStart: dateStr === rangeStart && rangeEnd != null,
      isRangeEnd: dateStr === rangeEnd && rangeStart != null,
      isDisabled: isDateDisabled(dateStr),
    }
  }

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    result.push(makeCell(new Date(year, month, -i), false))
  }

  // Current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    result.push(makeCell(new Date(year, month, day), true))
  }

  // Next month padding
  const remaining = 7 - (result.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      result.push(makeCell(new Date(year, month + 1, i), false))
    }
  }

  return result
})

// Group flat cells into rows of 7 for the <table> structure
const calRows = computed(() => {
  const rows: ICalDay[][] = []
  for (let i = 0; i < calCells.value.length; i += 7) {
    rows.push(calCells.value.slice(i, i + 7))
  }
  return rows
})

const rootClasses = computed(() => [
  'nb-date-picker',
  `nb-date-picker--${props.variant}`,
  `nb-date-picker--${props.size}`,
  `nb-date-picker--${props.type}`,
  {
    'nb-date-picker--focused': focused.value,
    'nb-date-picker--open': calendarOpen.value,
    'nb-date-picker--error': !!props.error || !!props.endError,
    'nb-date-picker--warning':
      !props.error &&
      !props.endError &&
      (!!props.warning || !!props.endWarning),
    'nb-date-picker--disabled': props.disabled,
    'nb-date-picker--readonly': props.readonly,
  },
])

const startWrapperClasses = computed(() => ({
  'nb-date-picker__input-wrapper--focused': focusedField.value === 'start',
  'nb-date-picker__input-wrapper--error': !!props.error,
  'nb-date-picker__input-wrapper--warning': !props.error && !!props.warning,
  'nb-date-picker__input-wrapper--disabled': props.disabled,
  'nb-date-picker__input-wrapper--readonly': props.readonly,
}))

const endWrapperClasses = computed(() => ({
  'nb-date-picker__input-wrapper--focused': focusedField.value === 'end',
  'nb-date-picker__input-wrapper--error': !!props.endError,
  'nb-date-picker__input-wrapper--warning':
    !props.endError && !!props.endWarning,
  'nb-date-picker__input-wrapper--disabled': props.disabled,
  'nb-date-picker__input-wrapper--readonly': props.readonly,
}))

defineExpose({
  open: openCalendar,
  close: closeCalendar,
  focus: () => inputRef.value?.focus(),
})
</script>

<style lang="scss">
.nb-date-picker {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--nb-font-family-sans, sans-serif);
  --field-h: var(--nb-field-height-md);

  &--sm {
    --field-h: var(--nb-field-height-sm);
  }
  &--md {
    --field-h: var(--nb-field-height-md);
  }
  &--lg {
    --field-h: var(--nb-field-height-lg);
  }
}

.nb-date-picker__fields {
  flex: 1;
}

.nb-date-picker__col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.nb-date-picker__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  background: var(--nb-c-field-bg);
  border-bottom: 1px solid var(--nb-c-field-border);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &--focused {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }

  &--error {
    border-bottom-color: var(--nb-c-danger);
    box-shadow: inset 0 -1px 0 0 var(--nb-c-danger);
  }

  &--warning {
    border-bottom-color: var(--nb-c-warning);
    box-shadow: inset 0 -1px 0 0 var(--nb-c-warning);
  }

  &--disabled {
    opacity: var(--nb-field-disabled-opacity);
    cursor: not-allowed;
  }

  &--readonly {
    background: transparent;
  }

  &--fluid {
    flex-direction: column;
    align-items: stretch;
    min-height: calc(var(--nb-base-unit) * 8);
    padding-top: 8px;
  }
}

.nb-date-picker__field {
  flex: 1;
  min-width: 0;
  height: var(--field-h);
  padding: 0 var(--nb-field-padding-h);
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  font-size: var(--nb-field-font-size);
  font-weight: 400;
  color: var(--nb-c-text);
  line-height: var(--nb-field-line-height);

  &::placeholder {
    color: var(--nb-c-text-subtle);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:read-only {
    cursor: default;
  }

  .nb-date-picker__input-wrapper--fluid & {
    height: auto;
    flex: 1;
    padding: 0 var(--nb-field-padding-h) 10px;
    font-size: var(--nb-font-size-14);
  }
}

.nb-date-picker__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0 var(--nb-field-padding-h) 0 0;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  transition: color 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    color: var(--nb-c-text);
  }

  &:disabled {
    cursor: not-allowed;
  }

  .nb-date-picker__input-wrapper--fluid & {
    padding: 0 var(--nb-field-padding-h) 10px 0;
  }
}

.nb-date-picker__inner-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--nb-field-padding-h);
  margin-bottom: 4px;
}

.nb-date-picker__inner-label {
  flex: 1;
  min-width: 0;
  font-size: var(--nb-font-size-12);
  font-weight: 500;
  color: var(--nb-c-text-muted);
  letter-spacing: 0.02em;
  cursor: default;
  user-select: none;
}

.nb-date-picker__asterisk {
  color: var(--nb-c-danger);
}

.nb-date-picker__fluid-row {
  display: flex;
  align-items: center;
  flex: 1;
}

.nb-date-picker__message {
  font-size: var(--nb-font-size-12);
}

// ── Calendar dialog ────────────────────────────────────────
.nb-date-picker__calendar {
  width: 336px;
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.2);
  padding: 4px 4px 8px;
  box-sizing: border-box;
}

.nb-date-picker__cal-header {
  display: flex;
  align-items: center;
  padding: 8px 4px;
}

.nb-date-picker__cal-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring, var(--nb-c-primary));
    outline-offset: -2px;
  }
}

.nb-date-picker__cal-title {
  flex: 1;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--nb-c-text);
}

.nb-date-picker__cal-table {
  width: 100%;
  border-collapse: collapse;
  padding: 0 4px;

  td {
    padding: 0;
    text-align: center;
  }
}

.nb-date-picker__cal-weekdays {
  th {
    padding: 0;
  }
}

.nb-date-picker__cal-weekday {
  height: 32px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--nb-c-text-muted);
  letter-spacing: 0.02em;
  text-align: center;
  vertical-align: middle;
}

.nb-date-picker__cal-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--nb-c-text);
  background: none;
  border: 2px solid transparent;
  cursor: pointer;
  transition:
    background 0.1s,
    color 0.1s;
  position: relative;

  &:hover:not(:disabled) {
    background: var(--nb-c-surface-hover);
  }

  &--outside {
    color: var(--nb-c-text-muted);
  }

  &--today {
    color: var(--nb-c-primary);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background: var(--nb-c-primary);
    }
  }

  &--selected {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
    font-weight: 600;

    &::after {
      display: none;
    }

    &:hover:not(:disabled) {
      background: color-mix(
        in srgb,
        var(--nb-c-primary) 85%,
        var(--nb-c-black)
      );
    }
  }

  &--in-range {
    background: color-mix(in srgb, var(--nb-c-primary) 15%, transparent);
  }

  &--range-start {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
  }

  &--range-end {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
  }

  &--disabled {
    color: var(--nb-c-text-muted);
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--focused,
  &:focus-visible {
    border-color: var(--nb-c-focus-ring, var(--nb-c-primary));
    outline: none;
  }
}
</style>
