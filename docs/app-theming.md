---
layout: nubisco
title: App theming
---

# App theming

Nubisco groups its products by audience: **creatives**, **engineers**, **home**
and **fun**. Colour follows that grouping. An app declares which category it
belongs to, and the library resolves that to an accent, in light and dark, with
every derived token wired up behind it.

One call, at the app shell, and nothing else sets an accent anywhere.

```scss
// your-app/src/styles/theme.scss
@use '@nubisco/ui/styles/theme-api' as nb;

@include nb.app-theme('your-app', $category: 'engineers');
```

```ts
// your-app/src/main.ts
import '@nubisco/ui/styles' // the library, once
import './styles/theme.scss' // your accent

configureNamedTheme({ defaultTheme: 'your-app' })
```

<category-preview />

## The categories

| Category    | Light     | Dark      | For                                 |
| ----------- | --------- | --------- | ----------------------------------- |
| `creatives` | `#846201` | `#e8c15a` | Tools people make things with       |
| `engineers` | `#5b48c9` | `#a99dff` | Tools people build and operate with |
| `home`      | `#086f9e` | `#5ec1e8` | Things that run in someone's house  |
| `fun`       | `#b83266` | `#f686ae` | Games and toys                      |

Every value clears WCAG AA (4.5:1) against **all four** surface layers of its
mode. That is a stricter bar than it sounds, and it is the reason two of these
values are not the ones originally drafted. Measured against pure white, the
first gold read 4.92 and looked signed off, but the library never renders a
pure-white surface: on the real page background it read 4.23, and on `layer-2`
it read 4.01. A colour verified against a surface the product cannot show has
not been verified.

`tests/categoryContrast.test.ts` compiles the real stylesheet, resolves the real
custom properties and measures them, so an edit that drops a value below the bar
fails in the pre-commit hook, the pre-push hook and CI.

## Apps with an identity of their own

Most apps take their category's accent. A product whose colour predates this
system keeps it, and still declares its category, because the category is what
groups products by audience on marketing surfaces even when the app's own colour
differs.

```scss
@include nb.app-theme(
  'your-app',
  $category: 'creatives',
  $accent: (#0b7285, #41d6e0)
);
```

The override is an exception, not an option. If you are reaching for it because
your category's accent looks wrong on a particular screen, that is a bug in the
screen, not a reason to fork the colour.

An accent you supply is held to the same bar, and the library cannot test a
value it never sees, so assert it in your own repo:

```scss
// fails the build if the pair does not clear AA on every surface
@debug nb.assert-accent-contrast((#0b7285, #41d6e0));
```

## Why the library holds no product list

There is no `app-theme('acta')` that looks up Acta in a table. The library holds
the four category values and nothing else, and the app names its own category.

That is deliberate. A registry of product ids inside the design system would
mean cutting a library release every time a product is added or renamed, and it
would invert the dependency: the design system would have to know about the
things that consume it. Products know about the library. The library does not
know about products.

The product-to-category map is a portfolio fact and lives in the workspace
standards, not in this package.

## What the one call emits

The accent becomes a full ramp named `accent`, anchored at both ends, and the
primary roles point at steps of it:

| Token                   | Light                      | Dark                      |
| ----------------------- | -------------------------- | ------------------------- |
| `--nb-c-primary`        | the light anchor           | the dark anchor           |
| `--nb-c-primary-hover`  | one step darker            | one step lighter          |
| `--nb-c-primary-active` | two steps darker           | two steps lighter         |
| `--nb-c-category`       | the category's light value | the category's dark value |

Each carries its paired `-a11y` foreground, so text on a themed button stays
readable without you working it out.

Hover and active are always further from the surface than the base, which is why
the base is the worst case for contrast and why testing it is enough.

`--nb-c-category` travels separately from the accent. For most apps the two are
the same value. For an app that overrode its accent they are not, and a surface
that groups products by audience wants the category.

### The derived tokens, and a trap worth knowing

These follow the accent too:

- `--nb-c-primary-subtle`
- `--nb-c-focus-ring`
- `--nb-shell-sidebar-bg`
- `--nb-shell-sidebar-link-active-bg`
- `--nb-shell-sidebar-link-active-color`
- `--nb-shell-inspector-resize-color`

They are re-emitted inside the theme's own scope, and they have to be. A custom
property is substituted at computed-value time **on the element that declares
it**, so `--nb-c-focus-ring: var(--nb-c-primary)` written at `:root` freezes to
`:root`'s primary. Every descendant inherits that frozen literal, and
re-pointing `--nb-c-primary` further down the tree never reaches it. Measured in
Chrome:

```text
                        :root      inside [data-nb-theme]
--nb-c-primary          #5c35c4    #5b48c9   follows
--nb-c-focus-ring       #5c35c4    #5c35c4   does not
--nb-c-primary-subtle   #5c35c4…   #5c35c4…  does not
```

If you derive your own token from the accent, declare it in the same scope that
sets the accent, not at `:root`.

## Migrating from the shared purple

The old shared accent, `grape-hyacinth` `#5c35c4`, still works and is unchanged.
Nothing breaks by not adopting this.

When you do adopt it, expect the shell to re-tint: the sidebar is a near-black
mix of the accent by design, so it follows your category. That is the intended
outcome, not a regression, but it is a visible change and worth a look before
you ship.

Delete any local accent override at the same time. If your app hardcodes
`#5c35c4` anywhere outside a changelog, that is the thing this call replaces.
