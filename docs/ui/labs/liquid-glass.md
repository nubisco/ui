---
layout: nubisco
title: Liquid Glass
tabs: ['Overview', 'Api']
---

<doc-tab name="Overview">

::: warning Experimental
`NbLiquidGlass` is part of **NubiscoUI Labs** and is not yet production-ready. The API may change between versions. Import via `NubiscoUILabs` rather than the main plugin.

**Chrome only.** SVG filters as `backdrop-filter` values are currently supported in Chromium-based browsers only. On Firefox and Safari the component renders a frosted-glass fallback (`backdrop-filter: blur`).
:::

`NbLiquidGlass` renders a physically-based glass surface using Snell's Law refraction. It generates a displacement map from the glass surface profile and applies it via an SVG `feDisplacementMap` filter and CSS `backdrop-filter`. The result is a refractive lens effect over whatever is behind it in the page.

## Setup

```ts
import { NubiscoUILabs } from '@nubisco/ui'

app.use(NubiscoUILabs)
```

Or import the component directly:

```ts
import { NbLiquidGlass } from '@nubisco/ui'
```

## Basic usage

Place `NbLiquidGlass` over any content. The component uses absolute/fixed positioning internally so it works best inside a `position: relative` container.

```vue
<template>
  <div style="position: relative; width: 200px; height: 200px;">
    <img
      src="/your-background.jpg"
      style="width: 100%; height: 100%; object-fit: cover;"
    />
    <NbLiquidGlass
      :width="200"
      :height="200"
      shape="squircle"
      :ior="1.5"
      style="position: absolute; inset: 0;"
    />
  </div>
</template>
```

## Shapes

The `shape` prop controls the curvature profile of the glass surface.

| Shape      | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `squircle` | Soft, rounded dome. Apple-style. Default.                    |
| `circle`   | Sharper spherical dome. More lens-like.                      |
| `concave`  | Inverted bowl. Diverges rather than converges light.         |
| `lip`      | Blends convex and concave. Creates a rim effect at the edge. |

## Index of refraction

`ior` controls how strongly the glass bends light. Real glass is around `1.5`. Higher values produce stronger refraction.

| Value | Effect                   |
| ----- | ------------------------ |
| `1.0` | No refraction (air)      |
| `1.3` | Subtle, ice-like         |
| `1.5` | Standard glass (default) |
| `1.8` | Dense glass              |
| `2.4` | Diamond-like             |

## Fallback behaviour

On unsupported browsers the component adds the `.nb-liquid-glass--unsupported` class and renders a `backdrop-filter: blur(12px) saturate(1.4)` frosted-glass effect. No JavaScript errors are thrown. The rim and specular highlights still render via CSS.

## Slot content

Any content placed in the default slot renders on top of the glass surface, above the rim and specular layers.

```vue
<template>
  <NbLiquidGlass :width="240" :height="80" shape="squircle">
    <span>Label inside glass</span>
  </NbLiquidGlass>
</template>
```

## Performance

The displacement map is a one-time canvas operation. It only rebuilds when `width`, `height`, `shape`, or `ior` change. Animating position or opacity is free. Animating size is expensive.

</doc-tab>

<doc-tab name="Api">

## Import

```ts
// Via plugin (registers globally)
import { NubiscoUILabs } from '@nubisco/ui'
app.use(NubiscoUILabs)

// Direct import
import { NbLiquidGlass } from '@nubisco/ui'
```

## Props

| Prop           | Type          | Default       | Description                              |
| -------------- | ------------- | ------------- | ---------------------------------------- |
| `width`        | `number`      | required      | Width of the glass surface in pixels     |
| `height`       | `number`      | required      | Height of the glass surface in pixels    |
| `shape`        | `TGlassShape` | `'squircle'`  | Surface curvature profile                |
| `ior`          | `number`      | `1.5`         | Index of refraction for the glass medium |
| `borderRadius` | `string`      | shape default | CSS `border-radius` override             |

## TGlassShape

```ts
type TGlassShape = 'circle' | 'squircle' | 'concave' | 'lip'
```

## Slots

| Slot      | Description                              |
| --------- | ---------------------------------------- |
| `default` | Content rendered above the glass surface |

## CSS classes

| Class                          | Condition  | Description                   |
| ------------------------------ | ---------- | ----------------------------- |
| `nb-liquid-glass`              | Always     | Root element                  |
| `nb-liquid-glass--{shape}`     | Always     | Current shape variant         |
| `nb-liquid-glass--unsupported` | Non-Chrome | Frosted-glass fallback active |

## Browser support

| Browser       | Status                 |
| ------------- | ---------------------- |
| Chrome / Edge | Full refraction effect |
| Firefox       | Frosted-glass fallback |
| Safari        | Frosted-glass fallback |

</doc-tab>
