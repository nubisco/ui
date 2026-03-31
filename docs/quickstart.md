# Quickstart

## Install

```bash
pnpm add @nubisco/ui
```

## Register Components

```ts
import { createApp } from 'vue'
import App from './App.vue'
import NubiscoUI from '@nubisco/ui'
import '@nubisco/ui/dist/ui.css'

createApp(App).use(NubiscoUI).mount('#app')
```

## Vite Configuration

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

## Use Components

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

## Import Individual Components

```ts
import { NbButton, NbPanel, NbGrid } from '@nubisco/ui'
```

## Styling Options

Use the prebuilt stylesheet:

```ts
import '@nubisco/ui/dist/ui.css'
```

Or import SCSS source for deeper customization:

```scss
@use '@nubisco/ui/styles' as *;
```

## Next Steps

- Browse [Components](/ui/components/modal)
- Explore the [Grid docs](/ui/components/grid/overview)
- Review project usage examples in [README](https://github.com/nubisco/ui#readme)
