---
layout: nubisco
title: Motion
intro: 'Motion is the only part of this system that costs the user time. Every animation has to buy back the time it spends, and most of them do not. This page is what movement is allowed to mean here, shown moving. Switch any demo to slow motion to see what the eye normally only feels.'
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

A colour is read instantly, a spacing step is read instantly, and a 300ms slide is 300ms the user spends waiting to find out what happened. That is the whole economics of motion: it earns its place only by answering a question the still frame cannot answer. Where did this come from. What did my click do. Is anything still happening. Three questions, three jobs, nothing else on the list.

The library moves on one scale and one family of curves ([Style](/principles/motion/style)), declared once and read everywhere ([Code](/principles/motion/code)). The reduced-motion preference is honoured in every component without the product doing anything ([Accessibility](/principles/motion/accessibility)).

## The three jobs

Motion in a Nubisco application is doing one of exactly three things. If you cannot name which, you have decoration.

<preview dir="row" gap="lg">
  <div style="display: grid; gap: 12px; justify-items: start; min-width: 180px;">
    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--nb-c-text-secondary);">Continuity</strong>
    <NbButton ref="jobTrigger" size="sm" variant="secondary" @click="openJobMenu">Actions</NbButton>
    <NbMenu ref="jobMenu" v-model:open="jobMenuOpen" @close="jobMenuOpen = false">
      <NbMenuItem label="Duplicate" @select="jobMenuOpen = false" />
      <NbMenuItem label="Archive" @select="jobMenuOpen = false" />
      <NbMenuItem label="Delete" @select="jobMenuOpen = false" />
    </NbMenu>
    <span style="font-size: 12px; color: var(--nb-c-text-secondary);">The menu rises 4px from the button it belongs to, and fades straight out.</span>
  </div>
  <div style="display: grid; gap: 12px; justify-items: start; min-width: 180px;">
    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--nb-c-text-secondary);">Causality</strong>
    <NbSwitch v-model="jobSwitch" label="Notifications" />
    <NbCheckbox v-model="jobCheck" label="Remember me" />
    <span style="font-size: 12px; color: var(--nb-c-text-secondary);">The knob travels and the track tints, so the click is seen to be the cause.</span>
  </div>
  <div style="display: grid; gap: 12px; justify-items: start; min-width: 180px;">
    <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--nb-c-text-secondary);">Feedback</strong>
    <NbSpinner label="Loading" />
    <NbSkeleton :lines="2" type="body-md" style="width: 160px;" />
    <NbProgressBar label="Importing" hide-label style="width: 160px;" />
    <span style="font-size: 12px; color: var(--nb-c-text-secondary);">Each one says "still happening", and nothing else.</span>
  </div>
</preview>

| Job            | The question it answers                                 | Shipped example                                                                                                                       |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Continuity** | Where did this come from, and where does it go back to? | `NbMenu` rises 4px from the trigger it belongs to. `NbToaster` slides in from the edge it is anchored to, and leaves back through it. |
| **Causality**  | Did my input do anything?                               | Every control tints on hover and press. The rail's labels fade as it narrows, so the collapse is seen to be the thing the click did.  |
| **Feedback**   | Is anything still happening?                            | `NbSpinner` rotates. `NbSkeleton` sweeps. `NbProgressBar` fills. `NbToast` runs a countdown bar showing how long it will stay.        |

### What motion is not for

It is not for delight, polish, brand expression or making a screen feel alive. Those are the reasons motion gets added to products that then feel slow. The reference is Carbon's: motion should be **purposeful**, **responsive**, **meticulous** and **unobtrusive**, and if the average user notices it often, there is too much of it.

## An exit is not an entrance played backwards

Open and close both cards a few times. The left one is how every dialog, popover and drawer in the library is written. The right one is the mistake most products ship.

<MotionEnterExit />

Two things are wrong on the right, and both are common. The exit uses the entrance's curve, so the card decelerates on its way out and reads as an element that changed its mind. And the travel is too large: a dialog that zooms from 0.8 is a dialog whose text is unreadable for the first half of its entrance. The library's dialogs scale from 0.96 and rise 8px, which is just enough to say "arrived" without the user having to wait to read it.

The rule, in two halves. **The exit is a different curve from the enter, and it is shorter**: an exit exists to get out of the way, and the eye is released early. **An element that leaves but stays nearby uses the standard curve instead**: the inspector closes to zero width beside the page, ready to come back, so it moves on `standard`, and a dialog is gone when it closes, so it leaves on `exit`.

## One event, one timing

Everything that moves because of the same click shares a step and a curve. Open the dialog: the scrim and the content move together, on `medium` and `enter`, so the whole thing reads as one surface arriving rather than a backdrop plus a box.

<preview>
  <NbButton variant="secondary" @click="modalOpen = true">Open a dialog</NbButton>
  <NbModal :open="modalOpen" title="Rename workspace" @close="modalOpen = false">
    <p style="margin: 0">The scrim fades and the content scales from 0.96 and rises 8px, on the same step and curve. Close it and both leave on the exit curve, in less time.</p>
    <template #footer>
      <NbButton variant="ghost" @click="modalOpen = false">Cancel</NbButton>
      <NbButton variant="primary" @click="modalOpen = false">Rename</NbButton>
    </template>
  </NbModal>
</preview>

The corollary: **do not stagger a container against its own contents.** If a panel slides in and its heading fades in 100ms later, you have built two events out of one and added 100ms to the time before the panel is readable.

