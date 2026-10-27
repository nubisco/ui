---
layout: nubisco
title: Interpolation Chart
intro: '`NbInterpolationChart` visualises a piecewise-linear mapping between two numeric scales and lets users calibrate the curve by dragging, adding, or removing control points.'
source: src/components/Charts/InterpolationChart.vue
tab: code
pageTabs: ['usage', 'code']
---

## Props

| Prop          | Type                    | Default | Description                                         |
| ------------- | ----------------------- | ------- | --------------------------------------------------- |
| `modelValue`  | `IInterpolationPoint[]` | `[]`    | The mapping points. Supports `v-model`.             |
| `inputLabel`  | `string`                | -       | Label for the X (input) axis                        |
| `outputLabel` | `string`                | -       | Label for the Y (output) axis                       |
| `inputMin`    | `number`                | `0`     | Minimum allowed input value                         |
| `inputMax`    | `number`                | `100`   | Maximum allowed input value                         |
| `outputMin`   | `number`                | `0`     | Minimum allowed output value                        |
| `outputMax`   | `number`                | `100`   | Maximum allowed output value                        |
| `editable`    | `boolean`               | `true`  | Enable drag, add, and remove interactions           |
| `minPoints`   | `number`                | `2`     | Minimum number of points (cannot remove below this) |
| `inputStep`   | `number`                | `0`     | Snap input values to this step (0 = no snap)        |
| `outputStep`  | `number`                | `0`     | Snap output values to this step (0 = no snap)       |
| `title`       | `string`                | -       | Chart title                                         |
| `subtitle`    | `string`                | -       | Secondary descriptive line                          |
| `height`      | `number \| string`      | `280`   | Container height                                    |
| `showTooltip` | `boolean`               | `true`  | Show tooltip on hover/drag                          |
| `showGrid`    | `boolean`               | `true`  | Render Y-axis gridlines                             |

## Events

| Event               | Payload                 | Description                               |
| ------------------- | ----------------------- | ----------------------------------------- |
| `update:modelValue` | `IInterpolationPoint[]` | Emitted after each edit (sorted by input) |

## Types

```typescript
interface IInterpolationPoint {
  input: number
  output: number
}
```

## Notes

- Points are always emitted sorted by `input` (ascending).
- While dragging, a point's input value is clamped between its neighbours so points never cross.
- The chart uses piecewise linear interpolation (straight lines between points), matching the actual interpolation algorithm used by devices.
- Input/output step snapping helps users land on clean values (e.g. 0.5C increments).

<!--@include: ./_shared.md-->
