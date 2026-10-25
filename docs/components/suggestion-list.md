---
layout: nubisco
title: Suggestion List
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbSuggestionList` is the autocomplete list under a text field: people for an @mention, items for a reference, tags for a tag field. It goes in [`NbTextInput`](/components/text-input)'s `#dropdown` slot.

The product decides **when** it opens and **what** it offers, because that is the product's business: which character starts a mention, how names match. The list does the part every product used to rewrite by hand:

- <kbd>↓</kbd> and <kbd>↑</kbd> move the active suggestion, wrapping at both ends.
- <kbd>Enter</kbd> or <kbd>Tab</kbd> chooses it, a click chooses any row.
- <kbd>Esc</kbd> closes the list, and only the list: not the modal the field sits in.
- Leaving the field closes it.
- Focus never leaves the field. The field becomes a `combobox` that points at the active row with `aria-activedescendant`, so a screen reader hears each suggestion while the caret stays put.

## Try it

Type `@` and the start of a name.

<preview>
  <div style="width: 100%; max-width: 420px; padding-bottom: 180px">
    <NbTextInput
      v-model="comment"
      label="Comment"
      multiline
      :rows="2"
      @input="onCommentInput"
    >
      <template v-if="mentionOpen" #dropdown>
        <NbSuggestionList
          v-model:open="mentionOpen"
          :items="matches"
          :item-key="(p) => p.id"
          label="People"
          empty-text="Nobody by that name"
          @select="insertMention"
        >
          <template #item="{ item }">
            <NbAvatar :name="item.name" :size="20" />
            <span>{{ item.name }}</span>
            <span style="color: var(--nb-c-text-subtle); margin-left: auto">{{ item.handle }}</span>
          </template>
        </NbSuggestionList>
      </template>
    </NbTextInput>
  </div>
</preview>

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

## Rows

The `item` slot draws a row. It receives the `item`, its `index`, and whether it is `active`. Without it, a row is the item's label: `item-label` if given, otherwise `item.label`, otherwise the item itself, so a plain list of strings needs nothing else.

## Empty

With `empty-text` (or an `#empty` slot), a list with no matches says so. Without either, an empty list is not drawn at all, which suits a list that only opens on a match.

## Above the field

`placement="top"` opens the list above the field, for a composer at the bottom of a panel where a list below would fall off the screen.

## Outside NbTextInput

Inside the `#dropdown` slot the list finds its field. Anywhere else, give it the field's id with `for`. The element around both needs `position: relative`, since the list positions itself against it.

```vue
<div style="position: relative">
  <input id="tag-field" v-model="tag" />
  <NbSuggestionList v-if="tag" for="tag-field" :items="tagMatches" @select="addTag" />
</div>
```

## A handler on the same field

The list listens before anything else on the field, so a key it uses is already marked handled when your own `@keydown` sees it. A composer that sends on <kbd>Enter</kbd> checks `event.defaultPrevented` to tell a chosen suggestion from a send.

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
import { computed, ref } from 'vue'

const people = [
  { id: 1, name: 'Ada Lovelace', handle: 'ada' },
  { id: 2, name: 'Alan Turing', handle: 'alan' },
  { id: 3, name: 'Grace Hopper', handle: 'grace' },
  { id: 4, name: 'Katherine Johnson', handle: 'katherine' },
  { id: 5, name: 'Margaret Hamilton', handle: 'margaret' },
]

const comment = ref('')
const mentionOpen = ref(false)
const query = ref('')
const matches = computed(() =>
  people.filter((p) => p.name.toLowerCase().includes(query.value) || p.handle.includes(query.value)),
)

let field: HTMLTextAreaElement | null = null

function onCommentInput(event: Event) {
  field = event.target as HTMLTextAreaElement
  const before = field.value.slice(0, field.selectionStart ?? 0)
  const match = before.match(/@([\w.-]*)$/)
  mentionOpen.value = !!match
  query.value = match?.[1].toLowerCase() ?? ''
}

function insertMention(person: { handle: string }) {
  if (!field) return
  const caret = field.selectionStart ?? comment.value.length
  const before = comment.value.slice(0, caret).replace(/@([\w.-]*)$/, `@${person.handle} `)
  comment.value = before + comment.value.slice(caret)
  const at = before.length
  requestAnimationFrame(() => field?.setSelectionRange(at, at))
}
</script>
