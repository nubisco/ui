---
layout: nubisco
title: Stepper
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbStepper` shows where someone is in a linear, multi-step task: which steps are
behind them, which one they are on, and how many are left. It is a read-out of a
flow, not the flow. The wizard around it still owns the current index, the
validation, and the Back and Next buttons.

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

| Use                                            | When                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NbStepper`                                    | The user is working through a fixed sequence they are filling in: onboarding, a checkout, a wizard. |
| [`NbWalkthrough`](/ui/components/walkthrough)  | The user is being shown around UI that already exists: a coach-mark tour of the app.                |
| [`NbProgressBar`](/ui/components/progress-bar) | A machine is doing the work and the user is waiting: an upload, an import, a build.                 |
| [`NbTabs`](/ui/components/tabs)                | The sections are peers in any order, and only one is on screen at a time.                           |

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

Under about 672px (the `md` breakpoint in [the grid](/ui/components/grid)),
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

## Keyboard

| Key                                   | Does                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Enters and leaves the stepper. The group is one tab stop |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Moves focus between reachable steps, horizontal only     |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves focus between reachable steps, vertical only       |
| <kbd>Home</kbd> / <kbd>End</kbd>      | Jumps to the first or last reachable step                |
| <kbd>Enter</kbd> / <kbd>Space</kbd>   | Goes to the focused step                                 |

Arrow keys move focus, they do not select. A stepper usually sits above a
half-filled form, and an arrow key that navigated would throw that away.
Selection is Enter or Space, deliberately.

The tab stop follows focus. Arrow to step 3, <kbd>Tab</kbd> out to the form,
<kbd>Shift</kbd>+<kbd>Tab</kbd> back, and you land on step 3, not back at the
start of the group.

If the flow moves under you and the step you left stops being reachable, both
the tab stop **and focus itself** move to the first step that still is. That
second half matters more than it sounds: a step is a `<button>` only while it is
reachable, so the moment the flow lands on the step you are standing on, that
button is replaced by a `<div>` and a browser drops focus to `<body>`. The next
<kbd>Tab</kbd> would restart at the top of the page, which for a stepper above a
long form means walking the whole document again.

Focus is only ever put back when the group had it and lost it to nothing. If you
tabbed away on purpose, or the flow moved focus to the new step's heading, the
stepper leaves it where it is: taking focus back off a heading a screen reader
has just started reading is worse than the bug this avoids. When no step is
focusable any more, which is the honest end of a finished flow, nothing is
focused and your own focus management takes over.

A stepper that is not `navigable` contains no focusable elements at all and is
skipped by <kbd>Tab</kbd>, which is correct: there is nothing there to operate.

## Accessibility

- **The list is an `<ol>` with one `<li>` per step, and it carries an explicit
  `role="list"`.** The role is not redundant. A stepper has to set
  `list-style: none`, and Safari with VoiceOver drops list semantics from a list
  whose markers are removed, so without the role the "sequence of four things"
  is exactly what a VoiceOver user does not hear. Restating the implicit role is
  the documented way to keep it, and it is why a stepper built out of `<div>`s
  cannot be repaired with CSS.
- The current step carries `aria-current="step"`, and only that one does.
- Each step renders its status as text ("Complete", "Needs attention") in a
  visually hidden span, because colour and glyph carry it for everyone else.
  Position is deliberately not repeated there: the list already conveys "2 of
  4", and saying it again would have every step announced twice over.
- **The move is announced.** Advancing a flow changes a marker's colour and
  nothing else: no focus moves, and no text the user is reading changes, so a
  screen-reader user gets no notification at all. The stepper owns that
  announcement rather than leaving it to the wizard, because the stepper is the
  only part that always knows the number, the total and the label. It renders a
  polite `role="status"` region that reads "Step 2 of 4: Workspace" when
  `modelValue` changes, silent on first render.

  Set `:announce="false"` when the flow already moves focus to the new step's
  heading. That is the better pattern where you can do it, and running both
  announces the move twice.

