---
layout: nubisco
title: Card Grid
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbCardGrid` lays out a responsive grid of `NbCard`s that wraps by card width rather than by page column. It answers a different question from [`NbGrid`](/ui/components/grid), which is why it is a separate component rather than another prop:

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

## Cards that do something

The card picks its element from its behaviour, so each case gets the right keyboard and the right browser affordances without being asked:

- `href` renders an `<a>`. Middle click, open-in-new-tab and the status-bar URL all work, which they do not for a click handler on a div.
- `clickable` renders a `role="button"` with a tabindex, and emits `select` on click, <kbd>Enter</kbd> and <kbd>Space</kbd>. For a card that opens something in place.
- Neither renders a plain `div`, so a card that does nothing does not advertise that it does.

<preview>
  <NbCardGrid min="220px" style="width: 100%">
    <NbCard title="A link" subtitle="renders an <a>" href="#card-grid" />
    <NbCard title="A button" subtitle="emits select" clickable />
    <NbCard title="Selected" subtitle="part of a selection" clickable selected />
    <NbCard title="Disabled" subtitle="inert and muted" clickable disabled />
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

</doc-tab>

<doc-tab name="Api">

## NbCardGrid props

| Prop   | Type                        | Default       | Description                                                                                 |
| ------ | --------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `min`  | `string`                    | `'260px'`     | Narrowest a column may be. Clamped to the container, so it shrinks rather than overflowing. |
| `gap`  | `TGapSize`                  | `'md'`        | Space between cards, on `NbGrid`'s scale: `xxs` 2px to `xxl` 48px.                          |
| `fill` | `'auto-fill' \| 'auto-fit'` | `'auto-fill'` | Whether empty columns are kept or collapsed.                                                |

## NbCard props

| Prop        | Type      | Default | Description                                                         |
| ----------- | --------- | ------- | ------------------------------------------------------------------- |
| `title`     | `string`  | `''`    | Card title.                                                         |
| `subtitle`  | `string`  | `''`    | One line under the title: a type, an owner, a version.              |
| `icon`      | `string`  | —       | Icon name for the card's header.                                    |
| `href`      | `string`  | —       | Renders the card as a link.                                         |
| `target`    | `string`  | —       | Link target. `_blank` also sets `rel="noopener"`.                   |
| `clickable` | `boolean` | `false` | Renders as a button and emits `select`. Ignored when `href` is set. |
| `selected`  | `boolean` | `false` | Draws the card as chosen.                                           |
| `disabled`  | `boolean` | `false` | Inert and muted.                                                    |

## NbCard events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `select` | —       | The card was activated. Only fires when `clickable`. |

## NbCard slots

| Slot       | Description                                    |
| ---------- | ---------------------------------------------- |
| `default`  | The description. Takes the leftover height.    |
| `icon`     | Replaces the `icon` prop.                      |
| `title`    | Replaces the `title` prop.                     |
| `subtitle` | Replaces the `subtitle` prop.                  |
| `footer`   | Badges or metadata, pinned to the bottom edge. |

</doc-tab>
