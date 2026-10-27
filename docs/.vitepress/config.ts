import { defineConfig } from 'vitepress'
import { writeLegacyRedirects } from './redirects'
import { sidebar } from './sidebar'
import svgLoader from 'vite-svg-loader'
import path from 'path'
import { tabsMarkdownPlugin } from './plugins/tabs/markdown'
import { withMermaid } from './plugins/mermaid'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { nubiscoGlyphs } from '../../src/plugins/vite/glyphs'
import { fonts } from '../../src/plugins/fonts'

export default withMermaid(
  defineConfig({
    title: 'Nubisco',
    description: 'Nubisco UI Documentation',
    // `_shared.md` holds the script and styles a split component page's tabs
    // include. It is a fragment, not a page.
    srcExclude: ['**/_*.md'],
    base: process.env.NODE_ENV === 'production' ? '/ui/' : '/',
    appearance: false,
    head: [
      ['link', { rel: 'icon', href: '/ui/favicon.ico', sizes: 'any' }],
      [
        'link',
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/ui/favicon-32x32.png',
        },
      ],
      [
        'link',
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/ui/favicon-16x16.png',
        },
      ],
      [
        'link',
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/ui/apple-touch-icon.png',
        },
      ],
      ['link', { rel: 'manifest', href: '/ui/site.webmanifest' }],
      ['meta', { name: 'theme-color', content: '#0d0d0f' }],
      [
        'script',
        {
          defer: '',
          src: 'https://analytics.nubisco.io/script.js',
        },
      ],
    ],
    markdown: {
      config(md) {
        md.use(tabsMarkdownPlugin)
        md.use(groupIconMdPlugin)
      },
    },
    vite: {
      plugins: [
        svgLoader({
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    convertPathData: false,
                    mergePaths: false,
                  },
                },
              },
            ],
          },
        }),
        groupIconVitePlugin(),
        nubiscoGlyphs({
          glyphRoot: path.resolve(__dirname, '../../generated'),
          catalog: 'off',
        }),
        fonts(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../../src'),
          // The docs build from source, so the published `@nubisco/ui/icons/*`
          // subpaths resolve to the generated modules the build would ship.
          '@nubisco/ui/icons': path.resolve(__dirname, '../../generated/icons'),
          '@nubisco/ui/flags': path.resolve(__dirname, '../../generated/flags'),
          // Same reason: these subpaths point at `dist`, which the docs build
          // does not produce, so they resolve to the source they are built
          // from instead.
          '@nubisco/composables': path.resolve(
            __dirname,
            '../../src/composables',
          ),
          '@nubisco/ui/utils': path.resolve(__dirname, '../../src/utils'),
        },
      },
      server: {
        fs: {
          // Allow serving files from the workspace root and project source
          allow: [
            path.resolve(__dirname, '../..'), // Project root (src, assets, node_modules)
          ],
        },
      },
      define: {
        __VUE_PROD_DEVTOOLS__: false,
      },
      ssr: {
        noExternal: [
          'vue',
          'vue-i18n',
          '@intlify/core-base',
          '@intlify/shared',
        ],
      },
      css: {
        preprocessorOptions: {
          scss: {
            // Force sass-embedded to use modern compiler API
            api: 'modern-compiler',
            // Alternatively, you can use 'modern' depending on your sass-embedded version
            // api: 'modern'
          },
        },
      },
    },
    themeConfig: {
      siteTitle: 'Nubisco UI',
      logo: { src: '/logo.svg', width: 24, height: 24 },
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Showcase', link: '/showcase' },
        { text: 'Theming', link: '/theming' },
        { text: 'Components', link: '/components/button/usage' },
      ],
      sidebar: { '/': sidebar },
      socialLinks: [{ icon: 'github', link: 'https://github.com/nubisco/ui' }],
      editLink: {
        pattern: 'https://github.com/nubisco/ui/edit/master/docs/:path',
        text: 'Edit this page on GitHub',
      },
      search: {
        provider: 'local',
      },
      lastUpdated: {
        text: 'Last updated',
      },
      footer: {
        message:
          'Released under the <a href="https://github.com/nubisco/ui/blob/master/LICENSE">MIT License</a>. · <a href="https://github.com/sponsors/joseporto">♥ Sponsor this project</a>',
        copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
      },
    },
    sitemap: {
      hostname: 'https://docs.nubisco.io/ui/',
    },

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
  }),
)