- Clickable steps are real `<button>` elements. Steps ahead of the user and
  disabled steps are not buttons at all, so nothing focusable ever leads
  somewhere the flow refuses to go.
- One tab stop, with a roving `tabindex` that follows focus. A five-step
  indicator does not cost five <kbd>Tab</kbd> presses on the way to the form
  under it, and coming back lands where you left.
- Numbering and status come from document position, so a step inserted or moved
  after mount never leaves `aria-current` on the wrong `<li>` or announces "step
  3" where the reader sees the second one.
- Pass `ariaLabel` when the page holds more than one stepper, or when
  "Progress" would not tell a screen-reader user which flow they are in.
- Labels wrap and are never truncated, so no step's accessible name is ever a
  clipped fragment, and nothing depends on a hover tooltip a touch user cannot
  open.
- **A clickable step is named by its label and nothing else.** The description
  and the hidden status word live inside the click target, so left alone the
  button's accessible name would be the whole subtree: "Account Name and email
  Complete". The button carries `aria-labelledby` pointing at the label and
  `aria-describedby` pointing at the description (when there is one) and the
  status word, so a rotor lists four steps rather than four sentences and the
  extra detail is still there for anyone who wants it. A step that is not
  clickable is a `<div>` with no role, so it has no name to get wrong and is
  left to reading order.
- **Two kinds of motion, both dropped under `prefers-reduced-motion: reduce`.**
  The colour transition on the marker, label and connector, and the smooth
  scroll the list performs when the flow advances past the visible steps in a
  viewport too narrow to hold them. Under reduced motion the transitions become
  `none` and the scroll becomes an instant jump.
- Colours come from semantic tokens (`--nb-c-primary`, `--nb-c-danger`,
  `--nb-c-text-muted`, `--nb-c-component-disabled`, `--nb-c-focus-ring`), never
  from a brand ramp, so a retheming consumer gets their own colours in both
  light and dark. Type weights come from the same scale
  (`--nb-font-weight-regular`, `--nb-font-weight-semibold`): the scale has no
  500, so an idle label is regular and the current and invalid states are
  semibold rather than a hardcoded number a branded product cannot reweight.
- **It runs both ways.** Every measurement along the reading direction is a
  logical property: the connector is pinned with `inset-inline`, the
  marker-to-label gap with `padding-inline-end`, the step's floor width with
  `min-inline-size`. Under `dir="rtl"` the sequence runs right to left and the
  connector follows it, which matters because `labels` is the localisation hook
  and a translated stepper drawn left to right is a broken one.

### Why there is no loading state

Several components in this library ship a skeleton. This one does not, and that
is a decision rather than an omission.

A skeleton is a promise about shape: it says "content of roughly this size is
coming". A stepper's shape **is** its content. The number of steps is the
information, so a skeleton stepper has to either invent a step count, which is a
lie the moment the real one differs, or draw a shapeless bar, which tells the
user nothing they did not already know.

The steps are also known earlier than the data almost every time: a wizard's
step list is written in the template, and it is the contents of step 1 that are
waiting on a request, not the list of steps. So:

- **Waiting on the step contents.** Render the stepper immediately, and put
  [`NbSkeleton`](/ui/components/skeleton) or
  [`NbInlineLoading`](/ui/components/inline-loading) inside the step panel. The
  user gets the shape of the flow at once, which is the more useful half.
- **Waiting on the step list itself** (rare, and worth avoiding). Render nothing
  where the stepper will go and reserve its height. A four-step placeholder that
  resolves to six steps is worse than a gap, because the user has already
  counted.

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

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const playgroundStep = ref(1)
const navigableStep = ref(0)

const availableProps = [
  {
    label: 'Orientation',
    name: 'orientation',
    type: 'single',
    options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
    ],
    default: 'horizontal',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
    ],
    default: 'md',
  },
  {
    label: 'Navigable',
    name: 'navigable',
    type: 'boolean',
    placeholder: 'Let the user click back',
    default: false,
  },
]
</script>
