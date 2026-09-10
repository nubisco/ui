import { defineConfig } from 'vitepress'
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
          '@nubisco/ui/composables': path.resolve(
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
        { text: 'Components', link: '/ui/components/button/button' },
      ],
      sidebar: {
        '/': [
          {
            text: 'Getting Started',
            items: [
              { text: 'Quickstart', link: '/quickstart' },
              { text: 'What ships in your bundle', link: '/bundling' },
              { text: 'Showcase', link: '/showcase' },
              { text: 'Upgrading', link: '/upgrading' },
            ],
          },
          {
            text: 'Why NubiscoUI',
            items: [{ text: 'Introduction', link: '/introduction' }],
          },
          {
            text: 'Theming',
            items: [
              /*
               * `/theme-builder` is deliberately NOT linked here yet.
               *
               * The page works and is tested end to end, but its flow needs
               * design work before it is put in front of readers: it presents
               * the palette, the role mapping and the contrast report all at
               * once, with no sequence to follow. It stays reachable by URL so
               * that work can continue against a real page.
               */
              { text: 'Overview', link: '/theming' },
              { text: 'Colors', link: '/principles/color' },
              { text: 'Typography', link: '/principles/typography' },
            ],
          },
          {
            text: 'Design System',
            items: [
              { text: 'Design Tokens', link: '/design-tokens' },
              { text: 'Layout and breakpoints', link: '/principles/layout' },
              { text: 'Spacing and rhythm', link: '/principles/spacing' },
              { text: 'Motion', link: '/principles/motion' },
              {
                text: 'Data visualisation',
                link: '/principles/data-visualisation',
              },
              { text: 'Z-Index', link: '/principles/z-index' },
            ],
          },
          {
            text: 'Patterns',
            items: [
              {
                text: 'Team management',
                link: '/patterns/team-management',
              },
              { text: 'The app frame', link: '/patterns/app-frame' },
              {
                text: 'Dialogs and confirmation',
                link: '/patterns/dialogs',
              },
              { text: 'Building a form', link: '/patterns/forms' },
              { text: 'Empty states', link: '/patterns/empty-states' },
              { text: 'Loading and progress', link: '/patterns/loading' },
              { text: 'Notifications', link: '/patterns/notifications' },
              { text: 'Building an inspector', link: '/patterns/inspectors' },
              {
                text: 'Status indicators',
                link: '/patterns/status-indicators',
              },
              {
                text: 'Disabled and read-only',
                link: '/patterns/disabled-and-read-only',
              },
            ],
          },
          {
            text: 'Content',
            items: [{ text: 'Writing style', link: '/content/writing-style' }],
          },
          {
            text: 'Accessibility',
            items: [
              { text: 'Overview', link: '/accessibility/overview' },
              { text: 'Keyboard interaction', link: '/accessibility/keyboard' },
              {
                text: 'Colour and contrast',
                link: '/accessibility/color-contrast',
              },
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
                  { text: 'Accordion', link: '/ui/components/accordion' },
                  { text: 'AI Label', link: '/ui/components/ai-label' },
                  { text: 'Badge', link: '/ui/components/badge' },
                  { text: 'Banner', link: '/ui/components/banner' },
                  {
                    text: 'Blueprint',
                    items: [
                      {
                        text: 'Overview',
                        link: '/ui/components/blueprint/overview',
                      },
                      {
                        text: 'Background',
                        link: '/ui/components/blueprint/background',
                      },
                      { text: 'Card', link: '/ui/components/blueprint/card' },
                      {
                        text: 'Controls',
                        link: '/ui/components/blueprint/controls',
                      },
                      {
                        text: 'Minimap',
                        link: '/ui/components/blueprint/minimap',
                      },
                    ],
                  },
                  { text: 'Board', link: '/ui/components/board' },
                  {
                    text: 'Brand Marks',
                    link: '/ui/components/nubisco-mark',
                  },
                  { text: 'Button', link: '/ui/components/button/button' },
                  { text: 'Calendar', link: '/ui/components/calendar' },
                  { text: 'Card Grid', link: '/ui/components/card-grid' },
                  {
                    text: 'Charts',
                    items: [
                      {
                        text: 'Overview',
                        link: '/ui/components/charts/overview',
                      },
                      { text: 'Bar', link: '/ui/components/charts/bar' },
                      { text: 'Color', link: '/ui/components/charts/color' },
                      { text: 'Gantt', link: '/ui/components/charts/gantt' },
                      {
                        text: 'Interpolation',
                        link: '/ui/components/charts/interpolation',
                      },
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
                    text: 'Command Palette',
                    link: '/ui/components/command-palette',
                  },
                  { text: 'Confirm', link: '/ui/components/confirm' },
                  { text: 'Data Table', link: '/ui/components/data-table' },
                  { text: 'Date Picker', link: '/ui/components/date-picker' },
                  {
                    text: 'Definition List',
                    link: '/ui/components/definition-list',
                  },
                  { text: 'Empty State', link: '/ui/components/empty-state' },
                  { text: 'Field', link: '/ui/components/field' },
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
                  { text: 'Info Hint', link: '/ui/components/info-hint' },
                  {
                    text: 'Inline Edit',
                    link: '/ui/components/inline-edit',
                  },
                  {
                    text: 'Inline Loading',
                    link: '/ui/components/inline-loading',
                  },
                  { text: 'JSON Tree', link: '/ui/components/json-tree' },
                  { text: 'Label', link: '/ui/components/label' },
                  { text: 'Menu', link: '/ui/components/menu' },
                  { text: 'Menu Bar', link: '/ui/components/menu-bar' },
                  { text: 'Message', link: '/ui/components/message' },
                  { text: 'Modal', link: '/ui/components/modal' },
                  {
                    text: 'Notification Center',
                    link: '/ui/components/notification-center',
                  },
                  { text: 'Number Input', link: '/ui/components/number-input' },
                  { text: 'Pagination', link: '/ui/components/pagination' },
                  { text: 'Panel', link: '/ui/components/panel' },
                  {
                    text: 'Progress Bar',
                    link: '/ui/components/progress-bar',
                  },
                  { text: 'Radio', link: '/ui/components/radio' },
                  { text: 'Reorder List', link: '/ui/components/reorder-list' },
                  { text: 'Select', link: '/ui/components/select' },
                  { text: 'Shell', link: '/ui/components/shell' },
                  { text: 'Shell Panel', link: '/ui/components/shell-panel' },
                  { text: 'Skeleton', link: '/ui/components/skeleton' },
                  { text: 'Slider', link: '/ui/components/slider' },
                  { text: 'Spinner', link: '/ui/components/spinner' },
                  { text: 'Stepper', link: '/ui/components/stepper' },
                  { text: 'Switch', link: '/ui/components/switch' },
                  { text: 'Tabs', link: '/ui/components/tabs' },
                  { text: 'Text Input', link: '/ui/components/text-input' },
                  { text: 'Toast', link: '/ui/components/toast' },
                  { text: 'Toaster', link: '/ui/components/toaster' },
                  { text: 'Tree', link: '/ui/components/tree' },
                  { text: 'User Menu', link: '/ui/components/user-menu' },
                  { text: 'Walkthrough', link: '/ui/components/walkthrough' },
                ],
              },
              {
                text: 'Composables',
                items: [
                  {
                    text: 'useCommandPalette',
                    link: '/ui/composables/use-command-palette',
                  },
                  {
                    text: 'useConfirm',
                    link: '/ui/composables/use-confirm',
                  },
                  {
                    text: 'useContextMenu',
                    link: '/ui/composables/use-context-menu',
                  },
                  {
                    text: 'useWalkthrough',
                    link: '/ui/composables/use-walkthrough',
                  },
                  {
                    text: 'useShellSlot',
                    link: '/ui/composables/use-shell-slot',
                  },
                  {
                    text: 'useStableId',
                    link: '/ui/composables/use-stable-id',
                  },
                  {
                    text: 'useTheme',
                    link: '/ui/composables/use-theme',
                  },
                  {
                    text: 'useToast',
                    link: '/ui/composables/use-toast',
                  },
                ],
              },
              {
                text: 'Directives',
                items: [
                  { text: 'Tooltip', link: '/ui/directives/tooltip' },
                  { text: 'Tour Step', link: '/ui/directives/tour-step' },
                ],
              },
            ],
          },
          {
            text: 'Labs',
            collapsed: false,
            items: [{ text: 'Spreadsheet', link: '/ui/labs/spreadsheet' }],
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
        copyright: 'Copyright © 2026 <a href="https://nubisco.io">Nubisco</a>',
      },
    },
    sitemap: {
      hostname: 'https://docs.nubisco.io/ui/',
    },
  }),
)
