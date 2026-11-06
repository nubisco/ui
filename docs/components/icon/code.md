---
layout: nubisco
title: Icon
intro: '`NbIcon` renders SVG icons from the Phosphor icon set. Icons are loaded as async Vue components via a Vite virtual module, so only icons that are actually used end up in your bundle.'
source: src/components/Icon.vue
tab: code
pageTabs: ['usage', 'code']
---

## Overview

<preview dir="row">
  <NbIcon name="sparkle" />
  <NbIcon name="gear" size="md" color="var(--nb-c-text-muted)" />
  <NbIcon name="star" weight="fill" color="var(--nb-c-primary)" label="Starred" />
</preview>

```vue
<template>
  <!-- decorative, 16px, the colour of the text around it -->
  <NbIcon name="sparkle" />
  <!-- one step up the scale, painted with a token -->
  <NbIcon name="gear" size="md" color="var(--nb-c-text-muted)" />
  <!-- fill marks a selected state; named because no text says "starred" -->
  <NbIcon
    name="star"
    weight="fill"
    color="var(--nb-c-primary)"
    label="Starred"
  />
</template>
```

## Props

| Prop        | Type               | Default     | Description                                                          |
| ----------- | ------------------ | ----------- | -------------------------------------------------------------------- |
| `name`      | `string \| module` | required    | Icon name in kebab-case (e.g. `arrow-right`), or an icon module      |
| `icon`      | `module`           | -           | An imported icon module; wins over `name`                            |
| `size`      | `string \| number` | `'sm'`      | `sm`, `md`, `lg`, `xl` (16 to 32px), or pixels (see Sizes)           |
| `weight`    | `string`           | `'regular'` | Icon weight variant (see weights table)                              |
| `color`     | `string`           | -           | A colour token, `var(--nb-c-*)`. Never a literal colour (see Colour) |
| `label`     | `string`           | -           | Accessible name; makes the icon informative (`role="img"`)           |
| `title`     | `string`           | -           | Native tooltip, and also the accessible name when no `label`         |
| `clickable` | `boolean`          | `false`     | Deprecated. Use `NbButton variant="ghost"` with `icon` instead       |

## Decorative or informative

Almost every icon is **decorative**: it sits beside words that already say what
it means ("Delete" next to a bin, a caret beside a menu label), and announcing it
too would only make a screen reader say the same thing twice. That is the
default. With no `label` and no `title`, `NbIcon` renders `aria-hidden="true"`
and the SVG inside is `focusable="false"`, so assistive technology skips it.

An icon is **informative** when it carries meaning that nothing next to it
repeats: a warning triangle alone in a table cell, a lock on a row, a status dot
with no caption. Name it, and it renders `role="img"` with that accessible name:

```vue
<NbIcon name="lock-simple" label="Locked" />
<NbIcon name="warning" title="Sync failed" />
```

`label` names the icon for assistive technology only. `title` also shows a native
tooltip on hover, and names the icon the same way when there is no `label`.
Neither makes the icon interactive: an icon that does something on a click is a
button, and is written `NbButton variant="ghost"` with `icon`, named with
`v-nb-tooltip`. If you find yourself naming most of the icons on a page, the
words are missing from the page, not from the icons.

## How a name is resolved

Nubisco UI carries about 1,500 icons in six weights. No page should link all of
them to render a handful, so a name is resolved as early as it can be.

**A literal name** is a constant, and the bundler plugin rewrites it into an
import of that one icon. This is almost all usage and it costs one icon:

```vue
<NbIcon name="github-logo" />
```

**An imported module** covers code the plugin cannot see through, and projects
that do not run a bundler plugin:

```vue
<script setup>
import GithubLogo from '@nubisco/ui/icons/github-logo'
</script>

<template>
  <NbIcon :icon="GithubLogo" />
</template>
```

**A name known only at runtime** (an API field, a CMS value, a picker) needs one
of two declarations. If the set of values is bounded, register those modules and
the app links only them:

```ts
import { registerIcons } from '@nubisco/ui'
import * as check from '@nubisco/ui/icons/check'
import * as warning from '@nubisco/ui/icons/warning'

registerIcons({ check, warning })
```

If it is open-ended, load the catalogue in the one file that needs it:

```ts
import '@nubisco/ui/icons/all'
```

A registered name always wins over the catalogue, which is also how you add
icons of your own or override a built-in. If a runtime name arrives with none
of the three in place, `NbIcon` throws on first render rather than leaving an
invisible hole in the page.

Because of this, **a built app contains only the icons its templates named**.
See [What ships in your bundle](/bundling) for how to check what was linked, and
how to ship the whole set deliberately when you need it.

