# Tooltip

## Overview

Tooltips are created using a directive that provides contextual information when users hover over or focus on an element.

:::tip Features

- **Delay**: Tooltips have a default delay of `500ms` before showing, configurable via the `delay` property.
- **Flavors**: You can choose from different visual themes: `primary`, `error`, and `info`.
- **Positioning**: Tooltips support four positions: `cursor` (default), `top`, `bottom`, `left`, and `right`.
- **Follow cursor**: With position set to `cursor` (default), setting `followCursor: true` will update tooltip position on mouse move
- **Content**: Each tooltip can include a `header`, `body`, and `tip` for flexible customization. Content supports both simple strings and complex content structures with formatting.
- **Custom styling**: You can pass an extra class `classExtra` to the main tooltip container for custom styling.
  :::

## Variations and Examples

### Basic Tooltip

:::tabs
== Preview

<demo dir="col">
  <NbButton variant="primary" v-nb-tooltip="{ body: 'Tooltip Body' }">Basic (cursor) Tooltip</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ body: 'Tooltip Body', followCursor: true }">Tooltip following mouse cursor</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ body: 'Tooltip Body', position: 'top' }">Basic Top Tooltip</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ body: 'Tooltip Body', position: 'bottom' }">Basic Bottom Tooltip</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ body: `<strong>Tooltip Body</strong><br>Next row`, position: 'left' }">Multi Row Left Tooltip</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ body: '<strong>Username</strong> <em>Viewer</em><br><strong>Username</strong> <em>Editor</em>', position: 'right' }">Multi row and style Right Tooltip</NbButton>
</demo>

== Code

```vue
<template>
  <NbButton
    variant="primary"
    v-nb-tooltip="{ body: 'Tooltip Body', position: 'top' }"
    >Basic Top Tooltip</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{ body: 'Tooltip Body', position: 'bottom' }"
    >Basic Bottom Tooltip</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      body: `<strong>Tooltip Body</strong><br>Next row`,
      position: 'left',
    }"
    >Multi Row Left Tooltip</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      body: '<strong>Username</strong> <em>Viewer</em><br><strong>Username</strong> <em>Editor</em>',
      position: 'right',
    }"
    >Multi row and style Right Tooltip</NbButton
  >
</template>
```

:::

### Advanced Tooltip with Header and Tip

:::tabs
== Preview

<demo dir="row">
  <NbButton variant="primary" v-nb-tooltip="{header: 'Header 1', body: 'Tooltip Body', tip: '(I am a tip)', position: 'top' }">Header + Tip (Top)</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{header: 'Header 2', body: 'Tooltip Body', tip: '(I am a tip)', position: 'bottom' }">Header + Tip (Bottom)</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{header: 'Header 3', body: 'Tooltip Body', tip: '(I am a tip)', position: 'left' }">Header + Tip (Left)</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{header: 'Header 4', body: 'Tooltip Body', tip: '(I am a tip)', position: 'right' }">Header + Tip (Right)</NbButton>
</demo>

== Code

```vue
<template>
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: 'Header 1',
      body: 'Tooltip Body',
      tip: '(I am a tip)',
      position: 'top',
    }"
    >Header + Tip (Top)</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: 'Header 2',
      body: 'Tooltip Body',
      tip: '(I am a tip)',
      position: 'bottom',
    }"
    >Header + Tip (Bottom)</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: 'Header 3',
      body: 'Tooltip Body',
      tip: '(I am a tip)',
      position: 'left',
    }"
    >Header + Tip (Left)</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: 'Header 4',
      body: 'Tooltip Body',
      tip: '(I am a tip)',
      position: 'right',
    }"
    >Header + Tip (Right)</NbButton
  >
</template>
```

:::

### Advanced Tooltip with flavors

:::tabs
== Preview

<demo dir="row">
  <NbButton v-nb-tooltip="{ header: 'Default Header', body: 'Tooltip Body', position: 'left' }">Default</NbButton>
  <NbButton variant="primary" v-nb-tooltip="{ header: 'Error Header', flavor: 'primary', body: 'Tooltip Body', position: 'bottom' }">Primary</NbButton>
  <NbButton flavor="danger" v-nb-tooltip="{ header: 'Info Header', flavor: 'danger', body: 'Tooltip Body', position: 'top' }">Danger</NbButton>
  <NbButton flavor="info" v-nb-tooltip="{ header: 'Primary Header', flavor: 'info', body: 'Tooltip Body', position: 'right', }">Info</NbButton>
  <NbButton flavor="generic" v-nb-tooltip="{ header: 'Primary Header', body: 'Tooltip Body', position: 'right', classExtra: 'tooltip-red-demo' }">Passing an extra class to the main tooltip container</NbButton>
  <NbIcon
    v-nb-tooltip="{ body: 'Tooltip Body', position: 'bottom', flavor: 'danger' }"
    name="error-circle"
    size="lg"
    clickable
    color="var(--nb-c-danger)"
  />
