---
layout: nubisco
title: Chip Group
intro: '`NbChipGroup` is one choice drawn as a row of chips: a scope or a filter that sits beside what it narrows, such as "All products" or a single product above a search field.'
source: src/components/ChipGroup.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## When to use it

Reach for a chip group when there are a handful of short options, exactly one is always chosen, and the choice narrows something next to it: search results, a list, a feed.

- **Not tabs.** [`NbTabs`](/components/tabs/usage) say that the content below belongs to the chosen tab and swaps with it. A filter keeps the same content and narrows it.
- **Not a select.** A [`NbSelect`](/components/select/usage) hides the options behind a click. Chips keep every option in view, which is the point when there are six or fewer.
- **Not a content switcher.** [`NbContentSwitcher`](/components/content-switcher/usage) switches between views of one thing in a flush segmented bar. A chip group is lighter and wraps.
- **Not buttons.** Faking it with a primary button for the chosen option and outlined buttons for the rest gives a keyboard user six tab stops and a screen reader no idea which one is on.

<preview>
  <NbChipGroup v-model="scope" :items="scopes" label="Limit search to a product" />
</preview>

## How it behaves

It is a radio group. The row is one tab stop, on the chosen chip. The arrow keys move along the row and choose as they go, <kbd>Home</kbd> and <kbd>End</kbd> jump to either end, and a disabled chip is skipped. A screen reader hears the group's name, then "radio, 2 of 6, checked".

The row wraps rather than scrolling sideways, so on a phone every option stays in view.

## Content

- Keep labels to one or two words, in sentence case.
- Put the widest scope first and choose it by default: "All products", "Everything".
- Give the group a `label` that asks the question the chips answer, such as "Limit search to a product". It is required.

<!--@include: ./_shared.md-->
