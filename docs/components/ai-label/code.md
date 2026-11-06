---
layout: nubisco
title: AI Label
intro: 'The AI label marks content a model wrote or changed. It is present wherever that content appears, and when there is something to say about how the content was made, it opens to say it.'
source: src/components/AiLabel.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## A mark

With nothing to open, the label is a mark: a `span` with `role="img"`, named by `label` (default "Written by AI").

```vue
<h2>
  AI briefings
  <NbAiLabel size="sm" />
</h2>
```

## An explanation

`explain` takes plain text. The `#explain` slot takes rich content, and `#actions` adds a row of actions under it. Any of them makes the label a button that opens the explanation.

```vue
<template>
  <NbAiLabel
    size="sm"
    :plain-available="report.hasPlain"
    @show-plain="usePlain = true"
  >
    <template #explain>
      <p>
        <strong>Built from</strong> {{ report.facts.tasks }} tasks and
        {{ report.facts.goals }} goals.
      </p>
      <p>
        <strong>Phrased by</strong> {{ report.provider }}, {{ report.model }}.
      </p>
      <p v-if="report.fallbackReason">
        The plain version was sent: {{ report.fallbackReason }}.
      </p>
    </template>
    <template #actions>
      <NbButton variant="ghost" size="sm" @click="openFacts">
        See the facts
      </NbButton>
    </template>
  </NbAiLabel>
</template>
```

## Revert after an edit

The host keeps the AI value and knows when a person has changed it. While they differ, set `revertable`: the label becomes an undo button, and `revert` asks the host to put the AI value back.

```vue
<template>
  <NbTextInput v-model="title" label="Title">
    <template #decorator>
      <NbAiLabel
        size="sm"
        :revertable="title !== suggested"
        explain="Suggested by a model from the task's description."
        @revert="title = suggested"
      />
    </template>
  </NbTextInput>
</template>
```

## On a card

`NbCard` has the same `decorator` slot, in the upper right corner. A click on the label does not activate a clickable card. Add `nb-ai-presence` to the card for the presence treatment.

```vue
<NbCard class="nb-ai-presence" title="Weekly summary">
  <template #decorator>
    <NbAiLabel size="sm" :explain="explanation" />
  </template>
  {{ summary }}
</NbCard>
```

## Props

| Prop               | Type                                     | Default                                                  | Description                                                    |
| ------------------ | ---------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `variant`          | `'default' \| 'inline'`                  | `'default'`                                              | A bordered square with the glyph, or a dot and a word.         |
| `size`             | `'sm' \| 'md' \| 'lg'`                   | `'md'`                                                   | 24, 32 or 40px square, or 12, 14 or 16px type inline.          |
| `label`            | `string`                                 | "AI, show information" (control), "Written by AI" (mark) | Accessible name.                                               |
| `text`             | `string`                                 | `'AI'`                                                   | The inline word. Empty draws the glyph.                        |
| `explain`          | `string`                                 |                                                          | Plain-text explanation. Makes the label a button.              |
| `placement`        | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'`                                               | Preferred side of the explanation. It flips to stay on screen. |
| `teleport-to`      | `string`                                 | `'body'`                                                 | Where the explanation is teleported.                           |
| `revertable`       | `boolean`                                | `false`                                                  | The AI value was edited: render the undo button.               |
| `revert-label`     | `string`                                 | "Revert to AI input"                                     | Accessible name of the undo button.                            |
| `plain-available`  | `boolean`                                | `false`                                                  | Offer the plain version in the explanation.                    |
| `show-plain-label` | `string`                                 | "Show the plain version"                                 | Text of that action.                                           |
| `static`           | `boolean`                                | `false`                                                  | Always the mark, whatever it is given.                         |

## Slots

| Slot      | Description                    |
| --------- | ------------------------------ |
| `explain` | Rich explanation content.      |
| `actions` | Actions under the explanation. |

## Events

| Event        | Payload | Description                                          |
| ------------ | ------- | ---------------------------------------------------- |
| `open`       |         | The explanation opened.                              |
| `close`      |         | The explanation closed.                              |
| `revert`     |         | The undo button was activated. Restore the AI value. |
| `show-plain` |         | The plain-version action was activated.              |

## Exposed

`open()`, `close(returnFocus?)` and `isOpen`, for a host that has to open the explanation itself.

<!--@include: ./_shared.md-->
