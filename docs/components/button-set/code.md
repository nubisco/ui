---
layout: nubisco
title: Button Set
intro: '`NbButtonSet` is a row of up to three buttons that knows where the primary goes: last in a row, first in a column, whatever order the slot was written in. It is the footer of every dialog in the library, and the row under a form or a tour step.'
source: src/components/ButtonSet.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Props

| Prop    | Type                             | Default   | Description                                                       |
| ------- | -------------------------------- | --------- | ----------------------------------------------------------------- |
| `fluid` | `boolean`                        | `false`   | Equal widths, no gap, a 1px rule between buttons                  |
| `stack` | `'never' \| 'phone' \| 'always'` | `'never'` | When the row becomes a column, primary on top                     |
| `align` | `'start' \| 'end'`               | `'start'` | Which end a row that does not fill its width gathers at           |
| `size`  | `TButtonSize`                    | none      | One size for every `NbButton` in the set, over a child's own size |

## Slots

| Slot      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `default` | Up to three buttons, in reading order. `v-if` and `v-for` are fine |

## How the order is decided

The DOM order is the rank order: the primary first, then the others from the
right-hand end of the row back to the left. A row is drawn with
`flex-direction: row-reverse` and a column with `column`, so one DOM gives the
primary on the right in a row and on top in a column, and stacking at the phone
breakpoint is a stylesheet change.

That is also the tab order, and it is Carbon's for a dialog: <kbd>Tab</kbd>
reaches the primary first, then moves left through the others.

```vue
<!-- Written Skip, Back, Next. Drawn Skip, Back, Next. Tabbed Next, Back, Skip. -->
<NbButtonSet align="end" size="sm">
  <NbButton variant="ghost" @click="skip">Skip</NbButton>
  <NbButton variant="secondary" outlined @click="back">Back</NbButton>
  <NbButton variant="primary" @click="next">Next</NbButton>
</NbButtonSet>
```
