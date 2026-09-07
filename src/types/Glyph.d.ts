import type { Component } from 'vue'

/**
 * Where a glyph comes from.
 *
 * A string is a name, resolved at runtime against the registered icons and
 * then the catalogue. Anything else is the artwork itself: either a single
 * component or the namespace of a glyph module (`@nubisco/ui/icons/<name>`,
 * whose exports are the six weights).
 *
 * Every prop that carries an icon or flag accepts both, which is what lets the
 * compile-time plugin rewrite a literal `icon="plus"` into a static import
 * without each forwarding component needing a second prop for it.
 */
export type TGlyphSource = string | Component | Record<string, Component>

export type TIconSource = TGlyphSource
export type TFlagSource = TGlyphSource
