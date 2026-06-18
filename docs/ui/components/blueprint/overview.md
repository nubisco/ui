---
layout: nubisco
title: Blueprint
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbBlueprint` is a visual node editor canvas with built-in card dragging, multi-selection, alignment, distribution, auto-layout, and animated bezier wires. It has no domain logic: the parent owns card data, positions, and connections.

## Interaction model

| Action                 | Effect                          |
| ---------------------- | ------------------------------- |
| Left drag on canvas    | Marquee (box) select            |
| Shift + marquee        | Add to selection                |
| Click on card          | Select card (deselects others)  |
| Shift + click on card  | Toggle card in selection        |
| Drag a selected card   | Move all selected cards         |
| Two-finger scroll      | Pan the canvas                  |
| Middle mouse drag      | Pan the canvas                  |
| Space + left drag      | Pan the canvas                  |
| Pinch (trackpad)       | Focal-point zoom                |
| Ctrl + scroll          | Focal-point zoom                |
| Drag from port to port | Connect two cards               |
| Right-click a wire     | Context menu (Disconnect, etc.) |

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
          :focused="demoBlueprint?.focusedId === card.id"
          :collapsed="demoBlueprint?.focusedId !== card.id"
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
          :focused="blueprint?.focusedId === card.id"
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

## Windowed rendering (large graphs)

The basic example above hands cards to the default slot, so every card is
mounted all the time. That is fine up to a hundred or so cards. Past that,
the layout, paint, and compositing cost of all those off-screen DOM
subtrees starts to show up as sluggish panning and dragging.

For large graphs, pass card geometry as the `cards` prop and render each
card through the `#card` scoped slot instead. Blueprint then owns the
`v-for` and the position wrappers, and only mounts the cards whose box (or a
wire crossing the viewport) is actually on screen. Off-screen cards are
never instantiated, so render cost tracks what's visible, not the total
node count.

```vue
<template>
  <div style="height: 480px;">
    <NbBlueprint
      ref="blueprint"
      :cards="cards"
      :connections="connections"
      @move="onMove"
    >
      <template #card="{ card }">
        <NbBlueprintCard
          :id="card.id"
          :title="card.title"
          :ports="card.ports"
          :selected="blueprint?.selectedIds?.has(card.id)"
          :focused="blueprint?.focusedId === card.id"
        />
      </template>
    </NbBlueprint>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { IBlueprintCard, IBlueprintCardMove } from '@nubisco/ui'

// Cards carry their own geometry. Width/height are optional but make the
// off-screen cull tighter; extra fields (title, ports, ...) ride along and
// come back through the #card slot untouched.
const cards = ref<IBlueprintCard[]>([
  { id: 'osc', x: 40, y: 60, width: 220, height: 160 /* , title, ports */ },
  // ...
])

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

Notes:

- **Mutually exclusive with the default slot.** When `cards` is set, the
  default slot is ignored. Use one API or the other.
- **You still own card data and positions.** Handle `move` and fold it back
  into `cards` exactly as in the default-slot API. That round trip is what
  keeps a dragged card glued to the cursor.
- **Wires never vanish mid-canvas.** A wire whose path crosses the viewport
  keeps both its endpoint cards mounted even when one end is scrolled far
  off, so the visible part of the wire still draws.
- **Sizing.** Give `width`/`height` when you know them for the tightest
  cull. Otherwise `cardSizeEstimate` (or a built-in default) is used; the
  overscan band means a loose estimate just mounts a few extra edge cards
  rather than dropping visible ones.
- **`fitToView`, `centerView`, `autoLayout`, and `selectAll`** operate over
  the full `cards` prop, not just the mounted subset, so they behave the
  same as in the non-windowed API.

## Drag-to-connect

Cards rendered inside an `NbBlueprint` automatically wire their port
mousedown/mouseup events to the blueprint via Vue `provide`/`inject`. No
parent boilerplate needed: drop `NbBlueprintCard` in the default slot, and
dragging from a port to another compatible port emits `connect` on the
blueprint.

The card still emits `port-mousedown` and `port-mouseup` so consumers using
`NbBlueprintCard` outside an `NbBlueprint` (in a docs page, isolated demo,
etc.) can wire the events manually if needed.

## Wire context menu

Right-clicking a wire opens a small context menu anchored at the cursor.
The default menu shows a single **Disconnect** action that emits
`disconnect` on the blueprint with the connection. Esc or a click outside
closes the menu.

To replace or extend the menu, use the `wire-menu` slot. The slot scope
exposes the connection plus `close()` and `disconnect()` helpers:

```vue
<NbBlueprint :connections="connections">
  <template #wire-menu="{ connection, close, disconnect }">
    <button @click="disconnect()">Disconnect</button>
    <button @click="onInsertNode(connection); close()">Insert node…</button>
  </template>
  <!-- cards go here -->
