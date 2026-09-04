---
layout: nubisco
title: Inline Loading
tabs: ['Usage', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbInlineLoading` is the status line for one named action: it runs beside the
button or row that triggered the work, reports that the work is running, and
then says whether it worked. It is the only component in the library that
confirms an outcome in place.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbInlineLoading v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbGrid gap="sm" align="center">
    <NbButton variant="primary" :loading="status === 'active'" @click="save">
      Save
    </NbButton>
    <NbInlineLoading
      :status="status"
      label="Saving contact"
      finished-label="Contact saved"
      error-label="Could not save contact"
      @success="status = 'inactive'"
    />
  </NbGrid>
</template>
```

## The four states

The whole component is a state machine, and the states are the guidance.

| `status`   | Shows                           | Means                                              |
| ---------- | ------------------------------- | -------------------------------------------------- |
| `inactive` | An empty, silent live region    | Nothing has been asked for yet, or we are done     |
| `active`   | A spinner and `label`           | The request is in flight                           |
| `finished` | A check and `finishedLabel`     | It worked, and the user has time to read that      |
| `error`    | A warning mark and `errorLabel` | It failed, and the row still holds the user's work |

<preview dir="col">
  <NbInlineLoading status="inactive" />
  <NbInlineLoading status="active" label="Saving contact" />
  <NbInlineLoading status="finished" finished-label="Contact saved" />
  <NbInlineLoading status="error" error-label="Could not save contact" />
</preview>

Note that `inactive` is not "unmounted". The component keeps rendering its live
region so that assistive technology is already watching the node when the first
message lands in it; a region inserted at the same moment as its text is
announced unreliably. It also reserves its width in that state, so starting a
save does not shove the buttons beside it.

## The success dwell

Going straight from `active` to gone is the failure this component exists to
fix. The audit behind it found four products that confirmed a successful save
with nothing at all: the spinner vanished, and the user was left to infer from
silence that their work had been stored.

`finished` therefore holds. After `dwell` milliseconds (1600 by default) the
component emits `success`, and that event, not a timer of your own, is where
you return to `inactive`, close the drawer, or navigate.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const status = ref<'inactive' | 'active' | 'finished' | 'error'>('inactive')

async function save() {
  status.value = 'active'
  try {
    await api.saveContact(form)
    status.value = 'finished'
  } catch {
    status.value = 'error'
  }
}
</script>

<template>
  <NbInlineLoading :status="status" @success="status = 'inactive'" />
</template>
```

Anything under about a second is gone before it is read. If your flow navigates
away on success, keep the dwell and navigate from `success`, so the confirmation
is seen rather than raced.

The dwell is armed by entering `finished` and disarmed by leaving it. A second
save that starts before the first confirmation has faded cancels the pending
`success` rather than firing it late over the new state.

## Driving it with useInlineLoading

Writing the try/catch by hand is where the state machine goes wrong, usually in
a `finally` that resets the flag before anything can be shown. The composable
owns the sequence instead.

```vue
<script setup lang="ts">
import { useInlineLoading } from '@nubisco/ui'

const save = useInlineLoading({ onError: (e) => reportToSentry(e) })
</script>

<template>
  <NbGrid gap="sm" align="center">
    <NbButton
      variant="primary"
      :loading="save.status.value === 'active'"
      @click="save.run(() => api.saveContact(form))"
    >
      Save
    </NbButton>
    <NbInlineLoading :status="save.status.value" @success="save.reset" />
  </NbGrid>
</template>
```

Three behaviours are deliberate. Overlapping runs are resolved by the newest
one: a slow first save can no longer land on top of a fast second one and report
the wrong outcome. A rejection is absorbed rather than rethrown, because `run`
is called from a click handler where a rethrown rejection becomes an unhandled
promise. The reason is kept on `save.error.value` and passed to `onError`, and
the failure is on screen, which is what the caller wanted.

The third is quieter and matters to one user in particular. When the action
rejects, `run` also calls `suppressLoadingAnnouncement()`, so any
[`NbSpinner`](/ui/components/spinner) or
[`NbSkeleton`](/ui/components/skeleton) that is unmounted by the same state
change does not announce its `completeLabel`. Without it, the screen reader user
who cannot see the error hears "Contact saved" at the moment the save failed.
Doing it by hand means remembering, in every `catch` in the application, that an
indicator somewhere else is about to claim the work succeeded; the composable
owns the sequence, so it owns this too.

## Labels

Write the three labels as one sentence in three tenses about the same object:
"Saving contact", "Contact saved", "Could not save contact". The fleet currently
uses Save, Done, Apply and Create interchangeably for the same commit, which is
how a user learns to distrust the words.

- **Do** name the object. "Contact saved" tells the user which of the four
  things on screen was stored.
- **Do** say what failed in `errorLabel`. "Error" is not a message.
- **Don't** hide a retry in the label string. If the failure needs an action,
  use the default slot (below), which is where markup belongs, or put an
  [`NbButton`](/ui/components/button/button) next to the component.
- **Don't** translate a status into a colour only. The mark and the wording
  carry the state; the colour just reinforces it.

## When the text is not enough

The three label props cover the ordinary case and stay the default. When a state
needs more than a string, usually a failure that has to offer a way out, the
default slot replaces the text and is handed the resolved copy, so adopting it
does not mean restating it.

```vue
<template>
  <NbInlineLoading
    :status="save.status.value"
    error-label="Could not save contact"
    @success="save.reset"
  >
    <template #default="{ status, text }">
      {{ text }}
      <NbButton
        v-if="status === 'error'"
        variant="ghost"
        size="sm"
        @click="save.run(() => api.saveContact(form))"
      >
        Retry
      </NbButton>
    </template>
  </NbInlineLoading>
</template>
```

Keep it to text plus at most one action. The slot renders inside the live
region, so everything you put there is announced along with the state, and a
paragraph of recovery advice read out on every failure is worse than a short
sentence and a button. If the recovery story is longer than that, it is a
[banner](/ui/components/banner), not a status line.

## Where it goes

Place it after the control that starts the action, in the same row, so the eye
lands on it without moving. `reserveSpace` (on by default) reserves width for
the longest of the three labels in `ch`, so the swap from "Saving" to "Saved"
does not push the row. Turn it off when the component is the last thing in the
row and there is nothing to push.

<preview>
  <NbGrid gap="sm" align="center">
    <NbButton variant="secondary">Invite user</NbButton>
    <NbInlineLoading status="active" label="Sending invite" finished-label="Invite sent" error-label="Could not send invite" />
  </NbGrid>
</preview>

For a table, put it in the row's action cell. For a form, put it beside the
submit button, never above the form where a scrolled user cannot see it.

## Not this component

- The operation has a measurable total: [`NbProgressBar`](/ui/components/progress-bar).
- The whole region is unusable while it runs: [`NbSpinner`](/ui/components/spinner)
  with `overlay="container"`.
- The page is filling in for the first time: [`NbSkeleton`](/ui/components/skeleton).
- The outcome must survive navigation, or the user may have looked away:
  a [toast](/ui/components/toaster). Inline confirmation is for results the user
  is looking at.
- The state is a lasting property of the thing rather than the outcome of
  something the user just did ("Active", "Suspended", "Draft"): that is a
  status, and [Status indicators](/patterns/status-indicators) says which
  component carries it. This component's `finished` and `error` are transient by
  construction, since `finished` expires after `dwell`.

</doc-tab>

<doc-tab name="Accessibility">

## Accessibility

- The root is `role="status"`, present in every state including `inactive`, so
  the live region exists before the first message is written into it.
- `aria-live` is chosen per state: `off` while inactive (nothing to say, and no
  announcement when the node is first inserted), `polite` for `active` and
  `finished`, and `assertive` for `error`. Progress and success wait their turn;
  a failure interrupts, because the user is usually about to walk away.
- The spinner shown during `active` is rendered with `decorative`, so it has no
  role and no label of its own. One operation announces once.
- The state icons are `aria-hidden`. Every state is carried by its text, so
  nothing depends on the check mark, the warning mark or the colour.
- The visible text is real text, not a `title` or a pseudo-element, so it is
  translatable, selectable and reachable by a screen reader's virtual cursor.
- Anything placed in the default slot renders inside that same live region and
  is announced with the state. That is the reason for the one-action rule: a
  `Retry` button is useful in an announcement, three sentences of advice are
  not.
- Nothing here depends on colour. `--nb-c-success` and `--nb-c-danger` reinforce
  a mark and a sentence that already say the same thing, which is also why
  forced-colours mode costs this component nothing: the system palette flattens
  the two tones and the state still reads.
- The component owns no focus. It never moves the caret, which matters because
  it changes while the user is typing in the same form.
- Reduced motion is inherited from [`NbSpinner`](/ui/components/spinner): under
  `prefers-reduced-motion: reduce` the arc becomes a complete ring that breathes
  in opacity, so nothing rotates and nothing freezes.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop            | Type                                              | Default            | Description                                                 |
| --------------- | ------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `status`        | `'inactive' \| 'active' \| 'finished' \| 'error'` | `'inactive'`       | Current state of the action                                 |
| `label`         | `string`                                          | `'Saving'`         | Text while active. Present tense                            |
| `finishedLabel` | `string`                                          | `'Saved'`          | Text while finished. Past tense                             |
| `errorLabel`    | `string`                                          | `'Could not save'` | Text on failure. Say what failed                            |
| `dwell`         | `number`                                          | `1600`             | Milliseconds `finished` holds before `success` is emitted   |
| `reserveSpace`  | `boolean`                                         | `true`             | Reserves width for the longest label so the row cannot jump |
| `id`            | `string`                                          | auto               | Explicit DOM id, otherwise generated by `useStableId`       |

## Slots

| Slot      | Props              | Description                                                   |
| --------- | ------------------ | ------------------------------------------------------------- |
| `default` | `{ status, text }` | Replaces the resolved text. `text` is the label for the state |

## Events

| Event     | Payload | Fired when                                                            |
| --------- | ------- | --------------------------------------------------------------------- |
| `success` | none    | `dwell` has elapsed in `finished`. Return `status` to `inactive` here |

## useInlineLoading

```ts
const save = useInlineLoading({ onError: (reason: unknown) => void })
```

| Member        | Type                                               | Description                                |
| ------------- | -------------------------------------------------- | ------------------------------------------ |
| `status`      | `Readonly<Ref<TInlineLoadingStatus>>`              | Bind to the component's `status`           |
| `error`       | `Readonly<Ref<unknown>>`                           | Whatever the last failed run rejected with |
| `run(action)` | `<T>(() => Promise<T>) => Promise<T \| undefined>` | Runs the action and drives the four states |
| `reset()`     | `() => void`                                       | Back to `inactive`. Bind to `@success`     |

`run` also suppresses the shared loading announcement when the action rejects,
so a failed load is never reported to a screen reader as an arrival. See
[`NbSkeleton`](/ui/components/skeleton) under "when the fetch fails" for the
manual equivalent when you are not using this composable.

## Tokens

| Token                  | Used for                                 |
| ---------------------- | ---------------------------------------- |
| `--nb-field-height-sm` | Minimum row height, so the row is stable |
| `--nb-c-text-muted`    | Inactive and active text                 |
| `--nb-c-success`       | Finished text and mark                   |
| `--nb-c-danger`        | Error text and mark                      |
| `--nb-font-size-12`    | Text size                                |

</doc-tab>

<script setup lang="ts">
const availableProps = [
  {
    label: 'Status',
    name: 'status',
    type: 'single',
    default: 'active',
    options: [
      { value: 'inactive', label: 'inactive' },
      { value: 'active', label: 'active' },
      { value: 'finished', label: 'finished' },
      { value: 'error', label: 'error' },
    ],
  },
  {
    label: 'Active label',
    name: 'label',
    type: 'string',
    default: 'Saving contact',
    placeholder: 'Present tense',
  },
  {
    label: 'Finished label',
    name: 'finishedLabel',
    type: 'string',
    default: 'Contact saved',
    placeholder: 'Past tense',
  },
  {
    label: 'Error label',
    name: 'errorLabel',
    type: 'string',
    default: 'Could not save contact',
    placeholder: 'What failed',
  },
]
</script>
