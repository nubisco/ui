---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: code
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Action hierarchy

Four variants carry the hierarchy, with `link` below them. Reach for these
first. The status colours below are a different tool for a different job. The
full ladder, and when each rung applies, is on the Usage tab.

<preview dir="row">
  <NbButton variant="secondary">Cancel</NbButton>
  <NbButton variant="primary">Publish</NbButton>
</preview>

```vue
<NbButton variant="secondary">Cancel</NbButton>
<NbButton variant="primary">Publish</NbButton>
```

| Variant     | Use it for                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| `primary`   | The one action the screen or region exists for. One per header.              |
| `tertiary`  | A standalone action of lower rank. Exactly `primary` outlined, under a name. |
| `secondary` | Only beside a primary, as its negative half: Cancel, Discard, Back.          |
| `ghost`     | Rows, toolbars and tiles: icon-only buttons with a `label`.                  |

**One primary per header.** Two filled buttons side by side is two screens'
worth of emphasis on one, and the eye picks neither. `NbPanel`, `NbCard` and
`NbPageHeader` warn in development when their `actions` slot holds two.

**Cancel is always `secondary`, beside a primary.** It is never `ghost`,
which reads as grey text at rest, and never `danger`: Cancel does not destroy
anything, the button it sits next to might.

### When a status colour is right

`success`, `info`, `warning` and the three danger styles say what a press
_means_, not how loud it should be. Use one only when the semantics match:

<preview dir="row">
  <NbButton variant="secondary">Cancel</NbButton>
  <NbButton variant="danger">Delete environment</NbButton>
</preview>

```vue
<NbButton variant="secondary">Cancel</NbButton>
<NbButton variant="danger">Delete environment</NbButton>
```

`danger` belongs on a control that destroys something. It is not a way to make
a button louder, and a screen with three red buttons has told the user nothing.
`success` on a Save button is the common mistake: saving is the primary action,
not a positive outcome, so it takes `primary`.

