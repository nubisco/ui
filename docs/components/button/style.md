---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Sizes

<!--
  A row, and a large one.

  The preview defaults to a column, so its gap was vertical while the
  `<measure>` wrappers are `inline-flex` and flowed horizontally: the gap never
  applied on the axis the buttons actually sat on, and they ran together. The
  ruler overlay draws its dimension label OUTSIDE the measured element, so each
  label landed on the next button along.
-->
<preview dir="row" gap="xxl" wrap>
  <measure>
    <NbButton variant="primary" icon="plus" size="xxs">xxs</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xs">xs</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="sm">sm</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="md">md</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="lg">lg</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xl">xl</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xxl">xxl</NbButton>
  </measure>
</preview>

| Size  | Height | Label | Icon | Icon-only     | Context                                          |
| ----- | ------ | ----- | ---- | ------------- | ------------------------------------------------ |
| `xxs` | 16px   | 12px  | 16px | 16 x 16       | Inside a chip or a tag                           |
| `xs`  | 24px   | 14px  | 16px | 24 x 24       | Compact rows and in-canvas chrome                |
| `sm`  | 32px   | 14px  | 16px | 32 x 32       | Row actions, table toolbars, beside a `sm` field |
| `md`  | 40px   | 14px  | 16px | 40 x 40, 20px | The default. Forms, panel headers, beside `md`   |
| `lg`  | 48px   | 14px  | 16px | 48 x 48, 20px | The most common standalone action, beside `lg`   |
| `xl`  | 64px+  | 14px  | 16px | 64 x 64, 24px | Bleeds to the edge of a modal or side panel      |
| `xxl` | 80px+  | 14px  | 16px | 80 x 80, 32px | Full-screen surfaces: wizards and takeovers      |

The label is 14px at every size from `xs` up, so a bigger button is a bigger
target, not louder type. Icon-only buttons are square at every size, and their
icon grows with them on the icon scale (16, 20, 24, 32).

## Anatomy

<preview dir="row" gap="xxl">
  <measure>
    <NbButton variant="primary" icon="arrow-right" size="lg">Continue</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" size="lg">Continue</NbButton>
  </measure>
  <measure>
    <NbButton variant="ghost" icon="funnel" size="lg">Filter</NbButton>
  </measure>
</preview>

| Part                   | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| Start padding          | 16px                                                          |
| End, with or no icon   | 64px: 16px padding, the 16px icon, at least 32px of gap       |
| Label to icon          | 32px minimum. The label starts left, the icon is pinned right |
| Ghost and danger-ghost | 16px both sides, the icon 8px after the label                 |
| Radius                 | The control radius (`--nb-radius-control`)                    |

The two primary buttons above are the same width: the second has no icon, and
keeps the space for one. That is what lets the spinner replace the icon while
a button loads without the button changing size.

## Wrapping at xl and xxl

Up to `lg` a button is one line tall. At `xl` and `xxl` the height is a
minimum, the label sits at the top left, and a long label wraps onto a second
line rather than overflowing. The icon stays pinned to the top right, centred
on the first line. The width stops at 20rem, unless the button fills a set.

<preview dir="row" gap="lg">
  <NbButton variant="primary" size="xl" icon="arrow-right">Continue to payment details and review</NbButton>
  <NbButton variant="secondary" size="xxl" icon="arrow-right">Save this draft and come back to it later</NbButton>
</preview>

A label never truncates. At the one-line sizes, a label that does not fit is
too long, or the layout is too tight: fix one of those rather than adding an
ellipsis.

## States

Every state of one button, side by side. Point at the first two, and Tab to
them, to see hover and focus.

<preview>
  <div class="state-row">
    <span class="state-cell"><NbButton variant="primary" icon="plus">Add member</NbButton>Rest, hover</span>
    <span class="state-cell"><NbButton variant="tertiary" icon="plus">Add member</NbButton>Rest, hover</span>
    <span class="state-cell"><NbButton variant="primary" icon="plus" disabled>Add member</NbButton>Disabled</span>
    <span class="state-cell"><NbButton variant="primary" icon="plus" loading>Add member</NbButton>Loading</span>
    <span class="state-cell"><NbButton variant="ghost" icon="text-b" label="Bold" :pressed="true" />Pressed</span>
  </div>
</preview>

- **Hover** darkens a filled button one step (`-hover`), fills an outlined one
  with its own colour, and lays the neutral surface hover under a ghost.
- **Focus** is one ring for every control: 2px of `--nb-c-focus-ring` drawn
  inside the edge, with a 1px band of the surface inside that, so the ring
  stays legible on a filled button whose colour is close to it.
- **Disabled** takes the disabled tokens, not a fade: a filled button the
  disabled fill, an outlined one the disabled border, a ghost or link only the
  disabled text. It no longer reads as a paler primary.
- **Loading** keeps the button's colours and its width. The spinner takes the
  icon's slot, and a button without an icon already reserves that slot.
- **Pressed** (`pressed`) draws a selected fill on a ghost toggle while it is
  on.

