---
layout: nubisco
title: Card Grid
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbCardGrid` lays out a responsive grid of `NbCard`s that wraps by card width rather than by page column. It answers a different question from [`NbGrid`](/components/grid), which is why it is a separate component rather than another prop:

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

## Media

`image` puts a picture in the card: a cover across the top of a vertical card, a thumbnail beside a horizontal one. The box has a fixed shape, `16 / 9` unless `image-ratio` says otherwise, so a grid of cards lines up before any image has loaded. `image-fit="contain"` shows the whole picture instead of cropping it to fill.

Passing `image` at all reserves the box. An empty string or `null` draws a placeholder in the same shape, and so does an image that fails to load, so one missing picture does not make one card in the row shorter than the rest. Leave `image` out for a card with no media.

<preview>
  <NbCardGrid min="220px" style="width: 100%">
    <NbCard title="Getting started" subtitle="Updated 2 days ago" :image="withBase('/media/card-cover-a.svg')">
      The first page a new reader opens.
    </NbCard>
    <NbCard title="Release notes" subtitle="Updated today" :image="withBase('/media/card-cover-b.svg')">
      What changed, version by version.
    </NbCard>
    <NbCard title="Draft" subtitle="No thumbnail yet" image="">
      A placeholder holds the shape.
    </NbCard>
  </NbCardGrid>
</preview>

```vue
<NbCardGrid>
  <NbCard
    v-for="page in pages"
    :key="page.id"
    :title="page.title"
    :subtitle="page.updated"
    :image="page.thumbnailUrl ?? ''"
    :to="page.path"
  />
</NbCardGrid>
```

The image is decorative by default (`alt=""`), because the title next to it usually says everything the picture does. Pass `image-alt` when the picture carries information of its own. For anything other than one image (a video, a chart, a picture element) use the `media` slot: it fills the same box.

## Horizontal cards

`orientation="horizontal"` puts the media, icon or logo in a column on the left, and the title, text and footer beside it. Use it for a launcher of apps (logo left, name and one line right) or a list of pages with a thumbnail each, where the tile is read by its name and the picture says which one at a glance.

<preview>
  <NbCardGrid min="240px" style="width: 100%">
    <NbCard v-for="app in apps" :key="app.title" orientation="horizontal" :title="app.title" href="#horizontal-cards">
      <template #icon>
        <span class="demo-logo" :style="{ background: app.color }"><NbIcon :name="app.icon" :size="20" /></span>
      </template>
      {{ app.text }}
    </NbCard>
  </NbCardGrid>
</preview>

```vue
<NbCardGrid min="240px">
  <NbCard v-for="app in apps" :key="app.id" orientation="horizontal" :title="app.name" :to="app.path">
    <template #icon>
      <img :src="app.logo" alt="" width="40" height="40" />
    </template>
    {{ app.summary }}
  </NbCard>
</NbCardGrid>
```

With an `image` the thumbnail is 96px wide. Set `--nb-card-media-width` on the card or the grid to change it, and `image-ratio` for its shape.

<preview>
  <NbCardGrid min="300px" style="width: 100%">
    <NbCard orientation="horizontal" title="Quarterly overview" subtitle="Report" :image="withBase('/media/card-cover-c.svg')" href="#horizontal-cards" />
    <NbCard orientation="horizontal" title="Style guide" subtitle="Reference" :image="withBase('/media/card-cover-b.svg')" href="#horizontal-cards" />
    <NbCard orientation="horizontal" title="Untitled page" subtitle="Draft" image="" href="#horizontal-cards" />
  </NbCardGrid>
</preview>

A horizontal card stays horizontal on a phone, which is what keeps a one-column list of tiles easy to scan. Only the thumbnail narrows, to 72px, so the name keeps its room.

## Cards that do something

The card picks its element from its behaviour, so each case gets the right keyboard and the right browser affordances without being asked:

- `to` renders a `<RouterLink>` when the app has vue-router, exactly as on [`NbButton`](/components/button/button). It takes a path or a location object, navigates inside the app, and still renders a real `href`. Without a router a string `to` is a plain link.
- `href` renders an `<a>`. Middle click, open-in-new-tab and the status-bar URL all work, which they do not for a click handler on a div.
- `clickable` renders a `role="button"` with a tabindex, and emits `select` on click, <kbd>Enter</kbd> and <kbd>Space</kbd>. For a card that opens something in place.
- Neither renders a plain `div`, so a card that does nothing does not advertise that it does.

```vue
<NbCard
  v-for="project in projects"
  :key="project.id"
  :title="project.name"
  :subtitle="project.slug"
  :to="{ name: 'project', params: { id: project.id } }"
