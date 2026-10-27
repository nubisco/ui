---
layout: nubisco
title: Blueprint
intro: '`NbBlueprint` is a visual node editor canvas with built-in card dragging, multi-selection, alignment, distribution, auto-layout, and animated bezier wires. It has no domain logic: the parent owns card data, positions, and connections.'
source: src/components/Blueprint.vue
tab: code
pageTabs: ['usage', 'code']
---

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

## Auto-layout

`autoLayout()` arranges all cards in a layered left-to-right layout based on their connections (topological ordering). Cards within each layer are sorted by category for visual grouping.

```vue
<NbButton @click="blueprint?.autoLayout()">Auto layout</NbButton>
<NbButton
  @click="blueprint?.autoLayout({ gapX: 120, gapY: 60 })"
>Wider</NbButton>
```

Options: `{ gapX?: number, gapY?: number, padding?: number }` (defaults: 80, 40, 60).

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

## Background

The canvas pattern is set with the `background` prop: `'dots'` (default), `'lines'`, `'grid'` (a ruled grid with heavier major lines every few cells), or `'none'`. Color and spacing are themable with CSS variables, so changing the look is a one-liner:

<preview>
  <div style="height: 300px; border: 1px solid var(--nb-c-border, #e8e8f0); border-radius: 8px; overflow: hidden; display: flex;">
    <NbBlueprint :connections="demoConnections" :background="bgBackground">
      <template v-if="bgCustom" #background>
        <NbBlueprintBackground
          variant="grid"
          color="rgba(56, 189, 248, 0.35)"
          :gap="28"
          secondary-color="rgba(56, 189, 248, 0.6)"
          :secondary-gap="140"
        />
      </template>
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
          collapsed
        />
      </div>
    </NbBlueprint>
  </div>
  <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
    <span style="font-size: 0.85em; color: var(--nb-c-text-muted, #8a8a9a);">background prop:</span>
    <NbButton
      v-for="v in bgVariants"
      :key="v"
      size="sm"
      :variant="!bgCustom && bgBackground === v ? 'primary' : 'ghost'"
      @click="bgCustom = false; bgBackground = v"
    >{{ v }}</NbButton>
    <NbButton
      size="sm"
      :variant="bgCustom ? 'primary' : 'ghost'"
      @click="bgCustom = true"
    >#background slot</NbButton>
  </div>
</preview>

Scroll to pan and pinch (or Ctrl + scroll) to zoom — the background tracks the camera with the scene. The last button swaps the built-in pattern for a custom `NbBlueprintBackground` in the `#background` slot, which suppresses the prop automatically.

```vue
<NbBlueprint :cards="cards" background="grid" />
```

```css
.nb-blueprint {
  --nb-blueprint-grid-color: rgba(255, 255, 255, 0.06);
  --nb-blueprint-grid-gap: 32px;
}
```

The prop applies to both renderers (the DOM renderer draws a CSS pattern; the PixiJS renderer draws a tiled texture), and is the most efficient option.

For full control — per-instance colours, gap, thickness, a custom secondary grid, or an entirely custom backdrop — drop [`NbBlueprintBackground`](/components/blueprint/background/usage) (or any element) into the `#background` slot instead. See [Background](/components/blueprint/background/usage).

## Props

