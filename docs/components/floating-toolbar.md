---
layout: nubisco
title: Floating Toolbar
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbFloatingToolbar` is a small bar of controls that floats next to something on the page: formatting buttons over a text selection, actions over a selected image, alignment controls over a table cell. It holds ordinary `NbButton`s, places itself with the same flip-and-clamp logic as `NbInfoHint`, and is careful never to take focus from the thing it acts on.

Select some text in the paragraph below.

<preview>
  <div style="max-width: 32rem; width: 100%;">
    <p
      ref="editable"
      contenteditable="true"
      style="margin: 0; padding: 12px 16px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface); line-height: 1.6"
    >
      A toolbar that grabs focus collapses the selection it was about to format. Select a few words here and use the buttons: the selection survives, because the toolbar never takes focus.
    </p>
    <NbFloatingToolbar
      :open="selectionOpen"
      :anchor="selectionAnchor"
      label="Text formatting"
      @close="selectionOpen = false"
    >
      <NbButton size="sm" variant="ghost" icon="text-b" aria-label="Bold" @click="format('bold')" />
      <NbButton size="sm" variant="ghost" icon="text-italic" aria-label="Italic" @click="format('italic')" />
      <NbButton size="sm" variant="ghost" icon="text-underline" aria-label="Underline" @click="format('underline')" />
    </NbFloatingToolbar>
  </div>
</preview>

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

## Placement

`placement` is a preference. A toolbar over a selection on the first line of a page has no room above it, so it flips below, then to the sides, and finally clamps itself inside the viewport. When the anchor scrolls entirely out of view the toolbar hides rather than sitting clamped against the edge of the window, acting on text nobody can see.

## Focus

Three rules, all of which exist because the toolbar's main consumer is a text editor:

- **Appearing never moves focus.** The editor keeps the caret and the selection.
- **Pressing a button never moves focus.** The toolbar cancels `mousedown`, which is the event that would focus the button and blur the editor. The `click` still fires. Text fields inside the toolbar (a link URL, say) are exempt, since they genuinely need focus.
- **Keyboard users get in deliberately.** Call the exposed `focus()` from your editor's shortcut (<kbd>Alt</kbd>+<kbd>F10</kbd> is the common one), and return focus to the editor yourself on `close`.

## Keyboard

The toolbar is a single tab stop, following the WAI-ARIA toolbar pattern.

| Key                                   | Does                                            |
| ------------------------------------- | ----------------------------------------------- |
| <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | Next or previous control, wrapping (horizontal) |
| <kbd>&darr;</kbd> / <kbd>&uarr;</kbd> | Next or previous control, wrapping (vertical)   |
| <kbd>Home</kbd> / <kbd>End</kbd>      | First or last control                           |
| <kbd>Tab</kbd>                        | Leaves the toolbar                              |
| <kbd>Esc</kbd>                        | Emits `close`                                   |

Disabled controls are skipped. Arrow keys inside a text field move the caret, not the toolbar.

## Accessibility

- `role="toolbar"`, named by the required `label` and oriented by `aria-orientation`.
- Roving `tabindex` is applied to the slotted controls directly, so plain `NbButton`s work without any extra wiring. It is kept up to date as controls are added, removed or disabled.
- Icon-only buttons need their own accessible name. Pass `aria-label` to each `NbButton`, as in the examples.
- The entrance animation is suppressed under `prefers-reduced-motion: reduce`.

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const editable = ref<HTMLElement | null>(null)
const selectionOpen = ref(false)
const selectionAnchor = shallowRef<{ getBoundingClientRect: () => DOMRect } | null>(null)

function onSelectionChange() {
  const selection = document.getSelection()
  const root = editable.value
  if (
    !root ||
    !selection ||
    selection.isCollapsed ||
    !selection.rangeCount ||
    !root.contains(selection.anchorNode)
  ) {
    selectionOpen.value = false
    return
  }
  const range = selection.getRangeAt(0)
  selectionAnchor.value = { getBoundingClientRect: () => range.getBoundingClientRect() }
  selectionOpen.value = true
}

function format(command: string) {
  document.execCommand(command)
}

onMounted(() => document.addEventListener('selectionchange', onSelectionChange))
onBeforeUnmount(() =>
  document.removeEventListener('selectionchange', onSelectionChange),
)
</script>
