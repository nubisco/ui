---
layout: nubisco
title: Back To Top
intro: '`NbBackToTop` is a round floating button in the bottom corner that takes the visitor back to the top of a long page. It appears once the page has been scrolled past one screen height, and disappears again near the top. Place it once, in the layout every long page shares.'
source: src/components/BackToTop.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- It is a real button named by `label` ("Back to top" by default), with the
  same text as its tooltip.
- It is only in the page while it is shown, so it is never an invisible tab
  stop on the first screen.
- Used from the keyboard, focus returns to the first focusable element on the
  page, so the next Tab continues from the top rather than from a button that
  has just disappeared. A mouse click leaves focus where it is.
- Under reduced motion the page jumps instead of scrolling smoothly, and the
  button appears without a transition.
