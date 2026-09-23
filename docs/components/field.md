---
layout: nubisco
title: Field
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbField` is a labeled row: a label and a control sharing one grid. A stack of `NbField`s lines up on a single spine automatically — no per-field CSS — which makes it the building block of an inspector or a settings panel. Wrap any control and it falls into place.

## Basic

<preview>
  <div style="display:flex; flex-direction:column; gap:8px; width:320px;">
    <NbField label="Name"><NbTextInput model-value="Mod1" size="sm" /></NbField>
    <NbField label="Channel"><NbSelect model-value="1" :options="[{label:'Channel 1', value:'1'},{label:'Channel 2', value:'2'}]" size="sm" /></NbField>
  </div>
</preview>

```vue
<template>
  <NbField label="Name"><NbTextInput v-model="name" size="sm" /></NbField>
  <NbField label="Channel"
    ><NbSelect v-model="ch" :options="channels" size="sm"
  /></NbField>
</template>
```

Every field reads `--nb-field-label-width`, so fields share one label column. Set it on the container to shift the whole spine:

```css
.my-panel {
  --nb-field-label-width: 8rem;
}
```

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

## Label association

The default slot receives a generated `id`; bind it to your control so the label points at it (or pass your own via `labelFor`):

```vue
<NbField label="Name" v-slot="{ id }">
  <NbTextInput :id="id" v-model="name" />
</NbField>
```

## Mixed controls align

Every form control puts the same vertical gap between its label and its field, so a row that mixes control types lines its field tops up to the pixel. The gap is one token, `--nb-field-label-gap`, shared by `NbTextInput`, `NbDatePicker`, `NbSelect`, `NbNumberInput`, `NbSlider` and `NbField`'s stack mode. It holds with or without a helper line.

<preview>
  <div id="mixed-row-demo" style="display:flex; gap:12px; align-items:flex-start; width:100%;">
    <NbTextInput label="Policy ref" placeholder="ABC-123" style="flex:1" />
    <NbDatePicker label="From" type="simple" placeholder="dd/mm/yyyy" style="flex:1" />
    <NbSelect label="Status" model-value="1" :options="[{label:'Open', value:'1'},{label:'Closed', value:'2'}]" style="flex:1" />
    <NbNumberInput label="Amount" :model-value="100" style="flex:1" />
  </div>
</preview>

With a helper or error line under one of them, the field tops still align. The message only adds height below the field:

<preview>
  <div id="mixed-row-helper-demo" style="display:flex; gap:12px; align-items:flex-start; width:100%;">
    <NbTextInput label="Policy ref" placeholder="ABC-123" error="Required" style="flex:1" />
    <NbDatePicker label="From" type="simple" placeholder="dd/mm/yyyy" helper="Case-sensitive" style="flex:1" />
    <NbSelect label="Status" model-value="1" :options="[{label:'Open', value:'1'},{label:'Closed', value:'2'}]" style="flex:1" />
  </div>
</preview>

To tighten or loosen every control at once, override the token on a container:

```css
.my-form {
  --nb-field-label-gap: 4px;
}
```

## In an inspector

Inside a `.nb-inspector` container, `NbField` picks up the inspector treatment automatically — a compact spine, sliders that stack with full-width tracks, compact numeric steppers, and section highlighting. See [Building an inspector](/patterns/inspectors).

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                  | Default     | Description                                                                                         |
| ------------- | --------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `label`       | `string`              | `undefined` | Label text. Omit and use the `#label` slot for a custom label.                                      |
| `hint`        | `string`              | `undefined` | Helper text shown under the control, muted.                                                         |
| `orientation` | `'row' \| 'stack'`    | `'row'`     | `row`: label beside the control on the shared spine. `stack`: label on its own line, control below. |
| `align`       | `'center' \| 'start'` | `'center'`  | Vertical alignment of the label against the control. `start` top-aligns against a tall control.     |
| `control`     | `'fill' \| 'fit'`     | `'fill'`    | `fill`: control fills the value column. `fit`: control hugs its content and the label runs wide.    |
| `labelFor`    | `string`              | `undefined` | Id of the control the label points at. Defaults to an auto-generated id, also exposed to the slot.  |

## Slots

| Slot      | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| `default` | The control. Receives `{ id }` — bind it to your control for a label association. |
| `label`   | Custom label content, replacing the `label` prop.                                 |
| `hint`    | Custom hint content, replacing the `hint` prop.                                   |

</doc-tab>
