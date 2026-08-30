---
layout: nubisco
title: Walkthrough
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbWalkthrough` is a guided product tour (coach-marks): it dims the screen, spotlights one element at a time, and shows a popover with a description and controls. Use it to teach first-time users the shape of the application, where the navigation lives, what the views are for, where the common controls sit.

The tour is described by a plain, versioned object and driven by the [`useWalkthrough`](/ui/composables/use-walkthrough) composable. The component is a thin renderer over that state machine, which is what lets the same tour be started from a template, a help menu, or a router guard.

## Live demo

Press **Start the tour**. Use <kbd>Tab</kbd> to move between the controls, and <kbd>Escape</kbd> to skip.

<preview dir="col">
  <NbGrid dir="col" gap="md" style="width: 100%">
    <NbGrid dir="row" gap="sm" align="center">
      <NbButton v-nb-tour-step="'demo-start'" @click="demoTour.restart()">Start the tour</NbButton>
      <span style="color: var(--nb-c-text-muted)">Last event: <code>{{ demoEvent }}</code></span>
    </NbGrid>
    <NbGrid dir="row" gap="md" align="stretch" style="width: 100%">
      <div v-nb-tour-step="'demo-nav'" style="flex: 0 0 140px; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Navigation</strong>
      </div>
      <div v-nb-tour-step="'demo-content'" style="flex: 1; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Content</strong>
      </div>
      <div v-nb-tour-step="'demo-actions'" style="flex: 0 0 140px; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Actions</strong>
      </div>
    </NbGrid>
  </NbGrid>
  <NbWalkthrough
    :controller="demoTour"
    @finish="demoEvent = 'finish'"
    @skip="demoEvent = 'skip'"
    @step-change="(step, index) => (demoEvent = `step-change ${index}`)"
  />
</preview>

## Defining a tour

A walkthrough is data, not markup: an `id`, a `version`, and a list of steps. Keep it in its own module so it can be reviewed, translated and versioned like any other content.

```ts
// src/onboarding/intro.tour.ts
import type { IWalkthrough } from '@nubisco/ui'

export const introTour: IWalkthrough = {
  id: 'app-intro',
  version: 1,
  steps: [
    {
      title: 'Welcome',
      body: 'A quick look at where everything lives. It takes about a minute.',
    },
    {
      target: 'sidebar-nav',
      title: 'Navigation',
      body: 'Every section of the application is reachable from here.',
      placement: 'right',
    },
    {
      target: 'view-switcher',
      title: 'Views',
      body: 'Switch between the table, the board and the calendar.',
      padding: 12,
    },
    {
      target: 'toolbar-actions',
      title: 'Actions',
      body: 'Actions apply to whatever you have selected.',
    },
  ],
}
```

A step with no `target` is an intro or outro: the popover is centred on the viewport with no spotlight.

## Tagging targets

Reference elements by a stable id rather than a CSS selector. The `v-nb-tour-step` directive stamps `data-nb-tour-step` on the element, and the id travels with it through refactors that would break a structural selector.

```vue
<template>
  <NbSidebarMenu v-nb-tour-step="'sidebar-nav'">
    <!-- … -->
  </NbSidebarMenu>
</template>
```

A step's `target` also accepts a CSS selector string, an element, a template ref, or a getter returning one. Strings are resolved as a tour-step id **first** and only then as a selector, so an id never loses to an element of the same name.

```ts
const byTourStepId = { target: 'sidebar-nav' } // preferred
const bySelector = { target: '#summary-total' }
const byGetter = { target: () => tableRef.value?.$el }
const byTemplateRef = { target: headerRef }
```

Steps whose target is not in the DOM (a collapsed panel, a route the user has not visited) are skipped over in the direction the user is travelling rather than showing an empty spotlight.

## Running it once per version

The most common wiring: auto-start on mount, and let the stored version decide.

```vue
<template>
  <NbWalkthrough :walkthrough="introTour" auto-start />
</template>

<script setup lang="ts">
import { introTour } from '@/onboarding/intro.tour'
</script>
```

On finish or skip, the tour records `{ version, outcome, completedAt }` under its `id`. It auto-starts only when nothing is stored for the current version, so:

- a returning user does not see it again;
- bumping `version` to `2` re-shows it to everyone, including people who completed version 1;
- a user who already saw a _newer_ version is not shown an older one.

## Replaying it from a help menu

For "Show me around" in a help menu, own the controller yourself and pass it in. The component will not auto-start a controller it does not own, so the host stays in charge of when the tour runs.

```vue
<template>
  <NbMenuItem @click="tour.restart()">Show me around</NbMenuItem>
  <NbWalkthrough :controller="tour" @finish="onFinish" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWalkthrough } from '@nubisco/ui'
import { introTour } from '@/onboarding/intro.tour'

const tour = useWalkthrough(introTour)

// Auto-start on first visit; `restart()` above always replays.
onMounted(() => tour.maybeAutoStart())

