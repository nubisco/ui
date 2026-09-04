---
title: Keyboard interaction
description: Tab order, Escape and Enter conventions, focus visibility, focus management across dialogs and routes, arrow-key composites, skip links, and how to make a whole row activatable.
---

# Keyboard interaction

Everything a pointer can do, a keyboard must be able to do. That is WCAG 2.2 SC 2.1.1 and it is the criterion the fleet fails most often, always the same way: an interaction gets attached to an element that cannot receive focus, and nobody notices because everybody testing it has a mouse.

This page is the model. It says which keys mean what, where focus goes when the page changes underneath it, and how to add an interaction to something that is not already a control.

## What is focusable, and what is not

The tab sequence is the DOM order of everything that is focusable. Two rules follow, and between them they prevent most keyboard defects:

**Use the element that already means what you mean.** `<button>` is focusable, activates on <kbd>Enter</kbd> and <kbd>Space</kbd>, and announces as a button, for free. A `<div>` with `@click` is none of those things. `NbCard` demonstrates the whole decision in nine lines: `href` makes it an `<a>`, `clickable` makes it a `<div role="button" tabindex="0">` with an `Enter`/`Space` handler, and neither makes it a plain `<div>`. Pick the element from the behaviour and the keyboard arrives with it.

**`tabindex` takes exactly two values.**

| Value           | Meaning                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `tabindex="0"`  | In the tab sequence, at its DOM position. For an element you have made interactive.             |
| `tabindex="-1"` | Focusable by script only. For roving composites, and for containers you focus programmatically. |

Any positive value is a bug. `tabindex="3"` lifts an element above the entire natural sequence of the document, and one positive value anywhere on a page reorders every stop after it.

::: warning DOM order is tab order, and CSS does not change it
`order`, `row-reverse` and `grid-area` move the pixels and leave the sequence alone. A toolbar whose primary action is last in markup and first on screen reads visually as "Save, Cancel" and tabs as "Cancel, Save". Fix it in the template, not the stylesheet.
:::

### Never remove a focus indicator

`outline: none` on a focusable element with nothing put back is the defect. There are twenty `outline: none` declarations across `src/components`, and the legitimate ones all follow the same shape: the ring moves outward to a wrapper that can draw it around the whole control. `NbTextInput` and `NbNumberInput` strip the native input's outline and let `.nb-text-input__field-wrapper--focused` carry the visible state; `NbSelect` does the same on its trigger. **If you write `outline: none`, the same rule block or an ancestor must draw the replacement.**

Two of those wrappers key off `@focus`/`@blur` rather than `:focus-visible`, so they ring on a mouse click too. That is a cosmetic inconsistency rather than a failure, and it is the direction to be inconsistent in: too much ring is a nuisance, too little is a barrier.

Use `:focus-visible`, not `:focus`. `:focus` fires on click, which puts a ring on a button every mouse user has just pressed and trains teams to delete it. `:focus-visible` fires when the browser judges a visible indicator to be wanted, which is what you want:

```scss
.thing:focus-visible {
  outline: 2px solid var(--nb-c-focus-ring);
  outline-offset: 2px;
}
```

Two pixels, `--nb-c-focus-ring`, and an offset. Positive offset when the control has room around it, `-2px` when it is flush against a neighbour (table cells, menu rows, sidebar links all use the inset form). The library uses `outline`, never `box-shadow`, because outlines survive forced-colours mode and box-shadows are discarded.

## Keys and what they mean

Consistent across every component in the library. Departing from this in your application is worse than any individual choice on the list, because a keyboard user learns the system once.

| Key                                                 | Meaning                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>    | Move between components. Never between items inside one composite.                                                  |
| <kbd>Enter</kbd>                                    | Activate a button or link. In a single-line field, submit the form. Never inserts a newline in a single-line field. |
| <kbd>Space</kbd>                                    | Activate a button, toggle a checkbox or switch, select the focused option. Never activates a link.                  |
| <kbd>Esc</kbd>                                      | Dismiss the nearest transient layer, discarding nothing that has been committed. Never submits.                     |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Move within one composite. Never between components.                                                                |
| <kbd>Home</kbd> / <kbd>End</kbd>                    | First and last item of the focused composite.                                                                       |

### Escape

<kbd>Esc</kbd> closes the innermost thing that is open, and only that. A menu inside a dialog closes the menu on the first press and the dialog on the second. Getting this wrong in the other direction, one press taking down the whole stack, is the more annoying failure because the user loses work they did not intend to abandon.

Three rules that are not obvious:

