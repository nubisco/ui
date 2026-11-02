---
layout: nubisco
title: Motion
description: What movement is allowed to mean in this library, the six duration steps and three curves it moves on, what each component does with them, how several moving things are coordinated, and the reduced-motion rule.
---

Motion is the only part of this system that costs the user time. A colour is read instantly, a spacing step is read instantly, and a 300ms slide is 300ms the user spends waiting to find out what happened. That is the whole economics of this page: every animation has to buy back the time it spends, and most of them do not.

So motion earns its place by answering a question the still frame cannot answer. Where did this come from. What did my click do. Is anything still happening. Three questions, three jobs, and nothing else on the list.

The library moves on one scale and one family of curves, declared once and read everywhere. A product retunes them on `:root` the way it retunes a colour, and the reduced-motion preference is honoured in every component without the product doing anything.

## The words this page uses

| Term                   | Means                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transition**         | Movement between two states of something that stays on screen. A hover tint, a chevron rotating, a rail changing width. Written as `transition`.                |
| **Enter / exit**       | Movement of something arriving in or leaving the document. A menu opening, a toast dismissing. Written as a Vue `<Transition>` with `-enter-*` / `-leave-*`.    |
| **Reflow**             | Movement of things that did not change, caused by something else that did. The toast stack closing a gap. Written with `<TransitionGroup>` and a `-move` class. |
| **Loop**               | Continuous, non-terminating animation. A spinner, a skeleton sweep. It communicates "still happening" and has no end state.                                     |
| **Travel**             | Change in position or size: `translate`, `transform`, `scale`, a growing box. This is the part that triggers vestibular symptoms.                               |
| **Tint**               | Change in colour or opacity only. No travel. This is the part that is safe under reduced motion.                                                                |
| **Vestibular trigger** | Motion that the inner ear reads as self-movement: large travel, parallax, spin, zoom. The actual thing `prefers-reduced-motion` is asking you to remove.        |

The tint / travel split is the most load-bearing distinction on this page. Almost every reduced-motion decision in this library reduces to "keep the tint, drop the travel".

## The three jobs

Motion in a Nubisco application is doing one of exactly three things. If you cannot name which, you have decoration.

| Job            | The question it answers                                 | Shipped example                                                                                                                       |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Continuity** | Where did this come from, and where does it go back to? | `NbMenu` rises 4px from the trigger it belongs to. `NbToaster` slides in from the edge it is anchored to, and leaves back through it. |
| **Causality**  | Did my input do anything?                               | Every control tints on hover and press. The rail's labels fade as it narrows, so the collapse is seen to be the thing the click did.  |
| **Feedback**   | Is anything still happening?                            | `NbSpinner` rotates. `NbSkeleton` sweeps. `NbProgressBar` fills. `NbToast` runs a countdown bar showing how long it will stay.        |

### What motion is not for

It is not for delight, polish, brand expression or making a screen feel alive. Those are the reasons motion gets added to products that then feel slow, and the reason the fourth principle below exists. The reference is Carbon's: motion should be **purposeful**, **responsive**, **meticulous** and **unobtrusive**, and if the average user notices it often, there is too much of it.

## Duration

### The scale

Six steps, declared in `src/styles/variables/_animations.scss` and emitted on `:root` by `src/styles/_theme.scss`. The scale is non-linear on purpose: a step that is perceptibly longer, not arithmetically longer.

| Token                | Value | What moves at this step                                                                                              |
| -------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `--nb-motion-micro`  | 70ms  | A tint on a control under the pointer. A switch track. A popover fading out.                                         |
| `--nb-motion-quick`  | 110ms | A chevron turning. A checkbox tick. A tooltip or popover arriving. A switch knob. Rail labels fading.                |
| `--nb-motion-short`  | 150ms | The de facto control-state step. A dialog or a drawer leaving.                                                       |
| `--nb-motion-medium` | 240ms | The rail changing width. The inspector opening. An accordion section. A dialog arriving. A toast entering.           |
| `--nb-motion-long`   | 400ms | The ceiling for anything the user is waiting on. Reserved for the largest surfaces; nothing in the library needs it. |
| `--nb-motion-loop`   | 1s    | Loops only. Never a transition: a second of waiting to see a menu is a bug, a one-second spinner cycle is a loop.    |

