---
layout: nubisco
title: Blueprint Card
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprintCard` is a node card designed to live inside an [`NbBlueprint`](/ui/components/blueprint/overview) canvas. It renders a card with a top accent bar, typed input/output ports, a category tag, an optional enable toggle, and an optional remove button. It is presentational: the parent owns the card's position and the connections between cards.

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

Ports are split automatically by type: `input` on the left, `output` on the right. Pass `connectedPorts` with an array of port IDs to show which ports are wired; a wired pin is filled in its own colour.

Ports are the part of a node graph people look at most, so their anatomy, geometry and states are documented in full under [Ports](#ports) below.

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

## Ports

A port is three elements, because it answers three different questions and each has a different right answer.

| Element                          | Is                                                                                                                 | Sized                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `.nb-blueprint-card__port-hit`   | The `<button>`. The only thing that takes a click or a keypress.                                                   | 24&times;24, transparent |
| `.nb-blueprint-card__port`       | The pin. Carries `data-port`, so this box, and nothing else, is what the canvas measures to place a wire endpoint. | 8&times;16 by default    |
| `.nb-blueprint-card__port-label` | The optional inline label, a sibling of the pin, drawn inside the card.                                            | Type only                |

Keeping them apart is what lets the target be comfortable without the pin being drawn that large, and what keeps a label out of the box the wire layer measures.

### Geometry

Pins sit **outside** the card. The hit target's inner edge lands exactly on the card's outer edge, so nothing in the port column overlaps the card: its border and its identity rail stay continuous, and a click just inside the card is never intercepted by a port. It is also what Unreal, Blender, n8n and Node-RED do, so it is what people arriving at a node graph already expect.

The column is anchored to the **top** of the card, not centred in its height:

| Custom property              | Default                                                | Is                                                                                                         |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `--nb-blueprint-port-top`    | `17px`, or `26px` with a category, `13px` when compact | Centre of the first pin, from the card's top edge.                                                         |
| `--nb-blueprint-port-pitch`  | `24px`                                                 | Centre-to-centre spacing, and the height of each hit target, so adjacent targets tile rather than overlap. |
| `--nb-blueprint-port-width`  | `8px`                                                  | Pin width.                                                                                                 |
| `--nb-blueprint-port-height` | `16px`                                                 | Pin height.                                                                                                |
| `--nb-blueprint-port-hit`    | `24px`                                                 | Hit target width.                                                                                          |

Two things follow from anchoring to the top, and both matter more than they sound:

- **A card's wires never move when its body changes.** Expanding a card, adding a parameter row, or rendering different slot content leaves every pin exactly where it was.
- **A straight chain draws straight wires.** Two cards whose ports start at the same offset are joined by a horizontal wire regardless of their heights.

The trade is that a card with more pins than it is tall lets them overflow past its bottom edge, visibly, rather than quietly compressing the pitch toward zero. That is deliberate: a 12-output card should look like a 12-output card.

To move the whole column, a card with a taller custom header, say, set `--nb-blueprint-port-top` on the card. Prefer that to changing the pitch, which is tied to the hit-target height.

### States

| State          | Looks like                                       | Set by                                   |
| -------------- | ------------------------------------------------ | ---------------------------------------- |
| Free           | Outline on the card surface                      | The default                              |
| Hover          | Filled in the pin colour                         | Pointer over the hit target              |
| Focus          | 2px focus ring around the pin                    | Keyboard focus on the hit target         |
| Connected      | Solid fill, no glow                              | `connectedPorts`                         |
| Live           | Solid fill                                       | `activePorts`                            |
| Metered        | Fills from the bottom in proportion to the level | `portLevels`                             |
| Valid target   | Accent ring                                      | Automatic, while a wire is being dragged |
| Invalid target | Dimmed to 30%                                    | Automatic, while a wire is being dragged |
| Required       | Heavier outline                                  | `required: true` on an input port        |

A connected pin is filled and carries **no** glow. A glow means signal, and a wired-but-silent port has none.

### Drop targets

While a wire is being dragged, every pin in the canvas answers, in advance, whether it could accept it. Compatible pins take an accent ring; the rest dim. Nothing needs wiring up for this: `NbBlueprint` publishes the origin port through its card context and each card works out its own pins.

A pin can accept a wire when all of these hold:

1. It is on a different card.
2. It faces the other way, an output can only reach an input.
3. Its `dataType` is compatible with the origin's.

Compatibility is deliberately loose, because a graph editor that refuses plausible connections is worse than one that allows a few odd ones:

- An undeclared `dataType`, or `'any'` at either end, connects to anything.
- Identical types connect.
- Members of a family connect: `audio:mono` reaches `audio:stereo` and `audio:bus`, because they share the segment before the colon. `midi` reaches neither.

### Signal level and activity

Pass `portLevels`, a map of port id to a number from 0 to 1, and each of those pins becomes a meter, filling from the bottom in the pin colour. A quiet port looks quiet, a hot one looks hot, and nothing loops. Values outside the range are clamped.

A port in `activePorts` with no entry in `portLevels` renders as a solid fill instead.

The expanding ring is reserved for genuinely discrete moments: the card fires a single ping when a port **enters** `activePorts`, so one ping means one thing happened. Under `prefers-reduced-motion: reduce` the card schedules no ping at all.

```vue
<NbBlueprintCard
  id="filter"
  title="Low-pass"
  :ports="ports"
  :connected-ports="['in', 'out']"
  :active-ports="['in', 'out']"
  :port-levels="{ in: inputLevel, out: outputLevel }"
