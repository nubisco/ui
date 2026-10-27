---
layout: nubisco
title: Stat
intro: '`NbStat` is one figure with its name: a count, a total, a rate. It can say how the figure moved (an arrow and a delta), carry a status colour, and take the reader to the list the number counts.'
source: src/components/Stat.vue
tab: code
pageTabs: ['usage', 'code']
---

## A row of tiles

Lay tiles out with [`NbCardGrid`](/components/card-grid/usage), which wraps them by their own width, so a row of four becomes two rows of two on a phone without a breakpoint.

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

## Dense row

`size="sm"` is for a row of figures that sits above a table or a chart and should not outweigh it: tighter padding and a smaller figure, 59px tall without a delta, against 86px for the default. Everything else is the same tile, so a dense tile still takes a status, a delta and a link.

<preview>
  <NbCardGrid min="140px" gap="sm" style="width: 100%">
    <NbStat size="sm" label="Open" value="24" />
    <NbStat size="sm" label="In review" value="7" status="info" />
    <NbStat size="sm" label="Overdue" value="3" status="warning" />
    <NbStat size="sm" label="Closed this week" value="41" delta="+9" trend="up" />
  </NbCardGrid>
</preview>

```vue
<NbCardGrid min="140px" gap="sm">
  <NbStat size="sm" label="Open" :value="counts.open" />
  <NbStat size="sm" label="Overdue" :value="counts.overdue" status="warning" />
</NbCardGrid>
```

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
| `size`        | `'sm' \| 'md' \| 'lg'`                                      | `'md'`      | `sm` for a dense KPI row, `lg` for the headline figure.                            |
| `loading`     | `boolean`                                                   | `false`     | Placeholder value, no delta, `aria-busy`.                                          |
| `to`          | `string \| object`                                          | —           | Target route. A `<RouterLink>` with vue-router, a plain link for a string without. |
| `href`        | `string`                                                    | —           | Renders the tile as a link.                                                        |
| `target`      | `string`                                                    | —           | Link target. `_blank` also sets `rel="noopener"`.                                  |
| `clickable`   | `boolean`                                                   | `false`     | Renders as a button and emits `select`. Ignored when `to` or `href` is set.        |
| `selected`    | `boolean`                                                   | `false`     | Draws the tile as chosen.                                                          |
| `disabled`    | `boolean`                                                   | `false`     | Inert and muted.                                                                   |

## Events

| Event    | Payload                       | Description                                                                                                                                                      |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select` | `MouseEvent \| KeyboardEvent` | The tile was activated by a click, Enter or Space. Only fires when `clickable`. The event carries the modifier keys, for a grid that selects a range with shift. |

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

<!--@include: ./_shared.md-->