## Weights

| Value     | Description                         |
| --------- | ----------------------------------- |
| `thin`    | Very light stroke                   |
| `light`   | Light stroke                        |
| `regular` | Default stroke                      |
| `bold`    | Heavy stroke                        |
| `fill`    | Solid filled                        |
| `duotone` | Two-tone with foreground/background |

Not every icon has all weights. If a requested weight is not available, the component falls back to `regular`.

**Use `regular` everywhere, and `fill` only for a selected or active state** (a
starred item, the current tab, a toggled-on control), so the change of weight
itself says "on". The other four exist in the set, not in the product: `thin`
and `light` vanish at 16px, `bold` shouts, and `duotone` is for pictograms
(see [Icons beyond the catalogue](/principles/icons)). A
page that mixes weights reads as several icon sets.

A literal weight also keeps the bundle small: `weight="fill"` on `NbIcon`, or
`icon-weight="fill"` on `NbButton`, links that one weight of the icon and no
other. A bound weight links all six.

## Sizes

Four sizes, the ones the icons are drawn to hold up at:

| Name | Pixels | Use it for                                                   |
| ---- | ------ | ------------------------------------------------------------ |
| `sm` | 16     | The default. Beside 12 to 16px text, in rows, inputs, menus  |
| `md` | 20     | Beside 16 to 20px text, toolbars, a roomier row              |
| `lg` | 24     | Headings, empty states, a card's leading glyph               |
| `xl` | 32     | Empty states and pictograms (see Icons beyond the catalogue) |

Pick one size per context and keep it: the icons in a row, a menu or a toolbar
are all the same size. Centre an icon on the text beside it (a flex row with
`align-items: center`), never on the baseline.

A number still sets pixels (`:size="48"`) and any other string is a CSS length
(`size="1.2em"`, for an icon that has to follow its text), for the rare case the
scale does not cover.

`xs` (12), `xxs` (8) and numbers under 16 still render but are deprecated, and
warn once in development: below 16px the stroke is thinner than a pixel and the
glyph turns to a grey smudge. `xxl` (92) is kept for compatibility.

## Animations

`animation` takes one of seventeen gestures (`refresh`, `cog`, `hourglass`,
`wobble`, `heart` and the rest; the gallery plays them all), and
`animation-mode` plays it `always` or only on `hover`. An animated icon stays
the size of a static one: only the gesture moves. The timing reads
`--nb-motion-loop` and `--nb-ease-standard`, so a product that retunes its
motion tokens retunes these too.

Under `prefers-reduced-motion: reduce` the travel stops. The three that say
"working" (`refresh`, `cog`, `hourglass`) keep looping as an opacity breath
instead, because a frozen loading glyph reads as a hung page. The rest stand
still. See [Motion accessibility](/principles/motion/accessibility).

## Colour

An icon takes the colour of the text around it: every glyph is drawn with
`fill: currentColor`. That is almost always right, and it is what keeps an icon
and its label the same colour in every theme.

When an icon has to differ, it differs by role, and `color` takes a token:

```vue
<NbIcon name="warning" color="var(--nb-c-warning)" />
<NbIcon name="check-circle" color="var(--nb-c-success)" />
<NbIcon name="info" color="var(--nb-c-text-muted)" />
```

**Tokens only.** The prop accepts any CSS colour, but a hex, `rgb()` or a named
colour paints the icon off-theme: it does not follow dark mode, a white-label
theme or a contrast change. The library's own tests fail on a literal colour
passed to `NbIcon color` anywhere in its sources or these docs, and a product
can hold itself to the same rule.

## Clickable icons are buttons

`clickable` is deprecated and warns once in development. An icon that does
something on a click is a button, and the library already has one with the
padding, focus ring and accessible-name check an icon lacks:

```vue
<!-- before -->
<NbIcon name="trash" clickable @click="remove" />

<!-- after -->
<NbButton
  v-nb-tooltip="{ body: 'Delete' }"
  variant="ghost"
  size="sm"
  icon="trash"
  @click="remove"
/>
```

Until it is removed, a clickable icon is at least reachable: it is a tab stop,
Enter and Space press it, it shows a focus ring, and on a phone touch screen it
takes taps over a 44px box. Name it with `label` so it is not announced as just
"button".

## Events

| Event   | Payload                       | Description                                        |
| ------- | ----------------------------- | -------------------------------------------------- |
| `click` | `MouseEvent \| KeyboardEvent` | Only fires when `clickable` is `true` (deprecated) |

<!--@include: ./_shared.md-->
