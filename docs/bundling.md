---
layout: nubisco
title: What ships in your bundle
---

# What ships in your bundle

Nubisco UI is deliberately larger than any one app needs. It carries 86
components, about 1,500 Phosphor icons in six weights, 255 country flags and
214KB of component CSS. Installing it does not mean shipping it.

Everything is resolved at **build time**, by `@nubisco/ui/vite`. It reads your
templates and writes the imports you would otherwise have written by hand, so
the bundler links what your pages actually render and drops the rest.

The consequence worth knowing before you ship: **the artwork in your bundle is
the artwork the plugin could see.** An icon whose name your code only decides at
runtime is not in there, and will not appear, unless you say so. This page is
about how to tell, and what to do about it.

## The short version

| What you write                                       | What ends up in the bundle    |
| ---------------------------------------------------- | ----------------------------- |
| `<NbButton>`                                         | `NbButton` and its stylesheet |
| `<NbIcon name="check" />`                            | one icon, one weight          |
| `<NbIcon name="check" weight="bold" />`              | one icon, the bold weight     |
| `<NbIcon :weight="w" name="check" />`                | one icon, all six weights     |
| `<NbFlag name="pt" />`                               | one flag                      |
| `<NbButton icon="plus">`                             | one icon, all six weights     |
| `<NbIcon :name="open ? 'caret-up' : 'caret-down'"/>` | two icons                     |
| `<NbButton :icon="copied ? 'check' : 'copy'">`       | two icons                     |
| `<NbIcon :icon="AnIconYouImported" />`               | that module, nothing extra    |
| `<NbIcon :name="whateverTheApiSaid" />`              | **nothing** (see below)       |

## When the name is only known at runtime

A value from an API, a CMS field, a user's choice in a picker. The plugin cannot
see through it, and neither can the bundler, so no icon is linked for it.

An expression counts as resolved only when **every** value it can produce is
artwork the build already links. `open ? 'caret-up' : 'caret-down'` qualifies.
`block.icon || 'cube'` does not, even though it contains a literal: it can just
as easily produce `block.icon`, which is a runtime value. This
is not a corner case: it is the normal shape of a status column, a category
list, or a country selector.

Nubisco UI does not fail quietly here. If a runtime name reaches `NbIcon` or
`NbFlag` with nothing to resolve it against, it **throws on first render**, with
a message naming the ways out. A build that prerenders or server-renders fails
outright rather than shipping a page with a hole in it.

There are two ways out, and which one is right depends on a single question:
**is the set of values bounded?**

### Bounded: register what it can be

If the value comes from an API but you know the field is one of five statuses,
register those five. The app links five icons.

```ts
// main.ts
import { registerIcons, registerFlags } from '@nubisco/ui'
import * as check from '@nubisco/ui/icons/check-circle'
import * as warning from '@nubisco/ui/icons/warning'
import * as error from '@nubisco/ui/icons/x-circle'
import * as pt from '@nubisco/ui/flags/pt'
import * as es from '@nubisco/ui/flags/es'

registerIcons({
  // The key is the name your data uses. It does not have to match the icon.
  ok: check,
  pending: warning,
  failed: error,
})

registerFlags({ pt, es })
```

A registered name wins over everything else, which is also how you add artwork
of your own or replace one of ours:

```ts
import BrandGlyph from './icons/BrandGlyph.vue'

registerIcons({ 'brand-glyph': BrandGlyph, house: BrandGlyph })
```

### Unbounded: load the whole catalogue

An icon picker has to render whatever the user picks. A country selector has to
render every country. A CMS field can hold any name an editor typed. For those,
import the catalogue **in the file that needs it**:

```vue
<script setup lang="ts">
// This block, and only this block, carries the full icon set.
import '@nubisco/ui/icons/all'
</script>
```

The catalogue is a map of name to lazy loader, so the glyphs themselves are
fetched on demand; the file that imports it carries the index, and no other
page in your app pays for it.

::: tip
Put the import in the component that needs it, not in `main.ts`. In `main.ts` it
is in your entry chunk, which every page downloads.
:::

## Shipping the whole collection on purpose

