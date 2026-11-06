---
layout: nubisco
title: Page Header
intro: "`NbPageHeader` is the top of a page: where it sits, what it is called, the one state it is in, the few facts that define it, and what can be done to it. It renders the page's one `<h1>`."
source: src/components/PageHeader.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: native
  screenReader: not recorded
---

- The header is a `<header>` element and the title is the page's `<h1>`. A
  screen reader user who jumps to the first heading lands on the page's name.
  Render one per page, and no other `<h1>`.
- The status badge sits inside the same row as the `<h1>` but outside it, so
  the heading reads as the name alone and the state is read next.
- The eyebrow comes before the heading in the source, so it is read first:
  keep it short ("Part of Platform roadmap"). It is not a `nav` landmark: the
  breadcrumb trail in the frame is the page's one navigation statement of where
  the user is.
- Actions are buttons in reading order after the title. On a phone, folded
  actions sit behind one "more" button with an accessible name, from
  `NbActionGroup`.
- Sticky headers stay at the top of the scroll container. The page content
  under them still scrolls into view on focus, because the header is in the
  flow rather than fixed over it.
