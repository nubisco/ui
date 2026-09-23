---
layout: nubisco
title: JSON Tree
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbJsonTree` renders any JSON-compatible value as an interactive, collapsible tree. It supports objects, arrays and primitives (`string`, `number`, `boolean`, `null`), and can optionally be made editable via `v-model`.

<preview>
  <NbJsonTree v-model="sample" title="payload" />
</preview>

```vue
<template>
  <NbJsonTree v-model="payload" title="payload" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const payload = ref({
  name: 'Ada Lovelace',
  active: true,
  score: 99,
  tags: ['math', 'engineering'],
  meta: null,
})
</script>
```

## Editable mode

Set `editable` to allow inline edits. Double-click a string or number value to edit it, click a boolean to toggle it. Updates are emitted through `v-model`.

<preview>
  <NbJsonTree v-model="editableSample" title="user" editable />
</preview>

```vue
<template>
  <NbJsonTree v-model="user" title="user" editable />
</template>
```

## Starting collapsed

Use `start-collapsed` when the payload is large and you want the user to expand nodes on demand.

<preview>
  <NbJsonTree v-model="sample" title="payload" start-collapsed />
</preview>

## Nested structures

Objects and arrays are recursively rendered. Each node shows a summary of its children, `{ N properties }` for objects and `[ N items ]` for arrays.

<preview>
  <NbJsonTree v-model="nestedSample" title="response" />
</preview>

```vue
<template>
  <NbJsonTree v-model="response" title="response" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const response = ref({
  status: 'ok',
  data: {
    users: [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ],
    pagination: { page: 1, total: 2 },
  },
})
</script>
```

## Read-only inspection

Without `editable`, `NbJsonTree` is a pure inspector, useful for debugging API responses, displaying configuration, or rendering log payloads.

<preview>
  <NbJsonTree :model-value="readOnlySample" title="config" />
</preview>

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type         | Default | Description                                                |
| ---------------- | ------------ | ------- | ---------------------------------------------------------- |
| `modelValue`     | `TJsonValue` | `null`  | The JSON value to render (`v-model`)                       |
| `title`          | `string`     | `null`  | Label shown next to the node (typically the property name) |
| `root`           | `boolean`    | `true`  | Whether this is the root node, controls the tree gutter    |
| `editable`       | `boolean`    | `false` | Allow inline editing of leaf values                        |
| `startCollapsed` | `boolean`    | `false` | Render nested nodes collapsed initially                    |

## Events

| Event               | Payload      | Description                                                |
| ------------------- | ------------ | ---------------------------------------------------------- |
| `update:modelValue` | `TJsonValue` | Emitted when a leaf value is edited (only when `editable`) |

## Types

```ts
type TJsonPrimitive = string | number | boolean | null
type TJsonValue = TJsonPrimitive | IJsonObject | TJsonArray

interface IJsonObject {
  [key: string]: TJsonValue
}
type TJsonArray = TJsonValue[]
```

## Interaction

- **Toggle node**: click the toggler icon next to an object/array to expand or collapse its children.
- **Edit string / number**: double-click the value (requires `editable`).
- **Toggle boolean**: click the `true` / `false` label (requires `editable`).
- **Commit edit**: press `Enter` or blur the input.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const sample = ref({
  name: 'Ada Lovelace',
  active: true,
  score: 99,
  tags: ['math', 'engineering'],
  meta: null,
})

const editableSample = ref({
  username: 'ada',
  email: 'ada@example.com',
  verified: false,
  age: 36,
})

const nestedSample = ref({
  status: 'ok',
  data: {
    users: [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ],
    pagination: { page: 1, total: 2 },
  },
})

const readOnlySample = ref({
  theme: 'dark',
  locale: 'en-US',
  features: {
    beta: true,
    experimental: false,
  },
  limits: [10, 100, 1000],
})
</script>
