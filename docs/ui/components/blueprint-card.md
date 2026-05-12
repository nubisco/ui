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

## Multi-channel ports

A port that carries multiple channels (a stereo pair, a multi-output bus, a multi-channel MIDI port) can declare them inline via the `channels` array instead of writing one entry per channel by hand. The card always renders one pin per channel; there is no "bundle" or expand/collapse, so wires always land on a specific channel and the routing is visually unambiguous.

Each channel pin is addressable in `connectedPorts` and in `IBlueprintConnection` records as `${port.id}/${channel.id}`.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="reverb"
      title="Hall Reverb"
      category="effect"
      color="#10b981"
      :ports="[
        {
          id: 'in',
          label: 'Stereo In',
          type: 'input',
          dataType: 'audio:stereo',
          channels: [{ id: 'l', label: 'L' }, { id: 'r', label: 'R' }],
        },
        {
          id: 'out',
          label: 'Stereo Out',
          type: 'output',
          dataType: 'audio:stereo',
          channels: [{ id: 'l', label: 'L' }, { id: 'r', label: 'R' }],
        },
      ]"
      :connected-ports="['in/l', 'in/r', 'out/l']"
    />
  </div>
</preview>

```vue
<template>
  <NbBlueprintCard
    id="reverb"
    title="Hall Reverb"
    category="effect"
    color="#10b981"
    :ports="[
      {
        id: 'in',
        label: 'Stereo In',
        type: 'input',
        dataType: 'audio:stereo',
        channels: [
          { id: 'l', label: 'L' },
          { id: 'r', label: 'R' },
        ],
      },
      {
        id: 'out',
        label: 'Stereo Out',
        type: 'output',
        dataType: 'audio:stereo',
        channels: [
          { id: 'l', label: 'L' },
          { id: 'r', label: 'R' },
        ],
      },
    ]"
    :connected-ports="['in/l', 'in/r', 'out/l']"
  />
</template>
```

## Inline port labels

Ports default to tooltip-only labels (hover the pin to see them). For nodes where the port name is the primary information, set the per-port `showLabel: true`, or apply a card-level default with `showPortLabels`.

`showPortLabels` accepts `'left'`, `'right'`, `'both'`, or `false`. Per-port `showLabel` always overrides the card-level default. When the inline label is shown, the card's body padding bumps automatically so the title and parameters do not overlap the labels.

For multi-channel ports, the label rendered next to each pin is the channel's label (e.g. `L`, `R`); the parent port's label appears in the tooltip (e.g. `Stereo In . L`).

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 2rem;">
    <NbBlueprintCard
      id="iface"
      title="Focusrite Scarlett"
      category="i/o . hardware"
      color="#f97316"
      :showPortLabels="'right'"
      :ports="[
        {
          id: 'inputs',
          label: 'Inputs',
          type: 'output',
          dataType: 'audio:bus',
          channels: Array.from({ length: 8 }, (_, i) => ({ id: `i${i+1}`, label: `I${i+1}` })),
        },
      ]"
    />
    <NbBlueprintCard
      id="midiport"
      title="Roland A-49"
      category="i/o . midi"
      color="#a855f7"
      :ports="[
        { id: 'midi', label: 'MIDI Out', type: 'output', dataType: 'midi', showLabel: true },
      ]"
    />
  </div>
</preview>

```vue
<!-- Audio interface with eight named outputs -->
<NbBlueprintCard
  id="iface"
  title="Focusrite Scarlett"
  category="i/o . hardware"
  color="#f97316"
  show-port-labels="right"
  :ports="[
    {
      id: 'inputs',
      label: 'Inputs',
      type: 'output',
      dataType: 'audio:bus',
      channels: Array.from({ length: 8 }, (_, i) => ({
        id: `i${i + 1}`,
        label: `I${i + 1}`,
      })),
    },
  ]"
/>

<!-- Single labeled MIDI port via per-port showLabel -->
<NbBlueprintCard
  id="midiport"
  title="Roland A-49"
  category="i/o . midi"
  color="#a855f7"
  :ports="[
    {
      id: 'midi',
      label: 'MIDI Out',
      type: 'output',
      dataType: 'midi',
      showLabel: true,
    },
  ]"
/>
```

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