- **Stop the event once you have handled it.** `NbMenu` calls `stopPropagation()` on <kbd>Esc</kbd> for exactly this reason. `NbModal`'s Escape handler is a `document`-level listener that fires for every open instance, so a nested modal takes both down; if you stack modals, handle Escape yourself.
- **Escape must not dismiss work in progress.** `NbConfirm` intercepts <kbd>Esc</kbd> in the capture phase while `busy`, so a dialog cannot vanish out from under a request that is already running.
- **Escape must not be the only way out.** Provide a visible Close or Cancel. Not every keyboard is a full keyboard, and Escape does not exist on some assistive and touch input paths.

### Enter and Space, and why they differ

They are not interchangeable, and the difference is what tells a screen reader user whether they are about to navigate or to act. A link responds to <kbd>Enter</kbd> alone; a button responds to both. If you make a `div` interactive, honour both and call `preventDefault()` on <kbd>Space</kbd>, otherwise the page scrolls under the user. `NbCard` and `NbReorderList` both do this.

::: danger Never bind a bare letter as a global shortcut
A single-character shortcut with no modifier and no scope fires while a screen reader user is navigating by first letter, and while anyone is dictating. If you want one, gate it on a modifier, or make it active only while a specific region has focus, and make it remappable. WCAG 2.2 SC 2.1.4 is explicit about this.
:::

## Where focus goes

A focus indicator is only useful if there is something under it. Every time the page changes structurally, something has to decide where focus lands, and the browser's default decision is almost always "nowhere", which means `<body>`, which means the next <kbd>Tab</kbd> restarts from the top of the document.

This is the finding the fleet audit produced most often, and it is invisible unless you specifically press <kbd>Tab</kbd> after an action.

### After a dialog closes

Focus returns to the element that opened it. Always, in every case, including cancel, including confirm, including Escape and including a click on the scrim.

`NbConfirm` does this: it records `document.activeElement` on open and restores it on close, which is why a delete launched from a row's overflow menu puts you back on that row instead of at the top of the table.

`NbModal` does not. If you are building a bespoke dialog on `NbModal`, this is yours:

```ts
import { ref, watch, nextTick } from 'vue'

const open = ref(false)
const previouslyFocused = ref<HTMLElement | null>(null)

watch(open, async (isOpen) => {
  if (isOpen) {
    previouslyFocused.value = document.activeElement as HTMLElement | null
    await nextTick()
    dialogBody.value
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      ?.focus()
  } else {
    previouslyFocused.value?.focus()
    previouslyFocused.value = null
  }
})
```

**Where inside the dialog?** The first interactive control, or the dialog container itself with `tabindex="-1"` if there is a lot of text to read first. Not the destructive button. `NbConfirm` focuses Cancel deliberately: a dialog that appears with a destructive default under an already-travelling <kbd>Space</kbd> keypress will delete the record.

**If the opener is gone**, because the dialog deleted the thing that opened it, do not restore focus to a detached node. See below.

### After a delete

The element that had focus no longer exists. Choose a target in this order:

1. The **next sibling** in the list, so repeated deletes work without a hand moving.
2. If it was the last item, the **previous sibling**.
3. If the list is now empty, the **container** with `tabindex="-1"`, or the empty state's primary action.

And announce it, because the visual result (a row disappearing) has no auditory equivalent:

```vue
<p v-if="lastAction" role="status" class="sr-only">{{ lastAction }}</p>
```

`NbReorderList` uses exactly this shape, an `aria-live` element alongside the list, to announce a move that is otherwise only a visual reshuffle.

### After a route change

An SPA replaces the document's contents and the browser, which did not navigate, leaves focus wherever it was, usually on a nav link that is still in the DOM. A screen reader user hears nothing and is now reading from the middle of a page they have not seen.

On every route change: move focus to the new view's heading (`tabindex="-1"` on the `<h1>`, focus it, and it will not be a tab stop), and make the change audible.

```ts
router.afterEach(async () => {
  await nextTick()
  const heading = document.querySelector<HTMLElement>('main h1')
  if (heading) {
    heading.setAttribute('tabindex', '-1')
    heading.focus()
  }
})
```

Do not scroll-and-hope. Do not focus `<body>`.

### After content appears inside the current view

A panel expands, a form step advances, an inline editor opens. Focus moves into the new content; on close it moves back to the control that opened it. `NbWalkthrough` focuses its popover on every step and restores the opener when the tour ends, which is what makes <kbd>Esc</kbd> feel like an exit rather than an abandonment.

### Never move focus without a user action

Focus that jumps because a fetch resolved, a poll ticked or a toast arrived is a defect, not a courtesy. It interrupts typing and it moves a magnifier user's viewport to somewhere they did not ask to be. Announce with a live region instead; that is what live regions are for.

## Focus trapping

While a modal dialog is open, everything behind it is inert. <kbd>Tab</kbd> from the last control inside wraps to the first, <kbd>Shift</kbd>+<kbd>Tab</kbd> from the first wraps to the last, and focus that ends up outside is pulled back in.

