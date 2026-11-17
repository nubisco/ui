---
layout: nubisco
title: Server rendering
---

# Server rendering

An app that renders in the browser only needs nothing on this page.

An app that renders on the server and hydrates in the browser (SSR, or a
prerendered site built with vite-ssg) installs the library with `ssr: true`:

```ts
app.use(NubiscoUI, { ssr: true })
```

## Why

Overlays (NbModal, NbSelect's list, NbMenu, the date picker and the others)
are rendered with a `<Teleport to="body">`, so they escape any clipping parent.
On the server, Vue does not write a teleport's content where the component
sits: it collects it in a separate buffer that the server is expected to put
into `<body>`. A prerenderer that never does (vite-ssg is one) sends a page
without it. The browser then hydrates the teleport against the first child of
`<body>`, which is usually the app's own root element, reports a hydration
mismatch and can replace the whole page.

With `ssr: true`, every teleport in the library renders **in place** until the
app has hydrated: on the server and in the browser alike, so the two agree.
Once mounted, it moves its content to `<body>` as usual. A closed overlay has no
content, so nothing visible moves. Overlays created after the app has mounted,
on a later page for example, teleport at once.

## Your own teleports

A teleport in your own components has the same problem. Give it the same
switch with `useTeleportReady()`:

```vue
<script setup lang="ts">
import { useTeleportReady } from '@nubisco/ui'

const teleportReady = useTeleportReady()
</script>

<template>
  <Teleport to="body" :disabled="!teleportReady">
    <MyDialog v-if="open" />
  </Teleport>
</template>
```

Without `ssr: true` it is `true` from the first render, so the component
behaves exactly as a plain teleport.

## Reference implementation

nubisco.io (the `nubisco-corporate` repository) is prerendered with vite-ssg
and hydrates with `ssr: true`. Before it, every page was thrown away and drawn
again by the browser about a third of a second after it appeared on a
mid-range phone. The test that keeps the option honest is
`tests/teleport-ssr.test.ts`.
