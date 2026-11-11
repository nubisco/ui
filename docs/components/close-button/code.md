---
layout: nubisco
title: Close Button
intro: '`NbCloseButton` is the one control that closes or dismisses something: a dialog, a side panel, a sheet, a toast, a banner. It is a ghost icon-only `NbButton` with the `x` icon, in the two sizes Carbon uses for the job.'
source: src/components/CloseButton.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Props

| Prop              | Type                                     | Default    | Description                                                         |
| ----------------- | ---------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `label`           | `string`                                 | catalogue  | Accessible name and tooltip. Falls back to the catalogue's `close`  |
| `size`            | `'sm' \| 'lg'`                           | `'sm'`     | `lg` (48px) for dialogs, side panels and sheets, `sm` (32px) inline |
| `disabled`        | `boolean`                                | `false`    | Native `disabled`                                                   |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Where the tooltip opens                                             |

## Events

| Event   | Payload      | Fired when            |
| ------- | ------------ | --------------------- |
| `click` | `MouseEvent` | The button is pressed |

## Exposed

| Member    | Type                        | Description                                               |
| --------- | --------------------------- | --------------------------------------------------------- |
| `focus()` | `() => void`                | Moves focus onto the button, for a sheet that opens on it |
| `el()`    | `() => HTMLElement \| null` | The rendered `<button>`                                   |

## Strings

| Key     | Default   |
| ------- | --------- |
| `close` | `'Close'` |

```ts
import { provideNbStrings } from '@nubisco/ui'

provideNbStrings({ close: 'Schließen' }, app)
```
