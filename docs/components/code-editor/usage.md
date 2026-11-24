---
layout: nubisco
title: Code Editor
intro: '`NbCodeEditor` is a field for editing code: SVG, JSON, HTML, CSS, Markdown and anything else Monaco, the editor inside VS Code, can highlight. It has the label, helper and error of every other field, takes its colours from the theme, and grows with its content.'
source: src/components/CodeEditor.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## When to use it

Use it wherever a person edits code or markup that the product then uses: the
SVG of a diagram, a JSON configuration, a template, a stylesheet. It gives them
what they expect from an editor (highlighting, line numbers, find, multiple
cursors, bracket matching, undo) without the product building any of it.

<preview>
  <NbCodeEditor v-model="svg" language="xml" label="Drawing (SVG)" helper="Needs a viewBox." />
</preview>

Use `NbTextInput` with `multiline` for prose, and for a value of a line or two.
An editor's gutter and monospace type are noise around a sentence.

## Show the result next to the code

Code is rarely the point. Wherever it produces something visible, show that
first and the code second, so a person who does not read SVG can still see
what changed. Folding the code under an `NbAccordionItem` beneath the result is
a good default.

## Height

The editor starts at `rows` lines, grows with its content up to `max-rows`, and
scrolls after that. Set both to the same number for a box that never moves the
layout around it.

## Without Monaco

`monaco-editor` is an optional dependency, loaded only when an editor is on
screen. Where it is not installed, or fails to load, the field is a plain
monospace text area with the same label and messages, so the content can still
be edited.

<!--@include: ./_shared.md-->
