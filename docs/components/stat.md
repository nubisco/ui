---
layout: nubisco
title: Stat
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbStat` is one figure with its name: a count, a total, a rate. It can say how the figure moved (an arrow and a delta), carry a status colour, and take the reader to the list the number counts.

It is read by its number, so the number is the largest thing in it and the label sits small above. That is the difference from [`NbCard`](/components/card-grid), which is read by its title.

## Try it

<preview :props="statProps" v-slot="{ resultingProps }">
  <div style="width: 220px">
    <NbStat
      label="Active members"
      value="1,204"
      :status="resultingProps.status"
      :size="resultingProps.size"
      :delta="resultingProps.delta"
      :trend="resultingProps.trend === 'none' ? undefined : resultingProps.trend"
      :invert-trend="resultingProps.invertTrend"
      :comparison="resultingProps.comparison"
      :loading="resultingProps.loading"
    />
  </div>
</preview>

## A row of tiles

Lay tiles out with [`NbCardGrid`](/components/card-grid), which wraps them by their own width, so a row of four becomes two rows of two on a phone without a breakpoint.

<preview>
  <NbCardGrid min="150px" style="width: 100%">
    <NbStat label="Created" value="42" status="success" />
    <NbStat label="Updated" value="17" status="warning" />
    <NbStat label="Skipped" value="3" />
    <NbStat label="Errors" value="1" status="danger" />
  </NbCardGrid>
</preview>

```vue
<NbCardGrid min="150px">
  <NbStat label="Created" :value="result.created" status="success" />
  <NbStat label="Updated" :value="result.updated" status="warning" />
  <NbStat label="Skipped" :value="result.skipped" />
  <NbStat label="Errors" :value="result.errors" :status="result.errors ? 'danger' : 'neutral'" />
</NbCardGrid>
```

A status tile is filled with that status's quiet ground and every word on it is set in the matching ink, the pair the theme keeps legible in light and dark. Use a status when the colour is the meaning of the number (created, failed, waiting for review), not to decorate a row.

## Movement

`delta` is the change, already formatted. `trend` draws the arrow and colours the delta: up is good, down is bad. For a figure that should fall, an error rate or a bounce rate, set `invert-trend`: the arrow still points the way the figure went, and only the colour changes. `comparison` says what the delta is measured against.

<preview>
  <NbCardGrid min="180px" style="width: 100%">
    <NbStat label="Visitors" value="8,312" delta="+12%" trend="up" comparison="vs last week" />
    <NbStat label="Sessions" value="9,950" delta="-4%" trend="down" comparison="vs last week" />
    <NbStat label="Bounce rate" value="38%" delta="-3%" trend="down" invert-trend comparison="vs last week" />
    <NbStat label="Pages per visit" value="2.41" delta="0%" trend="flat" comparison="vs last week" />
  </NbCardGrid>
</preview>

The tile does not format numbers, because only the product knows the unit and the locale. Pass `value` and `delta` as the reader should see them.

## Tiles that do something

A tile behaves exactly like an `NbCard`, and picks its element the same way:

- `to` renders a `<RouterLink>` when the app has vue-router: the tile takes the reader to the list the number counts.
- `href` renders a plain `<a>`.
- `clickable` renders a `role="button"` and emits `select`, for a tile that changes something in place, such as which metric the chart below plots. `selected` marks the one on show.

<preview>
  <NbCardGrid min="180px" style="width: 100%">
    <NbStat label="Total items" value="318" href="#tiles-that-do-something" />
    <NbStat label="Needs review" value="12" status="warning" href="#tiles-that-do-something" />
    <NbStat label="Visitors" value="8,312" clickable :selected="metric === 'visitors'" @select="metric = 'visitors'" />
    <NbStat label="Sessions" value="9,950" clickable :selected="metric === 'sessions'" @select="metric = 'sessions'" />
  </NbCardGrid>
</preview>

```vue
<NbStat :label="t('items.total')" :value="total" :to="{ name: 'items' }" />
<NbStat
  :label="t('items.needsReview')"
  :value="pending"
  status="warning"
  :to="{ name: 'review' }"
