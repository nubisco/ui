---
layout: nubisco
title: Motion
description: What movement is allowed to mean in this library, the four duration tokens and how to pick one, which curve belongs to entering, exiting and moving, how several moving things are coordinated, and the reduced-motion rule.
---

Motion is the only part of this system that costs the user time. A colour is read instantly, a spacing step is read instantly, and a 300ms slide is 300ms the user spends waiting to find out what happened. That is the whole economics of this page: every animation has to buy back the time it spends, and most of them do not.

So motion earns its place by answering a question the still frame cannot answer. Where did this come from. What did my click do. Is anything still happening. Three questions, three jobs, and nothing else on the list.

::: warning What the library actually does today
This page is not a description of a tidy system. Across `src/components/*.vue`, excluding `Icon.vue` (a set of animated marks with its own rules), there are **134 duration declarations written as literals across 20 distinct values**, against **8 uses of `var(--nb-animation-fast)`**. `--nb-animation-base`, `--nb-animation-slow` and `--nb-animation-xslow` have **zero uses in the entire library**. The same value is written two ways, `0.15s` 55 times and `150ms` 6 times. **47 components animate something; 17 of them handle `prefers-reduced-motion`.**

That is the gap this page exists to close, and it closes from the top: the rules below are the rules, and where the library breaks them the break is named in place, so you can tell a convention from an accident before you copy it.
:::

## The words this page uses

| Term                   | Means                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transition**         | Movement between two states of something that stays on screen. A hover tint, a chevron rotating, a bar growing. Written as `transition`.                        |
| **Enter / exit**       | Movement of something arriving in or leaving the document. A menu opening, a toast dismissing. Written as a Vue `<Transition>` with `-enter-*` / `-leave-*`.    |
| **Reflow**             | Movement of things that did not change, caused by something else that did. The toast stack closing a gap. Written with `<TransitionGroup>` and a `-move` class. |
| **Loop**               | Continuous, non-terminating animation. A spinner, a skeleton sweep. It communicates "still happening" and has no end state.                                     |
| **Travel**             | Change in position or size: `translate`, `transform`, `scale`, a growing box. This is the part that triggers vestibular symptoms.                               |
| **Tint**               | Change in colour or opacity only. No travel. This is the part that is safe under reduced motion.                                                                |
| **Vestibular trigger** | Motion that the inner ear reads as self-movement: large travel, parallax, spin, zoom. The actual thing `prefers-reduced-motion` is asking you to remove.        |

The tint / travel split is the most load-bearing distinction on this page. Almost every reduced-motion decision in this library reduces to "keep the tint, drop the travel", and the components that got it wrong got it wrong by dropping both.

## The three jobs

Motion in a Nubisco application is doing one of exactly three things. If you cannot name which, you have decoration.

| Job            | The question it answers                                 | Shipped example                                                                                                                                |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Continuity** | Where did this come from, and where does it go back to? | `NbMenu` rises 4px from the trigger it belongs to. `NbToaster` slides in from the edge it is anchored to, and leaves back through it.          |
| **Causality**  | Did my input do anything?                               | Every control tints its background in 70ms to 150ms on hover and press. The `NbConfirm` dialog holds a success state for 900ms before it goes. |
| **Feedback**   | Is anything still happening?                            | `NbSpinner` rotates. `NbSkeleton` sweeps. `NbProgressBar` fills. `NbToast` runs a countdown bar showing how long it will stay.                 |

### What motion is not for

It is not for delight, polish, brand expression or making a screen feel alive. This library is used to build a CMS, an integration console, a back office and a node graph editor. In all four, the user is doing work, and the thing that feels good is that the interface got out of the way.

The concrete prohibitions:

- **Nothing animates on page load.** No fade-up on cards, no staggered rows. First paint is the fastest paint, and a page that assembles itself is a page that is not ready.
- **Nothing that carries data animates its data.** A number does not count up. A chart does not draw itself in. A table does not stagger rows. The reader is trying to read.
- **Nothing bounces, overshoots or springs.** There is not a single overshoot curve in this library and there should not be. Overshoot says "toy"; these are tools that manage production infrastructure.
- **Nothing loops unless something is genuinely pending.** A loop is a claim that work is in flight. `NbSkeleton` has an `animated` prop precisely so a placeholder that is not waiting on anything can stop making that claim.
- **Nothing animates a layout size in the application frame.** `NbShellPanel` collapses and maximises by changing `flex`, with no transition on the size at all. This is deliberate: animating flex sizing inside the shell fights the sibling coordination that makes maximise work, and a panel that takes 300ms to get out of the way is a panel the user resizes twice.

