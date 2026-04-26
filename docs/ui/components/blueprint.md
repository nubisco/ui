---
layout: nubisco
title: Blueprint
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprint` is a generic visual node editor canvas. It provides a pannable, zoomable surface on which you place `NbBlueprintCard` nodes and draws animated bezier wires between their ports. It has no domain logic: connections, card positions, and card state are owned by the parent.

## What it gives you

- **Pan** by dragging the canvas background (drags on cards and ports are ignored).
- **Focal-point zoom** on mouse wheel, clamped between `0.2x` and `3x`.
- **Animated wire rendering**: bezier SVG paths with a flowing dashed stroke, colored to match the source node's accent. Each wire has a soft drop-shadow glow.
- **Drag-to-connect**: while the user drags from a port, a dashed preview wire follows the cursor; releasing on a compatible port emits `connect`.
- **Click-to-disconnect**: clicking an existing wire emits `disconnect`.
- **Auto re-layout**: a `MutationObserver` watches the DOM inside the canvas so wires re-compute whenever cards are added, removed, or moved.
- **Ambient canvas**: dot grid with radial fade, plus subtle colored gradients for atmosphere.

## Basic example

Cards are placed in the default slot and positioned with inline `transform: translate(...)`. The parent keeps the `connections` array and reacts to `connect` / `disconnect`. Try panning the canvas by dragging the background, zooming with the wheel, dragging between ports to connect them, and clicking a wire to disconnect.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden; display: flex;">
    <NbBlueprint
      ref="demoBlueprint"
      :connections="demoConnections"
      @connect="onDemoConnect"
      @disconnect="onDemoDisconnect"
    >
      <div
        v-for="card in demoCards"
        :key="card.id"
        :style="{ position: 'absolute', transform: `translate(${card.x}px, ${card.y}px)` }"
      >
        <NbBlueprintCard
          :id="card.id"
          :title="card.title"
          :category="card.category"
          :color="card.color"
          :ports="card.ports"
          :connected-ports="connectedPortsFor(card.id)"
          :selected="demoSelectedId === card.id"
          :collapsed="demoSelectedId !== card.id"
          @select="demoSelectedId = $event"
          @toggle-collapse="demoSelectedId = demoSelectedId === $event ? null : $event"
          @port-mousedown="demoBlueprint?.onPortMouseDown($event)"
          @port-mouseup="demoBlueprint?.onPortMouseUp($event)"
        />
      </div>
    </NbBlueprint>
  </div>
  <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.centerView()">Center view</NbButton>
    <NbButton size="sm" variant="ghost" @click="resetDemo">Reset</NbButton>
  </div>
</preview>

```vue
<template>
  <div style="height: 480px; border: 1px solid var(--nb-c-border);">
    <NbBlueprint
      ref="blueprint"
      :connections="connections"
      @connect="onConnect"
      @disconnect="onDisconnect"
    >
      <div
        v-for="card in cards"
        :key="card.id"
        :style="{
          position: 'absolute',
          transform: `translate(${card.x}px, ${card.y}px)`,
        }"
      >
        <NbBlueprintCard
          :id="card.id"
          :title="card.title"
          :category="card.category"
          :color="card.color"
          :ports="card.ports"
          :connected-ports="connectedPortsFor(card.id)"
          :selected="selectedId === card.id"
          :collapsed="selectedId !== card.id"
          @select="selectedId = $event"
          @port-mousedown="blueprint?.onPortMouseDown($event)"
          @port-mouseup="blueprint?.onPortMouseUp($event)"
        />
      </div>
    </NbBlueprint>
  </div>
</template>
```

## Wiring up ports

`NbBlueprint` does not know about its cards directly. It watches the DOM for elements with a `data-port="nodeId:portId"` attribute (emitted automatically by `NbBlueprintCard`). To complete the connection lifecycle, forward the card's `port-mousedown` / `port-mouseup` events to the blueprint's exposed handlers through a template ref.

The blueprint will only emit `connect` when the two ports belong to different nodes and are of opposite types (one `input` and one `output`).

## Wire coloring

Wires automatically pick up the accent color of the source node's card (via the `--nb-card-color` CSS variable). Each wire renders with a soft drop-shadow glow and an animated dashed stroke showing the direction of data flow.

## Centering the view

`centerView()` is exposed on the component instance. It resets the zoom to `1x` and pans so the bounding box of the current cards is centered in the viewport. It's called automatically once on mount.

```vue
<NbButton @click="blueprint?.centerView()">Center</NbButton>
```

## Sizing

The canvas grows to fill its container (`flex: 1` + `overflow: hidden`). Place it inside a block with an explicit height, typically the `#bottom` slot of an [`NbShell`](/ui/components/shell) or a fixed-height card.

## Theming

The canvas background uses the layer system (`--nb-c-layer-0`, falling back to `--nb-c-bg`). Ambient gradients add subtle color atmosphere. The wire colors are derived from each source card's `--nb-card-color`. Override these on an ancestor to reskin.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                     | Default | Description                                                   |
| ------------- | ------------------------ | ------- | ------------------------------------------------------------- |
| `connections` | `IBlueprintConnection[]` | `[]`    | Wires to draw between card ports. The parent owns this array. |

