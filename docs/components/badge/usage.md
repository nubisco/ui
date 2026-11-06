---
layout: nubisco
title: Badge
intro: '`NbBadge` is a compact label used to highlight status, category, or a short value. Its variants name what it means (neutral, info, success, warning, danger, primary), and each paints a measured pair. Two sizes and an optional dot.'
source: src/components/Badge.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbBadge v-bind="resultingProps">badge</NbBadge>
</preview>

```vue
<template>
  <NbBadge variant="info">badge</NbBadge>
</template>
```

## Variants

`variant` says what the badge means, and the theme picks the colour. Each status intent paints the theme's status surface pair (`--nb-c-<intent>-surface` under `--nb-c-on-<intent>-surface`), so a badge, a banner and a toast that mean the same thing look the same. `primary` is the filled accent, for a badge that is not a status.

<preview dir="row">
  <NbBadge variant="neutral">neutral</NbBadge>
  <NbBadge variant="info">info</NbBadge>
  <NbBadge variant="success">success</NbBadge>
  <NbBadge variant="warning">warning</NbBadge>
  <NbBadge variant="danger">danger</NbBadge>
  <NbBadge variant="primary">primary</NbBadge>
</preview>

Badge text is 10px or 11px, so every pair is held to 4.5:1 with no large-text allowance, measured in `tests/badgeContrast.test.ts`:

| Variant   | Light | Dark, worst to best plane |
| --------- | ----- | ------------------------- |
| `neutral` | 10.24 | 5.26 to 9.35              |
| `info`    | 10.87 | 4.98 to 8.72              |
| `success` | 8.04  | 5.87 to 10.48             |
| `warning` | 8.07  | 5.77 to 10.36             |
| `danger`  | 10.28 | 4.84 to 8.37              |
| `primary` | 7.60  | 4.71                      |

In dark the status grounds are a 16% wash over whatever plane the badge sits on, which is why they have a range.

Colour still is not the only signal. A status badge carries a word, and `dot` or `icon` adds a second cue.

### The colour names are deprecated

`grey`, `blue`, `green`, `orange`, `red` and `purple` still work. Each renders as the intent it was used for and warns once in development:

| Was      | Now       |
| -------- | --------- |
| `grey`   | `neutral` |
| `blue`   | `info`    |
| `green`  | `success` |
| `orange` | `warning` |
| `red`    | `danger`  |
| `purple` | `primary` |

The old washes measured 1.88:1 (orange) to 4.45:1 (blue) at this size in light. `purple` was a pale accent wash and now renders as the filled `primary`.

## Sizes

<preview dir="row">
  <NbBadge size="md">medium</NbBadge>
  <NbBadge size="sm">small</NbBadge>
</preview>

## With an icon

`icon` puts a glyph before the text, sized to the badge.

<preview dir="row">
  <NbBadge variant="warning" icon="calendar-blank">Tomorrow</NbBadge>
  <NbBadge variant="danger" size="sm" icon="calendar-blank">2 days late</NbBadge>
</preview>

## Content

- **A status badge uses one of the nine states** in [Status indicators](/patterns/status-indicators): `Draft`, `Pending`, `Running`, `Active`, `Attention`, `Paused`, `Failed`, `Inactive`, `Unknown`. Map your product's words onto them.
- **One word, sentence case, no period.** Type `Active`, never `ACTIVE`: the styling can set the case, the text cannot take it back.
- **Colour is never the only signal.** The word carries the state, so two badges that differ only in colour are a bug.
- **A placeholder badge says what is missing** (`No labels`), and an interactive one is named for what pressing it does.

Casing, punctuation and tone are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
