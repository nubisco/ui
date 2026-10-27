---
layout: nubisco
title: Nubisco Mark
intro: '`NbNubiscoMark` is the Nubisco mark itself: the three-leg gradient artwork, inlined as an SVG. It exists so no product has to keep its own copy of the logo. One mark ships with the library, every product renders that one, and it cannot drift between them.'
source: src/components/NubiscoMark.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview dir="row">
  <NbNubiscoMark :size="24" />
  <NbNubiscoMark :size="48" />
  <NbNubiscoMark :size="96" />
</preview>

```vue
<template>
  <NbNubiscoMark :size="24" />
</template>
```

The gradients are fixed brand colours, not theme tokens, and the mark is drawn to read on both light and dark grounds, so there is no per-theme variant and nothing to switch at runtime.

## Sizing

`size` is the rendered edge length. A number is taken as pixels; a string is passed to CSS as given, so `'1.5rem'` and `'100%'` both work. The artwork is square, on a `0 0 320 320` viewBox.

## Several marks on one page

SVG gradient ids are document-global. If two copies of the mark declared the same ids, the second would silently paint with the first one's gradients. Every instance scopes its own ids, so any number of marks can coexist. A host mounting several Vue apps on one page should give them distinct `app.config.idPrefix` values, which is what that option is for.

## Where it is already used

`NbUserMenu` renders `NbNubiscoPlatformMark` at 13px in the lockup at the foot of its panel: the lockup names Nubisco Platform, so it carries the platform's mark rather than the corporate one. That lockup stays optional: `brand="none"` removes it, and the `#brand` slot replaces it, so a white-label product supplies its own logo. This component standardises the mark for products that do want to show it, it does not oblige anyone to.