Direction is part of the same idea. An element that arrives from the wrong edge tells the user it came from somewhere it did not. Every popover travels toward the thing that opened it, and a toast enters from the edge it is anchored to and leaves back through it ([Toaster](/components/toaster/usage)).

## The application frame

`NbShell` is where motion is most visible, because the frame is the largest thing on screen and the user operates it all day. The three buttons in the top bar toggle the rail, the console and the inspector.

<preview>
  <DemoFrame :height="420">
    <NbShell
      :sidebar-variant="railVariant"
      :inspector-visible="frameInspector"
      inspector-size="xs"
      topbar="always"
      style="height: 100%"
    >
      <template #sidebar-logo>
        <NbSidebarBrand icon="shield-check" title="Product" subtitle="Workspace" />
      </template>
      <template #sidebar-nav>
        <NbSidebarMenu>
          <NbSidebarMenuItem icon="house" label="Home" href="#the-application-frame" active />
          <NbSidebarMenuItem icon="pulse" label="Activity" href="#the-application-frame" badge="3" />
          <NbSidebarMenuItem icon="target" label="Goals" href="#the-application-frame" />
          <NbSidebarMenuGroup label="Workspace">
            <NbSidebarMenuItem icon="chart-line" label="Reports" href="#the-application-frame" />
            <NbSidebarMenuItem icon="gear" label="Settings" href="#the-application-frame" />
          </NbSidebarMenuGroup>
        </NbSidebarMenu>
      </template>
      <template #topbar-right>
        <NbButton size="sm" variant="ghost" @click="railVariant = railVariant === 'verbose' ? 'compact' : 'verbose'">Rail</NbButton>
        <NbButton size="sm" variant="ghost" @click="framePanel = framePanel === 'collapsed' ? 'default' : 'collapsed'">Console</NbButton>
        <NbButton size="sm" variant="ghost" @click="frameInspector = !frameInspector">Inspector</NbButton>
      </template>
      <p style="margin: 0; color: var(--nb-c-text-secondary); font-size: 13px;">
        The rail's width moves on the medium step and its labels fade on the quick step, so the rail is never narrow with text still in it. The inspector slides beside the page on the standard curve, because it is not leaving. The console folds to its header on the medium step.
      </p>
      <template #bottom>
        <NbShellPanel v-model:size="framePanel" title="Console">
          <div style="padding: 0.75rem 1rem; font-family: var(--nb-font-mono, monospace); font-size: 0.8125rem; color: var(--nb-c-text-secondary);">
            <div>> ready in 127ms</div>
          </div>
        </NbShellPanel>
      </template>
      <template #inspector>
        <div style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem;">Properties</h4>
          <p style="margin: 0; color: var(--nb-c-text-secondary); font-size: 0.875rem;">Closes to zero width beside the page, ready to come back.</p>
        </div>
      </template>
    </NbShell>
  </DemoFrame>
</preview>

The rail's collapse has an order, and the component keeps it. On the way down the labels fade first and the rows keep their verbose layout until the width has settled, because switching them at once would centre every icon in a rail that is still wide. On the way up the rows switch at once and the labels are revealed by the widening edge. This is the one place the library sequences a container and its contents, and it does so in the direction that keeps the rail readable.

## Controls

Small things move on small steps. A control's motion is there to confirm the click, and it is over before the user has finished looking.

<preview dir="col" gap="lg">
  <NbTabs v-model="controlTab" :items="controlTabs" aria-label="Motion controls" style="max-width: 420px;" />
  <div style="max-width: 420px; width: 100%;">
    <NbAccordion>
      <NbAccordionItem title="A section that opens on the medium step">
        Its height is animated as grid tracks, and the chevron turns on the quick step.
      </NbAccordionItem>
      <NbAccordionItem title="A tree's children do not animate">
        They are data, and a list that animates is a list you cannot read until it finishes.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

The tab bar's active mark is one element that slides to the chosen tab, so the eye follows the selection rather than seeing one mark vanish and another appear. The accordion's section grows on the medium step. Each is in the [catalogue](/principles/motion/code#the-catalogue) with its step and curve.

## We do not stagger lists

Staggered list entrances are the most-cited technique in motion writing and this library ships none of them, on purpose. Our lists are data tables, log rows, tree nodes and query results. A staggered table is a table you cannot read until it finishes, and the user opened it to read it. When content arrives progressively, show its structure immediately with `NbSkeleton`, and do not animate the swap: a cross-fade between a placeholder and real content produces a moment where both are half-visible and neither is legible.

## Before you write an animation

1. **Which of the three jobs is this?** Continuity, causality or feedback. If none, delete it.
2. **Is anything else moving because of the same event?** Then it shares this step and this curve, and the reflow shares it too.
3. **Which step?** Work down the [table](/principles/motion/style#choosing-a-step). If you write a literal, it is a loop, and the reason goes above it.
4. **Which curve?** On screen before and after: `standard`. Arriving: `enter`. Leaving for good: `exit`. Leaving but staying nearby: `standard`. Looping: `linear`.
5. **Is the exit shorter than the enter, on its own curve?** Two rules, not one.
6. **Does it carry travel?** Then it needs an `@include motion.reduced` block, and that block keeps the fade.
7. **Does it still say the same thing with the animation removed?** If a user with reduced motion cannot tell what happened, the animation was carrying meaning that should have been in the still frame.

<!--@include: ./_shared.md-->