</NbBlueprint>
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

## Panning and zooming

Panning: **two-finger scroll** (trackpad), **middle mouse drag**, or **Space + left drag**. This keeps left drag free for marquee selection and card dragging.

The Space + drag gesture is suspended whenever a text input, textarea, or `contenteditable` element has focus elsewhere on the page — typing a space into an inspector field next to the canvas keeps working. Click on the canvas (or anywhere outside a text-entry surface) to re-enable Space-drag pan.

Zooming: **pinch** (trackpad) or **Ctrl + scroll wheel**. Both use focal-point zoom centered on the cursor position, clamped between 0.2x and 3x.

The `wheelMode` prop overrides what plain wheel events do without affecting the pinch-to-zoom path:

- `'auto'` (default): plain wheel pans, pinch zooms. Matches the gestures above.
- `'zoom'`: every wheel event becomes a cursor-anchored zoom. Right for node-editor surfaces where panning has its own gesture (e.g. **Space + drag**) and the wheel is the natural zoom verb.
- `'pan'`: every wheel event pans, never zooms. Use when zoom should be exclusively gesture-driven.

## Wire animation modes

Wires can be static, always-animating, or signal-driven. Pick a policy with `animateConnections`:

- `'never'` (default) — static wires; no flow overlay, no colour shift. Cheapest option; right for graphs that don't carry signal.
- `'always'` — every wire animates continuously. Visual cue that the graph is "live" without per-wire bookkeeping.
- `'on-activity'` — animate iff `connection.active === true`. Inactive wires stay visible but dim and don't animate. Matches an audio host where the parent ships a per-wire boolean that flips when peak crosses a threshold.
- `'levels'` — same activity gating as `'on-activity'`, plus audio wires colour-shift green → yellow → red based on `connection.level` (0..1). MIDI wires (or wires whose `level` is undefined) keep their card-accent colour and behave like `'on-activity'`.

The `level` field is a linear amplitude in `[0, 1]`. Level 0 maps to green, 0.5 to yellow, 1.0 to red, with linear blending between anchors. The host owns the smoothing — typically a peak meter with capacitor decay produces stable, readable levels at 16–60 Hz update rates.

## Drop-on-wire

A single-card drag that ends with the cursor over a wire's hit-region fires `drop-on-wire` with the dragged card id and the wire's connection. Multi-card drags never fire this event — the gesture is "pick up THIS card and drop it on a wire", not "move a selection over a wire".

The component only emits the gesture; the host decides what to do with it. The typical handler splices the dragged card into the wire (channel-matched for parallel bundles, e.g. L+R), but other interpretations (e.g. attach a probe, branch a tap) are valid too.

To give the user a live hint before the drop, subscribe to `wire-hover`. It fires DURING a single-card drag whenever the wire under the cursor changes (entry, exit, or transition to a different wire). The payload is the dragged card id plus the new wire (or `null` when the cursor leaves the last wire). The event is de-duped — it fires on transitions, not on every mousemove tick — so subscribers can put expensive work (e.g. a splice-preview tooltip) in the handler without watching for performance.

```vue
<NbBlueprint
  :connections="connections"
  @drop-on-wire="onSplice"
  @wire-hover="(cardId, conn) => (hoverWire = conn)"
/>
```

## Renderer

Blueprint draws the camera-transformed scene (grid, wires, cards) through a swappable renderer, chosen with the `renderer` prop. The public API (props, events, exposed methods, the `useBlueprint()` controller) is identical across renderers, so you can switch without touching host code.

- `'auto'` (default) — use the PixiJS (WebGL) renderer when a WebGL-capable client renderer is available, otherwise the DOM/SVG renderer. Server-side rendering always uses DOM.
- `'dom'` — force the DOM/SVG renderer.
- `'pixi'` — force the PixiJS (WebGL) renderer. Falls back to DOM with a console warning when it is not available.

```vue
<NbBlueprint :cards="cards" :connections="connections" renderer="auto" />
```

### PixiJS renderer

The PixiJS renderer targets large graphs (thousands of cards) where DOM/SVG pan and zoom become the bottleneck. It moves the grid, wires, and card visuals onto a single WebGL canvas, so a pan or zoom is a camera-matrix update plus GPU compositing instead of re-rasterizing a large DOM layer.

It is an **opt-in optional peer dependency**. Install PixiJS v8 to use it:

```sh
pnpm add pixi.js
```

Without `pixi.js` installed (or without WebGL, or during SSR), `'auto'` and `'pixi'` resolve to the DOM renderer; an explicit `renderer="pixi"` logs a one-time console warning and falls back. So the default `'auto'` is always safe.

How it behaves:

