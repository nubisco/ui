---
layout: nubisco
title: Blueprint
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprint` is a visual node editor canvas with built-in card dragging, multi-selection, alignment, distribution, auto-layout, and animated bezier wires. It has no domain logic: the parent owns card data, positions, and connections.

## Interaction model

| Action                 | Effect                         |
| ---------------------- | ------------------------------ |
| Left drag on canvas    | Marquee (box) select           |
| Shift + marquee        | Add to selection               |
| Click on card          | Select card (deselects others) |
| Shift + click on card  | Toggle card in selection       |
| Drag a selected card   | Move all selected cards        |
| Middle mouse drag      | Pan the canvas                 |
| Space + left drag      | Pan the canvas                 |
| Mouse wheel            | Focal-point zoom (0.2x to 3x)  |
| Drag from port to port | Connect two cards              |
| Click a wire           | Disconnect                     |

## Basic example

Cards are placed in the default slot with `transform: translate(x, y)` positioning. The parent keeps the `connections` array and reacts to `connect`, `disconnect`, and `move` events.

<preview>
  <div style="height: 360px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden; display: flex;">
    <NbBlueprint
      ref="demoBlueprint"
      :connections="demoConnections"
      @connect="onDemoConnect"
      @disconnect="onDemoDisconnect"
      @move="onDemoMove"
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
          :selected="demoBlueprint?.selectedIds?.has(card.id)"
          :collapsed="!demoBlueprint?.selectedIds?.has(card.id)"
          @port-mousedown="demoBlueprint?.onPortMouseDown($event)"
          @port-mouseup="demoBlueprint?.onPortMouseUp($event)"
        />
      </div>
    </NbBlueprint>
  </div>
  <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.autoLayout()">Auto layout</NbButton>
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.fitToView()">Fit to view</NbButton>
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.selectAll()">Select all</NbButton>
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.distributeHorizontally()">Distribute H</NbButton>
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.distributeVertically()">Distribute V</NbButton>
    <NbButton size="sm" variant="ghost" @click="demoBlueprint?.alignTop()">Align top</NbButton>
    <NbButton size="sm" variant="ghost" @click="resetDemo">Reset</NbButton>
  </div>
</preview>

```vue
<template>
  <div style="height: 480px;">
    <NbBlueprint
      ref="blueprint"
      :connections="connections"
      @connect="onConnect"
      @disconnect="onDisconnect"
      @move="onMove"
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
          :selected="blueprint?.selectedIds?.has(card.id)"
          @port-mousedown="blueprint?.onPortMouseDown($event)"
          @port-mouseup="blueprint?.onPortMouseUp($event)"
        />
      </div>
    </NbBlueprint>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IBlueprintConnection, IBlueprintCardMove } from '@nubisco/ui'

const blueprint = ref()

// Handle card moves (the consumer owns position data)
function onMove(moves: IBlueprintCardMove[]) {
  for (const m of moves) {
    const card = cards.value.find((c) => c.id === m.id)
    if (card) {
      card.x = m.x
      card.y = m.y
    }
  }
}
</script>
```

## Card dragging

Cards are now draggable directly. When you drag a selected card, all selected cards move together. When you drag an unselected card, it becomes selected first.

On drag end, the blueprint emits `move` with an array of `{ id, x, y }` objects. The consumer should update their data model with these positions so they persist across re-renders.

## Focus and selection

The Blueprint distinguishes between two concepts:

- **Focused card** (single): the card the user last clicked. Clients use this for inspector panels, property editing, or any single-card context. The `focus` event emits the card ID (or `null`). Access via the exposed `focusedId` ref.
- **Selected cards** (one or more): the set of cards that move, align, and distribute together. Used for spatial operations. The `selection-change` event emits the full ID array. Access via the exposed `selectedIds` ref.

Clicking a card both focuses and selects it. Shift+click adds or removes cards from the selection without changing focus.

- **Click** a card to focus and select it (deselects others).
- **Shift+click** to add or remove a card from the selection.
- **Left-drag on empty canvas** draws a marquee rectangle. Cards intersecting the rectangle are selected.
- **Shift+marquee** adds to the existing selection.
- **`selectAll()`** and **`deselectAll()`** are exposed for toolbar buttons or keyboard shortcuts.

## Alignment and distribution

When multiple cards are selected, you can align or distribute them using exposed methods:

| Method                     | Effect                                                |
| -------------------------- | ----------------------------------------------------- |
| `alignLeft()`              | Align selected cards to the leftmost edge             |
| `alignCenter()`            | Align selected cards to the average horizontal center |
| `alignRight()`             | Align selected cards to the rightmost edge            |
| `alignTop()`               | Align selected cards to the topmost edge              |
| `alignMiddle()`            | Align selected cards to the average vertical center   |
| `alignBottom()`            | Align selected cards to the bottommost edge           |
| `distributeHorizontally()` | Space selected cards evenly along the X axis          |
| `distributeVertically()`   | Space selected cards evenly along the Y axis          |

All alignment/distribution methods emit `move` so the consumer can persist the new positions.

## Auto-layout

`autoLayout()` arranges all cards in a layered left-to-right layout based on their connections (topological ordering). Cards within each layer are sorted by category for visual grouping.

```vue
<NbButton @click="blueprint?.autoLayout()">Auto layout</NbButton>
<NbButton
  @click="blueprint?.autoLayout({ gapX: 120, gapY: 60 })"
