---
layout: nubisco
title: Contained List
intro: '`NbContainedList` is a list for a small space: a panel, a tile, an aside, a disclosure. Each row is a key, a title, one line under it and something at the end. It is the row a product otherwise writes by hand, once per screen.'
source: src/components/ContainedList.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## A list in a panel

The list takes the panel's title as its own, or the panel takes a title and
the list goes without one. Do not give both: two titles for one list is the
doubled heading the hierarchy rules are there to stop.

```vue
<NbPanel>
  <NbContainedList title="Due this week">
    <template #actions>
      <NbButton size="sm" variant="ghost" icon="plus" aria-label="Add" />
    </template>
    <NbContainedListItem
      v-for="task in tasks"
      :key="task.id"
      :item-key="task.key"
      :title="task.title"
      :line="task.owner"
      :to="{ name: 'task', params: { id: task.id } }"
    >
      <template #trailing>{{ task.due }}</template>
    </NbContainedListItem>
  </NbContainedList>
</NbPanel>
```

## Selecting in place

```vue
<NbContainedList aria-label="Projects" size="sm">
  <NbContainedListItem
    v-for="project in projects"
    :key="project.id"
    :title="project.name"
    clickable
    :current="project.id === openId"
    @select="openId = project.id"
  />
</NbContainedList>
```

## A line that wraps

`line-clamp` lets the line under the title wrap onto more lines before it ends in an ellipsis. Keep the default, one line, for a list people scan. Raise it for text people read, such as the matching passage of a search result, where one line cuts the match off. The `#line` slot keeps its inline markup, so a highlighted match stays highlighted, and the row keeps its padding and its whole-row target as it grows.

```vue
<NbContainedListItem :title="hit.title" :href="hit.url" :line-clamp="3">
  <template #line>
    <span v-html="hit.highlightedExcerpt" />
  </template>
</NbContainedListItem>
```

## NbContainedList props

| Prop           | Type                   | Default     | Description                                                                   |
| -------------- | ---------------------- | ----------- | ----------------------------------------------------------------------------- |
| `title`        | `string`               | `undefined` | The list's title. Renders the header, and names the list for a screen reader. |
| `headingLevel` | `'h1'` to `'h6'`       | `'h3'`      | The element the title renders as.                                             |
| `size`         | `'sm' \| 'md' \| 'lg'` | `'md'`      | Row height: 32, 40 or 48px.                                                   |
| `maxHeight`    | `string`               | `undefined` | Cap the height and scroll, with the header sticky above the rows.             |
| `ariaLabel`    | `string`               | `undefined` | The list's accessible name when it has no `title`.                            |

## NbContainedList slots

| Slot      | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `default` | `NbContainedListItem`s.                                           |
| `meta`    | Beside the title: a count, an `NbInfoHint`. Renders the header.   |
| `actions` | At the end of the header: ghost icon buttons. Renders the header. |

## NbContainedListItem props

| Prop        | Type               | Default     | Description                                                                           |
| ----------- | ------------------ | ----------- | ------------------------------------------------------------------------------------- |
| `title`     | `string`           | `undefined` | The row's name. The default slot replaces it.                                         |
| `itemKey`   | `string`           | `undefined` | A short identifier before the title, mono and subtle. Not `key`: Vue reserves it.     |
| `line`      | `string`           | `undefined` | One line of context under the title.                                                  |
| `lineClamp` | `number`           | `1`         | How many lines `line` may wrap onto before it ends in an ellipsis.                    |
| `to`        | `string \| object` | `undefined` | Target route. A `<RouterLink>` with vue-router, a plain link for a string without it. |
| `href`      | `string`           | `undefined` | Renders the row as a link.                                                            |
| `target`    | `string`           | `undefined` | Link target. `_blank` also sets `rel="noopener"`.                                     |
| `clickable` | `boolean`          | `false`     | The row is a button and emits `select`. Ignored with `to` or `href`.                  |
| `current`   | `boolean`          | `false`     | The current row. Sets `aria-current`.                                                 |
| `disabled`  | `boolean`          | `false`     | Inert and muted.                                                                      |

## NbContainedListItem events

| Event    | Payload                       | Description                                                         |
| -------- | ----------------------------- | ------------------------------------------------------------------- |
| `select` | `MouseEvent \| KeyboardEvent` | The row was activated by a click, Enter or Space. `clickable` only. |

## NbContainedListItem slots

| Slot       | Description                                   |
| ---------- | --------------------------------------------- |
| `default`  | Replaces `title`.                             |
| `line`     | Replaces `line`.                              |
| `leading`  | Before everything: an avatar, an icon, a dot. |
| `trailing` | At the end: one badge or a count.             |
