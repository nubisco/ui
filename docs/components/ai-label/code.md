---
layout: nubisco
title: AI Label
intro: "The AI Label should be present whenever there's AI content in the UI: a string a model wrote or changed, or any other element that came directly from AI."
source: src/components/AiLabel.vue
tab: code
pageTabs: ['usage', 'code']
---

## A mark or a control

By default the label is a button, for a place where clicking it explains what the AI did. Beside a heading or a block of text that AI wrote, there is nothing to click, so render it as a mark with `static`. It becomes a `span` announced as an image, with no hover or focus state, named by `label` (default "Written by AI").

```vue
<h2>
  AI briefings
  <NbAiLabel static size="sm" />
</h2>
```

<!--@include: ./_shared.md-->
