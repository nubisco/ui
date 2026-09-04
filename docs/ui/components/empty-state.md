---
layout: nubisco
title: Empty State
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbEmptyState` is the centred block a view shows when it has nothing to show. Every product invents its own muted paragraph for this; the value in having one component is less the layout than the four **kinds**, which are what stop "No results" appearing over a request that failed.

<preview>
  <div style="width: 100%; max-width: 32rem;">
    <NbEmptyState
      title="Start by adding a field"
      description="Fields describe the shape of a content type. The first one is usually a title."
    >
      <template #actions>
        <NbButton size="sm">Add field</NbButton>
      </template>
    </NbEmptyState>
  </div>
</preview>

```vue
<NbEmptyState
  title="Start by adding a field"
  description="Fields describe the shape of a content type."
>
  <template #actions>
    <NbButton size="sm" @click="addField">Add field</NbButton>
  </template>
</NbEmptyState>
```

## The four kinds

These are genuinely different situations, and running them together is the mistake this component exists to prevent. Pick the one that is true; the icon and the tone follow.

<preview>
  <div style="display: grid; gap: 1rem; width: 100%;">
    <NbEmptyState bordered kind="empty" title="No fields yet" description="Add the first one to describe this type." />
    <NbEmptyState bordered kind="no-results" title="No fields match “colour”" description="Try a shorter search, or clear the filter." />
    <NbEmptyState bordered kind="error" title="Could not load fields" description="The request failed. This is usually temporary." />
    <NbEmptyState bordered kind="forbidden" title="You cannot see this type" description="Ask an administrator for access to the model." />
  </div>
</preview>

| Kind         | Means                                         | The action is                                                    |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| `empty`      | Nothing here yet, and you can make the first  | Create                                                           |
| `no-results` | There is data; this filter matched none of it | Widen the search. **Never** offer to create.                     |
| `error`      | The request failed                            | Retry. Do not offer to create in a view that could not load.     |
| `forbidden`  | It exists and you may not see it              | Usually nothing. Inventing an action is worse than admitting it. |

## Writing the copy

From Carbon's empty-state guidance, and worth following:

- **Make the title a positive statement where the situation allows one.** "Start by adding data assets" reads better than "You don't have any data assets".
- **Say what will be here** once the space is filled, and be specific about it.
- **Keep it short.** Centred prose is hard to read past a couple of lines; the description is capped at a comfortable measure for that reason.
- **One action, not a menu.** An empty state that covers several options stops being guidance. If there are genuinely several routes, name the main one and let the rest live in the page.

## Sizes

`md` is the default, for a whole view. `sm` is for a panel, a card, or a column.

<preview>
  <div style="display: grid; gap: 1rem; width: 100%;">
    <NbEmptyState bordered size="sm" title="No blocks in this zone" description="Drag one in to begin." />
    <NbEmptyState bordered size="md" title="No blocks in this zone" description="Drag one in to begin." />
  </div>
</preview>

## Bordered

`bordered` draws a dashed outline around the space. Use it where the empty region would otherwise have no edges, a drop zone or an empty column, so the reader can see how big the empty thing is. Skip it inside a panel that already has a border.

## Without an icon

Bind `:icon="null"` to drop the mark, for a small empty state where it would crowd the copy. The binding is required: `icon="null"` without the colon passes the _string_ `'null'`, which resolves to a missing icon rather than to no icon, because the component tests `props.icon === null`.

<preview>
  <div style="width: 100%; max-width: 28rem;">
    <NbEmptyState size="sm" :icon="null" title="No tags" description="Tags help you find things later." />
  </div>
</preview>

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>
