import {
  computed,
  defineComponent,
  getCurrentInstance,
  getCurrentScope,
  h,
  inject,
  onActivated,
  onDeactivated,
  onScopeDispose,
  ref,
  shallowRef,
  Teleport,
  type ComputedRef,
  type InjectionKey,
  type Ref,
  type ShallowRef,
  type VNode,
} from 'vue'

/**
 * Shell regions a view is allowed to contribute controls to.
 *
 * These are exactly the regions `NbShell` renders as a single addressable
 * element. `sidebar-*` is deliberately absent: navigation is the application's
 * to declare once, not a per-view contribution, and a view that could inject
 * rail items could also make the rail change shape on every route.
 * `menubar` is absent because it is the legacy in-body bar, kept for the two
 * apps that still pass it and not worth a new contract.
 */
export type TShellSlotName =
  | 'outer-menu'
  | 'inner-menu'
  | 'notification'
  | 'topbar-left'
  | 'topbar-right'
  | 'fixedbar'
  | 'bottom'
  | 'inspector'

/**
 * What happens when two views hold the same region at the same time, which is
 * the normal state of affairs for the frame or two a route transition takes.
 *
 * - `'last'` (default): the most recently registered contributor renders and
 *   the others stand down. The leaving view's controls disappear the moment
 *   the arriving view registers, so the topbar never shows two page titles or
 *   two Save buttons. When the newer contributor unmounts, the previous one
 *   becomes active again, which is what makes a contribution inside a dialog
 *   or a nested route behave.
 * - `'all'`: every contributor renders, ordered by `order` then registration.
 *   For genuinely additive regions (a status chip from a background sync
 *   alongside the page's own actions).
 */
export type TShellSlotClaim = 'last' | 'all'

export interface IShellSlotOptions {
  /**
   * Sort key within a region when `claim: 'all'`. Lower renders first (further
   * left in a horizontal region, higher in a stacked one). Ties keep
   * registration order. Ignored when `claim` is `'last'`, where there is only
   * ever one contribution to place.
   *
   * Teleports append in mount order, which for concurrent views is whatever
   * order the router happened to create them in. So under `claim: 'all'` the
   * outlet wraps its content in a flex box carrying a CSS `order`, and that is
   * what actually sorts the region. The wrapper inherits the region's own gap
   * and cross-axis alignment (both with an explicit `inherit`), so
   * contributions line up with static slot content rather than reading as a
   * nested group.
   *
   * CSS `order` only sorts flex and grid children, and three of the eight
   * regions (`outer-menu`, `inner-menu`, `notification`) are block containers
   * whose internal layout belongs to the product, not to us. `NbShell`
   * therefore switches exactly those three to a column flex container while a
   * shared contribution is registered, and back when the last one leaves: see
   * `sharedCount` below and `.nb-shell__region--ordered` in `Shell.vue`. The
   * switch is scoped to the new API on purpose, so a product that never calls
   * `useShellSlot` keeps byte-identical layout in the regions it already fills
   * by hand.
   * @default 0
   */
  order?: number
  /**
   * How this contributor shares the region with others.
   * @default 'last'
   */
  claim?: TShellSlotClaim
}

/** One registered contributor, as the shell sees it. */
interface IShellSlotEntry {
  id: number
  name: TShellSlotName
  order: number
  claim: TShellSlotClaim
  seq: number
  /**
   * True while the contributor is alive but off screen, which in practice
   * means a `<KeepAlive>`-cached route component that has been deactivated.
   * Such an entry is skipped by `activeIds` and by `count`, so a cached page's
   * controls neither render nor keep a region open.
   */
  deactivated: boolean
}

/**
 * The contract `NbShell` provides and `useShellSlot` consumes. Not public API:
 * consumers go through the composable, which is the whole point of the piece.
 */
export interface IShellSlotRegistry {
  register(entry: IShellSlotEntry): void
  unregister(id: number): void
  /** The live host element for a region, or null before the shell has mounted it. */
  elementFor(name: TShellSlotName): ShallowRef<HTMLElement | null>
  /** Ids that should render right now for a region, in render order. */
  activeIds(name: TShellSlotName): ComputedRef<number[]>
  /**
   * Suspend or resume a registration without losing it. Called from the
   * composable's `onDeactivated` / `onActivated`, which is the only lifecycle
   * pair `<KeepAlive>` gives us: a deactivated component is not unmounted, its
   * effect scope is not disposed, and its teleported nodes stay exactly where
   * they were.
   */
  setActive(id: number, active: boolean): void
}

export const NB_SHELL_SLOT_KEY: InjectionKey<IShellSlotRegistry> =
  Symbol('nb-shell-slots')

/** Monotonic ids, so an entry is identifiable without a magic string. */
let nextId = 0
/** Monotonic registration counter, so ties in `order` resolve deterministically. */
let nextSeq = 0

