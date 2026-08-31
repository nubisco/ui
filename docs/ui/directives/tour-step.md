---
layout: nubisco
title: Tour Step
---

# Tour step

`v-nb-tour-step` tags an element as a [walkthrough](/ui/components/walkthrough) target. All it does is stamp a `data-nb-tour-step` attribute, which the tour resolves by id.

```vue
<template>
  <NbSidebarMenu v-nb-tour-step="'sidebar-nav'">
    <!-- … -->
  </NbSidebarMenu>
</template>
```

```ts
// The step then references the id, not the markup:
{ target: 'sidebar-nav', title: 'Navigation', body: 'Every section lives here.' }
```

## Why an id instead of a selector

A CSS selector encodes today's DOM structure. Rename a class, wrap a component in a layout div, and the tour silently spotlights nothing. A tour-step id travels with the element it is written on, so the reference survives the refactor. Steps also accept selectors, elements, refs and getters, but ids are the convention worth defaulting to.

When a string is used as a step `target`, it is resolved as a tour-step id **first** and only then as a CSS selector, so an id like `nav` is never shadowed by the `<nav>` element.

## Writing the attribute by hand

The directive is deliberately thin. Anywhere a directive is awkward, server-rendered markup, or a third-party component that does not forward directives, write the attribute directly and get identical behaviour:

```html
<div data-nb-tour-step="sidebar-nav">…</div>
```

## Dynamic and conditional ids

The attribute follows the bound value. Setting it to `''`, `null` or `undefined` removes the attribute, which is a convenient way to make a target eligible only in some states.

```vue
<template>
  <section v-nb-tour-step="isEditable ? 'editor-canvas' : ''">…</section>
</template>
```

A step whose target cannot be resolved is skipped over rather than shown as an empty spotlight, so a conditionally-tagged element does not break the tour.

## Registration

The directive is registered by the library's default install:

```ts
import NubiscoUI from '@nubisco/ui'

app.use(NubiscoUI)
```

To register it on its own:

```ts
import { nbTourStepDirective } from '@nubisco/ui'

nbTourStepDirective(app)
```

## Helpers

| Export                | Type                                     | Description                                                      |
| --------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `TOUR_STEP_ATTRIBUTE` | `'data-nb-tour-step'`                    | The attribute name, for hand-written markup and test assertions. |
| `tourStepSelector`    | `(id: string) => string`                 | Builds the attribute selector for an id.                         |
| `resolveTourTarget`   | `(target, root?) => HTMLElement \| null` | Resolves any step `target` form to an element, or `null`.        |
| `isTargetVisible`     | `(el: HTMLElement \| null) => boolean`   | Whether an element is connected and has a non-zero box.          |
