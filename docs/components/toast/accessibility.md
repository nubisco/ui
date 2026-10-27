---
layout: nubisco
title: Toast
intro: '`NbToast` is one toast: an icon, an optional title, a message, an optional action and a close button. It is the leaf.'
source: src/components/Toast.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Keyboard and focus

A toast is the one surface in the library that can vanish while it is being read, so its keyboard story is a different question from every other component's: not "can it be operated" but "can it be reached before it is gone". Four answers, and two of them differ between a bare `NbToast` and one under a host.

**Is the toast in the tab order?** The toast itself, no. `.nb-toast` is a plain `div` with no `tabindex`, so it is never a stop. Its controls are: the `cta` button, then the close button, in that DOM order. A toast with no `cta` therefore costs a keyboard user exactly one <kbd>Tab</kbd> stop, and one with a `cta` costs two. That is deliberate. Toasts are teleported to the end of the document, so every stop inside one is a stop the user has to travel to.

**Is the close button reachable?** Yes, always. It is a real `<button>` with `aria-label` taken from `closeLabel`, which defaults to `Close` and is there to be translated. Under [`NbToaster`](/components/toaster/accessibility#keyboard) it is also reachable directly: the stack is a labelled `role="region"` with a hotkey (<kbd>Alt</kbd>+<kbd>T</kbd> by default) that moves focus into the newest toast and back out again, because a region at the end of the document is otherwise a long walk.

**Does <kbd>Esc</kbd> dismiss it?** Under the host, yes: it dismisses the toast focus is inside, not the whole stack, because toasts arrive independently and clearing all of them on one key press throws away messages nobody has read. A bare `NbToast` binds no key handler at all, so <kbd>Esc</kbd> does nothing and the only keyboard exit is tabbing to the close button.

**Where does focus go when a focused toast is dismissed?** Under the host, onto the first focusable control of the next toast in the rendered stack, or, when that was the last one, back to whatever held focus before the user entered the region. This matters most for exactly the case that has a `cta`: pressing `Undo` removes the toast that contains the button being pressed, and without this, focus lands on `<body>` and a keyboard user is back at the top of the document. A bare `NbToast` does not do this, because it does not own the DOM around itself. It is the strongest of the reasons to let the host render your toasts.

One more difference worth knowing before you use `NbToast` standalone: it pauses its own countdown on `mouseenter`, not on focus. A keyboard user who tabs into a standalone toast can watch it expire under the caret. The queue holds the clock for pointer **and** focus together, so under `NbToaster` a toast cannot time out while anyone is inside it.

::: tip The rule this adds up to
Never let a toast be the only route to an action. A toast with an `Undo` is a shortcut offered to someone who is already looking at it; the same undo must exist somewhere with a lifetime, or the action needed a [confirmation](/composables/use-confirm) rather than a toast.
:::
