# Theme builder

Author a colour theme, see it on real components, and export SCSS you can drop
into an application. Everything happens in your browser: nothing is uploaded,
and there is no account.

<theme-builder />

## What a theme is

A theme is a **palette plus a mapping**, which is how the built-in theme is put
together too.

You name a handful of base colours. Each one is expanded into the same
seventeen-step ramp the library builds for its own colours (`100` through `900`
in steps of 50), and every step gets a readable foreground alongside it: for
`--nb-c-accent-500` there is `--nb-c-accent-500-a11y`, black or white,
whichever is legible on it.

Then each semantic role points at a step. `--nb-c-primary` is not a colour, it
is a reference to `--nb-c-accent-500`, and `--nb-c-primary-a11y` follows it to
`--nb-c-accent-500-a11y`. Move primary to a darker step and its text colour
moves with it, which is why text on a themed button stays readable without
anyone working it out by hand.

Light and dark are **the same palette read at different depths**. A dark theme
is not a second set of colours: `primary` points at `accent-500` in light and
`accent-350` in dark. Change one base colour and both halves follow.

A role can also hold a literal colour, for the values that are not a step of
anything. Pure white is the usual one.

A theme carries **colour only**. It defines both halves, and
the existing dark-mode class chooses between them. It says nothing about corner
geometry, which is a separate setting ([Appearance](/theming#appearance)), so
the two never interfere: switching theme cannot square your corners, and
switching to rounded cannot repaint your accent.

Three independent settings, each with its own attribute:

| Setting      | Written to           | Selected with     |
| ------------ | -------------------- | ----------------- |
| Colour mode  | `class="dark"`       | `useTheme()`      |
| Appearance   | `data-nb-appearance` | `useAppearance()` |
| Colour theme | `data-nb-theme`      | `useNamedTheme()` |

## Using an exported theme

Export the file, drop it in your project, and import it after the library:

```ts
// main.ts
import '@nubisco/ui/styles'
import './themes/ocean.scss'

import { configureNamedTheme } from '@nubisco/ui'

configureNamedTheme({ themes: ['ocean'], defaultTheme: 'ocean' })
```

That is the whole integration. The palette lives in the SCSS; the runtime only
applies an identifier, so you never restate colours in JavaScript.

To switch at runtime:

```vue
<script setup lang="ts">
import { useNamedTheme } from '@nubisco/ui'

const { namedTheme, setNamedTheme } = useNamedTheme()
</script>

<template>
  <button @click="setNamedTheme('ocean')">Ocean</button>
  <button @click="setNamedTheme(null)">Default</button>
</template>
```

`null` returns to the library's built-in theme.

### Several themes at once

Import as many as you like; they do not collide, because each scopes its tokens
to its own identifier:

```ts
import './themes/ocean.scss'
import './themes/forest.scss'

configureNamedTheme({ themes: ['ocean', 'forest'] })
```

Pass `themes` so a stale identifier left in storage by an earlier version of
your app falls back to the default instead of being written to the document.

Human-readable names for a theme picker are your application's business and
stay out of the styling contract. Keep a list keyed by id:

```ts
const THEMES = [
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
]
```

## What the export contains

A single `@include` against the library's public SCSS entry point:

```scss
@use '@nubisco/ui/styles/theme-api' as nb;

@include nb.theme(
  'ocean',
  $palette: (
    accent: #0f6f8c,
    neutral: #5b7683,
    success: #4acf7b,
    info: #214da6,
    warning: #f59e0b,
    danger: #dc2626
  ),
  $light: ('primary': 'accent-500', 'layer-0': #ffffff, ...),
  $dark: ('primary': 'accent-350', 'layer-0': 'neutral-900', ...)
);
```

`$palette` is expanded into ramps, one per colour, each with its `-a11y`
counterparts. A role value is either a **quoted ramp reference**
(`'accent-500'`) or a literal colour, and the mixin tells them apart by
checking the prefix against the palette you declared.

Every key is optional. Anything you do not set falls through to the default
theme, so a theme that changes one accent is a palette and one role. Keys are
the semantic token names without the `--nb-c-` prefix.

Roles the library pairs with a foreground (`primary`, `secondary`, the four
statuses and their hover and active steps) get their `-a11y` value emitted
automatically when they point at a ramp step. Nothing to maintain by hand, and
nothing to forget.

The file imports nothing private, needs no repair, and is deterministic: keys
are sorted, so re-exporting an unchanged theme gives you a byte-identical file
and a diff shows only what moved.

## Layers keep working

The four surface layers are the reason nested panels stay legible. A theme
supplies the twelve layer values (`layer-0..3`, `layer-border-*`,
`layer-hover-*`) and the `.nb-layer-N` classes that re-point `--nb-c-surface`
at them are shared by every theme, so you get the whole surface system without
restating it. See [Layers](/theming#layers).

## About the contrast readout

The builder measures the pairs it lists, using the WCAG 2 relative-luminance
formula, and shows the ratio and the threshold for each.

::: warning It is a check, not a certification
Passing these pairs does not make a theme accessible. It checks those pairs and
nothing else: not every surface combination, not focus order, not text over
images, not the colours your own application adds. Treat a pass as "this pair
is not the problem", never as a conformance result.
:::

Failing pairs do not block the export. The file is yours, and silently altering
a colour you chose would make the export disagree with the preview you
approved.
