---
layout: nubisco
title: Calendar
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbCalendar` is a monthly calendar view that displays events as colored bars on their respective dates. It supports month navigation, locale-aware labels, and custom event rendering via slots.

## Basic Usage

<preview>
  <NbCalendar :events="events" month="2026-04" />
</preview>

```vue
<template>
  <NbCalendar :events="events" />
</template>

<script setup lang="ts">
import type { NbCalendarEvent } from '@nubisco/ui'

const events: NbCalendarEvent[] = [
  { id: '1', label: 'Team standup', start: '2026-04-06' },
  { id: '2', label: 'Sprint review', start: '2026-04-10' },
  { id: '3', label: 'Deploy v2', start: '2026-04-18' },
]
</script>
```

## Multi-day Events

Events that span multiple days are shown on every date between `start` and `end`.

<preview>
  <NbCalendar :events="multiDayEvents" month="2026-04" />
</preview>

```vue
<script setup>
const events = [
  { id: '1', label: 'Conference', start: '2026-04-13', end: '2026-04-15' },
  { id: '2', label: 'Sprint 12', start: '2026-04-06', end: '2026-04-17' },
]
</script>
```

## Event Colors

Each event can have a custom `color`. When omitted, the primary theme color is used.

<preview>
  <NbCalendar :events="coloredEvents" month="2026-04" />
</preview>

```vue
<script setup>
const events = [
  { id: '1', label: 'Design review', start: '2026-04-07', color: '#6366f1' },
  { id: '2', label: 'Bug bash', start: '2026-04-14', color: '#ef4444' },
  { id: '3', label: 'Release', start: '2026-04-21', color: '#22c55e' },
]
</script>
```

## Custom Event Slot

Use the `event` slot to customize how events are rendered inside each cell.

```vue
<template>
  <NbCalendar :events="events">
    <template #event="{ event }">
      <div style="display: flex; align-items: center; gap: 4px">
        <NbIcon name="circle" :size="8" :color="event.color" />
        <span>{{ event.label }}</span>
      </div>
    </template>
  </NbCalendar>
</template>
```

## Week Starting on Sunday

By default the week starts on Monday. Set `week-start` to `0` for Sunday.

<preview>
  <NbCalendar :events="events" month="2026-04" :week-start="0" />
</preview>

```vue
<NbCalendar :events="events" :week-start="0" />
```

## Locale

Pass a `locale` string to control month and weekday labels. Defaults to the browser locale.

<preview>
  <NbCalendar :events="events" month="2026-04" locale="en-US" />
</preview>

```vue
<NbCalendar :events="events" locale="en-US" />
```

## Handling Clicks

The `day-click` event fires when a cell is clicked (receives the date string). The `event-click` event fires when an event bar is clicked (receives the full event object).

```vue
<template>
  <NbCalendar
    :events="events"
    @day-click="onDayClick"
    @event-click="onEventClick"
  />
</template>

<script setup lang="ts">
import type { NbCalendarEvent } from '@nubisco/ui'

function onDayClick(date: string) {
  console.log('Clicked date:', date)
}

function onEventClick(event: NbCalendarEvent) {
  console.log('Clicked event:', event.label)
}
</script>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop        | Type               | Default        | Description                                                    |
| ----------- | ------------------ | -------------- | -------------------------------------------------------------- |
| `events`    | `ICalendarEvent[]` | `[]`           | Events to display on the calendar                              |
| `month`     | `string \| Date`   | current month  | Initial month to display (ISO `YYYY-MM` string or Date object) |
| `weekStart` | `0 \| 1`           | `1`            | First day of the week: 0 = Sunday, 1 = Monday                  |
| `locale`    | `string`           | browser locale | BCP 47 locale tag for month and weekday labels                 |

## Interfaces

```typescript
interface ICalendarEvent {
  /** Unique event identifier. */
  id: string
  /** Display label for the event. */
  label: string
  /** Start date (ISO string YYYY-MM-DD or Date). */
  start: string | Date
  /** End date (ISO string YYYY-MM-DD or Date). Defaults to start if omitted. */
  end?: string | Date
  /** CSS color for the event bar. Falls back to primary. */
  color?: string
  /** Arbitrary payload passed through to the event slot. */
  [key: string]: unknown
}
```

## Events

| Event         | Payload          | Description                                |
| ------------- | ---------------- | ------------------------------------------ |
| `day-click`   | `string`         | ISO date string of the clicked cell        |
| `event-click` | `ICalendarEvent` | The full event object of the clicked event |

## Slots

| Slot    | Scope                       | Description                         |
| ------- | --------------------------- | ----------------------------------- |
| `event` | `{ event: ICalendarEvent }` | Custom rendering for each event bar |

</doc-tab>

<script setup lang="ts">
const events = [
  { id: '1', label: 'Team standup', start: '2026-04-06' },
  { id: '2', label: 'Sprint review', start: '2026-04-10' },
  { id: '3', label: 'Deploy v2', start: '2026-04-18' },
]

const multiDayEvents = [
  { id: '1', label: 'Conference', start: '2026-04-13', end: '2026-04-15' },
  { id: '2', label: 'Sprint 12', start: '2026-04-06', end: '2026-04-17' },
]

const coloredEvents = [
  { id: '1', label: 'Design review', start: '2026-04-07', color: '#6366f1' },
  { id: '2', label: 'Bug bash', start: '2026-04-14', color: '#ef4444' },
  { id: '3', label: 'Release', start: '2026-04-21', color: '#22c55e' },
]
</script>
