---
layout: home

hero:
  name: 'Nubisco UI'
  text: 'The Vue 3 library built like a real design system'
  tagline: 'SCSS token engine, geometry-first grid, and production-ready components. Built for teams shipping product UIs at scale.'
  actions:
    - theme: brand
      text: Get Started
      link: /quickstart
    - theme: alt
      text: See it in action
      link: /showcase
    - theme: alt
      text: GitHub
      link: https://github.com/nubisco/ui
  image:
    src: /logo.svg
    alt: Nubisco UI

features:
  - icon:
      src: /icons/scss.svg
    title: SCSS Token Engine
    details: Every color, spacing value, and type scale is a CSS custom property generated from typed SCSS maps. Override one variable and the entire system cascades. No one-off patches.
    link: /theming
    linkText: Explore theming

  - icon:
      src: /icons/grid.svg
    title: Geometry-First Grid
    details: NbGrid is a first-class layout primitive. Five breakpoints, 16 columns, a semantic gap scale (xxs–xxl), and full flex alignment control. Layout is not an afterthought.
    link: /ui/components/grid
    linkText: Grid docs

  - icon:
      src: /icons/vue.svg
    title: TypeScript by Design
    details: Shared I/E/T-prefixed type hierarchy across all components. Props, enums, and variants are fully typed, co-located in .d.ts files, and composable via interface extension.
    link: /conventions/types
    linkText: Type conventions

  - icon:
      src: /icons/a11y.svg
    title: Accessible by Default
    details: Keyboard navigation, ARIA roles, and focus management are built into every interactive component. Accessibility is part of the component contract, not an optional add-on.

  - icon:
      src: /icons/vite.svg
    title: Tree-Shakeable & Fast
    details: Import only what you use. Icons are loaded as async Vue components via a Vite virtual module. Only icons you actually reference end up in your production bundle.

  - icon:
      src: /icons/mit.svg
    title: Open Source · MIT
    details: No lock-in, no subscription, no telemetry. Use it, fork it, extend it. Released under the MIT license and built in the open on GitHub.
    link: https://github.com/nubisco/ui
    linkText: View on GitHub
---