export interface IShellSlot {
  /** This contributor's id. Useful in tests and debugging; not needed to render. */
  readonly id: number
  /** The region this contributor targets. */
  readonly name: TShellSlotName
  /**
   * The host element inside the shell. `null` until the shell has mounted the
   * region, which is normal on the first tick: a view's `onMounted` runs
   * BEFORE its ancestors'. Reactive, so anything bound to it corrects itself
   * without a `nextTick` dance.
   */
  readonly target: Readonly<ShallowRef<HTMLElement | null>>
  /** True once `target` exists. */
  readonly ready: ComputedRef<boolean>
  /**
   * True when this contributor both has a target and has won the region under
   * the current `claim`. `Outlet` already checks this; read it when you need
   * to skip expensive work rather than just skip rendering.
   */
  readonly active: ComputedRef<boolean>
  /**
   * Renders its default slot into the region. Use it as a component:
   * `<component :is="topbar.Outlet"><NbButton ... /></component>`.
   *
   * Content stays owned by the view: it is teleported, not re-created, so its
   * reactive state, event handlers and component instances are the view's.
   */
  readonly Outlet: ReturnType<typeof defineComponent>
}

/**
 * Contribute controls from a view into a region of the surrounding `NbShell`.
 *
 * Eight of our twelve applications solved this with a hand-rolled DOM id
 * (`#cms-topbar`, `#ob-topbar-left`, `#page-actions`, five more), and every one
 * of them re-derived the same two problems: the target element does not exist
 * when the view mounts, and during a route transition two views hold the region
 * at once. This composable is the supported answer to both.
 *
 * ```vue
 * <script setup lang="ts">
 * import { useShellSlot } from '@nubisco/ui'
 * const topbar = useShellSlot('topbar-right')
 * </script>
 *
 * <template>
 *   <topbar.Outlet>
 *     <NbButton size="sm" @click="save">Save</NbButton>
 *   </topbar.Outlet>
 *   <article>...</article>
 * </template>
 * ```
 *
 * Contributing also makes the region exist: `NbShell` counts registrations the
 * same way it counts slot content, so a topbar with no static slots and no
 * contributions is not rendered at all, and appears the moment a view claims
 * it. Nothing to hide from the outside with a `:deep()` override.
 *
 * Under `<KeepAlive>` the contribution follows the page rather than the
 * component instance. A cached route component that is deactivated releases the
 * region on the way out and takes it back (as the newest claimant) on the way
 * in, so `<router-view v-slot="{ Component }"><KeepAlive><component
 * :is="Component" /></KeepAlive></router-view>` behaves the same as an
 * uncached one.
 *
 * Outside an `NbShell` the composable is inert: `ready` stays false, `Outlet`
 * renders nothing, no warning, no throw. That keeps a view usable in isolation
 * (a storybook page, a unit test, a print route) without branching on it.
 *
 * The same is true inside a shell that is not rendering the region: a
 * contribution to `topbar-left` under `<NbShell topbar="never">` has no host
 * element to teleport into, so `ready` stays false and nothing renders. The
 * shell warns about that case in development, because it is a configuration
 * mistake rather than a legitimate isolated mount.
 */
export function useShellSlot(
  name: TShellSlotName,
  options: IShellSlotOptions = {},
): IShellSlot {
  const registry = inject(NB_SHELL_SLOT_KEY, null)
  const id = nextId++
  const order = options.order ?? 0
  const claim: TShellSlotClaim = options.claim ?? 'last'

  const detachedTarget = shallowRef<HTMLElement | null>(null)

  const target = registry ? registry.elementFor(name) : detachedTarget
  const ready = computed(() => target.value != null)

  if (registry) {
    // Registration happens during setup, not on mount, for the ordering
    // reason: an arriving route component is created before the leaving one
    // is torn down, so setup-time registration is what lets `'last'` hand the
    // region to the arriving view on the same tick instead of flashing both.
    registry.register({
      id,
      name,
      order,
      claim,
      seq: nextSeq++,
      deactivated: false,
    })

    // Scope disposal rather than `onUnmounted`, so the contribution is also
    // released when the composable is used inside a manually created
    // `effectScope` with no component of its own.
    if (getCurrentScope()) {
      onScopeDispose(() => registry.unregister(id))
    }

    // `<KeepAlive>` does not dispose anything. A cached route component is
    // moved to an off-document container and left alive, so neither
    // `onUnmounted` nor `onScopeDispose` runs, and because a teleported subtree
    // does not live in the component's own DOM there is nothing for KeepAlive
    // to move: without these two hooks the leaving page's Save button stays in
    // the topbar of the page that replaced it, live and clickable. Suspending
    // rather than unregistering is what lets the entry come back with its
    // options intact, and re-stamping `seq` on the way back in makes the
    // returning page the newest claimant, which is what `claim: 'last'` means.
    if (getCurrentInstance()) {
      onDeactivated(() => registry.setActive(id, false))
      onActivated(() => registry.setActive(id, true))
    }
  }

  const activeIds = registry
    ? registry.activeIds(name)
    : (computed(() => []) as ComputedRef<number[]>)

  const active = computed(() => ready.value && activeIds.value.includes(id))

  const Outlet = defineComponent({
    name: 'NbShellSlotOutlet',
    inheritAttrs: false,
    setup(_props, { slots }) {
      return () => {
        const el = target.value
        if (!el || !active.value) return null
        const content = (slots.default?.() ?? []) as VNode[]
        // Only the shared claim needs the ordering wrapper. The default claim
        // is exclusive, so its content goes into the region bare and the DOM
        // is exactly what the view wrote.
        const children =
          claim === 'all'
            ? [
                h(
                  'div',
                  {
                    class: 'nb-shell-slot-contribution',
                    style: {
                      display: 'flex',
                      // Both inherited on purpose. The wrapper exists to carry
                      // an `order`, not to impose a layout: a region a product
                      // has set to `align-items: flex-start` must not have its
                      // contributions re-centred by a box it did not write.
                      // `inherit` is explicit here because neither property
                      // inherits on its own.
                      alignItems: 'inherit',
                      gap: 'inherit',
                      order,
                    },
                  },
                  content,
                ),
              ]
            : content
        // `disabled: false` is explicit because a Teleport whose target
        // disappears mid-life must not fall back to rendering in place: the
        // controls would land in the middle of the page body.
        return h(
          Teleport,
          { to: el, disabled: false },
          { default: () => children },
        )
      }
    },
  })

  return { id, name, target, ready, active, Outlet }
}

