---
layout: nubisco
title: Walkthrough
intro: '`NbWalkthrough` is a guided product tour (coach-marks): it dims the screen, spotlights one element at a time, and shows a popover with a description and controls. Use it to teach first-time users the shape of the application, where the navigation lives, what the views are for, where the common controls sit.'
source: src/components/Walkthrough.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

The tour is described by a plain, versioned object and driven by the [`useWalkthrough`](/composables/use-walkthrough) composable. The component is a thin renderer over that state machine, which is what lets the same tour be started from a template, a help menu, or a router guard.

## Live demo

Press **Start the tour**. Use <kbd>Tab</kbd> to move between the controls, and <kbd>Escape</kbd> to skip.

<preview dir="col">
  <NbGrid dir="col" gap="md" style="width: 100%">
    <NbGrid dir="row" gap="sm" align="center">
      <NbButton v-nb-tour-step="'demo-start'" @click="demoTour.restart()">Start the tour</NbButton>
      <span style="color: var(--nb-c-text-muted)">Last event: <code>{{ demoEvent }}</code></span>
    </NbGrid>
    <NbGrid dir="row" gap="md" align="stretch" style="width: 100%">
      <div v-nb-tour-step="'demo-nav'" style="flex: 0 0 140px; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Navigation</strong>
      </div>
      <div v-nb-tour-step="'demo-content'" style="flex: 1; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Content</strong>
      </div>
      <div v-nb-tour-step="'demo-actions'" style="flex: 0 0 140px; padding: 12px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)">
        <strong>Actions</strong>
      </div>
    </NbGrid>
  </NbGrid>
  <NbWalkthrough
    :controller="demoTour"
    @finish="demoEvent = 'finish'"
    @skip="demoEvent = 'skip'"
    @step-change="(step, index) => (demoEvent = `step-change ${index}`)"
  />
</preview>

## Defining a tour in an SFC block

An SFC `<walkthrough>` custom block co-located with the component it describes is appealing DX, but it is **not** the supported interface. The object and composable API above is the portable one: it works in plain TypeScript, in tests, and in apps that assemble tours at runtime. If co-location is worth it for your codebase, add a Vite plugin that compiles the custom block into exactly the `IWalkthrough` object shown above, so it stays sugar over the supported API rather than a second implementation with its own behaviour.

<!--@include: ./_shared.md-->
