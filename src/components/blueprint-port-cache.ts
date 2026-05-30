// Self-healing DOM cache for NbBlueprint's port-element lookups.
//
// Background: rendering wires requires the from/to port HTMLElements to
// derive endpoint coordinates. The naive impl was `containerRef.value
// .querySelector('[data-port="<nodeId>:<portId>"]')` per port per wire
// per recompute. Profiling a stagewright back-canvas session at
// ~30 wires showed `querySelector` as the leaf in 58.7 % of CPU
// samples — recomputing wire paths on every pan/drag mousemove
// dwarfed everything else. This cache turns those O(N) lookups into
// O(1) hits after the first miss, and self-heals if a card unmounts.
//
// Invalidation:
//   - get() checks el.isConnected on every hit; a stale el (card
//     unmounted) is evicted and a fresh querySelector backs it.
//   - prune() drops all stale entries; call on a MutationObserver tick
//     so the cache shrinks instead of growing with every card swap.
//   - clear() empties the cache (e.g. on container unmount).
//
// The cache lives in the parent component's scope (call createPortCache
// inside <script setup>), so it dies with the component. Cards don't
// need to know about it; they keep their `data-port` attributes as
// before and the cache discovers them lazily.

export interface IPortCache {
  /**
   * Look up the HTMLElement for a port. Returns null if no element
   * matches in the container. On a hit it verifies the element is still
   * attached; a detached element is evicted and the lookup retried.
   */
  get(nodeId: string, portId: string): HTMLElement | null
  /**
   * Drop every cached entry whose element is no longer connected.
   * Cheap (single iteration of the map). Call after mutations that may
   * have removed cards (e.g. inside a MutationObserver).
   */
  prune(): void
  /** Empty the cache. */
  clear(): void
  /** Current cache size, exposed for tests. */
  size(): number
}

export function createPortCache(
  containerGetter: () => HTMLElement | null | undefined,
): IPortCache {
  const cache = new Map<string, HTMLElement>()

  function get(nodeId: string, portId: string): HTMLElement | null {
    const key = `${nodeId}:${portId}`
    const hit = cache.get(key)
    if (hit && hit.isConnected) return hit
    if (hit) cache.delete(key) // detached — fall through to fresh lookup
    const container = containerGetter()
    if (!container) return null
    const el = container.querySelector(
      `[data-port="${nodeId}:${portId}"]`,
    ) as HTMLElement | null
    if (el) cache.set(key, el)
    return el
  }

  function prune(): void {
    for (const [k, el] of cache) {
      if (!el.isConnected) cache.delete(k)
    }
  }

  function clear(): void {
    cache.clear()
  }

  function size(): number {
    return cache.size
  }

  return { get, prune, clear, size }
}
