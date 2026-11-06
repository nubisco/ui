---
layout: nubisco
title: Page Layout
intro: '`NbPageLayout` is a main region and an aside, side by side when there is room and stacked when there is not. It decides from the width it is given, not from the window, so it reflows at the right moment inside the shell.'
source: src/components/PageLayout.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbPageLayout style="width: 100%">
    <NbPanel title="Work">The measured half: what the record is checked against.</NbPanel>
    <template #aside>
      <NbPanel flat title="Why it matters" heading-level="h3">The judgement beside it.</NbPanel>
    </template>
  </NbPageLayout>
</preview>

```vue
<NbPageLayout>
  <NbPanel title="Work">...</NbPanel>
  <template #aside>
    <NbPanel flat title="Why it matters">...</NbPanel>
  </template>
</NbPageLayout>
```

## The main region is first and widest

Position is rank. The main region always comes first and takes the larger
share: `3:2` by default. The aside is supporting material, narrower and
later. If the aside is what the page is for, it is not an aside: swap them.
See [Information hierarchy](/principles/hierarchy#position-area-is-rank).

## Width

`aside-width` takes either:

- **A ratio** of main to aside: `'3:2'` (the default), `'2:1'`, `'1:1'`. Both
  regions grow with the page.
- **A CSS length** for a fixed aside: `'20rem'`, `'320px'`. The main region
  takes the rest.

## Stacking

Below a container width the two regions stack: `stack-below` is `sm` (480px),
`md` (720px, the default) or `lg` (960px). It is a **container** query: inside
`NbShell` the content column is narrower than the window by the rail and any
open inspector, and a viewport query would fire at the wrong moment. See
[Layout, Inside the shell](/principles/layout).

Stacked, the main region comes first. `aside-first` puts the aside first
instead, for an aside that has to be read before the main region. Side by side,
the main region is always on the start side.

On a phone the content column is under every threshold, so the layout stacks
by construction. There is no phone rule, and nothing changes on a desktop for a
page that does not use the component.

## Gap

`gap` is on `NbGrid`'s scale and defaults to `xl` (32px): main and aside are
regions of a page, and regions sit one step further apart than the groups
inside them.
