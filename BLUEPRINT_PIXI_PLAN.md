# Blueprint: PixiJS Renderer + Feature Expansion Plan

Status: proposal. Owner: NubiscoUI. Consumers: stagewright, planetcraft.

## 1. Goals

1. **10x+ perceived pan/zoom performance** on large graphs (thousands of cards in the
   graph, hundreds in view) by moving the heavy rendering to PixiJS (WebGL).
2. **Zero breaking changes to the public API.** stagewright and planetcraft keep their
   current props, events, and imperative calls. The renderer swaps underneath.
3. **Close the feature gap** that vue-flow exposes, by encapsulating things we already
   have (pan/zoom, selection, drag, alignment) into reusable sub-components, and adding
   the missing ones (minimap, easily-overridable background, a controls toolbar, nested
   nodes, richer node/edge customization).

## 2. Why this is the path (one-paragraph recap)

The blueprint today is DOM + SVG, not canvas: cards are absolutely-positioned `<div>`s
rendering live Vue components through the `#card` slot (`Blueprint.vue:108-122`), wires
are SVG bezier `<path>`s (`Blueprint.vue:34-96`), and pan/zoom is one CSS transform on
`.nb-blueprint__canvas` (`Blueprint.vue:24-32`). The code already does every smart
DOM-bound trick: viewport culling of cards and wires, port/position/color caches, a
position-only `MutationObserver`, and `will-change` promotion only during gestures. We
are at the ceiling of that architecture. vue-flow (and its upstream React Flow) use the
exact same DOM + SVG model and hit the same wall (its maintainers frame the limit as
"until your browser crashes"), so adopting vue-flow buys nothing on performance. The real
cost is that every in-view card is a live component tree doing layout/paint each frame,
and zoom re-rasterizes the whole composited DOM layer. The order-of-magnitude win is to
make pan/zoom touch only a camera matrix plus GPU compositing, and to keep live DOM only
for the handful of cards under interaction.

## 3. Current public contract (must be preserved)

Captured from `Blueprint.vue` and `Blueprint.types.ts` so the renderer swap stays invisible.

- **Props:** `connections`, `cards`, `cardSizeEstimate`, `animateConnections`
  (`never | always | on-activity | levels`), `wheelMode` (`auto | zoom | pan`).
- **Emits:** `connect`, `disconnect`, `move`, `selection-change`, `focus`,
  `drop-on-wire`, `wire-hover`, `wire-mouseover`, `wire-mouseout`.
- **Exposed (`defineExpose`, `Blueprint.vue:1899`):** `centerView`, `fitToView`,
  `resetView`, `selectedIds`, `focusedId`, `selectAll`, `deselectAll`, `alignLeft/Center/
Right/Top/Middle/Bottom`, `distributeHorizontally/Vertically`, `autoLayout`,
  `onPortMouseDown`, `onPortMouseUp`, `panX`, `panY`, `zoom`.
- **Card model (`BlueprintCard.types.ts`):** mostly structured props (title, category,
  status, ports with dataType/shape/size/channels, connectedPorts, activePorts,
  parameters, preview, collapsed) plus an arbitrary custom slot. The structured majority
  is what makes a native WebGL painter feasible (see 4.3).

Implication: a large chunk of what vue-flow advertises (pan/zoom, single + multi
selection, marquee, draggable cards, alignment/distribute/auto-layout, a rich event set)
**already exists**. The gap is packaging it as components and a composable, plus minimap,
background, controls, and nesting.

## 4. Rendering architecture (the core of Phase 1)

WebGL cannot run Vue components, and cards can hold arbitrary live content (faders,
meters, knobs). We resolve this with level-of-detail (LOD) plus DOM promotion. Each card
has three possible representations, chosen by a per-card state machine:

1. **Quad** (far zoom, or fast pan/zoom in flight): a batched rounded rectangle with the
   accent color, title from a glyph atlas, and port dots. Thousands of these are a handful
   of draw calls.
2. **Sprite** (mid zoom, idle): a texture of the card, drawn as a textured quad. Pan/zoom
   only moves the quad. The texture is regenerated only when the card's visual state
   changes, not per frame.
3. **Live DOM** (focused, hovered, near zoom, or editing): the real `NbBlueprintCard` Vue
   component, in a DOM overlay layer above the Pixi canvas, pixel-aligned to the camera.
   Faders/knobs are fully interactive. Only the 0 to ~3 cards under interaction are ever
   live DOM.

Wires: one batched mesh of tessellated beziers (or a single Pixi Graphics geometry rebuilt
only on change). Flow animation becomes a shader dash-offset, effectively free, replacing
the per-wire SVG flow overlay. Hit-testing becomes a CPU bezier-distance test using the
control points we already compute, replacing `isPointInStroke` + CTM inversion.

