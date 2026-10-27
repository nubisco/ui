---
layout: nubisco
title: Spinner
intro: '`NbSpinner` says one thing: work is happening and we cannot say how much is left. It carries no measurement, so if you can count bytes, files or records, you are holding the wrong component.'
source: src/components/Spinner.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The root element is `role="status"` with `aria-live="polite"`, so the label is
  announced without interrupting whatever the user is reading.
- **The live region is mounted empty and filled on the next task.** A region
  that is inserted into the document and filled in the same frame has no
  previous contents to be compared against, and the update is frequently never
  reported at all. So the announcement node goes in blank and the label is
  written a task later, which makes it a change to a region that was already
  being watched. This is the same reason `completeLabel` waits before writing,
  and the reason [`NbInlineLoading`](/components/inline-loading/usage) keeps its
  text node mounted while inactive.
- **The visible label and the announced label are two different nodes.** With
  `showLabel`, the text you can see is `aria-hidden="true"` and the text that is
  announced is visually hidden (clipped, never `display: none`). One label, read
  once.
- The ring is an `<svg>` marked `aria-hidden="true"` and `focusable="false"`,
  which also keeps it out of the tab order in older Edge.
- `decorative` removes the role, the live region and the label, and marks the
  whole component `aria-hidden="true"`. Use it whenever an ancestor already
  announces the state, which is what [`NbInlineLoading`](/components/inline-loading/usage)
  does internally. Two live regions for one operation is worse than none.
- **`decorative` is ignored by `overlay="page"`.** A full-viewport scrim is the
  element holding focus and the only thing on the screen; there is no ancestor
  left to announce on its behalf. Marking it `aria-hidden` would park a screen
  reader user on a node that reports nothing at all, so a page overlay always
  keeps its name. It is the one place in the component where a prop does not do
  what it says, and it is deliberate.
- `delay` keeps the component out of the DOM entirely until it fires, so an
  operation that finishes first never announces a load that already ended.
- **Reduced motion**: under `prefers-reduced-motion: reduce` the arc becomes a
  complete ring that breathes in opacity. Nothing rotates and nothing
  translates, but the indicator is still visibly alive. Freezing a partial arc
  into a static crescent is the common shortcut and it is wrong: it reads as a
  hung process, which is the exact message the component exists to disprove.
- The preference is honoured twice: by the media query, and by a
  `nb-spinner--reduced-motion` class read from `matchMedia`, so flipping the OS
  setting with the page already open takes effect without a reload.
- **Windows high contrast**: forced colours discard author colours, which would
  leave the track and the arc the same system colour (a plain grey circle with
  no motion cue) and collapse the scrim into opaque `Canvas`. Under
  `forced-colors: active` the arc opts out with `forced-color-adjust` and paints
  in `CanvasText`, the track drops back to `Canvas`, and both overlays keep a
  `CanvasText` outline so the blocked region is still legible as blocked.
- **Completion is announced only if you ask for it.** `completeLabel` speaks
  once, politely, through a shared live region that outlives the component,
  because a region being torn down cannot say anything. Nothing is spoken if
  the spinner never became visible (a `delay` that outran the request announced
  no load, so it has no completion to report) or if it is `decorative`.
  Alternatively, move focus to the content that arrived and let that be the
  announcement, but do one or the other: a load that ends in silence is the
  most common accessibility defect in this whole area.
- **`overlay="page"` blocks, and it blocks with `inert`.** It teleports to
  `<body>`, marks every body child that existed at claim time `inert`, takes
  focus itself, locks body scroll and hands focus back when it leaves. A scrim
  a keyboard user can tab straight through is not blocking anything, and that
  is the defect this mode exists to avoid.
- **There is no focus trap, on purpose.** `inert` removes a subtree from the
  tab order, from hit testing and from the accessibility tree in one attribute,
  which is strictly more than a trap can do, and it cannot get into a fight. A
  trap that reclaims focus has to rank itself against every other holder, and
  against a widget that refocuses itself on `focusout` it recurses until the
  stack ends. Nothing here listens to `focusin` and nothing swallows `Tab`.
- **A dialog opened on top of the overlay stays usable**, because it arrived
  after the claim and was never inerted, and it paints above the scrim because
  both sit at `--nb-zindex-modal` and it is later in document order. This is the
  one ordering worth testing yourself if you change anything here: an element
  that is painted on top and cannot be focused is worse than no containment.
- **Containment has one exception, and it is announcers.** A host marked
  `data-nb-overlay-exempt` is never inerted, because `inert` would take it out
  of the accessibility tree as well as out of the tab order and leave a toast
  painted above the scrim and silent. The library marks its own live regions
  (`NbToaster`'s two announcers and its stack, and the shared completion
  announcer); mark your own with the attribute or with `markOverlayExempt()`,
  and mark nothing else. The attribute is read when the overlay claims, and an
  exempt host inside a wrapper of yours keeps the wrapper's other children
  blocked.
- **The default slot is outside the announcement.** Content slotted into an
  overlay sits in `aria-live="off"`, so a cancel button is a control the user
  can reach rather than a phrase appended to "Switching tenant". It is inside
  the overlay's own subtree, which is the part a page overlay never inerts, so
  it is genuinely focusable while the application behind it is not.
- **`overlay="container"` contains its region too.** The covered parent is
  marked `aria-busy="true"` and its other children are marked `inert`, so the
  form under the scrim is not tabbable while it is unavailable.
- Colour is never the only signal here, since the component's whole content is
  motion plus text.

<!--@include: ./_shared.md-->
