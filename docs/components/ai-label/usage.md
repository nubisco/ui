---
layout: nubisco
title: AI Label
intro: 'The AI label marks content a model wrote or changed. It is present wherever that content appears, and when there is something to say about how the content was made, it opens to say it.'
source: src/components/AiLabel.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Live Demo

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbAiLabel v-bind="resultingProps" />
</preview>

## When to use it

Use the label on anything a language model produced or changed: a summary, a suggested title, a drafted reply, a field the model filled in. Use it only for that. Automation with no model in it (an import, a webhook, a scheduled job) is not AI and does not get the label.

## A mark or a control

The label decides for itself which one it is.

- **A mark** when there is nothing to open. It renders as an image named "Written by AI", with no hover and no focus stop. This is the right form beside a heading or a block of prose.
- **A control** when there is something to open: an explanation (`explain` or the `#explain` slot), actions (`#actions`), the plain version (`plain-available`), or a click listener. It is then a button named "AI, show information".

There is no way to render a button that does nothing, on purpose.

## What the explanation says

The fleet rule for AI features is that code decides the facts and the model only writes the words. The explanation is where that becomes visible to the person reading, so build it from what the product computed, never from what the model says about itself:

1. **Inputs.** The facts the product gave the model: which items, which people, which numbers, over which period.
2. **Provider and model.** Which provider and which model phrased it.
3. **The fallback.** Whether the plain rendering was used instead, and why (`fallbackReason`: no key configured, the provider failed, the check rejected the output).
4. **Actions.** Open the underlying records, show the plain version, change the settings.

**Never show a model-reported confidence.** A model's estimate of its own accuracy is more model output, and it is not checked against anything. Under the fleet rule the only confidence that means something is binary and decided by code: the output passed the check against the facts, or the plain version was used. Say that instead.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <strong>Weekly summary</strong>
    <NbAiLabel size="sm" plain-available>
      <template #explain>
        <p><strong>Built from</strong> 14 tasks, 3 goals and 2 people the product selected for this week.</p>
        <p><strong>Phrased by</strong> the workspace's provider and model, then checked: every task it names is in that list.</p>
        <p>The plain version is the same facts without the model.</p>
      </template>
    </NbAiLabel>
  </NbGrid>
</preview>

## Revert

AI content can be undone in two ways, and both should be offered where they apply.

- **Back to the AI value.** When a person edits a value the model filled in, the AI styling no longer describes it. Set `revertable` and the label becomes an undo button named "Revert to AI input". On `revert`, restore the AI value and clear `revertable`.
- **To the plain version.** A Nubisco AI feature always has a plain rendering of the same facts. Set `plain-available` and the explanation offers "Show the plain version", which emits `show-plain`.

## Placement

Place the label where the AI content is, in the same spot every time.

| Host                          | Where the label goes                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Container (card, tile, panel) | Upper right corner, inside the padding. `NbCard` has a `decorator` slot for it.                  |
| Text input and other fields   | Inside the field, on the right, vertically centred. `NbTextInput` has a `decorator` slot for it. |
| A group of icons              | At the far left of the group, so the actions keep their places.                                  |
| Heading or block of prose     | Right after the heading text, as the mark.                                                       |
| Data table, whole table       | Beside the table title.                                                                          |
| Data table, one column        | In the column header, after the header text.                                                     |
| Data table, one row           | In the row's first cell, before the content.                                                     |
| Data table, one cell          | In the cell, after the value.                                                                    |

## Visibility levels

- **Focused.** One label on each piece of AI content. Use it when AI content is mixed with human content and a person has to tell them apart.
- **Broad.** One label on the section that holds the AI content, summarising it. Use it when everything in the section came from the same feature, for example a settings panel for AI briefings.
- **Both.** A broad label on the section, and focused labels where the explanation differs between items.

## Do and do not

- **Do** label every place AI content appears, including copies of it in notifications and exports where the format allows.
- **Do not** use the label as decoration, as an "AI-powered" badge on a feature, or on anything a model did not touch.
- **Do not** use the label as a trigger for "regenerate" or any other action that runs the model. It explains and reverts, nothing else. Put regenerate on its own button.
- **Do not** disable the label. If the explanation has nothing to say yet, render the mark.
- **Do not** add behaviours of your own to it (a menu, a link, a toggle). If a host needs more, it needs a separate control.

<!--@include: ./_shared.md-->
