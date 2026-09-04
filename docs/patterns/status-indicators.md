---
title: Status indicators
description: Which component expresses which kind of status, the fixed vocabulary of states every Nubisco product shares, and where a status is allowed to appear.
---

# Status indicators

A status answers one question: **what is true about this thing right now?** The
component you use is decided by _what the thing is_, not by how the status
feels. That is the whole rule, and it is the rule the fleet does not have.

Twelve applications built on this library were read end to end. Status came out
as a vocabulary problem rather than a component problem:

- **`NbBadge`'s variants are literal colour names.** `grey`, `blue`, `orange`,
  `green`, `red`, `purple`, `primary`. Line 1 of `src/components/Badge.d.ts` is
  a `FIXME` saying so. A colour name cannot be wrong, which is why nobody ever
  thought they were choosing wrong.
- **One application mapped "medium confidence" to `orange` because the library
  has no yellow.** Documented in that application's own source comment. In the
  same product, `orange` also meant "paused". Two unrelated meanings, one
  colour, no legend.
- **`NbBadge` renders a bare `<span>`.** No `role`, no `aria-*`, no live region.
  A badge in `dot` mode with no text content is, to a screen reader, an empty
  element. It says nothing at all.
- **`NbFlag` is not a status component.** It resolves `virtual:flags` and
  renders a country flag. Anything named "flag" in your status code is either a
  misuse of `NbFlag` or a hand-rolled component that should be a badge.

This page fixes all of that. Section 2 is the fleet's shared vocabulary. Until
the `FIXME` on `Badge.d.ts` is resolved, **the mapping table in section 2 is the
intent layer.** Never pick a badge variant by looking at a colour.

---

## Rule 1: the carrier is chosen by the scope of the status

Five components can carry a status. They are not interchangeable and they do not
overlap. Find the scope of what you are describing, and the row is the answer.

| Scope of the status                            | Carrier                                         | Why it is that one                                                              |
| ---------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| **One field**, valid or not                    | `NbMessage`                                     | It is positioned by the control and announced with it (`role="status"`)         |
| **One object**: a row, a card, a page's record | `NbBadge`                                       | It is a property of the object and travels with it wherever the object is drawn |
| **A page or a region**                         | `NbBanner`                                      | It is the only status component with a title, a body, an action and a dismiss   |
| **An action the user just took**               | `useToast()`                                    | The user may already have navigated away from the thing that changed            |
| **An operation still running**                 | `NbInlineLoading`, `NbSpinner`, `NbProgressBar` | These are the only ones that announce a _change_ rather than a value            |

Two consequences worth stating outright, because both have been shipped:

::: danger Never these

- **`NbFlag` is not a status indicator.** It takes a `name` and renders a
  country flag from the `virtual:flags` module. There is no status meaning in it
  at all. See [Flag](/ui/components/flag).
- **A `NbMessage` is not a page status.** `NbMessage` is 12px text with a 14px
  icon designed to sit under a field. It has no title, no action slot and no
  dismiss. A page-level condition rendered as a stray `NbMessage` reads as an
  orphaned validation error. Use `NbBanner`.
- **A `NbBanner` is not an object status.** A banner is region-wide. Putting one
  in a table row or a card to say "Active" is a 44px-tall answer to a one-word
  question.
  :::

The interesting boundary is **badge versus banner** on a detail page. Both are
about the object, and both are on screen at once. The split:

> The **badge states the value**. The **banner explains a value the user cannot
> act on from the badge alone.**

A project page shows `<NbBadge variant="orange" dot>Suspended</NbBadge>` beside
the title. _Why_ it is suspended, and what to do about it, is a
`<NbBanner status="warning" variant="callout">`. The badge never grows a
sentence, and the banner never appears just to repeat the badge.

---

## Rule 2: nine states, and every product state maps to one of them

This is the fixed vocabulary. It is nine states because nine covers every
lifecycle we found across twelve products, and ten would have started to
duplicate.

