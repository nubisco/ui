---
layout: nubisco
title: AI Label
intro: "The AI Label should be present whenever there's AI content in the UI: a string a model wrote or changed, or any other element that came directly from AI."
source: src/components/AiLabel.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Live Demo

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbAiLabel v-bind="resultingProps" />
</preview>

<!--@include: ./_shared.md-->
