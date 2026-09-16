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

## Colours

The initials use the theme's primary colour with its readable foreground, the same pairing as `NbUserMenu`, so they stay legible in any theme.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop         | Type                           | Default | Description                                                           |
| ------------ | ------------------------------ | ------- | --------------------------------------------------------------------- |
| `name`       | `string \| null`               |         | The person's name. Gives the initials and the accessible name.        |
| `email`      | `string \| null`               |         | Initials and accessible name when there is no name.                   |
| `picture`    | `string \| null`               |         | Picture URL. Absent, empty or failing to load shows initials.         |
| `size`       | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | 20, 24, 28 or 40 pixels.                                              |
| `decorative` | `boolean`                      | `false` | Hide from assistive technology, for when the name is already visible. |

</doc-tab>
