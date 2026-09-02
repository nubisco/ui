---
layout: nubisco
title: Accordion
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbAccordion` is a stack of headings that reveal their content when clicked. It is the plain disclosure for page body: [`NbShellPanel`](/ui/components/shell-panel) looks similar but is an inspector section, carrying a size control and expecting a panel rail around it.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion>
      <NbAccordionItem title="What a blueprint card is">
        A node in a graph. The parent owns its position and the wires between cards.
      </NbAccordionItem>
      <NbAccordionItem title="What a port is">
        One element that is at once the pin, the click target and the point a wire is measured to.
      </NbAccordionItem>
      <NbAccordionItem title="What a lane is">
        The column a card's ports occupy, anchored to the top of the card so a pin never moves when the body does.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

```vue
<NbAccordion>
  <NbAccordionItem title="What a blueprint card is">
    A node in a graph.
  </NbAccordionItem>
  <NbAccordionItem title="What a port is"> One element. </NbAccordionItem>
</NbAccordion>
```

## When to use it

Carbon's guidance holds here, and it is mostly about restraint.

- **Do** use it to shorten a page whose content is not all essential, and to group related detail a reader can choose to open.
- **Don't** use it when the reader is likely to want everything. An accordion then charges them a click per section for no benefit; a scrolling page with ordinary headings is better.
- **Don't** use it for nested hierarchy. Reach for [`NbTree`](/ui/components/tree) instead.

Content inside a closed panel stays in the DOM, so find-in-page still reaches it. That is deliberate: an accordion is progressive disclosure, not lazy loading. If a section is genuinely expensive, defer it yourself from the `toggle` event.

## One open, or several

By default opening a section closes the last one, which keeps the page short. Set `multiple` when sections are meant to be compared.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion multiple>
      <NbAccordionItem title="Analog ports" meta="3">
        Solid pins that fill in proportion to their level.
      </NbAccordionItem>
      <NbAccordionItem title="Digital ports" meta="2">
        Striped pins that pulse once per event.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Icons and meta

`icon` puts a mark before the title; `meta` puts a count or a status after it, before the chevron.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion>
      <NbAccordionItem title="Fields" icon="tray" meta="12">
        The shape of a content type.
      </NbAccordionItem>
      <NbAccordionItem title="Permissions" icon="lock-simple" meta="Restricted">
        Who may read and who may publish.
      </NbAccordionItem>
      <NbAccordionItem title="Deleted" icon="warning-circle" disabled>
        Never shown: a disabled item cannot be opened.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Flush, for panels and sidebars

`flush` drops the side inset so titles line up with the content above them, and stops two nearly-touching rule lines appearing where a bordered accordion meets a bordered panel. Hover and focus still reach into the gutter, so a row is still a row.

<preview>
  <div style="max-width: 22rem; width: 100%; background: var(--nb-c-surface); border: 1px solid var(--nb-c-border); padding: 1rem;">
    <NbAccordion flush size="sm">
      <NbAccordionItem title="Transform"> Position, rotation, scale. </NbAccordionItem>
      <NbAccordionItem title="Material"> Albedo, roughness, metallic. </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Sizes

<preview>
  <div style="max-width: 34rem; width: 100%; display: grid; gap: 1.5rem;">
    <NbAccordion size="sm"><NbAccordionItem title="Small, 32px rows">For dense panels.</NbAccordionItem></NbAccordion>
    <NbAccordion size="md"><NbAccordionItem title="Medium, 40px rows">The default.</NbAccordionItem></NbAccordion>
    <NbAccordion size="lg"><NbAccordionItem title="Large, 48px rows">For pages that are mostly accordion.</NbAccordionItem></NbAccordion>
  </div>
</preview>

## Chevron placement

The chevron sits at the end by default, so every title starts on the same line as the type around it. `align="start"` puts it in front, which makes the accordion read as a tree; use it only when the content really is hierarchical.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion align="start">
      <NbAccordionItem title="Chevron in front">Reads as a tree.</NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Controlled

Bind `v-model` to drive which sections are open from outside, for example to open one from a URL. The value is always an array, including when `multiple` is false, so the binding does not change shape if you change your mind later.

```vue
<script setup>
const open = ref(['shipping'])
</script>

<template>
  <NbAccordion v-model="open" multiple>
    <NbAccordionItem id="shipping" title="Shipping" />
    <NbAccordionItem id="returns" title="Returns" />
  </NbAccordion>
</template>
```

Pass an explicit `id` on every item when you do this. Without one an id is generated, and a generated id is not a thing you can meaningfully persist.

## Keyboard

| Key                                   | Does                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| <kbd>Tab</kbd>                        | Moves to the next header, skipping the panels' contents |
| <kbd>Enter</kbd> / <kbd>Space</kbd>   | Opens or closes the focused section                     |
| <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | Moves between headers, wrapping                         |
| <kbd>Home</kbd> / <kbd>End</kbd>      | Jumps to the first or last header                       |

Each header is a `<button>` inside a `role="heading"` element. The heading is what lets a screen reader list the sections; the button is what operates them.

Set `headingLevel` to fit the accordion into the page's outline. It defaults to 3.

```vue
<NbAccordion :heading-level="2">
  <NbAccordionItem title="Under an h1" />
</NbAccordion>
```

The heading is a `role="heading"` div rather than an `<h3>` on purpose. A real `<h3>` inherits any `some-container h3 { margin }` the host page has, and an element selector inside a class outranks a component's own scoped rule, so the component cannot defend against it. That is not theoretical: it was adding 20px above every title in these very docs.

</doc-tab>

<doc-tab name="Api">

## NbAccordion props

| Prop         | Type                   | Default | Description                                                            |
| ------------ | ---------------------- | ------- | ---------------------------------------------------------------------- |
| `modelValue` | `string[]`             | —       | Ids of the open items. Always an array, whatever `multiple` is set to. |
| `multiple`   | `boolean`              | `false` | Allow more than one item open at once.                                 |
| `flush`      | `boolean`              | `false` | Drop the side inset and the outer border, for panels and sidebars.     |
| `align`      | `'start' \| 'end'`     | `'end'` | Chevron placement. `start` reads as a tree; prefer `end`.              |
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`  | Row height: 32, 40 or 48px.                                            |

## NbAccordion events

| Event               | Payload                       | Description                                                                   |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `update:modelValue` | `string[]`                    | The new set of open ids.                                                      |
| `toggle`            | `[id: string, open: boolean]` | One item changed. Cheaper than diffing `modelValue` to lazily load a section. |

## NbAccordionItem props

| Prop       | Type      | Default | Description                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------------- |
| `id`       | `string`  | auto    | Stable identifier used in `modelValue`. Pass one if the state is persisted. |
| `title`    | `string`  | `''`    | Header text. Use the `title` slot for anything richer.                      |
| `icon`     | `string`  | —       | Icon name, rendered before the title.                                       |
| `meta`     | `string`  | `''`    | Short text after the title: a count, a status.                              |
| `disabled` | `boolean` | `false` | Renders muted and cannot be toggled.                                        |

## NbAccordionItem slots

| Slot      | Description                |
| --------- | -------------------------- |
| `default` | The panel's content.       |
| `title`   | Replaces the `title` prop. |
| `meta`    | Replaces the `meta` prop.  |

</doc-tab>
