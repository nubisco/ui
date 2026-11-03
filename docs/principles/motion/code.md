---
layout: nubisco
title: Motion
intro: 'Motion is the only part of this system that costs the user time. Every animation has to buy back the time it spends, and most of them do not. This page is what movement is allowed to mean here, shown moving. Switch any demo to slow motion to see what the eye normally only feels.'
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## The tokens

The six steps and three curves are declared in `src/styles/variables/_animations.scss` and emitted on `:root` by `src/styles/_theme.scss`. Every component reads them, and nothing in the library writes a duration or a curve as a literal, with the one exception of loops.

```css
:root {
  --nb-motion-micro: 70ms;
  --nb-motion-quick: 110ms;
  --nb-motion-short: 150ms;
  --nb-motion-medium: 240ms;
  --nb-motion-long: 400ms;
  --nb-motion-loop: 1s;

  --nb-ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
  --nb-ease-enter: cubic-bezier(0, 0, 0.38, 0.9);
  --nb-ease-exit: cubic-bezier(0.2, 0, 1, 0.9);
}
```

A product retunes them on `:root` and every component follows. The slow-motion switch on the demos is exactly that: the stage sets the duration tokens four times larger on its own element, and the components inside, which read them from the nearest ancestor, slow down with it.

```scss
// A product that wants a calmer frame, everywhere
:root {
  --nb-motion-medium: 200ms;
}
```

The four older tokens, `--nb-animation-fast`, `-base`, `-slow` and `-xslow`, are still emitted with the values they always had, so nothing a product wrote against them breaks. They are deprecated and will go in the next major. New work reads `--nb-motion-*`.

## An enter and an exit are two rules

