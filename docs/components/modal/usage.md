---
layout: nubisco
title: Modal
intro: '`NbModal` is a dialog overlay: a surface that sits above the page, takes the whole screen out of play until it is answered, and hands the user back where they were. It uses `<Teleport>` to render at the body level, so its stacking is correct no matter how deep in the tree it is written.'
source: src/components/Modal.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

It is one of exactly two dialogs the library ships. The other is [`NbConfirm`](/components/confirm/usage), and it is the only shape a destructive confirmation may take. If you are about to build a confirmation out of `NbModal`, stop and read [When not to use](#when-not-to-use).

::: danger This page taught the wrong confirmation, and shipped it
Until this release the section below this one demonstrated a destructive confirmation assembled by hand: `variant="primary"` on a Confirm button, a title-case "Confirm Action" heading, the body "Are you sure you want to continue?", and an `NbPanel` with inline padding inside `#footer` fighting the right-aligned grid `Modal.vue` already puts there. One audited application's markup is a near copy of it, primary-styled destructive button included.

The correction is not a corrected footer. It is [`useConfirm()`](/composables/use-confirm). What is left here is the footer contract, which that example also got wrong, and which every dialog on this page needs.
:::

<preview>
  <NbButton @click="openBasic = true">Open Modal</NbButton>
  <NbModal :open="openBasic" @close="openBasic = false">
    <template #header>Rename workspace</template>
    <p style="margin: 0">Body content inside a modal.</p>
    <template #footer>
      <NbButton size="lg" variant="ghost" @click="openBasic = false">Cancel</NbButton>
      <NbButton size="lg" variant="primary" @click="openBasic = false">Rename</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbButton @click="open = true">Rename workspace</NbButton>
  <NbModal :open="open" @close="open = false">
    <template #header>Rename workspace</template>
    <NbTextInput v-model="name" label="Name" />
    <template #footer>
      <NbButton size="lg" variant="ghost" @click="open = false"
        >Cancel</NbButton
      >
      <NbButton size="lg" variant="primary" @click="rename">Rename</NbButton>
    </template>
  </NbModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const name = ref('')
</script>
```

## Anatomy

Seven parts, and every rule further down this page is about one of them. The class names are the ones `Modal.vue` actually renders, so they are also what you will find in a screenshot, a DOM inspector or a failing snapshot.

| #   | Part          | Class                | Comes from           | What it is for                                                                                                                                    |
| --- | ------------- | -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scrim         | `.nb-modal--overlay` | The component        | Fills the viewport with `--nb-c-scrim`, holds the 20px margin every size keeps, and emits `close` on a click unless `closeOnOverlay` is off       |
| 2   | Dialog box    | `.nb-modal--content` | The component        | `role="dialog"` (or `alertdialog`), `aria-modal="true"`, `tabindex="-1"`. Also carries `.nb-modal--content--{size}`, which is where the caps live |
| 3   | Header        | `.nb-modal--header`  | `title` or `#header` | Rendered only when one of the two is given. Without it the dialog has no accessible name and no close control                                     |
| 4   | Title         | `.nb-modal--title`   | `title` or `#header` | Carries the generated id the dialog is `aria-labelledby`-ed to, unless you override it with `labelledBy`                                          |
| 5   | Close control | `.nb-modal--close`   | The component        | The X. Always present when there is a header, always emits `close`, disabled by `closeDisabled`                                                   |
| 6   | Body          | `.nb-modal--body`    | The default slot     | The only scrolling region. Becomes a labelled, focusable `role="region"` while it overflows                                                       |
| 7   | Footer        | `.nb-modal--footer`  | `#footer`            | An `NbGrid` with `justify="end"` and `distributed`, rendered only when the slot has content. It is an action bar already, see below               |

Two of those are not yours to build. The header lays out its own title and X, and the footer is already a grid, so anything you put inside either one is a child of an existing layout rather than the start of a new one. That is the single most common way this component is misused.

## When to use

A dialog costs the user everything else on the screen. It is worth that when the task is short, is about the thing behind it, and has an end. Four cases pass that test.

### A short edit that belongs to what is behind it

Renaming a record, moving it, changing its four settings, inviting one person. The user is looking at the object and wants to change something about it without losing sight of where it sits in the list. Up to four inputs is the working ceiling; past that, see the first row of [When not to use](#when-not-to-use).

### A choice from a set too large for a menu

Picking an icon, a template, a target project, a file from a browser. A menu of eight is a menu. A searchable, filterable, scrollable set of eighty is a task, and a task with a cancel needs a surface with a cancel.

### A detail that has to be read against its context

A run's log, a diff, a version's contents, side by side comparison. The page behind is the reason the detail makes sense, so a route that replaces it costs more than a dialog that covers it. `size="immersive"` exists for exactly this (see [Sizes](#sizes)).

### A step that has to be finished or abandoned before anything else moves

A two-factor challenge, a required credential before an import, a mandatory field a bulk action needs. The interruption is the point: the workflow genuinely cannot continue in either direction until this is answered.

::: tip The test, in one line
The user opened it, it fits on one screen, and answering it (either way) is the end of it. If any of those three is false, one of the surfaces below is the right one.
:::

## The four dialog shapes

`NbModal` has one visual variant and five sizes, so the taxonomy that matters here is not a look, it is a dismissal contract: how the user gets out, and what the footer must contain for that to be honest. Pick the row first, then the size.

| Shape             | What it is                                                              | Ways out                                                          | Footer                                    | Build it with                                                  |
| ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| **Confirmation**  | An irreversible or expensive act, answered yes or no                    | <kbd>Esc</kbd>, Cancel, scrim, X. All four mean no. None mean yes | Cancel, then a `variant="danger"` commit  | [`useConfirm()`](/composables/use-confirm), never `NbModal`    |
| **Form**          | A short edit that ends in a commit                                      | Same four, but a dirty form asks before discarding                | Cancel, then a `variant="primary"` commit | `NbModal` plus the [validation rules](#validation-and-failure) |
| **Detail**        | Something to read, compare or copy from, that changes nothing           | Same four, all identical, all harmless                            | One Close, or no footer at all            | `NbModal`, usually `lg`, `xl` or `immersive`                   |
| **Blocking step** | The workflow cannot continue in either direction until this is answered | Only the footer, and only when abandoning truly is impossible     | An explicit exit and an explicit commit   | `NbModal` with `:close-on-overlay="false"`                     |

Two rules hold across all four.

**Every dialog has an exit, and it is visible.** A blocking step is the only shape allowed to switch off the scrim and <kbd>Esc</kbd>, and the price of switching them off is that the footer must then carry the way out in words ("Sign out", "Cancel import"). A dialog with no <kbd>Esc</kbd>, no scrim dismissal and no exit button is a trap, and it is what `closeDisabled` produces if you set it and forget it, because it silently disables the <kbd>Esc</kbd> route too (see [Work in flight](#work-in-flight)).

**A dialog with nothing to decide is not a dialog.** If the user's only possible answer is "fine", the message is news: [`useToast()`](/composables/use-toast) for a moment, [`NbBanner`](/components/banner/usage) for a condition. An OK-only dialog is an interruption that charges a click for nothing.

## Content

The words in a dialog carry more weight than anywhere else in the product, because the user cannot look anything up while it is open.

- **The title names the action, in sentence case.** "Rename workspace", "Delete environment", "Choose a template". Not "Confirm Action", not "Are you sure?", not "Warning".
- **The body says what will happen and to what.** One sentence, present tense, naming the record: "Every entry, release and API key in `production` is deleted." A body that only restates the title is noise the user learns to skip.
- **The buttons say the verb.** The commit repeats the title's verb, the exit is "Cancel". `OK`, `Yes`, `Done` and `Dismiss` say nothing about what is about to happen, so none of them belong on a commit button.
- **Do not use a dialog to apologise.** "Something went wrong" in a dialog is a failure the user must dismiss before they can look at the thing that failed. Put it in place, in an inline banner.

Tone, capitalisation and sentence shape are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

## Related

- [Dialogs and destructive confirmation](/patterns/dialogs) is the pattern this component belongs to, and the page to read before adding one.
- [`NbConfirm`](/components/confirm/usage) and [`useConfirm()`](/composables/use-confirm) for anything irreversible.
- [`useToast()`](/composables/use-toast) for the result, and for offering undo instead of asking.
- [`NbShellPanel`](/components/shell-panel/usage) and [Inspectors](/patterns/inspectors) for editing a selection in place.
- [Forms](/patterns/forms) for what a dialog may and may not contain.
- [`NbSkeleton`](/components/skeleton/usage) and [`NbEmptyState`](/components/empty-state/usage) for a body that is still loading or came back empty.

<!--@include: ./_shared.md-->