</demo>

== Code

```vue
<template>
  <NbButton
    v-nb-tooltip="{
      header: 'Default Header',
      body: 'Tooltip Body',
      position: 'left',
    }"
    >Default</NbButton
  >
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: 'Error Header',
      flavor: 'primary',
      body: 'Tooltip Body',
      position: 'bottom',
    }"
    >Primary</NbButton
  >
  <NbButton
    flavor="danger"
    v-nb-tooltip="{
      header: 'Info Header',
      flavor: 'danger',
      body: 'Tooltip Body',
      position: 'top',
    }"
    >Danger</NbButton
  >
  <NbButton
    flavor="info"
    v-nb-tooltip="{
      header: 'Primary Header',
      flavor: 'info',
      body: 'Tooltip Body',
      position: 'right',
    }"
    >Info</NbButton
  >
  <NbButton
    flavor="generic"
    v-nb-tooltip="{
      header: 'Primary Header',
      body: 'Tooltip Body',
      position: 'right',
      classExtra: 'tooltip-red-demo',
    }"
    >Passing an extra class to the main tooltip container</NbButton
  >
  <NbIcon
    v-nb-tooltip="{
      body: 'Tooltip Body',
      position: 'bottom',
      flavor: 'danger',
    }"
    name="error-circle"
    size="lg"
    clickable
    color="var(--nb-c-danger)"
  />
</template>
```

:::

### Complex Content Support

Tooltips support both simple strings and complex content structures with formatting (bold, italic, nested elements, etc.). Use an array of component objects to create rich tooltip content:

:::tabs
== Preview

<demo dir="col">
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      body: [
        {
          component: 'div',
          content: [
            { component: 'span', content: 'This tooltip shows ' },
            { component: 'b', content: 'bold text' },
            { component: 'span', content: ' and ' },
            { component: 'em', content: 'italic text' },
            { component: 'span', content: ' for better formatting' }
          ]
        }
      ],
      position: 'top'
    }"
  >
    Complex Content Tooltip
  </NbButton>
  <NbButton
    variant="primary"
    v-nb-tooltip="{
      header: [
        {
          component: 'div',
          content: [
            { component: 'span', content: 'Header with ' },
            { component: 'b', content: 'bold' }
          ]
        }
      ],
      body: [
        {
          component: 'div',
          content: [
            { component: 'p', content: 'First paragraph with important information.' },
            { component: 'p', content: 'Second paragraph with more details.' }
          ]
        }
      ],
      position: 'bottom'
    }"
  >
    Complex Header & Body
  </NbButton>
</demo>

== Code

```vue
<template>
  <!-- Simple complex content in body -->
  <NbButton
    v-nb-tooltip="{
      body: [
        {
          component: 'div',
          content: [
            { component: 'span', content: 'This tooltip shows ' },
            { component: 'b', content: 'bold text' },
            { component: 'span', content: ' and ' },
            { component: 'em', content: 'italic text' },
          ],
        },
      ],
      position: 'top',
    }"
  >
    Complex Content Tooltip
  </NbButton>

  <!-- Complex content in header and body -->
  <NbButton
    v-nb-tooltip="{
      header: [
        {
          component: 'div',
          content: [
            { component: 'span', content: 'Header with ' },
            { component: 'b', content: 'bold' },
          ],
        },
      ],
      body: [
        {
          component: 'div',
          content: [
            { component: 'p', content: 'First paragraph.' },
            { component: 'p', content: 'Second paragraph.' },
          ],
        },
      ],
      position: 'bottom',
    }"
  >
    Complex Header & Body
  </NbButton>
</template>
```

:::

**Component Structure:**

Each component object in the array supports:

- `component`: HTML element name (e.g., 'div', 'span', 'b', 'em', 'strong', 'p', 'br')
- `content` or `children`: String content or array of nested component objects (both properties are supported)
- `props`: Optional HTML attributes (e.g., `{ class: 'my-class', style: 'color: red' }`)

**Example with props:**

```vue
<template>
  <NbButton
    v-nb-tooltip="{
      body: [
        {
          component: 'div',
          props: { class: 'tooltip-content' },
          content: [
            {
              component: 'span',
              props: { style: 'color: blue;' },
              content: 'Styled text',
            },
            { component: 'b', content: 'Bold text' },
          ],
        },
      ],
    }"
  >
    Styled Complex Tooltip
  </NbButton>
</template>
```

::: tip

- Complex content structures are automatically converted to HTML with proper escaping
- Use `content` or `children` property (both are supported for compatibility)
- Nested structures are fully supported - you can nest components as deep as needed
- Simple strings continue to work as before for backward compatibility
  :::

<style lang="scss">
.tooltip-red-demo {
  color: red;
}
</style>
