---
layout: nubisco
title: useShellSlot
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`useShellSlot` lets a view render controls into a region of the surrounding [`NbShell`](/ui/components/shell): a page title in the topbar, a Save button next to it, a filter row in the fixedbar, a panel in the inspector.

It exists because everybody needed it and everybody built it privately. Eight of our twelve applications put a hand-picked DOM id on a shell region and teleported into it by selector: `#cms-topbar`, `#nks-topbar-right`, `#verba-topbar`, `#ob-topbar-left`, `#nba-topbar-left`, `#tally-topbar`, `#page-actions`. Eight incompatible contracts, one of which shipped a bug because a view looked for its target before the shell had rendered it. This is the supported version, with those two failure modes handled rather than rediscovered.

## Basic usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useShellSlot } from '@nubisco/ui'

const topbar = useShellSlot('topbar-right')
const dirty = ref(false)

function save() {
  /* ... */
}
</script>

<template>
  <component :is="topbar.Outlet">
    <NbButton size="sm" :disabled="!dirty" @click="save">Save</NbButton>
  </component>

  <article>...</article>
</template>
```

The button appears in the shell's topbar. It is still this view's button: `Outlet` teleports the nodes rather than re-creating them, so `dirty`, the handler and any component state inside belong to the view and stay reactive from here. When the view unmounts, the contribution goes with it.

## Regions

| Region         | Where it renders                                                     |
| -------------- | -------------------------------------------------------------------- |
| `outer-menu`   | Full-width strip above the sidebar, body and inspector               |
| `inner-menu`   | Strip above the body and inspector, but not the sidebar              |
| `notification` | Full-width area above the topbar, for banners                        |
| `topbar-left`  | Left half of the topbar: page title, breadcrumbs                     |
| `topbar-right` | Right half of the topbar: page actions                               |
| `fixedbar`     | Non-scrolling strip under the topbar: tabs, filters                  |
| `bottom`       | Region pinned under the main area, where `NbShellPanel` usually goes |
| `inspector`    | The optional right-hand column                                       |

The `sidebar-*` slots are deliberately absent. Navigation is a property of the application, declared once; a per-view contribution mechanism pointed at the rail would let the rail change shape on every route, which is the opposite of what a rail is for.

## Ordering is not your problem

A child's `onMounted` runs before its ancestors'. A view that queries for a shell element on mount is therefore looking too early, and if the target region is conditional (the topbar only exists when it has content) it may not exist at all yet. That is the bug that shipped in one product, patched there with a `setTimeout`.

There is nothing to time here:

- `target` is reactive. It is `null` on the first tick and becomes the element as soon as the shell mounts the region. `Outlet` renders when it does.
- Registering is what makes a conditional region exist. A shell with no static topbar slots grows a topbar the moment a view claims one, and loses it again when that view unmounts. Nothing to force from outside.

If you do need to know, read `ready`.

```ts
const topbar = useShellSlot('topbar-right')
watch(topbar.ready, (ready) => {
  if (ready) measureSomething()
})
```

## Two views, one region

During a route transition the arriving view is created before the leaving one is torn down, so both hold the region for a frame or two. Left alone that renders two page titles, or two Save buttons where one of them no longer saves anything.

The default claim, `'last'`, is exclusive: the most recently registered contribution renders and the rest stand down without unmounting. The arriving view takes the region on the same tick it registers, so the doubled frame never happens. It is reversible: when the newer contribution goes away, the earlier one takes the region back, which is what makes a contribution from a dialog or a nested route behave.

```ts
// Exclusive. The page owns the topbar while it is open.
const topbar = useShellSlot('topbar-right')
```

When contributions are genuinely additive, say so per contributor:

```ts
// Renders alongside whatever else claimed the region. Lower `order` first.
const sync = useShellSlot('topbar-right', { claim: 'all', order: -10 })
```

Teleports append in mount order, which between concurrently mounted views is whatever order the router created them in. So under `claim: 'all'` the outlet wraps its content in a flex box carrying a CSS `order`, and that wrapper is what makes the sort real. The wrapper inherits the region's own gap and its cross-axis alignment (`gap: inherit; align-items: inherit`, both explicit, since neither inherits on its own), so the contribution lines up with static slot content instead of reading as a nested group, and a region a product has set to `align-items: flex-start` is not re-centred by a box it did not write. The default claim adds no wrapper.

CSS `order` applies to flex and grid children only, and three of the eight regions (`outer-menu`, `inner-menu`, `notification`) are block containers on purpose: their contents are the product's markup and their layout is the product's business. `NbShell` closes that gap by switching exactly those three to a column flex container (`.nb-shell__region--ordered`) while at least one `claim: 'all'` contribution is registered, and dropping it again when the last one leaves. Column with the default `align-items: stretch` reproduces block stacking for full-width children, so the switch is invisible in the ordinary case. It is scoped to this API deliberately: a product that fills those regions by hand and never calls `useShellSlot` keeps byte-identical layout. The one arrangement that will notice is a region whose children lay themselves out horizontally through `display: inline-block` rather than through a flex container of the product's own; put a flex container there before using `claim: 'all'` in it.

Mixing claims in one region resolves in favour of exclusivity: if anything in the region asked to be the only one, it is, and the newest such contribution wins. That is a consumer mistake with a defined outcome, not a supported mode.

## Outside a shell

A view that contributes is still a view. Mounted with no `NbShell` ancestor (a unit test, a print route, a page embedded in something else) the composable is inert: `ready` stays `false`, `Outlet` renders nothing, no warning, no throw. There is nothing to branch on and nothing to stub.

### Inside a shell that suppresses the region

Same outcome, different cause, and this one is usually a mistake. `<NbShell topbar="never">` renders no topbar, so a contribution to `topbar-left` or `topbar-right` has no host element to teleport into: `ready` stays `false` and nothing appears. The runtime behaviour has to be this (a view cannot know which shell it will be mounted under), so `NbShell` warns once in development instead:

```
[NbShell] A view contributed to the topbar with useShellSlot(), but this shell
renders no topbar (topbar="never"). The contribution is dropped.
```

The fix is on the shell, not on the view: use `topbar="auto"`, or contribute to a region that shell does render. The other regions cannot hit this, because `topbar` is the only presence the shell can be told to override. In particular the `inspector` host is always mounted, even while the inspector is closed.

## Contributing from a deeper component

Any descendant of the shell can call it, not only the routed view. A table's toolbar can put its own bulk-action bar in the fixedbar while a row is selected, from inside the table component, with no prop threading.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useShellSlot } from '@nubisco/ui'

const props = defineProps<{ selected: string[] }>()
const bulk = useShellSlot('fixedbar')
const hasSelection = computed(() => props.selected.length > 0)
</script>

<template>
  <component :is="bulk.Outlet">
    <template v-if="hasSelection">
      <span>{{ selected.length }} selected</span>
      <NbButton size="sm" variant="secondary">Export</NbButton>
    </template>
  </component>
</template>
```