/>
```

<preview>
  <NbCardGrid min="220px" style="width: 100%">
    <NbCard title="A route" subtitle="renders a RouterLink" to="/components/card-grid" />
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

| Prop          | Type                         | Default      | Description                                                                                                         |
| ------------- | ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string`                     | `''`         | Card title.                                                                                                         |
| `subtitle`    | `string`                     | `''`         | One line under the title: a type, an owner, a version.                                                              |
| `icon`        | `string`                     | —            | Icon name for the card's header.                                                                                    |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Media or icon above the title, or in a column beside it.                                                            |
| `image`       | `string \| null`             | `undefined`  | Image for the media box. Empty or `null` (or an image that fails to load) draws a placeholder in the same box.      |
| `imageAlt`    | `string`                     | `''`         | Alternative text for the image. Empty marks it decorative.                                                          |
| `imageRatio`  | `string`                     | `'16 / 9'`   | Shape of the media box, as a CSS `aspect-ratio`.                                                                    |
| `imageFit`    | `'cover' \| 'contain'`       | `'cover'`    | Crop the image to fill the box, or show it whole.                                                                   |
| `to`          | `string \| object`           | —            | Target route. A `<RouterLink>` with vue-router, a plain link for a string without it. Takes precedence over `href`. |
| `href`        | `string`                     | —            | Renders the card as a link.                                                                                         |
| `target`      | `string`                     | —            | Link target. `_blank` also sets `rel="noopener"`.                                                                   |
| `clickable`   | `boolean`                    | `false`      | Renders as a button and emits `select`. Ignored when `href` or `to` is set.                                         |
| `selected`    | `boolean`                    | `false`      | Draws the card as chosen.                                                                                           |
| `disabled`    | `boolean`                    | `false`      | Inert and muted.                                                                                                    |

## NbCard events

| Event    | Payload | Description                                          |
| -------- | ------- | ---------------------------------------------------- |
| `select` | —       | The card was activated. Only fires when `clickable`. |

## NbCard slots

| Slot       | Description                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `default`  | The description. Takes the leftover height.                               |
| `icon`     | Replaces the `icon` prop.                                                 |
| `media`    | Replaces the image in the media box: a video, a chart, a picture element. |
| `title`    | Replaces the `title` prop.                                                |
| `subtitle` | Replaces the `subtitle` prop.                                             |
| `footer`   | Badges or metadata, pinned to the bottom edge.                            |

## NbCard custom properties

| Property                | Default  | Description                                                     |
| ----------------------- | -------- | --------------------------------------------------------------- |
| `--nb-card-media-width` | `96px`   | Width of the thumbnail in a horizontal card. `72px` on a phone. |
| `--nb-card-image-ratio` | `16 / 9` | Shape of the media box. Set by `imageRatio`.                    |
| `--nb-card-image-fit`   | `cover`  | `object-fit` of the image. Set by `imageFit`.                   |

</doc-tab>

<script setup lang="ts">
import { withBase } from 'vitepress'

const apps = [
  { title: 'Notes', text: 'Write things down and find them again.', icon: 'note-pencil', color: '#f6c453' },
  { title: 'Calendar', text: 'Meetings, deadlines and time off.', icon: 'calendar-blank', color: '#5b8def' },
  { title: 'Files', text: 'Everything the team has shared.', icon: 'folder', color: '#81b29a' },
  { title: 'Reports', text: 'Numbers for the week, ready to send.', icon: 'chart-bar', color: '#e07a5f' },
]
</script>

<style scoped>
.demo-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #1b1b1b;
}
</style>
