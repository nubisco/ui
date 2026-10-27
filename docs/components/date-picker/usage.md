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

<!--@include: ./_shared.md-->
