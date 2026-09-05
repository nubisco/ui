---
layout: nubisco
title: Loading and progress
description: Choosing between a skeleton, a spinner, inline loading, a progress bar and nothing at all, with the latency numbers that decide it and the rule that a view must never claim to be empty while it is still waiting.
---

A loading indicator is not decoration and it is not politeness. It is a claim:
**work is happening, it has not finished, and here is what you will get.** Every
defect on this page comes from making that claim at the wrong moment, in the
wrong shape, or not making it at all.

There are five possible answers, and one of them is to show nothing. Choosing
badly between them is cheap to do and expensive to live with. Before 3.3.0 the
library shipped no spinner at all, and the twelve applications built on it
answered the question twelve ways:

- **One product ships two different spinners**, only one of which respects
  `prefers-reduced-motion`.
- **One renders the literal string `Loading` under eight different class
  names**, because nobody had written down what a second and a third wait are
  supposed to look like.
- **One spells it `Loading…` in one file and `Loading...` in another.**
- **Three products hand-built skeletons, in five different shapes**, none of
  which measure the text they stand in for.
- **One product has no loading state anywhere.** Import and update are silent:
  the user presses the button and the screen does nothing until it is over.
- **One product renders a single `.empty-text` element for both loading and
  empty**, so a failed fetch reads as `No contacts yet` to a user who has
  contacts.

That last one is the whole point of this page in one line. A loading state that
is not distinguished from an empty state is not a styling problem. It is the
interface stating something false about the user's data.

