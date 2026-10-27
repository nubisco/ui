---
layout: nubisco
title: Card Grid
intro: '`NbCardGrid` lays out a responsive grid of `NbCard`s that wraps by card width rather than by page column. It answers a different question from [`NbGrid`](/components/grid/usage), which is why it is a separate component rather than another prop:'
source: src/components/CardGrid.vue
tab: usage
pageTabs: ['usage', 'code']
---

- `NbGrid`'s `grid` prop is a **span within the 16-column page grid**. It answers "how much of the page does this element take".
- `NbCardGrid`'s `min` is a **column width**. It answers "how many of these fit", and the answer comes from the card's own comfortable width, not from the page.

That distinction is why a catalogue of plugins and a catalogue of content types both ended up hand-writing `repeat(auto-fill, minmax(260px, 1fr))`.

<preview>
  <NbCardGrid style="width: 100%">
    <NbCard title="Compressor" subtitle="dynamics" icon="tray">
      Evens out the loud and quiet parts of a signal.
      <template #footer><NbBadge variant="green" size="sm">audio</NbBadge></template>
    </NbCard>
    <NbCard title="Arpeggiator" subtitle="midi" icon="tray">
      Turns a held chord into a pattern of notes.
      <template #footer>
        <NbBadge variant="purple" size="sm">midi</NbBadge>
        <NbBadge variant="grey" size="sm">beta</NbBadge>
      </template>
    </NbCard>
    <NbCard title="Reverb" subtitle="effect" icon="tray">
      Places a dry signal in a room.
      <template #footer><NbBadge variant="green" size="sm">audio</NbBadge></template>
    </NbCard>
  </NbCardGrid>
</preview>

```vue
<NbCardGrid min="260px" gap="md">
  <NbCard
    v-for="plugin in plugins"
    :key="plugin.id"
    :title="plugin.name"
    :subtitle="plugin.kind"
    :href="`/plugins/${plugin.id}`"
  >
    {{ plugin.summary }}
    <template #footer>
      <NbBadge size="sm">{{ plugin.format }}</NbBadge>
    </template>
  </NbCard>
</NbCardGrid>
```

## Column width

`min` is the narrowest a column may be before the grid drops one. Cards never render narrower than it, except in a container that is itself narrower, where they shrink instead of overflowing.

<preview>
  <div style="width: 100%; display: grid; gap: 1.5rem;">
    <NbCardGrid min="160px" gap="sm">
      <NbCard v-for="n in 5" :key="n" :title="`160px · ${n}`" />
    </NbCardGrid>
    <NbCardGrid min="320px" gap="sm">
      <NbCard v-for="n in 3" :key="n" :title="`320px · ${n}`" />
    </NbCardGrid>
  </div>
</preview>

## auto-fill and auto-fit

`auto-fill` (the default) keeps the empty columns, so two cards in a wide container stay card-sized. `auto-fit` collapses them, so those two stretch across the row.

Prefer the default. A catalogue reads as a catalogue when its card size is constant and a short row is allowed to be short; stretching two cards across a desktop makes them look like panels.

<preview>
  <div style="width: 100%; display: grid; gap: 1.5rem;">
    <NbCardGrid min="220px" fill="auto-fill">
      <NbCard title="auto-fill" subtitle="stays card-sized" />
      <NbCard title="auto-fill" subtitle="stays card-sized" />
    </NbCardGrid>
    <NbCardGrid min="220px" fill="auto-fit">
      <NbCard title="auto-fit" subtitle="stretches to fill" />
      <NbCard title="auto-fit" subtitle="stretches to fill" />
    </NbCardGrid>
  </div>
</preview>

## Dense cards

`size="sm"` halves the padding, for a grid of small tiles that act, such as a row of progress bars to filter by. The full padding made each tile twice the height of what it holds. Media and the horizontal thumbnail follow the same padding.

<preview>
  <NbCardGrid min="200px" gap="sm" style="width: 100%">
    <NbCard size="sm" clickable selected>
      <NbProgressBar label="French" :value="42" :max="60" size="sm" helper="18 missing" />
    </NbCard>
    <NbCard size="sm" clickable>
      <NbProgressBar label="German" :value="60" :max="60" size="sm" status="finished" helper="complete" />
    </NbCard>
  </NbCardGrid>
</preview>

## Footers line up

The body takes the leftover height, so a row of cards with different amounts of description still lines its footers up along the bottom. That is the detail hand-rolled card grids most often miss.

<preview>
  <NbCardGrid min="200px" style="width: 100%">
    <NbCard title="Short">
      One line.
      <template #footer><NbBadge size="sm">tag</NbBadge></template>
    </NbCard>
    <NbCard title="Longer">
      Several lines of description that push this card's body down further than its neighbour's, without moving the footer off the bottom edge.
      <template #footer><NbBadge size="sm">tag</NbBadge></template>
    </NbCard>
  </NbCardGrid>
</preview>

<!--@include: ./_shared.md-->
