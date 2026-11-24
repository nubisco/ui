---
layout: nubisco
title: Code Editor
intro: '`NbCodeEditor` is a field for editing code: SVG, JSON, HTML, CSS, Markdown and anything else Monaco, the editor inside VS Code, can highlight. It has the label, helper and error of every other field, takes its colours from the theme, and grows with its content.'
source: src/components/CodeEditor.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: not recorded
  screenReader: not recorded
---

## Accessibility

- Monaco is the editor in VS Code, and it carries VS Code's screen reader
  support: the content is exposed through a hidden text area that holds the
  focus, and Monaco switches to its screen reader mode when it detects one.
- The field's `label` is that text area's accessible name, and clicking the
  label puts the caret in the editor. `helper`, `error` and `warning` are its
  description, and `error` marks it `aria-invalid`.
- **Tab inserts a tab character inside the editor**, as in any code editor.
  To move focus out with Tab instead, press Ctrl+M (Ctrl+Shift+M on macOS)
  to toggle Tab moving focus, as in VS Code. Say so near the editor wherever
  people who move by keyboard are expected.
- The focus ring is the field's own, drawn around the whole box.
- Without Monaco the field is a native `<textarea>` with the same label and
  description, where Tab moves focus as usual.
