import {
  computed,
  getCurrentInstance,
  inject,
  onMounted,
  provide,
  ref,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'

/**
 * The four visual depth levels of the layer system.
 *
 * 0 = page ground, 1 = panels and cards, 2 = nested sections,
 * 3 = overlays, popovers and modals (also the clamp ceiling).
 */
export type TLayerLevel = 0 | 1 | 2 | 3

/** Lowest layer level. */
export const NB_MIN_LAYER = 0

/** Highest layer level. Nesting past this repeats it rather than running out. */
export const NB_MAX_LAYER = 3

/**
 * Attribute stamped on every element that PAINTS a surface through this
 * mechanism. It is what tells the DOM probe apart a painted surface (children
 * go one level deeper) from a bare `.nb-layer-N` context class (children paint
 * exactly N, which is the pre-existing behaviour).
 */
export const NB_LAYER_ATTRIBUTE = 'data-nb-layer'

/**
 * Provided value is the level the NEXT surface below this point should paint,
 * mirroring the way Carbon's `LayerContext` carries the level of the next
 * `<Layer>` rather than the level of the current one. Absent means "nothing has
 * claimed a layer yet", which resolves to 1 and reproduces the `:root` default
 * of `--nb-c-surface`.
 */
export const NB_LAYER_INJECTION_KEY: InjectionKey<Readonly<Ref<TLayerLevel>>> =
  Symbol('nb-layer')

/** Clamps any number into the layer range. Non-finite input resolves to the floor. */
export function clampLayer(value: number): TLayerLevel {
  if (!Number.isFinite(value)) return NB_MIN_LAYER
  const rounded = Math.round(value)
  if (rounded < NB_MIN_LAYER) return NB_MIN_LAYER
  if (rounded > NB_MAX_LAYER) return NB_MAX_LAYER
  return rounded as TLayerLevel
}

/** The CSS class that pins an element and its subtree to an absolute layer. */
export function layerClassFor(level: TLayerLevel): string {
  return `nb-layer-${level}`
}

/**
 * Reads a `nb-layer-N` token out of any value Vue accepts for `class`
 * (string, array or object form). Returns the highest match so that a
 * conditional object form behaves predictably.
 */
function explicitLevelFromClass(value: unknown): TLayerLevel | null {
  let found: TLayerLevel | null = null

  const consider = (token: string) => {
    const match = /^nb-layer-([0-3])$/.exec(token.trim())
    if (!match) return
    const level = Number(match[1]) as TLayerLevel
    if (found === null || level > found) found = level
  }

  const walk = (input: unknown) => {
    if (typeof input === 'string') {
      for (const token of input.split(/\s+/)) consider(token)
      return
    }
    if (Array.isArray(input)) {
      for (const entry of input) walk(entry)
      return
    }
    if (input && typeof input === 'object') {
      for (const [key, enabled] of Object.entries(
        input as Record<string, unknown>,
      )) {
        if (enabled) consider(key)
      }
    }
  }

  walk(value)
  return found
}

/**
 * What the DOM probe found, and where.
 *
 * `class` means the nearest authority is a plain `.nb-layer-N` element written
 * by the application. Nothing in the component tree can see that, so it is
 * authoritative. `surface` means the nearest authority is another surface
 * painted by this mechanism, which already publishes its level through the
 * component tree, so the reactive context is preferred over the snapshot.
 */
export interface ILayerProbeResult {
  level: TLayerLevel
  source: 'class' | 'surface'
}

/**
 * Walks up the real DOM looking for the nearest layer authority.
 *
 * Stops at whichever comes first:
 * - an element stamped with `data-nb-layer` (a painted surface): one level
 *   deeper, clamped;
 * - an element carrying `.nb-layer-N` (a context class): exactly N, which is
 *   what that class has always meant.
 *
 * Returns null when neither is found. The probe is what makes an application's
 * hand-written `.nb-layer-N` wrapper keep working even though the component
 * tree cannot see it.
 */
export function probeLayerFromDom(
  start: Element | null,
): ILayerProbeResult | null {
  let node: Element | null = start?.parentElement ?? null

  while (node) {
    const painted = node.getAttribute(NB_LAYER_ATTRIBUTE)
    if (painted !== null) {
      const parsed = Number(painted)
      if (Number.isFinite(parsed)) {
        return { level: clampLayer(parsed + 1), source: 'surface' }
      }
    }

    const list = node.classList
    if (list) {
      for (let level = NB_MAX_LAYER; level >= NB_MIN_LAYER; level--) {
        if (list.contains(layerClassFor(level as TLayerLevel))) {
          return { level: level as TLayerLevel, source: 'class' }
        }
      }
    }

    node = node.parentElement
  }

  return null
}

export interface IUseSurfaceLayerOptions {
  /**
   * Force an absolute level, ignoring context. Equivalent to the consumer
   * writing `.nb-layer-N` by hand.
   */
  level?: MaybeRefOrGetter<TLayerLevel | undefined>
  /**
   * The surface is an overlay that leaves the document flow (a teleported
   * modal, menu or popover). It pins to the top layer instead of inheriting
   * the depth of whatever the teleport target happens to sit in, and it skips
   * the DOM probe for the same reason.
   */
  overlay?: boolean
  /**
   * Run the mount-time DOM probe. Defaults to true for in-flow surfaces and
   * false for overlays. Turn it off for surfaces rendered outside the document.
   */
  probe?: boolean
  /**
   * Element that actually paints the surface. Defaults to the component root.
   * Only used by the probe.
   */
  el?: Ref<Element | { $el?: Element } | null | undefined>
  /** Publish the resulting context to descendants. Defaults to true. */
  provideContext?: boolean
}

export interface IUseSurfaceLayerResult {
  /** The level this surface paints. */
  level: ComputedRef<TLayerLevel>
  /** `nb-layer-N` for the resolved level. */
  layerClass: ComputedRef<string>
  /** Bind on the painting element: the class plus the surface marker. */
  layerProps: ComputedRef<Record<string, string>>
  /** Optional template ref for the painting element when it is not the root. */
  surfaceRef: Ref<Element | { $el?: Element } | null | undefined>
}

function unwrapElement(
  value: Element | { $el?: Element } | null | undefined,
): Element | null {
  if (!value) return null
  if (value instanceof Element) return value
  const el = (value as { $el?: unknown }).$el
  return el instanceof Element ? el : null
}

/**
 * Read-only view of the current layer context, mirroring Carbon's `useLayer()`.
 * Returns the level the next surface below this point would paint.
 */
export function useLayer(): { level: ComputedRef<TLayerLevel> } {
  const context = inject(NB_LAYER_INJECTION_KEY, null)
  return { level: computed(() => context?.value ?? 1) }
}

/**
 * Derives the layer a surface-painting component should use from how deeply it
 * is nested, so applications never have to name a depth.
 *
 * Resolution order, strongest first:
 * 1. an explicit `level` option (a prop);
 * 2. an explicit `nb-layer-N` class on the component itself;
 * 3. the nearest layer authority found in the DOM at mount time;
 * 4. the injected context from the nearest enclosing surface;
 * 5. level 1, matching the `:root` default of `--nb-c-surface`.
 *
 * Steps 3 and 4 agree in every tree built purely out of these components; the
 * probe only changes the answer where an application has written a
 * `.nb-layer-N` container that provide/inject cannot see.
 */
export function useSurfaceLayer(
  options: IUseSurfaceLayerOptions = {},
): IUseSurfaceLayerResult {
  const instance = getCurrentInstance()
  const context = inject(NB_LAYER_INJECTION_KEY, null)
  const surfaceRef = (options.el ??
    ref<Element | null>(null)) as IUseSurfaceLayerResult['surfaceRef']

  const probed = ref<ILayerProbeResult | null>(null)
  const shouldProbe = options.probe ?? !options.overlay

  const explicit = computed<TLayerLevel | null>(() => {
    const fromOption = toValue(options.level)
    if (fromOption !== undefined) return clampLayer(fromOption)
    return explicitLevelFromClass(instance?.attrs?.class)
  })

  const level = computed<TLayerLevel>(() => {
    const forced = explicit.value
    if (forced !== null) return forced
    if (options.overlay) return NB_MAX_LAYER

    const found = probed.value
    if (found && found.source === 'class') return found.level
    if (context) return context.value
    if (found) return found.level
    return 1
  })

  if (shouldProbe) {
    onMounted(() => {
      const el =
        unwrapElement(surfaceRef.value) ??
        (instance?.vnode.el instanceof Element ? instance.vnode.el : null)
      probed.value = probeLayerFromDom(el)
    })
  }

  if (options.provideContext !== false) {
    const next = computed<TLayerLevel>(() => clampLayer(level.value + 1))
    provide(NB_LAYER_INJECTION_KEY, next)
  }

  return {
    level,
    layerClass: computed(() => layerClassFor(level.value)),
    layerProps: computed(() => ({
      class: layerClassFor(level.value),
      [NB_LAYER_ATTRIBUTE]: String(level.value),
    })),
    surfaceRef,
  }
}
