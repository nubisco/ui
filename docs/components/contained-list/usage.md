---
layout: nubisco
title: Contained List
intro: '`NbContainedList` is a list for a small space: a panel, a tile, an aside, a disclosure. Each row is a key, a title, one line under it and something at the end. It is the row a product otherwise writes by hand, once per screen.'
source: src/components/ContainedList.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

<preview>
  <NbPanel style="width: 100%; max-width: 30rem">
    <NbContainedList title="Waiting on you">
      <template #meta>3</template>
      <NbContainedListItem item-key="OPS-12" title="Rotate the signing keys" line="Due Friday" href="#when-to-use-it">
        <template #trailing><NbBadge size="sm" variant="red">Blocked</NbBadge></template>
      </NbContainedListItem>
      <NbContainedListItem item-key="OPS-9" title="Review the backup report" line="Shared by the infrastructure team" href="#when-to-use-it" />
      <NbContainedListItem item-key="WEB-31" title="Approve the pricing page copy" line="Two comments" href="#when-to-use-it">
        <template #trailing>2</template>
      </NbContainedListItem>
    </NbContainedList>
  </NbPanel>
</preview>

```vue
<NbContainedList title="Waiting on you">
  <template #meta>{{ items.length }}</template>
  <NbContainedListItem
    v-for="item in items"
    :key="item.id"
    :item-key="item.key"
    :title="item.title"
    :line="item.due"
    :to="item.route"
  >
    <template #trailing>
      <NbBadge v-if="item.blocked" size="sm" variant="red">Blocked</NbBadge>
    </template>
  </NbContainedListItem>
</NbContainedList>
```

## When to use it

- **A short list inside something else.** Five things waiting on someone in a
  dashboard tile, the spaces in an aside, the links of a record. The list has
  no column headers, no sorting, no paging.
- **Rows that are one thing each.** A key, a name, a line of context and one
  trailing fact (a badge, a count, a date).

Reach for something else when:

| The list needs                          | Use                                                     |
| --------------------------------------- | ------------------------------------------------------- |
| Column headers, several facts per row   | [`NbStructuredList`](/components/structured-list/usage) |
| Sorting, selection, paging, row actions | [`NbDataTable`](/components/data-table/usage)           |
| Term and value pairs about one thing    | [`NbDefinitionList`](/components/definition-list/usage) |
| Reordering by drag                      | [`NbReorderList`](/components/reorder-list/usage)       |

## The row

Every row has the same anatomy, so a list of them scans down one edge:

- `item-key`: a short identifier before the title, mono and subtle. Optional.
- `title`: the row's name, at `heading-compact`. One line, truncated.
- `line`: one line of context under it, `body-sm`, muted. Optional.
- `#leading`: an avatar, an icon or a status dot before everything.
- `#trailing`: one badge or a count at the end. Not a control: a row that is a
  link or a button cannot hold another control.

## Rows that do something

A row with `to` or `href` is a link. A row with `clickable` is a button that
emits `select`. Either one is a whole-row target with a hover from
`--nb-c-surface-hover`, and `current` marks the one that is open.

<preview>
  <NbPanel style="width: 100%; max-width: 24rem">
    <NbContainedList title="Projects" size="sm">
      <NbContainedListItem title="Website" clickable current />
      <NbContainedListItem title="Mobile app" clickable />
      <NbContainedListItem title="Billing" clickable />
    </NbContainedList>
  </NbPanel>
</preview>

## Size

`size` sets the row height: `sm` 32px, `md` 40px (the default), `lg` 48px.
Rows with a `line` grow to fit it. Pick one size per list: two sizes in one
tile reads as two lists.

## In the page's hierarchy

A contained list is a supporting element. Its title is `heading-compact`,
quieter than the panel or tile it sits in, and its rows are equal peers. When
one item is the point of the page, it does not belong in a row: give it its
own region. See [Information hierarchy](/principles/hierarchy).
