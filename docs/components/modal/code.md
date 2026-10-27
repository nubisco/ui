---
layout: nubisco
title: Modal
intro: '`NbModal` is a dialog overlay: a surface that sits above the page, takes the whole screen out of play until it is answered, and hands the user back where they were. It uses `<Teleport>` to render at the body level, so its stacking is correct no matter how deep in the tree it is written.'
source: src/components/Modal.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## When not to use

Every row here is something the fleet actually built as a modal. The right-hand column is the reason it hurt, not a matter of taste.

| What you have                                                 | Use instead                                                                          | Because                                                                                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| A destructive confirmation                                    | [`useConfirm()`](/composables/use-confirm)                                           | Every hand-built one in the fleet lost the same five things. See below                                                      |
| More than four inputs, or a form that scrolls                 | A route ([Forms](/patterns/forms))                                                   | A form scrolling inside a scrim is a page wearing a costume, with worse focus and no URL                                    |
| The result of something that just finished                    | [`useToast()`](/composables/use-toast)                                               | A result is news, not a question. Nobody has to answer it, so nobody should have to dismiss it                              |
| A condition that stays true while the page is open            | [`NbBanner`](/components/banner/usage) `variant="callout"`                           | A standing fact that interrupts once and vanishes has been told to the user exactly once, at random                         |
| A failure that belongs to the page or the form                | [`NbBanner`](/components/banner/usage) `variant="inline"`, in place                  | The user has to see the failure and the thing that failed at the same time                                                  |
| Something wrong with one field                                | [`NbMessage`](/components/message/usage)                                             | The field is where the fix happens                                                                                          |
| Properties of a selected object, edited repeatedly            | [`NbShellPanel`](/components/shell-panel/usage) ([Inspectors](/patterns/inspectors)) | Selecting the next object should not mean reopening a dialog. The object and its editor stay on screen together             |
| A whole task with its own sub-steps                           | A route, or [`NbStepper`](/components/stepper/usage) inside one                      | If it deserves a back button, it deserves a URL                                                                             |
| Marketing, onboarding, a tour, a "what's new"                 | Nothing, or [`NbWalkthrough`](/components/walkthrough/usage)                         | A dialog nobody opened is an interruption, not a conversation. Dialogs are user-initiated                                   |
| Anything the user should be able to copy out of, or return to | A route or a panel                                                                   | A dialog is dismissed by <kbd>Esc</kbd>, by the scrim and by a stray click. It is the wrong home for anything worth keeping |

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

## Behaviour

### Trigger

**A dialog is opened by the user, from a control they pressed.** A button, a menu item, a row action, a command palette entry, activated by click, by <kbd>Enter</kbd> or by <kbd>Space</kbd>. That control is also where focus returns when the dialog closes, which is the practical reason the rule exists: a dialog with no trigger has nowhere to give focus back to, and a keyboard user lands at the top of the document.

Three things are therefore not triggers, and all three appeared in the audit:

- **A timer or a route entering.** A dialog nobody opened is an interruption. If the page has something to say on arrival, it is an [`NbBanner`](/components/banner/usage) `variant="callout"`, which stays true for as long as the page does.
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

**A server-side failure goes in an inline banner inside the body.** `NbBanner` with `variant="inline"` and `status="error"`, at the top of the body, above the fields, where the retry is one press away. Never a second dialog over the first, and never a toast: toasts paint above the scrim (see [Toast, when not to use](/components/toast/usage#when-not-to-use)), so a failure raised from behind an open dialog covers the surface the user is reading and then removes itself.

```vue
<NbModal :open="open" title="Invite member" :busy="saving" @close="close">
  <NbBanner v-if="failure" variant="inline" status="error" :title="failure">
    Check the address and try again.
  </NbBanner>
  <NbTextInput v-model="email" label="Email" />
</NbModal>
```

**A body that is still fetching opens anyway.** Delaying the open so the content can arrive gives the user a button that appears not to have worked, which is how a fleet application ended up with a double-click on every row action. Open immediately and put [`NbSkeleton`](/components/skeleton/usage) where the content will be, at the shape the content will have, so nothing jumps when it lands:

```vue
<NbModal :open="open" title="Run log" @close="open = false">
  <NbSkeleton v-if="loading" variant="text" :lines="6" label="Loading the run log" />
  <pre v-else>{{ log }}</pre>
</NbModal>
```

If the fetch comes back with nothing, say so with [`NbEmptyState`](/components/empty-state/usage) inside the body. A blank dialog and a loading dialog must not look the same: one audited application renders a single `.empty-text` for both, so a failed fetch reads as "no contacts yet".

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

Two things that example is honest about. `closeDisabled` also switches off the <kbd>Esc</kbd> route, because `Modal.vue`'s key handler returns early on it, so the dialog above has no keyboard exit at all while `saving` is true. That is correct for an irreversible commit already in flight and wrong for anything else, which is why it is bound to `saving` and not left on. And once every control in the dialog is disabled, the browser drops focus onto `<body>`, outside the dialog. `NbModal` recovers it onto the dialog box itself, which carries `tabindex="-1"` for exactly this: see [Focus is handled](#focus-is-handled).

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
The header X carries a hardcoded `aria-label="Close"`. Unlike [`NbToast`](/components/toast/usage), which exposes `closeLabel`, there is nothing to translate it with. Render your own control in `#header` if that matters to you.
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

Both return `null` until the dialog is open and rendered. `NbModal` handles its own focus (see [Focus is handled](#focus-is-handled)), so these are for a wrapper that needs the element for something else.

## Z-index

The overlay uses `--nb-zindex-modal`. Components that render inside a dialog and must escape its DOM subtree (`NbSelect`'s list, `NbMenu`, `NbDatePicker`'s calendar) use the `--nb-zindex-modal-*` tier. Toasts sit above both, deliberately. See [Z-index](/principles/z-index).

<!--@include: ./_shared.md-->