Two library components implement this today: `NbConfirm` and `NbWalkthrough`. `NbModal` does not, so a bespoke dialog needs the trap written by hand. The shape both use:

```ts
function focusables(): HTMLElement[] {
  return Array.from(
    dialog.value?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((el) => el.offsetParent !== null)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || !dialog.value?.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (
    !event.shiftKey &&
    (active === last || !dialog.value?.contains(active))
  ) {
    event.preventDefault()
    first.focus()
  }
}
```

The `offsetParent` filter matters: a control inside a collapsed section is in the DOM, matches the selector, and cannot be focused. Without the filter, <kbd>Tab</kbd> silently stops working at that point in the cycle.

**Trap only true modals.** A dropdown, a popover or a non-modal side panel must not trap: they close on <kbd>Tab</kbd> out instead. `NbMenu` gets this right (<kbd>Tab</kbd> closes the menu and the tab sequence resumes).

## Arrow-key composites

A composite widget is **one** tab stop. You <kbd>Tab</kbd> to it and you arrow within it. Twenty tabs to cross a menu is a defect even though every item is technically reachable.

The mechanism is a **roving `tabindex`**: exactly one descendant has `tabindex="0"` at a time, every other has `tabindex="-1"`, and the arrow handler moves both the `0` and the actual focus.

What the library implements, verified against source:

| Component              | Keys                                                                | Notes                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`NbTabs`**           | <kbd>&larr;</kbd> <kbd>&rarr;</kbd> <kbd>Home</kbd> <kbd>End</kbd>  | Roving `tabindex` on the active tab. Disabled tabs are skipped, and the ends wrap. Selection follows focus.                                                                |
| **`NbMenu`**           | <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>Esc</kbd> <kbd>Tab</kbd>   | Skips `aria-disabled` items. <kbd>Esc</kbd> and <kbd>Tab</kbd> both close. Does not wrap at the ends.                                                                      |
| **`NbAccordion`**      | <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>Home</kbd> <kbd>End</kbd>  | Between headers, skipping disabled ones, wrapping at both ends. Items are re-sorted by document position, so a `v-for` that reorders still moves focus correctly.          |
| **`NbReorderList`**    | <kbd>&uarr;</kbd> <kbd>&darr;</kbd>                                 | Moves the **item**, not the cursor, and announces the result through an `aria-live="assertive"` region. This is the answer to a reorder that would otherwise be drag-only. |
| **`NbTree`**           | <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>Home</kbd> <kbd>End</kbd>  | Moves through visible nodes. **See the gap below.**                                                                                                                        |
| **`NbCommandPalette`** | <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>Enter</kbd> <kbd>Esc</kbd> | Focus stays in the input and the arrows move a highlight in the list. **See the gap below.**                                                                               |

::: warning Two composites are incomplete, and here is exactly how
**`NbTree` has no tab stop.** Every `treeitem` carries `tabindex="-1"` and the `<ul role="tree">` container carries none, so the arrow handling is correct and unreachable: nothing puts focus into the tree in the first place. Until it is fixed, give the tree an entry point from your side, either by focusing the first node when the panel that contains it opens, or by rendering the tree inside a container you focus yourself.

**`NbCommandPalette` is not wired as a combobox.** The arrows move a visual highlight, but there is no `role="listbox"`, no `role="option"` and no `aria-activedescendant`, so a screen reader hears the query being typed and never hears the results change. It is usable by keyboard and not yet usable by a reader.
:::

::: tip Selection following focus, and when it must not
In `NbTabs`, arrowing to a tab selects it. That is correct for tabs whose panels are already rendered and cheap. If activating a tab triggers a network request or discards unsaved input, decouple them: arrow to move focus, <kbd>Enter</kbd> or <kbd>Space</kbd> to activate, and set `aria-selected` only on activation. A keyboard user should not be able to fire five requests by holding <kbd>→</kbd>.
:::

### Tables

`NbDataTable` is deliberately **not** an arrow-key grid. It renders a real `<table>`, which screen readers already navigate cell by cell with their own table commands, and it puts only the genuinely interactive parts (sort buttons, selection checkboxes, controls inside cells) in the tab sequence. Adding a roving grid on top would override the reader's own table navigation with a worse version of it.

Reach for `NbSpreadsheet` when cells are genuinely editable in place. That is a grid, and it behaves like one.

## Making a whole row activatable

The most common request in the fleet, and the source of two of its accessibility defects. It comes in two forms, one of which is easy.

### Card rows: solved

Use `NbCard`. `clickable` gives you `role="button"`, `tabindex="0"` and an <kbd>Enter</kbd>/<kbd>Space</kbd> handler; `href` gives you a real `<a>`. Both are already correct.

```vue
<NbCard
  v-for="env in environments"
  :key="env.id"
  :title="env.name"
  :subtitle="env.region"
  clickable
  @select="open(env)"
/>
```

