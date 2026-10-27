---
layout: nubisco
title: Blueprint
intro: '`NbBlueprint` is a visual node editor canvas with built-in card dragging, multi-selection, alignment, distribution, auto-layout, and animated bezier wires. It has no domain logic: the parent owns card data, positions, and connections.'
source: src/components/Blueprint.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Live demo

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

Cards are keyboard-operable too. <kbd>Tab</kbd> reaches a card and its
controls, arrow keys move it (with <kbd>Shift</kbd> for a coarse step), and
<kbd>Enter</kbd> on a port starts a connection that a second <kbd>Enter</kbd>
on another port completes. See
[Keyboard and assistive technology](/components/blueprint/card/accessibility#keyboard-and-assistive-technology).

## Drag-to-connect

Cards rendered inside an `NbBlueprint` automatically wire their port
mousedown/mouseup events to the blueprint via Vue `provide`/`inject`. No
parent boilerplate needed: drop `NbBlueprintCard` in the default slot, and
dragging from a port to another compatible port emits `connect` on the
blueprint.

The card still emits `port-mousedown` and `port-mouseup` so consumers using
`NbBlueprintCard` outside an `NbBlueprint` (in a docs page, isolated demo,
etc.) can wire the events manually if needed.

### Drop targets

While a wire is in flight the blueprint publishes the port it started from,
and every card lights the pins that could accept it and dims the ones that
could not. This needs no wiring up and no host state: the answer arrives while
the user is still aiming rather than on release.

A pin can accept a wire when it is on a different card, faces the other way,
and carries a compatible `dataType`. Compatibility rules and the family
matching are documented under
[Drop targets](/components/blueprint/card/code#drop-targets) on the card page.

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

## Theming

The canvas background uses `--nb-c-layer-0`. Ambient gradients are configurable via `--nb-blueprint-ambient-1` and `--nb-blueprint-ambient-2` (set to `transparent` to disable). Wire colors are derived from each source card's `--nb-card-color`.

<!--@include: ./_shared.md-->
