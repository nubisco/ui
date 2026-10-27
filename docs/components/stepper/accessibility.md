---
layout: nubisco
title: Stepper
intro: '`NbStepper` shows where someone is in a linear, multi-step task: which steps are behind them, which one they are on, and how many are left. It is a read-out of a flow, not the flow. The wizard around it still owns the current index, the validation, and the Back and Next buttons.'
source: src/components/Stepper.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

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
  [`NbSkeleton`](/components/skeleton/usage) or
  [`NbInlineLoading`](/components/inline-loading/usage) inside the step panel. The
  user gets the shape of the flow at once, which is the more useful half.
- **Waiting on the step list itself** (rare, and worth avoiding). Render nothing
  where the stepper will go and reserve its height. A four-step placeholder that
  resolves to six steps is worse than a gap, because the user has already
  counted.

<!--@include: ./_shared.md-->
