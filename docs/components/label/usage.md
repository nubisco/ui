---
layout: nubisco
title: Label
intro: '`NbLabel` is a lightweight label element for associating descriptive text with form controls. Use it standalone or let `NbTextInput` manage it automatically.'
source: src/components/Label.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Required field

<preview>
  <NbLabel for="req-input" required>API key</NbLabel>
  <input id="req-input" type="text" placeholder="sk-..." />
</preview>

## Sizes

<preview>
  <NbLabel size="md">Medium (default): 12px</NbLabel>
  <NbLabel size="sm">Small: 11px, uppercase</NbLabel>
</preview>

## Disabled

<preview>
  <NbLabel disabled>Read-only field</NbLabel>
</preview>
