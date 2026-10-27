---
layout: nubisco
title: Wireframe
intro: '`NbWireframe` draws a schematic thumbnail of a layout: bars for copy, pills for buttons, boxes for media, on a 12-column grid. Use it where someone has to pick a layout before it exists, such as a block picker or a template gallery. A name and a description cannot show a shape at a glance, and a wireframe can.'
source: src/components/Wireframe.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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
