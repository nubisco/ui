---
layout: nubisco
title: Date Picker
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbDatePicker` lets users select a date via a text input and an optional calendar dropdown. It comes in three types: simple (text only), single (with calendar), and range (start and end dates with calendar).

## Simple Date Picker

A text-only field for manually entering dates without a calendar dropdown. Useful for memorable dates like birthdays or expiration dates.

<preview>
  <NbDatePicker
    v-model="simpleDate"
    type="simple"
    label="Date of birth"
    placeholder="dd/mm/yyyy"
  />
</preview>

```vue
<template>
  <NbDatePicker
    v-model="date"
    type="simple"
    label="Date of birth"
    placeholder="dd/mm/yyyy"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const date = ref<string | null>(null)
</script>
```

## Single Date Picker

Combines a text input with a calendar dropdown. Users can type a date or select one from the calendar.

<preview>
  <NbDatePicker
    v-model="singleDate"
    label="Start date"
    placeholder="dd/mm/yyyy"
  />
</preview>

```vue
<template>
  <NbDatePicker v-model="date" label="Start date" placeholder="dd/mm/yyyy" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const date = ref<string | null>(null)
</script>
```

## Date Range Picker

Two inputs for selecting a start and end date. Selecting the start date automatically moves focus to the end date input.

<preview>
  <NbDatePicker
    v-model="rangeStart"
    v-model:end-value="rangeEnd"
    type="range"
    label="Date range"
    placeholder="Start date"
    end-placeholder="End date"
  />
</preview>

```vue
<template>
  <NbDatePicker
    v-model="start"
    v-model:end-value="end"
    type="range"
    label="Date range"
    placeholder="Start date"
    end-placeholder="End date"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const start = ref<string | null>(null)
const end = ref<string | null>(null)
</script>
```

## Min and Max Dates

Constrain the selectable date range. Dates outside the bounds are visually dimmed and cannot be selected.

<preview>
  <NbDatePicker
    v-model="constrainedDate"
    label="Appointment"
    min="2026-04-10"
    max="2026-04-25"
  />
</preview>

```vue
<NbDatePicker
  v-model="date"
  label="Appointment"
  min="2026-04-10"
  max="2026-04-25"
/>
```

## Validation States

Use `error` or `warning` props to display validation feedback below the field.

<preview>
  <NbGrid dir="col" gap="md">
    <NbDatePicker
      v-model="errorDate"
      label="Departure"
      error="A valid date is required"
    />
    <NbDatePicker
      v-model="warningDate"
      label="Return"
      warning="This date falls on a holiday"
    />
  </NbGrid>
</preview>

```vue
<NbDatePicker
  v-model="date"
  label="Departure"
  error="A valid date is required"
/>
<NbDatePicker
  v-model="date"
  label="Return"
  warning="This date falls on a holiday"
/>
```

## Helper Text

<preview>
  <NbDatePicker
    v-model="helperDate"
    label="Invoice date"
    helper="Format: dd/mm/yyyy"
  />
</preview>

```vue
<NbDatePicker v-model="date" label="Invoice date" helper="Format: dd/mm/yyyy" />
```

## Sizes

Three sizes matching the rest of the design system: `sm` (32px), `md` (40px, default), and `lg` (48px).

<preview>
  <NbGrid dir="col" gap="md">
    <NbDatePicker v-model="smDate" label="Small" size="sm" />
    <NbDatePicker v-model="mdDate" label="Medium" size="md" />
    <NbDatePicker v-model="lgDate" label="Large" size="lg" />
  </NbGrid>
</preview>

```vue
<NbDatePicker v-model="date" label="Small" size="sm" />
<NbDatePicker v-model="date" label="Medium" size="md" />
<NbDatePicker v-model="date" label="Large" size="lg" />
```

## Disabled and Read-only

<preview>
  <NbGrid dir="col" gap="md">
    <NbDatePicker model-value="2026-04-15" label="Disabled" disabled />
    <NbDatePicker model-value="2026-04-15" label="Read-only" readonly type="simple" />
  </NbGrid>
</preview>

```vue
<NbDatePicker v-model="date" label="Disabled" disabled />
<NbDatePicker v-model="date" label="Read-only" readonly type="simple" />
```

## Fluid Variant

The fluid variant places the label inside the field, matching other fluid-style form controls.

<preview>
  <NbDatePicker
    v-model="fluidDate"
    variant="fluid"
    label="Delivery date"
    placeholder="dd/mm/yyyy"
  />
</preview>

```vue
<NbDatePicker
  v-model="date"
  variant="fluid"
  label="Delivery date"
  placeholder="dd/mm/yyyy"