- **At rest and at readable zoom**, the real DOM cards (your `#card` slot) are shown and fully interactive: drag, multi-select, marquee, wire hover/menu all work exactly as in the DOM renderer. PixiJS draws the grid and wires behind them.
- **While panning/zooming, and at far zoom**, the DOM card layer is hidden and PixiJS paints the whole scene (grid, wires, and cards). This is where the gesture stays smooth on big graphs.

Because interaction always happens on the DOM cards, every existing event and the `useBlueprint()` controller behave identically. One consequence of the level-of-detail design: below the far-zoom threshold individual cards are painted by PixiJS and are not separately clickable (zoom in to interact); marquee selection and panning still work at any zoom.

#### Native card painting (`paint`)

PixiJS cannot run your Vue `#card` component on the GPU, so for the during-gesture and far-zoom view it paints cards itself from a structured descriptor. In the windowed (`cards`) API, give each card an optional `paint` field (or set the well-known fields `title`, `color`, `ports` directly on the card object) so the painter can draw a faithful card:

```ts
import type { IBlueprintCard, IBlueprintCardPaint } from '@nubisco/ui'

const cards: IBlueprintCard[] = [
  {
    id: 'osc',
    x: 40,
    y: 60,
    width: 220,
    height: 160,
    paint: {
      title: 'Oscillator',
      color: '#a855f7',
      ports: [
        { id: 'out', label: 'out', type: 'output' },
        { id: 'sync', label: 'sync', type: 'input' },
      ],
    } satisfies IBlueprintCardPaint,
  },
]
```

If `paint` (and the loose fallbacks) are omitted, far/gesture cards render as a plain accent-colored box with no text. The DOM card (your `#card` slot) is always the source of truth at readable zoom, so `paint` only affects the zoomed-out and in-motion view.

## Theming