Camera: the existing `panX`/`panY`/`zoom` refs feed both the Pixi stage `position`/`scale`
and the DOM overlay container transform, so live-DOM cards and the Pixi scene stay locked
together. No new camera concept; we reuse what `zoomAt`/`resetView` already drive.

Why this is 10x: pan/zoom stops doing layout/paint of live component trees and stops
re-rasterizing a giant DOM layer. It updates a matrix and composites GPU textures. The
expensive DOM work is paid once per state change (the snapshot), not once per frame per
visible card.

### 4.3 Card-to-texture: the hard part, two options

- **Option A (recommended): native Pixi painter for the standard card anatomy.** Draw the
  card chrome (rounded rect, header, status dot, ports, parameter bars, preview, collapsed
  state) directly with Pixi Graphics/Text from the structured props in
  `BlueprintCard.types.ts`. Fast, crisp at any zoom, deterministic, no cross-origin taint.
  Cost: the painter must track the visual design of `NbBlueprintCard`; arbitrary `#card`
  slot content cannot be auto-drawn (it is shown only when the card promotes to live DOM,
  which is exactly when the user is close enough to need it).
- **Option B (fallback): rasterize the live DOM card to a texture** (foreignObject/SVG
  serialization or an html-to-canvas pass). Pixel-faithful to any slot content, but slow
  to capture, fragile on fonts/CSS, taints on cross-origin assets, and recaptures on every
  visual change. Reserve for cards whose custom slot is opaque and must be visible while
  zoomed out.

Recommendation: ship Option A for the standard anatomy (we own it and it is mostly
structured data), with live-DOM promotion covering both editing and any custom slot, and
Option B available as an opt-in per-card escape hatch.

## 5. Renderer abstraction boundary

Introduce an internal renderer interface. `Blueprint.vue` keeps owning gestures, selection,
drag, marquee, alignment, the imperative API, and all events. Only the draw layer is
swappable.

```
interface IBlueprintRenderer {
  mount(canvasEl, overlayEl): void
  setCamera(panX, panY, zoom): void
  setCards(cards, lodDecisions): void
  setWires(wires): void
  setSelection(selectedIds, focusedId): void
  hitTestWire(clientX, clientY): IBlueprintConnection | null
  hitTestCard(clientX, clientY): string | null
  invalidateCard(id): void   // card visual state changed, re-snapshot
  destroy(): void
}
```

Two implementations:

- **DomRenderer:** today's DOM + SVG path, lifted out of `Blueprint.vue` largely verbatim.
- **PixiRenderer:** Phase 1.

New prop: `renderer?: 'auto' | 'pixi' | 'dom'` (default `'auto'`: pixi when client-side
WebGL is available, else dom). SSR and no-WebGL fall back automatically, which keeps the
component library SSR-safe.

## 6. Feature expansion (encapsulate what we have, add what we lack)

vue-flow feature vs current state:

| Feature                           | Current                                        | Action                                            |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| Pan/zoom                          | Have (`panX/panY/zoom`, `wheelMode`, `zoomAt`) | Expose via composable                             |
| Single + multi selection, marquee | Have (`selectedIds`, `focusedId`)              | Keep                                              |
| Draggable cards                   | Have                                           | Keep                                              |
| Event handlers                    | Have (9 emits)                                 | Keep, add edge-selection events                   |
| Align / distribute / auto-layout  | Have (exposed), no UI                          | Wrap in Controls                                  |
| Background                        | Default grid only                              | Extract `NbBlueprintBackground`, make overridable |
| Minimap                           | Missing                                        | Add `NbBlueprintMinimap`                          |
| Controls toolbar                  | Missing UI (logic exists)                      | Add `NbBlueprintControls`                         |
| Customizable nodes/edges          | Partial (slot + props)                         | Formalize node/edge types, edge labels            |
| Nested nodes / subgraphs          | Missing                                        | Design (groups first, subgraphs later)            |

New pieces, all optional and all driven by an injected Blueprint controller context:

1. **`NbBlueprintBackground`** : variants `grid | dots | lines | none`, plus props
   (`color`, `gap`, `thickness`, secondary grid) and a `#background` slot so an app can
   swap it freely. In the Pixi renderer the background is a tiling sprite or fragment
   shader (free); in the DOM renderer it stays the current CSS layer. Solves "apps should
   be able to change the background easily."
2. **`NbBlueprintMinimap`** : corner overview drawing card bounding boxes plus the viewport
   rectangle from the same `cards`/`connections` data. Click/drag to pan (writes
   `panX`/`panY`). Cheap: only bounding boxes; LOD to dots when dense. Props: `position`,
   `size`, `nodeColor` fn, `pannable`, `maskColor`.
