---
layout: nubisco
title: Button Set
intro: '`NbButtonSet` is a row of up to three buttons that knows where the primary goes: last in a row, first in a column, whatever order the slot was written in. It is the footer of every dialog in the library, and the row under a form or a tour step.'
source: src/components/ButtonSet.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Spacing

Buttons that keep their own width sit 16px apart. Fluid buttons have no gap:
they split the width equally and a 1px `--nb-c-border` rule separates them,
drawn as an inset shadow so it costs no width. A focused button's ring covers
the rule.

<preview dir="col" gap="lg">
  <NbButtonSet>
    <NbButton variant="secondary">Cancel</NbButton>
    <NbButton variant="primary">Save</NbButton>
  </NbButtonSet>
  <div style="width: 100%; max-width: 480px">
    <NbButtonSet fluid>
      <NbButton variant="secondary">Cancel</NbButton>
      <NbButton variant="primary">Save</NbButton>
    </NbButtonSet>
  </div>
</preview>

## Alignment

`align="start"` (the default) gathers the row at the left edge, `align="end"`
at the right. A fluid set fills the row, so it has no alignment.

## In a dialog

`NbModal` uses a fluid set of xl (64px) buttons with square corners, and
Carbon's widths: one button spans the right half, two share the row, three
are a quarter each for the two on the left and the right half for the primary.