A `<Teleport>` in between is fine: teleporting moves DOM, not the component tree, so `inject` still finds the shell from inside a teleported dialog. The one thing that does break the chain is a **separate application instance** mounted at the document root, which has no parent chain into your shell at all. Call the composable inside the shell's own app and pass what you need across.

## Destructive actions do not belong here

A contributed control sits in the application's chrome, where it is visible on every route the view owns and where a mis-click costs the most. Anything irreversible you put in a region should confirm first, in a real dialog: `window.confirm` is a documented no-op inside a Tauri webview and cannot be driven from a gamepad, and two of our products discovered both facts the hard way.

</doc-tab>

<doc-tab name="Api">

## Signature

```ts
function useShellSlot(
  name: TShellSlotName,
  options?: IShellSlotOptions,
): IShellSlot
```

```ts
type TShellSlotName =
  | 'outer-menu'
  | 'inner-menu'
  | 'notification'
  | 'topbar-left'
  | 'topbar-right'
  | 'fixedbar'
  | 'bottom'
  | 'inspector'
```

## Options

| Option  | Type              | Default  | Description                                                                                                                                                                                                                                   |
| ------- | ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claim` | `'last' \| 'all'` | `'last'` | `'last'`: exclusive, the newest contribution to the region renders and the rest stand down. `'all'`: every contribution renders                                                                                                               |
| `order` | `number`          | `0`      | Sort key within the region under `claim: 'all'`; lower renders first. Ties keep registration order. Ignored under `claim: 'last'`. Implemented as a CSS `order`, so the shell makes the three block regions flex for the duration (see above) |

## Return value

| Property | Type                              | Description                                                                                                |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Outlet` | Component                         | Renders its default slot into the region. Use as `<component :is="slot.Outlet">…</component>`              |
| `target` | `ShallowRef<HTMLElement \| null>` | The live host element inside the shell. `null` until the shell has mounted the region, and outside a shell |
| `ready`  | `ComputedRef<boolean>`            | `target` exists                                                                                            |
| `active` | `ComputedRef<boolean>`            | This contribution is the one rendering under the current claim. `Outlet` already checks it                 |
| `name`   | `TShellSlotName`                  | The region claimed                                                                                         |
| `id`     | `number`                          | This contribution's identity within the page. For debugging and tests                                      |