## Events

| Event        | Payload                | Description                                                               |
| ------------ | ---------------------- | ------------------------------------------------------------------------- |
| `connect`    | `IBlueprintConnection` | Emitted when a drag from one port is released on another compatible port. |
| `disconnect` | `IBlueprintConnection` | Emitted when an existing wire is clicked.                                 |

## Slots

| Slot      | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `default` | Card layer. Place `NbBlueprintCard` instances here, positioned with `transform: translate(x, y)` on a wrapper. |

## Exposed instance methods

Access these via a template `ref`.

| Member            | Signature                                                                    | Description                                                                             |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `centerView`      | `() => void`                                                                 | Reset zoom to `1x` and pan so all cards are centered.                                   |
| `onPortMouseDown` | `(d: { nodeId: string; portId: string; type: 'input' \| 'output' }) => void` | Forward `NbBlueprintCard`'s `port-mousedown` here to start a drag-to-connect operation. |
| `onPortMouseUp`   | `(d: { nodeId: string; portId: string; type: 'input' \| 'output' }) => void` | Forward `NbBlueprintCard`'s `port-mouseup` here to complete the connection.             |
| `panX`            | `Ref<number>`                                                                | Current pan offset in pixels.                                                           |
| `panY`            | `Ref<number>`                                                                | Current pan offset in pixels.                                                           |
| `zoom`            | `Ref<number>`                                                                | Current zoom level (`0.2` to `3`).                                                      |

## Types

```ts
interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}
```

## Interaction

- **Pan**: mousedown on empty canvas, drag.
- **Zoom**: mouse wheel anywhere over the canvas. Zoom focuses on the cursor position.
- **Connect**: mousedown on a port, drag to a port on another card of opposite type, mouseup.
- **Disconnect**: click an existing wire path.

</doc-tab>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface IDemoCard {
  id: string
  title: string
  category: string
  color: string
  x: number
  y: number
  ports: { id: string; label: string; type: 'input' | 'output' }[]
}

const initialDemoCards: IDemoCard[] = [
  {
    id: 'input',
    title: 'Audio In',
    category: 'source',
    color: '#22c55e',
    x: 40,
    y: 80,
    ports: [{ id: 'out', label: 'out', type: 'output' }],
  },
  {
    id: 'filter',
    title: 'Low-pass',
    category: 'effect',
    color: '#a855f7',
    x: 240,
    y: 60,
    ports: [
      { id: 'in', label: 'in', type: 'input' },
      { id: 'out', label: 'out', type: 'output' },
    ],
  },
  {
    id: 'gain',
    title: 'Gain',
    category: 'effect',
    color: '#38bdf8',
    x: 240,
    y: 160,
    ports: [
      { id: 'in', label: 'in', type: 'input' },
      { id: 'out', label: 'out', type: 'output' },
    ],
  },
  {
    id: 'output',
    title: 'Speakers',
    category: 'sink',
    color: '#f97316',
    x: 440,
    y: 110,
    ports: [{ id: 'in', label: 'in', type: 'input' }],
  },
]

const initialConnections = [
  { fromNode: 'input', fromPort: 'out', toNode: 'filter', toPort: 'in' },
  { fromNode: 'filter', fromPort: 'out', toNode: 'output', toPort: 'in' },
]

const demoBlueprint = ref<{
  onPortMouseDown: (d: {
    nodeId: string
    portId: string
    type: 'input' | 'output'
  }) => void
  onPortMouseUp: (d: {
    nodeId: string
    portId: string
    type: 'input' | 'output'
  }) => void
  centerView: () => void
} | null>(null)

const demoCards = ref<IDemoCard[]>(
  initialDemoCards.map((c) => ({ ...c, ports: c.ports.map((p) => ({ ...p })) })),
)
const demoConnections = ref([...initialConnections])
const demoSelectedId = ref<string | null>(null)

// Compute connected port IDs for a given card
function connectedPortsFor(cardId: string): string[] {
  const ports = new Set<string>()
  for (const c of demoConnections.value) {
    if (c.fromNode === cardId) ports.add(c.fromPort)
    if (c.toNode === cardId) ports.add(c.toPort)
  }
  return Array.from(ports)
}

function onDemoConnect(c: {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}) {
  const exists = demoConnections.value.some(
    (x) =>
      x.fromNode === c.fromNode &&
      x.fromPort === c.fromPort &&
      x.toNode === c.toNode &&
      x.toPort === c.toPort,
  )
  if (!exists) demoConnections.value.push(c)
}

function onDemoDisconnect(c: {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}) {
  demoConnections.value = demoConnections.value.filter(
    (x) =>
      !(
        x.fromNode === c.fromNode &&
        x.fromPort === c.fromPort &&
        x.toNode === c.toNode &&
        x.toPort === c.toPort
      ),
  )
}

function resetDemo() {
  demoCards.value = initialDemoCards.map((c) => ({
    ...c,
    ports: c.ports.map((p) => ({ ...p })),
  }))
  demoConnections.value = [...initialConnections]
  demoSelectedId.value = null
}
</script>
