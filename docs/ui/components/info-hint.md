---
layout: nubisco
title: Info Hint
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbInfoHint` is a small, discreet affordance you drop next to anything whose meaning is not self-evident: a KPI number, a status word, a column header, an abbreviation. It renders a compact icon in a subtle token colour and reveals a short description on hover, focus, or click.

It exists so applications stop hand-rolling little grey question marks with hardcoded colours. Every colour here comes from the semantic token layer, so the hint follows the theme without the host knowing anything about it.

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbGrid dir="row" gap="xs" align="center">
    <span>Archived</span>
    <NbInfoHint v-bind="resultingProps" />
  </NbGrid>
</preview>

```vue
<template>
  <span>Archived</span>
  <NbInfoHint
    text="Items moved out of the active list. Kept for 90 days, then deleted."
  />
</template>
```

## Where it earns its place

Put a hint next to a label whose meaning a new user cannot guess. Do not use it for content that belongs in the interface itself: if every user needs the sentence, write the sentence.

<preview dir="col">
  <NbGrid dir="row" gap="md" align="center">
    <NbGrid dir="row" gap="xs" align="center">
      <strong style="font-size: 24px">1 284</strong>
      <NbInfoHint text="Counted at the last nightly sync, not in real time." />
    </NbGrid>
    <NbGrid dir="row" gap="xs" align="center">
      <NbBadge variant="red" dot>Archived</NbBadge>
      <NbInfoHint icon="question" text="Moved out of the active list more than 30 days ago." />
    </NbGrid>
  </NbGrid>
</preview>

## Hover, focus and touch

The popover opens on hover for pointer users and on focus for keyboard users. A **click or tap pins it open**, which is what makes it usable on touch devices, where there is no hover at all. A pinned popover is dismissed by clicking the icon again, pressing <kbd>Escape</kbd>, or clicking anywhere outside it.

## Placement

`placement` is a preference, not a guarantee. When the preferred side would push the popover off-screen it flips to the opposite side, then to the orthogonal sides, and finally clamps itself inside the viewport with the arrow re-aimed at the icon.

<preview dir="row">
  <NbInfoHint placement="top" text="Anchored above the icon." />
  <NbInfoHint placement="right" text="Anchored to the right of the icon." />
  <NbInfoHint placement="bottom" text="Anchored below the icon." />
  <NbInfoHint placement="left" text="Anchored to the left of the icon." />
</preview>

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

## Inside clickable rows and cards

A hint routinely lives inside something that is itself clickable. `NbInfoHint` stops click, `mousedown` and `pointerdown` from propagating, so opening a hint never triggers the host's action.

<preview>
  <div
    style="cursor: pointer; padding: 12px 16px; border: 1px solid var(--nb-c-border); border-radius: var(--nb-radius-md); background: var(--nb-c-surface)"
    @click="rowClicks++"
  >
    <NbGrid dir="row" gap="xs" align="center">
      <span>Click the row, then click the hint. Row clicks: <strong>{{ rowClicks }}</strong></span>
      <NbInfoHint text="Clicking me does not click the row." />
    </NbGrid>
  </div>
</preview>

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

## Accessibility

- The trigger is a real `<button>`, so it is reachable by <kbd>Tab</kbd> and activated by <kbd>Enter</kbd> or <kbd>Space</kbd>.
- `aria-expanded` reflects the open state; `aria-describedby` points at the popover only while it is visible, so the description is announced as the button's description rather than duplicated in its name.
- Give `label` a specific value when the hint sits next to an ambiguous value: the default name, "More information", tells a screen-reader user nothing about _what_ is being explained.
- <kbd>Escape</kbd> closes the popover and leaves focus on the trigger.
- The open animation is suppressed under `prefers-reduced-motion: reduce`.

</doc-tab>

<doc-tab name="Api">

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

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'

const rowClicks = ref(0)

const availableProps = [
  {
    label: 'Text',
    name: 'text',
    type: 'string',
    placeholder: 'The description revealed on hover or click',
    default: 'Items moved out of the active list. Kept for 90 days, then deleted.',
  },
  {
    label: 'Title',
    name: 'title',
    type: 'string',
    placeholder: 'Optional heading above the body',
    default: '',
  },
  {
    label: 'Placement',
    name: 'placement',
    type: 'single',
    options: [
      { value: 'top', label: 'top' },
      { value: 'right', label: 'right' },
      { value: 'bottom', label: 'bottom' },
      { value: 'left', label: 'left' },
    ],
    placeholder: 'Preferred side of the popover',
    default: 'top',
  },
  {
    label: 'Icon',
    name: 'icon',
    type: 'single',
    options: [
      { value: 'info', label: 'info' },
      { value: 'question', label: 'question' },
    ],
    placeholder: 'Icon glyph',
    default: 'info',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    min: 10,
    max: 24,
    step: 1,
    placeholder: 'Icon size in pixels',
    default: 14,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Renders the icon inert',
    default: false,
  },
]
</script>