function onFinish() {
  console.log('tour complete')
}
</script>
```

`start()` runs the tour from step 0 without touching storage. `restart()` clears the stored record first, so a replayed tour will auto-start again on the next visit only if that is what you want; call `finish()` afterwards if it should not.

## Pluggable persistence

The default adapter writes to `localStorage` under `nb:walkthrough:<id>`. Swap it for anything that satisfies `IWalkthroughStorage`; reads may be async, so a backend-backed store needs no change at the call sites.

```ts
import type { IWalkthroughStorage } from '@nubisco/ui'

const apiStorage: IWalkthroughStorage = {
  get: (id) => api.get(`/me/onboarding/${id}`).then((r) => r.data ?? null),
  set: (id, record) => api.put(`/me/onboarding/${id}`, record),
  remove: (id) => api.delete(`/me/onboarding/${id}`),
}

const tour = useWalkthrough(introTour, { storage: apiStorage })
```

Two adapters ship with the library:

| Factory                                         | Behaviour                                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `createLocalStorageWalkthroughStorage(prefix?)` | Persists to `localStorage`. Degrades to "never seen" when storage is blocked (private mode, sandboxed iframe) rather than throwing. |
| `createMemoryWalkthroughStorage(seed?)`         | In-memory only. Useful in tests and in demos that should replay on every load.                                                      |

## Custom wording and localisation

Every string the tour renders is overridable through `labels`, so you can soften the defaults to fit your product's voice.

```vue
<template>
  <NbWalkthrough
    :walkthrough="introTour"
    :labels="{
      back: 'Previous',
      next: 'Continue',
      skip: 'Not now',
      done: 'Finish',
      dialog: 'Getting started',
      progress: (current, total) => `${current} of ${total}`,
    }"
  />
</template>
```

The library ships no translated strings of its own, so a localised app passes the same object from its translation function:

```ts
const labels = {
  back: t('tour.back'),
  next: t('tour.next'),
  skip: t('tour.skip'),
  done: t('tour.done'),
  dialog: t('tour.dialog'),
  progress: (current: number, total: number) =>
    t('tour.progress', { current, total }),
}
```

## Custom step content

The `step` slot replaces the body for rich content; `actions` replaces the whole button row when you need different controls.

```vue
<template>
  <NbWalkthrough :walkthrough="introTour">
    <template #step="{ step, index, total }">
      <p>{{ step.body }}</p>
      <NbProgressBar :value="((index + 1) / total) * 100" />
    </template>
  </NbWalkthrough>
</template>
```

## Accessibility

- The popover is a `role="dialog"` with `aria-modal="true"`. Focus moves into it when the tour starts, so a screen reader announces the title and body before the controls.
- <kbd>Tab</kbd> is trapped inside the popover: the page behind the scrim is not interactive, and letting focus walk out of the dialog would strand the user on invisible controls.
- <kbd>Escape</kbd> skips the tour.
- Focus returns to whatever was focused before the tour started, so a tour launched from a help menu returns you to the menu.
- The step counter is `aria-live="polite"`, so advancing announces the new position.
- Under `prefers-reduced-motion: reduce`, the popover animation is dropped and scrolling a target into view becomes an instant jump instead of a smooth scroll.

## Defining a tour in an SFC block

An SFC `<walkthrough>` custom block co-located with the component it describes is appealing DX, but it is **not** the supported interface. The object and composable API above is the portable one: it works in plain TypeScript, in tests, and in apps that assemble tours at runtime. If co-location is worth it for your codebase, add a Vite plugin that compiles the custom block into exactly the `IWalkthrough` object shown above, so it stays sugar over the supported API rather than a second implementation with its own behaviour.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop           | Type                          | Default              | Description                                                                                                         |
| -------------- | ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `walkthrough`  | `IWalkthrough`                | —                    | The tour definition. Required unless `controller` is supplied.                                                      |
| `controller`   | `IWalkthroughController`      | —                    | A controller from `useWalkthrough()`. Pass one to start the tour from outside the template. Suppresses `autoStart`. |
| `autoStart`    | `boolean`                     | `false`              | Runs `maybeAutoStart()` on mount. Ignored when `controller` is provided.                                            |
| `storage`      | `IWalkthroughStorage`         | localStorage adapter | Persistence adapter. Ignored when `controller` is provided.                                                         |
| `labels`       | `Partial<IWalkthroughLabels>` | —                    | Overrides for `back`, `next`, `skip`, `done`, `dialog` and `progress`.                                              |
| `teleportTo`   | `string`                      | `'body'`             | Teleport target for the overlay.                                                                                    |
| `closeOnScrim` | `boolean`                     | `false`              | Clicking the dimmed area skips the tour. Off by default: too easy to hit by accident.                               |
| `padding`      | `number`                      | `8`                  | Default spotlight padding in pixels, overridable per step.                                                          |

## Events

| Event         | Payload                                      | Description                                          |
| ------------- | -------------------------------------------- | ---------------------------------------------------- |
| `step-change` | `(step: IWalkthroughStep, index: number)`    | Fired for every step landed on, including the first. |
| `finish`      | `(walkthrough: IWalkthrough)`                | The user reached the end and pressed Done.           |
| `skip`        | `(walkthrough: IWalkthrough, index: number)` | The user bailed out; `index` is the abandoned step.  |

When the tour is driven by a controller the host created, prefer the `onFinish` / `onSkip` / `onStepChange` callbacks on `useWalkthrough()`: those fire however the run ends, including from imperative calls the component never sees.

## Slots

| Slot      | Props                                            | Description                    |
| --------- | ------------------------------------------------ | ------------------------------ |
| `header`  | `step`, `index`, `total`                         | Replaces the title.            |
| `step`    | `step`, `index`, `total`                         | Replaces the body copy.        |
| `actions` | `step`, `index`, `total`, `back`, `next`, `skip` | Replaces the whole button row. |

## Exposed methods

| Member       | Type                      | Description                                   |
| ------------ | ------------------------- | --------------------------------------------- |
| `start`      | `() => void`              | Runs from step 0, ignoring stored completion. |
| `restart`    | `() => Promise<void>`     | Clears the stored record, then starts.        |
| `next`       | `() => void`              | Advances, or finishes on the last step.       |
| `back`       | `() => void`              | Returns to the previous step.                 |
| `goTo`       | `(index: number) => void` | Jumps to a step, clamped to the range.        |
| `skip`       | `() => Promise<void>`     | Ends the run as skipped and emits `skip`.     |
| `finish`     | `() => Promise<void>`     | Ends the run as completed and emits `finish`. |
| `active`     | `Ref<boolean>`            | Whether a run is in progress.                 |
| `stepIndex`  | `Ref<number>`             | Current zero-based step.                      |
| `controller` | `IWalkthroughController`  | The underlying state machine.                 |

## Types

```ts
interface IWalkthrough {
  id: string
  version: number
  steps: IWalkthroughStep[]
}

