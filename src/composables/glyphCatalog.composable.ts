import { defineAsyncComponent, type Component } from 'vue'

/**
 * Runtime access to the full icon and flag catalogues.
 *
 * A catalogue is *opt-in*. `@nubisco/ui/icons/all` and `@nubisco/ui/flags/all`
 * publish a map of name to lazy loader on `globalThis` under a well-known
 * symbol; nothing else in the library imports them, so an app that never needs
 * a runtime-chosen glyph never links one. The compile-time plugin injects the
 * import into the file that needs it, and it can also be imported by hand:
 *
 * ```ts
 * import '@nubisco/ui/icons/all'   // an icon picker
 * import '@nubisco/ui/flags/all'   // a country selector
 * ```
 *
 * The symbol registry, rather than a shared module import, keeps the published
 * catalogue files at stable paths without tying them to a hashed chunk name,
 * and it keeps working if two copies of the library end up in one graph.
 */
export type TGlyphKind = 'icon' | 'flag'

export type TGlyphLoader = () => Promise<Record<string, Component>>

type TGlyphStore = Record<string, TGlyphLoader>

const storeKey = (kind: TGlyphKind) => Symbol.for(`@nubisco/ui:${kind}-catalog`)

function getStore(kind: TGlyphKind): TGlyphStore | undefined {
  return (globalThis as Record<symbol, TGlyphStore | undefined>)[storeKey(kind)]
}

/** True when the full catalogue for `kind` has been loaded into this page. */
export function hasCatalog(kind: TGlyphKind): boolean {
  return getStore(kind) !== undefined
}

/** Every name the loaded catalogue knows about, or `[]` if none is loaded. */
export function catalogNames(kind: TGlyphKind): string[] {
  return Object.keys(getStore(kind) ?? {})
}

const resolved = new Map<string, Component>()

/**
 * Resolve one glyph from the loaded catalogue.
 *
 * Throws when no catalogue is loaded at all: that is a wiring mistake (a
 * runtime-chosen name with neither the bundler plugin nor a manual
 * `icons/all` import), and it should fail on first render rather than leave a
 * hole in the page. Returns `undefined` when a catalogue *is* loaded but does
 * not know the name, which is a data problem, not a wiring one: a value that
 * came from an API can legitimately be wrong, and the caller reports it.
 */
export function resolveFromCatalog(
  kind: TGlyphKind,
  name: string,
  weight = 'regular',
): Component | undefined {
  const store = getStore(kind)
  if (!store) {
    const tag = kind === 'icon' ? 'Icon' : 'Flag'
    const plural = `${kind}s`
    throw new Error(
      `[@nubisco/ui] <Nb${tag}> was given the runtime-resolved name ` +
        `"${name}", but the ${kind} catalogue is not loaded. The name may ` +
        `also have been forwarded from another component's \`${kind}\` prop. ` +
        `Three ways out, cheapest first: pass a literal name so the bundler ` +
        `plugin links just that ${kind}; register the set the value can ` +
        `actually take with register${tag}s() and pay for only those; or, if ` +
        `the value is genuinely open-ended (a picker, a CMS field), import ` +
        `'@nubisco/ui/${plural}/all' in the file that needs the whole set.`,
    )
  }

  const loader = store[name]
  if (!loader) return undefined

  const cacheKey = `${kind}:${name}:${weight}`
  const hit = resolved.get(cacheKey)
  if (hit) return hit

  const component = defineAsyncComponent(async () => {
    const module = await loader()
    return (module[weight] ?? module.regular ?? module.default) as ReturnType<
      typeof defineAsyncComponent
    >
  })
  resolved.set(cacheKey, component)
  return component
}

/**
 * Pick one weight out of a glyph module (the namespace of
 * `@nubisco/ui/icons/<name>`), or pass a bare component straight through.
 */
export function pickWeight(
  glyph: Component | Record<string, Component>,
  weight = 'regular',
): Component | undefined {
  const asRecord = glyph as Record<string, Component | undefined>
  if (
    asRecord &&
    typeof asRecord === 'object' &&
    ('regular' in asRecord || weight in asRecord)
  ) {
    return asRecord[weight] ?? asRecord.regular ?? asRecord.default
  }
  return glyph as Component
}

/**
 * The catalogue name a glyph module (or a single weight of one) was generated
 * from.
 *
 * The compile-time plugin replaces a literal `name="check-circle"` with the
 * module itself, which would otherwise lose the name that `NbIcon` uses for
 * its identity class and its stable element id. Every generated glyph carries
 * its own name so nothing observable changes when a literal is linked.
 */
export function glyphNameOf(
  glyph: Component | Record<string, unknown> | undefined,
): string | undefined {
  if (!glyph) return undefined
  const asRecord = glyph as Record<string, unknown> & {
    glyphName?: string
    regular?: { glyphName?: string }
  }
  if (typeof asRecord.glyphName === 'string') return asRecord.glyphName
  if (typeof asRecord.regular?.glyphName === 'string') {
    return asRecord.regular.glyphName
  }
  return undefined
}

/** Test helper: drop the memoised async components. */
export function clearGlyphCache(): void {
  resolved.clear()
}