/>
```

## Loading

`loading` puts a placeholder where the number goes, hides the delta and marks the tile busy, so a row of tiles keeps its shape while the figures arrive.

<preview>
  <NbCardGrid min="180px" style="width: 100%">
    <NbStat label="Visitors" loading />
    <NbStat label="Sessions" loading />
  </NbCardGrid>
</preview>

## Headline figure

`size="lg"` is for the one figure a page leads with.

<preview>
  <div style="width: 280px">
    <NbStat size="lg" label="Revenue this month" value="12,480" delta="+8%" trend="up" comparison="vs last month" />
  </div>
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                                                        | Default     | Description                                                                        |
| ------------- | ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `label`       | `string`                                                    |             | What the number counts.                                                            |
| `value`       | `string \| number`                                          | —           | The number, already formatted.                                                     |
| `status`      | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Tints the tile with a status.                                                      |
| `delta`       | `string`                                                    | —           | The change, already formatted.                                                     |
| `trend`       | `'up' \| 'down' \| 'flat'`                                  | —           | Which way the figure moved. Draws the arrow and colours the delta.                 |
| `invertTrend` | `boolean`                                                   | `false`     | Down is good news. Changes the colour, never the arrow.                            |
| `comparison`  | `string`                                                    | —           | What the delta is measured against.                                                |
| `size`        | `'md' \| 'lg'`                                              | `'md'`      | `lg` for the headline figure.                                                      |
| `loading`     | `boolean`                                                   | `false`     | Placeholder value, no delta, `aria-busy`.                                          |
| `to`          | `string \| object`                                          | —           | Target route. A `<RouterLink>` with vue-router, a plain link for a string without. |
| `href`        | `string`                                                    | —           | Renders the tile as a link.                                                        |
| `target`      | `string`                                                    | —           | Link target. `_blank` also sets `rel="noopener"`.                                  |
| `clickable`   | `boolean`                                                   | `false`     | Renders as a button and emits `select`. Ignored when `to` or `href` is set.        |
| `selected`    | `boolean`                                                   | `false`     | Draws the tile as chosen.                                                          |
| `disabled`    | `boolean`                                                   | `false`     | Inert and muted.                                                                   |

## Events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `select` | —       | The tile was activated. Only fires when `clickable`. |

## Slots

| Slot    | Description                                                        |
| ------- | ------------------------------------------------------------------ |
| `label` | Replaces the `label` prop, for a label with a help icon beside it. |
| `value` | Replaces the `value` prop.                                         |
| `delta` | Replaces the arrow, delta and comparison.                          |

## Accessibility

- The label comes first in the markup, so a link tile is announced as "Needs review, 12, link".
- The arrow is decorative. Write the sign into `delta` (`+12%`, `-3%`), so the direction does not depend on the arrow or the colour.
- A link or button tile has the focus ring every interactive surface in the library has.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../.vitepress/theme/components/Preview.d'

const metric = ref('visitors')

const statProps: PreviewPropDef[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'single',
    default: 'neutral',
    options: ['neutral', 'info', 'success', 'warning', 'danger'].map((v) => ({ value: v, label: v })),
  },
  {
    name: 'size',
    label: 'Size',
    type: 'single',
    default: 'md',
    options: [
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  { name: 'delta', label: 'Delta', type: 'string', default: '+12%' },
  {
    name: 'trend',
    label: 'Trend',
    type: 'single',
    default: 'up',
    options: ['up', 'down', 'flat', 'none'].map((v) => ({ value: v, label: v })),
  },
  { name: 'invertTrend', label: 'Invert trend', type: 'boolean', default: false },
  { name: 'comparison', label: 'Comparison', type: 'string', default: 'vs last week' },
  { name: 'loading', label: 'Loading', type: 'boolean', default: false },
]
</script>
