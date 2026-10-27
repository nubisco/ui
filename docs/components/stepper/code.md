---
layout: nubisco
title: Stepper
intro: '`NbStepper` shows where someone is in a linear, multi-step task: which steps are behind them, which one they are on, and how many are left. It is a read-out of a flow, not the flow. The wizard around it still owns the current index, the validation, and the Back and Next buttons.'
source: src/components/Stepper.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## The five states

<preview>
  <div style="width: 100%; max-width: 48rem;">
    <NbStepper :model-value="2" aria-label="Every state">
      <NbStepperStep label="Complete" description="Behind the current step" />
      <NbStepperStep label="Invalid" description="Two fields are still empty" invalid />
      <NbStepperStep label="Current" description="Where the user is now" />
      <NbStepperStep label="Incomplete" description="Not reached yet" />
      <NbStepperStep label="Disabled" description="Not part of this run" disabled />
    </NbStepper>
  </div>
</preview>

Four of the five are derived, so the common case is a `v-model` and nothing
else: every step before the current index is complete, every step after it is
incomplete.

The two you set yourself:

- `invalid`: the step was visited and left in a state the flow will not accept.
  It beats `current`, so a step the user is standing on with an error looks
  wrong rather than looking normal. It stays reachable when the stepper is
  navigable, since going back to fix it is the entire point.
- `disabled`: the step is not part of this run of the flow at all, for example
  a billing step a free plan skips. It beats everything, including position, and
  is never focusable or clickable.

`complete` is the third, and it is the escape hatch: use it to mark a step that
is ahead of the current one as done, which happens when an optional step is
finished out of order.

```vue
<NbStepper v-model="step">
  <NbStepperStep label="Account" />
  <NbStepperStep label="Contact" :invalid="contact.touched && !contact.valid" />
  <NbStepperStep label="Billing" :disabled="plan === 'free'" />
  <NbStepperStep label="Review" :complete="reviewed" />
</NbStepper>
```

## Narrow viewports

A horizontal step never compresses past `--nb-stepper-step-min`, which is `8rem`
(`6.5rem` at `size="sm"`). Below the width that allows, the list scrolls
horizontally instead of squeezing. That is deliberate: five steps in a 360px
viewport would otherwise get about 70px each, which is one word per line and a
sequence nobody can read. A step that is off screen can be scrolled to. A step
that is 70px wide cannot be recovered.

Two consequences worth knowing:

- Labels **wrap, they never truncate**. There is no ellipsis and no tooltip,
  because a step whose label reads "Choose regi…" is a step the user cannot
  identify, and a tooltip is not available to a touch user at all.
- When the row scrolls, advancing the flow scrolls the new current step into
  view. It only does this when the list actually overflows, so a stepper that
  fits never moves the page.

Under about 672px (the `md` breakpoint in [the grid](/components/grid/usage)),
prefer switching to vertical rather than relying on the scroll. Vertical is the
better answer on a phone in every case: it needs no horizontal gesture, the
labels get the full width, and the arrow keys follow the reading direction.

```vue
<template>
  <NbStepper v-model="step" :orientation="narrow ? 'vertical' : 'horizontal'">
    <NbStepperStep label="Account" />
    <NbStepperStep label="Workspace" />
    <NbStepperStep label="Review" />
  </NbStepper>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const step = ref(0)
const narrow = ref(false)
const query = window.matchMedia('(max-width: 671px)')
const sync = () => (narrow.value = query.matches)

onMounted(() => {
  sync()
  query.addEventListener('change', sync)
})
onUnmounted(() => query.removeEventListener('change', sync))
</script>
```

The switch is a prop rather than a media query inside the component because
orientation is not only layout: it decides which arrow keys move focus. A CSS
rule that flipped the visual direction on its own would leave a vertical
stepper that answers to Left and Right.

## Driving it

Bound to a `v-model`, the stepper follows whatever the flow does. It has no
buttons of its own, on purpose: Back and Next belong to the flow, where the
validation that gates them lives.

```vue
<template>
  <NbStepper v-model="step" aria-label="Import">
    <NbStepperStep v-for="s in steps" :key="s.label" v-bind="s" />
  </NbStepper>

  <component :is="steps[step].view" />

  <NbGrid dir="row" gap="sm">
    <NbButton variant="secondary" :disabled="step === 0" @click="step--">
      Back
    </NbButton>
    <NbButton variant="primary" :disabled="!canAdvance" @click="step++">
      Next
    </NbButton>
  </NbGrid>
</template>
```

Leave `v-model` off and the stepper keeps the index itself, which is enough for
a flow whose only navigation is the stepper.

### Steps that appear, disappear or move

Numbering, status and `aria-current` are derived from each step's **position in
the document**, re-read whenever the list re-renders. A `v-for` that reorders, a
`v-if` in the middle of the list and a step that unmounts are all safe: the
markers renumber, the completed steps stay behind the current one, and
`aria-current` stays on the step the reader is looking at.

```vue
<NbStepper v-model="step">
  <NbStepperStep label="Account" />
  <!-- Appears only for a paid plan, and does not renumber Review wrongly -->
  <NbStepperStep v-if="plan !== 'free'" label="Billing" />
  <NbStepperStep label="Review" />
</NbStepper>
```

