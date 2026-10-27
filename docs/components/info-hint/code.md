---
layout: nubisco
title: Info Hint
intro: '`NbInfoHint` is a small, discreet affordance you drop next to anything whose meaning is not self-evident: a KPI number, a status word, a column header, an abbreviation. It renders a compact icon in a subtle token colour and reveals a short description on hover, focus, or click.'
source: src/components/InfoHint.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Rich content

Use the default slot when a single sentence is not enough. The slot content inherits the popover's surface tokens, so nested markup themes correctly on its own.

<preview>
  <NbGrid dir="row" gap="xs" align="center">
    <span>Completion rate</span>
    <NbInfoHint title="How this is calculated">
      <p>Tasks finished in the period divided by tasks that came due in it.</p>
      <p>Tasks cancelled before their due date are excluded from both sides.</p>
    </NbInfoHint>
  </NbGrid>
</preview>

```vue
<template>
  <NbInfoHint title="How this is calculated">
    <p>Tasks finished in the period divided by tasks that came due in it.</p>
    <p>Cancelled tasks are excluded from both sides.</p>
  </NbInfoHint>
</template>
```

## Wiring a glossary

`term` is an opaque identifier the library never resolves. It is mirrored onto `data-term` and echoed back on the `activate` event, so an app can map hints to a central glossary, count which concepts confuse people, or deep-link into its own documentation.

```vue
<template>
  <NbInfoHint
    term="status.archived"
    :text="glossary['status.archived']"
    @activate="openGlossary"
  />
</template>

<script setup lang="ts">
import { glossary } from '@/content/glossary'

function openGlossary(term?: string) {
  if (term) router.push({ name: 'glossary', hash: `#${term}` })
}
</script>
```

## Replacing a hand-rolled help icon

A component like this is the usual reason a codebase ends up with literal greys in it:

```vue
<!-- Before: colours frozen at author time, wrong in one theme or the other -->
<template>
  <i class="help" style="color: #94a3b8" @mouseenter="show = true">?</i>
</template>
```

```vue
<!-- After: the same affordance, themed by the design system -->
<template>
  <NbInfoHint icon="question" :text="description" />
</template>
```

## Props

| Prop         | Type                                     | Default              | Description                                                                                                  |
| ------------ | ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `text`       | `string`                                 | —                    | Plain-text description. Ignored when the default slot is used.                                               |
| `title`      | `string`                                 | —                    | Optional bold heading above the body.                                                                        |
| `term`       | `string`                                 | —                    | Glossary / doc identifier. Mirrored to `data-term` and emitted on `activate`. Never resolved by the library. |
| `placement`  | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`              | Preferred side. Flipped and clamped to stay in the viewport.                                                 |
| `size`       | `number`                                 | `14`                 | Icon size in pixels.                                                                                         |
| `icon`       | `string`                                 | `'info'`             | Any icon name `NbIcon` accepts, e.g. `'question'`.                                                           |
| `label`      | `string`                                 | `'More information'` | Accessible name for the trigger button.                                                                      |
| `openDelay`  | `number`                                 | `120`                | Milliseconds before a hover opens the popover.                                                               |
| `closeDelay` | `number`                                 | `140`                | Milliseconds before leaving the trigger closes it. Ignored while pinned.                                     |
| `teleportTo` | `string`                                 | `'body'`             | Teleport target for the popover.                                                                             |
| `disabled`   | `boolean`                                | `false`              | Renders the icon inert and suppresses the popover.                                                           |

## Events

| Event      | Payload         | Description                                                                                                                                                             |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`     | —               | The popover became visible, by hover, focus or click.                                                                                                                   |
| `close`    | —               | The popover was dismissed.                                                                                                                                              |
| `activate` | `term?: string` | The hint was deliberately activated (click / <kbd>Enter</kbd> / <kbd>Space</kbd>), not merely hovered. Use this, not `open`, to drive glossary navigation or analytics. |

## Slots

| Slot      | Props | Description                                                             |
| --------- | ----- | ----------------------------------------------------------------------- |
| `default` | —     | Rich popover body. Takes precedence over the `text` prop when provided. |

## Exposed methods

| Member   | Type           | Description                      |
| -------- | -------------- | -------------------------------- |
| `open`   | `() => void`   | Opens the popover imperatively.  |
| `close`  | `() => void`   | Closes the popover imperatively. |
| `isOpen` | `Ref<boolean>` | Current visibility.              |

## Tokens used

| Token                                         | Applied to                                 |
| --------------------------------------------- | ------------------------------------------ |
| `--nb-c-text-subtle` / `--nb-c-text`          | Icon at rest / on hover and focus          |
| `--nb-c-layer-3`, `--nb-c-layer-border-3`     | Popover surface and border (overlay depth) |
| `--nb-c-text`, `--nb-c-text-muted`            | Popover title and body                     |
| `--nb-c-scrim`                                | Popover shadow                             |
| `--nb-c-focus-ring`                           | Focus outline                              |
| `--nb-radius-md`, `--nb-radius-pill`          | Popover and trigger rounding               |
| `--nb-type-label-md-*`, `--nb-type-body-sm-*` | Title and body typography                  |

<!--@include: ./_shared.md-->
