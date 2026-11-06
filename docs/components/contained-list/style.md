---
layout: nubisco
title: Contained List
intro: '`NbContainedList` is a list for a small space: a panel, a tile, an aside, a disclosure. Each row is a key, a title, one line under it and something at the end. It is the row a product otherwise writes by hand, once per screen.'
source: src/components/ContainedList.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Type

| Part        | Set               | Colour               |
| ----------- | ----------------- | -------------------- |
| List title  | `heading-compact` | `--nb-c-text`        |
| Header meta | `label-sm`        | `--nb-c-text-muted`  |
| Row key     | `code-sm`, mono   | `--nb-c-text-subtle` |
| Row title   | `heading-compact` | `--nb-c-text`        |
| Row line    | `body-sm`         | `--nb-c-text-muted`  |
| Trailing    | `label-md`        | `--nb-c-text-muted`  |

The title and the line truncate to one line each. A row that needs a
paragraph is not a contained-list row.

## Surface and lines

The list paints no surface of its own: it takes the plane it sits on. Rows are
divided by `--nb-c-border`, the border of that plane, so the same list reads
correctly in a raised panel, on a flat tile and on the page ground.

The header is sticky, with `--nb-c-surface` under it, so rows scroll beneath
it rather than through it. Give the list `max-height` to scroll inside a tile;
without it the header sticks inside whatever scrolls around it, for as long as
the list is on screen.

<preview>
  <NbPanel style="width: 100%; max-width: 24rem">
    <NbContainedList title="Activity" max-height="10rem" size="sm">
      <NbContainedListItem v-for="n in 10" :key="n" :title="`Event ${n}`" :line="`${n} minutes ago`" />
    </NbContainedList>
  </NbPanel>
</preview>

## States

| State    | Treatment                                                                   |
| -------- | --------------------------------------------------------------------------- |
| Hover    | `--nb-c-surface-hover`, on rows that act only                               |
| Focus    | A 2px focus ring inside the row                                             |
| Current  | The selected surface, with the selected edge as a 2px bar on the start side |
| Disabled | 55% opacity, no pointer                                                     |

## Sizes

| Size | Row height | Use                                            |
| ---- | ---------: | ---------------------------------------------- |
| `sm` |       32px | A dense aside, a list inside a disclosure      |
| `md` |       40px | The default: a dashboard tile, a panel         |
| `lg` |       48px | Rows with a leading avatar, a sparse page list |

## Phones

On a phone touch screen a row that acts grows to at least 44px, so every row
is a full-size target. Rows sit edge to edge, so they grow rather than take an
invisible hit area that would overlap the next row's. Nothing changes on a
desktop, and nothing changes for a row that does not act.
