---
layout: nubisco
title: Motion
intro: 'Motion is the only part of this system that costs the user time. Every animation has to buy back the time it spends, and most of them do not. This page is what movement is allowed to mean here, shown moving. Switch any demo to slow motion to see what the eye normally only feels.'
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

Five steps and three curves. Everything in the library moves on them, and a product retunes them on `:root` the way it retunes a colour. One more step and three more curves are held back for two moments, [below](#expressive-two-moments-never-a-control). This tab is the scale and the curves themselves, side by side, so the difference between `quick` and `short` is something you have seen rather than something you have read.

## The scale

Press play. Every dot travels the same distance, and only the step differs. The scale is non-linear on purpose: each step is perceptibly longer than the last, not arithmetically longer.

<MotionDurations />

| Token                | Value | What moves at this step                                                                                              |
| -------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `--nb-motion-micro`  | 70ms  | A tint on a control under the pointer. A switch track. A popover fading out.                                         |
| `--nb-motion-quick`  | 110ms | A chevron turning. A checkbox tick. A tooltip or popover arriving. A switch knob. Rail labels fading.                |
| `--nb-motion-short`  | 150ms | The de facto control-state step. A dialog or a drawer leaving.                                                       |
| `--nb-motion-medium` | 240ms | The rail changing width. The inspector opening. An accordion section. A dialog arriving. A toast entering.           |
| `--nb-motion-long`   | 400ms | The ceiling for anything the user is waiting on. Reserved for the largest surfaces; nothing in the library needs it. |

## Choosing a step

Work down this table. The left column is what is moving, not how far, because the size of the thing is what sets the expectation.

| What is moving                                                     | Step                             | Why                                                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A tint on a control the pointer is over or pressing                | `micro`                          | Below 70ms it reads as an instant repaint and the causality is lost. Above 150ms the control feels laggy under a pointer.                                   |
| A small element appearing next to its trigger (menu, popover, tip) | `quick`                          | It travels a handful of pixels and the user is waiting to read it.                                                                                          |
| A panel changing size while it stays on screen                     | `medium`                         | Large enough to be tracked by the eye, nothing to wait for behind it.                                                                                       |
| A dialog or overlay taking the whole screen                        | `medium`                         | It is large, but it is also blocking. Large argues up, blocking argues down, and they meet here.                                                            |
| Anything leaving                                                   | One step below its entrance      | An exit exists to get out of the way. See [easing](#easing).                                                                                                |
| A reflow: things closing a gap left by something that went away    | Same as the thing that went away | It is one event, so it has one duration. See [reflow](/principles/motion/code#reflow-is-part-of-the-event).                                                 |
| A loop                                                             | 900ms to 2000ms, literal         | Fast enough to read as active, slow enough not to flicker. The library's loops are deliberately spread so two on one screen do not beat against each other. |

Both adjustments are bounded by the same ceiling: **nothing the user is waiting on exceeds `--nb-motion-long`**, no matter how large or how far. Past that the animation stops being a transition and starts being a delay.

## Easing

Linear movement of a discrete object looks wrong, because nothing in the physical world starts and stops at full speed. Everything that starts and stops is eased. Everything that never stops is linear.

Press play and watch the four dots against each other. The standard curve is soft at both ends. The enter curve leaves at full speed and settles. The exit curve starts slowly and accelerates away. The linear one is the stutter you are avoiding.

<MotionCurves />

Three curves, emitted beside the durations. They are the productive curves of the Carbon design system, which this library grew out of: nothing in them overshoots, bounces or lingers.

| Token                | Value                             | The element is...                                                                                                                        |
| -------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-ease-standard` | `cubic-bezier(0.2, 0, 0.38, 0.9)` | **On screen before and after.** A width, a height, a knob, a chevron, a tint. Both ends are soft, because nothing appears or disappears. |
| `--nb-ease-enter`    | `cubic-bezier(0, 0, 0.38, 0.9)`   | **Arriving.** Fast at the start, settling at the end. It arrives, then comes to rest where the user is about to look.                    |
| `--nb-ease-exit`     | `cubic-bezier(0.2, 0, 1, 0.9)`    | **Leaving for good.** Slow at the start, accelerating away. It commits to leaving, and the eye is released early.                        |

Three rules on top of the table:

**The exit is a different curve from the enter, and it is shorter.** An exit that decelerates reads as an element that changed its mind, and an exit as long as its entrance is time spent looking at something that is already gone. Every enter and exit in the library is written as two rules, with their own step and curve. The [Usage](/principles/motion/usage#an-exit-is-not-an-entrance-played-backwards) tab shows the right and the wrong version side by side.

**An element that leaves but stays nearby uses the standard curve, not the exit curve.** The inspector closes to zero width beside the page, ready to come back, so it moves on `standard`. A dialog is gone when it closes, so it leaves on `exit`. This is Carbon's one exception to its exit rule and it is the right one.

**Loops are linear.** A loop with easing pulses, and a pulsing progress indicator reads as stuttering work. The stepped timing function under reduced motion is the one deliberate exception, on the [Accessibility](/principles/motion/accessibility) tab.

## Expressive: two moments, never a control

Carbon pairs its productive curves with an expressive set, for movement that is meant to be noticed. This library carries the same expressive curves and Carbon's 700ms step, and gates them hard: they are for **the arrival of a page** and for **a critical alert**, and for nothing else.

| Token                           | Value                             | Use                                                                               |
| ------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `--nb-ease-standard-expressive` | `cubic-bezier(0.4, 0.14, 0.3, 1)` | A page-level surface changing in place, such as a hero area resizing.             |
| `--nb-ease-enter-expressive`    | `cubic-bezier(0, 0, 0.3, 1)`      | A page, or a critical alert, arriving.                                            |
| `--nb-ease-exit-expressive`     | `cubic-bezier(0.4, 0.14, 1, 1)`   | The same alert leaving.                                                           |
| `--nb-motion-slow`              | 700ms                             | Dimming the background behind a critical alert. Never anything a person waits on. |

The rules that keep them rare:

- **Never on a control.** A button, a field, a menu, a tab, a row, a chevron: always productive. A control that moves expressively is a control that feels slow, used all day.
- **Never on something the person is waiting on.** `--nb-motion-long` stays the ceiling for that. `slow` is for a background dimming behind an alert the person has to read anyway, the one place Carbon uses it.
- **One per screen.** If two things on a screen are expressive, neither is. The page arrives expressively once, and everything after that is productive.
- **Not "the nicer curve".** If the reason is that it looks better, it is decoration, and the [three jobs](/principles/motion/usage#the-three-jobs) apply.

Nothing in the library uses them by default. A product that wants a more visible arrival for an error banner or a first-run page reaches for these instead of writing its own `cubic-bezier`.

## Vocabulary

| Term                   | Means                                                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transition**         | Movement between two states of something that stays on screen. A hover tint, a chevron rotating, a rail changing width. Written as `transition`.                |
| **Enter / exit**       | Movement of something arriving in or leaving the document. A menu opening, a toast dismissing. Written as a Vue `<Transition>` with `-enter-*` / `-leave-*`.    |
| **Reflow**             | Movement of things that did not change, caused by something else that did. The toast stack closing a gap. Written with `<TransitionGroup>` and a `-move` class. |
| **Loop**               | Continuous, non-terminating animation. A spinner, a skeleton sweep. It communicates "still happening" and has no end state.                                     |
| **Travel**             | Change in position or size: `translate`, `transform`, `scale`, a growing box. This is the part that triggers vestibular symptoms.                               |
| **Tint**               | Change in colour or opacity only. No travel. This is the part that is safe under reduced motion.                                                                |
| **Vestibular trigger** | Motion that the inner ear reads as self-movement: large travel, parallax, spin, zoom. The actual thing `prefers-reduced-motion` is asking you to remove.        |

The tint / travel split is the most load-bearing distinction on these pages. Almost every reduced-motion decision in this library reduces to "keep the tint, drop the travel".

<!--@include: ./_shared.md-->
