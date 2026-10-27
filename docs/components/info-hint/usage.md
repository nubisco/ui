---
layout: nubisco
title: Info Hint
intro: '`NbInfoHint` is a small, discreet affordance you drop next to anything whose meaning is not self-evident: a KPI number, a status word, a column header, an abbreviation. It renders a compact icon in a subtle token colour and reveals a short description on hover, focus, or click.'
source: src/components/InfoHint.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

It exists so applications stop hand-rolling little grey question marks with hardcoded colours. Every colour here comes from the semantic token layer, so the hint follows the theme without the host knowing anything about it.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbGrid dir="row" gap="xs" align="center">
    <span>Archived</span>
    <NbInfoHint v-bind="resultingProps" />
  </NbGrid>
</preview>

```vue
<template>
  <span>Archived</span>
  <NbInfoHint
    text="Items moved out of the active list. Kept for 90 days, then deleted."
  />
</template>
```

## Where it earns its place

Put a hint next to a label whose meaning a new user cannot guess. Do not use it for content that belongs in the interface itself: if every user needs the sentence, write the sentence.

<preview dir="col">
  <NbGrid dir="row" gap="md" align="center">
    <NbGrid dir="row" gap="xs" align="center">
      <strong style="font-size: 24px">1 284</strong>
      <NbInfoHint text="Counted at the last nightly sync, not in real time." />
    </NbGrid>
    <NbGrid dir="row" gap="xs" align="center">
      <NbBadge variant="red" dot>Archived</NbBadge>
      <NbInfoHint icon="question" text="Moved out of the active list more than 30 days ago." />
    </NbGrid>
  </NbGrid>
</preview>

## Hover, focus and touch

The popover opens on hover for pointer users and on focus for keyboard users. A **click or tap pins it open**, which is what makes it usable on touch devices, where there is no hover at all. A pinned popover is dismissed by clicking the icon again, pressing <kbd>Escape</kbd>, or clicking anywhere outside it.

## Placement

`placement` is a preference, not a guarantee. When the preferred side would push the popover off-screen it flips to the opposite side, then to the orthogonal sides, and finally clamps itself inside the viewport with the arrow re-aimed at the icon.

<preview dir="row">
  <NbInfoHint placement="top" text="Anchored above the icon." />
  <NbInfoHint placement="right" text="Anchored to the right of the icon." />
  <NbInfoHint placement="bottom" text="Anchored below the icon." />
  <NbInfoHint placement="left" text="Anchored to the left of the icon." />
</preview>

## Inside clickable rows and cards

A hint routinely lives inside something that is itself clickable. `NbInfoHint` stops click, `mousedown` and `pointerdown` from propagating, so opening a hint never triggers the host's action.

<preview>
  <div
    style="cursor: pointer; padding: 12px 16px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)"
    @click="rowClicks++"
  >
    <NbGrid dir="row" gap="xs" align="center">
      <span>Click the row, then click the hint. Row clicks: <strong>{{ rowClicks }}</strong></span>
      <NbInfoHint text="Clicking me does not click the row." />
    </NbGrid>
  </div>
</preview>

<!--@include: ./_shared.md-->
