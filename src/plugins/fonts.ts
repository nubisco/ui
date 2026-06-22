import Unfonts from 'unplugin-fonts/vite'

/**
 * Options accepted by {@link fonts}. This is the exact option object that
 * `unplugin-fonts` exposes, so any provider it supports (`fontsource`,
 * `custom`, `google`, `typekit`) can be configured here.
 */
export type TFontsOptions = NonNullable<Parameters<typeof Unfonts>[0]>

/**
 * Default font configuration for NubiscoUI.
 *
 * Self-hosted via the `fontsource` provider (RGPD-friendly, no third-party
 * CDN). These are the two families declared as the library defaults in
 * `src/styles/variables/_type.scss` (`--nb-font-family-sans` / `-mono`):
 *
 * - Plus Jakarta Sans: weights 400, 500, 600, 700 (sans default)
 * - Fira Code: weights 400, 600 (mono default)
 *
 * Only `normal` styles are loaded. Every subset shipped by Fontsource is
 * imported, but each `@font-face` carries a `unicode-range`, so the browser
 * only downloads the subsets a page actually needs. `font-display: swap` is
 * baked into the Fontsource stylesheets.
 *
 * Consumers must install the source packages themselves:
 * `pnpm add -D @fontsource/plus-jakarta-sans @fontsource/fira-code`.
 */
export const DEFAULT_FONTS: TFontsOptions = {
  fontsource: {
    families: [
      {
        name: 'Plus Jakarta Sans',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
      },
      {
        name: 'Fira Code',
        weights: [400, 600],
        styles: ['normal'],
      },
    ],
  },
}

/**
 * Vite plugin that loads NubiscoUI's typefaces.
 *
 * Called with no arguments it self-hosts the library defaults (Plus Jakarta
 * Sans + Fira Code) via Fontsource, keeping every existing consumer's output
 * unchanged. Pass an options object to fully replace that configuration: load
 * different families/weights, point the `custom` provider at your own woff2
 * files, or use any other provider `unplugin-fonts` supports.
 *
 * @example
 * // vite.config.ts (keep the NubiscoUI defaults)
 * import { fonts } from '@nubisco/ui/plugins/fonts'
 * export default defineConfig({ plugins: [fonts()] })
 *
 * @example
 * // bring your own families/weights
 * fonts({
 *   fontsource: {
 *     families: [
 *       { name: 'Inter', weights: [400, 600], styles: ['normal'] },
 *       { name: 'JetBrains Mono', weights: [400], styles: ['normal'] },
 *     ],
 *   },
 * })
 */
export const fonts = (options: TFontsOptions = DEFAULT_FONTS) =>
  Unfonts(options)
