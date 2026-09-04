---
layout: nubisco
title: Modal
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbModal` is a dialog overlay: a surface that sits above the page, takes the whole screen out of play until it is answered, and hands the user back where they were. It uses `<Teleport>` to render at the body level, so its stacking is correct no matter how deep in the tree it is written.

It is one of exactly two dialogs the library ships. The other is [`NbConfirm`](/ui/components/confirm), and it is the only shape a destructive confirmation may take. If you are about to build a confirmation out of `NbModal`, stop and read [When not to use](#when-not-to-use).

::: danger This page taught the wrong confirmation, and shipped it
Until this release the section below this one demonstrated a destructive confirmation assembled by hand: `variant="primary"` on a Confirm button, a title-case "Confirm Action" heading, the body "Are you sure you want to continue?", and an `NbPanel` with inline padding inside `#footer` fighting the right-aligned grid `Modal.vue` already puts there. One audited application's markup is a near copy of it, primary-styled destructive button included.

The correction is not a corrected footer. It is [`useConfirm()`](/ui/composables/use-confirm). What is left here is the footer contract, which that example also got wrong, and which every dialog on this page needs.
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

## When not to use

Every row here is something the fleet actually built as a modal. The right-hand column is the reason it hurt, not a matter of taste.

| What you have                                                 | Use instead                                                                       | Because                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A destructive confirmation                                    | [`useConfirm()`](/ui/composables/use-confirm)                                     | Every hand-built one in the fleet lost the same five things. See below                                                      |
| More than four inputs, or a form that scrolls                 | A route ([Forms](/patterns/forms))                                                | A form scrolling inside a scrim is a page wearing a costume, with worse focus and no URL                                    |
| The result of something that just finished                    | [`useToast()`](/ui/composables/use-toast)                                         | A result is news, not a question. Nobody has to answer it, so nobody should have to dismiss it                              |
| A condition that stays true while the page is open            | [`NbBanner`](/ui/components/banner) `variant="callout"`                           | A standing fact that interrupts once and vanishes has been told to the user exactly once, at random                         |
| A failure that belongs to the page or the form                | [`NbBanner`](/ui/components/banner) `variant="inline"`, in place                  | The user has to see the failure and the thing that failed at the same time                                                  |
| Something wrong with one field                                | [`NbMessage`](/ui/components/message)                                             | The field is where the fix happens                                                                                          |
| Properties of a selected object, edited repeatedly            | [`NbShellPanel`](/ui/components/shell-panel) ([Inspectors](/patterns/inspectors)) | Selecting the next object should not mean reopening a dialog. The object and its editor stay on screen together             |
| A whole task with its own sub-steps                           | A route, or [`NbStepper`](/ui/components/stepper) inside one                      | If it deserves a back button, it deserves a URL                                                                             |
| Marketing, onboarding, a tour, a "what's new"                 | Nothing, or [`NbWalkthrough`](/ui/components/walkthrough)                         | A dialog nobody opened is an interruption, not a conversation. Dialogs are user-initiated                                   |
| Anything the user should be able to copy out of, or return to | A route or a panel                                                                | A dialog is dismissed by <kbd>Esc</kbd>, by the scrim and by a stray click. It is the wrong home for anything worth keeping |

### Never assemble a confirmation out of `NbModal`

The audit read twelve applications and found seven different confirmation mechanics, plus sixteen or more destructive actions with no confirmation at all: an environment and every entry, release and key inside it deleted behind a `window.confirm`; an OAuth client secret regenerated on one unguarded click; a `localStorage.clear()` in a command palette; another user's comment deleted with nothing asked.

The hand-built ones all lost the same five things, and none of them are decorations:

1. Initial focus on cancel, so a stray <kbd>Space</kbd> does not commit.
2. `role="alertdialog"`, so the consequence is read on entry rather than on request.
3. The pending lock, so a fired delete cannot be fired twice or dismissed as if it had not happened.
4. `variant="danger"` on the commit, so the destructive button is not the same button as Save.
5. The record's own name in the body, so "delete this environment?" becomes "delete `production`?".

`useConfirm()` is one call and owns all five:

```ts
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

if (
  await confirm({
    title: 'Delete environment',
    subjectLabel: 'Environment',
    subject: environment.name,
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
  })
) {
  await api.deleteEnvironment(environment.id)
}
```

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton variant="danger" @click="runConfirm">Delete environment</NbButton>
    <span style="font-size: 13px; opacity: 0.75">Last answer: {{ confirmAnswer }}</span>
  </NbGrid>
