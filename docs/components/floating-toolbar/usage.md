---
layout: nubisco
title: Floating Toolbar
intro: '`NbFloatingToolbar` is a small bar of controls that floats next to something on the page: formatting buttons over a text selection, actions over a selected image, alignment controls over a table cell. It holds ordinary `NbButton`s, places itself with the same flip-and-clamp logic as `NbInfoHint`, and is careful never to take focus from the thing it acts on.'
source: src/components/FloatingToolbar.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

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

## Placement

`placement` is a preference. A toolbar over a selection on the first line of a page has no room above it, so it flips below, then to the sides, and finally clamps itself inside the viewport. When the anchor scrolls entirely out of view the toolbar hides rather than sitting clamped against the edge of the window, acting on text nobody can see.

## Focus

Three rules, all of which exist because the toolbar's main consumer is a text editor:

- **Appearing never moves focus.** The editor keeps the caret and the selection.
- **Pressing a button never moves focus.** The toolbar cancels `mousedown`, which is the event that would focus the button and blur the editor. The `click` still fires. Text fields inside the toolbar (a link URL, say) are exempt, since they genuinely need focus.
- **Keyboard users get in deliberately.** Call the exposed `focus()` from your editor's shortcut (<kbd>Alt</kbd>+<kbd>F10</kbd> is the common one), and return focus to the editor yourself on `close`.

<!--@include: ./_shared.md-->
