import { Unfonts } from './vite/vendor.js'

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
 * - IBM Plex Sans: weights 300, 400, 600 (sans default)
 * - IBM Plex Mono: weights 400, 600 (mono default)
 *
 * These are the only weights the library uses: light for display and the
 * large headings, regular for body and titles from 20px up, semibold for the
 * small headings, labels that need it and emphasis. Medium (500) and bold
 * (700) are not loaded, because no component asks for them.
 *
 * Only `normal` styles are loaded. Every subset shipped by Fontsource is
 * imported, but each `@font-face` carries a `unicode-range`, so the browser
 * only downloads the subsets a page actually needs. `font-display: swap` is
 * baked into the Fontsource stylesheets.
 *
 * Consumers must install the source packages themselves:
 * `pnpm add -D @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono`.
 */
export const DEFAULT_FONTS: TFontsOptions = {
  fontsource: {
    families: [
      {
        name: 'IBM Plex Sans',
        weights: [300, 400, 600],
        styles: ['normal'],
      },
      {
        name: 'IBM Plex Mono',
        weights: [400, 600],
        styles: ['normal'],
      },
    ],
  },
}

/**
 * Vite plugin that loads NubiscoUI's typefaces.
 *
 * Called with no arguments it self-hosts the library defaults (IBM Plex Sans
 * + IBM Plex Mono) via Fontsource, keeping every existing consumer's output
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