| State         | Means                                                       | `variant` | `dot` | Icon (when used) |
| ------------- | ----------------------------------------------------------- | --------- | ----- | ---------------- |
| **Draft**     | Exists, not yet submitted to anything                       | `grey`    | no    | `pencil-simple`  |
| **Pending**   | Handed off, waiting on a queue or a person, nothing running | `grey`    | yes   | `clock`          |
| **Running**   | Work is happening right now                                 | `blue`    | yes   | `circle-notch`   |
| **Active**    | The good steady state: live, published, healthy, succeeded  | `green`   | yes   | `check-circle`   |
| **Attention** | Working, but degraded or expiring: still yours to fix       | `orange`  | yes   | `warning`        |
| **Paused**    | Deliberately stopped by someone, resumable                  | `orange`  | no    | `pause`          |
| **Failed**    | Ended badly and will not recover on its own                 | `red`     | yes   | `x-circle`       |
| **Inactive**  | Terminal and unremarkable: archived, cancelled, revoked     | `grey`    | no    | `prohibit`       |
| **Unknown**   | We asked and did not get an answer                          | `grey`    | no    | `circle-dashed`  |

Every icon name above exists in the Phosphor set `NbIcon` resolves. Every
`variant` above is a real `NbBadge` variant.

### Mapping your product's words

Your domain words stay in the label. Only the _state_ is fixed.

| Your label                                                  | Maps to   |
| ----------------------------------------------------------- | --------- |
| Draft, Unsaved, New, Not configured                         | Draft     |
| Queued, Scheduled, Awaiting approval, In review, Invited    | Pending   |
| Building, Deploying, Importing, Syncing, Processing         | Running   |
| Live, Published, Approved, Connected, Healthy, Paid         | Active    |
| Expiring soon, Quota exceeded, Reconnect required, Degraded | Attention |
| Suspended, On hold, Disabled by owner, Snoozed              | Paused    |
| Error, Rejected, Cancelled by system, Payment failed        | Failed    |
| Archived, Revoked, Expired, Deleted, Closed                 | Inactive  |
| Unreachable, Stale, Never checked                           | Unknown   |

```vue
<!-- The label is the product's word. The variant comes from the table. -->
<NbBadge variant="blue" dot>Deploying</NbBadge>
<NbBadge variant="green" dot>Published</NbBadge>
<NbBadge variant="grey">Archived</NbBadge>
```

### The two variants that are never a status

`purple` and `primary` both resolve to `--nb-c-primary`, the brand colour. Brand
is not a state. A `primary` badge is a solid brand chip with
`--nb-c-primary-a11y` ink and it out-shouts every real status on the screen.

**`variant="purple"` and `variant="primary"` are reserved for non-status badges**
(a plan name, a count, a "New" marker on a nav item). If you catch a lifecycle
word inside one, it is a bug.

### Pending is grey, not orange

The single most common mistake in the audit. `orange` resolves to
`--nb-c-warning`. A queued job is not a warning, nobody needs to do anything,
and colouring it orange means the one row that genuinely needs attention no
longer stands out. Waiting is grey. Waiting-too-long is `Attention`.

---

## Rule 3: an ordinal measurement is not a status

The application that mapped medium confidence to `orange` was not choosing the
wrong colour. It was using the wrong component.

Confidence, risk, severity, health score, match quality and priority are
**ordinal measurements**. They differ from lifecycle states in three ways that
matter here: they have an inherent order, they usually come from a number, and
their middle value is not an alarm.

::: warning The ruling
Do not put an ordinal scale in a lifecycle badge. `NbBadge` has three usable
"levels" (`green`, `orange`, `red`) and the moment you borrow them, `orange`
means both "medium confidence" and "paused" in the same product. There is no
yellow, and adding one would not fix this.
:::

Use, in order of preference:

1. **The number, as text.** `82% confident` is unambiguous, sorts correctly and
   needs no legend. In a `NbDataTable`, right-align it (`align: 'right'`).
2. **`NbProgressBar`** when the number is a proportion the reader should compare
   at a glance. It takes `value`, `max` and a `label`.
3. **`NbDefinitionList`** for a measurement on a detail page. It is a fact about
   the object, and facts belong in the facts list, not beside the title.
4. **A badge, only with a visible legend in the same view**, and only if the
   scale has three steps or fewer, and only if no lifecycle badge appears in the
   same view. This is the last resort and it is nearly always avoidable.

For colour-encoded quantities in charts, the palette rules live in
[Chart colour](/ui/components/charts/color). Status colour and data colour are
different systems and must not be mixed in one view.

---

## Rule 4: colour is never the status, and a dot is never the status

`NbBadge` renders this and nothing else:

```html
<span class="nb-badge nb-badge--green nb-badge--md">
  <span class="nb-badge__dot"></span>
  Active
</span>
```

