---
layout: nubisco
title: Code Editor
intro: '`NbCodeEditor` is a field for editing code: SVG, JSON, HTML, CSS, Markdown and anything else Monaco, the editor inside VS Code, can highlight. It has the label, helper and error of every other field, takes its colours from the theme, and grows with its content.'
source: src/components/CodeEditor.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Setup

Monaco is an optional peer dependency, so install it in the app that uses the
editor:

```sh
pnpm add monaco-editor
```

Monaco does part of its work in web workers, and the app supplies them. With
Vite, import each worker with `?worker` and hand them to Monaco once, before
the first editor mounts (in `main.ts`):

```ts
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
// Only for the languages that have a language service:
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker'

self.MonacoEnvironment = {
  getWorker: (_id: string, label: string) =>
    label === 'json' ? new JsonWorker() : new EditorWorker(),
}
```

Write the `.js` extension: Vite does not resolve these worker paths without
it. The CSS, HTML and
TypeScript workers are at
`monaco-editor/language/{css,html,typescript}/{css,html,ts}.worker.js`. Without a
`MonacoEnvironment`, Monaco falls back to running that work on the main thread,
and says so in the console.

Monaco is loaded on the editor's first mount and lands in its own chunk, so a
page without an editor never downloads it. An offline app (a service worker
precache) should leave that chunk out of the precache unless the editor has to
work offline: it is several megabytes.

## Basic usage

<preview>
  <NbCodeEditor v-model="json" language="json" label="Settings" />
</preview>

```vue
<template>
  <NbCodeEditor
    v-model="settings"
    language="json"
    label="Settings"
    helper="Saved when you leave the page."
  />
</template>
```

## Validation

`error` and `warning` work as on every field: the message shows under the box
and the box takes the state's colour.

<preview>
  <NbCodeEditor v-model="broken" language="json" label="Settings" error="This is not valid JSON." :rows="3" />
</preview>

```vue
<NbCodeEditor
  v-model="text"
  language="json"
  label="Settings"
  :error="valid ? '' : 'This is not valid JSON.'"
/>
```

## Size and layout

<preview>
  <NbCodeEditor v-model="notes" language="markdown" label="Notes" placeholder="# A heading" :rows="4" :max-rows="4" :line-numbers="false" />
</preview>

```vue
<!-- A fixed four-line box, without the gutter. -->
<NbCodeEditor
  v-model="notes"
  language="markdown"
  :rows="4"
  :max-rows="4"
  :line-numbers="false"
/>
```

## Monaco options and the instance

`options` is merged over the editor's own construction options for anything
the props do not cover. `ready` hands over the Monaco editor once it is on
screen, and the component exposes `focus()`, `format()` (the language's
formatter, where Monaco has one) and `editor`.

```vue
<template>
  <NbCodeEditor
    ref="code"
    v-model="css"
    language="css"
    :options="{ tabSize: 4, folding: false }"
    @ready="(editor) => editor.revealLine(1)"
  />
  <NbButton variant="secondary" @click="code?.format()">Format</NbButton>
</template>
```

## Props

| Prop           | Type      | Default       | Description                                                               |
| -------------- | --------- | ------------- | ------------------------------------------------------------------------- |
| `modelValue`   | `string`  | `''`          | The code. Use `v-model`.                                                  |
| `language`     | `string`  | `'plaintext'` | Monaco language id: `xml` (for SVG), `json`, `html`, `css`, `markdown`... |
| `rows`         | `number`  | `8`           | Lines shown when the content is shorter.                                  |
| `max-rows`     | `number`  | `24`          | Lines it grows to before it scrolls.                                      |
| `line-numbers` | `boolean` | `true`        | Shows the line-number gutter.                                             |
| `wrap`         | `boolean` | `true`        | Wraps long lines instead of scrolling sideways.                           |
| `options`      | `object`  | none          | Monaco construction options, merged over the editor's own.                |
| `label`        | `string`  | `''`          | The field's label.                                                        |
| `helper`       | `string`  | `''`          | Helper text under the field.                                              |
| `error`        | `string`  | `''`          | Error message. Marks the field invalid.                                   |
| `warning`      | `string`  | `''`          | Warning message.                                                          |
| `placeholder`  | `string`  | `''`          | Shown while the editor is empty.                                          |
| `readonly`     | `boolean` | `false`       | The code can be read and selected, not changed.                           |
| `disabled`     | `boolean` | `false`       | Read-only and dimmed.                                                     |
| `required`     | `boolean` | `false`       | Marks the label and the input as required.                                |

## Events

| Event               | Payload  | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `update:modelValue` | `string` | The code changed.                             |
| `ready`             | editor   | Monaco is loaded and the editor is on screen. |

<!--@include: ./_shared.md-->
