---
layout: nubisco
title: Empty State
intro: '`NbEmptyState` is the centred block a view shows when it has nothing to show. Every product invents its own muted paragraph for this; the value in having one component is less the layout than the four **kinds**, which are what stop "No results" appearing over a request that failed.'
source: src/components/EmptyState.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop          | Type                                                | Default   | Description                                            |
| ------------- | --------------------------------------------------- | --------- | ------------------------------------------------------ |
| `title`       | `string`                                            | `''`      | Short, and positive where the situation allows.        |
| `description` | `string`                                            | `''`      | What to do next. One or two sentences.                 |
| `icon`        | `string \| null`                                    | per kind  | Icon name. `null` removes it.                          |
| `kind`        | `'empty' \| 'no-results' \| 'error' \| 'forbidden'` | `'empty'` | Why the space is empty. Picks the icon and the tone.   |
| `size`        | `'sm' \| 'md'`                                      | `'md'`    | `sm` for panels and cards, `md` for a whole view.      |
| `bordered`    | `boolean`                                           | `false`   | Dashed outline, for a region with no edges of its own. |

## Slots

| Slot      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `default` | Body copy, replacing `description`. For copy that needs markup. |
| `title`   | Replaces the `title` prop.                                      |
| `icon`    | Replaces the icon entirely.                                     |
| `actions` | The action, or actions. Keep it to one where you can.           |
