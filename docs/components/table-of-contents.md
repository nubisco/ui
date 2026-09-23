---
layout: nubisco
title: Table of Contents
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbTableOfContents` lists the sections of a long page as links, highlights the section being read as the page scrolls, and scrolls to a section when one is chosen. It comes in two forms: **docked**, for a page with a gutter beside the content, and **floating**, a single button that opens the list over a page with no room for one.

Scroll the article below, then choose a section.

<preview>
  <div class="toc-demo">
    <div ref="article" class="toc-demo__article">
      <template v-for="section in sections" :key="section.id">
        <component :is="`h${section.level}`" :id="section.id" class="toc-demo__heading">{{ section.label }}</component>
        <p v-for="n in 3" :key="n">{{ filler }}</p>
      </template>
    </div>
    <div class="toc-demo__gutter">
      <NbTableOfContents :items="sections" :root="article" :offset="40" :update-hash="false" />
    </div>
  </div>
</preview>

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ITableOfContentsItem } from '@nubisco/ui'

const article = ref<HTMLElement | null>(null)
const sections: ITableOfContentsItem[] = [
  { id: 'overview', label: 'Overview', level: 2 },
  { id: 'install', label: 'Install', level: 3 },
  { id: 'configure', label: 'Configure', level: 3 },
  { id: 'usage', label: 'Usage', level: 2 },
]
</script>

<template>
  <article ref="article">
    <h2 id="overview">Overview</h2>
    <!-- … -->
  </article>
  <aside>
    <NbTableOfContents :items="sections" :root="article" />
  </aside>
</template>
```

## Items

`items` is flat, in document order, with each heading's level. The component nests them itself. Nesting is relative, so an `h4` straight under an `h2` sits one step in, and a skipped level never opens an empty indent.

By default an item's `id` is the target element's `id`, and each link points at `#id`, so a link opened in a new tab lands on the same section. When the targets have no ids (headings an editor rebuilds as they are typed, for example) pass `resolveTarget`:

```vue
<NbTableOfContents
  :items="outline"
  :resolve-target="(item, index) => headings[index] ?? null"
/>
```

## Following the scroll

The section being read is the last one whose heading has scrolled above `offset` pixels from the top of the scroll container. At the very bottom of the page the last section on screen wins instead, because a short final section can never scroll that far. The scroll container is found for you: the nearest scrolling ancestor of the first target, which in an application shell is usually `<main>`, not the window.

Keep `offset` larger than the targets' `scroll-margin-top`, so the section a link scrolls to is the one that ends up highlighted. While a smooth scroll is on its way, the highlight stays on the chosen section rather than flickering through the ones it passes.

Bind `v-model:active` to know the current section or set it yourself. Set `:spy="false"` to turn scroll tracking off.

## Choosing a section

A plain click scrolls to the section, marks it with `aria-current="location"`, and moves focus to it (unless it is inside an editable region, where focus would not put the caret there). The address bar gets `#id` with `replaceState`, so the URL is shareable and Back still leaves the page. Set `:update-hash="false"` to leave the address bar alone. A modified click (new tab, new window) is left to the browser.

Set `follow-hash` to land on the section named in the address bar when the page opens. It waits until that section has rendered, and does it once.

## Floating

The floating form is for a page with no gutter: a narrow reading column, or a phone. It starts closed as a single button, opens onto a surface over the page, and closes again when a section is chosen or <kbd>Escape</kbd> is pressed. Place it yourself, typically in a corner of the page.

<preview>
  <div class="toc-demo toc-demo--floating">
    <div ref="floatingArticle" class="toc-demo__article">
      <template v-for="section in floatingSections" :key="section.id">
        <component :is="`h${section.level}`" :id="section.id" class="toc-demo__heading">{{ section.label }}</component>
        <p v-for="n in 3" :key="n">{{ filler }}</p>
      </template>
    </div>
    <NbTableOfContents
      class="toc-demo__floating"
      variant="floating"
      :items="floatingSections"
      :root="floatingArticle"
      :offset="40"
      :update-hash="false"
    />
  </div>
</preview>

```vue
<div class="page">
  <article ref="article">…</article>
  <NbTableOfContents
    class="page__contents"
    variant="floating"
    :items="sections"
    :root="article"
  />
</div>

<style scoped>
.page {
  position: relative;
}
.page__contents {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
}
</style>
```

## Collapsing

A docked contents can be hidden down to its show button, and the choice is the host's to remember: bind `v-model:open` and store it, so a reader who closes the contents finds it closed on the next page. Set `:collapsible="false"` for one that is always open.

## Keyboard and accessibility

