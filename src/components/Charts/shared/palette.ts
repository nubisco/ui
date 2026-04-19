// Categorical palette used as the default series colors across all charts.
// Values reference the design-system CSS variables so theme changes (light/dark,
// brand overrides) propagate automatically, SVG `fill` and `stroke` accept
// `var(--token)` in all modern browsers.
const DEFAULT_PALETTE: string[] = [
  'var(--nb-c-grape-hyacinth-500)',
  'var(--nb-c-the-blues-brothers-500)',
  'var(--nb-c-emerald-reflection-600)',
  'var(--nb-c-phoenix-flames-500)',
  'var(--nb-c-chicken-comb-500)',
  'var(--nb-c-liberty-blue-500)',
  'var(--nb-c-powder-blue-500)',
  'var(--nb-c-nouveau-gray-500)',
]

const colorAt = (index: number, palette: string[] = DEFAULT_PALETTE): string =>
  palette[index % palette.length]

export { DEFAULT_PALETTE, colorAt }
