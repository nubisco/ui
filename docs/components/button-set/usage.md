---
layout: nubisco
title: Button Set
intro: '`NbButtonSet` is a row of up to three buttons that knows where the primary goes: last in a row, first in a column, whatever order the slot was written in. It is the footer of every dialog in the library, and the row under a form or a tour step.'
source: src/components/ButtonSet.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

<preview dir="col" gap="lg">
  <NbButtonSet>
    <NbButton variant="secondary">Cancel</NbButton>
    <NbButton variant="primary">Save invoice</NbButton>
  </NbButtonSet>
  <NbButtonSet align="end">
    <NbButton variant="ghost">Skip</NbButton>
    <NbButton variant="secondary">Back</NbButton>
    <NbButton variant="primary">Next</NbButton>
  </NbButtonSet>
</preview>

```vue
<template>
  <NbButtonSet>
    <NbButton variant="secondary" @click="cancel">Cancel</NbButton>
    <NbButton variant="primary" @click="save">Save invoice</NbButton>
  </NbButtonSet>
</template>
```

## The primary goes on the right

The set reads each button's `variant`. A filled `primary`, or a filled
`danger` in a destructive set, is the primary: it is drawn last in a row (on
the right, where the eye finishes) and first in a column (on top). The others
keep the order you wrote them in, from left to right. An outlined primary
(`tertiary`) is not a primary.

So you never have to remember the rule, and you cannot get it wrong at one
breakpoint and right at another.

## Fluid

`fluid` makes the buttons share the row in equal widths, edge to edge, with a
1px rule between them and no gap. That is the bar at the bottom of a dialog or
a tile, and it is what `NbModal`'s footer is built on.

<preview>
  <div style="width: 100%; max-width: 480px">
    <NbButtonSet fluid size="xl">
      <NbButton variant="secondary">Cancel</NbButton>
      <NbButton variant="primary">Publish</NbButton>
    </NbButtonSet>
  </div>
</preview>

## Stacking

`stack="phone"` turns the row into a column in the phone layout only, and
`stack="always"` at every width. Stacked, the primary is on top and every
button spans the column. The desktop does not move.

## Size

`size` gives every `NbButton` in the set the same size, over one written on a
child. A set is read as one control, and a footer where one button is a step
taller than its neighbour reads as a mistake.

## At most three

A set holds one primary and up to two others. A fourth button logs a warning in
development: move it into an overflow menu or onto the page. For a toolbar of
page actions use [`NbActionGroup`](/components/action-group/usage) instead,
which folds into a menu on a phone.
