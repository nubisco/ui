---
layout: nubisco
title: Action Group
intro: '`NbActionGroup` is a row of page actions that knows how to fit a phone. On a desktop it renders exactly the buttons you would have placed by hand. On a phone it keeps the one action that matters on screen as an icon and folds the rest into a "more" menu, so a topbar with five labelled buttons stays usable at 360px instead of being clipped.'
source: src/components/ActionGroup.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop            | Type                             | Default          | Description                                      |
| --------------- | -------------------------------- | ---------------- | ------------------------------------------------ |
| `items`         | `IActionGroupItem[]`             | required         | The actions, in reading order                    |
| `size`          | `TButtonSize`                    | `'sm'`           | Size of every action and of the overflow trigger |
| `overflow`      | `'never' \| 'phone' \| 'always'` | `'never'`        | When the actions fold into the overflow menu     |
| `overflowLabel` | `string`                         | `'More actions'` | Accessible name of the overflow trigger          |
| `phoneVisible`  | `number`                         | `1`              | How many actions stay on screen while folded     |

## IActionGroupItem

| Field      | Type                       | Description                                                  |
| ---------- | -------------------------- | ------------------------------------------------------------ |
| `id`       | `string`                   | Stable key, and the payload of `select`                      |
| `label`    | `string`                   | Button text, or the icon-only button's accessible name       |
| `icon`     | `TIconSource`              | Needed for the action to fold to icon-only                   |
| `variant`  | `TButtonVariant`           | Passed to `NbButton`. Defaults to `danger` when `danger` set |
| `outlined` | `boolean`                  | Passed to `NbButton`                                         |
| `disabled` | `boolean`                  | Passed to `NbButton` and the menu row                        |
| `loading`  | `boolean`                  | Passed to `NbButton`. A loading row is disabled in the menu  |
| `priority` | `'primary' \| 'secondary'` | `primary` actions are the ones a phone keeps on screen       |
| `danger`   | `boolean`                  | Destructive: a danger button and a danger menu row           |
| `onSelect` | `() => void`               | Runs when the action is chosen                               |

## Slots

| Slot   | Description                                                    |
| ------ | -------------------------------------------------------------- |
| `menu` | Extra `NbMenuItem`s appended to the overflow menu while folded |

## Events

| Event    | Payload      | Fired when                                      |
| -------- | ------------ | ----------------------------------------------- |
| `select` | `id: string` | An action was chosen, after its `onSelect` runs |