The two apps that hand-rolled clickable card `<div>`s got inert cards. This component existed.

### Table rows: needs a pattern

You cannot fix a `<tr>` by adding `tabindex="0"` to it. You get a focusable element with no role and no name, announcing as the concatenation of its cells, and you have added one tab stop per row on top of the controls already inside them.

::: tip The rule
**The row is a shortcut. A control inside the row is the interaction.**

Put a real `<a>` or `<button>` in the row's identifying cell, carrying the accessible name. Keep `row-click` as a pointer convenience that calls the same handler. The keyboard reaches the control, the pointer gets the whole row, and the tab sequence gains exactly one stop per row, which is the same as if you had rendered a list of links.
:::

```vue
<NbDataTable :columns="columns" :rows="rows" row-key="id" @row-click="open">
  <template #cell-name="{ row }">
    <RouterLink
      class="row-link"
      :to="{ name: 'environment', params: { id: row.id } }"
      @click.stop
    >
      {{ row.name }}
    </RouterLink>
  </template>
</NbDataTable>
```

If the row acts rather than navigates, the control is an `NbButton` instead:

```vue
<template #cell-name="{ row }">
  <NbButton variant="secondary" size="sm" @click.stop="open(row)">
    {{ row.name }}
  </NbButton>
</template>
```

`@click.stop` on the inner control stops the row handler firing twice. Prefer the link form whenever the row leads somewhere: a real `<a>` gives you middle-click, <kbd>Cmd</kbd>-click and "copy link address" for free, and a `role="button"` on a row throws all three away. `NbButton` also accepts `to` and renders a `RouterLink` when vue-router is present, if you want the button's styling with a link's semantics.

Extra columns of pure text need nothing. Interactive extras (an overflow menu, a delete button) go last in the row so the sequence reads name-then-actions, which is the same order the eye takes.

The same rule covers list items, kanban cards you did not build with `NbCard`, and timeline entries. There is no version of it where a bare `<div>` with `@click` is acceptable.

## Skip links

A shell puts a sidebar of twenty navigation links before the content on every single page. Without a skip link, reaching the content by keyboard costs twenty-one <kbd>Tab</kbd> presses, every time, on every route.

`NbShell` renders `<nav>`, `<main>` and `<aside>` but ships **no skip link**, because the skip target and its label depend on your product's layout. Add one as the first focusable element in your app root:

```vue
<template>
  <a class="skip-link" href="#nb-main">Skip to main content</a>
  <NbShell>
    <template #sidebar-nav><AppNav /></template>
    <div id="nb-main" tabindex="-1">
      <RouterView />
    </div>
  </NbShell>
</template>

<style scoped lang="scss">
.skip-link {
  position: absolute;
  top: var(--nb-spacing-8);
  left: var(--nb-spacing-8);
  z-index: var(--nb-zindex-navigation);
  padding: var(--nb-spacing-8) var(--nb-spacing-16);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  border: 1px solid var(--nb-c-focus-ring);
  border-radius: var(--nb-radius-xs);
  transform: translateY(-200%);

  &:focus {
    transform: none;
  }
}
</style>
```

::: warning Move it off-screen with `transform`, not `display: none`
An element that is `display: none` or `visibility: hidden` cannot receive focus, so a hidden skip link is a skip link that does not work. Move it out of view and bring it back on `:focus`. And use `:focus` here, not `:focus-visible`: this element only ever receives focus from the keyboard, and some browsers will not treat a programmatic focus as "visible".
:::

Name your landmarks while you are there. `NbShell` renders the elements; only you can distinguish them:

```vue
<template #sidebar-nav>
  <nav aria-label="Product sections"><AppNav /></nav>
</template>
```

Two unnamed `<nav>` landmarks in the reader's landmark list are useless. Two named ones are the fastest navigation the page has.

## Checklist

Before you ship a view:

- [ ] Every action is reachable with <kbd>Tab</kbd> and operable with <kbd>Enter</kbd> or <kbd>Space</kbd>.
- [ ] Every stop shows a visible ring; no `outline: none` without a replacement.
- [ ] Tab order matches reading order; no positive `tabindex`.
- [ ] Composites are one tab stop with arrow keys inside.
- [ ] <kbd>Esc</kbd> closes the innermost layer and nothing else.
- [ ] Dialogs trap focus and restore it to their opener.
- [ ] Focus has a defined destination after delete, after route change, and after content appears.
- [ ] There is a skip link, and every landmark that repeats has a name.
- [ ] Clickable rows carry a real control; no `@click` on a bare `<div>` or `<tr>`.

## Related

- [Accessibility overview](/accessibility/overview): the contract, the standard, and the four testing passes.
- [Colour and contrast](/accessibility/color-contrast): making the focus ring visible on every surface.
- [`NbConfirm`](/ui/components/confirm): a working focus trap to read before you write one.
