/**
 * Shared `computed` block for the `NbIcon` / `NbFlag` stubs the specs mount.
 *
 * `name` is no longer always a string. The compile-time plugin rewrites a
 * literal `name="check-circle"` into a static import of that one glyph module,
 * so what reaches the component is the module; every generated glyph carries
 * its own `glyphName`, which is how the real NbIcon still derives its identity
 * class. The stubs mirror that so `data-name` assertions keep meaning the same
 * thing whether a spec passes a name or the plugin passed a module.
 */
export const glyphStubComputed = {
  resolvedName(this: { name?: unknown; icon?: unknown; flag?: unknown }) {
    const source = this.icon ?? this.flag ?? this.name
    if (typeof source === 'string') return source
    const glyph = source as
      | { glyphName?: string; regular?: { glyphName?: string } }
      | undefined
    return glyph?.glyphName ?? glyph?.regular?.glyphName
  },
}
