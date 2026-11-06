---
layout: nubisco
title: Motion
intro: 'Motion is the only part of this system that costs the user time. Every animation has to buy back the time it spends, and most of them do not. This page is what movement is allowed to mean here, shown moving. Switch any demo to slow motion to see what the eye normally only feels.'
tab: accessibility
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

`prefers-reduced-motion: reduce` is set by users who get nauseated, dizzy or disoriented by on-screen movement. It is a vestibular accommodation, not a preference for a quieter aesthetic, and it is not a request to turn the interface off. The library honours it everywhere by default, from the operating system or browser setting, with no switch of its own.

::: danger The rule
**Reduced motion removes the travel. It never removes the feedback.**

Under the preference, a component must still answer the same question it answered before. A spinner must still say "working". A skeleton must still say "loading". A toast must still say "this arrived". A drawer must still be seen to open. What goes away is the movement through space that says it: the slide, the spin, the sweep, the zoom, the width change.

Blanket `* { animation: none !important; transition: none !important; }` fails this rule in the worst possible way. It freezes every loading indicator into a static shape that reads as a hung interface, so the user with the accommodation gets a broken product instead of a calm one. Do not set the motion tokens to `0` for the same reason.
:::

## The four fallbacks, and the one mistake

Flip the switch. Every reduced-motion handler in this library is one of the four patterns below, and yours should be too. The fifth tile is what a blanket rule does to the same spinner.

<MotionReduced />

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

## Keep or drop

| Under `prefers-reduced-motion: reduce`                 | Keep or drop | Why                                                                      |
| ------------------------------------------------------ | ------------ | ------------------------------------------------------------------------ |
| Travel: translate, slide, scale, rotate, width, height | Drop         | This is the trigger.                                                     |
| Tint: colour, background, border, opacity crossfade    | Keep         | No spatial movement, no vestibular effect, and it carries the causality. |
| The fact that a loading indicator is animating at all  | Keep         | A frozen indicator means "hung", which is a different and false message. |
| Smooth scrolling                                       | Drop         | Programmatic scroll is large-field travel, the worst offender.           |
| Progress and countdown information                     | Keep         | It is data. Change how it moves, not whether it is there.                |
| Hover and press feedback on controls                   | Keep         | It is a tint, and the control is still seen to respond.                  |

## Writing it

Every component writes the preference the same way, through one mixin, and so does a product. `tests/motion-conformance.test.ts` fails the build on a raw `@media (prefers-reduced-motion)` anywhere in the library, so a grep for `motion.reduced` finds every handler. The [surface mixins](/principles/motion/code#the-surfaces-popover-dialog-disclosure) write this block for you.

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

## A preference that flips mid-session

The media query reacts live, so a transition that is purely CSS follows the setting the moment it changes. Script that has to decide (a scroll behaviour, a timer) reads `prefersReducedMotion()` at the moment it decides, or `useReducedMotion()` when it needs to react. The rail's label switch, `NbBackToTop`'s scroll and `NbVideo`'s autoplay all read it that way, so each is right from the next click.

## See also

- [Accessibility overview](/accessibility/overview) for where reduced motion sits among the other obligations.
- [Loading](/patterns/loading) for the indicators whose reduced-motion forms are described above.

<!--@include: ./_shared.md-->
