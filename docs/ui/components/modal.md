---
layout: nubisco
title: Modal
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbModal` is a dialog overlay that appears above the page content. It uses `<Teleport>` to render at the body level, ensuring correct stacking regardless of DOM position.

<preview>
  <NbButton @click="openBasic = true">Open Modal</NbButton>
  <NbModal :open="openBasic">
    <template #header>Example Modal</template>
    <p style="margin: 0">Body content inside a modal.</p>
    <template #footer>
      <NbButton size="lg" @click="openBasic = false">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbButton @click="open = true">Open Modal</NbButton>
  <NbModal :open="open">
    <template #header>Example Modal</template>
    <p>Body content inside a modal.</p>
    <template #footer>
      <NbButton @click="open = false">Close</NbButton>
    </template>
  </NbModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false)
</script>
```

## With action buttons

Use the `#footer` slot with a `NbPanel` to create a proper action bar.

<preview>
  <NbButton @click="openActions = true">Open Modal</NbButton>
  <NbModal :open="openActions">
    <template #header>Confirm Action</template>
    <p style="margin: 0">Are you sure you want to continue? This cannot be undone.</p>
    <template #footer>
      <NbPanel style="padding: 12px;">
        <NbGrid dir="row" gap="sm" justify="end">
          <NbButton variant="ghost" @click="openActions = false">Cancel</NbButton>
          <NbButton variant="primary" @click="openActions = false">Confirm</NbButton>
        </NbGrid>
      </NbPanel>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbModal :open="open">
    <template #header>Confirm Action</template>
    <p>Are you sure? This cannot be undone.</p>
    <template #footer>
      <NbPanel style="padding: 12px;">
        <NbGrid dir="row" gap="sm" justify="end">
          <NbButton variant="ghost" @click="open = false">Cancel</NbButton>
          <NbButton variant="primary" @click="open = false">Confirm</NbButton>
        </NbGrid>
      </NbPanel>
    </template>
  </NbModal>
</template>
```

## Sizes

`size` caps both dimensions of the dialog: `sm` (520px wide, up to 72% of the
viewport height), `md` (720px, 84%), `lg` (960px, 96%), `xl` (1280px, 98%) and
`immersive` (1600px, the full height inside the margin). Height stays
content-driven below the cap, so short dialogs never show empty space; long
content scrolls inside the body once the cap is reached.

No size is a fixed box. The dialog is always `width: 100%` inside an overlay
that keeps a margin all round, so every cap behaves as `min(cap, viewport -
margin)`: on a narrow screen `immersive` and `sm` are the same width, and
neither can overflow the viewport or push the page into horizontal scroll.

<preview>
  <NbGrid dir="row" gap="sm">
    <NbButton @click="openSize = 'sm'">Small</NbButton>
    <NbButton @click="openSize = 'md'">Medium</NbButton>
    <NbButton @click="openSize = 'lg'">Large</NbButton>
    <NbButton @click="openSize = 'xl'">Extra large</NbButton>
    <NbButton @click="openSize = 'immersive'">Immersive</NbButton>
  </NbGrid>
  <NbModal :open="!!openSize" :size="openSize || 'md'" :title="`Size: ${openSize}`" @close="openSize = null">
    <p v-for="n in 30" :key="n" style="margin: 0 0 12px">
      Scrollable body content line {{ n }}.
    </p>
    <template #footer>
      <NbButton size="lg" @click="openSize = null">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbModal :open="open" size="lg" title="Large dialog" @close="open = false">
    <p>Long content scrolls inside the body.</p>
  </NbModal>
</template>
```

## Choosing between `lg`, `xl` and `immersive`

The two larger steps solve different problems, which is why both exist.

Reach for **`xl`** when a dialog is content-heavy but still a dialog: a form
with two columns, a detail panel, a preview beside a description. It is a
bigger box, not a different kind of surface.

Reach for **`immersive`** when the content is a comparison and the columns are
the point: several candidates side by side, a diff, a wide table you actually
have to read across. At `lg` the same content wraps into cramped columns and
buries the differences in inner scrolling, which is the failure this size
exists to fix.