| Prop             | Type                        | Default               | Description                                                                                |
| ---------------- | --------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `id`             | `string`                    | _(required)_          | Unique card identifier. Used in connection records and the `data-port` attribute.          |
| `title`          | `string`                    | _(required)_          | Card title (rendered as the dominant element in the header).                               |
| `color`          | `string`                    | `var(--nb-c-primary)` | Accent color: top bar, glow, tag, toggle tint, selected ring, connected port fill.         |
| `enabled`        | `boolean`                   | `true`                | Shows the header toggle. Omit to hide the toggle entirely.                                 |
| `selected`       | `boolean`                   | `false`               | Highlights the card with an accent ring and outer glow.                                    |
| `category`       | `string`                    | `''`                  | Monospaced uppercase tag below the title, colored to match the accent.                     |
| `ports`          | `IBlueprintPort[]`          | `[]`                  | Port definitions. `input` ports render on the left edge, `output` on the right.            |
| `connectedPorts` | `string[]`                  | `[]`                  | IDs of pins that are currently connected. Use `${port.id}/${channel.id}` for channel pins. |
| `parameters`     | `IBlueprintCardParameter[]` | `[]`                  | Structured parameter rows displayed in the card body.                                      |
| `x`              | `number`                    | `0`                   | Canvas X position (documentary: the parent positions the card).                            |
| `y`              | `number`                    | `0`                   | Canvas Y position (documentary: the parent positions the card).                            |
| `removable`      | `boolean`                   | `false`               | Shows a remove button in the header. Emits `remove` when clicked.                          |
| `collapsed`      | `boolean`                   | `false`               | Collapses the body, showing only the header row.                                           |
| `status`         | `TBlueprintCardStatus`      | `'none'`              | Status indicator dot next to the title (valid, warning, error).                            |
| `preview`        | `string`                    | `''`                  | Compact monospaced preview text shown in the body.                                         |
| `showPortLabels` | `TBlueprintPortLabelMode`   | `false`               | Card-level default for inline port labels: `'left'`, `'right'`, `'both'`, or `false`.      |

## Events

| Event             | Payload                                                         | Description                                                                    |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `select`          | `string` (the card `id`)                                        | Emitted on mousedown anywhere on the card body.                                |
| `toggle`          | `[id: string, enabled: boolean]`                                | Emitted when the header toggle is clicked.                                     |
| `toggle-collapse` | `string` (the card `id`)                                        | Emitted when the collapse chevron is clicked.                                  |
| `remove`          | `string` (the card `id`)                                        | Emitted when the remove button is clicked.                                     |
| `port-mousedown`  | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | `portId` is the rendered pin id (`${port.id}` or `${port.id}/${channel.id}`).  |
| `port-mouseup`    | `{ nodeId: string; portId: string; type: 'input' \| 'output' }` | Same `portId` semantics. Forward both to `NbBlueprint` to drive wire dragging. |

## Slots

| Slot      | Description                                                                    |
| --------- | ------------------------------------------------------------------------------ |
| `default` | Custom body content rendered below the parameters (e.g. small value readouts). |

## Types

```ts
type TBlueprintPinDataType =
  | 'geometry'
  | 'celestial'
  | 'lighting'
  | 'effect'
  | 'surface'
  | 'audio'
  | 'audio:mono'
  | 'audio:stereo'
  | 'audio:bus'
  | 'midi'
  | 'midi:rechannelized'
  | 'control'
  | 'entity'
  | 'number'
  | 'vector3'
  | 'color'
  | 'asset'
  | 'any'

type TBlueprintPortLabelMode = 'left' | 'right' | 'both' | false

interface IBlueprintPortChannel {
  id: string
  label: string
}

interface IBlueprintPort {
  id: string
  label: string
  type: 'input' | 'output'
  dataType?: TBlueprintPinDataType
  required?: boolean
  /**
   * Optional list of sub-channels. When set, the port renders one pin per
   * channel, addressable as `${port.id}/${channel.id}`. There is no bundle
   * or expand/collapse: every channel always shows so wires land on a
   * specific pin and routing is visually unambiguous.
   */
  channels?: IBlueprintPortChannel[]
  /** Render the port label inline next to the pin (in addition to the tooltip). */
  showLabel?: boolean
}

interface IBlueprintCardParameter {
  label: string
  value: string | number
  unit?: string
  bar?: number // 0 to 100, renders a thin progress bar
}
```

