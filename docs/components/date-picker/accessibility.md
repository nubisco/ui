---
layout: nubisco
title: Date Picker
intro: '`NbDatePicker` lets users select a date via a text input and an optional calendar dropdown. It comes in three types: simple (text only), single (with calendar), and range (start and end dates with calendar).'
source: src/components/DatePicker.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

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

The calendar header also provides clickable previous/next month (single caret) and previous/next year (double caret) buttons.

<!--@include: ./_shared.md-->