3. **`NbBlueprintControls`** : NubiscoUI-styled toolbar wired entirely to the existing
   imperative API: zoom in/out, fit to view, center, reset (1:1), zoom to selection,
   interactivity lock, and an alignment cluster (align 6-way, distribute H/V, auto-layout)
   that enables on multi-selection. Two display modes: always-on (developer toggles) or
   auto-show in edit mode. Add a Blueprint `mode?: 'view' | 'edit'` (or `editable`) prop
   and surface `isEditMode` through the context so Controls can show itself in edit mode,
   matching stagewright's edit-mode pattern.
4. **`useBlueprint()` composable + expanded context.** The injected context today only
   carries `onPortDown`/`onPortUp` (`Blueprint.context.ts`). Expand it into a controller:
   camera refs, selection, `fitToView`/`centerView`/`resetView`, align/distribute,
   `screenToCanvas`/`canvasToScreen`, edit mode. Background, Minimap, and Controls consume
   it without prop-drilling; a public `useBlueprint()` mirrors `defineExpose` so host apps
   drive it from outside too.
5. **Node/edge customization formalization.** Keep the simple `#card` slot, and add an
   optional `nodeTypes` registry (type to component) and per-type slots for heterogeneous
   graphs. For edges: expose `color`/`dash`/`width`/`label` on the connection, add edge
   labels (vue-flow has them) and selectable wires (we already hit-test; add wire selection
   state + `wire-select` emit).
6. **Nested nodes / subgraphs**, split into two:
   - **Groups (Phase 3):** optional `parentId` + `extent` on `IBlueprintCard`; children use
     parent-relative coordinates; dragging a parent moves children; render group frames
     behind children with correct hit-test order.
   - **Subgraphs (Phase 4):** a card that contains a nested blueprint; collapsed shows
     summary ports, expanded opens an inner scoped Blueprint. Pixi LOD pays off here: a
     collapsed subgraph is just one quad.

## 7. Phasing

- **Phase 0 (foundation, no behavior change):** extract `IBlueprintRenderer`; move the
  current DOM/SVG render into `DomRenderer`; expand the injected context into the full
  controller; ship `useBlueprint()`. Still DOM, no flag. De-risks everything and is
  independently useful.
- **Phase 1 (Pixi renderer, the perceived 10x):** `PixiRenderer` with camera, wire mesh,
  native card painter (Option A), the LOD state machine, and DOM-overlay promotion. Pixi is
  lazy-loaded. `renderer='auto'`. Benchmark against DOM with a stagewright-scale fixture.
- **Phase 2 (encapsulated features):** `NbBlueprintBackground`, `NbBlueprintControls`,
  `NbBlueprintMinimap`, the edit-mode prop. Mostly additive, low risk, rides Phase 0
  context and Phase 1 Pixi background.
- **Phase 3 (model):** node/edge type formalization, edge labels, selectable edges, group
  nodes.
- **Phase 4 (subgraphs):** collapse/expand nested blueprints. Demand-driven.

## 8. Benchmarks and success criteria

- A fixture (test + a docs example) that generates N cards and M wires.
- Primary metric: median frame time during a scripted pan + zoom sweep with K cards in
  view. Target: a 10x reduction in frame time at the graph size where the DOM path drops
  to single-digit fps, landing at a smooth 60fps+ (frame time <= ~8ms).
- No regression in connect/disconnect, drag, marquee, alignment, wire hit-testing,
  drop-on-wire.
- Visual parity between the Pixi card painter and the DOM card, checked with screenshot
  diffs.

## 9. Risks and mitigations

- **Painter drift vs DOM card design:** single source of truth for card visual tokens;
  snapshot tests; live-DOM promotion masks any gap up close.
- **Arbitrary slot content invisible at mid zoom:** documented LOD behavior; promote on
  hover/zoom; placeholder; Option B as per-card escape hatch.
- **Bundle size / SSR:** Pixi as an optional peer dependency, dynamic import, client guard,
  automatic DOM fallback.
- **Text crispness across zoom:** Pixi BitmapText/SDF or re-resolution in zoom buckets.
- **WebGL context loss:** handle `webglcontextlost`, rebuild the scene.
- **Accessibility:** a canvas is opaque to assistive tech. Keep an accessible DOM layer for
  focused/selected cards with ARIA; the promotion overlay already provides part of this.
  This matters for a component library and is a reason not to go full-WebGL-everything.

## 10. Dependencies and open decisions

- **pixi.js v8**, optional peer dependency, dynamically imported only when the renderer
  resolves to pixi. Build is already Vite + Vue 3.5, which Pixi v8 supports.
- **Decision 1:** Pixi as optional peer (consumer installs, lighter default) vs bundled
  dependency (zero-config, heavier). Recommendation: peer + lazy.
- **Decision 2:** card painter Option A (native, recommended) vs Option B (html
  rasterization for pixel parity first, optimize later). Recommendation: A for the standard
  anatomy, B as an opt-in escape hatch.