</preview>

The whole decision (when to confirm, when confirming is itself the bug, what the buttons say, how big a guard the blast radius earns) is settled once in [Dialogs and destructive confirmation](/patterns/dialogs). It is not restated here.

## The four dialog shapes

`NbModal` has one visual variant and five sizes, so the taxonomy that matters here is not a look, it is a dismissal contract: how the user gets out, and what the footer must contain for that to be honest. Pick the row first, then the size.

| Shape             | What it is                                                              | Ways out                                                          | Footer                                    | Build it with                                                  |
| ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| **Confirmation**  | An irreversible or expensive act, answered yes or no                    | <kbd>Esc</kbd>, Cancel, scrim, X. All four mean no. None mean yes | Cancel, then a `variant="danger"` commit  | [`useConfirm()`](/ui/composables/use-confirm), never `NbModal` |
| **Form**          | A short edit that ends in a commit                                      | Same four, but a dirty form asks before discarding                | Cancel, then a `variant="primary"` commit | `NbModal` plus the [validation rules](#validation-and-failure) |
| **Detail**        | Something to read, compare or copy from, that changes nothing           | Same four, all identical, all harmless                            | One Close, or no footer at all            | `NbModal`, usually `lg`, `xl` or `immersive`                   |
| **Blocking step** | The workflow cannot continue in either direction until this is answered | Only the footer, and only when abandoning truly is impossible     | An explicit exit and an explicit commit   | `NbModal` with `:close-on-overlay="false"`                     |

Two rules hold across all four.

**Every dialog has an exit, and it is visible.** A blocking step is the only shape allowed to switch off the scrim and <kbd>Esc</kbd>, and the price of switching them off is that the footer must then carry the way out in words ("Sign out", "Cancel import"). A dialog with no <kbd>Esc</kbd>, no scrim dismissal and no exit button is a trap, and it is what `closeDisabled` produces if you set it and forget it, because it silently disables the <kbd>Esc</kbd> route too (see [Work in flight](#work-in-flight)).

**A dialog with nothing to decide is not a dialog.** If the user's only possible answer is "fine", the message is news: [`useToast()`](/ui/composables/use-toast) for a moment, [`NbBanner`](/ui/components/banner) for a condition. An OK-only dialog is an interruption that charges a click for nothing.

## The footer is already an action bar

This is the part of the old example that was wrong in a way you can see, and the reason a screenshot of one audited product has a single half-width button floating in the middle of its dialog.

`Modal.vue` renders the `#footer` slot inside a grid that is already a right-aligned, distributed action bar:

```vue
<NbGrid
  is="footer"
  v-if="$slots.footer"
  justify="end"
  class="nb-modal--footer"
  distributed
>
  <slot name="footer" />
</NbGrid>
```

Three consequences follow, and they are the whole contract:

- **`distributed` gives every direct child `flex: 1`.** Two buttons become two equal columns filling the footer, edge to edge. That is the bar, and it is why footer buttons carry `size="lg"`.
- **A single child is capped at half the width** (`:only-child { max-width: 50% }`) and pushed to the end by `justify="end"`. One button is deliberately a half-width button on the right, not a full-bleed one.
- **A wrapper counts as one child.** Wrapping your buttons in an `NbPanel` or an `NbGrid` makes the whole group the only child, so the group is squeezed to 50%, the padding you added fights the bar's own edges, and the nesting buys nothing that was not already there.

So the buttons go in bare. Cancel first, commit second, both `size="lg"`.

| Don't                                              | Do                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `#footer` > `NbPanel` > `NbGrid` > buttons         | `#footer` > buttons                                               |
| Inline `style="padding: 12px"` on a footer wrapper | Nothing. The bar owns its own edges                               |
| `variant="primary"` on a destructive commit        | `variant="danger"`, and reach for `useConfirm()` before `NbModal` |
| "Confirm" and "Cancel" as the pair                 | The verb and its exit: "Delete environment" / "Cancel"            |
| A third and fourth button                          | Two. Three only when the third is a genuinely different outcome   |

## Content

The words in a dialog carry more weight than anywhere else in the product, because the user cannot look anything up while it is open.

- **The title names the action, in sentence case.** "Rename workspace", "Delete environment", "Choose a template". Not "Confirm Action", not "Are you sure?", not "Warning".
- **The body says what will happen and to what.** One sentence, present tense, naming the record: "Every entry, release and API key in `production` is deleted." A body that only restates the title is noise the user learns to skip.
- **The buttons say the verb.** The commit repeats the title's verb, the exit is "Cancel". `OK`, `Yes`, `Done` and `Dismiss` are on the ban list in [Action labels](/content/action-labels), which is where the full register lives.
- **Do not use a dialog to apologise.** "Something went wrong" in a dialog is a failure the user must dismiss before they can look at the thing that failed. Put it in place, in an inline banner.

Tone, capitalisation and sentence shape are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

## Behaviour

### Trigger

**A dialog is opened by the user, from a control they pressed.** A button, a menu item, a row action, a command palette entry, activated by click, by <kbd>Enter</kbd> or by <kbd>Space</kbd>. That control is also where focus returns when the dialog closes, which is the practical reason the rule exists: a dialog with no trigger has nowhere to give focus back to, and a keyboard user lands at the top of the document.

Three things are therefore not triggers, and all three appeared in the audit:

- **A timer or a route entering.** A dialog nobody opened is an interruption. If the page has something to say on arrival, it is an [`NbBanner`](/ui/components/banner) `variant="callout"`, which stays true for as long as the page does.
- **A background event finishing.** A sync completing while the user is typing somewhere else is a toast, not a dialog. It stole the caret otherwise.
- **A failed request from a page the user has already left.** Report it where it belongs, or drop it. Do not open a dialog over whatever they are looking at now.

The one legitimate exception is a session that has ended: the application cannot continue and there is genuinely a decision to take. That is a blocking step, and it still needs the exit rule above.

### Opening and closing

The modal is controlled. `:open` is yours, and `close` is a request, not an event that already happened:

```vue
<NbModal :open="open" @close="open = false" />
```

`close` is emitted by the header close button, by <kbd>Esc</kbd>, and by a click on the scrim unless `closeOnOverlay` is `false`. There is one meaning for all three: the user asked to leave without committing. If leaving would lose work, do not silence the routes; ask, and let the answer decide ([Forms, rule 17](/patterns/forms#rule-17-a-dirty-form-is-never-lost-silently)).

### <kbd>Esc</kbd> answers the topmost dialog only

Every open instance listens on `document`, so before this was fixed a stack of two dialogs answered one keypress twice and the user lost both. The topmost surface is the last `aria-modal` element in document order, which for teleported overlays is the one painted on top. A wrapper that wants to answer the key itself sets `:close-on-escape="false"`, which is what `NbConfirm` does.

### The page behind does not scroll

Opening takes a counted share of a single page-scroll lock shared with `NbCommandPalette` and `NbSpinner`'s page overlay. The count matters: three components writing `body.style.overflow` independently used to leave the page permanently unscrollable with nothing on screen. The original value is read once when the first owner arrives and put back once when the last one leaves, so an application that sets `overflow: hidden` on the body for its own layout keeps it.

### A scrollable body is reachable from the keyboard

When the body actually overflows it becomes `role="region"` with `tabindex="0"`, labelled by the dialog title, so it can be scrolled without a pointer. It is marked only while it overflows, so a two-line dialog does not grow a stop in its tab order for nothing. Overflow is watched with a `ResizeObserver` on the box and a `MutationObserver` over its contents, because a body that fits at open time stops fitting when the window is resized, when slot content arrives from a fetch, or when a translated string wraps onto another line.

### Validation and failure

A dialog that closes on a failed submit has thrown the user's typing away and told them about it somewhere they can no longer see. Three rules, in the order the failures arrive.

**A form that fails validation keeps the dialog open.** Do not close, do not clear, do not toast. Mark the offending field with `NbTextInput`'s `error` prop and move focus to the first invalid one, so the fix happens where the mistake is:

```vue
<template>
  <NbModal :open="open" title="Invite member" @close="close">
    <NbTextInput
      v-model="email"
      label="Email"
      :error="emailError"
      @update:model-value="emailError = ''"
    />
    <template #footer>
      <NbButton size="lg" variant="ghost" @click="close">Cancel</NbButton>
      <NbButton size="lg" variant="primary" @click="submit"
        >Send invite</NbButton
      >
    </template>
  </NbModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const email = ref('')
const emailError = ref('')

function submit() {
  if (!email.value.includes('@')) {
    emailError.value = 'Enter a full email address'
    return
  }
  // ... commit, then close
}
</script>
```

**A server-side failure goes in an inline banner inside the body.** `NbBanner` with `variant="inline"` and `status="error"`, at the top of the body, above the fields, where the retry is one press away. Never a second dialog over the first, and never a toast: toasts paint above the scrim (see [Toast, when not to use](/ui/components/toast#when-not-to-use)), so a failure raised from behind an open dialog covers the surface the user is reading and then removes itself.

```vue
<NbModal :open="open" title="Invite member" :busy="saving" @close="close">
  <NbBanner v-if="failure" variant="inline" status="error" :title="failure">
    Check the address and try again.
  </NbBanner>
  <NbTextInput v-model="email" label="Email" />
</NbModal>
```

**A body that is still fetching opens anyway.** Delaying the open so the content can arrive gives the user a button that appears not to have worked, which is how a fleet application ended up with a double-click on every row action. Open immediately and put [`NbSkeleton`](/ui/components/skeleton) where the content will be, at the shape the content will have, so nothing jumps when it lands:

```vue
<NbModal :open="open" title="Run log" @close="open = false">
  <NbSkeleton v-if="loading" variant="text" :lines="6" label="Loading the run log" />
  <pre v-else>{{ log }}</pre>
</NbModal>
```

If the fetch comes back with nothing, say so with [`NbEmptyState`](/ui/components/empty-state) inside the body. A blank dialog and a loading dialog must not look the same: one audited application renders a single `.empty-text` for both, so a failed fetch reads as "no contacts yet".

### Work in flight

Once the commit has been fired, the dialog owes the user three things, and they are not optional.

- **The pending affordance goes on the commit button, not over the body.** `NbButton` has `loading` for exactly this. An overlay spinner across the dialog hides the values the user just typed at the moment they most want to check them, and it makes the footer look pressable while it is not.
- **The commit disables itself while it is busy.** A second press on a fired delete is a second delete. `:disabled="saving"` on the commit, and `:loading="saving"` for the spinner.
- **`busy` and `closeDisabled` are set together, never one without the other.** `busy` marks the dialog `aria-busy="true"`, which is the half a screen reader hears; `closeDisabled` disables the X, which is the half everyone else sees. Set only `busy` and the user can dismiss a delete that is already running; set only `closeDisabled` and the wait is invisible to assistive technology.

```vue
<NbModal
  :open="open"
  title="Delete environment"
  :busy="saving"
  :close-disabled="saving"
  :close-on-overlay="!saving"
  @close="open = false"
>
  <p>Every entry, release and API key in {{ name }} is deleted.</p>
  <template #footer>
    <NbButton size="lg" variant="ghost" :disabled="saving" @click="open = false">
      Cancel
    </NbButton>
    <NbButton size="lg" variant="danger" :loading="saving" :disabled="saving" @click="commit">
      Delete environment
    </NbButton>
  </template>
</NbModal>
```

Two things that example is honest about. `closeDisabled` also switches off the <kbd>Esc</kbd> route, because `Modal.vue`'s key handler returns early on it, so the dialog above has no keyboard exit at all while `saving` is true. That is correct for an irreversible commit already in flight and wrong for anything else, which is why it is bound to `saving` and not left on. And once every control in the dialog is disabled, the browser drops focus onto `<body>`, outside the dialog: see [Focus is yours](#focus-is-yours) for the two lines that recover it.

A confirmation gets all of this without you writing any of it. This example exists to show the shape for the dialogs that are not confirmations.

## Sizes

`size` caps both dimensions of the dialog: `sm` (520px wide, up to 72% of the
viewport height), `md` (720px, 84%), `lg` (960px, 96%), `xl` (1280px, 98%) and
`immersive` (1600px, the full height inside the margin). Height stays
content-driven below the cap, so short dialogs never show empty space; long
content scrolls inside the body once the cap is reached.

No size is a fixed box. The dialog is always `width: 100%` inside an overlay
that keeps a margin all round, so every cap behaves as `min(cap, viewport -
margin)`: on a narrow screen `immersive` and `sm` are the same width, and
neither can overflow the viewport or push the page into horizontal scroll.

<preview>
  <NbGrid dir="row" gap="sm">
    <NbButton @click="openSize = 'sm'">Small</NbButton>
    <NbButton @click="openSize = 'md'">Medium</NbButton>
    <NbButton @click="openSize = 'lg'">Large</NbButton>
    <NbButton @click="openSize = 'xl'">Extra large</NbButton>
    <NbButton @click="openSize = 'immersive'">Immersive</NbButton>
  </NbGrid>
  <NbModal :open="!!openSize" :size="openSize || 'md'" :title="`Size: ${openSize}`" @close="openSize = null">
    <p v-for="n in 30" :key="n" style="margin: 0 0 12px">
      Scrollable body content line {{ n }}.
    </p>
    <template #footer>
      <NbButton size="lg" @click="openSize = null">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbModal :open="open" size="lg" title="Large dialog" @close="open = false">
    <p>Long content scrolls inside the body.</p>
  </NbModal>
</template>
```

### Choosing between `lg`, `xl` and `immersive`

The two larger steps solve different problems, which is why both exist.

Reach for **`xl`** when a dialog is content-heavy but still a dialog: a form
with two columns, a detail panel, a preview beside a description. It is a
bigger box, not a different kind of surface.

Reach for **`immersive`** when the content is a comparison and the columns are
the point: several candidates side by side, a diff, a wide table you actually
have to read across. At `lg` the same content wraps into cramped columns and
buries the differences in inner scrolling, which is the failure this size
exists to fix.

`immersive` is deliberately not full-screen. It keeps its margin, so the page
behind stays visible and the dialog still reads as something you are inside of
rather than somewhere you navigated to. If a task genuinely owns the whole
screen, it wants a route, not a modal.

Open the same four-column comparison at each size to see the difference:

<preview>
  <NbGrid dir="row" gap="sm">
    <NbButton @click="openWide = 'lg'">Compare at lg</NbButton>
    <NbButton @click="openWide = 'xl'">Compare at xl</NbButton>
    <NbButton @click="openWide = 'immersive'">Compare at immersive</NbButton>
  </NbGrid>
  <NbModal :open="!!openWide" :size="openWide || 'lg'" :title="`Region comparison (${openWide})`" @close="openWide = null">
    <NbGrid dir="row" gap="md" align="stretch">
      <NbPanel v-for="region in regions" :key="region.id" style="flex: 1; min-width: 0; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600;">{{ region.id }}</p>
        <p style="margin: 0 0 12px; font-size: 22px; font-weight: 600;">{{ region.latency }}</p>
        <p style="margin: 0 0 4px; font-size: 13px;">Uptime {{ region.uptime }}</p>
        <p style="margin: 0 0 4px; font-size: 13px;">Storage {{ region.storage }}</p>
        <p style="margin: 0; font-size: 13px;">{{ region.notes }}</p>
      </NbPanel>
    </NbGrid>
    <template #footer>
      <NbButton size="lg" @click="openWide = null">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbModal :open="open" size="immersive" title="Region comparison">
    <NbGrid dir="row" gap="md" align="stretch">
      <NbPanel v-for="region in regions" :key="region.id">
        <!-- one column per region -->
      </NbPanel>
    </NbGrid>
  </NbModal>
</template>
```

## Accessibility

What the component does for you:

- The dialog box is `aria-modal="true"` with `role="dialog"`, or `role="alertdialog"` when you pass it. Use `alertdialog` only for an interruption that reports a condition or demands a decision that cannot wait; it makes a screen reader read the description on entry instead of waiting to be asked.
- It is named automatically by its own title when `title` or the `#header` slot is used. Pass `labelledBy` when the accessible name lives on an element inside your header slot, and `describedBy` when a specific element is the description.
- The box carries `tabindex="-1"`, so there is always somewhere legitimate for focus to sit even when every control inside is disabled.
- <kbd>Esc</kbd> closes the topmost dialog only, and `closeOnEscape` turns it off for a wrapper that answers the key itself.
- An overflowing body is a labelled, focusable `role="region"`, so it can be scrolled from the keyboard.
- `busy` and `closeDisabled` express "work is in flight" in ARIA rather than only in colour.

### Focus is yours

`NbModal` does not move focus into the dialog when it opens, does not trap <kbd>Tab</kbd> inside it, and does not return focus to the trigger when it closes. Nothing behind the scrim is marked `inert` either, so a keyboard or screen reader user can walk straight out of an open dialog into the page it is covering, which behind a delete dialog is the list they are deleting from.

That is why a confirmation must be `NbConfirm`: it implements all of it, including recovering focus that leaves by a route no keystroke explains (a click on the scrim, a `focus()` from application code, a control disabled out from under the caret).

For every other dialog, this is the whole mechanism. It is about thirty lines, it has no dependencies beyond Vue, and it is the same shape `Confirm.vue` uses internally. Copy it into your application as `src/composables/useDialogFocus.composable.ts`:

```ts
import { nextTick, onScopeDispose, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * The three focus obligations NbModal leaves to you: focus in on open, Tab
 * cycles inside, focus back to the trigger on every route out.
 *
 * `dialog` is a getter because the box does not exist until the dialog has
 * opened and rendered. NbModal exposes exactly this shape.
 */
export function useDialogFocus(
  open: Ref<boolean>,
  dialog: () => HTMLElement | null | undefined,
  initial?: () => HTMLElement | null | undefined,
) {
  let previous: HTMLElement | null = null

  const items = (): HTMLElement[] => {
    const box = dialog()
    if (!box) return []
    return Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getAttribute('aria-disabled') !== 'true',
    )
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !open.value) return
    const box = dialog()
    if (!box) return
    const list = items()
    const active = document.activeElement as HTMLElement | null
    const inside = !!active && box.contains(active)
    // Everything disabled (the pending state) leaves no control to cycle
    // between. Focus stays on the box rather than escaping to the page.
    if (list.length === 0) {
      event.preventDefault()
      if (!inside) box.focus()
      return
    }
    const first = list[0]
    const last = list[list.length - 1]
    if (!inside) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function stop() {
    document.removeEventListener('keydown', onKeydown, true)
  }

  watch(open, async (isOpen) => {
    if (isOpen) {
      previous = document.activeElement as HTMLElement | null
      // Capture phase, so the cycle runs before anything inside reacts.
      document.addEventListener('keydown', onKeydown, true)
      await nextTick()
      ;(initial?.() ?? items()[0] ?? dialog())?.focus()
    } else {
      stop()
      if (previous?.isConnected) previous.focus()
      previous = null
    }
  })

  onScopeDispose(stop)
}
```

Wiring it takes three lines, and the getter call form matters: `dialogEl` is exposed as a **function**, so it is `modalRef.value?.dialogEl()`, not `modalRef.value?.dialogEl`.

```vue
<template>
  <NbButton @click="open = true">Invite member</NbButton>
  <NbModal
    ref="modalRef"
    :open="open"
    title="Invite member"
    @close="open = false"
  >
    <NbTextInput ref="firstFieldRef" v-model="email" label="Email" />
    <template #footer>
      <NbButton size="lg" variant="ghost" @click="open = false"
        >Cancel</NbButton
      >
      <NbButton size="lg" variant="primary" @click="invite"
        >Send invite</NbButton
      >
    </template>
  </NbModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDialogFocus } from '@/composables/useDialogFocus.composable'

const open = ref(false)
const email = ref('')
const modalRef = ref<{ dialogEl: () => HTMLElement | null } | null>(null)
const firstFieldRef = ref<{ nativeEl: HTMLInputElement | null } | null>(null)

// Third argument: focus the field, not the close button the DOM offers first.
useDialogFocus(
  open,
  () => modalRef.value?.dialogEl(),
  () => firstFieldRef.value?.nativeEl,
)
</script>
```

The demo below is that composable, wired to a real `NbModal`. Open it from the keyboard and hold <kbd>Tab</kbd>: focus cycles close, name, notes, Cancel, Save and back to close, never reaching the page behind. Close it any way you like, including <kbd>Esc</kbd> and the scrim, and the trigger button is focused again. The readout is `document.activeElement`.

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

Four rules the composable does not decide for you:

1. **Focus the first meaningful control, not the first control in the DOM.** The default above is the first focusable element, which in a dialog with a header is the X. For a form dialog, pass the field as the third argument, as above. `NbTextInput` exposes its native element as `nativeEl`, so it is `() => firstFieldRef.value?.nativeEl`.
2. **Never autofocus a destructive control.** Focus Cancel, or the box itself. A stray <kbd>Space</kbd> on an autofocused Delete is a deleted record. See [Focus order in a confirmation](/content/action-labels#focus-order-in-a-confirmation).
3. **Focus a text control only when typing is the point.** In a read-only detail dialog, focus the box (`tabindex="-1"` is there for it) so a screen reader starts at the title instead of halfway down.
4. **Return focus on every route out**, including <kbd>Esc</kbd> and the scrim. The watcher above covers all of them because they all go through `open`, which is the reason the composable watches the prop rather than listening for a close event.

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

## Related

- [Dialogs and destructive confirmation](/patterns/dialogs) is the pattern this component belongs to, and the page to read before adding one.
- [`NbConfirm`](/ui/components/confirm) and [`useConfirm()`](/ui/composables/use-confirm) for anything irreversible.
- [`useToast()`](/ui/composables/use-toast) for the result, and for offering undo instead of asking.
- [`NbShellPanel`](/ui/components/shell-panel) and [Inspectors](/patterns/inspectors) for editing a selection in place.
- [Forms](/patterns/forms) for what a dialog may and may not contain.
- [`NbSkeleton`](/ui/components/skeleton) and [`NbEmptyState`](/ui/components/empty-state) for a body that is still loading or came back empty.
- [Action labels](/content/action-labels) for the words on the two buttons.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type                                          | Default     | Description                                                                                                                                                                                                               |
| ---------------- | --------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`           | `boolean`                                     | `false`     | Whether the dialog is on screen. Controlled: you set it back to `false` on `close`                                                                                                                                        |
| `title`          | `string`                                      | `undefined` | Header title, an alternative to the `#header` slot                                                                                                                                                                        |
| `size`           | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'immersive'` | `'md'`      | Caps the dialog width and height (see [Sizes](#sizes))                                                                                                                                                                    |
| `closeOnOverlay` | `boolean`                                     | `true`      | Whether a click on the scrim emits `close`                                                                                                                                                                                |
| `closeOnEscape`  | `boolean`                                     | `true`      | Whether <kbd>Esc</kbd> emits `close`. Only the topmost dialog answers the key either way, and `closeDisabled` suppresses it independently                                                                                 |
| `role`           | `'dialog' \| 'alertdialog'`                   | `'dialog'`  | `alertdialog` for an interruption whose description should be announced on entry                                                                                                                                          |
| `labelledBy`     | `string`                                      | `undefined` | Id of the element naming the dialog. Defaults to the built-in title, so the common case needs nothing                                                                                                                     |
| `describedBy`    | `string`                                      | `undefined` | Id of the element describing the dialog, usually its body                                                                                                                                                                 |
| `busy`           | `boolean`                                     | `false`     | Marks the dialog `aria-busy` while work it started is in flight. Set it with `closeDisabled`, never alone                                                                                                                 |
| `closeDisabled`  | `boolean`                                     | `false`     | Disables the header close control (`disabled` and `aria-disabled`) **and switches off the <kbd>Esc</kbd> route**: the key handler returns early on it, so a dialog with it set and no footer exit has no keyboard way out |

::: warning No prop for the close button's name
The header X carries a hardcoded `aria-label="Close"`. Unlike [`NbToast`](/ui/components/toast), which exposes `closeLabel`, there is nothing to translate it with. Render your own control in `#header` if that matters to you.
:::

## Slots

| Slot      | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| `header`  | Title area. Rendering either this or `title` is what gives the dialog its accessible name         |
| `default` | Body. Scrolls, and becomes a focusable labelled region when it overflows                          |
| `footer`  | Action bar. Put buttons in bare: the slot is already inside a right-aligned, distributed `NbGrid` |

## Events

| Event   | Payload | Description                                                                                              |
| ------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `close` | none    | The user asked to leave: the close button, <kbd>Esc</kbd>, or the scrim (unless `closeOnOverlay` is off) |

## Exposed

Both are **getter functions**, not refs and not elements. `defineExpose` publishes `dialogEl: () => contentRef.value`, so the call form has parentheses:

```ts
const modalRef = ref<{
  dialogEl: () => HTMLElement | null
  bodyEl: () => HTMLElement | null
} | null>(null)

modalRef.value?.dialogEl()?.focus()
```

| Exposed    | Call                         | Returns               | Description                                                                         |
| ---------- | ---------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| `dialogEl` | `modalRef.value?.dialogEl()` | `HTMLElement \| null` | The dialog box, for a wrapper that manages focus (this is how `NbConfirm` finds it) |
| `bodyEl`   | `modalRef.value?.bodyEl()`   | `HTMLElement \| null` | The scrolling body element                                                          |

Both return `null` until the dialog is open and rendered, which is why [`useDialogFocus`](#focus-is-yours) takes a getter and reads it after `nextTick()`.

## Z-index

The overlay uses `--nb-zindex-modal`. Components that render inside a dialog and must escape its DOM subtree (`NbSelect`'s list, `NbMenu`, `NbDatePicker`'s calendar) use the `--nb-zindex-modal-*` tier. Toasts sit above both, deliberately. See [Z-index](/principles/z-index).

</doc-tab>

<script setup lang="ts">
import { nextTick, onScopeDispose, ref, watch, type Ref } from 'vue'
import { useConfirm } from '../../../src'

const confirm = useConfirm()

const openBasic = ref(false)
const openSize = ref<'sm' | 'md' | 'lg' | 'xl' | 'immersive' | null>(null)
const openWide = ref<'lg' | 'xl' | 'immersive' | null>(null)
const confirmAnswer = ref('nothing yet')

async function runConfirm() {
  const answered = await confirm({
    title: 'Delete environment',
    subjectLabel: 'Environment',
    subject: 'staging-eu',
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
  })
  confirmAnswer.value = answered ? 'confirmed' : 'cancelled'
}

const regions = [
  { id: 'eu-west-1', latency: '24 ms', uptime: '99.99%', storage: '2 TB', notes: 'Read replicas, nightly snapshots' },
  { id: 'us-east-1', latency: '86 ms', uptime: '99.98%', storage: '4 TB', notes: 'Nightly snapshots' },
  { id: 'ap-south-1', latency: '142 ms', uptime: '99.95%', storage: '1 TB', notes: 'Read replicas, hourly snapshots' },
  { id: 'sa-east-1', latency: '118 ms', uptime: '99.97%', storage: '1 TB', notes: 'Read replicas, nightly snapshots' },
]

/*
 * The focus-trap demo. This is the composable printed above, verbatim, so the
 * page cannot document one implementation and demonstrate another.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function useDialogFocus(
  open: Ref<boolean>,
  dialog: () => HTMLElement | null | undefined,
  initial?: () => HTMLElement | null | undefined,
) {
  let previous: HTMLElement | null = null

  const items = (): HTMLElement[] => {
    const box = dialog()
    if (!box) return []
    return Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.getAttribute('aria-disabled') !== 'true',
    )
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !open.value) return
    const box = dialog()
    if (!box) return
    const list = items()
    const active = document.activeElement as HTMLElement | null
    const inside = !!active && box.contains(active)
    if (list.length === 0) {
      event.preventDefault()
      if (!inside) box.focus()
      return
    }
    const first = list[0]
    const last = list[list.length - 1]
    if (!inside) {
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function stop() {
    document.removeEventListener('keydown', onKeydown, true)
  }

  watch(open, async (isOpen) => {
    if (isOpen) {
      previous = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown, true)
      await nextTick()
      ;(initial?.() ?? items()[0] ?? dialog())?.focus()
    } else {
      stop()
      if (previous?.isConnected) previous.focus()
      previous = null
    }
  })

  onScopeDispose(stop)
}

const openTrap = ref(false)
const trapName = ref('')
const trapNotes = ref('')
const trapModal = ref<{ dialogEl: () => HTMLElement | null } | null>(null)
const focusLabel = ref('nothing yet')

useDialogFocus(openTrap, () => trapModal.value?.dialogEl())

function describeFocus() {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return 'the document'
  const label =
    el.getAttribute('aria-label') ||
    el.textContent?.trim().slice(0, 24) ||
    el.tagName.toLowerCase()
  return `${el.tagName.toLowerCase()} (${label || 'unnamed'})`
}

function onDocFocus() {
  focusLabel.value = describeFocus()
}

watch(openTrap, (isOpen) => {
  if (isOpen) document.addEventListener('focusin', onDocFocus)
  else {
    void nextTick(() => {
      focusLabel.value = describeFocus()
      document.removeEventListener('focusin', onDocFocus)
    })
  }
})

onScopeDispose(() => {
  if (typeof document !== 'undefined')
    document.removeEventListener('focusin', onDocFocus)
})
</script>
