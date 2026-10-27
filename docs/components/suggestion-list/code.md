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

## Outside NbTextInput

Inside the `#dropdown` slot the list finds its field. Anywhere else, give it the field's id with `for`. The element around both needs `position: relative`, since the list positions itself against it.

```vue
<div style="position: relative">
  <input id="tag-field" v-model="tag" />
  <NbSuggestionList v-if="tag" for="tag-field" :items="tagMatches" @select="addTag" />
</div>
```

## Props

| Prop        | Type                                           | Default                  | Description                                                         |
| ----------- | ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| `items`     | `T[]`                                          |                          | The suggestions, already filtered.                                  |
| `open`      | `boolean`                                      | `true`                   | Whether the list shows. Supports `v-model:open`.                    |
| `itemLabel` | `(item: T) => string`                          | `item.label` or the item | The text of a row.                                                  |
| `itemKey`   | `(item: T, index: number) => string \| number` | the label                | A stable key for a row.                                             |
| `emptyText` | `string`                                       | `''`                     | Shown when `items` is empty. Without it an empty list is not drawn. |
| `placement` | `'bottom' \| 'top'`                            | `'bottom'`               | Which side of the field the list opens on.                          |
| `label`     | `string`                                       | `''`                     | Accessible name of the list.                                        |
| `for`       | `string`                                       | —                        | Id of the field, when the list is not in an `NbTextInput`.          |
| `id`        | `string`                                       | generated                | Id of the list.                                                     |

## Events

| Event         | Payload                    | Description                                                        |
| ------------- | -------------------------- | ------------------------------------------------------------------ |
| `select`      | `(item: T, index: number)` | A row was chosen, by Enter, Tab or a click. The list then closes.  |
| `update:open` | `false`                    | The list closed: a choice, Escape, or the field lost focus.        |
| `close`       | —                          | Same moment as `update:open`, for a list not bound with `v-model`. |

## Slots

| Slot    | Props                     | Description            |
| ------- | ------------------------- | ---------------------- |
| `item`  | `{ item, index, active }` | One row.               |
| `empty` | —                         | Replaces `empty-text`. |

## Exposed

| Name          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `onKeydown`   | Feed it a key from a field the list is not bound to. |
| `activeIndex` | The active row, as a ref.                            |

<!--@include: ./_shared.md-->
