---
layout: nubisco
title: Table of Contents
intro: '`NbTableOfContents` lists the sections of a long page as links, highlights the section being read as the page scrolls, and scrolls to a section when one is chosen. It comes in two forms: **docked**, for a page with a gutter beside the content, and **floating**, a single button that opens the list over a page with no room for one.'
source: src/components/TableOfContents.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Items

`items` is flat, in document order, with each heading's level. The component nests them itself. Nesting is relative, so an `h4` straight under an `h2` sits one step in, and a skipped level never opens an empty indent.

By default an item's `id` is the target element's `id`, and each link points at `#id`, so a link opened in a new tab lands on the same section. When the targets have no ids (headings an editor rebuilds as they are typed, for example) pass `resolveTarget`:

```vue
<NbTableOfContents
  :items="outline"
  :resolve-target="(item, index) => headings[index] ?? null"
/>
```

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

<!--@include: ./_shared.md-->
