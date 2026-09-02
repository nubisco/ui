---
layout: nubisco
title: Definition List
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbDefinitionList` renders facts as label-and-value pairs: the media inspector's "Uploaded / By / Size", an environment's "Owner / Repository / Workflow", the facts on a release. It is a real `<dl>`, so the pairing is in the markup rather than only in the layout.

<preview>
  <div style="max-width: 26rem; width: 100%;">
    <NbDefinitionList
      :items="[
        { term: 'Uploaded', value: '12 May 2026' },
        { term: 'By', value: 'jose' },
        { term: 'Size', value: '1.4 MB' },
        { term: 'Dimensions', value: '2400 × 1600' },
        { term: 'Caption', value: null },
      ]"
    />
  </div>
</preview>

```vue
<NbDefinitionList
  :items="[
    { term: 'Uploaded', value: media.uploadedAt },
    { term: 'By', value: media.author },
    { term: 'Size', value: media.size },
  ]"
/>
```

## The grid is on the row, never on the list

This is the reason the component exists, and it is worth being explicit about because the failure is quiet.

Putting `display: grid` on the `<dl>` makes **every descendant a grid item**. A `<dt>` and `<dd>` pair then lines up by luck, and anything else placed in the list, a heading, a divider, a form field, gets pulled into the columns too. That is exactly how a hand-rolled definition list in the CMS swallowed two form fields.

Here each row is its own grid, so a row can only ever lay out its own term and value. Anything else in the list is left alone.

## Empty values

A value of `null`, `undefined` or `''` renders an en dash rather than nothing, so the row keeps its place and the list does not appear to have fewer facts than it has. `0` and `false` are values, not absences.

Override per item with `empty` when a specific word is better than a dash.

<preview>
  <div style="max-width: 26rem; width: 100%;">
    <NbDefinitionList
      :items="[
        { term: 'Uses', value: 0 },
        { term: 'Dimensions', value: null },
        { term: 'Expires', value: null, empty: 'Never' },
      ]"
    />
  </div>
</preview>

## Rich values

Use the default slot with `NbDefinitionListItem` when a value needs a link, a badge or anything else that is not a string. The row's layout still comes from the list, so the two forms line up identically.

<preview>
  <div style="max-width: 26rem; width: 100%;">
    <NbDefinitionList>
      <NbDefinitionListItem term="Repository">
        <a href="#definition-list">nubisco/ui</a>
      </NbDefinitionListItem>
      <NbDefinitionListItem term="Status">
        <NbBadge variant="green" size="sm">deployed</NbBadge>
      </NbDefinitionListItem>
      <NbDefinitionListItem term="Workflow">release.yml</NbDefinitionListItem>
    </NbDefinitionList>
  </div>
</preview>

`items` and the slot are alternatives, not layers. If both are given, `items` wins, because rendering both would silently interleave two sources of truth.

## Layouts

`columns` is the default and reads as a facts table. `stacked` puts the label above the value, for long values or narrow space. `auto` switches between them on the width of **its own container**, using a container query, which is the distinction that matters in an inspector: the panel is narrow while the window is wide, and a media query cannot tell the difference.

<preview>
  <div style="display: grid; gap: 1.5rem; width: 100%;">
    <div style="max-width: 26rem;">
      <NbDefinitionList layout="columns" :items="[{ term: 'Layout', value: 'columns' }, { term: 'Reads as', value: 'a facts table' }]" />
    </div>
    <div style="max-width: 26rem;">
      <NbDefinitionList layout="stacked" :items="[{ term: 'Layout', value: 'stacked' }, { term: 'Reads as', value: 'a list of labelled paragraphs' }]" />
    </div>
    <div style="max-width: 15rem; border: 1px dashed var(--nb-c-border); padding: 0.75rem;">
      <NbDefinitionList layout="auto" :items="[{ term: 'Layout', value: 'auto, in a narrow container' }]" />
    </div>
  </div>
</preview>

## Density and dividers

`compact` tightens the rows for a dense inspector. `dividers` draws a hairline between them, which is worth it for long lists and usually not worth it in a panel that already has plenty of rules.

<preview>
  <div style="max-width: 26rem; width: 100%;">
    <NbDefinitionList
      compact
      dividers
      :items="[
        { term: 'Owner', value: 'nubisco' },
        { term: 'Repository', value: 'ui' },
        { term: 'Workflow', value: 'release.yml' },
      ]"
    />
  </div>
</preview>

## Label column width

`termWidth` takes any grid track value. The default, `minmax(6rem, 0.38fr)`, lets long labels wrap rather than starving the value.

</doc-tab>

<doc-tab name="Api">

## NbDefinitionList props

| Prop        | Type                               | Default                  | Description                                       |
| ----------- | ---------------------------------- | ------------------------ | ------------------------------------------------- |
| `items`     | `IDefinitionListItem[]`            | `[]`                     | The facts. Omit and use the slot for rich values. |
| `layout`    | `'columns' \| 'stacked' \| 'auto'` | `'columns'`              | `auto` uses a container query, not a media query. |
| `termWidth` | `string`                           | `'minmax(6rem, 0.38fr)'` | Grid track for the label column.                  |
| `dividers`  | `boolean`                          | `false`                  | Hairline between rows.                            |
| `compact`   | `boolean`                          | `false`                  | Tighter rows.                                     |

## IDefinitionListItem

| Field   | Type                       | Description                                                    |
| ------- | -------------------------- | -------------------------------------------------------------- |
| `term`  | `string`                   | The label.                                                     |
| `value` | `string \| number \| null` | The value. `null`, `undefined` and `''` render the empty text. |
| `empty` | `string`                   | Shown in place of an empty value. Defaults to an en dash.      |

## NbDefinitionListItem props

| Prop   | Type     | Default | Description                                         |
| ------ | -------- | ------- | --------------------------------------------------- |
| `term` | `string` | `''`    | The label. Use the `term` slot for anything richer. |

## NbDefinitionListItem slots

| Slot      | Description |
| --------- | ----------- |
| `default` | The value.  |
| `term`    | The label.  |

</doc-tab>
