---
layout: nubisco
title: Floating Toolbar
intro: '`NbFloatingToolbar` is a small bar of controls that floats next to something on the page: formatting buttons over a text selection, actions over a selected image, alignment controls over a table cell. It holds ordinary `NbButton`s, places itself with the same flip-and-clamp logic as `NbInfoHint`, and is careful never to take focus from the thing it acts on.'
source: src/components/FloatingToolbar.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Anchoring to a selection

A text selection has a rectangle but no element, which is why `anchor` accepts three shapes:

| Shape                                | Example                                       | Behaviour                                    |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------- |
| An element                           | `buttonEl`                                    | Re-measured on every reposition              |
| A virtual anchor                     | `{ getBoundingClientRect: () => rect }`       | Called on every reposition, so it stays live |
| A plain rectangle in viewport pixels | `{ top, left, width, height }` or a `DOMRect` | A snapshot. Pass a new one when it moves     |

For a selection, a virtual anchor is the one to reach for. The toolbar calls it again on scroll and resize, so it follows the text while the page scrolls under it.

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { TFloatingToolbarAnchor } from '@nubisco/ui'

const open = ref(false)
const anchor = shallowRef<TFloatingToolbarAnchor | null>(null)
const toolbar = ref()

function onSelectionChange() {
  const selection = document.getSelection()
  if (!selection || selection.isCollapsed || !selection.rangeCount) {
    open.value = false
    return
  }
  const range = selection.getRangeAt(0)
  anchor.value = { getBoundingClientRect: () => range.getBoundingClientRect() }
  open.value = true
  toolbar.value?.reposition()
}

onMounted(() => document.addEventListener('selectionchange', onSelectionChange))
onBeforeUnmount(() =>
  document.removeEventListener('selectionchange', onSelectionChange),
)
</script>

<template>
  <NbFloatingToolbar
    ref="toolbar"
    :open="open"
    :anchor="anchor"
    label="Text formatting"
  >
    <NbButton size="sm" variant="ghost" icon="text-b" aria-label="Bold" />
    <NbButton
      size="sm"
      variant="ghost"
      icon="text-italic"
      aria-label="Italic"
    />
  </NbFloatingToolbar>
</template>
```

`open` is entirely yours. The toolbar never opens or closes itself: it reports <kbd>Escape</kbd> through `close` and `update:open`, and your state decides.

## Props

| Prop          | Type                                                            | Default        | Description                                                   |
| ------------- | --------------------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| `open`        | `boolean`                                                       | `false`        | Renders the toolbar.                                          |
| `anchor`      | `Element \| { getBoundingClientRect() } \| IAnchorRect \| null` | `null`         | What the toolbar floats next to. Nothing renders without one. |
| `label`       | `string`                                                        | (required)     | Accessible name of the toolbar.                               |
| `placement`   | `'top' \| 'bottom' \| 'left' \| 'right'`                        | `'top'`        | Preferred side. Flipped and clamped to stay in the viewport.  |
| `gap`         | `number`                                                        | `8`            | Pixels between the anchor and the toolbar.                    |
| `orientation` | `'horizontal' \| 'vertical'`                                    | `'horizontal'` | Layout, arrow-key axis and `aria-orientation`.                |
| `teleportTo`  | `string`                                                        | `'body'`       | Teleport target.                                              |

## Events

| Event         | Payload          | Description                                       |
| ------------- | ---------------- | ------------------------------------------------- |
| `close`       | (none)           | <kbd>Escape</kbd> was pressed inside the toolbar. |
| `update:open` | `value: boolean` | Emitted with `false` alongside `close`.           |

## Slots

| Slot      | Props  | Description                        |
| --------- | ------ | ---------------------------------- |
| `default` | (none) | The controls, usually `NbButton`s. |

## Exposed methods

| Member       | Type                       | Description                                                            |
| ------------ | -------------------------- | ---------------------------------------------------------------------- |
| `reposition` | `() => void`               | Re-reads the anchor and places the toolbar. Call on `selectionchange`. |
| `focus`      | `() => void`               | Moves keyboard focus onto the toolbar's current tab stop.              |
| `el`         | `Ref<HTMLElement \| null>` | The toolbar element while it is rendered.                              |

## Tokens used

| Token                             | Applied to                                 |
| --------------------------------- | ------------------------------------------ |
| `--nb-c-surface`, `--nb-c-border` | Toolbar surface and border (overlay layer) |
| `--nb-c-scrim`                    | Shadow                                     |
| `--nb-radius-*` (popover surface) | Corner rounding                            |
| `--nb-zindex-menu`                | Stacking                                   |
| `--nb-base-unit`                  | Padding and gap                            |

<!--@include: ./_shared.md-->
