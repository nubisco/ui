import path from 'path'
import { defineNubiscoDocs } from '@nubisco/docs-sdk'
import { writeLegacyRedirects } from './redirects'
import { sidebar } from './sidebar'
import { nubiscoGlyphs } from '../../src/plugins/vite/glyphs'

const root = path.resolve(__dirname, '../..')

/**
 * The component library's own documentation. The design, the plugins and
 * VitePress come from `@nubisco/docs-sdk`, as they do for every product. What
 * is left here is what only the library needs: it builds its docs from source,
 * registers every component globally and keeps the Square and Round switch.
 */
export default defineNubiscoDocs({
  title: 'Nubisco',
  description: 'Nubisco UI Documentation',
  base: process.env.NODE_ENV === 'production' ? '/ui/' : '/',
  hostname: 'https://docs.nubisco.io/ui/',
  repo: 'nubisco/ui',
  logo: '/logo.svg',
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Showcase', link: '/showcase' },
    { text: 'Theming', link: '/theming' },
    { text: 'Components', link: '/components/button/usage' },
  ],
  sidebar: { '/': sidebar },
  footer: {
    message:
      'Released under the <a href="https://github.com/nubisco/ui/blob/master/LICENSE">MIT License</a>. · <a href="https://github.com/sponsors/joseporto">♥ Sponsor this project</a>',
    copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
  },
  // The Square and Round switch is the library's own.
  appearanceControl: true,
  // Every demo names components in Markdown, and the docs register them all.
  libraryPlugin: false,
  vitepress: {
    themeConfig: { siteTitle: 'Nubisco UI' },

    /**
     * Stubs for pages that moved: the old twice-prefixed /ui/ui/ paths, and
     * each component page that is now split into one route per tab
     * (/components/x.html to /components/x/usage.html, /code.html, ...).
     * GitHub Pages cannot issue a 301, so the old paths keep a stub that
     * points at the new one; see redirects.ts.
     */
    buildEnd(siteConfig) {
      const n = writeLegacyRedirects(
        siteConfig.outDir,
        siteConfig.site.base,
        siteConfig.srcDir,
      )
      console.log(`[redirects] wrote ${n} stub(s) for moved pages`)
    },
    vite: {
      plugins: [
        nubiscoGlyphs({
          glyphRoot: path.resolve(root, 'generated'),
          catalog: 'off',
        }),
      ],
      resolve: {
        // The docs build from source, so everything the theme and the demos
        // import from `@nubisco/ui` resolves to the source it is built from,
        // and there is exactly one copy of the components and their state.
        // Specific subpaths first: the first match wins.
        alias: [
          // Per-component imports (`@nubisco/ui/components/Badge`) point at the
          // single-file component the published module is built from.
          {
            find: /^@nubisco\/ui\/components\/(.*)$/,
            replacement: path.resolve(root, 'src/components/$1.vue'),
          },
          {
            find: '@nubisco/ui/icons',
            replacement: path.resolve(root, 'generated/icons'),
          },
          {
            find: '@nubisco/ui/flags',
            replacement: path.resolve(root, 'generated/flags'),
          },
          {
            find: '@nubisco/ui/composables',
            replacement: path.resolve(root, 'src/composables'),
          },
          {
            find: '@nubisco/ui/utils',
            replacement: path.resolve(root, 'src/utils'),
          },
          {
            find: '@nubisco/ui/variables',
            replacement: path.resolve(root, 'src/styles/variables'),
          },
          {
            find: '@nubisco/ui/styles',
            replacement: path.resolve(root, 'src/styles/index.scss'),
          },
          {
            find: '@nubisco/composables',
            replacement: path.resolve(root, 'src/composables'),
          },
          {
            find: /^@nubisco\/ui$/,
            replacement: path.resolve(root, 'src/main.ts'),
          },
          { find: '@', replacement: path.resolve(root, 'src') },
        ],
      },
      server: {
        // Allow serving files from the project root (src, assets, node_modules)
        fs: { allow: [root] },
      },
      define: { __VUE_PROD_DEVTOOLS__: false },
      ssr: {
        noExternal: ['vue-i18n', '@intlify/core-base', '@intlify/shared'],
      },
    },
  },
})
