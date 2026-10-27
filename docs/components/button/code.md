---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Action hierarchy

Three variants carry the hierarchy. Reach for these first; the status colours
below are a different tool for a different job.

<preview dir="row">
  <NbButton variant="ghost">Cancel</NbButton>
  <NbButton variant="secondary">Save draft</NbButton>
  <NbButton variant="primary">Publish</NbButton>
</preview>

```vue
<NbButton variant="ghost">Cancel</NbButton>
<NbButton variant="secondary">Save draft</NbButton>
<NbButton variant="primary">Publish</NbButton>
```

| Variant     | Use it for                                                  |
| ----------- | ----------------------------------------------------------- |
| `primary`   | The one action the screen exists for. At most one per view. |
| `secondary` | A real alternative the user might reasonably take instead.  |
| `ghost`     | Everything else: Cancel, Back, and toolbar actions.         |

**One primary per view.** Two filled buttons side by side is two screens'
worth of emphasis on one, and the eye picks neither.

**Cancel is never `danger`.** Cancel does not destroy anything; the button it
sits next to might.

### When a status colour is right

`success`, `info`, `warning` and `danger` say what a press _means_, not how
loud it should be. Use one only when the semantics match:

<preview dir="row">
  <NbButton variant="ghost">Cancel</NbButton>
  <NbButton variant="danger">Delete environment</NbButton>
</preview>

```vue
<NbButton variant="ghost">Cancel</NbButton>
<NbButton variant="danger">Delete environment</NbButton>
```

`danger` belongs on a control that destroys something. It is not a way to make
a button louder, and a screen with three red buttons has told the user nothing.
`success` on a Save button is the common mistake: saving is the primary action,
not a positive outcome, so it takes `primary`.

For a destructive action, the dialog does the guarding: see
[NbConfirm](/components/confirm/usage) and
[Dialogs](/patterns/dialogs).

## Icon Button

<preview dir="row">
  <NbButton icon="plus" aria-label="Add" />
  <NbButton variant="primary" icon="minus" aria-label="Remove" />
  <NbButton variant="danger" icon="trash" aria-label="Delete" loading />
  <NbButton variant="danger" icon="trash" aria-label="Delete" disabled />
</preview>

An icon-only button has no text for a screen reader to announce, so give it a
name. `aria-label` is the usual way. `v-nb-tooltip` also works, because it
writes the tooltip text to `aria-label` when the button has no other name.

```vue
<NbButton icon="trash" aria-label="Delete" />
<NbButton v-nb-tooltip="{ body: 'Delete' }" icon="trash" />
```

In development, an icon-only button that renders without `aria-label`,
`aria-labelledby`, `title` or text logs a warning naming the icon, once per
icon. Production builds stay silent.

## Props

| Prop       | Type                                                                                            | Default    | Description                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'link' \| 'danger' \| 'success' \| 'warning' \| 'info'` | —          | Visual role. Omitted, the button renders the high-contrast base treatment. `link` reads as a text link and ignores `size`. |
| `outlined` | `boolean`                                                                                       | `false`    | Transparent bg with colored border/text                                                                                    |
| `size`     | `'xxs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`                                        | `'md'`     | Button size. The full scale, all seven backed by CSS (since 1.55.0)                                                        |
| `disabled` | `boolean`                                                                                       | `false`    | Disables the button                                                                                                        |
| `loading`  | `boolean`                                                                                       | `false`    | Shows a spinner and prevents interaction                                                                                   |
| `type`     | `'button' \| 'submit' \| 'reset'`                                                               | `'button'` | Native `<button>` type. Ignored when `href` is set                                                                         |
| `href`     | `string`                                                                                        | -          | When provided, renders as `<a>` instead of `<button>`                                                                      |
| `target`   | `string`                                                                                        | -          | Forwarded to `<a>`. Only used when `href` is set (e.g. `_blank`)                                                           |
| `rel`      | `string`                                                                                        | -          | Forwarded to `<a>`. Only used when `href` is set (e.g. `noopener`)                                                         |
| `to`       | `string \| object`                                                                              | -          | When provided, renders as a `<RouterLink>` for Vue Router navigation                                                       |

### Link buttons

Use `href` for external links and `to` for internal Vue Router navigation.

When `href` is provided the component renders a semantic `<a>` element, preserving native browser link behaviors (right-click, middle-click, ctrl+click, `target="_blank"`).

When `to` is provided the component renders as a `<RouterLink>`, enabling client-side navigation with active-link tracking.

Disabled state is communicated via `aria-disabled` instead of the `disabled` attribute for both `<a>` and `<RouterLink>`.

```vue
<!-- External link: renders <a href="..." target="_blank" rel="noopener"> -->
<NbButton
  variant="primary"
  href="https://github.com/nubisco/verba"
  target="_blank"
  rel="noopener"
>
  View on GitHub
</NbButton>

<!-- Internal Vue Router link: renders <RouterLink to="..."> -->
<NbButton variant="ghost" to="/products">
  Explore products
</NbButton>
```

## Events

| Event   | Payload      | Description           |
| ------- | ------------ | --------------------- |
| `click` | `MouseEvent` | Fired on button click |

### Which token each variant paints

Every variant reads a **semantic** token, never a ramp name. That is what lets
a white-label product retheme the library without the accent leaking through:

| Variant     | Token                     | Means               |
| ----------- | ------------------------- | ------------------- |
| `primary`   | `--nb-c-primary`          | The screen's action |
| `secondary` | `--nb-c-secondary`        | An alternative      |
| `ghost`     | `--nb-c-contrast`         | Text only, no fill  |
| `link`      | `--nb-c-primary` (as ink) | A text link         |
| `success`   | `--nb-c-success`          | A positive outcome  |
| `info`      | `--nb-c-info`             | Informational       |
| `warning`   | `--nb-c-warning`          | Proceed with care   |
| `danger`    | `--nb-c-danger`           | Destroys something  |

Each also uses the matching `-hover`, `-active` and `-a11y` tokens, so a
retheme moves the whole state set together. Override the semantic token, not
the button.

<!--@include: ./_shared.md-->
