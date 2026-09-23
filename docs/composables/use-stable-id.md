---
layout: nubisco
title: useStableId
tabs: ['Overview', 'API']
---

<doc-tab name="Overview">

`useStableId` generates a stable, meaningful DOM element `id` for any form component. Every input-like component in Nubisco UI calls it in setup — you rarely need to call it directly unless you are building a new component.

## Why deterministic IDs matter

Accessible form controls require a stable `id` on the input and a matching `for` on the label. Randomly generated IDs break:

- **Server-side rendering** — a new random ID on every render causes hydration mismatches.
- **Analytics pipelines** — IDs like `text-input-4a9f` carry no meaning. IDs like `nb-text-input-billing-email` are immediately identifiable in click-tracking and error-reporting tools.
- **Automated tests** — stable IDs make selectors predictable across builds.

## Resolution order

`useStableId` resolves the final ID using this priority chain:

1. **`props.id`** — an explicit id is always honoured as-is.
2. **`{component-slug}-{name-slug}`** — when `props.name` is set, the component type and field name are combined.
   `NbTextInput` + `name="billingEmail"` → `nb-text-input-billing-email`
3. **`{component-slug}-{vue-uid}`** — positional fallback via Vue's `useId()`, which is SSR-safe and unique within the app instance.
   `nb-select-v3`

## Usage in a new component

```ts
import { useStableId } from '@/composables/useStableId.composable'

const props = defineProps<{ id?: string; name?: string }>()
const inputId = useStableId(props)
```

The returned string can be bound to any element:

```html
<label :for="inputId">{{ label }}</label> <input :id="inputId" ... />
```

> [!NOTE]
> `useStableId` must be called during component setup, not inside event handlers or watchers — it uses `getCurrentInstance()` to read the component name.

</doc-tab>

<doc-tab name="API">

## Signature

<<< @../../src/composables/useStableId.composable.ts#useStableId

## Parameters

| Parameter | Type                             | Description                                                  |
| --------- | -------------------------------- | ------------------------------------------------------------ |
| `props`   | `{ id?: string; name?: string }` | The component's props object. Only `id` and `name` are read. |

## Returns

`string` — the resolved element ID.

## ID format reference

| Condition           | Format                         | Example               |
| ------------------- | ------------------------------ | --------------------- |
| `props.id` is set   | `props.id` verbatim            | `"my-custom-id"`      |
| `props.name` is set | `{component-slug}-{name-slug}` | `"nb-select-country"` |
| Neither is set      | `{component-slug}-{vue-uid}`   | `"nb-text-input-v7"`  |

Component slug is derived from the component's `__name` (the SFC filename) converted to kebab-case. `NbTextInput` → `nb-text-input`.

</doc-tab>