No `role`, no `aria-label`, no `title`. **The accessible name of a badge is its
text content.** Therefore:

- **A badge always has text.** `<NbBadge variant="green" dot />` with an empty
  slot is an empty `<span>`. It is invisible to assistive technology and
  meaningless to anyone who cannot separate green from orange (roughly 1 in 12
  men).
- **`dot` is decoration.** `.nb-badge__dot` is a 6px circle filled with
  `currentColor`. It reinforces the colour, it does not add information. Using
  `dot` on some states and not others (as in the table in Rule 2) gives the set
  a second, non-colour axis, which is a bonus, not the mechanism.
- **Colour may only ever be redundant.** Remove all colour from your view and
  every status must still be readable. If it is not, the view fails.

### Icon plus text, or text alone?

| Situation                                                      | Do this                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| Badge anywhere                                                 | Text, optionally with `dot`. No icon inside the badge.   |
| Dense table where a status column would cost too much width    | Widen the column or truncate a different one             |
| A status that must be scanned down a long column               | Badge with `dot`, same order every row                   |
| Status of a _running_ operation                                | `NbInlineLoading` (it owns its own icon and live region) |
| A single fact in a `NbDefinitionList` where a chip is too loud | `NbIcon` plus text, with the icon `aria-hidden`          |

If you do pair an icon with text outside a badge, the icon is decorative and the
text is the name:

```vue
<span class="status">
  <NbIcon name="x-circle" :size="16" aria-hidden="true" />
  Failed
</span>
```

**Never an icon on its own.** `NbIcon` renders an `<i>` with the SVG marked
`aria-hidden`. Its `title` prop puts a `title` attribute on the wrapper, which is
a tooltip, not a reliable accessible name, and it is unreachable by touch. An
icon-only status is a status only you can read.

---

## Rule 5: placement, by surface

Same state, three surfaces, three renderings. Getting this wrong is what makes
two views of the same object look like two different products.

### Page header

- **Exactly one badge**, immediately after the page title, vertically centred
  with it, size `md`.
- It carries **the object's lifecycle state and nothing else**. Not the plan,
  not the environment, not the region, not the owner. Those are facts, and facts
  go in a `NbDefinitionList` or the page's metadata line.
- If the header needs two badges, one of them is not a status. Move it.
- If the state needs explaining, add a `NbBanner` with
  `variant="callout"` under the header. A callout cannot be dismissed, which is
  correct here: dismissing it would not make the state untrue.

```vue
<header class="page-header">
  <h1>Checkout redesign</h1>
  <NbBadge variant="orange" dot>Suspended</NbBadge>
</header>

<NbBanner status="warning" variant="callout" title="Suspended on 12 March">
  Billing failed three times. Update the card to resume deployments.
  <template #action>
    <NbButton size="sm" variant="secondary">Update billing</NbButton>
  </template>
</NbBanner>
```

### Table cell

- **One status column per table.** Not two, and not a status baked into the name
  column as a coloured prefix.
- The column is **always in the same position across the product**. Pick last
  before the actions column and never move it.
- `align: 'left'`. A badge is a shape, and centred shapes in a column make a
  ragged edge that is harder to scan than the text was.
- Render it through the `#cell-<key>` slot, not through a `render` function that
  builds a coloured `<span>` by hand.
- Badge `size="sm"` when the table's `size` is `sm`, `md` otherwise.
  (`NbDataTable` takes `sm | md | lg`; `NbBadge` takes only `sm | md`.)
- If the column is `sortable`, sort by the **canonical order in Rule 2**
  (Draft, Pending, Running, Active, Attention, Paused, Failed, Inactive,
  Unknown), not alphabetically by label. Alphabetical status sorting is noise.

```vue
<NbDataTable :columns="columns" :rows="rows" row-key="id" size="sm">
  <template #cell-status="{ row }">
    <NbBadge :variant="STATUS[row.status].variant" :dot="STATUS[row.status].dot" size="sm">
      {{ STATUS[row.status].label }}
    </NbBadge>
  </template>
</NbDataTable>
```

::: danger Never colour the row
Tinting a whole `<tr>` red for failed rows is banned. It is colour-only
information, it fights row hover and selection, and at three failures in twenty
rows it makes the table unreadable. The badge is the signal.
:::

### List row and card