`ready` and `active` are refs, so read them as `topbar.ready.value` in script. In a template, prefer `Outlet`, which needs no guard of its own.

## Lifecycle

Registration happens during `setup`, not on mount: that is what lets an arriving route component take an exclusive region on the same tick, before the leaving one has finished tearing down.

Release happens on **scope disposal**, which covers unmount and also works inside a manually created `effectScope` with no component of its own.

Scope disposal is not the whole story, though, because there is one common case where nothing is disposed at all.

### `<KeepAlive>`

A `<KeepAlive>`-cached route component that is navigated away from is **deactivated, not unmounted**: Vue moves its subtree to an off-document container and leaves the instance, its effect scope and its watchers alive. `onUnmounted` does not run. `onScopeDispose` does not run. And because a teleported subtree does not live in its own component's DOM, KeepAlive has nothing to move: the contributed nodes stay exactly where they were, in the shell region of the page that replaced them.

That is the doubled-controls bug this composable exists to prevent, arriving through the standard Vue routing pattern:

```vue
<router-view v-slot="{ Component }">
  <KeepAlive>
    <component :is="Component" />
  </KeepAlive>
</router-view>
```

So the composable handles it explicitly, with the only lifecycle pair KeepAlive does give:

- `onDeactivated` **suspends** the registration. A suspended entry is skipped by the shell's arbitration and by its "does this region have anything in it" count, so the outlet stops rendering and a region that existed only because of this contribution closes again.
- `onActivated` **resumes** it, and re-stamps its registration order, so a page you have navigated back to is the newest claimant. That is what `claim: 'last'` has to mean for a cached page.

Suspending rather than unregistering is what lets the entry come back with its `order` and `claim` intact, and it is why the id you get back stays the same across a cache round trip.

Two cached views that both contribute to one region therefore hand it back and forth exactly as two uncached ones do, and only ever one of them is in the DOM.

Calling it more than once in the same component is fine and gives you two independent contributions, which is the normal way to fill both halves of the topbar.

```ts
const title = useShellSlot('topbar-left')
const actions = useShellSlot('topbar-right')
```

## Accessibility

- Teleporting moves a node in the DOM without re-creating it, so a focused control keeps focus, and its component state survives. Contributed controls follow the shell's DOM order for screen readers and for tab order: the topbar comes before the main region, which is where a page's actions belong.
- The outlet adds no role, label or landmark. What you contribute is what renders. If the contribution is a group of related controls, label it (`<div role="group" aria-label="Page actions">`) exactly as you would inline.
- Under `claim: 'all'` the sorting wrapper is a plain `<div>` with no role and does not change what is announced, but note that CSS `order` changes visual order only. Tab order still follows the DOM. Use `order` for arrangement, not to express priority to a keyboard user. This is the accessibility reason the shell does not try harder to make `order` work: a region where visual order and tab order disagree is a region you should be reordering in the DOM instead.
- The `inspector` region is the one that can be contributed to while it is not visible. `NbShell` marks the closed inspector `inert` and `aria-hidden`, so a panel teleported into a column the application has not opened is neither tabbable nor announced. You do not need to guard the contribution with a `v-if` on the same state.
- An exclusive contribution disappearing when another view claims the region is a DOM removal like any other. If the removed control had focus, focus falls back to the document body: worth knowing if you contribute a control that opens something and then navigate away from underneath it.

</doc-tab>
