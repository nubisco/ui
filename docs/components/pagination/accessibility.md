---
layout: nubisco
title: Pagination
intro: '`NbPagination` is the footer companion for [`NbDataTable`](/components/data-table/usage), usable standalone. It is fully controlled: it emits `update:page` / `update:pageSize` and renders whatever `page`, `pageSize` and `total` you pass back, so the same wiring drives client-side slicing or server-side paging.'
source: src/components/Pagination.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## What the component guarantees

- **A named navigation landmark.** The bar is a `<nav>` named "Pagination", so it is listed among the page's landmarks.
- **Named buttons.** Previous and next are `NbButton`s named "Previous page" and "Next page", disabled natively at the first and last page.
- **The range is announced.** The "1–10 of 95 items" text is an `aria-live="polite"` region, so changing page or page size is heard without moving focus.
- **The page-size control is labelled** by its visible text: the `NbSelect` trigger is a button inside a `<label>`, so "Items per page" names it with no duplicate `aria-label`.
- **Touch targets on phones** come from `NbButton`'s `hit-area`, 44px on a phone touch screen. A desktop is unchanged.
- Tested in `tests/Pagination.test.ts` and by axe in `tests/axe.test.ts`.

## Keyboard

| Key                                 | Action                                         |
| ----------------------------------- | ---------------------------------------------- |
| <kbd>Tab</kbd>                      | Page size, then previous, then next            |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activates the focused button or opens the list |

## What you own

- **Where focus goes after a page change.** The buttons stay focused, which is right for paging through. If the new page should be read from the top, move focus to the table yourself.
- **A distinct name** when a page has two paginated lists. Both bars are "Pagination" today; wrap one in a labelled region.
- **The words** for other languages, through `page-size-label` and `item-label`.

## Known gaps

- At the first page "Previous page" is natively disabled, so it leaves the tab order, and focus on it drops to `<body>` when you arrive there by pressing it. Move focus to "Next page" in your `update:page` handler if your users page back and forth by keyboard.
- "Pagination", "Previous page", "Next page" and "Page 1 of 10" are fixed English strings.
- No manual screen reader pass has been recorded for this component.

<!--@include: ./_shared.md-->
