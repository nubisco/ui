---
layout: nubisco
title: useSidebarVariant
tabs: ['Overview', 'API']
---

<doc-tab name="Overview">

`useSidebarVariant` holds whether the rail is expanded or collapsed, and remembers it for the person using the product.

```ts
import { useSidebarVariant } from '@nubisco/ui'

const nav = useSidebarVariant({ storageKey: 'prelo.sidebar' })
```

```vue
<NbShell :sidebar-variant="nav.variant.value">
  <template #sidebar-bottom>
    <NbSidebarMenu>
      <NbSidebarCollapseToggle @toggle="nav.toggle" />
    </NbSidebarMenu>
  </template>
</NbShell>
```

## A preference, never a route

`NbShell`'s `sidebarVariant` is a plain prop, so a product can set it however it likes. The [app frame](/patterns/app-frame#expanding-and-collapsing-the-rail) is explicit that switching it at runtime is for a person's preference and never for a route, and this is that preference: it changes only when someone asks, and it is still what they chose next time they open the product.

Deriving the variant from the route instead means the rail changes shape as someone moves around, with nothing they did to cause it, and it undoes a choice they made a moment ago.

## Storage

Name a key and namespace it per product, the same rule as [useTheme](/ui/composables/use-theme): two Nubisco products on one origin would otherwise overwrite each other's choice.

A stored value the composable does not recognise, from an older build or edited by hand, is ignored rather than passed to the shell. Storage that is missing or throws, as in a private window, means the choice is not remembered; the rail still works.

</doc-tab>

<doc-tab name="API">

## Options

| Option           | Type                     | Default     | Description                                     |
| ---------------- | ------------------------ | ----------- | ----------------------------------------------- |
| `storageKey`     | `string`                 | (required)  | localStorage key the preference is saved under. |
| `defaultVariant` | `'compact' \| 'verbose'` | `'verbose'` | What someone who has never chosen sees.         |

## Returns

| Member       | Type                                      | Description                            |
| ------------ | ----------------------------------------- | -------------------------------------- |
| `variant`    | `Ref<'compact' \| 'verbose'>`             | Bind to `NbShell`'s `sidebar-variant`. |
| `isCompact`  | `ComputedRef<boolean>`                    | Whether the rail is collapsed.         |
| `toggle`     | `() => void`                              | Switches between the two variants.     |
| `setVariant` | `(value: 'compact' \| 'verbose') => void` | Sets one; an unknown value is ignored. |

</doc-tab>
