---
layout: nubisco
title: useTheme
tabs: ['Overview', 'API']
---

<doc-tab name="Overview">

`useTheme` owns light/dark theming for an application. The library already ships both ramps and switches between them on a single class, so all this composable decides is **when that class is present**, where the preference is stored, and what happens when the OS setting changes while the app is open.

## Three states, not two

The preference is `'light' | 'dark' | 'system'`, and `system` is the default.

`system` is a real preference, not the absence of one. Someone who has never opened your settings page gets the theme they already asked their machine for, and they keep getting it when the OS flips at sunset. An explicit `light` or `dark` pins the app and stops it following.

That is why there are two values to read:

| Value      | Is                                       | Bind it to                                     |
| ---------- | ---------------------------------------- | ---------------------------------------------- |
| `theme`    | what the person chose, `system` included | a settings control (three options)             |
| `resolved` | what is actually painted, never `system` | an icon, a chart palette, an embedded `iframe` |

## Setup

Name a storage key once, at application start, before the app mounts:

```ts
import { createApp } from 'vue'
import NubiscoUI, { configureTheme } from '@nubisco/ui'
import '@nubisco/ui/dist/ui.css'
import App from './App.vue'

configureTheme({ storageKey: 'analytics.theme' })

createApp(App).use(NubiscoUI).mount('#app')
```

Namespace the key per product. Two Nubisco applications served from the same origin would otherwise share one value and fight over it.

## Using it

```vue
<script setup lang="ts">
import { useTheme } from '@nubisco/ui'

const { theme, resolved, setTheme, toggle } = useTheme()
</script>

<template>
  <!-- A settings page: three options, so bind `theme` and call setTheme -->
  <NbSelect
    :model-value="theme"
    :options="[
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'Match system' },
    ]"
    @update:model-value="setTheme"
  />

  <!-- A topbar: one button, so follow `resolved` and call toggle -->
  <NbButton :icon="resolved === 'dark' ? 'sun' : 'moon'" @click="toggle" />
</template>
```

`toggle()` flips against what is **showing**, not against what is stored, and always lands on an explicit `light` or `dark`. Toggling while on `system` showing dark gives you `light`, which is what the person clicking the button meant. A three-state control should call `setTheme` instead.

## What it does to the document

- Toggles `.dark` on `<html>`, which is the selector the library's dark ramp is emitted under. It goes on `<html>` rather than your app root because modals, popovers and every other teleported surface mount outside it and would otherwise stay light.
- Sets `color-scheme` on the same element, so the browser paints form controls, scrollbars and the canvas behind the page to match. That is what stops the white flash around a dark page.

## Avoiding the first-paint flash

The composable runs when your app boots, which is after the browser has painted the empty document. For a dark-by-default audience, read the preference in the HTML shell before the bundle loads:

```html
<script>
  ;(function () {
    try {
      var stored = localStorage.getItem('analytics.theme')
      var dark =
        stored === 'dark' ||
        ((!stored || stored === 'system') &&
          matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    } catch (e) {}
  })()
</script>
```

Use the same storage key you passed to `configureTheme`. The composable agrees with whatever that snippet decided, so nothing moves when the app takes over.

## One state, shared

The preference is global, exactly like the document it paints. Every `useTheme()` call in an application returns the same reactive state, and a component that only reads `resolved` costs nothing extra.

</doc-tab>

<doc-tab name="API">

## `useTheme()`

Returns the controller. Safe to call from any component; there is one state per application.

| Property        | Type                            | Description                                                     |
| --------------- | ------------------------------- | --------------------------------------------------------------- |
| `theme`         | `Readonly<Ref<TTheme>>`         | The stored preference: `'light' \| 'dark' \| 'system'`.         |
| `resolved`      | `Readonly<Ref<TResolvedTheme>>` | The theme actually showing: `'light' \| 'dark'`.                |
| `followsSystem` | `ComputedRef<boolean>`          | True while the preference is `system`.                          |
| `setTheme`      | `(value: TTheme) => void`       | Pin a preference, or pass `'system'` to hand control to the OS. |
| `toggle`        | `() => void`                    | Flip to the opposite of `resolved`. Always lands on light/dark. |

## `configureTheme(options?)`

Call once at application start, before the first `useTheme()`. Calling it later re-reads storage and repaints, which is what an app switching identity mid-session (or a test) wants.

| Option         | Type     | Default           | Description                                                                     |
| -------------- | -------- | ----------------- | ------------------------------------------------------------------------------- |
| `storageKey`   | `string` | `'nubisco.theme'` | `localStorage` key the preference is persisted under. Namespace it per product. |
| `defaultTheme` | `TTheme` | `'system'`        | Preference to use when nothing is stored yet.                                   |
| `darkClass`    | `string` | `'dark'`          | Class placed on `<html>` for the dark theme.                                    |

## Types

```ts
type TTheme = 'light' | 'dark' | 'system'
type TResolvedTheme = 'light' | 'dark'
```

## Storage failures

Reading `localStorage` throws outright in Safari's private mode and wherever cookies are blocked. Both the read and the write are wrapped: the preference still applies for the session, it just does not survive the tab. A product losing a preference is a nuisance; a product that will not boot is not.

</doc-tab>