`danger-tertiary` is `danger` outlined (it renders exactly
`variant="danger" outlined`), and `danger-ghost` is a ghost's box in danger's
colour. Which to use, and which combinations to avoid, is under
[Danger buttons](/components/button/usage#danger-buttons).

## Icon-only buttons

<preview dir="row">
  <NbButton variant="ghost" icon="plus" label="Add member" />
  <NbButton variant="ghost" icon="pencil-simple" label="Edit member" tooltip-position="top" />
  <NbButton variant="ghost" icon="trash" label="Remove member" loading />
  <NbButton variant="ghost" icon="trash" label="Remove member" disabled />
</preview>

Give an icon-only button a `label`. It becomes the accessible name **and** a
tooltip anchored to the button, below it by default. Do not add
`v-nb-tooltip` or `aria-label` as well: `label` already does both, and two
copies of the same words drift apart.

```vue
<NbButton variant="ghost" icon="trash" label="Remove member" />

<!-- The tooltip opens above, for a button at the bottom of the screen -->
<NbButton
  variant="ghost"
  icon="arrow-up"
  label="Back to top"
  tooltip-position="top"
/>

<!-- A longer spoken name than the chip: aria-label wins for the name -->
<NbButton
  variant="ghost"
  icon="trash"
  label="Remove"
  aria-label="Remove Jordan Lee from the project"
/>
```

`label` is ignored on a labelled button, whose text is its name. In
development, an icon-only button that renders with no name logs a warning
naming the icon, once per icon. Production builds stay silent.

## Toggles

`pressed` turns a button into a toggle. Set it to `true` or `false` and the
button carries `aria-pressed`, and a ghost draws a selected fill while it is
`true`. Leave it `undefined` on an ordinary button, which then has no
`aria-pressed` at all.

```vue
<NbButton
  variant="ghost"
  icon="sidebar-simple"
  label="Show details"
  :pressed="showDetails"
  @click="showDetails = !showDetails"
/>
```

## Props

| Prop              | Type                                                                                                                                                 | Default     | Description                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `variant`         | `'primary' \| 'tertiary' \| 'secondary' \| 'ghost' \| 'link' \| 'success' \| 'info' \| 'warning' \| 'danger' \| 'danger-tertiary' \| 'danger-ghost'` | -           | Rank, or what a press means. Omitted, the button renders the high-contrast base treatment: give every button a variant.              |
| `outlined`        | `boolean`                                                                                                                                            | `false`     | No fill, the border and text in the variant's ink. Prefer `tertiary` and `danger-tertiary`. Ignored by ghost and link                |
| `size`            | `'xxs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`                                                                                             | `'md'`      | 16, 24, 32, 40, 48, 64 and 80px. `xl` and `xxl` are minimum heights, and their label wraps                                           |
| `disabled`        | `boolean`                                                                                                                                            | `false`     | Disables the button. A link renders a plain `<a>` with no `href`                                                                     |
| `loading`         | `boolean`                                                                                                                                            | `false`     | Shows a spinner in the icon slot, at the same width, and prevents a second press                                                     |
| `icon`            | `string \| module`                                                                                                                                   | -           | Icon name or module, rendered by `NbIcon` at the end of the button. With no slot content, the button is icon-only                    |
| `iconWeight`      | `'regular' \| 'fill' \| ...`                                                                                                                         | `'regular'` | The icon's weight. `fill` only for a selected or active state. A literal links that one weight                                       |
| `label`           | `string`                                                                                                                                             | -           | Icon-only buttons: the accessible name and the tooltip. Required on every icon-only button. Ignored when the button has a text label |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'`                                                                                                             | `'bottom'`  | Where the icon-only tooltip opens                                                                                                    |
| `pressed`         | `boolean`                                                                                                                                            | -           | A toggle's state: sets `aria-pressed`, and a ghost draws a selected fill while `true`                                                |
| `type`            | `'button' \| 'submit' \| 'reset'`                                                                                                                    | `'button'`  | Native `<button>` type. Ignored when the button renders a link                                                                       |
| `href`            | `string`                                                                                                                                             | -           | Renders an `<a>` instead of a `<button>`                                                                                             |
| `target`          | `string`                                                                                                                                             | -           | Forwarded to `<a>` (e.g. `_blank`)                                                                                                   |
| `rel`             | `string`                                                                                                                                             | -           | Forwarded to `<a>` (e.g. `noopener`)                                                                                                 |
| `to`              | `string \| object`                                                                                                                                   | -           | A route. With vue-router installed, renders a `<RouterLink>`                                                                         |

### Link buttons

Use `href` for external links and `to` for internal Vue Router navigation.

- **`href`** renders a semantic `<a>`, keeping native link behaviour
  (right-click, middle-click, Cmd-click, `target="_blank"`).
- **`to`, with vue-router installed**, renders a `<RouterLink>`, whether `to`
  is a string or a location object, so client-side navigation and active-link
  tracking work.
- **`to`, without a router**: a string falls back to a plain `<a href>`, and
  an object (which needs a router to resolve) falls back to a `<button>` that
  emits `click`.
- **Disabled or loading**, a link renders a plain `<a>` with no `href` and
  `aria-disabled="true"`. A link cannot be disabled natively, and keeping the
  `href` (or the RouterLink's own handler) let Enter on a focused link still
  navigate.

```vue
<!-- External link: renders <a href="..." target="_blank" rel="noopener"> -->
<NbButton
  variant="tertiary"
  href="https://example.com/handbook"
  target="_blank"
  rel="noopener"
>
  Open the handbook
</NbButton>

<!-- Internal Vue Router link: renders <RouterLink to="..."> -->
<NbButton variant="link" to="/invoices">View invoices</NbButton>
```

## Events

| Event   | Payload      | Description                                                |
| ------- | ------------ | ---------------------------------------------------------- |
| `click` | `MouseEvent` | Fired on a press. Not fired while `disabled` or `loading`. |

## Which token each variant paints

Every variant reads a **semantic** token, never a ramp name. That is what lets
a white-label product retheme the library without the accent leaking through:

| Variant           | Token                                              | Means               |
| ----------------- | -------------------------------------------------- | ------------------- |
| `primary`         | `--nb-c-primary`                                   | The screen's action |
| `tertiary`        | `--nb-c-primary` (as ink)                          | A lower-rank action |
| `secondary`       | `--nb-c-secondary`                                 | The negative half   |
| `ghost`           | `--nb-c-contrast`, `--nb-c-surface-hover` on hover | A tool              |
| `link`            | `--nb-c-link`, primary as ink                      | A text link         |
| `success`         | `--nb-c-success`                                   | A positive outcome  |
| `info`            | `--nb-c-info`                                      | Informational       |
| `warning`         | `--nb-c-warning`                                   | Proceed with care   |
| `danger`          | `--nb-c-danger`                                    | Destroys something  |
| `danger-tertiary` | `--nb-c-danger` (as ink)                           | Destroys something  |
| `danger-ghost`    | `--nb-c-danger` (as ink), filled on hover          | Destroys something  |

Each also uses the matching `-hover`, `-active` and `-a11y` tokens, so a
retheme moves the whole state set together. Disabled reads
`--nb-c-component-disabled`, and focus reads `--nb-c-focus-ring`. Override the
semantic token, not the button.

## Loading placeholder

While the thing a button acts on is still loading, a disabled button usually
does the job: it keeps its label and its place. When the button itself is not
known yet, [`NbSkeleton variant="button"`](/components/skeleton/code#buttons)
holds its place at the right size.

```vue
<NbSkeleton variant="button" size="lg" />
<NbSkeleton variant="button" size="sm" icon-only />
```

<!--@include: ./_shared.md-->