| Prop                 | Type                                               | Default     | Description                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connections`        | `IBlueprintConnection[]`                           | `[]`        | Wires to draw between card ports. The parent owns this array.                                                                                                                                                                                                                       |
| `density`            | `TBlueprintDensity`                                | `'default'` | Chrome density inherited by every card on the canvas: `'default'` or `'compact'`. Cards can override their own. It never changes port geometry, so switching density does not move a wire.                                                                                          |
| `cards`              | `IBlueprintCard[]`                                 | (none)      | Card geometry for windowed rendering. When set, render cards via the `#card` slot; only on-screen cards mount. See [Windowed rendering](#windowed-rendering-large-graphs).                                                                                                          |
| `cardSizeEstimate`   | `{ width: number; height: number }`                | ~one card   | Fallback card box for the windowing cull when a card omits `width`/`height`. Only affects how tightly off-screen cards are culled.                                                                                                                                                  |
| `animateConnections` | `'never' \| 'always' \| 'on-activity' \| 'levels'` | `'never'`   | Wire animation policy. See [Wire animation modes](#wire-animation-modes).                                                                                                                                                                                                           |
| `wheelMode`          | `'auto' \| 'zoom' \| 'pan'`                        | `'auto'`    | What plain wheel events do. Pinch always zooms regardless. See [Panning and zooming](#panning-and-zooming).                                                                                                                                                                         |
| `editable`           | `boolean`                                          | `false`     | Advisory edit-mode flag, surfaced through [`useBlueprint()`](#the-useblueprint-composable) as `isEditMode` so optional chrome (a controls toolbar, etc.) can show itself only while editing. Does not change pan/zoom/selection, which are always interactive.                      |
| `renderer`           | `'auto' \| 'dom' \| 'pixi'`                        | `'auto'`    | Rendering backend. `'auto'` uses the PixiJS (WebGL) renderer when available, else the DOM/SVG renderer; `'dom'` forces DOM/SVG; `'pixi'` forces WebGL (falls back to DOM with a warning when unavailable). The public API is identical across renderers. See [Renderer](#renderer). |
| `background`         | `'grid' \| 'dots' \| 'lines' \| 'none'`            | `'dots'`    | Canvas background pattern. Themable via `--nb-blueprint-grid-color` and `--nb-blueprint-grid-gap`. Ignored when the `#background` slot is used. See [Background](#background).                                                                                                      |

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

| Slot         | Scope props                         | Description                                                                                                                                                                                                                                         |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`    | (none)                              | Card layer (non-windowed). Place `NbBlueprintCard` instances here, positioned with `transform: translate(x, y)` on a wrapper. Ignored when `cards` is set.                                                                                          |
| `card`       | `{ card: IBlueprintCard }`          | Per-card template for windowed rendering (used when the `cards` prop is set). Blueprint owns the position wrapper; render one `NbBlueprintCard` from `card`. See [Windowed rendering](#windowed-rendering-large-graphs).                            |
| `wire-menu`  | `{ connection, close, disconnect }` | Replaces the default wire context menu (right-click on a wire). Default content is a single Disconnect button.                                                                                                                                      |
| `chrome`     | (none)                              | Viewport-space overlay layer, rendered in both the windowed and legacy APIs. Place `NbBlueprintControls`, `NbBlueprintMinimap`, or any host overlay here; children are positioned in screen space and opt into pointer events.                      |
| `background` | (none)                              | Backdrop layer, drawn behind the scene. Place [`NbBlueprintBackground`](/components/blueprint/background/usage) or any element here; when set it replaces the built-in `background` prop. See [Background](/components/blueprint/background/usage). |

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

bp.zoomIn() // center-anchored; also bp.zoomOut()
// bp.fitToView(), bp.centerView(), bp.resetView()
// bp.isEditMode.value, bp.selectedIds.value, bp.screenToCanvas(x, y)
```

Most of this is already wrapped by [`NbBlueprintControls`](/components/blueprint/controls/usage) and [`NbBlueprintMinimap`](/components/blueprint/minimap/usage); reach for `useBlueprint()` directly when building custom chrome.

The returned `IBlueprintController` is a superset of the exposed instance above, plus coordinate transforms and an edit-mode flag:

| Member                                                                                                                                       | Signature                                        | Description                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `panX`, `panY`, `zoom`                                                                                                                       | `Ref<number>`                                    | Live, writable camera state.                                 |
| `selectedIds`, `focusedId`                                                                                                                   | `Ref<Set<string>>`, `Ref<string \| null>`        | Live selection and focus.                                    |
| `selectAll`, `deselectAll`                                                                                                                   | `() => void`                                     | Selection commands.                                          |
| `centerView`, `fitToView`, `resetView`                                                                                                       | `() => void` / `(padding?: number) => void`      | View commands.                                               |
| `zoomIn`, `zoomOut`                                                                                                                          | `() => void`                                     | Step zoom, anchored at the viewport center.                  |
| `viewportSize`                                                                                                                               | `Ref<{ w: number; h: number }>`                  | Live container size in screen px (used by the minimap).      |
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

<!--@include: ./_shared.md-->
