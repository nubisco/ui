---
layout: nubisco
title: Quickstart
---

# Quickstart

## Install

```bash
pnpm add @nubisco/ui
```

## Configure Vite

One plugin resolves both halves of the library at compile time: `<NbButton>`
becomes an import of that component, and `<NbIcon name="check" />` becomes an
import of that one icon. Nothing is registered globally, nothing is deferred to
runtime, and the bundle contains what your templates actually used.

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nubiscoUI } from '@nubisco/ui/vite'
import { fonts } from '@nubisco/ui/plugins/fonts'

export default defineConfig({
  plugins: [vue(), ...nubiscoUI(), fonts()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use '@nubisco/ui/variables';`,
      },
    },
  },
})
```

The `fonts` plugin loads the bundled typefaces (Plus Jakarta Sans + Fira Code);
the SCSS block makes the design tokens available across your stylesheets.

> **Note:** Import build plugins from `@nubisco/ui/vite` and
> `@nubisco/ui/plugins/*`. They contain Node.js-only code that cannot run in
> the browser.

## Install the app plugin

The app plugin carries the things that are genuinely global: directives, the
command palette, app-level configuration. It does not register components.

```ts
import { createApp } from 'vue'
import App from './App.vue'
import NubiscoUI from '@nubisco/ui'
import '@nubisco/ui/css'

createApp(App).use(NubiscoUI).mount('#app')
```

## Use components

```vue
<template>
  <NbGrid dir="col" gap="md">
    <NbPanel>
      <h2>Hello</h2>
      <p>Welcome to Nubisco UI.</p>
      <NbButton variant="primary" icon="arrow-right">Continue</NbButton>
    </NbPanel>
  </NbGrid>
</template>
```

No imports in that file: the plugin wrote them. It also emits a
`components.d.ts` so editors and `vue-tsc` still see the tags.

## Icons and flags

A literal name costs one icon. A name your code only knows at runtime needs one
of two declarations, depending on whether the set of values is bounded:

```ts
// Bounded: an API field that can only be one of these.
import { registerIcons } from '@nubisco/ui'
import * as check from '@nubisco/ui/icons/check'
import * as warning from '@nubisco/ui/icons/warning'

registerIcons({ check, warning })
```

```ts
// Open-ended: an icon picker, a CMS field. Import this in the one file that
// needs it, and no other page pays for it.
import '@nubisco/ui/icons/all'
```

`NbFlag` works the same way, with `registerFlags` and `@nubisco/ui/flags/all`.

[What ships in your bundle](/bundling) explains what reaches your build for each
way of naming a glyph, and how to ship the whole collection when you want it.

## Without a bundler plugin

Every component is a real entry point:

```ts
import { NbButton } from '@nubisco/ui/components/Button'
```

And if you cannot add a build step at all, one explicit import registers
everything, at the cost of linking the whole library:

```ts
import NubiscoUI from '@nubisco/ui/all'

app.use(NubiscoUI)
```

## Styling options

**Option 1: Pre-built CSS (recommended for most projects):**

```ts
import '@nubisco/ui/css'
```

**Option 2: SCSS source (for full customisation):**

```scss
@use '@nubisco/ui/styles' as *;
```

## Next steps

- [Showcase](/showcase): see all components in action
- [Theming](/theming): customise colors, spacing, and type for your brand
- [Grid](/ui/components/grid/overview): understand the layout system
- [Components](/ui/components/button/button): browse the full component library
