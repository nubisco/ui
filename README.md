<div align="center">

  <br />

  <img src="docs/public/media/logo.svg" alt="Nubisco" width="96" />

<br /><br />

# Nubisco UI

**Vue 3 component library: clean, accessible, and themeable.**

  <br />

[![CI](https://github.com/nubisco/ui/actions/workflows/ci.yml/badge.svg)](https://github.com/nubisco/ui/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/nubisco/ui)](https://github.com/nubisco/ui/releases)
[![npm version](https://img.shields.io/npm/v/@nubisco/ui)](https://www.npmjs.com/package/@nubisco/ui)
[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/nubisco/ui/badges/coverage.json)](https://github.com/nubisco/ui/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-339933)](https://www.npmjs.com/package/@nubisco/ui)
[![Vue](https://img.shields.io/badge/vue-%5E3.5.0-42b883)](https://vuejs.org)
[![license](https://img.shields.io/npm/l/@nubisco/ui)](LICENSE)
[![Docs](https://img.shields.io/website?url=https%3A%2F%2Fnubisco.github.io%2Fui%2F&label=docs)](https://nubisco.github.io/ui/)
[![CLA](https://img.shields.io/badge/CLA-required-0A7F5A)](docs/CLA-INDIVIDUAL.md)

</div>

---

## Table of Contents

- [Nubisco UI](#nubisco-ui)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
    - [Local Development Linking](#local-development-linking)
    - [Basic Usage](#basic-usage)
    - [Vite Configuration](#vite-configuration)
    - [Importing Styles](#importing-styles)
    - [Icon Support](#icon-support)
  - [Why Nubisco UI?](#why-nubisco-ui)
  - [Features](#features)
  - [Components](#components)
    - [Layout](#layout)
    - [Form Controls](#form-controls)
    - [Data Display](#data-display)
  - [Grid System](#grid-system)
  - [TypeScript Support](#typescript-support)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [Security](#security)
  - [Support this project](#support-this-project)
  - [Acknowledgements](#acknowledgements)
  - [License](#license)

---

## Quick Start

```bash
npm install @nubisco/ui
# or
pnpm add @nubisco/ui
# or
yarn add @nubisco/ui
```

### Local Development Linking

To use an unreleased build locally, link it using pnpm's `link:` protocol:

```bash
# 1. Build the library
cd path/to/nubisco/ui && pnpm build

# 2. Reference it in your consumer's package.json
# "@nubisco/ui": "link:../path/to/nubisco/ui"

# 3. Install
pnpm install
```

> After changing components in the library, run `pnpm build` again to pick up the changes.

**Icon support:** If your consumer project uses `NbIcon` directly (not via a pre-built dist import), add the icons Vite plugin to your config. If you're importing from the pre-built dist, this is not needed because icons are bundled.

### Basic Usage

```vue
<script setup>
import { NbGrid, NbPanel, NbButton } from '@nubisco/ui'
import '@nubisco/ui/dist/ui.css'
</script>

<template>
  <NbGrid dir="col" gap="md">
    <NbPanel>
      <h1>Hello World</h1>
    </NbPanel>
    <NbButton>Click me</NbButton>
  </NbGrid>
</template>
```

### Vite Configuration

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

### Importing Styles

**Option 1: Pre-built CSS (recommended for most projects):**

```js
import '@nubisco/ui/dist/ui.css'
```

**Option 2: SCSS (recommended for full customization):**

```scss
@use '@nubisco/ui/styles' as *;
```

### Icon Support

Icons are bundled in the pre-built dist. If you import from source (not `dist/ui.css`), add the icons Vite plugin:

```ts
import { icons as iconsPlugin } from '@nubisco/ui/plugins/icons'

export default defineConfig({
  plugins: [vue(), fonts(), iconsPlugin(process.cwd())],
})
```

> **Note:** Import the plugin from `@nubisco/ui/plugins/icons` — it contains Node.js-only code that cannot run in the browser.

---

## Why Nubisco UI?

Most component libraries impose styling opinions that are hard to override. Nubisco UI follows a geometry-first approach where UI elements follow a grid and proportional spacing. Components are clean, accessible, and fully customisable through a comprehensive SCSS token system.

- **Clean, flat design**: purposeful defaults without visual gimmicks; easy to brand
- **TypeScript-first**: all props, events, and slots are fully typed and exported
- **Tree-shakeable**: ESM output with named exports; only pay for what you use

---

## Features

- **Dual build output**: ES module and CommonJS bundles included
- **SCSS source**: full access to design tokens and variables for deep customization
- **Responsive Grid**: flexbox grid system with five configurable breakpoints
- **Adaptive Icon System**: SVG icons loaded via virtual module with zero runtime cost
- **TypeScript**: fully typed codebase with exported types and declaration maps

---

## Components

### Layout

| Component | Description                                               |
| :-------- | :-------------------------------------------------------- |
| `NbGrid`  | Responsive flexbox grid system with breakpoints           |
| `NbPanel` | Surface container with configurable background and border |
| `NbModal` | Dialog overlay with focus trap and backdrop               |

### Form Controls

| Component       | Description                                                                        |
| :-------------- | :--------------------------------------------------------------------------------- |
| `NbButton`      | Button with 5 variants (primary, secondary, ghost, danger, success), loading state |
| `NbTextInput`   | Text input with label and validation support                                       |
| `NbNumberInput` | Number input with stepper controls and min/max/step constraints                    |
| `NbSelect`      | Dropdown select with search, multiple selection, and virtual scroll                |
| `NbCheckbox`    | Styled checkbox with label and indeterminate state                                 |
| `NbRadio`       | Radio button group with vertical/horizontal layout                                 |
| `NbSlider`      | Range slider with single value and range modes                                     |
| `NbColorStrip`  | Color strip with single/multi-select                                               |

### Data Display

| Component    | Description                                   |
| :----------- | :-------------------------------------------- |
| `NbBadge`    | Status badge/pill with 7 colour variants      |
| `NbIcon`     | SVG icon component with virtual module loader |
| `NbJsonTree` | Collapsible JSON tree viewer                  |

---

## Grid System

The `NbGrid` component provides a flexbox-based layout system with named breakpoints:

| Name  | Min-width |
| :---- | :-------- |
| `sm`  | 320px     |
| `md`  | 672px     |
| `lg`  | 1056px    |
| `xl`  | 1312px    |
| `xxl` | 1584px    |

```vue
<NbGrid dir="row" gap="md" :grid="{ s: 12, m: 6 }">
  <NbGrid dir="col">Column 1</NbGrid>
  <NbGrid dir="col">Column 2</NbGrid>
</NbGrid>
```

---

## TypeScript Support

All component props, events, and composable types are exported:

```ts
import type {
  NbGridProps,
  GridType,
  Breakpoint,
  GridColumns,
} from '@nubisco/ui'
```

---

## Documentation

Full documentation is available at **[nubisco.github.io/ui](https://nubisco.github.io/ui/)**, including:

- [Installation](https://nubisco.github.io/ui/installation)
- [Components](https://nubisco.github.io/ui/components/)
- [Grid System](https://nubisco.github.io/ui/components/grid/)
- [Contributor License Agreement (CLA)](docs/CLA-INDIVIDUAL.md)

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and pull request guidelines.

All contributions require agreement to the Individual CLA: [docs/CLA-INDIVIDUAL.md](docs/CLA-INDIVIDUAL.md). By opening a pull request, you confirm your agreement under the terms in the pull request template.

---

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md) for responsible disclosure procedures.

---

## Support this project

If Nubisco UI is useful in your projects, consider sponsoring development. Maintaining components, design system decisions, and support takes significant time. GitHub Sponsors helps ensure long-term maintenance.

- ❤️ [Sponsor via GitHub](https://github.com/sponsors/joseporto)
- ⭐ [Star the repository](https://github.com/nubisco/ui)

---

## Acknowledgements

Nubisco UI draws inspiration from [IBM Carbon Design System](https://carbondesignsystem.com) for certain component interaction patterns and documentation structure. Carbon is the work of IBM and its contributors, licensed under Apache 2.0.

---

## License

[MIT](LICENSE)
