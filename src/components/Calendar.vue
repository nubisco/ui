<template>
  <div class="nb-calendar">
    <!-- Header: month navigation -->
    <div class="nb-calendar__header">
      <button class="nb-calendar__today-btn" @click="goToday">Today</button>
      <button class="nb-calendar__nav" @click="prevMonth">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button class="nb-calendar__nav" @click="nextMonth">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <span class="nb-calendar__title">{{ monthLabel }}</span>
    </div>

    <!-- Day-of-week headers -->
    <div class="nb-calendar__weekdays">
      <div v-for="day in weekdayLabels" :key="day" class="nb-calendar__weekday">
        {{ day }}
      </div>
    </div>

    <!-- Day grid -->
    <div class="nb-calendar__grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="nb-calendar__cell"
        :class="{
          'nb-calendar__cell--outside': !cell.inMonth,
          'nb-calendar__cell--today': cell.isToday,
        }"
        @click="$emit('day-click', cell.date)"
      >
        <span class="nb-calendar__day-num">{{ cell.day }}</span>
        <div class="nb-calendar__events">
          <div
            v-for="ev in cell.events"
            :key="ev.id"
            class="nb-calendar__event"
            :style="{ background: ev.color || 'var(--nb-c-primary)' }"
            :title="ev.label"
            @click.stop="$emit('event-click', ev)"
          >
            <slot name="event" :event="ev">
              <span class="nb-calendar__event-label">{{ ev.label }}</span>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ICalendarProps, ICalendarEvent } from './Calendar.d'

const props = withDefaults(defineProps<ICalendarProps>(), {
  events: () => [],
  month: undefined,
  weekStart: 1,
  locale: undefined,
})

defineEmits<{
  'day-click': [date: string]
  'event-click': [event: ICalendarEvent]
}>()

function toDateStr(d: string | Date): string {
  if (typeof d === 'string') return d.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

// Current displayed month
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth()) // 0-indexed

watch(
  () => props.month,
  (m) => {
    if (!m) return
    const d = typeof m === 'string' ? new Date(m + '-01') : m
    currentYear.value = d.getFullYear()
    currentMonth.value = d.getMonth()
  },
  { immediate: true },
)

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
}

const resolvedLocale = computed(
  () => props.locale || navigator.language || 'pt-PT',
)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1)
  const formatted = d.toLocaleDateString(resolvedLocale.value, {
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const weekdayLabels = computed(() => {
  const labels: string[] = []
  // Start from a known Monday (2024-01-01 is a Monday)
  const base = new Date(2024, 0, props.weekStart === 0 ? 7 : 1) // adjust for Sunday start
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const label = d.toLocaleDateString(resolvedLocale.value, {
      weekday: 'short',
    })
    labels.push(label.charAt(0).toUpperCase() + label.slice(1))
  }
  return labels
})

const todayStr = computed(() => toDateStr(new Date()))

interface ICalendarCell {
  key: string
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  events: ICalendarEvent[]
}

const cells = computed<ICalendarCell[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Day of week of first day (0=Sun, 1=Mon, ...)
  let startDow = firstDay.getDay()
  if (props.weekStart === 1) {
    startDow = startDow === 0 ? 6 : startDow - 1
  }

  const result: ICalendarCell[] = []

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    const dateStr = toDateStr(d)
    result.push({
      key: dateStr,
      date: dateStr,
      day: d.getDate(),
      inMonth: false,
      isToday: dateStr === todayStr.value,
      events: getEventsForDate(dateStr),
    })
  }

  // Current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result.push({
      key: dateStr,
      date: dateStr,
      day,
      inMonth: true,
      isToday: dateStr === todayStr.value,
      events: getEventsForDate(dateStr),
    })
  }

  // Next month padding (fill to complete rows of 7)
  const remaining = 7 - (result.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const dateStr = toDateStr(d)
      result.push({
        key: dateStr,
        date: dateStr,
        day: d.getDate(),
        inMonth: false,
        isToday: dateStr === todayStr.value,
        events: getEventsForDate(dateStr),
      })
    }
  }

  return result
})

function getEventsForDate(dateStr: string): ICalendarEvent[] {
  return (props.events ?? []).filter((ev) => {
    const start = toDateStr(ev.start)
    const end = ev.end ? toDateStr(ev.end) : start
    return dateStr >= start && dateStr <= end
  })
}
</script>

<style lang="scss">
.nb-calendar {
  font-family: var(--nb-font-family-sans, sans-serif);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
}

.nb-calendar__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--nb-c-border);
}

.nb-calendar__nav {
  background: none;
  border: none;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.15s;

  &:hover {
    color: var(--nb-c-text);
  }
}

.nb-calendar__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--nb-c-text);
}

.nb-calendar__today-btn {
  background: none;
  border: none;
  color: var(--nb-c-primary);
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  transition: color 0.15s;

  &:hover {
    color: var(--nb-c-primary-hover, var(--nb-c-primary));
  }
}

.nb-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface-hover);
}

.nb-calendar__weekday {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--nb-c-text);
  letter-spacing: 0.02em;
}

.nb-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.nb-calendar__cell {
  min-height: 96px;
  padding: 0.5rem 0.75rem;
  border-right: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  cursor: pointer;
  transition: background 0.1s;

  &:nth-child(7n) {
    border-right: none;
  }

  &:hover {
    background: var(--nb-c-surface-hover);
  }

  &--outside {
    opacity: 0.35;
  }

  &--today {
    .nb-calendar__day-num {
      color: var(--nb-c-primary);
      position: relative;

      &::after {
        content: '';
        display: block;
        width: 4px;
        height: 4px;
        background: var(--nb-c-primary);
        margin: 2px auto 0;
      }
    }
  }
}

.nb-calendar__day-num {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--nb-c-text);
  display: block;
  margin-bottom: 0.25rem;
}

.nb-calendar__events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nb-calendar__event {
  padding: 1px 4px;
  cursor: pointer;
  overflow: hidden;
}

.nb-calendar__event-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
</style>