Sometimes you want all of it, and that is a legitimate choice: an internal admin
tool where payload does not matter, a design-system playground, a page that is
genuinely an icon browser. Say so explicitly.

**Every icon and flag, everywhere in the app:**

```ts
// main.ts
import '@nubisco/ui/icons/all'
import '@nubisco/ui/flags/all'
```

Both catalogues are then reachable from any component, and any name resolves at
runtime with no registration and no plugin involvement. Cost: about 60KB of
index in your entry chunk per catalogue, plus one lazily-fetched chunk per glyph
actually rendered.

**Every component too:**

```ts
import NubiscoUI from '@nubisco/ui/all'
import '@nubisco/ui/css'

app.use(NubiscoUI)
```

This registers all 86 components globally and loads the whole stylesheet. It is
the escape hatch for a page with no build step, a CDN embed, a toolchain you do
not control, or a template compiled from a string at runtime. It links the
entire library, which is the cost the compile-time resolution exists to avoid,
so it lives behind its own import: choosing it should be a decision someone
wrote down, not a default nobody noticed.

## Seeing what was linked

The plugin can tell you exactly what it resolved, and it always logs when it
pulls a whole catalogue in:

```ts
import { nubiscoUI } from '@nubisco/ui/vite'

export default defineConfig({
  plugins: [vue(), ...nubiscoUI({ glyphs: { verbose: true } })],
})
```

```
[nubisco-ui] src/layouts/SiteFooter.vue: linked icon "github-logo" (regular)
[nubisco-ui] src/cms/blocks/SiteNavBlock.vue binds <NbIcon> to a runtime value,
  so the full icon catalogue is linked into this file. If the set of possible
  values is known, registerIcons() avoids it.
```

The plugin also warns, once per file, when a glyph forwarded through another
component is a value it cannot see through:

```
[nubisco-ui] src/cms/blocks/SiteNavBlock.vue: no artwork linked for
  <NbButton :icon="actionIcon">. The value is only known at runtime, so it will
  throw on first render unless something resolves it.
```

Forwarded bindings are the one case where the plugin cannot tell a name from a
module, so it reports rather than pulling a catalogue in on a guess. If those
bindings are pass-through props in your own wrapper components, resolved
wherever they are passed in, turn the warning off:

```ts
nubiscoUI({ glyphs: { warnUnresolved: false } })
```

That second line is the one to read carefully. It is not an error, but it is the
difference between a page carrying one glyph and a page carrying an index of
1,500. If it appears somewhere you did not expect, the value it is complaining
about is usually bounded, and `registerIcons` is a two-line fix.

To turn the automatic catalogue loading off entirely and be told about every
such binding at runtime instead:

```ts
nubiscoUI({ glyphs: { catalog: 'off' } })
```

## Stylesheets

The same idea applies to CSS. The library ships one stylesheet per component
rather than one 214KB file, and the plugin imports the ones each page needs
alongside the components it resolved. A page with a button and an icon loads
19KB of CSS instead of 214KB.

Design tokens are separate and always needed. They come from the SCSS entry, not
from the component stylesheets:

```scss
@use '@nubisco/ui/variables';
```

If you would rather have the single stylesheet, for instance because your app
overrides library styles and depends on its own CSS loading after ours, turn the
per-component imports off and import the whole sheet yourself:

```ts
// vite.config.ts
nubiscoUI({ styles: false })
```

```ts
// main.ts
import '@nubisco/ui/css'
```

See [Upgrading](/upgrading) for what changes about the cascade when styles are
split, and how to tell whether it affects you.

## Without a bundler plugin

Nothing here requires the plugin. Every component and every glyph is an entry
point you can import directly, which is also what the plugin does on your
behalf:

```vue
<script setup lang="ts">
import { NbButton } from '@nubisco/ui/components/Button'
import GithubLogo from '@nubisco/ui/icons/github-logo'
import Portugal from '@nubisco/ui/flags/pt'
</script>

<template>
  <NbButton :icon="GithubLogo">Source</NbButton>
  <NbFlag :flag="Portugal" />
</template>
```

Import `@nubisco/ui/css` once in your entry when you do this: without the
plugin, nothing is importing the per-component stylesheets for you.