## Duration

### The tokens

Four tokens, declared in `src/styles/variables/_animations.scss` and emitted on `:root` by `src/styles/_theme.scss`. These are the only motion tokens the library ships.

| Token                  | Value  | What it is for                                                                                  |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `--nb-animation-fast`  | `0.2s` | Anything the user is waiting on. Enters, exits, and every state change on a control.            |
| `--nb-animation-base`  | `0.3s` | A larger element travelling a longer distance, where `fast` visibly snaps.                      |
| `--nb-animation-slow`  | `0.4s` | The ceiling for anything blocking. Reserve for the largest surfaces.                            |
| `--nb-animation-xslow` | `1s`   | Loops only. Never a transition: a second of waiting to see a menu is not a design, it is a bug. |

::: danger There is no easing token
Search `src/styles` for a cubic-bezier or an easing custom property and you will not find one. The four tokens above are durations and nothing else. Until an easing family exists, write the CSS keyword directly, per the [easing rules below](#easing), and do not invent a `--nb-ease-*` name in an application: [Design Tokens](/design-tokens) is explicit that a missing token is a gap to report, not a licence to mint one.
:::

### Choosing a step

Work down this table. The left column is what is moving, not how far, because the size of the thing is what sets the expectation.

| What is moving                                                     | Duration                                  | Why                                                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A tint on a control the pointer is over or pressing                | 70ms to 150ms, hard floor at 70ms         | Below 70ms it reads as an instant repaint and the causality is lost. Above 150ms the control feels laggy under a fast pointer. |
| A small element appearing next to its trigger (menu, popover, tip) | `--nb-animation-fast` or faster           | It travels a handful of pixels and the user is waiting to read it.                                                             |
| A dialog or overlay taking the whole screen                        | `--nb-animation-fast`                     | It is large, but it is also blocking. Large argues up, blocking argues down, and they meet here.                               |
| A transient element entering or leaving at the viewport edge       | `--nb-animation-fast`                     | Far from the user's focus, so it needs to be visible; not blocking, so it can afford the time.                                 |
| A reflow: things closing a gap left by something that went away    | Same duration as the thing that went away | It is one event, so it has one duration. See [choreography](#choreography).                                                    |
| A loop                                                             | 900ms to 2000ms                           | Fast enough to read as active, slow enough not to flicker at the edge of vision.                                               |

::: tip Distance and size move the number
The table gives a starting step, not a final answer. Two adjustments, in this order:

**Farther travels longer.** `NbMenu` rises 4px and takes `0.12s`. `NbModal` rises 8px and scales, and takes `0.2s`. Same family of gesture, twice the travel, roughly twice the time. If you double a translate and keep the duration, you have doubled the velocity and the element now looks flung.

**Bigger travels longer.** A full-screen overlay at `0.12s` reads as a flash, because the eye is tracking a large area changing. `NbCommandPalette` and `NbModal` both scale a large surface and both sit at `0.15s` to `0.2s`, above the `0.12s` used by the popovers.

Both adjustments are bounded by the same ceiling: **nothing the user is waiting on exceeds `--nb-animation-slow` (0.4s)**, no matter how large or how far. Past that the animation stops being a transition and starts being a delay.
:::

### The literals in the library, and which are load-bearing

Not every hard-coded number in the source is a mistake, so here is the honest ledger. These are conventions worth following, whether or not they are tokenised yet:

| Value                         | Where                                                                                    | Verdict                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `70ms linear`                 | `NbCard --interactive`, `NbAccordionItem` header, `NbBlueprintCard`                      | A real convention: the fastest legible tint, for surfaces that light up under the pointer.        |
| `0.1s`                        | `NbMenuItem`, `NbShellPanel` and `NbBottomPanel` size buttons, `NbCalendar` day cells    | Dense chrome rows. Consistent, and slightly faster than the general control tint by design.       |
| `0.12s`                       | `NbMenu`, `NbSubmenu`, `NbNotificationCenter` popover                                    | A real convention: **this is the popover duration**. Match it when you build one.                 |
| `0.15s` / `150ms`             | 61 declarations, most controls                                                           | The de facto control-state duration. The two spellings are the same number and should not be.     |
| `0.2s`                        | `NbModal` enter and leave, `CONFIRM_LEAVE_MS` in `src/components/Confirm.env.ts`         | Equals `--nb-animation-fast`. Should say so, and in `NbToaster` it already does.                  |
| `900ms` / `1600ms` / `2000ms` | `NbSpinner` rotation, skeleton sweep and reduced-motion fallbacks, `NbProgressBar` pulse | Loop timings. Deliberately spread so two indicators on one screen do not beat against each other. |

When you write a new component: use the token if a token fits, and if you write a literal, write the reason above it, exactly as [Design Tokens](/design-tokens#choosing-a-token) requires for every other family.

## Easing

Linear movement of a discrete object looks wrong, because nothing in the physical world starts and stops at full speed. Everything that starts and stops is eased. Everything that never stops is linear. That single sentence covers every correct case in this library.

| The element is...                                                                       | Curve                   | Rationale                                                                                                           |
| --------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Entering** (arriving, opening, appearing)                                             | `ease-out`              | Fast at the start, settling at the end. It arrives, then comes to rest where the user is about to look.             |
| **Exiting** (dismissing, closing, being removed)                                        | `ease-in`               | Slow at the start, accelerating away. It commits to leaving, and the eye is released early.                         |
| **Moving** (visible before and after: reflow, expand, a bar filling, a chevron turning) | `ease` or `ease-in-out` | Both ends are on screen, so both ends need to be soft. Nothing appears or disappears, so neither end gets priority. |
| **Looping** (spinner, sweep, countdown, indeterminate)                                  | `linear`                | A loop with easing pulses, and a pulsing progress indicator reads as stuttering work.                               |
| **Reduced-motion stepped**                                                              | `steps(n)`              | The one deliberate exception. See [reduced motion](#reduced-motion).                                                |

Two hard rules on top of the table:

**Never `linear` on something that starts and stops.** `NbCard` uses `70ms linear` on a hover tint, and at 70ms on a colour that is unobjectionable, because there is no travel and no perceptible ramp at that length. Do not read it as licence: any duration above ~100ms, or any travel at all, needs a curve.

**Never `ease-in` on an enter, or `ease-out` on an exit.** An entrance that starts slowly reads as reluctant, and an exit that decelerates reads as an element that changed its mind. This is the most common motion bug in review.

::: warning Our exits are symmetric, and they should not be
`NbModal`, `NbMenu`, `NbNotificationCenter`, `NbSubmenu`, `NbCommandPalette` and `NbToaster` all use the same curve and the same duration for enter and for leave. That is not a decision, it is what you get when you write one `-enter-active, -leave-active` rule and move on.

The rule for new work: **the exit is a different curve from the enter, and it is not longer.** An exit exists to get out of the way. The one place the library already separates them is `NbConfirm`, which pulls `CONFIRM_LEAVE_MS` out into `src/components/Confirm.env.ts` as its own constant, specifically so `useConfirm()` can read it and time the next queued question against it. That is the shape to copy: a leave duration that other code can name is a leave duration that can be tuned.
:::

::: danger Do not copy the loose cubic-beziers
`NbAccordionItem`, `NbReorderList` and `NbBlueprintCard` each carry a hand-written `cubic-bezier` on a `110ms` transform. There is no token behind it, no comment explaining the four numbers, and no fourth component agrees with them. Treat these three as debt, not as the house curve. Use a keyword until an easing family exists.
:::

## Choreography

Choreography is what happens when one user event moves more than one thing. The failure mode is not ugliness, it is ambiguity: two things moving independently look like two events, and the user starts looking for a second cause.

### One event, one duration

Everything that moves because of the same click shares a duration and a curve.

`NbModal` is the shipped example. The scrim fades and the dialog scales and rises, and both run `0.2s`, so the whole thing reads as one surface arriving rather than a backdrop plus a box.

```scss
// Modal.vue, abridged. One event, so one number, twice.
.nb-modal-enter-active,
.nb-modal-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;

  .nb-modal--content {
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
}
```

The corollary: **do not stagger a container against its own contents.** If a panel slides in and its heading fades in 100ms later, you have built two events out of one and added 100ms to the time before the panel is readable.

### Things enter from where they belong and leave back through it

Direction is information. An element that arrives from the wrong edge tells the user it came from somewhere it did not.

`NbToaster` encodes this as a custom property rather than a fixed translate, so one transition rule serves six placements and each one arrives from its own edge:

```scss
.nb-toaster-enter-from,
.nb-toaster-leave-to {
  opacity: 0;
  translate: var(--nb-toaster-shift);
}
```

`NbNotificationCenter` does the same thing by flipping the sign: the panel normally drops 4px from its bell, and the `--above` variant, which opens upward, rises 4px instead. `NbMenu` rises from its trigger. Every popover in the library travels toward the thing that opened it and retreats into it.

### Reflow is part of the event

When something leaves a stack, the survivors close the gap. That closing is not a separate animation, it is the tail of the same one, and it gets the same duration.

`NbToaster` is the only place in the library that does this properly, and it takes two pieces:

```scss
// The `-move` class is what animates the survivors.
.nb-toaster-enter-active,
.nb-toaster-leave-active,
.nb-toaster-move {
  transition:
    opacity var(--nb-animation-fast) ease,
    translate var(--nb-animation-fast) ease;
}

// Taken out of flow while leaving, so the toasts below slide up into the
// gap instead of snapping.
.nb-toaster-leave-active {
  position: absolute;
}
```

Without `position: absolute` on the leaving element, the gap closes instantly at the moment of removal and the survivors teleport while the departing toast is still fading. This is the single most common `<TransitionGroup>` bug, and the fix is two lines.

### We do not stagger lists

Staggered list entrances are the most-cited technique in motion writing and this library ships exactly none of them, on purpose. Our lists are data tables, log rows, tree nodes and query results. A staggered table is a table you cannot read until it finishes, and the user opened it to read it.

What to do instead, when content arrives progressively:

- **Show structure immediately.** `NbSkeleton` with the right `variant` and `lines` puts the shape of the answer on screen at first paint. See [Status indicators](/patterns/status-indicators).
- **Do not animate the swap.** When data replaces the skeleton, it replaces it. A cross-fade between a placeholder and real content produces a moment where both are half-visible and neither is legible.

### Sequencing across a flow

Where a sequence genuinely exists, the library uses time, not animation, to separate the beats. `useConfirm()` holds a resolved dialog in its success state for `SUCCESS_MS` (900ms) before dismissing it, and waits `CONFIRM_LEAVE_MS` before presenting the next queued question. Under reduced motion that second delay drops to `0`, because there is no animation to wait out.

That is the pattern: **separate beats with a pause between finished animations, never with a longer animation.** A 900ms hold is legible. A 900ms fade is a slow interface.

## The patterns we ship

Six shapes cover almost everything. Each one below is what the library actually does, with the file to read.

### A panel changing size

`NbShellPanel`, `NbBottomPanel`. **The size change is not animated.** Collapse and maximise change `flex` and take effect immediately, because the panels coordinate with their siblings through flex and an animated flex-basis fights that coordination.

What is animated is the tint that tells you which state you are in: a collapsed panel dims its header to `opacity: 0.6` over `0.12s ease` and restores it on hover. That is causality without travel, and it costs nothing.

If you build a panel that genuinely slides, for example an inspector over content rather than beside it, that is an enter and an exit: `--nb-animation-fast`, `ease-out` in, `ease-in` out, travelling from and back through the edge it is docked to. See [Inspectors](/patterns/inspectors).

### A dialog appearing

`NbModal`, `NbConfirm`, `NbCommandPalette`. Scrim fades, content scales up slightly and drops into place. The scale starts near 1 and the rise is small:

```scss
.nb-modal-enter-from {
  opacity: 0;

  .nb-modal--content {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
```

`0.96` and `8px`, not `0.8` and `40px`. A dialog that zooms is a dialog whose text is unreadable for the first half of its entrance. `NbCommandPalette` uses `scale(0.97)` at `0.15s` for the same reason.

::: warning `NbModal` has no reduced-motion guard
`NbModal` animates a scale and a translate unconditionally, and neither the media query nor a runtime check appears in its stylesheet. `NbConfirm` works around it from the outside: `applyConfirmMotion()` in `src/components/Confirm.env.ts` writes a duration onto the dialog node rather than restyling every modal in the library. Until `NbModal` handles the preference itself, a product that opens modals a lot should assume this gap exists. Do not treat `NbModal` as the reference implementation for reduced motion; treat `NbSpinner` and `NbSkeleton` as that.
:::

### A popover appearing

`NbMenu`, `NbSubmenu`, `NbNotificationCenter`, the `v-tooltip` directive. `0.12s`, opacity plus a 4px translate toward the trigger. `NbSubmenu` drops the translate entirely and fades only, because a submenu appears beside its parent row and a 4px rise would read as it detaching.

The tooltip directive is the outlier: `animationTime` defaults to `300ms` with `ease-in-out`, and its exit is pinned to `HIDE_ANIMATION_MS = 200` in `src/directives/ToolTip.directive.ts`, which must equal the `tooltipDisappear` keyframe duration or the chip is detached mid-animation. If you change one, change both. See [Tooltip](/ui/directives/tooltip).

### A toast entering and leaving

`NbToaster`, `NbToast`. Covered in [choreography](#reflow-is-part-of-the-event) above for the mechanics. The part that is motion design rather than CSS is the lifetime, in `NB_TOAST_DURATIONS`:

| Variant   | Lifetime | Reason                                                                   |
| --------- | -------- | ------------------------------------------------------------------------ |
| `success` | 4000ms   | Confirmation. The user already knows; this is a receipt.                 |
| `info`    | 6000ms   | Has to be read.                                                          |
| `warning` | 8000ms   | Has to be read and thought about.                                        |
| `error`   | `0`      | Persistent. An error that removes itself is an error the user never saw. |

A toast carrying a `cta` never auto-dismisses unless an explicit `duration` says so, because an action that walks away while it is being reached for is not an action. The countdown bar under the toast is `linear`, because it is a clock: an eased clock lies about how much time is left.

### A skeleton pulsing

`NbSkeleton`. A highlight sweeps across the fill, `1600ms linear infinite`, driven by `background-position` rather than a transform so it costs nothing on a page full of them. `animated: false` stops it, for a placeholder that is not actually waiting on a request.

### A spinner and a progress bar

`NbSpinner` rotates a quarter-turn arc at `900ms linear infinite`. `NbProgressBar` determinate transitions `transform: scaleX()` at `0.15s ease`; indeterminate sweeps at `1400ms linear infinite`. `NbButton`'s inline spinner matches `NbSpinner`'s reduced-motion behaviour exactly so the two never disagree inside one product. Choosing between these four indicators is [Status indicators](/patterns/status-indicators); this page only covers how they move.

## Reduced motion

`prefers-reduced-motion: reduce` is set by users who get nauseated, dizzy or disoriented by on-screen movement. It is a vestibular accommodation, not a preference for a quieter aesthetic, and it is not a request to turn the interface off.

::: danger The rule
**Reduced motion removes the travel. It never removes the feedback.**

Under the preference, a component must still answer the same question it answered before. A spinner must still say "working". A skeleton must still say "loading". A toast must still say "this arrived". What goes away is the movement through space that says it: the slide, the spin, the sweep, the zoom.

Blanket `* { animation: none !important; transition: none !important; }` fails this rule in the worst possible way. It freezes every loading indicator into a static shape that reads as a hung interface, so the user with the accommodation gets a broken product instead of a calm one.
:::

### Keep or drop

| Under `prefers-reduced-motion: reduce`                | Keep or drop | Why                                                                                                                                                       |
| ----------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Travel: translate, slide, scale, rotate, parallax     | Drop         | This is the trigger.                                                                                                                                      |
| Tint: colour, background, border, opacity crossfade   | Keep         | No spatial movement, no vestibular effect, and it carries the causality.                                                                                  |
| The fact that a loading indicator is animating at all | Keep         | A frozen indicator means "hung", which is a different and false message.                                                                                  |
| Smooth scrolling                                      | Drop         | Programmatic scroll is large-field travel, the worst offender.                                                                                            |
| Progress and countdown information                    | Keep         | It is data. Change how it moves, not whether it is there.                                                                                                 |
| Hover and press feedback on controls                  | Keep or drop | Either is defensible. `NbCard` and `NbStepperStep` drop theirs, and the interface stays usable because the hover colour is still applied, just instantly. |

### The four correct fallbacks

Every reduced-motion handler in this library is one of these four, and yours should be too.

**1. Substitute a tint loop for a travel loop.** The strongest pattern, because nothing is lost. `NbSpinner`'s arc stops rotating and becomes a complete ring breathing in opacity:

```scss
@media (prefers-reduced-motion: reduce) {
  .nb-spinner__arc {
    stroke-dasharray: none;
    animation: nb-spinner-breathe 1600ms ease-in-out infinite;
  }
}
```

`NbSkeleton` does the same, swapping the travelling highlight for `nb-skeleton-fade`, and `NbProgressBar`'s indeterminate track fills completely and pulses in place rather than leaving a static eighth-width stub that would read as "12% complete", which is a lie.

**2. Remove the travel, keep the fade.** For enters and exits. `NbToaster` zeroes the shift and cross-fades in place, and cancels the reflow so the stack closes gaps instantly:

```scss
@media (prefers-reduced-motion: reduce) {
  .nb-toaster {
    --nb-toaster-shift: 0 0;
  }

  .nb-toaster-enter-active,
  .nb-toaster-leave-active {
    transition: opacity var(--nb-animation-fast) ease;
  }

  .nb-toaster-move {
    transition: none;
  }
}
```

**3. Change the timing function, keep the animation.** For continuous motion that is information. `NbToast`'s countdown bar keeps running, because how much time is left is data, but it steps instead of sweeping so nothing is gliding at the edge of vision:

```scss
@media (prefers-reduced-motion: reduce) {
  .nb-toast__progress {
    animation-timing-function: steps(8, end);
  }
}
```

**4. Cancel outright.** Only for decorative transitions on a state the component reaches either way. `NbCard`'s hover tint, `NbShellPanel`'s header dimming, `NbStepperStep`'s marker colours. The end state is identical, so removing the transition removes nothing but the ramp.

### Two channels, not one

A media query alone is not enough for anything that has to respond to the user flipping the OS setting with the page already open. `NbSpinner` and `NbSkeleton` carry the same rules twice: once in `@media (prefers-reduced-motion: reduce)`, and once on a `--reduced-motion` modifier class driven by `useReducedMotion()`.

```scss
@media (prefers-reduced-motion: reduce) {
  .nb-spinner__arc {
    stroke-dasharray: none;
    animation: nb-spinner-breathe 1600ms ease-in-out infinite;
  }
}

// Same rules from the runtime preference, so flipping the OS setting with the
// page already open takes effect without a reload.
.nb-spinner--reduced-motion .nb-spinner__arc {
  stroke-dasharray: none;
  animation: nb-spinner-breathe 1600ms ease-in-out infinite;
}
```

The media query handles first paint, before any script has run. The class handles the mid-session change. Duplicating the block is the cost of covering both, and it is worth paying for anything long-lived on screen.

### Never leave `transition: none` on a value you will need back

`NbConfirm` makes this explicit. Instead of writing `transition: none` on the dialog, `applyConfirmMotion()` writes a **duration of `0ms`**:

```ts
// src/components/Confirm.env.ts, abridged
const duration = `${reduced ? 0 : CONFIRM_LEAVE_MS}ms`
```

Two reasons, both real. A `none` left on a recycled node survives the user turning the preference back off, so the animation never comes back. And a duration is a number other code can read: `useConfirm()` reads the same value to decide how long to wait before showing the next queued question, so a user with reduced motion gets the shorter queue delay rather than waiting out an animation that never ran.

### The script side

Two things are not reachable from CSS and must be handled in TypeScript. Both composables are exported from `@nubisco/ui`:

```ts
import { useReducedMotion, prefersReducedMotion } from '@nubisco/ui'

// Reactive, for anything that must respond to a mid-session change.
const reduced = useReducedMotion()

// One-shot, for code paths outside a reactive scope.
if (!prefersReducedMotion()) {
  el.scrollIntoView({ behavior: 'smooth' })
}
```

`useReducedMotion()` returns a `readonly` ref and cleans up its listener via `onScopeDispose`, so it is safe to call in any `setup()`. Use it for `scrollIntoView` behaviour, for `scroll-behavior`, and for any animation you drive from JavaScript. `NbStepper` handles the CSS half of this by resetting `scroll-behavior: smooth` back to `auto` under the media query, because the stepper scrolls itself when the flow advances and a programmatic smooth scroll is large-field travel the user did not ask for.

### Coverage, honestly

47 components in `src/components/*.vue` animate something. 17 handle the preference. Most of the 30 that do not are tint-only and are therefore fine by the [keep or drop table](#keep-or-drop): `NbButton`'s background, `NbTextInput`'s border, `NbDataTable`'s row highlight.

These are not fine, because they carry travel:

| Component          | The travel                                        |
| ------------------ | ------------------------------------------------- |
| `NbModal`          | `scale(0.96) translateY(-8px)` on enter and leave |
| `NbCommandPalette` | `scale(0.97) translateY(-8px)` on enter and leave |
| `NbMenu`           | `translateY(-4px)` on enter and leave             |
| `NbMessage`        | `transform` on show and hide                      |

Fixing these is library work, not application work. Do not patch them from a consuming app with a global override: a blanket kill inside your own stylesheet will also freeze the four indicators that are handling the preference correctly, and you will have made things worse. Report the gap.

## Before you write an animation

1. **Which of the three jobs is this?** Continuity, causality or feedback. If none, delete it.
2. **Is anything else moving because of the same event?** Then it shares this duration and this curve, and the reflow shares it too.
3. **Is there a token for the duration?** `--nb-animation-fast` covers almost every enter and exit. If you write a literal, write the reason above it.
4. **Which curve?** Entering `ease-out`, exiting `ease-in`, moving `ease`, looping `linear`. Never linear on anything above ~100ms that starts and stops.
5. **How far and how big?** More travel or a larger surface moves the duration up a step, up to the `0.4s` ceiling for anything blocking.
6. **Does it carry travel?** Then it needs a `prefers-reduced-motion` block, and that block substitutes a tint rather than deleting the feedback.
7. **Does it need to survive a mid-session preference flip?** Then it needs the runtime class as well as the media query.
8. **Does it still say the same thing with the animation removed?** If a user with reduced motion cannot tell what happened, the animation was carrying meaning that should have been in the still frame.

## Auditing your own app

Two greps. The first counts duration literals against the token scale:

```bash
grep -rhoE "(transition|animation)[a-z-]*: *[^;]*" src | grep -cE "[0-9]+m?s"
grep -rhoE "(transition|animation)[a-z-]*: *[^;]*" src | grep -c "nb-animation"
```

The second finds travel with no accommodation. Any file in the first list that is not in the second is a candidate:

```bash
grep -rlE "transform:|translate:|scale\(" src --include="*.vue" | sort > /tmp/moves
grep -rl "prefers-reduced-motion" src --include="*.vue" | sort > /tmp/guards
comm -23 /tmp/moves /tmp/guards
```

Every file the second command prints is one you must open and check: either the transform is static, in which case it is fine, or it is animated, in which case it is a defect. This is the same command that produced the coverage numbers on this page for the library itself.

## See also

- [Design Tokens](/design-tokens) for the token grammar and the override tiers, including why you must not set `--nb-animation-*` to `0` to disable motion.
- [Status indicators](/patterns/status-indicators) for choosing between `NbSpinner`, `NbInlineLoading`, `NbSkeleton` and `NbProgressBar`. That page owns which indicator; this page owns how it moves.
- [Dialogs](/patterns/dialogs) and [Inspectors](/patterns/inspectors) for the surfaces whose enters and exits are described here.
- [Accessibility overview](/accessibility/overview) for where reduced motion sits among the other obligations.
- [Toaster](/ui/components/toaster) and [useToast](/ui/composables/use-toast) for toast lifetimes, placement and the shift property.
- [Tooltip](/ui/directives/tooltip) for `animationTime` and the exit duration that has to match the keyframe.