The canvas background uses `--nb-c-layer-0`. Ambient gradients are configurable via `--nb-blueprint-ambient-1` and `--nb-blueprint-ambient-2` (set to `transparent` to disable). Wire colors are derived from each source card's `--nb-card-color`.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                 | Type                                               | Default   | Description                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connections`        | `IBlueprintConnection[]`                           | `[]`      | Wires to draw between card ports. The parent owns this array.                                                                                                                                                                                                                       |
| `cards`              | `IBlueprintCard[]`                                 | (none)    | Card geometry for windowed rendering. When set, render cards via the `#card` slot; only on-screen cards mount. See [Windowed rendering](#windowed-rendering-large-graphs).                                                                                                          |
| `cardSizeEstimate`   | `{ width: number; height: number }`                | ~one card | Fallback card box for the windowing cull when a card omits `width`/`height`. Only affects how tightly off-screen cards are culled.                                                                                                                                                  |
| `animateConnections` | `'never' \| 'always' \| 'on-activity' \| 'levels'` | `'never'` | Wire animation policy. See [Wire animation modes](#wire-animation-modes).                                                                                                                                                                                                           |
| `wheelMode`          | `'auto' \| 'zoom' \| 'pan'`                        | `'auto'`  | What plain wheel events do. Pinch always zooms regardless. See [Panning and zooming](#panning-and-zooming).                                                                                                                                                                         |
| `editable`           | `boolean`                                          | `false`   | Advisory edit-mode flag, surfaced through [`useBlueprint()`](#the-useblueprint-composable) as `isEditMode` so optional chrome (a controls toolbar, etc.) can show itself only while editing. Does not change pan/zoom/selection, which are always interactive.                      |
| `renderer`           | `'auto' \| 'dom' \| 'pixi'`                        | `'auto'`  | Rendering backend. `'auto'` uses the PixiJS (WebGL) renderer when available, else the DOM/SVG renderer; `'dom'` forces DOM/SVG; `'pixi'` forces WebGL (falls back to DOM with a warning when unavailable). The public API is identical across renderers. See [Renderer](#renderer). |

## Events

| Event              | Payload                                                          | Description                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect`          | `IBlueprintConnection`                                           | Emitted when a drag from one port is released on another compatible port.                                                                                   |
| `disconnect`       | `IBlueprintConnection`                                           | Emitted when the user clicks **Disconnect** in the wire context menu (right-click on a wire).                                                               |
| `move`             | `IBlueprintCardMove[]`                                           | Emitted after cards are dragged, aligned, distributed, or auto-laid out.                                                                                    |
| `focus`            | `string \| null`                                                 | Emitted when a card is focused (clicked). `null` when focus is cleared.                                                                                     |
| `selection-change` | `string[]`                                                       | Emitted when the set of selected card IDs changes.                                                                                                          |
| `drop-on-wire`     | `(cardId: string, conn: IBlueprintConnection)`                   | Emitted when a single-card drag ends with the cursor over a wire. See [Drop-on-wire](#drop-on-wire).                                                        |
| `wire-hover`       | `(cardId: string, conn: IBlueprintConnection \| null)`           | Emitted during a single-card drag when the wire under the cursor changes. `null` payload when the cursor leaves the last wire.                              |
| `wire-mouseover`   | `(conn: IBlueprintConnection, clientX: number, clientY: number)` | Emitted on every mousemove over a wire. Use to position a tooltip showing wire metadata. The host owns the tooltip rendering; the event is fire-and-forget. |
| `wire-mouseout`    | `(conn: IBlueprintConnection)`                                   | Emitted when the cursor leaves a wire (or moves to a different one).                                                                                        |

## Slots

| Slot        | Scope props                         | Description                                                                                                                                                                                                              |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default`   | (none)                              | Card layer (non-windowed). Place `NbBlueprintCard` instances here, positioned with `transform: translate(x, y)` on a wrapper. Ignored when `cards` is set.                                                               |
| `card`      | `{ card: IBlueprintCard }`          | Per-card template for windowed rendering (used when the `cards` prop is set). Blueprint owns the position wrapper; render one `NbBlueprintCard` from `card`. See [Windowed rendering](#windowed-rendering-large-graphs). |
| `wire-menu` | `{ connection, close, disconnect }` | Replaces the default wire context menu (right-click on a wire). Default content is a single Disconnect button.                                                                                                           |

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

## The `useBlueprint()` composable

`useBlueprint()` injects the controller of the nearest ancestor `NbBlueprint`, so chrome rendered inside the canvas (a controls toolbar, a minimap, a custom background) can drive it without the host wiring template refs and event handlers by hand. Call it from a component rendered in the Blueprint's default slot; it throws if used outside a Blueprint subtree.

```vue
<template>
  <NbBlueprint :cards="cards" :connections="connections" editable>
    <template #card="{ card }">
      <NbBlueprintCard v-bind="card" />
    </template>
    <ZoomToolbar />
  </NbBlueprint>
</template>
```

```ts
// ZoomToolbar.vue
import { useBlueprint } from '@nubisco/ui'

const bp = useBlueprint()

function zoomIn() {
  bp.zoom.value = Math.min(3, bp.zoom.value * 1.2)
}
// bp.fitToView(), bp.centerView(), bp.resetView()
// bp.isEditMode.value, bp.selectedIds.value, bp.screenToCanvas(x, y)
```

The returned `IBlueprintController` is a superset of the exposed instance above, plus coordinate transforms and an edit-mode flag:

| Member                                                                                                                                       | Signature                                        | Description                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `panX`, `panY`, `zoom`                                                                                                                       | `Ref<number>`                                    | Live, writable camera state.                                 |
| `selectedIds`, `focusedId`                                                                                                                   | `Ref<Set<string>>`, `Ref<string \| null>`        | Live selection and focus.                                    |
| `selectAll`, `deselectAll`                                                                                                                   | `() => void`                                     | Selection commands.                                          |
| `centerView`, `fitToView`, `resetView`                                                                                                       | `() => void` / `(padding?: number) => void`      | View commands.                                               |
| `alignLeft`/`alignCenter`/`alignRight`/`alignTop`/`alignMiddle`/`alignBottom`, `distributeHorizontally`/`distributeVertically`, `autoLayout` | `() => void`                                     | Alignment, distribution, and auto-layout.                    |
| `screenToCanvas`                                                                                                                             | `(clientX: number, clientY: number) => { x; y }` | Convert viewport (client) coordinates to canvas coordinates. |
| `canvasToScreen`                                                                                                                             | `(x: number, y: number) => { clientX; clientY }` | Convert canvas coordinates to viewport (client) coordinates. |
| `isEditMode`                                                                                                                                 | `Ref<boolean>`                                   | Live edit-mode flag, mirrors the `editable` prop.            |

## Types

```ts
interface IBlueprintConnection {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
  /** Whether signal can currently flow. Gates animation under
   *  'on-activity' / 'levels'. Undefined = treated as active. */
  active?: boolean
  /** Linear amplitude (0..1) for 'levels' mode. Audio wires
   *  colour-shift green → yellow → red as level rises. Ignored
   *  for non-levels modes and for MIDI wires. */
  level?: number
}

interface IBlueprintCardMove {
  id: string
  x: number
  y: number
}

interface IBlueprintCard {
  /** Stable identity; matches the NbBlueprintCard id and connection nodes. */
  id: string
  /** Canvas-space position (same units as connections and `move`). */
  x: number
  y: number
  /** Optional box size; tightens the off-screen cull when provided. */
  width?: number
  height?: number
  // Extra host fields (title, ports, ...) are preserved and handed back
  // through the #card slot.
}
```

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
import type { IBlueprintCardMove } from '@/main'

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
