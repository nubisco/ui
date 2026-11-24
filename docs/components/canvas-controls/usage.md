---
layout: nubisco
title: Canvas Controls
intro: '`NbCanvasControls` floats a set of controls over a canvas, a map or a diagram: zoom, fit, a view switch, a layer toggle. It places itself in a corner or at an edge of the canvas, and each `NbCanvasControlsGroup` inside it is one raised island with a border, a corner and a lift. It takes any content, and sizes the buttons in it for you.'
source: src/components/CanvasControls.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <div class="cc-canvas">
    <NbCanvasControls label="Canvas controls" position="bottom-right">
      <NbCanvasControlsGroup label="Zoom">
        <NbButton variant="ghost" icon="magnifying-glass-plus" label="Zoom in" @click="zoom += 10" />
        <NbButton variant="ghost" icon="magnifying-glass-minus" label="Zoom out" @click="zoom -= 10" />
        <NbButton variant="ghost" icon="frame-corners" label="Fit to view" @click="zoom = 100" />
      </NbCanvasControlsGroup>
    </NbCanvasControls>
    <NbCanvasControls label="View" position="top-left" orientation="horizontal">
      <NbCanvasControlsGroup>
        <NbSelect v-model="layer" variant="fluid" size="sm" label="View" :options="layers" style="width: 160px" />
        <NbSwitch v-model="edges" name="edges" label="Edges" />
      </NbCanvasControlsGroup>
    </NbCanvasControls>
  </div>
</preview>

## When to use it

- Controls that act on the whole canvas and stay put while it pans and zooms underneath: zoom, fit, center, a layer or view switch.
- A canvas the product draws itself. `NbBlueprintControls` is this component with the blueprint's own commands already wired.

Not for controls that follow a selection (use `NbFloatingToolbar`) or for a strip above a table or panel (use `NbToolbar`).

## Anatomy

- **`NbCanvasControls`** is the set. It floats at `position` (`top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`), one inset from the canvas edge, and stacks its groups along `orientation`.
- **`NbCanvasControlsGroup`** is one island. Put related controls in one group (zoom and fit), and unrelated ones in another (alignment). A group shown only sometimes, such as alignment while two items are selected, is a separate group with a `v-if`.

## Guidelines

- Icon buttons are ghost `NbButton`s with a `label`, which is their name and their tooltip. Zoom is `magnifying-glass-plus` and `magnifying-glass-minus`, fit is `frame-corners`.
- Leave `size` on the buttons alone: the set gives every button inside the same height (`sm` by default). A select or a field in a group takes `size="sm"` to match, and `variant="fluid"` puts its label inside it.
- One set per corner. Two sets in the same corner overlap.

<!--@include: ./_shared.md-->
