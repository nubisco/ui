---
layout: nubisco
title: Close Button
intro: '`NbCloseButton` is the one control that closes or dismisses something: a dialog, a side panel, a sheet, a toast, a banner. It is a ghost icon-only `NbButton` with the `x` icon, in the two sizes Carbon uses for the job.'
source: src/components/CloseButton.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Sizes

<preview dir="row" gap="xxl">
  <measure>
    <NbCloseButton size="lg" />
  </measure>
  <measure>
    <NbCloseButton />
  </measure>
</preview>

`lg` is 48px square with a 20px icon. `sm` is 32px square with a 16px icon.
Both are `NbButton`'s icon-only sizes, so the icon stays on the 16, 20, 24,
32 scale.

## States

It is a ghost: no box at rest, the surface's neutral hover under the pointer,
and the one focus ring every control shares (`focus.ring`). Disabled takes
the disabled text colour and drops the pointer.

## On a tinted ground

A close button inside a status surface takes that surface's ink rather than
the page's. `NbBanner` does it with three custom properties: the glyph is
`--nb-banner-fg`, the hover is that colour mixed into the ground, and the
focus ring's inner band is the banner's ground. Do the same for a tinted
container of your own, so the hover is never a patch of the wrong surface.
