---
layout: nubisco
title: AI Briefings
intro: "A briefing is an agent a product runs: it reads the product's own data, has AI write it up (or sends the plain version), and posts it somewhere. Four components build the one settings tab every product uses for them, so the tab reads the same in each."
tab: usage
pageTabs: ['usage', 'accessibility']
---

- `NbAiProvider`: the provider, the model and the write-only key, with the AI
  mark in its heading.
- `NbAiUsage`: what has been asked of the provider, in tokens and estimated
  cost, with the same rounding everywhere.
- `NbBriefing`: one briefing. A switch to run it, a switch for AI writing,
  the product's own settings in the default slot, its destinations, and a
  preview beside them.
- `NbBriefingDestination`: one place it goes (Slack, email or a webhook),
  with its icon, what it is set to, a test button, and its own settings.

```vue
<template>
  <div class="ai-tab">
    <NbAiProvider
      v-model:provider="provider"
      v-model:model="model"
      v-model:api-key="apiKey"
      :default-models="defaults"
      :has-key="hasKey"
      @save="save"
      @remove="removeKey"
    >
      <p>Bring your own provider key. What is sent is ...</p>
    </NbAiProvider>
    <NbAiUsage
      :has-key="hasKey"
      v-bind="usage"
      requests-label="Reports written"
    />
  </div>

  <NbBriefing
    v-model:enabled="report.enabled"
    v-model:ai-writing="report.aiWriting"
    title="Daily report"
    status="Next: tomorrow at 09:00"
  >
    <template #description
      ><p>Once a working day, one Slack message.</p></template
    >
    <!-- the schedule: the product's own fields -->
    <template #destinations>
      <NbBriefingDestination
        kind="slack"
        summary="#general"
        configured
        :testing="testing"
        @test="sendTest"
      >
        <!-- the webhook, the member ids -->
      </NbBriefingDestination>
    </template>
    <template #actions
      ><NbButton @click="preview">Preview now</NbButton></template
    >
    <template #preview>
      <pre>{{ previewText }}</pre>
    </template>
  </NbBriefing>
</template>
```

## Picking a model from a list

Pass `models` (a list per provider, `{ label, value }`) and the model becomes
a choice from that list instead of free text, so a mistyped id can never be
saved. Nubisco's own deployments get the list from Accord
(`GET /api/m2m/ai-models`). Leave `models` out where there is no list, such as
a product running on its own, and the field stays free text.

```vue
<NbAiProvider
  v-model:provider="provider"
  v-model:model="model"
  v-model:api-key="apiKey"
  :default-models="{ anthropic: 'claude-haiku-5-5' }"
  :models="{
    anthropic: [
      { label: 'Claude Haiku 5.5', value: 'claude-haiku-5-5' },
      { label: 'Claude Sonnet 5.5', value: 'claude-sonnet-5-5' },
    ],
  }"
  :has-key="hasKey"
  @save="save"
/>
```

Clearing the choice means the default, which the empty choice names
("Default: Claude Haiku 5.5"). A provider without a list keeps free text. A
saved model the list does not have (typed before the list existed, or since
retired) stays in the list, marked "not in the list", so opening the page
never drops it unseen.

## Layout

`NbAiProvider` and `NbAiUsage` sit side by side on a desktop: lay them out
in a two-column grid in the page. Inside `NbBriefing` the settings take a
form's measure and the preview sits beside them once the panel is 900px
wide, one column below that. It is a container query, so it follows the
panel, not the window.

## Rules the components keep

- With a model list, the model is chosen, never typed.
- The key is never shown: a stored key is a placeholder, and Remove key
  appears only when there is one.
- Usage says nothing has been sent until a key exists, so the panel is never
  an empty box.
- A destination that is not set up cannot be tested.
