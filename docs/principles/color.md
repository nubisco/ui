# Color

## Original Colors

Designers and developers can use the tool below to generate unique and descriptive names for any new colors added to the UI library.

::: tip Original color
The original color is represented as a circle
:::

<color-steps-generator />

## Adding colors to the `_colors.scss` file

To add a color, insert the generated name and hex value into the `$colors` object in the `_colors.scss` file.

```scss{3}
$colors: (
  grape-hyacinth: #5c35c4,
  sea-of-tears: #214DA6,
  plain-white: #ffffff,
  plain-black: #000000,
  french-gray: #a7a7a7,
  liberty-blue: #4d4f8c,
  powder-blue: #b5b8e7,
);
```

## Theme Integration

Thanks to the logic in `_theme.scss`, every color added to `$colors` automatically generates a full range of shades and accessible (`a11y`) variants.

- Standard shades are available as
  `var(--nb-c-sea-of-tears-100)` → `var(--nb-c-sea-of-tears-900)`

- Accessible shades are available as
  `var(--nb-c-sea-of-tears-100-a11y)` → `var(--nb-c-sea-of-tears-900-a11y)`

This ensures consistent theming and accessibility across the UI.
