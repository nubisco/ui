---
layout: nubisco
title: Panel
intro: '`NbPanel` is a surface container that groups related content inside a styled card. It provides a consistent background, border, and spacing out of the box.'
source: src/components/Panel.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbPanel>
    <p style="margin: 0">Simple panel with default styling.</p>
  </NbPanel>
</preview>

```vue
<template>
  <NbPanel>
    <p>Simple panel with default styling.</p>
  </NbPanel>
</template>
```

## A header

Give a panel a `title` and it renders a header: the title at `heading-01`, a
`description` under it, a `meta` slot beside the title for a count or an info
hint, and an `actions` slot at the end for the panel's one filled button. The
title size is fixed by the component, so two panels on one page cannot drift
apart. A panel without any of these renders no header at all.

<preview>
  <NbPanel title="Members" description="Everyone who can open this project." style="width: 100%">
    <template #meta><NbBadge size="sm" variant="grey">4</NbBadge></template>
    <template #actions><NbButton size="sm" variant="primary">Invite</NbButton></template>
    <p style="margin: 0">The list goes here.</p>
  </NbPanel>
</preview>

```vue
<NbPanel title="Members" description="Everyone who can open this project.">
  <template #meta><NbBadge size="sm" variant="grey">4</NbBadge></template>
  <template #actions>
    <NbButton size="sm" variant="primary">Invite</NbButton>
  </template>
  ...
</NbPanel>
```

`icon` draws a small muted icon before the title, and an `NbInfoHint` in `meta` sits right after it:

<preview>
  <NbPanel title="Members" icon="users" style="width: 100%">
    <template #meta><NbInfoHint text="Everyone who can open this project." /></template>
    <p style="margin: 0">The list goes here.</p>
  </NbPanel>
</preview>

```vue
<NbPanel title="Members" icon="users">
  <template #meta><NbInfoHint text="Everyone who can open this project." /></template>
  ...
</NbPanel>
```

One filled button per header: a second `primary` in the same `actions` slot
warns in development. See
[Information hierarchy](/principles/hierarchy#emphasis-one-filled-button-per-region).

## Raised or flat

A panel is raised: it paints the next plane, and that says "this is a group".
A page has at most one raised region, the thing it is for. Supporting tiles
sit on the ground with `flat`, which keeps the border and padding and paints
no surface.

<preview>
  <NbGrid dir="col" gap="md" style="width: 100%">
    <NbPanel title="Waiting on you">The one region the page is for.</NbPanel>
    <NbCardGrid min="200px">
      <NbPanel flat title="Recent changes" heading-level="h3">A supporting tile.</NbPanel>
      <NbPanel flat title="Due this week" heading-level="h3">Another one.</NbPanel>
    </NbCardGrid>
  </NbGrid>
</preview>

## Nesting content

Panels accept any slotted content, including other components.

<preview>
  <NbPanel>
    <NbGrid dir="row" gap="md">
      <NbGrid dir="col" grow>
        <NbTextInput label="First name" placeholder="Jane" />
      </NbGrid>
      <NbGrid dir="col" grow>
        <NbTextInput label="Last name" placeholder="Doe" />
      </NbGrid>
    </NbGrid>
  </NbPanel>
</preview>
