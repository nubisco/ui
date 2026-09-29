---
layout: nubisco
title: Wireframe
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbWireframe` draws a schematic thumbnail of a layout: bars for copy, pills for buttons, boxes for media, on a 12-column grid. Use it where someone has to pick a layout before it exists, such as a block picker or a template gallery. A name and a description cannot show a shape at a glance, and a wireframe can.

The spec is data, not markup, so it can come from anywhere (a site's registry, a server) without the host rendering anything it did not write.

<preview>
  <div style="width: 280px">
    <NbWireframe
      label="Product hero"
      :spec="{ rows: [[{ span: 7, parts: ['eyebrow', 'title', 'text', 'buttons'] }, { span: 5, parts: ['image'] }]] }"
    />
  </div>
</preview>

```vue
<template>
  <NbWireframe
    label="Product hero"
    :spec="{
      rows: [
        [
          { span: 7, parts: ['eyebrow', 'title', 'text', 'buttons'] },
          { span: 5, parts: ['image'] },
        ],
      ],
    }"
  />
</template>
```

## Rows, columns and counts

A spec is rows of columns. Each column spans part of the 12-column grid and lists its parts from top to bottom. A part can carry a count after a colon.

<preview dir="row">
  <div style="width: 240px">
    <NbWireframe :spec="{ rows: [[{ align: 'center', parts: ['eyebrow', 'title'] }], [{ parts: ['cards:3'] }]] }" />
  </div>
  <div style="width: 240px">
    <NbWireframe :spec="{ tone: 'dark', rows: [[{ align: 'center', parts: ['title', 'text', 'input'] }]] }" />
  </div>
</preview>

## Parts

| Part      | Draws                            | Count |
| --------- | -------------------------------- | ----- |
| `eyebrow` | a short accent bar               |       |
| `title`   | a heavy headline bar             |       |
| `heading` | a section heading bar            |       |
| `text`    | lines of body copy               | 2     |
| `buttons` | a primary and a secondary button |       |
| `button`  | one primary button               |       |
| `image`   | a picture                        |       |
| `device`  | a screen in a frame              |       |
| `chips`   | small pills                      | 3     |
| `tabs`    | pills, the first one active      | 3     |
| `badge`   | one small pill                   |       |
| `cards`   | cards with a heading and text    | 3     |
| `tiles`   | plain tiles                      | 4     |
| `list`    | bulleted lines                   | 3     |
| `links`   | plain lines                      | 3     |
| `input`   | a field with a button            |       |
| `quote`   | a pull quote                     |       |
| `logo`    | a mark and a name                |       |
| `icon`    | a small square                   |       |
| `divider` | a rule                           |       |

An unknown part is ignored rather than refused, so a spec written for a newer version of the library still draws on an older one.

## Accessibility

Without a `label` the wireframe is decorative (`aria-hidden`). With one it is an image with that name. Give it a label when nothing next to it already names the layout.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop    | Type             | Default     | Description                                           |
| ------- | ---------------- | ----------- | ----------------------------------------------------- |
| `spec`  | `IWireframeSpec` | required    | The layout: `{ tone?, rows: IWireframeColumn[][] }`   |
| `label` | `string`         | `undefined` | Accessible name. Without it the drawing is decorative |

## Types

```ts
interface IWireframeSpec {
  tone?: 'light' | 'dark'
  rows: IWireframeColumn[][]
}

interface IWireframeColumn {
  span?: number // of 12, defaults to an equal share of the row
  parts: string[] // e.g. 'title', 'cards:3'
  align?: 'start' | 'center' | 'end'
}
```

</doc-tab>