interface IWalkthroughStep {
  target?:
    | string
    | HTMLElement
    | (() => HTMLElement | null)
    | Ref<HTMLElement | null>
  title?: string
  body?: string
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  padding?: number
  id?: string
}

interface IWalkthroughStorage {
  get(
    id: string,
  ): IWalkthroughRecord | null | Promise<IWalkthroughRecord | null>
  set(id: string, record: IWalkthroughRecord): void | Promise<void>
  remove(id: string): void | Promise<void>
}

interface IWalkthroughRecord {
  version: number
  outcome: 'finish' | 'skip'
  completedAt: string
}
```

## Why the spotlight has an outline

In light themes the cut-out reads on its own: the undimmed page against the scrim measures 5.93:1. In dark themes it cannot, because the page ground is already near-black, so darkening it further produces no visible hole (about 1.05:1, whatever the scrim alpha). The `--nb-c-primary` outline is what delineates the spotlight there, at 4.38:1 against the dim. It is load-bearing in dark, not decoration.

## Directive

| Directive        | Value    | Description                                                                                               |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `v-nb-tour-step` | `string` | Stamps `data-nb-tour-step` so steps can reference a stable id. See [Tour step](/ui/directives/tour-step). |

## Tokens used

| Token                                     | Applied to                                  |
| ----------------------------------------- | ------------------------------------------- |
| `--nb-c-scrim-strong`                     | The dimmed page behind the spotlight        |
| `--nb-c-scrim`                            | Popover shadow                              |
| `--nb-c-primary`                          | Spotlight outline (load-bearing, see below) |
| `--nb-c-layer-3`, `--nb-c-layer-border-3` | Popover surface and border (overlay depth)  |
| `--nb-c-text`, `--nb-c-text-muted`        | Title; body and step counter                |
| `--nb-c-focus-ring`                       | Focus outline                               |
| `--nb-radius-lg`                          | Popover rounding                            |
| `--nb-zindex-modal`                       | Overlay stacking level                      |

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import { useWalkthrough, createMemoryWalkthroughStorage } from '../../../src'

const demoEvent = ref('none')

// A memory adapter so the demo replays on every page load instead of
// remembering that you have already seen it.
const demoTour = useWalkthrough(
  {
    id: 'docs-demo',
    version: 1,
    steps: [
      {
        title: 'A guided tour',
        body: 'Steps without a target are centred, which suits an intro like this one.',
      },
      {
        target: 'demo-nav',
        title: 'Navigation',
        body: 'The spotlight cuts a hole in the scrim around the current target.',
        placement: 'right',
      },
      {
        target: 'demo-content',
        title: 'Content',
        body: 'The popover flips and clamps itself to stay inside the viewport.',
        placement: 'bottom',
      },
      {
        target: 'demo-actions',
        title: 'Actions',
        body: 'Press Done to finish, or Escape at any point to skip.',
        placement: 'left',
      },
      {
        target: 'demo-start',
        title: 'Replay',
        body: 'restart() clears the stored record and runs the tour again.',
        placement: 'bottom',
      },
    ],
  },
  { storage: createMemoryWalkthroughStorage() },
)
</script>
