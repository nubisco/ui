---
layout: nubisco
title: Date Picker
intro: '`NbDatePicker` lets users select a date via a text input and an optional calendar dropdown. It comes in three types: simple (text only), single (with calendar), and range (start and end dates with calendar).'
source: src/components/DatePicker.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Live demo

<preview>
  <NbDatePicker
    v-model="simpleDate"
    type="simple"
    label="Date of birth"
    placeholder="dd/mm/yyyy"
  />
</preview>

## Content

- **The label names the date, not the widget**: `Start date`, `Due`, never `Date picker`.
- **Never type a date format into copy.** The field formats for its `locale` (then `navigator.language`, then `en`). A placeholder, if any, is the shape of the value for that locale.
- **A range has two labels that read as a pair**: `Start date` and `End date`.
- **An error names the allowed range** with real dates: `Choose a date after March 1, 2026.`

Casing, punctuation and tone are set library-wide, not by this component: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
