---
layout: nubisco
title: Button Set
intro: '`NbButtonSet` is a row of up to three buttons that knows where the primary goes: last in a row, first in a column, whatever order the slot was written in. It is the footer of every dialog in the library, and the row under a form or a tour step.'
source: src/components/ButtonSet.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Props

| Prop         | Type                             | Default     | Description                                                                      |
| ------------ | -------------------------------- | ----------- | -------------------------------------------------------------------------------- |
| `fluid`      | `boolean`                        | `false`     | Equal widths, no gap, a 1px rule between buttons                                 |
| `stack`      | `'never' \| 'phone' \| 'always'` | `'never'`   | When the row becomes a column, primary on top                                    |
| `align`      | `'start' \| 'end'`               | `'start'`   | Which end a row that does not fill its width gathers at                          |
| `size`       | `TButtonSize`                    | none        | One size for every `NbButton` in the set, over a child's own size                |
| `focusOrder` | `'reading' \| 'rank'`            | `'reading'` | The order Tab walks the buttons. `rank` is Carbon's dialog order, primary first. |

## Slots

| Slot      | Description                                                        |
| --------- | ------------------------------------------------------------------ |
| `default` | Up to three buttons, in reading order. `v-if` and `v-for` are fine |

## How the order is decided

The set reads each button's `variant` and places the primary itself: last in a row (on the right), first in a column (on top), whatever order the slot was written in.

By default the tab order follows the row as it is read, left to right, or top to bottom when stacked, so <kbd>Tab</kbd> never runs against the eye.

A dialog footer is the exception, and `NbModal` sets it for you. `focus-order="rank"` puts the primary first in the tab order and then moves left through the others, Carbon's dialog order: from the body, the commit is one <kbd>Tab</kbd> away and the way out is one more.

```vue
<!-- Written Skip, Back, Next. Drawn and tabbed Skip, Back, Next. -->
<NbButtonSet align="end" size="sm">
  <NbButton variant="ghost" @click="skip">Skip</NbButton>
  <NbButton variant="secondary" outlined @click="back">Back</NbButton>
  <NbButton variant="primary" @click="next">Next</NbButton>
</NbButtonSet>
```
