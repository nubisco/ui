---
layout: nubisco
title: Blueprint Card
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprintCard` is a node card designed to live inside an [`NbBlueprint`](/ui/components/blueprint) canvas. It renders a rectangular card with typed input/output ports, a color indicator, title, optional category label, an optional enable toggle, and an optional remove button. It is presentational — the parent owns the card's position and the connections between cards.

## Basic card

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="demo"
      title="Low-pass Filter"
      category="effect"
      color="#a78bfa"
      :ports="[
        { id: 'in', label: 'Audio', type: 'input' },
        { id: 'out', label: 'Audio', type: 'output' },
      ]"
    />
  </div>
</preview>

```vue
<template>
  <NbBlueprintCard
    id="filter"
    title="Low-pass Filter"
    category="effect"
    color="#a78bfa"
    :ports="[
      { id: 'in', label: 'Audio', type: 'input' },
      { id: 'out', label: 'Audio', type: 'output' },
    ]"
  />
</template>
```

## Ports

Ports are split automatically by type: `input` ports render on the left edge, `output` ports on the right. The `label` is exposed as a hover tooltip. Each port is marked with a `data-port="nodeId:portId"` attribute so `NbBlueprint` can anchor wires to it.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 2rem;">
    <NbBlueprintCard
      id="mix"
      title="Mixer"
      category="utility"
      color="#22c55e"
      :ports="[
        { id: 'a', label: 'Channel A', type: 'input' },
        { id: 'b', label: 'Channel B', type: 'input' },
        { id: 'c', label: 'Channel C', type: 'input' },
        { id: 'out', label: 'Sum', type: 'output' },
      ]"
    />
  </div>
</preview>

## Selected state

Pass `selected` to highlight a card with a glow in its accent color. The card emits `select` on mousedown so the parent can manage single or multiple selection.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="sel"
      title="Selected Node"
      category="source"
      color="#f97316"
      selected
      :ports="[{ id: 'out', label: 'out', type: 'output' }]"
    />
  </div>
</preview>

```vue
<template>
  <NbBlueprintCard
    :id="card.id"
    :title="card.title"
    :selected="selectedId === card.id"
    @select="selectedId = $event"
  />
</template>
```

## Enable toggle

When `enabled` is passed (`true` or `false`, not `undefined`), a small switch renders in the header. The card emits `toggle` with the new value; while `enabled` is `false` the card dims to 50% opacity to signal it is bypassed.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 1rem;">
    <NbBlueprintCard
      id="on"
      title="Reverb"
      category="effect"
      color="#a78bfa"
      :enabled="true"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
    />
    <NbBlueprintCard
      id="off"
      title="Reverb"
      category="effect"
      color="#a78bfa"
      :enabled="false"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
    />
  </div>
</preview>

Omit `enabled` entirely if the card should not show a toggle.

## Removable

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="rm"
      title="Temporary Node"
      category="scratch"
      color="#ef4444"
      removable
      :ports="[{ id: 'in', label: 'in', type: 'input' }]"
    />
  </div>
</preview>

```vue
<template>
  <NbBlueprintCard
    id="tmp"
    title="Temporary Node"
    removable
    @remove="removeCard($event)"
  />
</template>
```

## Custom body content

Anything placed in the default slot renders inside the card body, below the category label.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="gain"
      title="Gain"
      category="effect"
      color="#38bdf8"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
    >
      <span style="font-size: 11px; color: var(--nb-c-text-muted);">+6 dB</span>
    </NbBlueprintCard>
  </div>
</preview>

## Inside a blueprint

For a complete example wiring cards and ports into an `NbBlueprint` canvas, see the [Blueprint](/ui/components/blueprint) docs.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop        | Type               | Default               | Description                                                                       |
| ----------- | ------------------ | --------------------- | --------------------------------------------------------------------------------- |
| `id`        | `string`           | _(required)_          | Unique card identifier. Used in connection records and the `data-port` attribute. |
| `title`     | `string`           | _(required)_          | Card title.                                                                       |
| `color`     | `string`           | `var(--nb-c-primary)` | Accent color — applied to the left indicator stripe and selected-state glow.      |
| `enabled`   | `boolean`          | `true`                | Shows the header toggle. Omit to hide the toggle entirely.                        |
| `selected`  | `boolean`          | `false`               | Highlights the card with a glow in its accent color.                              |
| `category`  | `string`           | `''`                  | Small uppercase label shown below the title.                                      |
| `ports`     | `IBlueprintPort[]` | `[]`                  | Port definitions. `input` ports render on the left, `output` ports on the right.  |
| `x`         | `number`           | `0`                   | Canvas X position (documentary — the parent positions the card).                  |
| `y`         | `number`           | `0`                   | Canvas Y position (documentary — the parent positions the card).                  |
| `removable` | `boolean`          | `false`               | Shows a `×` button in the header. Emits `remove` when clicked.                    |

## Events

| Event            | Payload                                                         | Description                                                                       |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `select`         | `string` (the card `id`)                                        | Emitted on mousedown anywhere on the card body.                                   |
| `toggle`         | `[id: string, enabled: boolean]`                                | Emitted when the header toggle is clicked.                                        |
| `remove`         | `string` (the card `id`)                                        | Emitted when the `×` button is clicked.                                           |
| `port-mousedown` | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | Forward to `NbBlueprint.onPortMouseDown` to start a drag-to-connect operation.    |
| `port-mouseup`   | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | Forward to `NbBlueprint.onPortMouseUp` to complete the drag-to-connect operation. |

## Slots

| Slot      | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `default` | Custom body content rendered below the category label (e.g. small value readouts). |

## Types

```ts
interface IBlueprintPort {
  /** Unique port identifier */
  id: string
  /** Display label (shown as tooltip) */
  label: string
  /** Port direction */
  type: 'input' | 'output'
}
```

## CSS custom properties

| Variable          | Default               | Description                                                                                                             |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--nb-card-color` | `var(--nb-c-primary)` | Accent color — set via the `color` prop; used for the indicator stripe, selected glow, port hover, and toggle-on track. |

</doc-tab>