One caution that is about the flow, not the component: `modelValue` is an index,
so inserting a step **before** the current one moves the user without them doing
anything. If the step list can change mid-flow, keep your own step id and
translate it to an index, or prefer `disabled` over removing the step, which
keeps the numbering stable. See [when not to use it](#when-not-to-use-it): a
step count that changes as the user answers is usually the wrong shape.

## Going back

`navigable` turns the steps the user has already reached into buttons. Steps
ahead of them stay plain text, so the control never offers a jump that would
skip a form. Clicking one emits `update:modelValue` and `change`.

<preview>
  <div style="width: 100%; max-width: 46rem;">
    <NbStepper v-model="navigableStep" navigable aria-label="Navigable example">
      <NbStepperStep label="Account" />
      <NbStepperStep label="Workspace" />
      <NbStepperStep label="Members" />
      <NbStepperStep label="Review" />
    </NbStepper>
    <p style="margin-top: 1rem; color: var(--nb-c-text-muted);">
      On step {{ navigableStep + 1 }}.
      <NbButton size="sm" variant="secondary" :disabled="navigableStep >= 3" @click="navigableStep++">Next</NbButton>
    </p>
  </div>
</preview>

Press Next a few times, then click an earlier step: the ones you had already
reached stay clickable. Reachability is measured against the furthest step ever
reached, not against the current one, so stepping back never locks the steps
ahead of you again.

That high-water mark is per-mount. A flow resumed from storage should say where
the user got to instead:

```vue
<NbStepper v-model="step" :furthest="saved.furthest" navigable />
```

When `furthest` is bound, it is the authority: the stepper stops keeping its own
mark and opens exactly the steps you allow.

## Localisation

Every word the component renders on its own comes from `labels`, so translating
it is one binding. Anything you pass merges over the defaults, which means you
can translate one word without restating the rest.

```vue
<NbStepper
  v-model="step"
  :labels="{
    progress: 'Progresso',
    complete: 'Concluído',
    current: 'Etapa atual',
    incomplete: 'Não iniciada',
    disabled: 'Indisponível',
    invalid: 'Requer atenção',
  }"
/>
```

## NbStepper props

| Prop          | Type                         | Default        | Description                                                                                       |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `modelValue`  | `number`                     | none           | Zero-based index of the current step. Omit and the stepper keeps the index itself.                |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction.                                                                                 |
| `size`        | `'sm' \| 'md'`               | `'md'`         | Marker and type scale. `sm` is 20px markers, for panels.                                          |
| `navigable`   | `boolean`                    | `false`        | Turn already-reached steps into buttons.                                                          |
| `furthest`    | `number`                     | none           | Furthest index reached. Omit and the stepper keeps its own high-water mark for the current mount. |
| `ariaLabel`   | `string`                     | none           | Accessible name of the list. Falls back to `labels.progress`.                                     |
| `labels`      | `IStepperLabels`             | English words  | Status words and the default list name. Merged over the defaults.                                 |
| `announce`    | `boolean`                    | `true`         | Announce the new step politely when `modelValue` changes. Turn off if the flow moves focus.       |
| `id`          | `string`                     | auto           | Explicit element id, set on the root element. Generated by `useStableId()` when omitted.          |

## NbStepper events

| Event               | Payload         | Description                                                   |
| ------------------- | --------------- | ------------------------------------------------------------- |
| `update:modelValue` | `index: number` | The user picked an earlier step. Only fired when `navigable`. |
| `change`            | `index: number` | Same moment, for consumers not using `v-model`.               |

## NbStepper slots

| Slot      | Description                   |
| --------- | ----------------------------- |
| `default` | The `NbStepperStep` children. |

## NbStepperStep props

| Prop          | Type      | Default | Description                                                                           |
| ------------- | --------- | ------- | ------------------------------------------------------------------------------------- |
| `label`       | `string`  | `''`    | One or two words for what the step accomplishes.                                      |
| `description` | `string`  | none    | Optional second line. Wraps rather than truncates.                                    |
| `complete`    | `boolean` | `false` | Force the complete state on a step ahead of the current one.                          |
| `invalid`     | `boolean` | `false` | Visited and rejected. Beats `current`; stays reachable when the stepper is navigable. |
| `disabled`    | `boolean` | `false` | Not part of this run. Beats every other state, never focusable.                       |
| `id`          | `string`  | auto    | Explicit element id for the step's body.                                              |

## NbStepperStep slots

| Slot          | Description                      |
| ------------- | -------------------------------- |
| `label`       | Replaces the `label` prop.       |
| `description` | Replaces the `description` prop. |

## IStepperLabels

Every field is optional and merges over the default. `progress` names the list,
`announcement` is the template read out when the flow advances (`{step}`,
`{total}` and `{label}` are substituted), and the rest are the status word
announced after a step's label.

```ts
interface IStepperLabels {
  progress?: string // 'Progress'
  announcement?: string // 'Step {step} of {total}: {label}'
  complete?: string // 'Complete'
  current?: string // 'Current step'
  incomplete?: string // 'Not started'
  disabled?: string // 'Unavailable'
  invalid?: string // 'Needs attention'
}
```

## Custom properties

Set on the root element, inherited by every step. These are the only geometry
knobs; everything else is a semantic token and follows the theme. A branded
product overrides them on its own wrapper, not by rewriting the component's CSS.

| Property                   | Default (`md`) | Default (`sm`) | What it controls                                        |
| -------------------------- | -------------- | -------------- | ------------------------------------------------------- |
| `--nb-stepper-marker`      | `24px`         | `20px`         | Marker box, width and height                            |
| `--nb-stepper-gap`         | `0.5rem`       | `0.5rem`       | Marker-to-label gap, and the gap the connector spans    |
| `--nb-stepper-line`        | `2px`          | `2px`          | Connector thickness                                     |
| `--nb-stepper-step-min`    | `8rem`         | `6.5rem`       | Floor width of a horizontal step before the row scrolls |
| `--nb-stepper-label-size`  | `0.875rem`     | `0.75rem`      | Label type size                                         |
| `--nb-stepper-marker-size` | `0.75rem`      | `0.6875rem`    | Type size of the number inside the marker               |

```vue
<NbStepper style="--nb-stepper-step-min: 11rem" v-model="step" />
```

### Which token paints what

The geometry knobs above are the only values you set. Everything with a colour
or a weight reads a semantic token, and this is the whole list, so a designer
retheming a product can see exactly what changes and a white-label consumer can
confirm nothing here names a Nubisco brand ramp.

| Element                  | State                   | Token                                                                              |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------- |
| Marker box               | incomplete              | `--nb-c-surface`, border `--nb-c-border`, text `--nb-c-text-muted`                 |
| Marker box               | current                 | `--nb-c-primary`, text `--nb-c-primary-a11y`                                       |
| Marker box               | complete                | border and glyph `--nb-c-primary`                                                  |
| Marker box               | invalid                 | border and glyph `--nb-c-danger`                                                   |
| Marker box               | disabled                | `--nb-c-component-disabled`                                                        |
| Label                    | incomplete              | `--nb-c-text-muted`, `--nb-font-weight-regular`                                    |
| Label                    | current                 | `--nb-c-text`, `--nb-font-weight-semibold`                                         |
| Label                    | complete                | `--nb-c-text`                                                                      |
| Label                    | invalid                 | `--nb-c-danger`, `--nb-font-weight-semibold`                                       |
| Label                    | hover, clickable        | `--nb-c-primary` and an underline                                                  |
| Description              | any                     | `--nb-c-text-subtle`, `--nb-font-size-12`                                          |
| Connector                | ahead                   | `--nb-c-border`                                                                    |
| Connector                | leaving a complete step | `--nb-c-primary`                                                                   |
| Focus ring               | clickable               | `--nb-c-focus-ring`, 2px outline at 2px offset                                     |
| Marker corner            | any                     | `--nb-radius-sm`, because everything in this library that holds a glyph is squared |
| Vertical step separation | any                     | `--nb-spacing-24`                                                                  |
| Label to description gap | any                     | `--nb-spacing-2`                                                                   |

## Structure

| Element                     | Node                  | Notes                                                           |
| --------------------------- | --------------------- | --------------------------------------------------------------- |
| `.nb-stepper`               | `<div>`               | Root. Carries orientation, size and the custom properties       |
| `.nb-stepper__list`         | `<ol role="list">`    | Named by `ariaLabel`. The horizontal scroll container           |
| `.nb-stepper__step`         | `<li>`                | One per step: `data-status`, `data-orientation`, `aria-current` |
| `.nb-stepper__body`         | `<button>` or `<div>` | A button only where the step is reachable                       |
| `.nb-stepper__marker`       | `<span aria-hidden>`  | Number, check or warning glyph                                  |
| `.nb-stepper__label`        | `<span>`              | Wraps, never truncates                                          |
| `.nb-stepper__description`  | `<span>`              | Rendered only when there is one                                 |
| `.nb-stepper__status`       | `<span>`              | Visually hidden status word                                     |
| `.nb-stepper__line`         | `<span aria-hidden>`  | The connector; hidden on the last step by CSS                   |
| `.nb-stepper__announcement` | `<p role="status">`   | Visually hidden live region, outside the list                   |

`data-orientation` on each `<li>` is not decoration and is not a hook for you to
select on. It is how the step's own scoped stylesheet knows which layout to draw,
including the connector's geometry and the floor width. Reading it off the root's
`.nb-stepper--horizontal` class instead would need `:global()`, and Vue's scoped
compiler keeps only the argument of `:global()` and discards the rest of the
selector, so `:global(.nb-stepper--horizontal) .nb-stepper__step { ... }` ships as
a bare rule on the root and reaches no step at all. Orientation therefore travels
on the element that draws with it. The value always comes from the parent, so a
step can never disagree with the list it is in.

The live region sits outside the `<ol>` on purpose: an `<ol>` may only contain
`<li>` children, and a `<p>` inside one is markup assistive technology is
entitled to discard.

<!--@include: ./_shared.md-->