## Variants

<preview>
  <div class="variant-grid">
    <div class="variant-cell">
      <h5>Primary</h5>
      <p>The one action a page or region exists for.</p>
      <NbButton variant="primary">Publish</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Tertiary</h5>
      <p>A standalone action of lower rank. Primary, outlined.</p>
      <NbButton variant="tertiary">Export</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Secondary</h5>
      <p>Only beside a primary, as its negative half.</p>
      <NbButton variant="secondary">Cancel</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Ghost</h5>
      <p>Tools in rows and toolbars, icon-only with a label.</p>
      <NbButton variant="ghost" icon="pencil-simple" label="Edit" />
    </div>
    <div class="variant-cell">
      <h5>Link</h5>
      <p>An action that reads as part of a sentence.</p>
      <NbButton variant="link">Read the guide</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Danger</h5>
      <p>A destructive action that is the region's one action.</p>
      <NbButton variant="danger">Delete project</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Danger tertiary</h5>
      <p>Destructive, beside a primary that is the point.</p>
      <NbButton variant="danger-tertiary">Delete project</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Danger ghost</h5>
      <p>Destructive, in a dense place. Fills red on hover.</p>
      <NbButton variant="danger-ghost">Delete project</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Success</h5>
      <p>A press that completes something. Not Save.</p>
      <NbButton variant="success">Mark as paid</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Info</h5>
      <p>A neutral, informational action.</p>
      <NbButton variant="info">View details</NbButton>
    </div>
    <div class="variant-cell">
      <h5>Warning</h5>
      <p>An action with a reversible consequence.</p>
      <NbButton variant="warning">Pause syncing</NbButton>
    </div>
  </div>
</preview>

The first five are the [emphasis ladder](/components/button/usage#the-emphasis-ladder),
the three danger styles are ranked the same way, and the last three say what a
press means rather than how loud it is.

## Link

`variant="link"` is a button that reads as a text link: no fill, no box, an
underline on hover and on keyboard focus. Use it for an action that sits inside
text or a table cell, where a boxed button would be louder than the line around
it: the key in a row that opens its record, "Select" beside a field, the way
back out of a detail view.

It takes the font size, weight and line height of where it sits, so it lines up
with the text beside it, and `size` does not change it. It is still a real
`<button>`, `<a>` or `<RouterLink>` (from `click`, `href` or `to`, as every other
variant), so Enter and Space work, `disabled` works, and it shows the focus
ring.

<preview dir="col">
  <p style="margin: 0">
    The key <NbButton variant="link">home.hero.title</NbButton> is missing in
    two locales. <NbButton variant="link" href="#link">Read about locales</NbButton>
    or <NbButton variant="link" disabled>retry the import</NbButton>.
  </p>
</preview>

```vue
<NbButton variant="link" @click="open(key)">{{ key }}</NbButton>
<NbButton variant="link" to="/settings/locales">Read about locales</NbButton>
<NbButton variant="link" disabled>Retry the import</NbButton>
```

The colour is the primary drawn as
[ink](/theming#ink-a-semantic-colour-drawn-on-a-surface), the same colour an
outlined primary button uses, which clears WCAG AA on every layer in light and
dark. Hover and focus add an underline and never a wash, so the colour it is
read on does not change.

To take the colour of the surrounding text instead (a list where every row is a
link, where a column of primary text would be noise), set
`--nb-button-link-color: currentColor` on the button or an ancestor. Use
`currentColor`, not `inherit`: on a custom property, `inherit` inherits the
property, not the colour.

## Outlined

`tertiary` and `danger-tertiary` are the two outlined buttons with a name, and
the ones to reach for. `outlined` is the same treatment as a modifier, for the
status variants: it removes the fill and draws the border and text instead.
Ghost and link ignore it, since they have no fill to remove.

The text, border and focus ring of an outlined button are drawn straight onto
the surface behind it, so they use the variant's
[ink](/theming#ink-a-semantic-colour-drawn-on-a-surface) rather than its fill
colour. It is moved away from the surface (darker in light mode, lighter in
dark) until it clears WCAG AA on every layer. Under the pointer an outlined
button fills with its own colour, the way Carbon's tertiary does.

<preview dir="row" wrap>
  <NbButton variant="tertiary">Export</NbButton>
  <NbButton variant="danger-tertiary">Delete</NbButton>
  <NbButton variant="success" outlined>Mark as paid</NbButton>
  <NbButton variant="warning" outlined>Pause syncing</NbButton>
  <NbButton variant="info" outlined>View details</NbButton>
</preview>

```vue
<NbButton variant="tertiary">Export</NbButton>
<NbButton variant="danger-tertiary">Delete</NbButton>
<NbButton variant="success" outlined>Mark as paid</NbButton>
```

## Styling

Every variant reads a semantic token, so a retheme moves the button with the
rest of the product. Override the token, not the button. The full table is on
the [Code tab](/components/button/code#which-token-each-variant-paints).

```css
.nb-button--primary {
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);
}
```

<!--@include: ./_shared.md-->
