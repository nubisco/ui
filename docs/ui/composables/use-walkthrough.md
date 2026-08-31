---
layout: nubisco
title: useWalkthrough
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`useWalkthrough` is the state machine behind [`NbWalkthrough`](/ui/components/walkthrough), with no rendering attached. It owns the step index, the version-gated auto-start rule, and persistence.

Reach for it directly when the tour has to be started from somewhere that has no template of its own (a help menu handler, a router guard, an onboarding checklist), or when you want to unit-test the flow without mounting an overlay.

## Basic usage

```vue
<template>
  <NbWalkthrough :controller="tour" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWalkthrough } from '@nubisco/ui'
import { introTour } from '@/onboarding/intro.tour'

const tour = useWalkthrough(introTour)

// Runs only if nothing is stored for the current version.
onMounted(() => tour.maybeAutoStart())
</script>
```

## Version-gated auto-start

`maybeAutoStart()` is the whole first-run policy in one call. It returns `true` when it started the tour.

```ts
const tour = useWalkthrough(introTour) // { id: 'app-intro', version: 1, … }

await tour.maybeAutoStart() // true  — first visit
await tour.finish()
await tour.maybeAutoStart() // false — already completed version 1
```

Bumping `version` to `2` in the tour definition makes `maybeAutoStart()` return `true` again for everyone who only completed version 1. A user who already saw version 3 is never dragged back to version 2: the check is "stored version is at least the current one", not equality.

## Reacting to the run

Pass callbacks in the options. Unlike the component's events, these fire however the run ends, including from imperative calls.

```ts
const tour = useWalkthrough(introTour, {
  onStepChange: (step, index) =>
    analytics.track('tour_step', { index, id: step.id }),
  onFinish: (walkthrough) =>
    analytics.track('tour_finished', { id: walkthrough.id }),
  onSkip: (walkthrough, index) =>
    analytics.track('tour_skipped', { at: index }),
})
```

## A reactive tour definition

The source can be a plain object, a ref, or a getter, so the tour can change with the locale or with a feature flag.

```ts
const tour = useWalkthrough(() => ({
  id: 'app-intro',
  version: 2,
  steps: t('onboarding.steps'),
}))
```

## Custom persistence

See [pluggable persistence](/ui/components/walkthrough) on the component page. Any object satisfying `IWalkthroughStorage` works, and reads may return a promise.

```ts
import { createMemoryWalkthroughStorage, useWalkthrough } from '@nubisco/ui'

// In tests: no localStorage, no cross-test bleed.
const tour = useWalkthrough(introTour, {
  storage: createMemoryWalkthroughStorage(),
})
```

## Testing a tour

Because the composable has no DOM dependencies, the flow is testable on its own.

```ts
import { describe, expect, it } from 'vitest'
import { createMemoryWalkthroughStorage, useWalkthrough } from '@nubisco/ui'
import { introTour } from '@/onboarding/intro.tour'

it('remembers a completed run', async () => {
  const storage = createMemoryWalkthroughStorage()

  const first = useWalkthrough(introTour, { storage })
  expect(await first.maybeAutoStart()).toBe(true)
  await first.finish()

  const second = useWalkthrough(introTour, { storage })
  expect(await second.maybeAutoStart()).toBe(false)
})
```

</doc-tab>

<doc-tab name="Api">

## Signature

```ts
function useWalkthrough(
  source: MaybeRefOrGetter<IWalkthrough>,
  options?: IWalkthroughOptions,
): IWalkthroughController
```

## Options

| Option         | Type                                                 | Default              | Description                                           |
| -------------- | ---------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| `storage`      | `IWalkthroughStorage`                                | localStorage adapter | Where completion is recorded.                         |
| `onStepChange` | `(step: IWalkthroughStep, index: number) => void`    | —                    | Fired for every step landed on, including the first.  |
| `onFinish`     | `(walkthrough: IWalkthrough) => void`                | —                    | Fired when the run completes.                         |
| `onSkip`       | `(walkthrough: IWalkthrough, index: number) => void` | —                    | Fired when the run is abandoned, with the step index. |

## Returned state

| Member        | Type                                         | Description                   |
| ------------- | -------------------------------------------- | ----------------------------- |
| `active`      | `Ref<boolean>`                               | Whether a run is in progress. |
| `stepIndex`   | `Ref<number>`                                | Current zero-based step.      |
| `step`        | `ComputedRef<IWalkthroughStep \| undefined>` | The current step.             |
| `steps`       | `ComputedRef<IWalkthroughStep[]>`            | All steps.                    |
| `stepCount`   | `ComputedRef<number>`                        | Number of steps.              |
| `isFirst`     | `ComputedRef<boolean>`                       | On the first step.            |
| `isLast`      | `ComputedRef<boolean>`                       | On the last step.             |
| `walkthrough` | `ComputedRef<IWalkthrough>`                  | The resolved definition.      |

## Returned methods

| Method           | Type                      | Description                                                                        |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `start`          | `() => void`              | Runs from step 0, ignoring stored completion. No-op for a tour with no steps.      |
| `restart`        | `() => Promise<void>`     | Clears the stored record, then starts.                                             |
| `next`           | `() => void`              | Advances, or finishes on the last step.                                            |
| `back`           | `() => void`              | Returns to the previous step. No-op on the first.                                  |
| `goTo`           | `(index: number) => void` | Jumps to a step, clamped to the range. No-op while inactive.                       |
| `finish`         | `() => Promise<void>`     | Ends the run as completed and records it.                                          |
| `skip`           | `() => Promise<void>`     | Ends the run as skipped and records it.                                            |
| `maybeAutoStart` | `() => Promise<boolean>`  | Starts only when no record covers the current version. Returns whether it started. |
| `isCompleted`    | `() => Promise<boolean>`  | Whether a stored record covers the current version or newer.                       |
| `reset`          | `() => Promise<void>`     | Forgets the stored record without starting.                                        |

## Related

- [`NbWalkthrough`](/ui/components/walkthrough) — the renderer.
- [`v-nb-tour-step`](/ui/directives/tour-step) — tagging targets with stable ids.

</doc-tab>