- The badge trails the primary text **on the same line**, after the title, not
  under it. Under the title it reads as a subtitle, which it is not.
- On a card, the badge goes with the title, not in the footer with the actions.
- **A status must never be the only difference between two rows.** If two
  entries in a list share a name and differ only by badge, add the
  distinguishing fact (the date, the version, the environment) to the row.

### Field

`NbMessage` only. It already carries `role="status"`, `aria-live="polite"` and
`aria-live="assertive"` for `variant="error"`. Full rules in
[Building a form](/patterns/forms).

---

## Rule 6: pending and transitional states

A badge states the **last known value**. A spinner states that **we are watching
it change**. Confusing the two is why one product's badge said "Deploying" for
eleven minutes after the deploy had finished.

### The four cases

**1. The user triggered it in this view and it resolves in seconds.**
Use `NbInlineLoading` at the point of action. It has the whole arc built in:
`status` moves `inactive` to `active` to `finished` or `error`, with `label`,
`finishedLabel` and `errorLabel`. Keep `dwell` at 1000 or more, or the
confirmation is gone before it is read. Leave `reserveSpace` on so the controls
beside it do not jump when the text changes.

```vue
<NbInlineLoading
  :status="saveState"
  label="Saving"
  finished-label="Saved"
  error-label="Could not save, changes kept locally"
/>
```

**2. It is server-side and long, and there is a real percentage.**
Keep the `Running` badge (`blue`, `dot`) and add `NbProgressBar` with `value`
and `max`. Set `status="error"` on the bar if it fails, so the bar and the badge
agree.

**3. It is server-side and long, with no meaningful percentage.**
Keep the `Running` badge. Add an indeterminate `NbProgressBar` (omit `value`) if
the operation owns the page. Do not add a `NbSpinner` next to a badge that
already says Running: that is the same fact twice.

**4. It changes on its own and the user is not waiting for it.**
Just the badge. No spinner, no animation.

### Rules that apply to all four

- **Never animate `NbBadge`.** It has no animation and must not acquire one from
  a consumer stylesheet. Motion means "watch this", and a status that is merely
  true is not asking to be watched. `NbSpinner` and `NbProgressBar` already
  handle `prefers-reduced-motion` internally; a hand-rolled pulsing badge does
  not.
- **Never flip a badge optimistically.** Showing `Active` the instant the user
  clicks Publish, before the server has agreed, is a lie the user will act on.
  Show `Running` while it is running.
- **A poll that fails does not preserve the old value.** If refresh stops
  working, the last known state is no longer a status, it is a memory. Move to
  `Unknown` (`grey`, `circle-dashed`) or keep the value and add a
  `NbBanner status="warning"` saying when it was last confirmed. Silently stale
  is the worst of the three.
- **A badge changing under a poll announces nothing.** `NbBadge` has no live
  region, by design: a table of forty badges wired to `aria-live` would be
  unusable. If a background change matters enough to interrupt, announce it once
  with `useToast()`, and let the badge be the durable record.

---

## Accessibility

What the library does, and what is yours.

| Component         | Provided                                                                                                                        | Yours                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `NbBadge`         | Nothing. A `<span>` whose accessible name is its text                                                                           | Give it text. Never `dot` alone                                    |
| `NbMessage`       | `role="status"`, `aria-live` polite, assertive for `error`                                                                      | Associate it with the field (the field components already do)      |
| `NbBanner`        | `role="alert"` for `status="error"`, `role="status"` otherwise, `aria-live` to match, icon `aria-hidden`, labelled close button | Write a `title` that is short and declarative                      |
| `NbInlineLoading` | A live region that persists through `inactive`, so updates land in a region assistive tech is already watching                  | Labels that say what is happening, not "Loading"                   |
| `NbSpinner`       | `role`, live region, `label`, `prefers-reduced-motion`                                                                          | Set `decorative` when an ancestor already announces the same thing |
| `NbProgressBar`   | Progress semantics and a `label`                                                                                                | A `label` naming the operation                                     |

Additional requirements on you:

- **Colour is never load-bearing.** Test by rendering the view in greyscale.
- **Do not stack live regions.** A toast, a banner and an inline loading state
  all announcing one save is three interruptions for one event. Pick one.
