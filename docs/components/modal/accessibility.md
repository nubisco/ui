---
layout: nubisco
title: Modal
intro: '`NbModal` is a dialog overlay: a surface that sits above the page, takes the whole screen out of play until it is answered, and hands the user back where they were. It uses `<Teleport>` to render at the body level, so its stacking is correct no matter how deep in the tree it is written.'
source: src/components/Modal.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

What the component does for you:

- The dialog box is `aria-modal="true"` with `role="dialog"`, or `role="alertdialog"` when you pass it. Use `alertdialog` only for an interruption that reports a condition or demands a decision that cannot wait; it makes a screen reader read the description on entry instead of waiting to be asked.
- It is named automatically by its own title when `title` or the `#header` slot is used. Pass `labelledBy` when the accessible name lives on an element inside your header slot, and `describedBy` when a specific element is the description.
- The box carries `tabindex="-1"`, so there is always somewhere legitimate for focus to sit even when every control inside is disabled.
- <kbd>Esc</kbd> closes the topmost dialog only, and `closeOnEscape` turns it off for a wrapper that answers the key itself.
- An overflowing body is a labelled, focusable `role="region"`, so it can be scrolled from the keyboard.
- `busy` and `closeDisabled` express "work is in flight" in ARIA rather than only in colour.

### Focus is handled

`NbModal` holds keyboard focus for as long as it is open. You do not wire this
up, and there is nothing to copy into your application:

- **Focus moves in on open.** The first focusable control takes it, or the
  dialog box itself when the dialog has no controls at all.
- **<kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> cycle inside the
  dialog.** They do not reach the page behind the scrim, which behind a delete
  dialog is the list the user is deleting from.
- **Focus comes back to the trigger on every route out**, including
  <kbd>Esc</kbd>, the close button and the scrim. A trigger that has since been
  unmounted (the row action of a row this dialog just deleted) is skipped
  rather than throwing.
- **Focus that leaves by a route no keystroke explains is recovered**: a click
  on the scrim, a `focus()` from application code, or a control disabled out
  from under the caret.
- **A popup teleported out of the dialog still counts as inside it.** An open
  `NbSelect` list, `NbMenu` or `NbDatePicker` calendar is a sibling of the
  dialog in the DOM, not a descendant, and the trap knows it.
- **Only the topmost dialog answers.** A confirmation raised from inside a
  dialog takes the keys; the surface underneath keeps its state.

Nothing behind the scrim is marked `inert`, because these overlays teleport to
`<body>` next to an application root the library does not own. The trap is what
stands in for it.

#### Directing initial focus

The default landing is the first focusable control, which in a dialog with a
header is the close button. That is right for a dialog you only read and wrong
for a form, so point `initialFocus` at the field:

```vue
<NbModal :open="open" title="Invite teammate" initial-focus="input" @close="open = false">
```

`initialFocus` takes a CSS selector resolved inside the dialog, or a function
returning the element, for a component ref: `NbTextInput` exposes its native
element as `nativeEl`, so it is `:initial-focus="() => firstFieldRef?.nativeEl"`.

Three rules it does not decide for you:

1. **Never point it at a destructive control.** Focus Cancel, or leave the
   default. A stray <kbd>Space</kbd> on an autofocused Delete is a deleted
   record. Focus Cancel, or the dialog box itself.
2. **Focus a text control only when typing is the point.** In a read-only
   detail dialog, leave it alone so a screen reader starts at the title instead
   of halfway down.
3. **A confirmation is still `NbConfirm`**, not an `NbModal` you focused
   carefully. It runs its own trap with extra rules for its pending state and
   its type-to-confirm gate, and it sets `:trap-focus="false"` so the two do
   not pull against each other.

::: tip Upgrading from a hand-rolled trap
Earlier versions of this page shipped a `useDialogFocus` composable to copy
into your application, because `NbModal` did not do any of the above. If you
copied it, delete it: the library now does this. If you would rather keep your
own for a dialog with unusual requirements, set `:trap-focus="false"` on that
dialog and `NbModal` will keep its hands off focus entirely, exactly as before.
:::

The demo below is a plain `NbModal` with no focus code of its own. Open it from
the keyboard and hold <kbd>Tab</kbd>: focus cycles close, name, notes, Cancel,
Save and back to close, never reaching the page behind. Close it any way you
like, including <kbd>Esc</kbd> and the scrim, and the trigger button is focused
again. The readout is `document.activeElement`.

<preview>
  <NbGrid dir="col" gap="sm" align="start">
    <NbButton @click="openTrap = true">Open a trapped dialog</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Focus is on: {{ focusLabel }}</span>
  </NbGrid>
  <NbModal ref="trapModal" :open="openTrap" title="Trapped dialog" @close="openTrap = false">
    <NbGrid dir="col" gap="sm">
      <NbTextInput v-model="trapName" label="Name" />
      <NbTextInput v-model="trapNotes" label="Notes" />
    </NbGrid>
    <template #footer>
      <NbButton size="lg" variant="ghost" @click="openTrap = false">Cancel</NbButton>
      <NbButton size="lg" variant="primary" @click="openTrap = false">Save</NbButton>
    </template>
  </NbModal>
</preview>

The general rules those come from are in [Keyboard](/accessibility/keyboard#after-a-dialog-closes) and [Dialogs, rule 9](/patterns/dialogs#rule-9-focus-is-the-whole-accessibility-story).

::: warning Known gap: motion
The open and close transition is a fixed 200ms of opacity and a small scale, and it is not currently reduced under `prefers-reduced-motion: reduce`. `NbConfirm` sets its own duration to zero for that preference. Until `NbModal` does the same, an application that cares can neutralise it globally:

```css
@media (prefers-reduced-motion: reduce) {
  .nb-modal-enter-active,
  .nb-modal-leave-active,
  .nb-modal-enter-active .nb-modal--content,
  .nb-modal-leave-active .nb-modal--content {
    transition-duration: 0ms !important;
  }
}
```

:::

::: warning Known gap: the close button's name
`Modal.vue` hardcodes `aria-label="Close"` on the header X. There is no prop for it, so it cannot be translated, which is an asymmetry with `NbToast`, where `closeLabel` exists and is documented. A non-English application either lives with one English word in the dialog or renders its own close control in the `#header` slot until a prop lands.
:::

<!--@include: ./_shared.md-->
