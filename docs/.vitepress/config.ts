import { defineConfig } from 'vitepress'
import svgLoader from 'vite-svg-loader'
import path from 'path'
import { tabsMarkdownPlugin } from './plugins/tabs/markdown'
import { withMermaid } from './plugins/mermaid'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { icons } from '../../src/plugins/icons'
import { flags } from '../../src/plugins/flags'
import { fonts } from '../../src/plugins/fonts'

export default withMermaid(
  defineConfig({
    title: 'Nubisco',
    description: 'Nubisco UI Documentation',
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
        icons(path.resolve(__dirname, '../..')),
        flags(path.resolve(__dirname, '../..')),
        fonts(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../../src'),
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
        { text: 'Components', link: '/ui/components/button/button' },
      ],
      sidebar: {
        '/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Quickstart', link: '/quickstart' },
              { text: 'Showcase', link: '/showcase' },
            ],
          },
          {
            text: 'Why NubiscoUI',
            items: [{ text: 'Introduction', link: '/introduction' }],
          },
          {
            text: 'Theming',
            items: [
              { text: 'Overview', link: '/theming' },
              { text: 'Colors', link: '/principles/color' },
              { text: 'Typography', link: '/principles/typography' },
            ],
          },
          {
            text: 'Design System',
            items: [
              { text: 'Design Tokens', link: '/design-tokens' },
              { text: 'Z-Index', link: '/principles/z-index' },
            ],
          },
          {
            text: 'Code Conventions',
            items: [
              { text: 'Types, Interfaces & Enums', link: '/conventions/types' },
            ],
          },
          {
            text: 'UI Library',
            items: [
              {
                text: 'Components',
                items: [
                  { text: 'AI Label', link: '/ui/components/ai-label' },
                  { text: 'Badge', link: '/ui/components/badge' },
                  { text: 'Button', link: '/ui/components/button/button' },
                  {
                    text: 'Charts',
                    items: [
                      {
                        text: 'Overview',
                        link: '/ui/components/charts/overview',
                      },
                      { text: 'Bar', link: '/ui/components/charts/bar' },
                      { text: 'Line', link: '/ui/components/charts/line' },
                      { text: 'Pie', link: '/ui/components/charts/pie' },
                      {
                        text: 'Sparkline',
                        link: '/ui/components/charts/sparkline',
                      },
                    ],
                  },
                  { text: 'Checkbox', link: '/ui/components/checkbox' },
                  { text: 'Color Strip', link: '/ui/components/color-strip' },
                  {
                    text: 'File Uploader',
                    link: '/ui/components/file-uploader',
                  },
                  { text: 'Flag', link: '/ui/components/flag' },
                  { text: 'Grid', link: '/ui/components/grid' },
                  { text: 'Icon', link: '/ui/components/icon' },
                  {
                    text: 'Image Cropper',
                    link: '/ui/components/image-cropper',
                  },
                  { text: 'JSON Tree', link: '/ui/components/json-tree' },
                  { text: 'Label', link: '/ui/components/label' },
                  { text: 'Message', link: '/ui/components/message' },
                  { text: 'Modal', link: '/ui/components/modal' },
                  { text: 'Number Input', link: '/ui/components/number-input' },
                  { text: 'Panel', link: '/ui/components/panel' },
                  { text: 'Radio', link: '/ui/components/radio' },
                  { text: 'Select', link: '/ui/components/select' },
                  { text: 'Shell', link: '/ui/components/shell' },
                  { text: 'Slider', link: '/ui/components/slider' },
                  { text: 'Switch', link: '/ui/components/switch' },
                  { text: 'Text Input', link: '/ui/components/text-input' },
                  { text: 'Toast', link: '/ui/components/toast' },
                ],
              },
              {
                text: 'Composables',
                items: [
                  {
                    text: 'useStableId',
                    link: '/ui/composables/use-stable-id',
                  },
                ],
              },
              {
                text: 'Directives',
                items: [{ text: 'Tooltip', link: '/ui/directives/tooltip' }],
              },
            ],
          },
        ],
      },
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
        copyright:
          'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a> · Inspired by <a href="https://carbondesignsystem.com" target="_blank" rel="noopener">IBM Carbon Design System</a>',
      },
    },
    sitemap: {
      hostname: 'https://docs.nubisco.io/ui/',
    },
  }),
)