The components exist now: [`NbSkeleton`](/ui/components/skeleton),
[`NbSpinner`](/ui/components/spinner),
[`NbInlineLoading`](/ui/components/inline-loading) and
[`NbProgressBar`](/ui/components/progress-bar), plus
[`useInlineLoading`](/ui/components/inline-loading#useinlineloading) and the
shared announcer behind `completeLabel`. Nothing on this page asks you to build
anything. It tells you which one to reach for, and when the correct answer is
none of them.

::: danger Never hand-roll
No app-local spinner SVG, no `.skeleton` class, no `<div v-if="loading">Loading…</div>`,
no CSS keyframe that moves a bar you invented. Every one of those exists in the
fleet today, and every one of them lost the reduced-motion fallback, the
announcement, or both.
:::

The five answers at their real sizes, in one frame. Everything below is the
running component, not a picture of one:

<preview dir="col">
  <div class="lfx-answers">
    <div class="lfx-answer">
      <p class="lfx-label">Nothing</p>
      <div class="lfx-nothing"></div>
      <p class="lfx-note">Under 300 ms. The result lands before anything is drawn, so nothing is.</p>
    </div>
    <div class="lfx-answer">
      <p class="lfx-label">NbSkeleton</p>
      <NbSkeleton :lines="3" type="body-md" />
      <p class="lfx-note">You know the layout that is coming, so you can reserve it.</p>
    </div>
    <div class="lfx-answer">
      <p class="lfx-label">NbSpinner</p>
      <NbSpinner label="Loading invoices" show-label />
      <p class="lfx-note">You know only that work is happening, so promise nothing else.</p>
    </div>
    <div class="lfx-answer">
      <p class="lfx-label">NbInlineLoading</p>
      <NbInlineLoading status="active" label="Saving contact" finished-label="Contact saved" error-label="Could not save contact" />
      <p class="lfx-note">The user pressed something and is owed the outcome, in place.</p>
    </div>
    <div class="lfx-answer">
      <p class="lfx-label">NbProgressBar</p>
      <NbProgressBar label="Uploading assets" :value="27" :max="64" helper="27 of 64 files" />
      <p class="lfx-note">You can count the units, so you owe a number.</p>
    </div>
  </div>
</preview>

They are not five styles of the same thing. Each one makes a different claim,
and the rest of this page is about which claim you are entitled to make.

---

## Rule 1: the wait decides the indicator, and the numbers are fixed

Latency is the first input, not the last. Pick the row the operation actually
lands in, under load, on the slowest connection you support. Not the row it hits
on your machine against a warm cache.

| Wait              | What the user gets                                                            | Mechanism                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Under **300 ms**  | Nothing. No spinner, no skeleton, no layout change.                           | `<NbSpinner :delay="300">`, or a skeleton behind the same gate. The result lands before anything is drawn.                              |
| **300 ms to 1 s** | A local indicator on the thing being loaded. Nothing blocks, nothing moves.   | A skeleton in place, or an inline `NbSpinner`, or `loading` on the button that fired it.                                                |
| **1 s to 10 s**   | A named indicator that says what is loading, and says so again when it lands. | `label` plus `completeLabel`. Block only the region that is genuinely unusable.                                                         |
| **Beyond 10 s**   | A number, or a way out, or the page back.                                     | `NbProgressBar` with a real `value`; or the spinner's default slot carrying `Cancel`; or a background job that reports through a toast. |

### Why 300 ms

Below roughly a quarter of a second, a response reads as a direct consequence of
the click. An indicator that appears and is torn down inside that window is not
reassurance, it is a flicker: the eye registers that something moved, learns
nothing from it, and the screen looks unstable. A spinner shown for 80 ms is
strictly worse than no spinner, because "nothing happened yet" is at least true.

Implement it with the component's own `delay`, never with a `setTimeout` around
your loading flag:

```vue
<template>
  <!-- Local or cached work: only show a ring if it actually stalls. -->
  <NbSpinner v-if="loading" :delay="300" label="Searching contracts" />
</template>
```

`delay` gates rendering, not visibility. During the delay there is no element in
the DOM and nothing in the accessibility tree, so a request that resolves in
80 ms announces nothing either. A hand-rolled `opacity: 0` version fails exactly
here: it is invisible to the eye and fully present to a screen reader.

Use `0`, not `300`, for anything that crosses a network under load. The delay is
a defence against fast operations, not a stall you add to slow ones.

Press both. They fire the same 150 ms request, and the only difference between
the two spinners is the number in `delay`:

<preview dir="col">
  <div class="lfx-pair">
    <div class="lfx-half lfx-half--wrong">
      <p class="lfx-label">Wrong: delay 0 on work that is usually instant</p>
      <div class="lfx-slot">
        <NbSpinner v-if="fastLoading" :delay="0" size="sm" label="Searching contracts" show-label />
      </div>
      <NbButton size="sm" @click="runFast">Search (150 ms)</NbButton>
      <p class="lfx-note">A ring appears and is destroyed inside a tenth of a second. The eye registers that something moved and learns nothing from it, and a screen reader is told "Searching contracts" about a search that has already finished.</p>
    </div>
    <div class="lfx-half lfx-half--right">
      <p class="lfx-label">Right: the same spinner, delay 300</p>
      <div class="lfx-slot">
        <NbSpinner v-if="fastLoading" :delay="300" size="sm" label="Searching contracts" show-label />
      </div>
      <NbButton size="sm" @click="runFast">Search (150 ms)</NbButton>
      <p class="lfx-note">Nothing is drawn at all. There is no element in the DOM and nothing in the accessibility tree, which is the difference between <code>delay</code> and an opacity of zero.</p>
    </div>
  </div>
</preview>

Now the same two on a request that genuinely stalls. The delay costs the second
spinner 300 ms of its life and changes nothing else:

<preview dir="col">
  <div class="lfx-pair">
    <div class="lfx-half">
      <p class="lfx-label">delay 0</p>
      <div class="lfx-slot">
        <NbSpinner v-if="slowLoading" :delay="0" size="sm" label="Searching contracts" show-label />
      </div>
      <NbButton size="sm" @click="runSlow">Search (1.5 s)</NbButton>
    </div>
    <div class="lfx-half">
      <p class="lfx-label">delay 300</p>
      <div class="lfx-slot">
        <NbSpinner v-if="slowLoading" :delay="300" size="sm" label="Searching contracts" show-label />
      </div>
      <NbButton size="sm" @click="runSlow">Search (1.5 s)</NbButton>
    </div>
  </div>
</preview>

Both frames reserve the spinner's row, which is why nothing moves when it
arrives. That is a property of the layout around the indicator, not of the
indicator, and it is the subject of the next rule.

::: warning A delayed overlay does not block during its delay
`overlay="container"` and `overlay="page"` claim their region when the spinner
becomes visible. While a `delay` is still counting, the spinner does not exist,
so nothing is inert and nothing is scrimmed: the button the user just pressed is
still live and a second click still fires. Give a blocking overlay `delay="0"`,
or make sure the action itself is locked (see [Rule 8](#rule-8-in-flight-controls-and-the-double-submit)).
:::

### Why 1 s

Around a second, the user stops attributing the pause to their own click and
starts wondering about the system. From here on the indicator has to name its
subject: `Loading invoices`, not `Loading`. A generic ring says only that
something, somewhere, is busy, which is the least useful true statement an
interface can make. It is also the exact string a screen reader user hears from
every indicator in the fleet today.

### Why 10 s

An indeterminate indicator carries the same information at second one and at
second forty. Past roughly ten seconds it has stopped informing and the honest
reading is that something is stuck. At that point you owe one of three things,
in this order of preference:

1. **A number.** Switch to [`NbProgressBar`](/ui/components/progress-bar) with a
   real `value`.
2. **A way out.** `NbSpinner`'s default slot renders below the ring inside the
   one subtree a page overlay does not inert, so a `Cancel` button placed there
   is genuinely reachable while the rest of the application is not.
3. **The page back.** Let the work continue in the background and report it when
   it lands.

Whatever you choose, put a timeout on the request. The overlay's lifetime is
your `v-if` and nothing in the library will ever take it down for you. A page
overlay over a request that can hang is an application the user can only leave
by closing the tab.

---

## Rule 2: five answers, and "nothing" is one of them

Once the wait is known, the shape of the knowledge picks the component.

| You know                                                        | Show                                                        | Because                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| It will be over in under 300 ms                                 | **Nothing**                                                 | A flash of feedback is worse than no feedback |
| The layout that is coming, before the data arrives              | [`NbSkeleton`](/ui/components/skeleton)                     | It reserves the space the content will occupy |
| Only that work is happening, and it blocks a region or the page | [`NbSpinner`](/ui/components/spinner)                       | It promises nothing about shape or duration   |
| The user pressed something and is waiting for an outcome        | [`NbInlineLoading`](/ui/components/inline-loading)          | The outcome is the half everybody forgets     |
| A total: files, bytes, records, steps                           | [`NbProgressBar`](/ui/components/progress-bar) with `value` | You can answer "how much longer", so you must |

These are not exclusive. A real screen loads in stages and each stage gets its
own answer: skeletons on first paint, a container spinner on the late chart, the
button's own `loading` while the user saves. What is forbidden is one
indicator standing in for all of them, which is how eight class names for
`Loading` happen.

::: tip Nothing is a real design decision, so write it down
If a view deliberately shows nothing for its fast path, put the `:delay` on the
component rather than removing the component. That way the decision is in the
template where the next person can read it, and a request that starts to stall
still becomes visible without a second round of work.
:::

---

## Rule 3: a skeleton is a promise about layout, a spinner is not

A spinner says "something is happening". A skeleton says "content is coming and
it will look like this". The second is a much stronger claim, and it is only
worth making when you can keep it.

**A skeleton that does not match the shape of what lands causes layout shift,
which is the entire reason to have used one.** Content that snaps into a
differently sized box moves everything below it, throws away the reading
position, and can move a button under a pointer that is already travelling
toward it. A mis-shaped skeleton is a spinner with extra steps and a worse
outcome.

Here is that sentence as a thing you can watch happen. Both cards load the same
record, three rows of `body-md` text, and both are covered by a real
`NbSkeleton` while it loads. The left one is covered by a hand-guessed 32 pixel
block, which is exactly what an app-local `.skeleton` div is. The right one is
covered by `:lines="3" type="body-md"`, measured from the same type set the
text is. Press the button and watch the footer of each card:

<preview dir="col">
  <div class="lfx-shift">
    <NbButton size="sm" @click="reloadRecord">Reload both</NbButton>
    <div class="lfx-pair">
      <div class="lfx-half lfx-half--wrong">
        <p class="lfx-label">Wrong: a placeholder that measures nothing</p>
        <div class="lfx-card">
          <NbSkeleton v-if="!recordLoaded" variant="block" :height="32" />
          <div v-else class="lfx-rows">
            <p>Marta Oliveira</p>
            <p>marta.oliveira@example.com</p>
            <p>Lisbon, Portugal</p>
          </div>
          <div class="lfx-card-footer">
            <NbButton size="sm" variant="secondary">Open record</NbButton>
          </div>
        </div>
        <p class="lfx-note">The content is 71 pixels tall and the placeholder is 32, so the footer and everything below it jumps about 40 pixels the moment the data lands. A pointer already travelling toward Open record arrives somewhere else.</p>
      </div>
      <div class="lfx-half lfx-half--right">
        <p class="lfx-label">Right: lines 3, type body-md</p>
        <div class="lfx-card">
          <NbSkeleton v-if="!recordLoaded" :lines="3" type="body-md" label="Loading contact" complete-label="Contact loaded" />
          <div v-else class="lfx-rows">
            <p>Marta Oliveira</p>
            <p>marta.oliveira@example.com</p>
            <p>Lisbon, Portugal</p>
          </div>
          <div class="lfx-card-footer">
            <NbButton size="sm" variant="secondary">Open record</NbButton>
          </div>
        </div>
        <p class="lfx-note">Nothing moves. Not less movement: none. The placeholder and the content occupy the same 71 pixels, so the swap is invisible to the layout and the only thing that changes is that the text is now readable.</p>
      </div>
    </div>
  </div>
</preview>

The right card holds still because `type="body-md"` resolves to `14px × 1.5`
per line, and `lines` stacks those reserved line boxes with the library's own
half-unit gap between them. The content that lands is a stack of rows carrying
the same type set and the same gap, so the two are the same height by
construction rather than by measurement. Match the container and the gaps as
well as the type: a single wrapped paragraph has no gap between its lines, so
it is the one text shape a multi-line skeleton reserves slightly more room than.

The left card is not a styling mistake. It is a placeholder that was never
measured against anything, which is the state all three hand-built skeleton
implementations in the fleet are in.

`NbSkeleton` is built so the promise can be kept:

- `variant="text"` and `variant="heading"` size themselves from a **type set**,
  not from a pixel height. `type="body-md"` reserves exactly
  `font-size × line-height` of the real text, which is why swapping content in
  does not move anything below it.
- `lines` and `lastLineWidth` shape a paragraph so it does not read as a solid
  slab.
- `variant="circle"` takes one measurement for both axes, so an avatar
  placeholder cannot come out oval.
- `variant="block"` with an explicit `height` covers cards, images, charts and
  map panes: things whose height you know before their content exists.

```vue
<!-- The placeholder is laid out in the same container, with the same gaps,
     as the content it stands in for. -->
<template>
  <NbGrid gap="md" align="center">
    <NbSkeleton variant="circle" :width="40" label="Loading profile" />
    <NbGrid dir="col" gap="xs" grow>
      <NbSkeleton variant="heading" type="heading-01" width="45%" />
      <NbSkeleton :lines="2" type="body-md" />
    </NbGrid>
  </NbGrid>
</template>
```

Only one skeleton in a region carries `label`. Forty placeholders with forty
labels announce themselves forty times.

### When a skeleton is the wrong answer

- **The shape is unknown.** A response that might be empty, or a table with an
  unknown column count, cannot be promised. Use a spinner and promise nothing.
- **The content is already on screen.** Replacing rendered rows with grey bars
  during a refresh destroys what the user was reading and collapses the page.
  Keep the stale content and put `overlay="container"` over it.
- **A control that could simply be disabled.** A form waiting for its values is
  a form with disabled fields, not a stack of grey slabs: a disabled control
  keeps its label, its help text and its place in the tab order. See
  [Disabled and read-only](/patterns/disabled-and-read-only).
- **You have a total.** That is a progress bar, which can say how far along it
  is. A skeleton says nothing about time.

### Tables never hand-build skeleton rows

[`NbDataTable`](/ui/components/data-table) takes `loading` and renders
`skeletonRows` placeholder rows (default 5) inside its own column structure,
with `aria-busy` on the table. The columns already know their widths, so the
placeholder is correct by construction and the header stays readable while the
body fills.

```vue
<template>
  <NbDataTable
    :columns="columns"
    :rows="rows"
    row-key="id"
    :loading="state.status === 'loading'"
    :error="state.status === 'error' ? 'Could not load invoices' : undefined"
    empty-message="No invoices for this period"
  />
</template>
```

Three states, three props, one precedence order enforced by the component:
loading wins over error, and error wins over empty. That order is the point;
see [Rule 6](#rule-6-loading-empty-and-error-are-three-states-not-two-branches).

Flip the controls. `loading`, `error` and an empty `rows` array are the three
inputs, and the component resolves them in that order without a single `v-if`
at the call site:

<preview :props="tableProps" v-slot="{ resultingProps }">
  <NbDataTable
    :columns="invoiceColumns"
    :rows="resultingProps.rows === 'none' ? [] : invoiceRows"
    row-key="id"
    :loading="resultingProps.loading"
    :skeleton-rows="resultingProps.skeletonRows"
    :error="resultingProps.error ? 'Could not load invoices' : undefined"
    empty-message="No invoices for this period"
  />
</preview>

Turn `loading` and `error` on together and the table still shows placeholders,
because a request that has not answered cannot have failed. The header, the
column widths and the toolbar are drawn throughout: the placeholder rows are
inside the real column structure, which is why they cannot be the wrong width.

---

## Rule 4: an action the user took reports its own outcome, in place

A load the user is watching and a load the user _started_ are different events.
The second one has two halves, and the fleet consistently ships only the first:
**platform, tally, planetcraft, stagewright and the white-label product confirm a successful save
with nothing at all.** The spinner stops, the button comes back, and the user is
left to infer from the absence of an error that their work was kept.

Silence is not confirmation. [`NbInlineLoading`](/ui/components/inline-loading)
is the confirmation, and it lives next to the control that fired, because that
is where the user is looking.

```vue
<script setup lang="ts">
import { useInlineLoading } from '@nubisco/ui'

const save = useInlineLoading()
</script>

<template>
  <NbButton :loading="save.status.value === 'active'" @click="save.run(submit)">
    Save changes
  </NbButton>
  <NbInlineLoading
    :status="save.status.value"
    label="Saving"
    finished-label="Saved"
    error-label="Could not save changes"
    @success="save.reset"
  />
</template>
```

Four states, and `inactive` is not "hidden": the component keeps its empty live
region mounted so assistive technology is already watching the node before the
first update lands in it.

All four, on the real component. `inactive` looks like nothing and is not
nothing: the node is there, holding its width and its live region, which is why
moving between the other three does not push the row around:

<preview :props="inlineProps" v-slot="{ resultingProps }">
  <div class="lfx-inline-frame">
    <NbInlineLoading
      :status="resultingProps.status"
      :label="resultingProps.label"
      :finished-label="resultingProps.finishedLabel"
      :error-label="resultingProps.errorLabel"
      :reserve-space="resultingProps.reserveSpace"
    />
    <NbButton size="sm" variant="secondary">Next control in the row</NbButton>
  </div>
</preview>

Turn `reserveSpace` off and step through the states again: the button beside it
slides every time the text changes length. That is the prop's whole job, and it
is on by default.

### The success dwell

`finished` stays on screen for `dwell` milliseconds (default `1600`) and then
emits `success`. Handle it by returning to `inactive` or by navigating away.

Both failure modes are real and both have shipped: a confirmation that vanishes
in 200 ms was never read, and one that never leaves becomes furniture the user
stops seeing. Below roughly 1000 ms the reader does not finish the word, which
is why the default sits where it does. The dwell is also disarmed by leaving
`finished`, so a second save started before the first confirmation faded cannot
deliver a stale `success` afterwards.

Press them. All three buttons run the same 1.2 second request. Only two of them
tell you what happened:

<preview dir="col">
  <div class="lfx-pair">
    <div class="lfx-half lfx-half--wrong">
      <p class="lfx-label">Wrong: started, and then silence</p>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" :loading="silentSaving" @click="runSilent">Save changes</NbButton>
      </NbGrid>
      <p class="lfx-note">The spinner stops and the row returns to exactly how it looked before the click. This is what platform, tally, planetcraft, stagewright and the white-label product ship, and it is indistinguishable from a request that was dropped, which is why people press Save twice.</p>
    </div>
    <div class="lfx-half lfx-half--right">
      <p class="lfx-label">Right: useInlineLoading drives all four states</p>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" :loading="save.status.value === 'active'" @click="runSave">Save changes</NbButton>
        <NbInlineLoading :status="save.status.value" label="Saving" finished-label="Saved" error-label="Could not save changes" @success="save.reset()" />
      </NbGrid>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" variant="secondary" :loading="save.status.value === 'active'" @click="runSaveFailure">Save, and fail</NbButton>
      </NbGrid>
      <p class="lfx-note">One element carries all four moments. Watch the confirmation: it holds for the 1600 ms dwell, long enough to read the word, then emits <code>success</code> and the handler returns the component to <code>inactive</code>. The second button rejects, and the same element reports the failure instead, with no <code>finally</code> able to clear it first.</p>
    </div>
  </div>
</preview>

Press the two right-hand buttons in quick succession. Only the newest run is
allowed to write the status, so the first request cannot land on top of the
second and report the wrong outcome. That is the behaviour a hand-written
`try/catch/finally` does not have.

### Why the composable rather than your own try/catch

Every app that lost its success state wrote the same `try/catch/finally` by
hand, and the `finally` reset the flag before anything could be shown.
`useInlineLoading().run()` owns the sequence: it drives all four states, keeps
the rejection reason in `error` rather than rethrowing it into an unhandled
promise, lets only the newest of two overlapping runs write the status, and
calls `suppressLoadingAnnouncement()` on failure so a screen reader is not told
the thing loaded (see [Rule 9](#rule-9-accessibility-is-the-start-and-the-finish)).

### The button is not the announcement

`NbButton`'s `loading` prop disables the button, hides its `icon` and renders a
spinner that is `aria-hidden`. That is deliberate: the button keeps its own
accessible name and does not announce a state change. It stops a double submit
and it tells a sighted user that something is running, and that is all it does.
If the outcome matters, something else has to say it: `NbInlineLoading` beside
the button, or a toast for work whose result outlives the screen.

### Where the confirmation goes

| The user is                                          | Confirm with                                           |
| ---------------------------------------------------- | ------------------------------------------------------ |
| Still looking at the thing they changed              | `NbInlineLoading` beside the control                   |
| Going to leave, or already left, the surface         | [`NbToaster`](/ui/components/toaster) via `useToast()` |
| Owed a standing statement about the page's condition | [`NbBanner`](/ui/components/banner) `variant="inline"` |

Do not confirm the same save twice on two surfaces. Pick the one the user will
be looking at when it lands.

---

## Rule 5: determinate when you can count, and never fake a bar

[`NbProgressBar`](/ui/components/progress-bar) with a `value` is the strongest
loading statement we make, because it answers "how much longer". Use it whenever
you can count the units the work is made of: files, bytes, records, migration
steps.

```vue
<template>
  <NbProgressBar
    label="Uploading assets"
    :value="uploaded"
    :max="total"
    :helper="`${uploaded} of ${total} files`"
    :status="failed ? 'error' : uploaded === total ? 'finished' : 'active'"
  />
</template>
```

The `helper` line is not optional decoration. A percentage tells the user how
far along the bar is; `42 of 64 files` tells them what is actually happening,
and it is the line that makes a stall diagnosable.

The same component, with and without a `value`. One of these can answer "how
much longer" and the other cannot, and the difference is visible from across the
room:

<preview dir="col">
  <div class="lfx-stack">
    <NbButton size="sm" @click="runUpload">Upload 64 files</NbButton>
    <div class="lfx-pair">
      <div class="lfx-half">
        <p class="lfx-label">Determinate: value and max</p>
        <NbProgressBar
          label="Uploading assets"
          :value="uploaded"
          :max="64"
          :helper="uploaded + ' of 64 files'"
          :status="uploaded === 64 ? 'finished' : 'active'"
        />
        <p class="lfx-note">The bar answers the question and the helper says what the number counts. When it lands, <code>status="finished"</code> fills the track and recolours it, and the colour is paired with an icon and the helper text so the outcome is never carried by colour alone.</p>
      </div>
      <div class="lfx-half">
        <p class="lfx-label">Indeterminate: no value</p>
        <NbProgressBar label="Uploading assets" helper="Preparing the transfer" :status="uploaded === 64 ? 'finished' : 'active'" />
        <p class="lfx-note">Correct for the seconds between starting an upload and learning its size, and correct nowhere else. <code>aria-valuenow</code> is dropped rather than guessed, so the bar does not report a position it does not have.</p>
      </div>
    </div>
  </div>
</preview>

There is no upload behind this page, so the count above is stepped by a timer.
In an application that number comes from the transfer and from nothing else,
which is the subject of the next paragraph.

**Indeterminate is a temporary state, not a style.** Omitting `value` while
`status` is `active` sweeps the track, and `aria-valuenow` is dropped so the bar
does not report a position it does not have. That is correct for the seconds
between starting an upload and learning its size. A bar that sweeps forever is a
promise of a percentage that never arrives: if there will never be a number, the
component is [`NbSpinner`](/ui/components/spinner).

::: danger Never simulate progress
A bar driven by a timer, an easing curve, or an interval that creeps toward 90%
and waits there is a lie told with a number in it. It survives contact with
reality exactly until the first slow request, and then it either stalls at a
percentage that means nothing or completes before the work does. If you cannot
measure it, say you cannot measure it: an indeterminate indicator is honest and
a fabricated one is not.
:::

Both of these are `NbProgressBar`. The component is not the problem in either
half: what is wrong on the left is what is driving it.

<preview dir="col">
  <div class="lfx-stack">
    <NbButton size="sm" @click="runProgressPair">Start both</NbButton>
    <div class="lfx-pair">
      <div class="lfx-half lfx-half--wrong">
        <p class="lfx-label">Wrong: an easing curve creeping to 90%</p>
        <NbProgressBar label="Publishing release" :value="fakeValue" :max="100" :helper="Math.round(fakeValue) + '% complete'" status="active" />
        <p class="lfx-note">Nothing is measured. It moves quickly at first because that is what the curve does, then parks at 90% and stays there for as long as the work takes, which is the exact moment the user needed information. The number is a lie with a decimal point in it, and it will still be sitting there when the request times out.</p>
      </div>
      <div class="lfx-half lfx-half--right">
        <p class="lfx-label">Right: indeterminate until the total is known</p>
        <NbProgressBar label="Publishing release" :value="honestValue" :max="64" :helper="honestHelper" :status="honestValue === 64 ? 'finished' : 'active'" />
        <p class="lfx-note">Sweeping while the size is unknown, then a real count the moment there is one. Indeterminate is a temporary state, not a style: this bar is allowed to sweep because it is about to be able to count.</p>
      </div>
    </div>
  </div>
</preview>

The left half took the same handful of lines as the right half and cost more,
because a fabricated number outlives the demo. It is the one the support ticket
quotes.

`status="finished"` and `status="error"` both fill the track and recolour it,
and both pair the colour with an icon and the `helper` text, so the outcome is
never carried by colour alone. A multi-step task the user navigates through is
not a progress bar at all: that is [`NbStepper`](/ui/components/stepper).

---

## Rule 6: loading, empty and error are three states, not two branches

This is the most expensive defect in the audit and it is two lines long:

```vue
<!-- Wrong. Shipped today. -->
<div v-if="contacts.length">…</div>
<p v-else class="empty-text">No contacts yet</p>
```

Loading falls into the `v-else`. A failed fetch falls into the `v-else`. A 403
falls into the `v-else`. All three tell the user they have no contacts.

**Never render an empty state while you do not yet know.** Absence of data is
not knowledge of absence, and an empty state is a claim about reality that you
are only entitled to make after the server has answered. Model the view as a
state, branch on it in precedence order, and reach the empty state last:

```ts
type TViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: IContact[] }
```

```vue
<template>
  <NbSkeleton
    v-if="state.status === 'loading'"
    :lines="6"
    type="body-md"
    label="Loading contacts"
    complete-label="Contacts loaded"
  />
  <NbBanner
    v-else-if="state.status === 'error'"
    status="error"
    variant="inline"
    title="Could not load contacts"
  >
    The request did not complete. This is usually temporary.
  </NbBanner>
  <NbEmptyState v-else-if="!state.rows.length" kind="empty" … />
  <ContactList v-else :rows="state.rows" />
</template>
```

The two branches and the three, side by side, driven by the same two requests.
Press the failing one and read the left half:

<preview dir="col">
  <div class="lfx-stack">
    <NbGrid dir="row" gap="sm" align="center">
      <NbButton size="sm" @click="loadContacts('ok')">Load contacts</NbButton>
      <NbButton size="sm" variant="secondary" @click="loadContacts('fail')">Load contacts, and fail</NbButton>
      <NbButton size="sm" variant="secondary" @click="loadContacts('empty')">Load contacts, none exist</NbButton>
    </NbGrid>
    <div class="lfx-pair">
      <div class="lfx-half lfx-half--wrong">
        <p class="lfx-label">Wrong: v-if on rows.length</p>
        <div class="lfx-contacts">
          <div v-if="contactRows.length" class="lfx-rows">
            <p v-for="row in contactRows" :key="row.id">{{ row.name }}</p>
          </div>
          <NbEmptyState v-else kind="empty" size="sm" title="No contacts yet" description="Add your first contact to get started." />
        </div>
        <p class="lfx-note">Loading falls into the else. A failed request falls into the else. A 403 falls into the else. All three tell a user who has 2,400 contacts that they have none, and the third one invites them to create a record they are not allowed to see.</p>
      </div>
      <div class="lfx-half lfx-half--right">
        <p class="lfx-label">Right: loading, then error, then empty</p>
        <div class="lfx-contacts">
          <NbSkeleton v-if="contactsStatus === 'loading'" :lines="3" type="body-md" label="Loading contacts" complete-label="Contacts loaded" />
          <NbBanner v-else-if="contactsStatus === 'error'" status="error" variant="inline" title="Could not load contacts">The request did not complete. This is usually temporary.</NbBanner>
          <NbEmptyState v-else-if="!contactRows.length" kind="empty" size="sm" title="No contacts yet" description="Add your first contact to get started." />
          <div v-else class="lfx-rows">
            <p v-for="row in contactRows" :key="row.id">{{ row.name }}</p>
          </div>
        </div>
        <p class="lfx-note">Four outcomes, four different statements, and the empty state is unreachable until the server has answered. The failure is a page-level condition, so it is an inline <code>NbBanner</code> and not a 12px field helper.</p>
      </div>
    </div>
  </div>
</preview>

The full treatment of the four empty cases, and of the difference between
`empty` and `no-results`, is in [Empty states](/patterns/empty-states). What
belongs here is the boundary: **the loading state owns the screen until the
response lands, and it hands over to exactly one successor.**

One more boundary, on the error side. A failed load is a page-level condition,
so it goes in [`NbBanner`](/ui/components/banner) with `variant="inline"`, not
in [`NbMessage`](/ui/components/message), which is a 12px inline helper sized
for a form field. The fleet gets this wrong at scale: one product uses
`NbMessage` for 30 page-level errors, and cms renders a failed media upload as
an inline `NbMessage` in an application that already uses `NbBanner` in the
shell notification rail in 18 other places. And never `alert()`, which one
product throws 21 times for exceptions: see [Dialogs](/patterns/dialogs).

---

## Rule 7: block only what is genuinely unusable

`NbSpinner` has three placements and they are a ladder. Climb it only as far as
the truth requires.

| `overlay`   | Covers                          | Blocks                                                           | Use for                                                              |
| ----------- | ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `none`      | Nothing, it sits in flow        | Nothing                                                          | A row, a footer, a button, a late small value                        |
| `container` | Its nearest positioned ancestor | Marks that DOM parent `aria-busy` and its other children `inert` | One panel, one card, one chart, one table                            |
| `page`      | The viewport                    | The application as it stood when the spinner appeared            | A tenant switch, a sign-out, a destructive commit that must not race |

A container overlay covers the nearest **positioned** ancestor, so set
`position: relative` on the region you mean to cover, and keep the spinner a
sibling of that region's content. Wrap it in an extra `<div>` and that `<div>`
becomes the region, which contains nothing.

The blocking is the point. A scrim that only stops the mouse lets a keyboard
user tab into a form that looks unavailable and submit it. `inert` takes the
controls out of the tab order and out of hit testing together, and both
attributes are restored exactly as they were found.

Press Refresh, then try to reach the controls underneath, with the pointer and
then with Tab. The panel is a plain `position: relative` box and the spinner is
a sibling of its content, which is the whole setup:

<preview dir="col">
  <div class="lfx-stack">
    <NbButton size="sm" @click="runPanelRefresh">Refresh the panel (2.5 s)</NbButton>
    <div class="lfx-panel">
      <p class="lfx-panel-title">Revenue by region</p>
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton size="sm" variant="secondary">Export</NbButton>
        <NbButton size="sm" variant="secondary">Change range</NbButton>
      </NbGrid>
      <NbSpinner v-if="panelBusy" overlay="container" :delay="0" label="Refreshing revenue by region" show-label />
    </div>
    <p class="lfx-note">While the spinner is up the panel is <code>aria-busy</code>, its two buttons are <code>inert</code>, and Tab skips over them to whatever follows the panel. Nothing outside the panel is affected: the page is still readable, still scrollable, and the rest of the documentation is still usable. That is the argument against reaching for <code>overlay="page"</code>.</p>
  </div>
</preview>

`overlay="page"` is deliberately not demonstrated here, because it would do what
it says: cover this documentation page and make it inert until the demo let go.
That is precisely the reason it is the last rung of the ladder and not the
first.

::: danger Do not page-block for one slow widget
A full-viewport scrim says the entire application is unavailable. If one chart
is late, one chart gets the overlay. Over-blocking is the most common misuse of
a spinner and it is indistinguishable, to the user, from the application having
frozen.
:::

### Per surface

| Surface              | What loads correctly                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Table**            | `NbDataTable`'s `loading` with `skeletonRows`. Header and toolbar stay live. On refresh keep the rows and use `overlay="container"`.                                                        |
| **Panel or card**    | Skeletons shaped like the card's own rows, inside the panel, with the panel's header already drawn.                                                                                         |
| **Inspector**        | Disabled fields, not grey slabs. An inspector's labels are known before its values are, and a disabled field keeps its label. See [Building an inspector](/patterns/inspectors).            |
| **Chart**            | `NbSkeleton variant="block"` at the chart's exact height, or `overlay="container"` over the last rendered chart on refresh. Charts carry no `loading` prop; the height is yours to reserve. |
| **Route transition** | Draw the frame you already know (breadcrumb, title, sidebar) and load into it. Never a page scrim between two routes. See [The app frame](/patterns/app-frame).                             |
| **Dialog**           | The dialog's own busy lock, not a spinner dropped into the body. See [Rule 8](#rule-8-in-flight-controls-and-the-double-submit).                                                            |
| **Load more**        | A small inline spinner in the footer row, or the trigger button's `loading`. Nothing above it may move.                                                                                     |

---

## Rule 8: in-flight controls, and the double submit

While an action is in flight, the control that fired it must not fire again.
This is not a nicety: a doubled POST creates two records, and a doubled delete
races itself.

- **Buttons.** `loading` sets `disabled` on the underlying `<button>` and drops
  the `click` emit, so the second press cannot reach your handler. On a link
  button (`href` or `to`), where `disabled` does not exist, it sets
  `aria-disabled` and still drops the emit.
- **Confirmations.** [`NbConfirm`](/ui/components/confirm) already solves this,
  and it solves it in the composable rather than at the call site. While the
  work is pending, `busy` locks both buttons and the type-to-confirm gate, and
  Escape, the overlay click and the close button all stop dismissing, because an
  action that has been fired cannot be un-fired by closing the dialog. Drive it
  through `useConfirm()` and no call site can get this wrong. Full rules in
  [Dialogs and destructive confirmation](/patterns/dialogs).
- **Forms.** Lock the submit, not the fields. A field disabled mid-flight loses
  what the user was typing into it and, if it held focus, drops focus to the
  body. See [Building a form](/patterns/forms) and
  [Disabled and read-only](/patterns/disabled-and-read-only).
- **Cancel stays live.** The way out of a wait is never disabled by the wait,
  with the single exception above: after an irreversible action has actually
  fired, there is nothing left to cancel.

Disabling is not an explanation. If a control is unavailable because something
else is still running, the running thing must be visible on screen. A row of
greyed-out buttons with no indicator anywhere is a screen the user reads as
broken.

---

## Rule 9: accessibility is the start _and_ the finish

Sighted users get the completion for free: the content appears. A screen reader
user gets silence, because the live region that was doing the talking is removed
at the exact moment the content lands, and newly inserted content is not itself
an update anything is watching. **Completion is the half of the load that goes
missing everywhere.**

### Announce both ends

```vue
<template>
  <NbSpinner
    v-if="loading"
    label="Loading invoices"
    complete-label="Invoices loaded"
  />
</template>
```

`completeLabel` writes into a shared, permanently mounted live region owned by
the library, so the message survives the unmount that triggers it. `NbSkeleton`
takes the same pair. Two rules keep it from becoming noise: set it only where
the user is **waiting** rather than watching, and set it **once per region**. If
a region has both a skeleton and a spinner, exactly one of them carries it.

If the load ends by moving focus (a detail panel opening, a wizard advancing),
the focus move _is_ the announcement. Adding `completeLabel` on top says the
same thing twice.

### A failed load has not "loaded"

The indicator is unmounted by the same state change that decides whether the
load succeeded, and it cannot read that decision: Vue does not update props on
the render that removes a component. So the failure path speaks up, from the
place that knows:

```ts
import { suppressLoadingAnnouncement } from '@nubisco/ui'

try {
  rows.value = await api.load()
} catch (reason) {
  // The skeleton is about to be replaced by a banner. Nothing completed.
  suppressLoadingAnnouncement()
  error.value = reason
} finally {
  loading.value = false
}
```

Without it, a screen reader user hears `Invoices loaded` at the moment the
screen fills with an error they cannot see. `useInlineLoading().run()` does this
for you.

### Politeness, and where `aria-busy` goes

- **Polite for progress and success.** A load in flight must not interrupt what
  the user is reading. `NbSpinner` and `NbSkeleton` are `role="status"` with
  `aria-live="polite"`, and `NbInlineLoading` is polite in `active` and
  `finished`.
- **Assertive only for failure.** `NbInlineLoading` switches to
  `aria-live="assertive"` in `error`, and to `off` while `inactive`, so the node
  is not announced merely for existing.
- **`aria-busy` belongs on the content being built, not on the live region.** On
  a live region it means "hold every update until I say otherwise", and since an
  indicator is unmounted rather than flipped back to `busy="false"`, that promise
  is never kept and the label is never spoken. `NbSkeleton` puts it on the
  placeholder shapes, `NbDataTable` on the `<table>`, and a container overlay on
  the region it covers.
- **Name the noun.** `Loading invoices`, never `Loading`. The label is the only
  information a non-visual user gets about _what_ they are waiting for.

### Focus while a region is replaced

Do not move focus because a load finished. If focus is inside a region you are
about to replace, you have two acceptable outcomes: leave focus where it is
(possible when the region is refreshed in place, which is another argument for
`overlay="container"` over a rebuild), or move it deliberately to the region's
heading or container and let the user carry on from there. What is forbidden is
letting the focused element be removed with no successor, which drops focus to
`<body>` and silently teleports a keyboard user to the top of the document.
[Keyboard interaction](/accessibility/keyboard) has the general rules.

### Reduced motion means less motion, not less feedback

`prefers-reduced-motion` never removes the indicator. Every loading component in
the library keeps saying the same thing with a different animation, and each one
carries the rules twice, in a media query and in a class read from `matchMedia`,
so the behaviour survives both a first paint before script runs and a preference
changed with the page already open.

| Component       | Normal           | Reduced motion                            |
| --------------- | ---------------- | ----------------------------------------- |
| `NbSpinner`     | Rotating arc     | A full ring breathing in `stroke-opacity` |
| `NbSkeleton`    | Travelling sweep | The bar fading in place, no travel        |
| `NbProgressBar` | Sweeping stripe  | The track filled and pulsing              |

That last one is the instructive case. Simply cancelling the indeterminate
animation would leave a static eighth-width stub sitting at what reads as 12%
complete, which is a lie invented by a media query. Filling the track and pulsing
it says "busy, no measurement" with no movement at all. Under
`forced-colors: active` the same components repaint from the system palette
rather than disappearing into it. The general rules are in
[Motion](/principles/motion#reduced-motion).

`NbSpinner` and `NbSkeleton` each carry those rules twice: once in a media
query, and once in a class the component sets from a `matchMedia` listener, so
flipping the OS preference with the page already open takes effect without a
reload. The switch below sets that same class, which is why the two indicators
change without your system settings changing:

<preview dir="col">
  <div class="lfx-stack">
    <NbSwitch v-model="forceReduced" name="lfx-reduced" label="Simulate prefers-reduced-motion" />
    <div class="lfx-pair">
      <div class="lfx-half">
        <p class="lfx-label">NbSpinner</p>
        <NbSpinner :class="{ 'nb-spinner--reduced-motion': forceReduced }" size="lg" label="Loading invoices" show-label />
        <p class="lfx-note">Rotating arc, or a complete ring breathing in <code>stroke-opacity</code>. No rotation, no travel, still unmistakably alive. A frozen ring would read as broken, which is why the preference never removes the indicator.</p>
      </div>
      <div class="lfx-half">
        <p class="lfx-label">NbSkeleton</p>
        <NbSkeleton :class="{ 'nb-skeleton--reduced-motion': forceReduced }" :lines="3" type="body-md" />
        <p class="lfx-note">A highlight travelling across the bar, or the bar fading in place. Same information, no translation.</p>
      </div>
    </div>
  </div>
</preview>

`NbProgressBar`'s indeterminate fallback is the third row of the table above and
it is not switchable from this page: it lives in the media query alone, so the
only honest way to see it is to turn the preference on in your operating system
or force it in the browser's rendering panel. Do that with this page open and
the bar below fills its track and pulses, instead of freezing at an
eighth-width stub that reads as 12% complete:

<preview dir="col">
  <NbProgressBar label="Publishing release" helper="Preparing the transfer" status="active" />
</preview>

---

## Rule 10: partial, progressive and streaming loads

Nothing says a screen loads once. When the parts arrive separately, the indicator
is per part.

**Progressive.** Draw the structure you already know, then fill each region as
it resolves. The page title, the sidebar and the table frame are not waiting on
anything, so they must not be hidden behind a scrim while one query runs. Each
late region owns its own indicator, and the page never holds itself back for the
slowest of them.

**Refresh in place.** Content already on screen is never swapped back to
skeletons. Keep the stale rows, dim them with `overlay="container"`, and let the
new data replace them underneath. The user keeps their scroll position and their
place in the list.

**Append.** Loading another page of results is not a page load. The indicator
goes in the footer row (a small inline spinner, or one skeleton row shaped like
the rows above it) and everything already rendered stays exactly where it is.

**Streaming.** Text that arrives token by token is content, not a load, once the
first token lands: render it, do not skeleton it. Keep the region `aria-busy`
while it is still arriving and announce **once**, at the end, with a
`completeLabel` or an explicit `announceLoadingComplete()`. Never make the
streaming text itself a live region: a polite region rewritten forty times a
second either floods or drops everything.

**Background work the user walked away from.** When a job outlives the screen
that started it, the report belongs in a toast, and the handle lets one toast
become its own outcome:

```ts
const t = useToast()
const handle = t.info('Exporting 4,200 rows', { duration: 0, retain: true })
// …later
handle.update({ variant: 'success', message: 'Export ready' })
```

`duration: 0` keeps it up while the work runs, `retain: true` lets it survive a
route change (the news is true wherever the user ends up), and `update()` keeps
the toast's slot so the stack does not jump. Details in
[`NbToaster`](/ui/components/toaster). For a queue of such reports, that is
[`NbNotificationCenter`](/ui/components/notification-center), which has its own
`loading`, `error` and empty states and keeps stale rows on a failed refresh
rather than pretending the list is empty.

---

## Words

Loading copy is copy. Full rules in [Writing style](/content/writing-style) and
[Action labels](/content/action-labels); the loading-specific ones:

- **Present participle while running, past tense when done.** `Saving` then
  `Saved`. `Publishing` then `Published`.
- **Name the noun.** `Loading invoices`, not `Loading`, and not `Please wait`.
- **No ellipsis.** `Saving`, not `Saving…` and never `Saving...`. One product
  ships both spellings in two files. The animation already says it is ongoing.
- **An error label says what failed.** `Could not save changes`, not `Error`.
- **Never apologise and never chat.** `Hang tight!` is not information.

---

## Checklist: auditing a view

Work top to bottom. Each item is checkable without running the app.

**Find what is there**

```bash
# Hand-rolled indicators. Every hit outside src/components is a defect.
rg -n "Loading\.\.\.|Loading…|>Loading<" src
rg -n "class=\"[^\"]*(spinner|loader|skeleton|loading)" src
rg -n "@keyframes\s+\w*(spin|pulse|shimmer|skeleton)" src

# Loading and empty sharing one branch. This is the contacts bug.
rg -n "v-if=\"[a-zA-Z.]*\.length\"" -A 2 src

# Fabricated progress.
rg -n "setInterval" src | rg -i "progress|percent"
```

**Then confirm, per view**

- [ ] Every asynchronous read has a loading state, and it is a real component
      (`NbSkeleton`, `NbSpinner`, `NbInlineLoading`, `NbProgressBar`), not a
      string and not a local class.
- [ ] Operations that usually finish under 300 ms carry a `:delay`, not a
      hand-rolled timer, and blocking overlays carry `delay="0"`.
- [ ] Every skeleton matches what replaces it: same container, same gaps, the
      right `type` for text, an explicit `height` for blocks. Swap the states in
      the browser and nothing below moves.
- [ ] No skeleton replaces content that is already on screen. Refresh dims with
      `overlay="container"` instead.
- [ ] Loading, error and empty are three separate branches in precedence order,
      and the empty state is unreachable until the response has landed.
- [ ] Page-level failures render in `NbBanner variant="inline"`, not in
      `NbMessage` and never in `alert()`.
- [ ] Every action the user fires shows its outcome: `NbInlineLoading` with a
      `finishedLabel`, or a toast. No save confirms with silence.
- [ ] `useInlineLoading` drives those actions rather than a hand-written
      `try/catch/finally`.
- [ ] Every in-flight control is locked: `loading` on the button,
      `useConfirm()` for confirmations. A double click fires one request.
- [ ] No overlay blocks more than the work actually makes unusable, and no page
      overlay sits over a request without a timeout or a way out.
- [ ] Any bar with a `value` is measuring something real. No timers, no easing
      toward 90%.
- [ ] Exactly one indicator per region carries `label` and `completeLabel`, and
      the label names what is loading.
- [ ] Every `catch` around a load that sets `completeLabel` calls
      `suppressLoadingAnnouncement()`, or runs through `useInlineLoading`.
- [ ] Nothing steals focus when a load finishes, and nothing drops focus to
      `<body>` when a region is replaced.
- [ ] With `prefers-reduced-motion: reduce` forced on, every indicator is still
      visibly alive and no indeterminate bar sits frozen at a fake percentage.

## Related

- [Spinner](/ui/components/spinner), [Skeleton](/ui/components/skeleton),
  [Inline Loading](/ui/components/inline-loading),
  [Progress Bar](/ui/components/progress-bar),
  [Data Table](/ui/components/data-table)
- [Empty states](/patterns/empty-states) ·
  [Status indicators](/patterns/status-indicators) ·
  [Dialogs](/patterns/dialogs) · [Building a form](/patterns/forms) ·
  [Disabled and read-only](/patterns/disabled-and-read-only) ·
  [The app frame](/patterns/app-frame) ·
  [Building an inspector](/patterns/inspectors)
- [Motion](/principles/motion) · [Accessibility overview](/accessibility/overview)
  · [Keyboard interaction](/accessibility/keyboard) ·
  [Writing style](/content/writing-style)

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useInlineLoading } from '../../src/composables/useInlineLoading.composable'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* ── Rule 1: what `delay` is actually for ──────────────────────────────────
   One flag drives both spinners in each pair, so the only difference between
   the two halves is the number bound to `delay`. */
const fastLoading = ref(false)
const slowLoading = ref(false)

async function runFast() {
  fastLoading.value = true
  await wait(150)
  fastLoading.value = false
}

async function runSlow() {
  slowLoading.value = true
  await wait(1500)
  slowLoading.value = false
}

/* ── Rule 3: the layout shift ──────────────────────────────────────────────
   Both cards are driven by the same flag so the two swaps happen on the same
   frame and can be compared. */
const recordLoaded = ref(true)
let recordTimer = 0

function reloadRecord() {
  window.clearTimeout(recordTimer)
  recordLoaded.value = false
  recordTimer = window.setTimeout(() => {
    recordLoaded.value = true
  }, 1400)
}

/* ── Rule 3: NbDataTable's three states, as controls ───────────────────── */
const tableProps = [
  { label: 'Loading', name: 'loading', type: 'boolean', default: true },
  { label: 'Error', name: 'error', type: 'boolean', default: false },
  {
    label: 'Skeleton rows',
    name: 'skeletonRows',
    type: 'number',
    default: 5,
    min: 1,
    max: 8,
  },
  {
    label: 'Rows',
    name: 'rows',
    type: 'single',
    options: [
      { value: 'three', label: 'three rows' },
      { value: 'none', label: 'no rows' },
    ],
    default: 'three',
  },
]

const invoiceColumns = [
  { key: 'number', header: 'Invoice' },
  { key: 'client', header: 'Client' },
  { key: 'total', header: 'Total', align: 'right' },
]

const invoiceRows = [
  { id: 'i1', number: 'INV-2043', client: 'Northwind', total: '1,240.00' },
  { id: 'i2', number: 'INV-2044', client: 'Contoso', total: '860.00' },
  { id: 'i3', number: 'INV-2045', client: 'Fabrikam', total: '4,015.50' },
]

/* ── Rule 4: the four states, as controls ─────────────────────────────────
   Every name here is a real NbInlineLoading prop (src/components/InlineLoading.d.ts),
   so moving a control is the same edit a call site would make. */
const inlineProps = [
  {
    label: 'Status',
    name: 'status',
    type: 'single',
    options: [
      { value: 'inactive', label: 'inactive' },
      { value: 'active', label: 'active' },
      { value: 'finished', label: 'finished' },
      { value: 'error', label: 'error' },
    ],
    default: 'active',
  },
  { label: 'Label', name: 'label', type: 'string', default: 'Saving' },
  {
    label: 'Finished label',
    name: 'finishedLabel',
    type: 'string',
    default: 'Saved',
  },
  {
    label: 'Error label',
    name: 'errorLabel',
    type: 'string',
    default: 'Could not save changes',
  },
  { label: 'Reserve space', name: 'reserveSpace', type: 'boolean', default: true },
]

/* ── Rule 4: silence versus the state machine ───────────────────────────── */
const silentSaving = ref(false)

async function runSilent() {
  silentSaving.value = true
  await wait(1200)
  silentSaving.value = false
}

const save = useInlineLoading()

function runSave() {
  save.run(() => wait(1200))
}

function runSaveFailure() {
  save.run(async () => {
    await wait(1200)
    throw new Error('The server refused the request')
  })
}

/* ── Rule 5: a bar with something behind it ────────────────────────────────
   There is no upload on a documentation page, so the count is stepped by a
   timer. That is the one thing an application must never do, and the note
   beside the demo says so. */
const TOTAL_FILES = 64
const uploaded = ref(TOTAL_FILES)
let uploadTimer = 0

function runUpload() {
  window.clearInterval(uploadTimer)
  uploaded.value = 0
  uploadTimer = window.setInterval(() => {
    uploaded.value = Math.min(TOTAL_FILES, uploaded.value + 2)
    if (uploaded.value >= TOTAL_FILES) window.clearInterval(uploadTimer)
  }, 90)
}

/* ── Rule 5: the fabricated bar, next to the honest one ────────────────────
   `fakeValue` is the anti-pattern, written out so it can be watched: an easing
   curve toward 90 with nothing measuring anything. `honestValue` is undefined
   until the total is known, which is what makes the bar indeterminate. */
const fakeValue = ref(0)
const honestValue = ref<number | undefined>(undefined)
const honestHelper = ref('Preparing the transfer')
let fakeTimer = 0
let honestTimer = 0
let honestSizeTimer = 0

function runProgressPair() {
  window.clearInterval(fakeTimer)
  window.clearInterval(honestTimer)
  window.clearTimeout(honestSizeTimer)

  fakeValue.value = 0
  fakeTimer = window.setInterval(() => {
    fakeValue.value = Math.min(90, fakeValue.value + (90 - fakeValue.value) * 0.08 + 0.4)
  }, 100)

  honestValue.value = undefined
  honestHelper.value = 'Preparing the transfer'
  honestSizeTimer = window.setTimeout(() => {
    honestValue.value = 0
    honestTimer = window.setInterval(() => {
      const next = Math.min(TOTAL_FILES, (honestValue.value ?? 0) + 2)
      honestValue.value = next
      honestHelper.value = next + ' of 64 files'
      if (next >= TOTAL_FILES) window.clearInterval(honestTimer)
    }, 90)
  }, 1600)
}

/* ── Rule 6: two branches beside three ─────────────────────────────────────
   One request feeds both halves. The left one only ever reads rows.length. */
const contactsStatus = ref<'loading' | 'error' | 'ready'>('ready')
const contactRows = ref<Array<{ id: string; name: string }>>([
  { id: 'c1', name: 'Marta Oliveira' },
  { id: 'c2', name: 'Ana Ribeiro' },
  { id: 'c3', name: 'Tomás Lima' },
])
let contactsTimer = 0

function loadContacts(outcome: 'ok' | 'fail' | 'empty') {
  window.clearTimeout(contactsTimer)
  contactsStatus.value = 'loading'
  contactRows.value = []
  contactsTimer = window.setTimeout(() => {
    if (outcome === 'fail') {
      contactsStatus.value = 'error'
      return
    }
    contactsStatus.value = 'ready'
    contactRows.value =
      outcome === 'empty'
        ? []
        : [
            { id: 'c1', name: 'Marta Oliveira' },
            { id: 'c2', name: 'Ana Ribeiro' },
            { id: 'c3', name: 'Tomás Lima' },
          ]
  }, 1600)
}

/* ── Rule 7: a container overlay over a real region ──────────────────────── */
const panelBusy = ref(false)

async function runPanelRefresh() {
  panelBusy.value = true
  await wait(2500)
  panelBusy.value = false
}

/* ── Rule 9: reduced motion ────────────────────────────────────────────────
   The switch sets the same class the components set themselves from their
   matchMedia listener, so what renders is the real reduced-motion path and not
   an imitation of it. */
const forceReduced = ref(false)

onBeforeUnmount(() => {
  window.clearTimeout(recordTimer)
  window.clearTimeout(contactsTimer)
  window.clearTimeout(honestSizeTimer)
  window.clearInterval(uploadTimer)
  window.clearInterval(fakeTimer)
  window.clearInterval(honestTimer)
})
</script>

<style scoped>
/* The preview area stretches its single child, so anything showing more than
   one thing goes in a plain wrapper that keeps each part at its own height. */
.lfx-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
}

.lfx-answers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.lfx-answer {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-start;
  padding: calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

.lfx-answer > .nb-skeleton,
.lfx-answer > .nb-progress-bar {
  width: 100%;
}

/* The fifth answer is an absence, so the frame shows the space it does not
   fill rather than a component pretending to be nothing. */
.lfx-nothing {
  width: 100%;
  height: 24px;
  border: 1px dashed var(--nb-c-border);
  border-radius: var(--nb-radius-sm);
}

/* Wrong on the left, right on the right, one column when there is no room. */
.lfx-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.lfx-half {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-start;
  padding: calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

.lfx-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.lfx-half--right {
  border-color: var(--nb-c-success-surface);
}

.lfx-half > .nb-progress-bar,
.lfx-half > .nb-skeleton,
.lfx-half > .nb-banner {
  width: 100%;
}

.lfx-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lfx-half--wrong .lfx-label {
  color: var(--nb-c-danger);
}

.lfx-half--right .lfx-label {
  color: var(--nb-c-success);
}

.lfx-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* A reserved row for the spinner, so the delay demo is about the delay and
   not about the layout moving underneath it. */
.lfx-slot {
  display: flex;
  align-items: center;
  height: 24px;
}

/* ── The layout shift demo ─────────────────────────────────────────────────
   The card is a plain box: no height, no min-height, nothing propping it up.
   Whatever is inside it decides where the footer sits, which is the point. */
.lfx-shift {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
}

.lfx-card {
  width: 100%;
  padding: calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-surface);
}

.lfx-card-footer {
  margin-top: calc(var(--nb-base-unit) * 1.5);
  padding-top: calc(var(--nb-base-unit) * 1.5);
  border-top: 1px solid var(--nb-c-border);
}

/* Three rows carrying the same type set and the same gap NbSkeleton stacks its
   lines with, which is what makes `:lines="3" type="body-md"` exact here. */
.lfx-rows {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) / 2);
  width: 100%;
}

.lfx-rows p {
  margin: 0;
  font-size: var(--nb-type-body-md-size);
  line-height: var(--nb-type-body-md-line-height);
  font-family: var(--nb-type-body-md-family);
  letter-spacing: var(--nb-type-body-md-letter-spacing);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Enough room for the tallest of the four branches, so the wrong/right pair
   stays side by side while the states change. */
.lfx-contacts {
  width: 100%;
  min-height: 120px;
}

/* NbInlineLoading reserves its own width; this frame only puts a control next
   to it so the reservation has something to fail to push. */
.lfx-inline-frame {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 2);
}

/* overlay="container" covers the nearest POSITIONED ancestor and inerts its
   other children, so the panel itself is positioned and the spinner is a
   sibling of the content. An extra wrapper around the spinner would become the
   region, and it would contain nothing. */
.lfx-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
  padding: calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-surface);
}

.lfx-panel-title {
  margin: 0;
  font-size: var(--nb-type-heading-01-size);
  line-height: var(--nb-type-heading-01-line-height);
  font-weight: var(--nb-type-heading-01-weight);
}
</style>
