---
layout: nubisco
title: Stepper
intro: '`NbStepper` shows where someone is in a linear, multi-step task: which steps are behind them, which one they are on, and how many are left. It is a read-out of a flow, not the flow. The wizard around it still owns the current index, the validation, and the Back and Next buttons.'
source: src/components/Stepper.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <div style="width: 100%; max-width: 46rem;">
    <NbStepper v-model="playgroundStep" aria-label="Set up workspace" v-bind="resultingProps">
      <NbStepperStep label="Account" description="Name and email" />
      <NbStepperStep label="Workspace" description="Region and plan" />
      <NbStepperStep label="Members" description="Optional" />
      <NbStepperStep label="Review" />
    </NbStepper>
  </div>
</preview>

```vue
<template>
  <NbStepper v-model="step" aria-label="Set up workspace">
    <NbStepperStep label="Account" description="Name and email" />
    <NbStepperStep label="Workspace" description="Region and plan" />
    <NbStepperStep label="Members" description="Optional" />
    <NbStepperStep label="Review" />
  </NbStepper>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const step = ref(0)
</script>
```

Steps are components rather than an array of objects because a step's state is
usually the result of something the page already knows: whether a form section
validated, whether an optional step was skipped. Writing
`:invalid="!contact.valid"` on a step is the whole binding. An array would ask
you to keep a parallel copy of that state and then keep it in sync.

## This, or one of its neighbours

| Use                                               | When                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NbStepper`                                       | The user is working through a fixed sequence they are filling in: onboarding, a checkout, a wizard. |
| [`NbWalkthrough`](/components/walkthrough/usage)  | The user is being shown around UI that already exists: a coach-mark tour of the app.                |
| [`NbProgressBar`](/components/progress-bar/usage) | A machine is doing the work and the user is waiting: an upload, an import, a build.                 |
| [`NbTabs`](/components/tabs/usage)                | The sections are peers in any order, and only one is on screen at a time.                           |

The line worth remembering is the first two. **If the user is filling something
in, it is a stepper. If the user is being shown around, it is a walkthrough.**
`NbWalkthrough` dims the screen, spotlights a real element and moves on when the
user clicks Next. It teaches an interface. `NbStepper` never covers anything,
never moves on by itself, and has no opinion about what a step contains.

## When to use it

- Three or more steps. With two, a Back and Next pair says everything the
  indicator would.
- A sequence with a fixed length that the user can be told up front.
- Steps whose order is enforced, usually because a later step depends on an
  earlier answer.

## When not to use it

- Steps a user may complete in any order. That is a checklist, not a sequence.
- A step count that changes as the user answers. A stepper that grows from four
  steps to six mid-flow is worse than no stepper.
- A single long form with headings. Splitting it into steps to justify a stepper
  makes it slower to fill in.

## Anatomy

1. **Marker.** The step's number, or a check once it is complete, or a warning
   glyph when it is invalid.
2. **Label.** One or two words naming what the user does there, in their words
   rather than the system's: "Add members", "Choose region", "Confirm payment".
   Two labels to avoid: one that names the position instead of the work ("Step
   three"), and one that names the record instead of the action ("Members",
   "Region"), which reads as a section heading and stops telling the user what
   they are being asked for.
3. **Description.** Optional second line. Two good uses: marking a step
   `Optional`, and saying what is wrong with an invalid one. It wraps rather
   than truncates, because "Two fields are still empty" is worth a second line.
4. **Connector.** The rule leaving each marker. It carries the primary colour
   once the step it leaves is complete, which is what makes the row read as one
   sequence instead of four labels.
5. **Status word.** Rendered for screen readers only. See
   [Accessibility](#accessibility).

## Orientation

Horizontal is the default and fits above a form. Vertical reads better when the
labels are long, when there are more than about five steps, or when the stepper
sits in a side panel: nothing has to be shortened to fit.

<preview>
  <div style="display: flex; gap: 3rem; width: 100%; flex-wrap: wrap;">
    <div style="flex: 1 1 16rem; min-width: 0;">
      <NbStepper orientation="vertical" :model-value="1" aria-label="Vertical, medium">
        <NbStepperStep label="Connect the source" description="Database or file drop" />
        <NbStepperStep label="Map the fields" description="Three left to map" />
        <NbStepperStep label="Schedule the run" />
      </NbStepper>
    </div>
    <div style="flex: 1 1 16rem; min-width: 0;">
      <NbStepper orientation="vertical" size="sm" :model-value="1" aria-label="Vertical, small">
        <NbStepperStep label="Connect the source" />
        <NbStepperStep label="Map the fields" />
        <NbStepperStep label="Schedule the run" />
      </NbStepper>
    </div>
  </div>
</preview>

`size="sm"` drops the marker to 20px and the label to 12px. It is for a panel
rail or an inspector, not for a page: on a page it just makes the sequence
harder to read.

## Replacing a hand-rolled stepper

The audit found three stepper implementations across two applications, two of
them inside the same product and disagreeing with each other: an onboarding view
and a simulation wizard, different geometry, different notion of what "done"
looks like. If you are removing one, the mapping is usually:

| What the hand-rolled one had           | Here                                                     |
| -------------------------------------- | -------------------------------------------------------- |
| `class="step active"`                  | Nothing. Bind `v-model` and the current step is derived. |
| `class="step done"`                    | Nothing, or `complete` when it is ahead of the current.  |
| A `<div>` per step, click bound to it  | `navigable`, which makes reachable steps `<button>`s.    |
| A separate "error step" component      | `invalid`.                                               |
| A hidden step for a plan that skips it | `disabled`, which keeps the numbering honest.            |

Two things not to carry over: a stepper that owns Back and Next (the flow should
own those), and a stepper that lets the user click ahead. Neither is supported
here, and both were bugs in the originals.

<!--@include: ./_shared.md-->
