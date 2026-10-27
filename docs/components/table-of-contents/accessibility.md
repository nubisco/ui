---
layout: nubisco
title: Table of Contents
intro: '`NbTableOfContents` lists the sections of a long page as links, highlights the section being read as the page scrolls, and scrolls to a section when one is chosen. It comes in two forms: **docked**, for a page with a gutter beside the content, and **floating**, a single button that opens the list over a page with no room for one.'
source: src/components/TableOfContents.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard and accessibility

- The list is a `<nav>` landmark, named by `label`, holding nested `<ol>` lists of real links. Every link is in the tab order, unlike the rows of a tree.
- The current section carries `aria-current="location"`.
- The show and hide buttons carry `aria-expanded` and `aria-controls`. Hiding the list moves focus to the show button, so a keyboard user is not dropped to the top of the page.
- In the floating form, <kbd>Escape</kbd> closes the list and returns focus to its button.

<!--@include: ./_shared.md-->