- **Both themes.** Badge grounds are
  `color-mix(in srgb, <semantic> 12%, var(--nb-c-surface))` with the semantic
  colour as ink, and every semantic token is redefined under `.dark`. That holds
  as long as you use the variants. A hardcoded hex does not, and it is how one
  product ended up with a light-mode chip on a dark surface.

---

## Tokens a status is allowed to touch

Status colour comes from the semantic layer only. These are the tokens with a
status meaning, all defined in `src/styles/_theme.scss` for both themes:

| Token                                                                       | Meaning                               |
| --------------------------------------------------------------------------- | ------------------------------------- |
| `--nb-c-info`, `--nb-c-info-surface`, `--nb-c-info-surface-border`          | Running, informational                |
| `--nb-c-success`, `--nb-c-success-surface`, `--nb-c-success-surface-border` | Active, succeeded                     |
| `--nb-c-warning`, `--nb-c-warning-surface`, `--nb-c-warning-surface-border` | Attention, paused                     |
| `--nb-c-danger`, `--nb-c-danger-surface`, `--nb-c-danger-surface-border`    | Failed                                |
| `--nb-c-neutral-surface`, `--nb-c-neutral-surface-border`                   | Draft, pending, inactive, unknown     |
| `--nb-c-text-muted`, `--nb-c-text-subtle`                                   | Status text with no colour of its own |

The `-a11y` companions (`--nb-c-success-a11y` and friends) are the readable ink
for a **solid** fill of that colour. You need them only if you are building a
solid chip, which is not something a status should be.

Never: a brand ramp (`--nb-c-grape-hyacinth-500`, `--nb-c-phoenix-flames-400`),
a chart colour, or a hex. A white-label product renders the brand ramps in the
client's colours, and a status that moves with the brand is not a status.

---

## Things we have shipped and should not ship again

- A dot-only badge column, so the table's status was invisible to a screen
  reader and unreadable to anyone with a colour vision deficiency.
- `orange` meaning "medium confidence" in one view and "paused" in another, in
  one product, with no legend in either.
- A page header with four badges, of which one was a status, one was a plan
  name, one was an environment and one was a region.
- A whole table row tinted red on failure, which stopped selection and hover
  from being visible.
- A "Deploying" badge that never cleared because the poll had died, showing a
  state that had been false for eleven minutes.
- A hand-rolled `<span class="status status--ok">` set in one product, with
  hardcoded hex, invisible in dark mode.

---

## Audit checklist

Point this at any view. Every line is answerable by reading the template.

**Carrier**

- [ ] Every status uses `NbBadge`, `NbMessage`, `NbBanner`, `useToast`,
      `NbInlineLoading`, `NbSpinner` or `NbProgressBar`. No hand-rolled
      `<span class="status">`.
- [ ] No `NbFlag` is used for anything except a country.
- [ ] No `NbMessage` appears outside a field.
- [ ] No `NbBanner` appears inside a table row or a card.

**Vocabulary**

- [ ] Every badge state maps to one of the nine states in Rule 2, with that
      state's `variant`.
- [ ] No queued or waiting state is `orange`.
- [ ] No `variant="purple"` or `variant="primary"` carries a lifecycle word.
- [ ] No ordinal measurement (confidence, risk, severity, priority) is rendered
      as a lifecycle badge.
- [ ] The same product word maps to the same variant in every view.

**Presentation**

- [ ] Every badge has text content. No badge is `dot`-only.
- [ ] No status icon appears without an adjacent text label.
- [ ] The view is still readable in greyscale.
- [ ] Exactly one badge sits in the page header, and it is the lifecycle state.
- [ ] The table has one status column, in the product's usual position,
      left-aligned, rendered through `#cell-<key>`.
- [ ] No row or cell background is tinted to carry a status.

**Transitions**

- [ ] No badge is animated.
- [ ] No badge is flipped before the server confirms.
- [ ] A user-initiated save shows `NbInlineLoading` (or an equivalent), with a
      `dwell` of at least 1000.
- [ ] A failed refresh moves to `Unknown` or adds a banner. It does not keep
      showing the last value as current.
- [ ] One event produces one announcement, not a toast plus a banner plus an
      inline state.

**Related:** [Building a form](/patterns/forms) ·
[Disabled and read-only](/patterns/disabled-and-read-only) ·
[Badge](/ui/components/badge) · [Banner](/ui/components/banner) ·
[Message](/ui/components/message) · [Inline loading](/ui/components/inline-loading)
