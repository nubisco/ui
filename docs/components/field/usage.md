---
layout: nubisco
title: Field
intro: '`NbField` is a labeled row: a label and a control sharing one grid. A stack of `NbField`s lines up on a single spine automatically — no per-field CSS — which makes it the building block of an inspector or a settings panel. Wrap any control and it falls into place.'
source: src/components/Field.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Stack a control

`orientation="stack"` puts the label on its own line above a full-width control — for a control that wants the whole width (a tall text area, a prominent slider), or a label too long to sit beside it.

<preview>
  <div style="width:320px;">
    <NbField label="Description" orientation="stack"><NbTextInput model-value="Two guitars, drums, keys." size="sm" multiline /></NbField>
  </div>
</preview>

## Small controls: `control="fit"`

For a small control such as a switch, `control="fit"` lets the label run wide and pushes the control to the right edge, instead of squeezing the label into the fixed column.

<preview>
  <div style="width:320px; display:flex; flex-direction:column; gap:8px;">
    <NbField label="Visible when performing" control="fit"><NbSwitch :model-value="true" /></NbField>
    <NbField label="Locked" control="fit"><NbSwitch :model-value="false" /></NbField>
  </div>
</preview>

## In an inspector

Inside a `.nb-inspector` container, `NbField` picks up the inspector treatment automatically — a compact spine, sliders that stack with full-width tracks, compact numeric steppers, and section highlighting. See [Building an inspector](/patterns/inspectors).
