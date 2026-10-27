---
layout: nubisco
title: Grid
source: src/components/Grid.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Overview

`NbGrid` is a flexible layout primitive built on CSS flexbox. A `dir="row"` grid arranges children horizontally; a `dir="col"` grid arranges them vertically. Nest them freely to build any layout.

The grid is configured at compile time via `src/styles/variables/_grid.scss`.

## Visual demo

<preview style-grid>
  <div class="grid-demo-label">Grid structure</div>
  <div class="grid-demo-description">Column-spanning overview — each row uses the same 16-column total width.</div>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="1" class="grid-demo-item">1</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">3</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">5</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">6</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">7</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">8</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">9</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">10</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">11</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">12</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">13</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">14</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">15</nb-grid>
    <nb-grid dir="col" grid="1" class="grid-demo-item">16</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
    <nb-grid dir="col" grid="2" class="grid-demo-item">2</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
    <nb-grid dir="col" grid="4" class="grid-demo-item">4</nb-grid>
  </nb-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
    <nb-grid dir="col" grid="8" class="grid-demo-item">8</nb-grid>
  </nb-grid>
  <nb-grid dir="row">
    <nb-grid dir="col" grid="16" class="grid-demo-item">16</nb-grid>
  </nb-grid>
</preview>

## Direction

The `dir` prop controls the main axis: `row` lays children side by side; `col` stacks them top to bottom.

## Gaps

The `gap` prop controls spacing between children using named size tokens.

## Gap scale

| Token | Value |
| ----- | ----- |
| `xxs` | 2px   |
| `xs`  | 4px   |
| `sm`  | 8px   |
| `md`  | 16px  |
| `lg`  | 24px  |
| `xl`  | 32px  |
| `xxl` | 48px  |

## Column gaps

<preview style-grid>
  <nb-grid dir="col" gap="xxs">
    <nb-grid dir="row" class="grid-demo-item demo-small">xxs (2px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">xxs (2px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="sm">
    <nb-grid dir="row" class="grid-demo-item demo-small">sm (8px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">sm (8px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="lg">
    <nb-grid dir="row" class="grid-demo-item demo-small">lg (24px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">lg (24px)</nb-grid>
  </nb-grid>
  <nb-grid dir="col" gap="xxl">
    <nb-grid dir="row" class="grid-demo-item demo-small">xxl (48px)</nb-grid>
    <nb-grid dir="row" class="grid-demo-item demo-small">xxl (48px)</nb-grid>
  </nb-grid>
</preview>

## Order

Use `first` and `last` boolean props to reorder items visually without changing DOM order. Use `reverse` to flip the entire row or column.

## Last

<preview style-grid>
  <nb-grid dir="row" gap="sm">
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM first</nb-grid>
    <nb-grid dir="col" last class="grid-demo-item demo-small order-last">DOM second — renders last</nb-grid>
    <nb-grid dir="col" class="grid-demo-item demo-small">DOM third</nb-grid>
  </nb-grid>
</preview>

## Visibility

Use the `visible` prop to show or hide grid items. It accepts a boolean or a breakpoint map for responsive control.
