---
layout: nubisco
title: Table of Contents
intro: '`NbTableOfContents` lists the sections of a long page as links, highlights the section being read as the page scrolls, and scrolls to a section when one is chosen. It comes in two forms: **docked**, for a page with a gutter beside the content, and **floating**, a single button that opens the list over a page with no room for one.'
source: src/components/TableOfContents.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## Following the scroll

The section being read is the last one whose heading has scrolled above `offset` pixels from the top of the scroll container. At the very bottom of the page the last section on screen wins instead, because a short final section can never scroll that far. The scroll container is found for you: the nearest scrolling ancestor of the first target, which in an application shell is usually `<main>`, not the window.

Keep `offset` larger than the targets' `scroll-margin-top`, so the section a link scrolls to is the one that ends up highlighted. While a smooth scroll is on its way, the highlight stays on the chosen section rather than flickering through the ones it passes.

Bind `v-model:active` to know the current section or set it yourself. Set `:spy="false"` to turn scroll tracking off.

## Choosing a section

A plain click scrolls to the section, marks it with `aria-current="location"`, and moves focus to it (unless it is inside an editable region, where focus would not put the caret there). The address bar gets `#id` with `replaceState`, so the URL is shareable and Back still leaves the page. Set `:update-hash="false"` to leave the address bar alone. A modified click (new tab, new window) is left to the browser.

Set `follow-hash` to land on the section named in the address bar when the page opens. It waits until that section has rendered, and does it once.

## Collapsing

A docked contents can be hidden down to its show button, and the choice is the host's to remember: bind `v-model:open` and store it, so a reader who closes the contents finds it closed on the next page. Set `:collapsible="false"` for one that is always open.

<!--@include: ./_shared.md-->
