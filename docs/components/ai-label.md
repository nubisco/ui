---
layout: nubisco
title: AI Label
tabs: ['Usage']
---

<doc-tab name="Usage">

The AI Label should be present whenever there's AI content in the UI: a string a model wrote or changed, or any other element that came directly from AI.

## Live Demo

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbAiLabel v-bind="resultingProps" />
</preview>

## A mark or a control

By default the label is a button, for a place where clicking it explains what the AI did. Beside a heading or a block of text that AI wrote, there is nothing to click, so render it as a mark with `static`. It becomes a `span` announced as an image, with no hover or focus state, named by `label` (default "Written by AI").

```vue
<h2>
  AI briefings
  <NbAiLabel static size="sm" />
</h2>
```

</doc-tab>

<script lang="ts" setup>
import type { PreviewPropDef } from '../.vitepress/components/Preview.d'

const availableProps: PreviewPropDef[] = [
  {
    name: 'variant',
    type: 'single',
    label: 'Variant',
    placeholder: 'Variant of the component',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'inline', label: 'Inline' },
    ],
  },
  {
    label: 'Static',
    name: 'static',
    type: 'boolean',
    placeholder: 'Render a mark instead of a button',
    default: false,
  },
]
</script>