## Pin colors and shapes by `dataType`

| `dataType`           | Color     | Shape   | Typical use                                      |
| -------------------- | --------- | ------- | ------------------------------------------------ |
| `audio`              | `#22c55e` | pill    | Generic mono audio.                              |
| `audio:mono`         | `#22c55e` | pill    | Single-channel audio (semantic alias).           |
| `audio:stereo`       | `#10b981` | pill    | Stereo pair (declare with `channels: [L, R]`).   |
| `audio:bus`          | `#059669` | pill    | N-channel audio bus (any channel count).         |
| `midi`               | `#a855f7` | diamond | MIDI stream.                                     |
| `midi:rechannelized` | `#9333ea` | diamond | MIDI duplicated across channels (GP-style).      |
| `control`            | `#94a3b8` | diamond | Control-rate signal (parameter automation, OSC). |
| `geometry`           | `#6366f1` | pill    | Geometric data.                                  |
| `celestial`          | `#f97316` | pill    | Celestial / scene-graph data.                    |
| `lighting`           | `#f59e0b` | pill    | Lighting data.                                   |
| `effect`             | `#a855f7` | pill    | Effect-graph data.                               |
| `surface`            | `#3b82f6` | pill    | Surface / mesh data.                             |
| `entity`             | `#ec4899` | pill    | Entity / actor reference.                        |
| `number`             | `#94a3b8` | diamond | Scalar number.                                   |
| `vector3`            | `#38bdf8` | diamond | 3-component vector.                              |
| `color`              | `#fb923c` | square  | Color value.                                     |
| `asset`              | `#a78bfa` | square  | Asset reference (texture, sample, plugin).       |
| `any`                | `#64748b` | pill    | Untyped / wildcard.                              |

## Per-port style overrides

Three optional fields on `IBlueprintPort` override the `dataType`-derived defaults when two ports of the same dataType need to look different (typical example: a "bypass" control input that should read distinctly from other control ports).

| Field   | Type                                          | Effect                                                                             |
| ------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `shape` | `'pill' \| 'diamond' \| 'square' \| 'circle'` | Beats the `dataType`-derived shape.                                                |
| `color` | CSS color string                              | Beats the `dataType`-derived color. Wires drawn from / to this pin inherit it.     |
| `size`  | `'sm' \| 'md' \| 'lg'`                        | `'md'` is the default. `'sm'` de-emphasises secondary ports; `'lg'` flags primary. |

```ts
const ports: IBlueprintPort[] = [
  // A primary stereo audio input — emphasise it.
  {
    id: 'in',
    label: 'Audio In',
    type: 'input',
    dataType: 'audio:stereo',
    size: 'lg',
  },
  // A control input styled distinctly from MIDI / parameter ports
  // even though it shares dataType: 'control'.
  {
    id: 'bypass-in',
    label: 'Bypass',
    type: 'input',
    dataType: 'control',
    shape: 'circle',
    color: '#94a3b8',
    size: 'sm',
  },
]
```

Shapes render at consistent layout positions — overriding shape doesn't change where wires anchor. Sub-pins (sub-channels of a multi-channel port) keep their compact 10px height regardless of `size`.

## CSS custom properties

| Variable          | Default               | Description                                                                               |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `--nb-card-color` | `var(--nb-c-primary)` | Accent color: top bar, glow, tag, toggle tint, selected ring, connected port fill.        |
| `--nb-card-glow`  | (computed)            | 18% alpha version of the accent, used for radial glow, toggle glow, and selection shadow. |

</doc-tab>
