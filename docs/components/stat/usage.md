---
layout: nubisco
title: Stat
intro: '`NbStat` is one figure with its name: a count, a total, a rate. It can say how the figure moved (an arrow and a delta), carry a status colour, and take the reader to the list the number counts.'
source: src/components/Stat.vue
tab: usage
pageTabs: ['usage', 'code']
---

It is read by its number, so the number is the largest thing in it and the label sits small above. That is the difference from [`NbCard`](/components/card-grid/usage), which is read by its title.

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

<!--@include: ./_shared.md-->