>Wider</NbButton>
```

Options: `{ gapX?: number, gapY?: number, padding?: number }` (defaults: 80, 40, 60).

## View controls

| Method                | Effect                                                          |
| --------------------- | --------------------------------------------------------------- |
| `fitToView(padding?)` | Scale zoom so all cards fit the viewport (default 40px padding) |
| `centerView()`        | Reset zoom to 1x, center cards                                  |
| `resetView()`         | Reset pan to 0,0 and zoom to 1x                                 |

## Panning

Panning uses middle mouse button or **Space + left drag**. This keeps left drag free for marquee selection and card dragging.

## Theming

The canvas background uses `--nb-c-layer-0`. Ambient gradients are configurable via `--nb-blueprint-ambient-1` and `--nb-blueprint-ambient-2` (set to `transparent` to disable). Wire colors are derived from each source card's `--nb-card-color`.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop          | Type                     | Default | Description                                                   |
| ------------- | ------------------------ | ------- | ------------------------------------------------------------- |
| `connections` | `IBlueprintConnection[]` | `[]`    | Wires to draw between card ports. The parent owns this array. |

## Events

| Event              | Payload                | Description                                                               |
| ------------------ | ---------------------- | ------------------------------------------------------------------------- |
| `connect`          | `IBlueprintConnection` | Emitted when a drag from one port is released on another compatible port. |
| `disconnect`       | `IBlueprintConnection` | Emitted when an existing wire is clicked.                                 |
| `move`             | `IBlueprintCardMove[]` | Emitted after cards are dragged, aligned, distributed, or auto-laid out.  |
| `focus`            | `string \| null`       | Emitted when a card is focused (clicked). `null` when focus is cleared.   |
| `selection-change` | `string[]`             | Emitted when the set of selected card IDs changes.                        |

## Slots

| Slot      | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| `default` | Card layer. Place `NbBlueprintCard` instances here, positioned with `transform: translate(x, y)` on a wrapper. |

## Exposed instance

Access via a template `ref`.

### View

| Member       | Signature                    | Description                                 |
| ------------ | ---------------------------- | ------------------------------------------- |
| `fitToView`  | `(padding?: number) => void` | Scale and center all cards in the viewport. |
| `centerView` | `() => void`                 | Center cards at 1x zoom.                    |
| `resetView`  | `() => void`                 | Reset pan to 0,0 and zoom to 1x.            |

### Focus and selection

| Member        | Signature             | Description                                    |
| ------------- | --------------------- | ---------------------------------------------- |
| `focusedId`   | `Ref<string \| null>` | The currently focused card ID (for inspector). |
| `selectedIds` | `Ref<Set<string>>`    | Currently selected card IDs.                   |
| `selectAll`   | `() => void`          | Select all cards in the canvas.                |
| `deselectAll` | `() => void`          | Clear selection and focus.                     |

### Alignment and distribution

| Member                   | Signature    | Description                                   |
| ------------------------ | ------------ | --------------------------------------------- |
| `alignLeft`              | `() => void` | Align selected cards to the leftmost edge.    |
| `alignCenter`            | `() => void` | Align to the average horizontal center.       |
| `alignRight`             | `() => void` | Align to the rightmost edge.                  |
| `alignTop`               | `() => void` | Align selected cards to the topmost edge.     |
| `alignMiddle`            | `() => void` | Align to the average vertical center.         |
| `alignBottom`            | `() => void` | Align to the bottommost edge.                 |
| `distributeHorizontally` | `() => void` | Space selected cards evenly along the X axis. |
| `distributeVertically`   | `() => void` | Space selected cards evenly along the Y axis. |

### Auto-layout

| Member       | Signature                                                                | Description                                          |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `autoLayout` | `(options?: { gapX?: number; gapY?: number; padding?: number }) => void` | Arrange all cards in a layered left-to-right layout. |

### Ports

| Member            | Signature                                                                    | Description                        |
| ----------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| `onPortMouseDown` | `(d: { nodeId: string; portId: string; type: 'input' \| 'output' }) => void` | Start a drag-to-connect operation. |
| `onPortMouseUp`   | `(d: { nodeId: string; portId: string; type: 'input' \| 'output' }) => void` | Complete the connection.           |

### State

| Member | Signature     | Description              |
| ------ | ------------- | ------------------------ |
| `panX` | `Ref<number>` | Current pan offset (px). |
| `panY` | `Ref<number>` | Current pan offset (px). |
| `zoom` | `Ref<number>` | Current zoom (0.2 to 3). |

## Types

```ts
interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}

interface IBlueprintCardMove {
  id: string
  x: number
  y: number
}
```

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { IBlueprintCardMove } from '../../src/main'

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

const demoBlueprint = ref<any>(null)

const demoCards = ref<IDemoCard[]>(
  initialDemoCards.map((c) => ({ ...c, ports: c.ports.map((p) => ({ ...p })) })),
)
const demoConnections = ref([...initialConnections])

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

function onDemoMove(moves: IBlueprintCardMove[]) {
  for (const m of moves) {
    const card = demoCards.value.find((c) => c.id === m.id)
    if (card) {
      card.x = m.x
      card.y = m.y
    }
  }
}

function resetDemo() {
  demoCards.value = initialDemoCards.map((c) => ({
    ...c,
    ports: c.ports.map((p) => ({ ...p })),
  }))
  demoConnections.value = [...initialConnections]
}
</script>
