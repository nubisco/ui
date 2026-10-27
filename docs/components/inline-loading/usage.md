---
layout: nubisco
title: Inline Loading
intro: '`NbInlineLoading` is the status line for one named action: it runs beside the button or row that triggered the work, reports that the work is running, and then says whether it worked. It is the only component in the library that confirms an outcome in place.'
source: src/components/InlineLoading.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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
  [`NbButton`](/components/button/usage) next to the component.
- **Don't** translate a status into a colour only. The mark and the wording
  carry the state; the colour just reinforces it.

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

- The operation has a measurable total: [`NbProgressBar`](/components/progress-bar/usage).
- The whole region is unusable while it runs: [`NbSpinner`](/components/spinner/usage)
  with `overlay="container"`.
- The page is filling in for the first time: [`NbSkeleton`](/components/skeleton/usage).
- The outcome must survive navigation, or the user may have looked away:
  a [toast](/components/toaster/usage). Inline confirmation is for results the user
  is looking at.
- The state is a lasting property of the thing rather than the outcome of
  something the user just did ("Active", "Suspended", "Draft"): that is a
  status, and [Status indicators](/patterns/status-indicators) says which
  component carries it. This component's `finished` and `error` are transient by
  construction, since `finished` expires after `dwell`.

<!--@include: ./_shared.md-->
