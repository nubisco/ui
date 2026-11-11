---
layout: nubisco
title: Suggestion List
intro: "`NbSuggestionList` is the autocomplete list under a text field: people for an @mention, items for a reference, tags for a tag field. It goes in [`NbTextInput`](/components/text-input/usage)'s `#dropdown` slot."
source: src/components/SuggestionList.vue
tab: code
pageTabs: ['usage', 'code']
---

## Usage

```vue
<template>
  <NbTextInput ref="input" v-model="text" multiline @input="onInput">
    <template v-if="open" #dropdown>
      <NbSuggestionList
        v-model:open="open"
        :items="matches"
        :item-key="(person) => person.id"
        :item-label="(person) => person.name"
        label="People"
        empty-text="Nobody by that name"
        @select="insert"
      />
    </template>
  </NbTextInput>
</template>

<script setup lang="ts">
const open = ref(false)
const query = ref('')
const matches = computed(() =>
  people.filter((p) => p.name.toLowerCase().includes(query.value)),
)

// The product's part: when does a mention start, and what has been typed.
function onInput(event: Event) {
  const field = event.target as HTMLTextAreaElement
  const before = field.value.slice(0, field.selectionStart ?? 0)
  const match = before.match(/@([\w.-]*)$/)
  open.value = !!match
  query.value = match?.[1].toLowerCase() ?? ''
}
</script>
```

`select` hands you the item. Replacing the typed `@que` with the full mention, and putting the caret after it, is yours to do, because only the product knows what a mention looks like in its text.

## Results from a server

When the suggestions come from a request, set `loading` while it is in flight.
The list stays open with a loading row in place of the empty state, so "No
results" is never shown for a search that has not finished, and the rows
already on screen stay until the new ones land. Debounce the request on the
host side: the list does not know what the person typed, only what you give it.

```vue
<template>
  <nb-text-input v-model="query" label="Assign to">
    <template #dropdown>
      <nb-suggestion-list
        v-model:open="open"
        :items="people"
        :loading="loading"
        loading-text="Searching"
        empty-text="No one matches"
        @select="assign"
      />
    </template>
  </nb-text-input>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
const query = ref('')
const open = ref(false)
const loading = ref(false)
const people = ref([])
let timer: ReturnType<typeof setTimeout>
watch(query, (q) => {
  clearTimeout(timer)
  open.value = q.length > 0
  loading.value = true
  timer = setTimeout(async () => {
    people.value = await searchPeople(q)
    loading.value = false
  }, 200)
})
</script>
```

## Outside NbTextInput

Inside the `#dropdown` slot the list finds its field. Anywhere else, give it the field's id with `for`. The element around both needs `position: relative`, since the list positions itself against it.

```vue
<div style="position: relative">
  <input id="tag-field" v-model="tag" />
  <NbSuggestionList v-if="tag" for="tag-field" :items="tagMatches" @select="addTag" />
</div>
```

## Grouped results

When results come from several sources, `item-group` names the group of each item and the list draws a heading over each run. Give the items already sorted by group. The list never reorders them, because the arrow keys walk the rows in the order they are drawn. Each run is a `role="group"` named by its heading, so a screen reader announces the group as the active row moves into it.

```vue
<NbSuggestionList
  :items="results"
  :item-group="(hit) => hit.source"
  :item-label="(hit) => hit.title"
  label="Search results"
/>
```

## Props

| Prop          | Type                                           | Default                  | Description                                                                                  |
| ------------- | ---------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `items`       | `T[]`                                          |                          | The suggestions, already filtered.                                                           |
| `open`        | `boolean`                                      | `true`                   | Whether the list shows. Supports `v-model:open`.                                             |
| `itemLabel`   | `(item: T) => string`                          | `item.label` or the item | The text of a row.                                                                           |
| `itemKey`     | `(item: T, index: number) => string \| number` | the label                | A stable key for a row.                                                                      |
| `emptyText`   | `string`                                       | `''`                     | Shown when `items` is empty. Without it an empty list is not drawn.                          |
| `loading`     | `boolean`                                      | `false`                  | Results are pending. The list stays open and shows `loadingText` instead of the empty state. |
| `loadingText` | `string`                                       | `''`                     | Shown while `loading`. Present tense: "Searching".                                           |
| `placement`   | `'bottom' \| 'top'`                            | `'bottom'`               | Which side of the field the list opens on.                                                   |
| `itemGroup`   | `(item: T) => string`                          | -                        | The group of an item. Consecutive items in one group share a heading.                        |
| `label`       | `string`                                       | `''`                     | Accessible name of the list.                                                                 |
| `for`         | `string`                                       | —                        | Id of the field, when the list is not in an `NbTextInput`.                                   |
| `id`          | `string`                                       | generated                | Id of the list.                                                                              |

## Events

| Event         | Payload                    | Description                                                        |
| ------------- | -------------------------- | ------------------------------------------------------------------ |
| `select`      | `(item: T, index: number)` | A row was chosen, by Enter, Tab or a click. The list then closes.  |
| `update:open` | `false`                    | The list closed: a choice, Escape, or the field lost focus.        |
| `close`       | —                          | Same moment as `update:open`, for a list not bound with `v-model`. |

## Slots

| Slot      | Props                     | Description               |
| --------- | ------------------------- | ------------------------- |
| `item`    | `{ item, index, active }` | One row.                  |
| `group`   | `{ group }`               | A group heading.          |
| `empty`   | —                         | Replaces `empty-text`.    |
| `loading` | —                         | Replaces the loading row. |

## Exposed

| Name          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `onKeydown`   | Feed it a key from a field the list is not bound to. |
| `activeIndex` | The active row, as a ref.                            |

<!--@include: ./_shared.md-->
