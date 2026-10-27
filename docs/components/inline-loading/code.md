---
layout: nubisco
title: Inline Loading
intro: '`NbInlineLoading` is the status line for one named action: it runs beside the button or row that triggered the work, reports that the work is running, and then says whether it worked. It is the only component in the library that confirms an outcome in place.'
source: src/components/InlineLoading.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

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
[`NbSpinner`](/components/spinner/usage) or
[`NbSkeleton`](/components/skeleton/usage) that is unmounted by the same state
change does not announce its `completeLabel`. Without it, the screen reader user
who cannot see the error hears "Contact saved" at the moment the save failed.
Doing it by hand means remembering, in every `catch` in the application, that an
indicator somewhere else is about to claim the work succeeded; the composable
owns the sequence, so it owns this too.

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
[banner](/components/banner/usage), not a status line.

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
[`NbSkeleton`](/components/skeleton/usage) under "when the fetch fails" for the
manual equivalent when you are not using this composable.

## Tokens

| Token                  | Used for                                 |
| ---------------------- | ---------------------------------------- |
| `--nb-field-height-sm` | Minimum row height, so the row is stable |
| `--nb-c-text-muted`    | Inactive and active text                 |
| `--nb-c-success`       | Finished text and mark                   |
| `--nb-c-danger`        | Error text and mark                      |
| `--nb-font-size-12`    | Text size                                |

<!--@include: ./_shared.md-->
