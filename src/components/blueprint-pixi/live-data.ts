// Non-reactive live-data channel for high-frequency blueprint visuals
// (wire levels, meters, port activity).
//
// The whole point: an audio host pushes values at ~60Hz, and routing those
// through Vue reactivity (computed wires, per-card meter components) is what
// pegs the CPU the DSP needs. This is a plain Map the host writes into with
// O(1), zero-reactivity calls; the PixiJS layer reads it on its own throttled
// render tick and draws everything in one batched GPU pass. A monotonically
// increasing `version` lets the renderer cheaply detect "new data since I last
// drew" without diffing, and lets it idle (no repaint, ~0 CPU) when the host
// stops writing.
export class BlueprintLiveData {
  private readonly values = new Map<string, number>()
  private epoch = 0

  /** Set by the renderer: woken on a write so it can schedule a (throttled)
   *  repaint without polling. Stays undefined for the DOM renderer. */
  onChange: (() => void) | undefined = undefined

  /** Set one value (0..1). Cheap; safe to call at audio-callback rate. */
  set(id: string, value: number): void {
    this.values.set(id, value)
    this.epoch++
    this.onChange?.()
  }

  /** Bulk-set from a plain record (e.g. an engine's per-tick level map). */
  setMany(record: Record<string, number>): void {
    for (const id in record) this.values.set(id, record[id]!)
    this.epoch++
    this.onChange?.()
  }

  /** Replace the whole set, dropping ids absent from `record`. */
  replace(record: Record<string, number>): void {
    this.values.clear()
    this.setMany(record)
  }

  get(id: string): number {
    return this.values.get(id) ?? 0
  }

  clear(): void {
    if (this.values.size === 0) return
    this.values.clear()
    this.epoch++
    this.onChange?.()
  }

  get size(): number {
    return this.values.size
  }

  /** Monotonic write counter; the renderer compares it to skip idle repaints. */
  get version(): number {
    return this.epoch
  }
}
