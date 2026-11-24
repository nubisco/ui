---
layout: nubisco
title: Canvas Controls
intro: '`NbCanvasControls` floats a set of controls over a canvas, a map or a diagram: zoom, fit, a view switch, a layer toggle. It places itself in a corner or at an edge of the canvas, and each `NbCanvasControlsGroup` inside it is one raised island with a border, a corner and a lift. It takes any content, and sizes the buttons in it for you.'
source: src/components/CanvasControls.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Usage

The canvas is the positioned ancestor: give it `position: relative` and put the controls inside it.

```vue
<template>
  <div class="canvas" style="position: relative">
    <MyCanvas />
    <NbCanvasControls label="Map controls" position="bottom-right">
      <NbCanvasControlsGroup label="Zoom">
        <NbButton
          variant="ghost"
          icon="magnifying-glass-plus"
          label="Zoom in"
          @click="zoomIn"
        />
        <NbButton
          variant="ghost"
          icon="magnifying-glass-minus"
          label="Zoom out"
          @click="zoomOut"
        />
        <NbButton
          variant="ghost"
          icon="frame-corners"
          label="Fit to view"
          @click="fit"
        />
      </NbCanvasControlsGroup>
    </NbCanvasControls>
  </div>
</template>
```

## Orientation and several groups

`orientation` stacks the groups and the controls in each group. Groups sit 8px apart.

<preview>
  <div class="cc-canvas">
    <NbCanvasControls label="Canvas controls" position="top-center" orientation="horizontal">
      <NbCanvasControlsGroup label="Zoom">
        <NbButton variant="ghost" icon="magnifying-glass-plus" label="Zoom in" />
        <NbButton variant="ghost" icon="magnifying-glass-minus" label="Zoom out" />
        <NbButton variant="ghost" icon="frame-corners" label="Fit to view" />
      </NbCanvasControlsGroup>
      <NbCanvasControlsGroup label="Align">
        <NbButton variant="ghost" icon="align-left" label="Align left" />
        <NbButton variant="ghost" icon="align-right" label="Align right" />
      </NbCanvasControlsGroup>
    </NbCanvasControls>
    <NbCanvasControls label="Size" position="bottom-left" size="md">
      <NbCanvasControlsGroup>
        <NbButton variant="ghost" icon="magnifying-glass-plus" label="Zoom in" />
        <NbButton variant="ghost" icon="magnifying-glass-minus" label="Zoom out" />
      </NbCanvasControlsGroup>
    </NbCanvasControls>
  </div>
</preview>

## Props

### NbCanvasControls

| Prop          | Type                                                                                              | Default          | Description                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------- |
| `label`       | `string`                                                                                          | (required)       | The toolbar's accessible name.                                        |
| `position`    | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'bottom-right'` | Where the set floats inside the canvas.                               |
| `orientation` | `'horizontal' \| 'vertical'`                                                                      | `'vertical'`     | Stack direction of the groups and of the controls in each.            |
| `size`        | `'sm' \| 'md' \| 'lg' \| 'xl'`                                                                    | `'sm'`           | Height of every button inside without a size of its own (32 to 64px). |

### NbCanvasControlsGroup

| Prop    | Type     | Default | Description                                                        |
| ------- | -------- | ------- | ------------------------------------------------------------------ |
| `label` | `string` | (none)  | Names the group (`role="group"`) when the set holds more than one. |

Both take their content in the default slot.

## Tokens

| Token                         | Default                   | Role                               |
| ----------------------------- | ------------------------- | ---------------------------------- |
| `--nb-canvas-controls-inset`  | `12px`                    | Distance from the canvas edge.     |
| `--nb-canvas-controls-radius` | `var(--nb-radius-lg)`     | Corner of each group.              |
| `--nb-canvas-controls-shadow` | `0 4px 16px` black at 18% | Lift of each group off the canvas. |

<!--@include: ./_shared.md-->
