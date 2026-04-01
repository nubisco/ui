---
layout: nubisco
title: Quickstart
---

# Quickstart

## Install

```bash
pnpm add @nubisco/ui
```

## Register components

```ts
import { createApp } from 'vue'
import App from './App.vue'
import NubiscoUI from '@nubisco/ui'
import '@nubisco/ui/dist/ui.css'

createApp(App).use(NubiscoUI).mount('#app')
```

## Configure Vite

Add the `fonts` plugin to load the bundled typefaces (Plus Jakarta Sans + Fira Code), and configure SCSS so design tokens are available across all your stylesheets:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fonts } from '@nubisco/ui/plugins/fonts'

export default defineConfig({
  plugins: [vue(), fonts()],
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

## Add icon support

If your project uses `NbIcon`, add the icons plugin. It resolves icons from the `@phosphor-icons/core` package at build time. Only icons you reference end up in the bundle.

```ts
import { fonts } from '@nubisco/ui/plugins/fonts'
import { icons } from '@nubisco/ui/plugins/icons'

export default defineConfig({
  plugins: [vue(), fonts(), icons(process.cwd())],
})
```

> **Note:** Import plugins from `@nubisco/ui/plugins/*`. They contain Node.js-only code that cannot run in the browser.

## Use components

```vue
<template>
  <NbGrid dir="col" gap="md">
    <NbPanel>
      <h2>Hello</h2>
      <p>Welcome to Nubisco UI.</p>
      <NbButton variant="primary">Continue</NbButton>
    </NbPanel>
  </NbGrid>
</template>
```

## Import individual components

```ts
import { NbButton, NbPanel, NbGrid } from '@nubisco/ui'
```

## Styling options

**Option 1: Pre-built CSS (recommended for most projects):**

```ts
import '@nubisco/ui/dist/ui.css'
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
