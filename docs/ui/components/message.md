---
layout: nubisco
title: Message
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbMessage` displays contextual feedback below (or inside) a form field: errors, warnings, or helper hints. It pairs naturally with `NbTextInput`, `NbSelect`, and other form controls, but can also be used standalone anywhere feedback text is needed.

<preview>
  <NbMessage variant="error">This field is required.</NbMessage>
  <NbMessage variant="warning">Value will be trimmed to 255 characters.</NbMessage>
  <NbMessage variant="helper">Use dot-notation, e.g. <code>auth.login.title</code>.</NbMessage>
</preview>

```vue
<template>
  <NbMessage variant="error">This field is required.</NbMessage>
  <NbMessage variant="warning">Value exceeds limit.</NbMessage>
  <NbMessage variant="helper">Use dot-separated notation.</NbMessage>
</template>
```

## Icon-only mode

When `icon-only` is set, the text is hidden and reappears as a tooltip on hover. This is how `NbTextInput` uses `NbMessage` in the `fluid` variant to keep the field compact.

<preview dir="row">
  <NbMessage variant="error" icon-only>This field is required.</NbMessage>
  <NbMessage variant="warning" icon-only>Value exceeds recommended length.</NbMessage>
  <NbMessage variant="helper" icon-only>Dot-separated key, e.g. auth.login.title</NbMessage>
</preview>

```vue
<template>
  <NbMessage variant="error" icon-only>This field is required.</NbMessage>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop       | Type                               | Default    | Description                                            |
| ---------- | ---------------------------------- | ---------- | ------------------------------------------------------ |
| `variant`  | `'error' \| 'warning' \| 'helper'` | `'helper'` | Controls color and icon                                |
| `iconOnly` | `boolean`                          | `false`    | Shows only the icon; text visible on hover via tooltip |

## Slots

| Slot      | Description                            |
| --------- | -------------------------------------- |
| `default` | The message text (shown or in tooltip) |

## Icon mapping

| Variant   | Icon             | Color                |
| --------- | ---------------- | -------------------- |
| `error`   | `warning-circle` | `--nb-c-danger`      |
| `warning` | `warning`        | `--nb-c-warning`     |
| `helper`  | `info`           | `--nb-c-text-subtle` |

## Accessibility

- Root element has `role="status"`.
- Errors use `aria-live="assertive"`; warnings and helpers use `aria-live="polite"`.
- The tooltip in `iconOnly` mode is `aria-hidden`; ensure error state is also communicated via the input's `aria-describedby` or `aria-invalid`.

</doc-tab>