- The list is a `<nav>` landmark, named by `label`, holding nested `<ol>` lists of real links. Every link is in the tab order, unlike the rows of a tree.
- The current section carries `aria-current="location"`.
- The show and hide buttons carry `aria-expanded` and `aria-controls`. Hiding the list moves focus to the show button, so a keyboard user is not dropped to the top of the page.
- In the floating form, <kbd>Escape</kbd> closes the list and returns focus to its button.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type                                                                 | Default               | Description                                                                         |
| --------------- | -------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `items`         | `ITableOfContentsItem[]`                                             | (required)            | Sections in document order: `{ id, label, level }`.                                 |
| `active`        | `string \| null`                                                     | unbound               | The section being read (`v-model:active`). Unbound, tracked internally.             |
| `open`          | `boolean`                                                            | unbound               | Whether the list shows (`v-model:open`). Unbound, docked starts open, floating not. |
| `variant`       | `'docked' \| 'floating'`                                             | `'docked'`            | Gutter form, or a button that opens the list over the page.                         |
| `collapsible`   | `boolean`                                                            | `true`                | Docked only: whether it can be hidden to its show button.                           |
| `title`         | `string`                                                             | `'Contents'`          | Visible heading above the list.                                                     |
| `label`         | `string`                                                             | `'Table of contents'` | Accessible name of the `<nav>` landmark.                                            |
| `showLabel`     | `string`                                                             | `'Show contents'`     | Accessible name of the show button.                                                 |
| `hideLabel`     | `string`                                                             | `'Hide contents'`     | Accessible name of the hide button.                                                 |
| `root`          | `HTMLElement \| null`                                                | `null`                | Where targets are looked up. `null` is the whole document.                          |
| `resolveTarget` | `(item: ITableOfContentsItem, index: number) => HTMLElement \| null` | by `id`               | Finds a section's element when targets have no ids.                                 |
| `spy`           | `boolean`                                                            | `true`                | Highlight the section being read as the page scrolls.                               |
| `offset`        | `number`                                                             | `96`                  | Pixels below the top of the scroll container a heading still counts as current.     |
| `updateHash`    | `boolean`                                                            | `true`                | Write `#id` to the address bar with `replaceState` on a choice.                     |
| `followHash`    | `boolean`                                                            | `false`               | Scroll once to the section in the address bar's fragment when it renders.           |

## Events

| Event           | Payload                      | Description                                       |
| --------------- | ---------------------------- | ------------------------------------------------- |
| `navigate`      | `item: ITableOfContentsItem` | A section was chosen from the list.               |
| `update:active` | `id: string \| null`         | The current section changed, by scroll or choice. |
| `update:open`   | `open: boolean`              | The list was shown or hidden.                     |

## Exposed methods

| Member    | Type                                                                           | Description                                                  |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `go`      | `(item: string \| ITableOfContentsItem, opts?: { instant?: boolean }) => void` | Scrolls to a section, as a click on its link does.           |
| `measure` | `() => void`                                                                   | Re-reads the scroll position, after moving content yourself. |

## Tokens used

| Token                                             | Applied to                                  |
| ------------------------------------------------- | ------------------------------------------- |
| `--nb-c-text-subtle`, `--nb-c-text`               | Links, and the current or hovered link      |
| `--nb-c-primary`                                  | The current section's reading-edge rule     |
| `--nb-c-focus-ring`                               | Link focus outline                          |
| `--nb-c-surface`, `--nb-c-border`, `--nb-c-scrim` | Floating surface (overlay layer) and shadow |
| `--nb-toc-max-height`                             | Height after which the list scrolls         |
| `--nb-toc-floating-width`                         | Width of the floating surface (`18rem`)     |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const article = ref<HTMLElement | null>(null)
const floatingArticle = ref<HTMLElement | null>(null)

const sections = [
  { id: 'toc-demo-overview', label: 'Overview', level: 2 },
  { id: 'toc-demo-install', label: 'Install', level: 3 },
  { id: 'toc-demo-configure', label: 'Configure', level: 3 },
  { id: 'toc-demo-usage', label: 'Usage', level: 2 },
  { id: 'toc-demo-limits', label: 'Limits', level: 2 },
]

const floatingSections = sections.map((section) => ({
  ...section,
  id: section.id.replace('toc-demo-', 'toc-floating-'),
}))

const filler =
  'A table of contents earns its place on a page long enough to lose your way in. This paragraph is here to give the section some length, so there is something to scroll past.'
</script>

<style scoped>
.toc-demo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14rem;
  gap: 24px;
  width: 100%;
}

.toc-demo--floating {
  position: relative;
  grid-template-columns: minmax(0, 1fr);
}

.toc-demo__article {
  height: 320px;
  overflow-y: auto;
  padding-inline-end: 8px;
}

.toc-demo__heading {
  margin-block: 16px 8px;
  scroll-margin-top: 8px;
}

.toc-demo__heading:first-child {
  margin-block-start: 0;
}

.toc-demo__floating {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 16px;
}
</style>
