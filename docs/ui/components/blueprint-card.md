---
layout: nubisco
title: Blueprint Card
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprintCard` is a node card designed to live inside an [`NbBlueprint`](/ui/components/blueprint) canvas. It renders a card with a top accent bar, typed input/output ports, a category tag, an optional enable toggle, and an optional remove button. It is presentational: the parent owns the card's position and the connections between cards.

## Basic card

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="demo"
      title="Low-pass Filter"
      category="effect"
      color="#a855f7"
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
    color="#a855f7"
    :ports="[
      { id: 'in', label: 'Audio', type: 'input' },
      { id: 'out', label: 'Audio', type: 'output' },
    ]"
  />
</template>
```

## Ports and connected state

Ports are split automatically by type: `input` on the left, `output` on the right. Pass `connectedPorts` with an array of port IDs to show which ports have active connections (filled with color + outer ring).

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
      :connected-ports="['a', 'out']"
    />
  </div>
</preview>

## Selected state

Pass `selected` to highlight a card with a 1px accent ring and outer glow.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="sel"
      title="Planet"
      category="geometry"
      color="#6366f1"
      selected
      :ports="[{ id: 'out', label: 'out', type: 'output' }]"
      :connected-ports="['out']"
    />
  </div>
</preview>

## Enable toggle and disabled state

When `enabled` is passed, a compact accent-tinted toggle renders in the header. Disabled cards drop to 55% opacity, collapse the body, and append " . off" to the category tag.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 1rem;">
    <NbBlueprintCard
      id="on"
      title="Atmosphere"
      category="effect"
      color="#a855f7"
      :enabled="true"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
      :connected-ports="['in', 'out']"
      collapsed
    />
    <NbBlueprintCard
      id="off"
      title="Fog"
      category="effect"
      color="#a855f7"
      :enabled="false"
      :ports="[{ id: 'in', label: 'in', type: 'input' }]"
      collapsed
    />
  </div>
</preview>

## Parameter rows

Use the `parameters` prop to display structured data inside the card body. Each row has a monospaced label, a value, an optional unit, and an optional progress bar.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="terrain"
      title="Terrain"
      category="geometry"
      color="#6366f1"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
      :connected-ports="['in', 'out']"
      :parameters="[
        { label: 'elevation', value: 6, bar: 60 },
        { label: 'seed', value: '0x2A' },
      ]"
    />
  </div>
</preview>

```vue
<template>
  <NbBlueprintCard
    id="terrain"
    title="Terrain"
    category="geometry"
    color="#6366f1"
    :parameters="[
      { label: 'elevation', value: 6, bar: 60 },
      { label: 'seed', value: '0x2A' },
    ]"
  />
</template>
```

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

## Custom body content

Anything placed in the default slot renders inside the card body, below the parameters.

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

| Prop             | Type                        | Default               | Description                                                                        |
| ---------------- | --------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `id`             | `string`                    | _(required)_          | Unique card identifier. Used in connection records and the `data-port` attribute.  |
| `title`          | `string`                    | _(required)_          | Card title (rendered as the dominant element in the header).                       |
| `color`          | `string`                    | `var(--nb-c-primary)` | Accent color: top bar, glow, tag, toggle tint, selected ring, connected port fill. |
| `enabled`        | `boolean`                   | `true`                | Shows the header toggle. Omit to hide the toggle entirely.                         |
| `selected`       | `boolean`                   | `false`               | Highlights the card with an accent ring and outer glow.                            |
| `category`       | `string`                    | `''`                  | Monospaced uppercase tag below the title, colored to match the accent.             |
| `ports`          | `IBlueprintPort[]`          | `[]`                  | Port definitions. `input` ports render on the left edge, `output` on the right.    |
| `connectedPorts` | `string[]`                  | `[]`                  | IDs of ports that are currently connected (filled style with outer ring).          |
| `parameters`     | `IBlueprintCardParameter[]` | `[]`                  | Structured parameter rows displayed in the card body.                              |
| `x`              | `number`                    | `0`                   | Canvas X position (documentary: the parent positions the card).                    |
| `y`              | `number`                    | `0`                   | Canvas Y position (documentary: the parent positions the card).                    |
| `removable`      | `boolean`                   | `false`               | Shows a remove button in the header. Emits `remove` when clicked.                  |
| `collapsed`      | `boolean`                   | `false`               | Collapses the body, showing only the header row.                                   |
| `status`         | `TBlueprintCardStatus`      | `'none'`              | Status indicator dot next to the title (valid, warning, error).                    |
| `preview`        | `string`                    | `''`                  | Compact monospaced preview text shown in the body.                                 |

## Events

| Event             | Payload                                                         | Description                                                                       |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `select`          | `string` (the card `id`)                                        | Emitted on mousedown anywhere on the card body.                                   |
| `toggle`          | `[id: string, enabled: boolean]`                                | Emitted when the header toggle is clicked.                                        |
| `toggle-collapse` | `string` (the card `id`)                                        | Emitted when the collapse chevron is clicked.                                     |
| `remove`          | `string` (the card `id`)                                        | Emitted when the remove button is clicked.                                        |
| `port-mousedown`  | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | Forward to `NbBlueprint.onPortMouseDown` to start a drag-to-connect operation.    |
| `port-mouseup`    | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | Forward to `NbBlueprint.onPortMouseUp` to complete the drag-to-connect operation. |

## Slots

| Slot      | Description                                                                    |
| --------- | ------------------------------------------------------------------------------ |
| `default` | Custom body content rendered below the parameters (e.g. small value readouts). |

## Types

```ts
interface IBlueprintPort {
  id: string
  label: string
  type: 'input' | 'output'
  dataType?: TBlueprintPinDataType
  required?: boolean
}

interface IBlueprintCardParameter {
  label: string
  value: string | number
  unit?: string
  bar?: number // 0 to 100, renders a thin progress bar
}
```

## CSS custom properties

| Variable          | Default               | Description                                                                               |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `--nb-card-color` | `var(--nb-c-primary)` | Accent color: top bar, glow, tag, toggle tint, selected ring, connected port fill.        |
| `--nb-card-glow`  | (computed)            | 18% alpha version of the accent, used for radial glow, toggle glow, and selection shadow. |

</doc-tab>