/>
```

## Week Starting on Sunday

<preview>
  <NbDatePicker v-model="sundayDate" label="Date" :week-start="0" />
</preview>

```vue
<NbDatePicker v-model="date" label="Date" :week-start="0" />
```

## Keyboard Navigation

The calendar dropdown follows the [WAI-ARIA Date Picker Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) pattern for full keyboard accessibility.

**Input field:**

| Key         | Action                                                      |
| ----------- | ----------------------------------------------------------- |
| `Enter`     | Opens the calendar and focuses the selected or current date |
| `ArrowDown` | Opens the calendar and focuses the selected or current date |
| `Escape`    | Closes the calendar                                         |

**Calendar grid:**

| Key               | Action                                           |
| ----------------- | ------------------------------------------------ |
| `ArrowRight`      | Move to the next day                             |
| `ArrowLeft`       | Move to the previous day                         |
| `ArrowDown`       | Move to the same day in the next week            |
| `ArrowUp`         | Move to the same day in the previous week        |
| `Home`            | Move to the first day of the current week        |
| `End`             | Move to the last day of the current week         |
| `PageUp`          | Move to the same date in the previous month      |
| `PageDown`        | Move to the same date in the next month          |
| `Shift+PageUp`    | Move to the same date in the previous year       |
| `Shift+PageDown`  | Move to the same date in the next year           |
| `Enter` / `Space` | Select the focused date and close the calendar   |
| `Escape`          | Close the calendar without selecting             |
| `Tab`             | Close the calendar and return focus to the input |

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type                              | Default        | Description                                                |
| ---------------- | --------------------------------- | -------------- | ---------------------------------------------------------- |
| `modelValue`     | `string \| null`                  | `null`         | Selected date as ISO string (YYYY-MM-DD)                   |
| `type`           | `'simple' \| 'single' \| 'range'` | `'single'`     | Picker variant                                             |
| `endValue`       | `string \| null`                  | `null`         | End date for range type (v-model:end-value)                |
| `label`          | `string`                          | `''`           | Label text                                                 |
| `placeholder`    | `string`                          | locale hint    | Placeholder text (defaults to locale date format hint)     |
| `endPlaceholder` | `string`                          | `''`           | Placeholder for the end date input (range only)            |
| `variant`        | `'default' \| 'fluid'`            | `'default'`    | Presentation variant                                       |
| `size`           | `'sm' \| 'md' \| 'lg'`            | `'md'`         | Field height: 32px, 40px, or 48px                          |
| `min`            | `string`                          | `undefined`    | Minimum selectable date (ISO YYYY-MM-DD)                   |
| `max`            | `string`                          | `undefined`    | Maximum selectable date (ISO YYYY-MM-DD)                   |
| `weekStart`      | `0 \| 1`                          | `1`            | First day of the week: 0 = Sunday, 1 = Monday              |
| `locale`         | `string`                          | browser locale | BCP 47 locale tag for month/weekday labels and format hint |
| `helper`         | `string`                          | `''`           | Helper text below the field                                |
| `error`          | `string`                          | `''`           | Error message (takes precedence over warning and helper)   |
| `warning`        | `string`                          | `''`           | Warning message (shown when no error)                      |
| `disabled`       | `boolean`                         | `false`        | Disables the input and calendar                            |
| `readonly`       | `boolean`                         | `false`        | Makes the field read-only                                  |
| `required`       | `boolean`                         | `false`        | Marks the field as required                                |
| `name`           | `string`                          | `''`           | HTML name attribute                                        |
| `id`             | `string`                          | auto-generated | Explicit element id                                        |

## Events

| Event               | Payload          | Description                          |
| ------------------- | ---------------- | ------------------------------------ |
| `update:modelValue` | `string \| null` | Selected date changed                |
| `update:endValue`   | `string \| null` | End date changed (range type only)   |
| `change`            | `string \| null` | Emitted alongside modelValue updates |

## Exposed Methods

| Method  | Description                  |
| ------- | ---------------------------- |
| `open`  | Opens the calendar dropdown  |
| `close` | Closes the calendar dropdown |
| `focus` | Focuses the start date input |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const simpleDate = ref<string | null>(null)
const singleDate = ref<string | null>(null)
const rangeStart = ref<string | null>(null)
const rangeEnd = ref<string | null>(null)
const constrainedDate = ref<string | null>(null)
const errorDate = ref<string | null>(null)
const warningDate = ref<string | null>(null)
const helperDate = ref<string | null>(null)
const smDate = ref<string | null>(null)
const mdDate = ref<string | null>(null)
const lgDate = ref<string | null>(null)
const fluidDate = ref<string | null>(null)
const sundayDate = ref<string | null>(null)
</script>
