---
layout: nubisco
title: Toast
---

`NbToast` is the individual toast notification item. It handles its own countdown timer, pause-on-hover, progress bar, and dismissal. The library does not ship an opinionated toaster container — instead, you compose one using the pattern below, which gives you full control over positioning, stacking order, and queue behaviour.

## The `NbToast` component

### Props

| Prop       | Type                                          | Default  | Description                                                                       |
| ---------- | --------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `message`  | `string`                                      | —        | **Required.** The body text of the toast.                                         |
| `variant`  | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Controls the accent colour and icon.                                              |
| `title`    | `string`                                      | —        | Optional bold heading above the message.                                          |
| `duration` | `number`                                      | `4000`   | Auto-dismiss delay in milliseconds. Set to `0` to disable auto-dismiss.           |
| `cta`      | `{ label: string; action: () => void }`       | —        | Optional call-to-action button. Clicking it runs `action()` and closes the toast. |

### Events

| Event   | Payload | Description                                                                                                                                                                                            |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `close` | —       | Fired when the toast should be removed — either the timer elapsed, the close button was clicked, or the CTA was activated. The parent is responsible for actually removing the component from the DOM. |

### Behaviour

- **Pause on hover** — moving the cursor over the toast pauses the countdown. The timer resumes from where it left off when the cursor leaves.
- **Progress bar** — a thin bar at the bottom of the toast shrinks over the `duration`. It is hidden when `duration` is `0`.
- **Accessibility** — the element has `role="alert"`. `aria-live` is set to `"assertive"` for `error` toasts and `"polite"` for all others.

## Building a toaster

Because overlapping toasts must sit above modals and other UI layers, the container is always mounted via `<Teleport to="body">` and uses `--nb-zindex-toast` from the design system.

### 1. The composable

Create a reactive toast queue in a shared composable:

```ts
// composables/useToast.ts
import { ref } from 'vue'
import type { NbToastVariant, NbToastCta } from '@nubisco/ui'

let id = 0

export interface Toast {
  id: number
  variant: NbToastVariant
  title?: string
  message: string
  duration?: number
  cta?: NbToastCta
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function push(options: Omit<Toast, 'id'>) {
    toasts.value.push({ id: id++, ...options })
  }

  function dismiss(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  return { toasts, push, dismiss }
}
```

### 2. The container component

```vue
<!-- components/Toaster.vue -->
<template>
  <Teleport to="body">
    <div class="toaster">
      <TransitionGroup name="toast">
        <NbToast
          v-for="toast in toasts"
          :key="toast.id"
          v-bind="toast"
          @close="dismiss(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { NbToast } from '@nubisco/ui'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toaster {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: var(--nb-zindex-toast);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
```

### 3. Register the container once

Mount `<Toaster />` once at the application root — typically in `App.vue`:

```vue
<!-- App.vue -->
<template>
  <RouterView />
  <Toaster />
</template>

<script setup lang="ts">
import Toaster from '@/components/Toaster.vue'
</script>
```

### 4. Push toasts from anywhere

Because `useToast` returns the same reactive `toasts` array every time it is called, you can push from any component or composable without prop drilling:

```ts
import { useToast } from '@/composables/useToast'

const { push } = useToast()

// Simple notification
push({ variant: 'success', message: 'Changes saved.' })

// With a title
push({
  variant: 'error',
  title: 'Upload failed',
  message: 'The file exceeds the 5 MB limit.',
})

// Persistent (no auto-dismiss)
push({ variant: 'warning', message: 'You are in read-only mode.', duration: 0 })

// With a call to action
push({
  variant: 'info',
  message: 'A new version is available.',
  cta: { label: 'Reload', action: () => window.location.reload() },
})
```

## Z-index

Toasts use `--nb-zindex-toast` which resolves to `--nb-zindex-modal + 50`. This guarantees toasts are always visible above open modals. See the [Z-Index](/principles/z-index) page for the full stacking reference.
