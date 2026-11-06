---
layout: nubisco
title: Dashboard
description: The shape of an overview page. A summary strip that answers the page's question in four figures at most, one raised region that is what the page is for, and supporting regions as flat tiles.
---

A dashboard answers one question at a glance: "what needs me today", "how is
the quarter going". Everything on it is ranked by how much it helps answer
that question, and the rank is visible: **the most important data gets the
largest area and the highest contrast.** That is the whole pattern, and every
rule below is it applied to one of the [hierarchy ladders](/principles/hierarchy).

## Before: a grid of peers

The uniform version is easy to build and it is what a team gets by default: a
greeting, then a two-column grid of panels. Each panel has the same plane, the
same 20px heading, the same info hint, the same 16px inside and 24px between.
The one panel the page is for is first and wide, and otherwise identical to the
others. There is not one figure on the page, so "how many things are late" is
answered by counting red badges in a list.

Nothing in it is wrong, and the reader still has to work out what the page is
for.

## After: one loud region

<preview>
  <div style="width: 100%; display: flex; flex-direction: column; gap: 32px">
    <NbPageHeader title="Good morning">
      <template #description>Five things need you today. Two of them are late.</template>
    </NbPageHeader>
    <NbCardGrid min="160px">
      <NbStat size="sm" label="Waiting on you" value="5" />
      <NbStat size="sm" label="Late" value="2" status="danger" />
      <NbStat size="sm" label="Done this week" value="18" delta="+4" trend="up" comparison="vs last week" />
      <NbStat size="sm" label="Open reviews" value="3" />
    </NbCardGrid>
    <NbPanel title="Waiting on you" description="Oldest first. Late items lead.">
      <template #actions><NbButton size="sm" variant="tertiary">See all</NbButton></template>
      <NbContainedList aria-label="Waiting on you">
        <NbContainedListItem item-key="OPS-12" title="Rotate the signing keys" line="Due yesterday" href="#after-one-loud-region">
          <template #trailing><NbBadge size="sm" variant="red">Late</NbBadge></template>
        </NbContainedListItem>
        <NbContainedListItem item-key="WEB-31" title="Approve the pricing page copy" line="Due today" href="#after-one-loud-region" />
        <NbContainedListItem item-key="OPS-9" title="Review the backup report" line="Due Friday" href="#after-one-loud-region" />
      </NbContainedList>
    </NbPanel>
    <NbCardGrid min="240px" gap="lg">
      <NbPanel flat title="Recent changes" heading-level="h3">
        <NbContainedList aria-label="Recent changes" size="sm">
          <NbContainedListItem title="Onboarding guide" line="Edited 2 hours ago" />
          <NbContainedListItem title="Release checklist" line="Edited yesterday" />
        </NbContainedList>
      </NbPanel>
      <NbPanel flat title="Due this week" heading-level="h3">
        <NbContainedList aria-label="Due this week" size="sm">
          <NbContainedListItem title="Quarterly review" line="Thursday" />
          <NbContainedListItem title="Security audit" line="Friday" />
        </NbContainedList>
      </NbPanel>
    </NbCardGrid>
  </div>
</preview>

What changed, ladder by ladder:

| Ladder   | The main region                                 | Everything else                              |
| -------- | ----------------------------------------------- | -------------------------------------------- |
| Position | First after the strip, full width               | Below it, in a row of equal tiles            |
| Layer    | Raised: the page's one raised region            | Flat tiles on the ground                     |
| Type     | `heading-01` panel title, through `NbPanel`     | The same size: rank comes from the other two |
| Emphasis | The page's only button above the fold, tertiary | Ghost, if anything                           |

The main region is loud on two ladders, position and layer, and no more.

## The anatomy

1. **A page header or a greeting.** [`NbPageHeader`](/components/page-header/usage)
   with a one-line description that states the answer ("Five things need you
   today"). The trail names the page, so the header carries content, not the
   word "Dashboard".
2. **A summary strip, four figures at most.** `NbStat size="sm"` in an
   `NbCardGrid` with a small `min`. Each figure answers part of the page's
   question. A fifth figure is a sign the page is answering two questions.
3. **One raised region, full width.** The thing the page is for, in an
   `NbPanel` with a `title`, its one action in the header. Use a contained
   list or a table inside it, not another layer of panels.
4. **Supporting regions as flat tiles.** `NbPanel flat` (or `NbCard flat`) in
   an `NbCardGrid`, halves or thirds. They are peers of each other, never of
   the main region.
5. **A way to everything, last.** "See all" on the main region, an activity
   feed at the bottom. Not a fifth tile.

## Rules

- **Largest area, highest contrast, first.** Reading on a dashboard runs in an
  F: across the top, down the start edge, across again. Put the answer where
  the F starts.
- **The fewest figures that answer the question.** Remove a figure that does
  not change what the reader does next.
- **A row of equal tiles says "peers".** Never put the main region in it.
- **Spacing between regions is `xl`**, and the strip and the main region get
  one step more above and below when the page is short.
- **Colour is status.** A red figure means late, never "important". See
  [Status indicators](/patterns/status-indicators).