/**
 * Builds the registry side of the contract. Called by `NbShell`; exported so
 * the shell and the composable cannot drift apart, not as consumer API.
 */
export function createShellSlotRegistry(): {
  registry: IShellSlotRegistry
  /**
   * Reactive count of *live* contributors per region, for the shell's own
   * `v-if`. Deactivated (`<KeepAlive>`-cached) entries do not count, so a
   * topbar opened by a page that has since been cached closes again.
   */
  count: (name: TShellSlotName) => number
  /**
   * Reactive count of live `claim: 'all'` contributors per region. The shell
   * uses it to decide whether a block region needs to become a flex container
   * for the duration, which is the only way a CSS `order` can sort it.
   */
  sharedCount: (name: TShellSlotName) => number
  setElement: (name: TShellSlotName, el: HTMLElement | null) => void
} {
  const entries: Ref<IShellSlotEntry[]> = ref([])
  const elements = new Map<TShellSlotName, ShallowRef<HTMLElement | null>>()
  const activeCache = new Map<TShellSlotName, ComputedRef<number[]>>()

  function elementFor(name: TShellSlotName): ShallowRef<HTMLElement | null> {
    let el = elements.get(name)
    if (!el) {
      el = shallowRef<HTMLElement | null>(null)
      elements.set(name, el)
    }
    return el
  }

  function activeIds(name: TShellSlotName): ComputedRef<number[]> {
    let c = activeCache.get(name)
    if (!c) {
      c = computed(() => {
        const mine = entries.value.filter(
          (e) => e.name === name && !e.deactivated,
        )
        if (mine.length === 0) return []
        // A single `claim: 'last'` contributor is exclusive: if anything in
        // the region asked to be the only one, honour it and take the newest.
        // Mixing claims in one region is a consumer mistake, and this is the
        // reading that keeps the exclusive contract true.
        const exclusive = mine.some((e) => e.claim === 'last')
        if (exclusive) {
          let winner = mine[0]!
          for (const e of mine) if (e.seq > winner.seq) winner = e
          return [winner.id]
        }
        return [...mine]
          .sort((a, b) => a.order - b.order || a.seq - b.seq)
          .map((e) => e.id)
      })
      activeCache.set(name, c)
    }
    return c
  }

  return {
    registry: {
      register(entry) {
        entries.value = [...entries.value, entry]
      },
      unregister(id) {
        const next = entries.value.filter((e) => e.id !== id)
        if (next.length !== entries.value.length) entries.value = next
      },
      elementFor,
      activeIds,
      setActive(id, active) {
        // Mutated through the deep-reactive array so the computeds above see
        // it. Re-stamping `seq` on resume keeps `'last'` honest: the page the
        // user just navigated back to is the most recent claimant.
        const entry = entries.value.find((e) => e.id === id)
        if (!entry || entry.deactivated === !active) return
        entry.deactivated = !active
        if (active) entry.seq = nextSeq++
      },
    },
    count: (name) =>
      entries.value.filter((e) => e.name === name && !e.deactivated).length,
    sharedCount: (name) =>
      entries.value.filter(
        (e) => e.name === name && !e.deactivated && e.claim === 'all',
      ).length,
    setElement: (name, el) => {
      elementFor(name).value = el
    },
  }
}
