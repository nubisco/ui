---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: style
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

## Button Sizes

<!--
  A row, and a large one.

  The preview defaults to a column, so its gap was vertical while the
  `<measure>` wrappers are `inline-flex` and flowed horizontally: the gap never
  applied on the axis the buttons actually sat on, and they ran together. The
  ruler overlay draws its dimension label OUTSIDE the measured element, so each
  label landed on the next button along.
-->
<preview dir="row" gap="xxl">
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

## Button Variants

The button component supports distinct color `variant`, each designed for specific use cases:

<preview>
  <div class="demo-container">
    <div class="flavors-grid">
      <div class="flavor-item flavor-bg-primary">
        <h5>Primary</h5>
        <p>Main actions and primary CTAs</p>
        <NbButton variant="primary">Primary Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-secondary">
        <h5>Secondary</h5>
        <p>Secondary actions and neutral options</p>
        <NbButton variant="secondary">Secondary Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-secondary">
        <h5>Ghost</h5>
        <p>No outline at all, to save space</p>
        <NbButton variant="ghost">Ghost Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-success">
        <h5>Success</h5>
        <p>Positive actions and confirmations</p>
        <NbButton variant="success">Save Changes</NbButton>
      </div>
      <div class="flavor-item flavor-bg-info">
        <h5>Info</h5>
        <p>Informational actions and details</p>
        <NbButton variant="info">Learn More</NbButton>
      </div>
      <div class="flavor-item flavor-bg-warning">
        <h5>Warning</h5>
        <p>Cautionary actions and warnings</p>
        <NbButton variant="warning">Proceed with Caution</NbButton>
      </div>
      <div class="flavor-item flavor-bg-danger">
        <h5>Danger</h5>
        <p>Destructive actions and deletions</p>
        <NbButton variant="danger">Delete Item</NbButton>
      </div>
    </div>
  </div>
</preview>

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

## Outlined Variants

Add `:outlined="true"` (or just `outlined`) to any variant to remove the background and show a colored border and text instead. Ghost is excluded since it already has no background.

The text, border and focus ring of an outlined button are drawn straight onto the surface behind it, so they use the variant's [ink](/theming#ink-a-semantic-colour-drawn-on-a-surface) rather than its fill colour. It is moved away from the surface (darker in light mode, lighter in dark) until it clears WCAG AA on every layer, including under the hover and pressed tint. That is what keeps an outlined secondary (a selected item in a side menu, say) readable on a dark page, and an outlined warning readable on a light one. Variants that already clear it, such as the light primary and secondary, are unchanged.

<preview>
  <div class="demo-container">
    <div class="flavors-grid">
      <div class="flavor-item">
        <NbButton variant="primary" outlined>Primary</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="secondary" outlined>Secondary</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="success" outlined>Save</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="warning" outlined>Proceed</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="danger" outlined>Delete</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="info" outlined>Learn More</NbButton>
      </div>
    </div>
  </div>
</preview>

```vue
<NbButton variant="danger" outlined>Delete</NbButton>
<NbButton variant="success" outlined>Save</NbButton>
<NbButton variant="primary" outlined>Cancel</NbButton>
```

## Styling

The button uses CSS custom properties from the design system:

```css
.nb-button {
  background: var(--nb-c-contrast);
  color: var(--nb-c-surface);
}
```

<!--@include: ./_shared.md-->