/>
```

`portLevels` is an ordinary reactive prop, so write it at frame rate, not at audio rate. For audio-rate values, use the blueprint's non-reactive `live` channel instead, which the PixiJS renderer reads on its own throttled tick.

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

## Density

`density` controls how tightly the card packs its chrome. Set it once on `NbBlueprint` and every card inherits it; a card can still override its own.

| Density     | Header                                     | Category line | Parameter rows | First pin   |
| ----------- | ------------------------------------------ | ------------- | -------------- | ----------- |
| `'default'` | 34px, or 51px when the card has a category | Shown         | 24px           | 17px / 26px |
| `'compact'` | 26px                                       | Hidden        | 20px           | 13px        |

`'compact'` is worth reaching for once a graph is past roughly twenty nodes, where the headers are more of the canvas than the graph is.

Density changes chrome only. Port width, height, pitch and hit area are identical at both densities, so switching density does not move a single wire. The one thing that does move is `--nb-blueprint-port-top`, which tracks the header it is meant to line up with.

```vue
<!-- Every card in this canvas is compact... -->
<NbBlueprint density="compact">
  <NbBlueprintCard id="a" title="Gain" />
  <!-- ...except this one. -->
  <NbBlueprintCard id="b" title="Master bus" density="default" />
</NbBlueprint>
```

## Keyboard and assistive technology

The card is a focusable `role="group"`, labelled with its title, category, status and enabled state. Every control inside it is a real button with its own accessible name.

| Key                                                                     | Where                            | Does                                                   |
| ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| <kbd>Tab</kbd>                                                          | Anywhere                         | Moves through the card and its controls.               |
| <kbd>&larr;</kbd> <kbd>&rarr;</kbd> <kbd>&uarr;</kbd> <kbd>&darr;</kbd> | Card                             | Moves the card by one canvas unit.                     |
| <kbd>Shift</kbd> + arrow                                                | Card                             | Moves it by ten.                                       |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                     | Port                             | Starts a connection, or completes one already started. |
| <kbd>Esc</kbd>                                                          | Port                             | Abandons a connection in progress.                     |
| <kbd>Enter</kbd> / <kbd>Space</kbd>                                     | Collapse chevron, toggle, remove | Activates that control.                                |

Connecting by keyboard walks the same two-step path the mouse does and goes through the same handlers, so a keyboard connection is indistinguishable from a dragged one to the host. While a connection is in progress, valid targets ring and invalid ones dim exactly as they do for the mouse, which is what makes the keyboard flow navigable at all.

Nudging is routed through the parent `NbBlueprint`, so it reports itself with the same `move` event a drag does, and nudging a card that is part of the selection moves the whole selection, again matching the mouse. Positions have one path out of the component, not two.

Focusing a card also selects it, so the inspector and the canvas agree about what the user is looking at.

## Inside a blueprint

For a complete example wiring cards and ports into an `NbBlueprint` canvas, see the [Blueprint](/ui/components/blueprint/overview) docs.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type                        | Default               | Description                                                                                                                                                |
| ---------------- | --------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `string`                    | _(required)_          | Unique card identifier. Used in connection records and the `data-port` attribute.                                                                          |
| `title`          | `string`                    | _(required)_          | Card title (rendered as the dominant element in the header).                                                                                               |
| `color`          | `string`                    | `var(--nb-c-primary)` | Node identity colour: the left rail, the selected border, connected pin fill, meter fill.                                                                  |
| `enabled`        | `boolean`                   | `true`                | Shows the header toggle. Omit to hide the toggle entirely.                                                                                                 |
| `selected`       | `boolean`                   | `false`               | Draws the card's border in its own colour, with a matching inset line.                                                                                     |
| `category`       | `string`                    | `''`                  | Uppercase label below the title, in neutral text. Also moves the first pin down to line up with the taller header.                                         |
| `ports`          | `IBlueprintPort[]`          | `[]`                  | Port definitions. `input` ports render on the left edge, `output` on the right.                                                                            |
| `connectedPorts` | `string[]`                  | `[]`                  | IDs of pins that are currently connected. Use `${port.id}/${channel.id}` for channel pins.                                                                 |
| `parameters`     | `IBlueprintCardParameter[]` | `[]`                  | Structured parameter rows displayed in the card body.                                                                                                      |
| `x`              | `number`                    | `0`                   | Canvas X position (documentary: the parent positions the card).                                                                                            |
| `y`              | `number`                    | `0`                   | Canvas Y position (documentary: the parent positions the card).                                                                                            |
| `removable`      | `boolean`                   | `false`               | Shows a remove button in the header. Emits `remove` when clicked.                                                                                          |
| `collapsed`      | `boolean`                   | `false`               | Collapses the body, showing only the header row.                                                                                                           |
| `status`         | `TBlueprintCardStatus`      | `'none'`              | Status glyph in the header: a ringed check, a warning triangle, or a filled error circle. Shape carries the meaning, so the three stay apart in greyscale. |
| `preview`        | `string`                    | `''`                  | Compact monospaced preview text shown in the body.                                                                                                         |
| `showPortLabels` | `TBlueprintPortLabelMode`   | `false`               | Card-level default for inline port labels: `'left'`, `'right'`, `'both'`, or `false`.                                                                      |
| `portLevels`     | `Record<string, number>`    | `{}`                  | Signal level per port id, 0 to 1. Listed pins render as meters; see [Signal level and activity](#signal-level-and-activity).                               |
| `density`        | `TBlueprintDensity`         | inherited             | `'default'` or `'compact'`. Inherited from the parent `NbBlueprint` when unset. Chrome only: it never moves a pin.                                         |

## Events

| Event             | Payload                          | Description                                                                                                                         |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `select`          | `string` (the card `id`)         | Emitted on mousedown anywhere on the card body.                                                                                     |
| `toggle`          | `[id: string, enabled: boolean]` | Emitted when the header toggle is clicked.                                                                                          |
| `toggle-collapse` | `string` (the card `id`)         | Emitted when the collapse chevron is clicked.                                                                                       |
| `remove`          | `string` (the card `id`)         | Emitted when the remove button is clicked.                                                                                          |
| `port-mousedown`  | `IBlueprintCardPortEvent`        | `portId` is the rendered pin id (`${port.id}` or `${port.id}/${channel.id}`); `dataType` is the pin's declared type, if it has one. |
| `port-mouseup`    | `IBlueprintCardPortEvent`        | Same `portId` semantics. Forward both to `NbBlueprint` to drive wire dragging.                                                      |

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

Every shape and size is a real dimension on the pin element, so a pin's appearance, its wire endpoint and its hit area always agree. Shapes are centred on the same axis, so overriding a shape does not move the wire endpoint. Symmetrical shapes (`diamond`, `square`, `circle`) sit tangent to the card edge rather than flush against it, and the diamond is inset by the (√2 − 1) / 2 its rotated corners reach past its box.

Sub-pins (channels of a multi-channel port) render shorter than a root pin so a row of them reads as one stacked port.

## CSS custom properties

| Variable                     | Default                  | Description                                                                                                       |
| ---------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `--nb-card-color`            | `var(--nb-c-primary)`    | Node identity colour: the left rail, the selected border, connected pin fill, meter fill.                         |
| `--nb-card-glow`             | (computed)               | 18% alpha version of the identity colour. Still published for host CSS; the card itself no longer paints with it. |
| `--nb-blueprint-port-top`    | `17px` / `26px` / `13px` | Centre of the first pin from the card's top edge. See [Geometry](#geometry).                                      |
| `--nb-blueprint-port-pitch`  | `24px`                   | Pin centre-to-centre spacing, and the hit-target height.                                                          |
| `--nb-blueprint-port-width`  | `8px`                    | Pin width.                                                                                                        |
| `--nb-blueprint-port-height` | `16px`                   | Pin height.                                                                                                       |
| `--nb-blueprint-port-hit`    | `24px`                   | Hit-target width.                                                                                                 |
| `--nb-blueprint-rail-width`  | `3px`                    | Width of the identity rail on the card's left edge.                                                               |

The card reads these theme tokens rather than any literal colour, so retheming it is a token change and never a component change: `--nb-c-port-bg`, `--nb-c-port-border`, `--nb-c-port-signal`, `--nb-c-node-row-bg`, and `--nb-c-status-valid` / `-warning` / `-error`.

</doc-tab>
