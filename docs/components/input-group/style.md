---
layout: nubisco
title: Input Group
intro: '`NbInputGroup` joins a field and the buttons that act on it into one control: an email with its Invite button, a link with Copy, a quantity with Add. Every box in the row is the same height, from the scale fields and buttons share, and the edges where they meet are joined.'
source: src/components/InputGroup.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Anatomy

A label, one row of controls, and a message. The row has no gap: the boxes touch.

- **Square appearance.** A field keeps its bottom rule and a button its fill, as anywhere else. Only the height is shared.
- **Rounded appearance.** The row reads as one capsule. The outer corners keep the control radius, the inner corners where two boxes meet are squared, and the two borders that touch overlap into one line.

<preview dir="col">
  <div data-nb-appearance="rounded" style="display: grid; gap: 16px; max-width: 420px">
    <NbInputGroup label="Rounded">
      <NbTextInput v-model="email" placeholder="name@example.com" />
      <NbButton variant="primary">Invite</NbButton>
    </NbInputGroup>
  </div>
  <div data-nb-appearance="square" style="display: grid; gap: 16px; max-width: 420px">
    <NbInputGroup label="Square">
      <NbTextInput v-model="email" placeholder="name@example.com" />
      <NbButton variant="primary">Invite</NbButton>
    </NbInputGroup>
  </div>
</preview>

## Focus

Each control draws its own focus ring inside its own box, so only one ring shows at a time. The control with focus is raised above its neighbours, so the border they overlap never covers its ring.

## Phones

The row stays one row at every width. The field shrinks and the buttons keep their size, because a button wrapped under its field no longer reads as part of it. Prefer an icon-only button with a `label` when the row is narrow.

<!--@include: ./_shared.md-->
