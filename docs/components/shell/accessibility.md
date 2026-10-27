---
layout: nubisco
title: Shell
intro: '`NbShell` is the top-level layout component for building application shells. It provides a three-column structure: a fixed sidebar, a body area (with topbar and scrollable main content), and an optional inspector panel.'
source: src/components/Shell.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

The shell is the application frame, so it owns the parts of the accessibility story that are structural: the landmarks, the way into the content, and whether a region that is not visible is still reachable.

### Landmarks, named by default

The sidebar renders as `<nav>`, the main region as `<main>` and the inspector as `<aside>` (a complementary landmark). Two of those get a default accessible name, because an unnamed landmark is indistinguishable from another of the same type in a landmark list:

| Element   | Name comes from   | Default     |
| --------- | ----------------- | ----------- |
| `<nav>`   | `sidebar-label`   | `Primary`   |
| `<aside>` | `inspector-label` | `Inspector` |

Set them when the words are wrong for your product (`inspector-label="Properties"`), or when your application is localised. If you also put a `<nav>` in `outer-menu` or `inner-menu`, name that one yourself: it is your markup, not ours. And do not nest another `<main>` in the default slot.

### Skip link

The shell renders one, as its first focusable element, pointing at the `<main>` it renders. It is off-screen until it takes focus and comes back into the top-left corner of the frame when it does.

This is the shell's job rather than yours because the shell is the only thing that knows where `<main>` is. Every application that hand-rolled a skip link had to invent an id for a region it does not render, and wrap its own content in a div to have something to attach it to.

```vue
<!-- Nothing to do: the link is already there. -->
<NbShell>…</NbShell>

<!-- Localised. -->
<NbShell skip-to-content-label="Saltar al contenido" />

<!-- The main region gets a known id, for a router scroll behaviour
     or an aria-controls elsewhere in the app. -->
<NbShell main-id="app-main" />

<!-- Off, for an application that already ships its own. -->
<NbShell :skip-to-content="false" />
```

`<main>` carries `tabindex="-1"` so following the link moves focus rather than only scrolling, and the shell calls `focus()` on click as well, which is what keeps it working under a router that intercepts in-page anchors.

### The closed inspector is inert

The inspector column stays in the DOM at zero width when `inspector-visible` is false, because that is what lets it animate open and what gives a contributed panel somewhere to live before it is shown. While it is closed the shell puts `inert` and `aria-hidden` on it, so its controls are neither tabbable nor announced.

That matters more now than it used to: `inspector` is a `useShellSlot` region, so a view can teleport a whole panel into a column the application has not opened. You do not need to guard the content with `v-if`, and you do not need to unmount your inspector view on close.

### The navigation drawer

Below `collapse-at` the sidebar is an overlay. Closed, it is `inert` and `aria-hidden`, so it is neither tabbable nor announced; open, focus moves into it and <kbd>Esc</kbd> or the scrim closes it and returns focus to the toggle. The toggle is a `<button type="button">` with `aria-expanded` and `aria-controls`. See [Small viewports and zoom](#small-viewports-and-zoom) for the whole behaviour.

The drawer is not a focus trap. It is a navigation region, not a dialog: tabbing past the last link continues into the page behind it, which is the behaviour a disclosure has, and the scrim is decoration rather than a modal barrier.

### The inspector sheet is a covering overlay, so the body goes inert

Below `collapse-at` the inspector covers the content row, topbar included. While it does, `.nb-shell__body` carries both `inert` and `aria-hidden`, so Tab cannot reach the page under the sheet and a screen reader does not read it. The sheet renders its own `<button>` to close (named by `inspector-close-label`), <kbd>Esc</kbd> closes it, focus moves to that button when the sheet opens and returns to the opener when it closes.

The dismiss button is not decoration: because the body is inert, and because the body is where the drawer toggle and `topbar-right` live, it is the only control the frame can guarantee is reachable. Above the breakpoint none of this applies and none of it renders.

### Panel size controls

`NbShellPanel`'s default minimize / default / maximize buttons are `type="button"` (they are commonly inside a form in an inspector), carry `aria-pressed` for the active size, sit in a named `role="group"`, and their glyphs are `aria-hidden`. Replacing the `controls` slot replaces all of that, so name your own buttons.

### Motion

Three things in the shell move: the inspector's width when it opens, the navigation drawer sliding in at collapsed widths, and the skip link sliding into the corner. All three are suppressed under `prefers-reduced-motion: reduce`, along with the resize handle's highlight and `NbShellPanel`'s header fades. The states are still reached, only instantly.

Anything you animate inside a slot is yours to gate. `useReducedMotion`, exported from `@nubisco/ui`, reads the preference reactively if you need it in script rather than in CSS.

### Contributions and focus

Contributions teleport, so contributed controls move in the DOM but keep their component identity: focus survives the move, and it survives the shell re-rendering around them. What teleporting does not do is reorder the tab sequence to match what you see. Under `claim: 'all'` the `order` option sorts contributions visually with CSS `order`; tab order stays registration order. See the [composable's own accessibility note](/composables/use-shell-slot#accessibility).

<!--@include: ./_shared.md-->