`immersive` is deliberately not full-screen. It keeps its margin, so the page
behind stays visible and the dialog still reads as something you are inside of
rather than somewhere you navigated to. If a task genuinely owns the whole
screen, it wants a route, not a modal.

Open the same four-column comparison at each size to see the difference:

<preview>
  <NbGrid dir="row" gap="sm">
    <NbButton @click="openWide = 'lg'">Compare at lg</NbButton>
    <NbButton @click="openWide = 'xl'">Compare at xl</NbButton>
    <NbButton @click="openWide = 'immersive'">Compare at immersive</NbButton>
  </NbGrid>
  <NbModal :open="!!openWide" :size="openWide || 'lg'" :title="`Region comparison (${openWide})`" @close="openWide = null">
    <NbGrid dir="row" gap="md" align="stretch">
      <NbPanel v-for="region in regions" :key="region.id" style="flex: 1; min-width: 0; padding: 16px;">
        <p style="margin: 0 0 4px; font-weight: 600;">{{ region.id }}</p>
        <p style="margin: 0 0 12px; font-size: 22px; font-weight: 600;">{{ region.latency }}</p>
        <p style="margin: 0 0 4px; font-size: 13px;">Uptime {{ region.uptime }}</p>
        <p style="margin: 0 0 4px; font-size: 13px;">Storage {{ region.storage }}</p>
        <p style="margin: 0; font-size: 13px;">{{ region.notes }}</p>
      </NbPanel>
    </NbGrid>
    <template #footer>
      <NbButton size="lg" @click="openWide = null">Close</NbButton>
    </template>
  </NbModal>
</preview>

```vue
<template>
  <NbModal :open="open" size="immersive" title="Region comparison">
    <NbGrid dir="row" gap="md" align="stretch">
      <NbPanel v-for="region in regions" :key="region.id">
        <!-- one column per region -->
      </NbPanel>
    </NbGrid>
  </NbModal>
</template>
```

</doc-tab>

<doc-tab name="Api">

## Props

| Prop             | Type                                          | Default     | Description                                     |
| ---------------- | --------------------------------------------- | ----------- | ----------------------------------------------- |
| `open`           | `boolean`                                     | `false`     | Controls whether the modal is open              |
| `title`          | `string`                                      | `undefined` | Header title, alternative to the `#header` slot |
| `size`           | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'immersive'` | `'md'`      | Caps the dialog width and height (see Sizes)    |
| `closeOnOverlay` | `boolean`                                     | `true`      | Emits `close` when the backdrop is clicked      |

## Slots

| Slot      | Description                                    |
| --------- | ---------------------------------------------- |
| `header`  | Modal title / header area                      |
| `default` | Modal body content                             |
| `footer`  | Footer area, typically used for action buttons |

## Events

| Event   | Payload | Description                                                                                           |
| ------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `close` | none    | Emitted by the close button, the Escape key, and backdrop clicks (unless `closeOnOverlay` is `false`) |

The modal is controlled: listen for `close` and set your `:open` binding to `false`.

## Z-index

The modal uses `--nb-zindex-modal` from the design system token stack. Components that render inside a modal and need to escape its DOM subtree (e.g. `NbSelect` dropdowns) use the `--nb-zindex-modal-*` tier. See the Z-Index principles page for details.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
const openBasic = ref(false)
const openActions = ref(false)
const openSize = ref<'sm' | 'md' | 'lg' | 'xl' | 'immersive' | null>(null)
const openWide = ref<'lg' | 'xl' | 'immersive' | null>(null)
const regions = [
  { id: 'eu-west-1', latency: '24 ms', uptime: '99.99%', storage: '2 TB', notes: 'Read replicas, nightly snapshots' },
  { id: 'us-east-1', latency: '86 ms', uptime: '99.98%', storage: '4 TB', notes: 'Nightly snapshots' },
  { id: 'ap-south-1', latency: '142 ms', uptime: '99.95%', storage: '1 TB', notes: 'Read replicas, hourly snapshots' },
  { id: 'sa-east-1', latency: '118 ms', uptime: '99.97%', storage: '1 TB', notes: 'Read replicas, nightly snapshots' },
]
</script>
