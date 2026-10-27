---
layout: nubisco
title: Definition List
intro: '`NbDefinitionList` renders facts as label-and-value pairs: the media inspector''s "Uploaded / By / Size", an environment''s "Owner / Repository / Workflow", the facts on a release. It is a real `<dl>`, so the pairing is in the markup rather than only in the layout.'
source: src/components/DefinitionList.vue
tab: code
pageTabs: ['usage', 'code']
---

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
