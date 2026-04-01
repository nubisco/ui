---
layout: nubisco
title: Why NubiscoUI
---

Most Vue component libraries make the same trade-off: they optimise for fast setup at the cost of long-term maintainability. You get a working UI in an afternoon, and a custom theming headache by the end of the quarter.

NubiscoUI makes a different bet. It is built to scale in teams, in codebases, and across products.

---

## The problem with most libraries

The typical component library ships with a handful of CSS variables for colors, a set of pre-built components, and a theming guide that amounts to "override these tokens in your root." This works until:

- You need a color that isn't in the palette and there's no principled way to add one.
- Two teams use the same library and ship interfaces that feel visually inconsistent.
- A designer changes the brand primary color and you discover it's hardcoded in six places.
- You try to customise spacing and find the component uses arbitrary magic numbers.

NubiscoUI exists because these problems are predictable, and they have principled solutions.

---

## The SCSS engine

The core of NubiscoUI is not a set of components. It's a typed SCSS variable system that generates the entire token surface.

Every color is defined once in `$colors` as a named hex value. `_theme.scss` expands each color into 17 tints (100–900) plus accessible a11y contrast variants, and emits all of them as CSS custom properties on `:root`. Add one entry to `$colors`, get a full shade ramp for free.

```scss
// _colors.scss: add your brand color here
$colors: (
  grape-hyacinth: #5c35c4,
  // ← generates --nb-c-grape-hyacinth-100 through -900
  your-brand: #1a56db, // ← add this, get --nb-c-your-brand-100 through -900
);
```

The semantic layer then maps from palette to intent:

```css
/* Override the primary color: zero SCSS required as a consumer */
:root {
  --nb-c-primary: var(--nb-c-your-brand-500);
  --nb-c-primary-hover: var(--nb-c-your-brand-600);
}
```

This is the right architecture: palette stays stable, semantic tokens carry meaning, components reference semantic tokens only. Changing the brand color is a two-line edit.

---

## Geometry-first layout

NubiscoUI uses an 8px base unit (`--nb-base-unit`). Every spacing value, gaps, field heights, padding, is a multiple of that unit. This isn't a coincidence; it's enforced by the SCSS system.

`NbGrid` is the primary layout primitive. It is not a grid library bolted on to a component kit. It is the foundation every component is built on top of.

```vue
<NbGrid dir="col" gap="md">
  <NbGrid dir="row" gap="sm" align="center">
    <NbLabel>Status</NbLabel>
    <NbBadge variant="success">Active</NbBadge>
  </NbGrid>
  <NbTextInput label="Name" placeholder="Ada Lovelace" />
  <NbGrid dir="row" gap="sm" justify="end">
    <NbButton variant="ghost">Cancel</NbButton>
    <NbButton variant="primary">Save</NbButton>
  </NbGrid>
</NbGrid>
```

Five breakpoints, 16 columns, seven named gap sizes, full flex alignment control. If you are composing a layout, `NbGrid` is the right tool, not a custom `div` with inline styles.

---

## TypeScript discipline

NubiscoUI enforces a naming convention across every type contract in the library:

| Prefix | Meaning                                               | Example                              |
| ------ | ----------------------------------------------------- | ------------------------------------ |
| `I`    | Interface: describes the shape of an object           | `ITextInputProps`, `IFieldComponent` |
| `E`    | Enum: a fixed set of named values                     | `ESize`, `EVariant`                  |
| `T`    | Type alias: a union, intersection, or primitive alias | `TActiveHandle`                      |

Shared types live in `src/types/` and are composed via interface extension. Adding a new input component means extending `IFieldComponent`. You get `label`, `disabled`, `required`, `variant`, `size`, and message slots for free, with correct intellisense descriptions everywhere.

This scales to teams. When a prop description changes in `IWithMessages`, it propagates to every component that extends `IFieldComponent`. There is no copy-paste maintenance.

---

## Built for real products

NubiscoUI is not a side project. It is the component system underlying active and future Nubisco products. Used in production, maintained with the same rigour as the applications that depend on it.

That means:

- Components are designed for **data-dense product interfaces**, not marketing pages
- The default `body-md` type set is 14px. The right density for dashboards, not for blogs
- `NbModal` uses Vue's `Teleport` and a proper focus trap, not a positioned `div`
- Every interactive component handles keyboard navigation, ARIA attributes, and disabled states

When you adopt NubiscoUI, you are adopting the same foundation that ships to real users.

---

## Next

- [Quickstart](/quickstart): install and configure in under 5 minutes
- [Theming](/theming): customize the token system for your brand
- [Showcase](/showcase): see the full component set in action
