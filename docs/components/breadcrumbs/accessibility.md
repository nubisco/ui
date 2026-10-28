---
layout: nubisco
title: Breadcrumbs
intro: '`NbBreadcrumbs` shows where the person is and the way back up. A crumb that stands for one of several siblings (a company, a client, a repository, a year) can also switch to another one, in place.'
source: src/components/Breadcrumbs.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The trail is a `<nav aria-label="breadcrumb">`. The current crumb is text
  with `aria-current="page"`.
- The switcher is a real `<button>` after the label, never inside the link. It is
  reached with Tab after the crumb, opened with Enter, Space or the down arrow,
  and announces `aria-expanded` and `aria-haspopup="listbox"`. Its name comes
  from `switchLabel`: name what it switches ("Switch company"), because the
  default only repeats the crumb.
- Opening it moves focus to the search box. The arrow keys move through the
  matches, Enter picks one, Escape closes the list and returns focus to the
  chevron.
- The current option is marked with a check, and is also exposed to assistive
  technology as the selected option.
- On a phone, the last crumb's chevron is still a button of at least 32 by 32
  pixels.
