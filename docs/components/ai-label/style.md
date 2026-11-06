---
layout: nubisco
title: AI Label
intro: 'The AI label marks content a model wrote or changed. It is present wherever that content appears, and when there is something to say about how the content was made, it opens to say it.'
source: src/components/AiLabel.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Sizes

The default label is a square on the base unit: `sm` 24px, `md` 32px (the default), `lg` 40px. The glyph is half the square. Match it to the control height it sits beside: `sm` next to small controls and in headings, `md` next to fields, `lg` on large tiles.

<preview dir="row" gap="xl" align="center">
  <NbAiLabel size="sm" />
  <NbAiLabel size="md" />
  <NbAiLabel size="lg" />
</preview>

The inline label is a dot and a word, set in 12, 14 or 16px type for `sm`, `md` and `lg`. Pair it with text of the same size. The word is `text` (default "AI"), so it localises: "IA", "KI". An empty `text` draws the glyph instead.

<preview dir="row" gap="xl" align="center">
  <NbAiLabel variant="inline" size="sm" />
  <NbAiLabel variant="inline" size="md" />
  <NbAiLabel variant="inline" size="lg" text="IA" />
</preview>

## Colour

The label has no colour of its own. Its border, text and hover come from `--nb-c-border`, `--nb-c-contrast` and `--nb-c-surface`, and its focus ring from `--nb-c-focus-ring`, so it is right in both modes and in any named theme without AI-specific tokens.

## AI presence

For a container whose whole content came from AI, add the class `nb-ai-presence`. It paints two things, both as pseudo-elements so the container keeps its own background and border:

- **A wash** rising from the bottom edge to the middle, `--nb-c-ai-aura`: the primary at 8% toward transparent.
- **An edge** running from `--nb-c-ai-border-start` (the primary at 50% toward the container's border) at the top to `--nb-c-ai-border-end` (the border itself) at the bottom.

<preview dir="row" gap="lg">
  <NbCard class="nb-ai-presence" title="Weekly summary" subtitle="Generated this morning">
    <template #decorator><NbAiLabel size="sm" explain="Phrased by a model from facts the product computed." /></template>
    Four tasks closed, two moved to review, one goal reached.
  </NbCard>
  <NbCard title="Weekly summary" subtitle="Written by a person">
    Four tasks closed, two moved to review, one goal reached.
  </NbCard>
</preview>

The presence is a hint, not the label. Use it together with the label, never instead of it, and only on containers: a card, a tile, a panel.

### Theming

Every presence token is derived from `--nb-c-primary`, never a fixed hue, so a named theme or a white-label palette gets its own accent in the wash and the edge. The tokens are emitted at `:root`, in the dark scope, in every `[data-nb-theme]` scope and on `.nb-ai-presence` itself. That last one is what lets the edge follow the layer the container sits on: a custom property built from `var()` freezes to the element that declares it.

### Contrast

The wash is kept small so it never costs legibility, and a test measures it. Composited at its strongest over every layer and hover surface, primary text stays at AAA in both modes and muted text stays at AAA in light. Dark muted text is already at 7.01 on the deepest hover surface with no wash, so any tint takes it under AAA. The wash keeps it at 6.5 or better there.

<!--@include: ./_shared.md-->
