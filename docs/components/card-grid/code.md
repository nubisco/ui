---
layout: nubisco
title: Card Grid
intro: '`NbCardGrid` lays out a responsive grid of `NbCard`s that wraps by card width rather than by page column. It answers a different question from [`NbGrid`](/components/grid/usage), which is why it is a separate component rather than another prop:'
source: src/components/CardGrid.vue
tab: code
pageTabs: ['usage', 'code']
---

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

- `to` renders a `<RouterLink>` when the app has vue-router, exactly as on [`NbButton`](/components/button/usage). It takes a path or a location object, navigates inside the app, and still renders a real `href`. Without a router a string `to` is a plain link.
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
    <NbCard title="A route" subtitle="renders a RouterLink" to="/components/card-grid/usage" />
    <NbCard title="A link" subtitle="renders an <a>" href="#card-grid" />
    <NbCard title="A button" subtitle="emits select" clickable />
    <NbCard title="Selected" subtitle="part of a selection" clickable selected />
    <NbCard title="Disabled" subtitle="inert and muted" clickable disabled />
  </NbCardGrid>
</preview>

`select` carries the event that activated the card, a `MouseEvent` or a `KeyboardEvent`, so a grid that selects can read `shiftKey`, `metaKey` and `ctrlKey` from the mouse and the keyboard alike:

```vue
<NbCard
  v-for="file in files"
  :key="file.id"
  :title="file.name"
  clickable
  :selected="isSelected(file.id)"
  @select="
    (event) => (event.shiftKey ? selectRange(file.id) : selectOnly(file.id))
  "
/>
```

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
| `size`        | `'sm' \| 'md'`               | `'md'`       | `sm` halves the padding, for a dense grid of small tiles.                                                           |
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

| Event    | Payload                       | Description                                                                                                                                                      |
| -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select` | `MouseEvent \| KeyboardEvent` | The card was activated by a click, Enter or Space. Only fires when `clickable`. The event carries the modifier keys, for a grid that selects a range with shift. |

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

<!--@include: ./_shared.md-->
