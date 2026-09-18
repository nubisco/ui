---
layout: nubisco
title: Avatar
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbAvatar` shows a person: their picture when there is one, their initials when there is not.

```vue
<template>
  <NbAvatar name="Ana Costa" picture="https://example.test/ana.png" />
  <NbAvatar email="ivan@nubisco.io" size="sm" />
</template>
```

## A picture that fails to load shows initials

An avatar host can stop serving an address, for example when someone replaces their picture and the old URL starts returning 404. The avatar then shows initials instead of a broken image. A new `picture` gets a fresh attempt.

## Initials

The first letters of the first and last words of `name`, or the first two characters of the email's local part when there is no name. `NbUserMenu` uses the same rule, so a person has the same initials everywhere.

## Next to a visible name, make it decorative

By default the avatar is announced as an image named after the person. When their name is already written beside it, set `decorative` so it is not read twice.

```vue
<template>
  <span class="uploader">
    <NbAvatar :name="user.name" :picture="user.picture" size="xs" decorative />
    {{ user.name }}
  </span>
</template>
```

## Sizes

`size` takes a step of the scale, `xs` (20), `sm` (24), `md` (28) or `lg` (40), or a number of pixels for a size the scale does not carry. A dense row of people is often sized to the row rather than to a scale, and the initials scale with the circle.

```vue
<template>
  <NbAvatar :name="actor.name" :size="18" />
  <NbAvatar :name="actor.name" :size="56" />
</template>
```

## Colours

The initials use the theme's primary colour with its readable foreground, the same pairing as `NbUserMenu`, so they stay legible in any theme.

Give each person their own `background` when several appear together and have to be told apart at a glance, which is what a row of overlapping faces at 18px needs. Derive it from something stable about the person, such as their handle, so they keep the same colour everywhere. Chart tokens are a ready-made set with readable foregrounds.

```vue
<script setup lang="ts">
/** The same person always lands on the same token. */
function colourFor(handle: string): string {
  let hash = 0
  for (const character of handle) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }
  return `var(--nb-c-chart-${(hash % 8) + 1})`
}
</script>

<template>
  <NbAvatar
    v-for="actor in actors"
    :key="actor.handle"
    :name="actor.name"
    :picture="actor.picture"
    :size="18"
    :background="colourFor(actor.handle)"
  />
</template>
```

A picture covers the background, so it only shows where initials do. Set `color` as well when a background is light enough that the default foreground would not read against it.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type                                     | Default | Description                                                            |
| ------------ | ---------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `name`       | `string \| null`                         |         | The person's name. Gives the initials and the accessible name.         |
| `email`      | `string \| null`                         |         | Initials and accessible name when there is no name.                    |
| `picture`    | `string \| null`                         |         | Picture URL. Absent, empty or failing to load shows initials.          |
| `size`       | `'xs' \| 'sm' \| 'md' \| 'lg' \| number` | `'md'`  | 20, 24, 28 or 40 pixels, or any number of pixels.                      |
| `background` | `string`                                 | unset   | Background behind the initials. Any CSS colour, including a token.     |
| `color`      | `string`                                 | unset   | Colour of the initials, for a background the default will not read on. |
| `decorative` | `boolean`                                | `false` | Hide from assistive technology, for when the name is already visible.  |

</doc-tab>