The four older tokens, `--nb-animation-fast`, `-base`, `-slow` and `-xslow`, are still emitted with the values they always had, so nothing a product wrote against them breaks. They are deprecated and will go in the next major. New work reads `--nb-motion-*`.

### Choosing a step

Work down this table. The left column is what is moving, not how far, because the size of the thing is what sets the expectation.

| What is moving                                                     | Step                             | Why                                                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A tint on a control the pointer is over or pressing                | `micro`                          | Below 70ms it reads as an instant repaint and the causality is lost. Above 150ms the control feels laggy under a pointer.                                   |
| A small element appearing next to its trigger (menu, popover, tip) | `quick`                          | It travels a handful of pixels and the user is waiting to read it.                                                                                          |
| A panel changing size while it stays on screen                     | `medium`                         | Large enough to be tracked by the eye, nothing to wait for behind it.                                                                                       |
| A dialog or overlay taking the whole screen                        | `medium`                         | It is large, but it is also blocking. Large argues up, blocking argues down, and they meet here.                                                            |
| Anything leaving                                                   | One step below its entrance      | An exit exists to get out of the way. See [easing](#easing).                                                                                                |
| A reflow: things closing a gap left by something that went away    | Same as the thing that went away | It is one event, so it has one duration. See [choreography](#choreography).                                                                                 |
| A loop                                                             | 900ms to 2000ms, literal         | Fast enough to read as active, slow enough not to flicker. The library's loops are deliberately spread so two on one screen do not beat against each other. |

Both adjustments are bounded by the same ceiling: **nothing the user is waiting on exceeds `--nb-motion-long`**, no matter how large or how far. Past that the animation stops being a transition and starts being a delay.

## Easing

Linear movement of a discrete object looks wrong, because nothing in the physical world starts and stops at full speed. Everything that starts and stops is eased. Everything that never stops is linear.

Three curves, emitted beside the durations. They are the productive curves of the Carbon design system, which this library grew out of: nothing in them overshoots, bounces or lingers.

| Token                | Value                             | The element is...                                                                                                                        |
| -------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-ease-standard` | `cubic-bezier(0.2, 0, 0.38, 0.9)` | **On screen before and after.** A width, a height, a knob, a chevron, a tint. Both ends are soft, because nothing appears or disappears. |
| `--nb-ease-enter`    | `cubic-bezier(0, 0, 0.38, 0.9)`   | **Arriving.** Fast at the start, settling at the end. It arrives, then comes to rest where the user is about to look.                    |
| `--nb-ease-exit`     | `cubic-bezier(0.2, 0, 1, 0.9)`    | **Leaving for good.** Slow at the start, accelerating away. It commits to leaving, and the eye is released early.                        |

Three rules on top of the table:

**The exit is a different curve from the enter, and it is shorter.** An exit that decelerates reads as an element that changed its mind, and an exit as long as its entrance is time spent looking at something that is already gone. Every enter and exit in the library is written as two rules, `-enter-active` and `-leave-active`, with their own step and curve.

**An element that leaves but stays nearby uses the standard curve, not the exit curve.** The inspector closes to zero width beside the page, ready to come back, so it moves on `standard`. A dialog is gone when it closes, so it leaves on `exit`. This is Carbon's one exception to its exit rule and it is the right one.

**Loops are linear.** A loop with easing pulses, and a pulsing progress indicator reads as stuttering work. The stepped timing function under reduced motion is the one deliberate exception, below.

## What moves, and how

Every moving thing in the library, by the step and curve it uses. This is the catalogue to match when you build something that belongs to one of these families.

### The application frame

`NbShell` is where motion is most visible, because the frame is the largest thing on screen and the user operates it all day.

| Movement                                       | In                        | Out                  | Notes                                                                                                                                                                |
| ---------------------------------------------- | ------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail collapses or expands                      | width `medium` `standard` | same                 | Labels, badges, carets, group headers and the brand text fade over `quick` while the width moves. Icons do not move: compact and verbose rows share one centre line. |
| Inspector opens or closes                      | width `medium` `standard` | same                 | Stays beside the page when closed, so no exit curve. Under the detached frame its gutter moves with it.                                                              |
| Bottom panel between `default` and `collapsed` | basis `medium` `standard` | same                 | `full` is still a cut: the page above is removed rather than resized, and there is nothing to animate between.                                                       |
| Navigation drawer (collapsed widths)           | slide `medium` `enter`    | slide `short` `exit` | The scrim fades on the same timings.                                                                                                                                 |
| Inspector sheet (collapsed widths)             | slide `medium` `enter`    | slide `short` `exit` | Waits just past the right edge, so it arrives from the side it belongs to.                                                                                           |

The rail's collapse has an order, and the component keeps it: on the way down the labels fade first and the children keep their verbose layout until the width has settled, because switching them at once would centre every icon in a rail that is still wide. On the way up the children switch at once and the labels are revealed by the widening edge. See the script of `src/components/Shell.vue` for why.

### Dialogs

`NbModal`, `NbConfirm`, `NbCommandPalette`. The scrim and the dialog share one timing in each direction, so the whole thing reads as one surface.

|     | Curve   | Step     | Shape                                               |
| --- | ------- | -------- | --------------------------------------------------- |
| In  | `enter` | `medium` | Scrim fades, content scales from 0.96 and rises 8px |
| Out | `exit`  | `short`  | Scrim fades, content scales to 0.98 and sinks 4px   |

`0.96` and `8px`, not `0.8` and `40px`. A dialog that zooms is a dialog whose text is unreadable for the first half of its entrance. `NbConfirm` reads `CONFIRM_LEAVE_MS` from `src/components/Confirm.env.ts`, which equals the short step, so `useConfirm()` can time the next queued question against the exit.

### Popovers

`NbMenu`, `NbSubmenu`, `NbSelect`'s list, `NbUserMenu`, `NbNotificationCenter`, `NbInfoHint`, the compact rail's flyout, and the `v-nb-tooltip` directive. One shape for all of them:

|     | Curve   | Step    | Shape                                                                                  |
| --- | ------- | ------- | -------------------------------------------------------------------------------------- |
| In  | `enter` | `quick` | Fade, plus a 4px travel from the trigger: down from a button, sideways from a rail row |
| Out | `exit`  | `micro` | Fade only                                                                              |

A popover that slides back out is a popover the eye follows away from the thing the person is about to do next, so the exit is a fade. `NbNotificationCenter` flips the direction of its rise when it opens upward or beside its bell; every popover travels toward the thing that opened it.

### Controls

| Control                                    | What moves                                | Step     | Curve                                       |
| ------------------------------------------ | ----------------------------------------- | -------- | ------------------------------------------- |
| Every button, row and field                | Background, colour, border on hover       | `short`  | keyword `ease`, a tint needs no curve token |
| `NbSwitch`                                 | Knob travel                               | `quick`  | `standard`                                  |
| `NbSwitch`                                 | Track tint                                | `micro`  | `standard`                                  |
| `NbCheckbox`, `NbRadio`                    | Fill and border                           | `quick`  | `standard`                                  |
| `NbAccordionItem`                          | Section height, as grid tracks 0fr to 1fr | `medium` | `standard`                                  |
| `NbAccordionItem`, `NbTreeNode`, rail rows | Chevron rotation                          | `quick`  | `standard`                                  |
| `NbTabs`                                   | Colour of the active tab                  | `short`  | keyword                                     |

A tree's children appear instantly when a node opens. They are data, and a list that animates is a list you cannot read until it finishes.

### Transient surfaces

`NbToaster`, `NbToast`. A toast enters from the edge it is anchored to over `medium`, leaves back through it, and the stack closes the gap on the same step, which is the reflow pattern under [choreography](#choreography). The part that is motion design rather than CSS is the lifetime, in `NB_TOAST_DURATIONS`:

| Variant   | Lifetime | Reason                                                                   |
| --------- | -------- | ------------------------------------------------------------------------ |
| `success` | 4000ms   | Confirmation. The user already knows; this is a receipt.                 |
| `info`    | 6000ms   | Has to be read.                                                          |
| `warning` | 8000ms   | Has to be read and thought about.                                        |
| `error`   | `0`      | Persistent. An error that removes itself is an error the user never saw. |

A toast carrying a `cta` never auto-dismisses unless an explicit `duration` says so. The countdown bar under the toast is `linear`, because it is a clock: an eased clock lies about how much time is left.

### Loops

`NbSpinner` rotates a quarter-turn arc at `900ms linear infinite`. `NbSkeleton` sweeps a highlight at `1600ms`, driven by `background-position` so it costs nothing on a page full of them. `NbProgressBar` indeterminate sweeps at `1400ms`. The three are deliberately different so two on one screen do not beat against each other. Choosing between indicators is [Status indicators](/patterns/status-indicators); this page only covers how they move.

## Choreography

Choreography is what happens when one user event moves more than one thing. The failure mode is not ugliness, it is ambiguity: two things moving independently look like two events, and the user starts looking for a second cause.

### One event, one timing

Everything that moves because of the same click shares a step and a curve. `NbModal` is the shipped example: the scrim fades and the dialog scales and rises, both on `medium` and `enter`, so the whole thing reads as one surface arriving rather than a backdrop plus a box.

The corollary: **do not stagger a container against its own contents.** If a panel slides in and its heading fades in 100ms later, you have built two events out of one and added 100ms to the time before the panel is readable. The rail is the one place the library sequences a container and its contents, and it does so in the other direction: the labels finish fading before the width finishes moving, so the rail is never narrow with text still in it.

### Things enter from where they belong and leave back through it

Direction is information. An element that arrives from the wrong edge tells the user it came from somewhere it did not. `NbToaster` encodes this as a custom property rather than a fixed translate, so one transition rule serves six placements and each one arrives from its own edge:

```scss
.nb-toaster-enter-from,
.nb-toaster-leave-to {
  opacity: 0;
  translate: var(--nb-toaster-shift);
}
```

### Reflow is part of the event

When something leaves a stack, the survivors close the gap. That closing is not a separate animation, it is the tail of the same one, and it gets the same step. It takes two pieces:

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

### We do not stagger lists

Staggered list entrances are the most-cited technique in motion writing and this library ships none of them, on purpose. Our lists are data tables, log rows, tree nodes and query results. A staggered table is a table you cannot read until it finishes, and the user opened it to read it. When content arrives progressively, show its structure immediately with `NbSkeleton`, and do not animate the swap: a cross-fade between a placeholder and real content produces a moment where both are half-visible and neither is legible.

### Sequencing across a flow

Where a sequence genuinely exists, the library uses time, not animation, to separate the beats. `useConfirm()` holds a resolved dialog in its success state for `SUCCESS_MS` (900ms) before dismissing it, and waits `CONFIRM_LEAVE_MS` before presenting the next queued question. **Separate beats with a pause between finished animations, never with a longer animation.** A 900ms hold is legible. A 900ms fade is a slow interface.

## Reduced motion

`prefers-reduced-motion: reduce` is set by users who get nauseated, dizzy or disoriented by on-screen movement. It is a vestibular accommodation, not a preference for a quieter aesthetic, and it is not a request to turn the interface off. The library honours it everywhere by default, from the operating system or browser setting, with no switch of its own.

::: danger The rule
**Reduced motion removes the travel. It never removes the feedback.**

Under the preference, a component must still answer the same question it answered before. A spinner must still say "working". A skeleton must still say "loading". A toast must still say "this arrived". A drawer must still be seen to open. What goes away is the movement through space that says it: the slide, the spin, the sweep, the zoom, the width change.

Blanket `* { animation: none !important; transition: none !important; }` fails this rule in the worst possible way. It freezes every loading indicator into a static shape that reads as a hung interface, so the user with the accommodation gets a broken product instead of a calm one. Do not set the motion tokens to `0` for the same reason.
:::

### Keep or drop

| Under `prefers-reduced-motion: reduce`                 | Keep or drop | Why                                                                      |
| ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------ |
| Travel: translate, slide, scale, rotate, width, height | Drop         | This is the trigger.                                                     |
| Tint: colour, background, border, opacity crossfade    | Keep         | No spatial movement, no vestibular effect, and it carries the causality. |
| The fact that a loading indicator is animating at all  | Keep         | A frozen indicator means "hung", which is a different and false message. |
| Smooth scrolling                                       | Drop         | Programmatic scroll is large-field travel, the worst offender.           |
| Progress and countdown information                     | Keep         | It is data. Change how it moves, not whether it is there.                |
| Hover and press feedback on controls                   | Keep         | It is a tint, and the control is still seen to respond.                  |

### The helper

Every component writes the preference the same way, through one mixin:

```scss
@use '@nubisco/ui/styles/logic/motion' as motion;

.my-panel-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

@include motion.reduced {
  .my-panel-enter-from {
    transform: none; // keep the fade, drop the rise
  }
}
```

### The four correct fallbacks

Every reduced-motion handler in this library is one of these four, and yours should be too.

**1. Substitute a tint loop for a travel loop.** The strongest pattern, because nothing is lost. `NbSpinner`'s arc stops rotating and becomes a complete ring breathing in opacity. `NbSkeleton` swaps the travelling highlight for a fade, and `NbProgressBar`'s indeterminate track fills completely and pulses in place rather than leaving a static stub that would read as "12% complete", which is a lie.

**2. Remove the travel, keep the fade.** For enters and exits. Every popover, the dialogs, the toaster, the drawer and the inspector sheet do this: the `-enter-from` transform is zeroed and the opacity transition stays, so the thing is still seen to arrive.

**3. Change the timing function, keep the animation.** For continuous motion that is information. `NbToast`'s countdown bar keeps running, because how much time is left is data, but it steps instead of sweeping:

```scss
@include motion.reduced {
  .nb-toast__progress {
    animation-timing-function: steps(8, end);
  }
}
```

**4. Cancel outright.** Only for transitions on a state the component reaches either way. The rail's width, the inspector's width, the bottom panel's height, a chevron's rotation: the end state is identical with or without the transition, so the preference removes it and the still frame says everything the motion said.

### A preference that flips mid-session

The media query reacts live, so a transition that is purely CSS follows the setting the moment it changes. The one piece of motion the library times in script, the rail's label switch, reads the preference on every collapse, so it is immediate from the next click.

## Before you write an animation

1. **Which of the three jobs is this?** Continuity, causality or feedback. If none, delete it.
2. **Is anything else moving because of the same event?** Then it shares this step and this curve, and the reflow shares it too.
3. **Which step?** Work down the [table](#choosing-a-step). If you write a literal, it is a loop, and the reason goes above it.
4. **Which curve?** On screen before and after: `standard`. Arriving: `enter`. Leaving for good: `exit`. Leaving but staying nearby: `standard`. Looping: `linear`.
5. **Is the exit shorter than the enter, on its own curve?** Two rules, not one.
6. **Does it carry travel?** Then it needs an `@include motion.reduced` block, and that block keeps the fade.
7. **Does it still say the same thing with the animation removed?** If a user with reduced motion cannot tell what happened, the animation was carrying meaning that should have been in the still frame.

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
- [Shell](/components/shell/code) for the frame whose rail, inspector, drawer and bottom panel are described above.
- [Status indicators](/patterns/status-indicators) for choosing between `NbSpinner`, `NbInlineLoading`, `NbSkeleton` and `NbProgressBar`. That page owns which indicator; this page owns how it moves.
- [Dialogs](/patterns/dialogs) and [Inspectors](/patterns/inspectors) for the surfaces whose enters and exits are described here.
- [Accessibility overview](/accessibility/overview) for where reduced motion sits among the other obligations.
- [Toaster](/components/toaster/usage) and [useToast](/composables/use-toast) for toast lifetimes, placement and the shift property.
- [Tooltip](/directives/tooltip) for `animationTime` and the exit duration that has to match the keyframe.
