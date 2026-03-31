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

</doc-tab>

<doc-tab name="Api">

## Props

| Prop   | Type      | Default | Description                        |
| ------ | --------- | ------- | ---------------------------------- |
| `open` | `boolean` | `false` | Controls whether the modal is open |

## Slots

| Slot      | Description                                    |
| --------- | ---------------------------------------------- |
| `header`  | Modal title / header area                      |
| `default` | Modal body content                             |
| `footer`  | Footer area, typically used for action buttons |

## Events

`NbModal` does not emit close events directly. Closing is handled by updating the `:open` binding from the parent (e.g. in a button's `@click` handler).

## Z-index

The modal uses `--nb-zindex-modal` from the design system token stack. Components that render inside a modal and need to escape its DOM subtree (e.g. `NbSelect` dropdowns) use the `--nb-zindex-modal-*` tier. See the Z-Index principles page for details.

</doc-tab>

<script setup lang="ts">
import { ref } from 'vue'
const openBasic = ref(false)
const openActions = ref(false)
</script>