Never one rule for both directions. The entrance and the exit have their own step and their own curve, which is what makes the [side by side on Usage](/principles/motion/usage#an-exit-is-not-an-entrance-played-backwards) read so differently.

```scss
@use '@nubisco/ui/styles/logic/motion' as motion;

.my-dialog-enter-active {
  transition:
    opacity var(--nb-motion-medium) var(--nb-ease-enter),
    transform var(--nb-motion-medium) var(--nb-ease-enter);
}

.my-dialog-leave-active {
  transition:
    opacity var(--nb-motion-short) var(--nb-ease-exit),
    transform var(--nb-motion-short) var(--nb-ease-exit);
}

.my-dialog-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.my-dialog-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

// Travel goes, the fade stays
@include motion.reduced {
  .my-dialog-enter-from,
  .my-dialog-leave-to {
    transform: none;
  }
}
```

The `motion.reduced` mixin is the one way the preference is written, in the library and in a product. What it must keep and what it must drop is on the [Accessibility](/principles/motion/accessibility) tab.

## Choreography

Choreography is what happens when one user event moves more than one thing. The failure mode is not ugliness, it is ambiguity: two things moving independently look like two events, and the user starts looking for a second cause.

### Things enter from where they belong and leave back through it

`NbToaster` encodes direction as a custom property rather than a fixed translate, so one transition rule serves six placements and each one arrives from its own edge:

```scss
.nb-toaster-enter-from,
.nb-toaster-leave-to {
  opacity: 0;
  translate: var(--nb-toaster-shift);
}
```

### Reflow is part of the event

When something leaves a stack, the survivors close the gap. That closing is not a separate animation, it is the tail of the same one, and it gets the same step. Dismiss a card from the middle of each stack:

<MotionReflow />

It takes two pieces, and leaving either out gives you the stack on the left:

```scss
// The `-move` class is what animates the survivors.
.nb-toaster-enter-active,
.nb-toaster-leave-active,
.nb-toaster-move {
  transition:
    opacity var(--nb-motion-medium) ease,
    translate var(--nb-motion-medium) ease;
}

// Taken out of flow while leaving, so the toasts below slide up into the
// gap instead of snapping.
.nb-toaster-leave-active {
  position: absolute;
}
```

Without `position: absolute` on the leaving element, the gap closes instantly at the moment of removal and the survivors teleport while the departing toast is still fading. This is the single most common `<TransitionGroup>` bug, and the fix is two lines.

### Sequencing across a flow

Where a sequence genuinely exists, the library uses time, not animation, to separate the beats. `useConfirm()` holds a resolved dialog in its success state for `SUCCESS_MS` (900ms) before dismissing it, and waits `CONFIRM_LEAVE_MS` from `src/components/Confirm.env.ts`, which equals the short step, before presenting the next queued question. **Separate beats with a pause between finished animations, never with a longer animation.** A 900ms hold is legible. A 900ms fade is a slow interface.

## The catalogue

Every moving thing in the library, by the step and curve it uses. This is the reference to match when you build something that belongs to one of these families.

### The application frame

| Movement                                       | In                        | Out                  | Notes                                                                                                                                                                |
| ---------------------------------------------- | ------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail collapses or expands                      | width `medium` `standard` | same                 | Labels, badges, carets, group headers and the brand text fade over `quick` while the width moves. Icons do not move: compact and verbose rows share one centre line. |
| Inspector opens or closes                      | width `medium` `standard` | same                 | Stays beside the page when closed, so no exit curve. Under the detached frame its gutter moves with it.                                                              |
| Bottom panel between `default` and `collapsed` | basis `medium` `standard` | same                 | `full` is still a cut: the page above is removed rather than resized, and there is nothing to animate between.                                                       |
| Navigation drawer (collapsed widths)           | slide `medium` `enter`    | slide `short` `exit` | The scrim fades on the same timings.                                                                                                                                 |
| Inspector sheet (collapsed widths)             | slide `medium` `enter`    | slide `short` `exit` | Waits just past the right edge, so it arrives from the side it belongs to.                                                                                           |

The rail's order (labels first on the way down, rows at once on the way up) is timed in the script of `src/components/Shell.vue`, which also reads the reduced-motion preference on every collapse.

### Dialogs

`NbModal`, `NbConfirm`, `NbCommandPalette`. The scrim and the dialog share one timing in each direction, so the whole thing reads as one surface.

|     | Curve   | Step     | Shape                                               |
| --- | ------- | -------- | --------------------------------------------------- |
| In  | `enter` | `medium` | Scrim fades, content scales from 0.96 and rises 8px |
| Out | `exit`  | `short`  | Scrim fades, content scales to 0.98 and sinks 4px   |

### Popovers

`NbMenu`, `NbSubmenu`, `NbSelect`'s list, `NbUserMenu`, `NbNotificationCenter`, `NbInfoHint`, the compact rail's flyout, and the `v-nb-tooltip` directive. One shape for all of them:

|     | Curve   | Step    | Shape                                                                                  |
| --- | ------- | ------- | -------------------------------------------------------------------------------------- |
| In  | `enter` | `quick` | Fade, plus a 4px travel from the trigger: down from a button, sideways from a rail row |
| Out | `exit`  | `micro` | Fade only                                                                              |

A popover that slides back out is a popover the eye follows away from the thing the person is about to do next, so the exit is a fade. `NbNotificationCenter` flips the direction of its rise when it opens upward or beside its bell; every popover travels toward the thing that opened it.

### Controls

| Control                                    | What moves                                                            | Step     | Curve                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | -------- | ------------------------------------------- |
| Every button, row and field                | Background, colour, border on hover                                   | `short`  | keyword `ease`, a tint needs no curve token |
| `NbSwitch`                                 | Knob travel                                                           | `quick`  | `standard`                                  |
| `NbSwitch`                                 | Track tint                                                            | `micro`  | `standard`                                  |
| `NbCheckbox`, `NbRadio`                    | Fill and border                                                       | `quick`  | `standard`                                  |
| `NbAccordionItem`                          | Section height, as grid tracks 0fr to 1fr                             | `medium` | `standard`                                  |
| `NbAccordionItem`, `NbTreeNode`, rail rows | Chevron rotation                                                      | `quick`  | `standard`                                  |
| `NbTabs`                                   | Colour of the active tab                                              | `short`  | keyword                                     |
| `NbTabs`                                   | The active mark, underline or filled block, sliding to the chosen tab | `medium` | `standard`                                  |

A tree's children appear instantly when a node opens. They are data, and a list that animates is a list you cannot read until it finishes.

### Transient surfaces

`NbToaster`, `NbToast`. A toast enters from the edge it is anchored to over `medium`, leaves back through it, and the stack closes the gap on the same step. The part that is motion design rather than CSS is the lifetime, in `NB_TOAST_DURATIONS`:

| Variant   | Lifetime | Reason                                                                   |
| --------- | -------- | ------------------------------------------------------------------------ |
| `success` | 4000ms   | Confirmation. The user already knows; this is a receipt.                 |
| `info`    | 6000ms   | Has to be read.                                                          |
| `warning` | 8000ms   | Has to be read and thought about.                                        |
| `error`   | `0`      | Persistent. An error that removes itself is an error the user never saw. |

A toast carrying a `cta` never auto-dismisses unless an explicit `duration` says so. The countdown bar under the toast is `linear`, because it is a clock: an eased clock lies about how much time is left.

### Loops

`NbSpinner` rotates a quarter-turn arc at `900ms linear infinite`. `NbSkeleton` sweeps a highlight at `1600ms`, driven by `background-position` so it costs nothing on a page full of them. `NbProgressBar` indeterminate sweeps at `1400ms`. The three are deliberately different so two on one screen do not beat against each other. Choosing between indicators is [Status indicators](/patterns/status-indicators); this page only covers how they move.

## Auditing your own app

Two greps. The first finds durations written as literals rather than steps:

```bash
grep -rhoE "(transition|animation)[a-z-]*: *[^;]*" src | grep -E "[0-9]+m?s" | grep -v "nb-motion"
```

The second finds travel with no accommodation. Any file in the first list that is not in the second is a candidate:

```bash
grep -rlE "transform:|translate:|scale\(" src --include="*.vue" | sort > /tmp/moves
grep -rlE "prefers-reduced-motion|motion.reduced" src --include="*.vue" | sort > /tmp/guards
comm -23 /tmp/moves /tmp/guards
```

Every file the second command prints is one you must open and check: either the transform is static, in which case it is fine, or it is animated, in which case it is a defect.

## See also

- [Design Tokens](/design-tokens) for the token grammar and the override tiers.
- [Shell](/components/shell/code) for the frame whose rail, inspector, drawer and bottom panel are catalogued above.
- [Status indicators](/patterns/status-indicators) for choosing between `NbSpinner`, `NbInlineLoading`, `NbSkeleton` and `NbProgressBar`.
- [Dialogs](/patterns/dialogs) and [Inspectors](/patterns/inspectors) for the surfaces whose enters and exits are catalogued here.
- [Toaster](/components/toaster/usage) and [useToast](/composables/use-toast) for toast lifetimes, placement and the shift property.
- [Tooltip](/directives/tooltip) for `animationTime` and the exit duration that has to match the keyframe.

<!--@include: ./_shared.md-->
