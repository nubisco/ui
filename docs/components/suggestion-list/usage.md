---
layout: nubisco
title: Suggestion List
intro: "`NbSuggestionList` is the autocomplete list under a text field: people for an @mention, items for a reference, tags for a tag field. It goes in [`NbTextInput`](/components/text-input/usage)'s `#dropdown` slot."
source: src/components/SuggestionList.vue
tab: usage
pageTabs: ['usage', 'code']
---

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

## Rows

The `item` slot draws a row. It receives the `item`, its `index`, and whether it is `active`. Without it, a row is the item's label: `item-label` if given, otherwise `item.label`, otherwise the item itself, so a plain list of strings needs nothing else.

## Empty

With `empty-text` (or an `#empty` slot), a list with no matches says so. Without either, an empty list is not drawn at all, which suits a list that only opens on a match.

## Above the field

`placement="top"` opens the list above the field, for a composer at the bottom of a panel where a list below would fall off the screen.

## A handler on the same field

The list listens before anything else on the field, so a key it uses is already marked handled when your own `@keydown` sees it. A composer that sends on <kbd>Enter</kbd> checks `event.defaultPrevented` to tell a chosen suggestion from a send.

<!--@include: ./_shared.md-->
