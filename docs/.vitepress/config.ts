import { defineConfig } from 'vitepress'
import { writeLegacyRedirects } from './redirects'
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
        { text: 'Components', link: '/components/button/button' },
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
              { text: 'App theming', link: '/app-theming' },
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
                  { text: 'Accordion', link: '/components/accordion' },
                  { text: 'AI Label', link: '/components/ai-label' },
                  { text: 'Avatar', link: '/components/avatar' },
                  { text: 'Badge', link: '/components/badge' },
                  { text: 'Banner', link: '/components/banner' },
                  {
                    text: 'Blueprint',
                    items: [
                      {
                        text: 'Overview',
                        link: '/components/blueprint/overview',
                      },
                      {
                        text: 'Background',
                        link: '/components/blueprint/background',
                      },
                      { text: 'Card', link: '/components/blueprint/card' },
                      {
                        text: 'Controls',
                        link: '/components/blueprint/controls',
                      },
                      {
                        text: 'Minimap',
                        link: '/components/blueprint/minimap',
                      },
                    ],
                  },
                  { text: 'Board', link: '/components/board' },
                  {
                    text: 'Brand Marks',
                    link: '/components/nubisco-mark',
                  },
                  { text: 'Button', link: '/components/button/button' },
                  { text: 'Calendar', link: '/components/calendar' },
                  { text: 'Card Grid', link: '/components/card-grid' },
                  {
                    text: 'Charts',
                    items: [
                      {
                        text: 'Overview',
                        link: '/components/charts/overview',
                      },
                      { text: 'Bar', link: '/components/charts/bar' },
                      { text: 'Color', link: '/components/charts/color' },
                      { text: 'Gantt', link: '/components/charts/gantt' },
                      {
                        text: 'Interpolation',
                        link: '/components/charts/interpolation',
                      },
                      { text: 'Line', link: '/components/charts/line' },
                      { text: 'Pie', link: '/components/charts/pie' },
                      {
                        text: 'Sparkline',
                        link: '/components/charts/sparkline',
                      },
                    ],
                  },
                  { text: 'Checkbox', link: '/components/checkbox' },
                  { text: 'Color Strip', link: '/components/color-strip' },
                  {
                    text: 'Command Palette',
                    link: '/components/command-palette',
                  },
                  { text: 'Confirm', link: '/components/confirm' },
                  { text: 'Data Table', link: '/components/data-table' },
                  { text: 'Date Picker', link: '/components/date-picker' },
                  {
                    text: 'Definition List',
                    link: '/components/definition-list',
                  },
                  { text: 'Drag Handle', link: '/components/drag-handle' },
                  { text: 'Empty State', link: '/components/empty-state' },
                  { text: 'Field', link: '/components/field' },
                  {
                    text: 'File Uploader',
                    link: '/components/file-uploader',
                  },
                  { text: 'Flag', link: '/components/flag' },
                  {
                    text: 'Floating Toolbar',
                    link: '/components/floating-toolbar',
                  },
                  { text: 'Grid', link: '/components/grid' },
                  { text: 'Icon', link: '/components/icon' },
                  {
                    text: 'Image Cropper',
                    link: '/components/image-cropper',
                  },
                  { text: 'Info Hint', link: '/components/info-hint' },
                  {
                    text: 'Inline Edit',
                    link: '/components/inline-edit',
                  },
                  {
                    text: 'Inline Loading',
                    link: '/components/inline-loading',
                  },
                  { text: 'JSON Tree', link: '/components/json-tree' },
                  { text: 'Label', link: '/components/label' },
                  { text: 'Menu', link: '/components/menu' },
                  { text: 'Menu Bar', link: '/components/menu-bar' },
                  { text: 'Message', link: '/components/message' },
                  { text: 'Modal', link: '/components/modal' },
                  {
                    text: 'Notification Center',
                    link: '/components/notification-center',
                  },
                  { text: 'Number Input', link: '/components/number-input' },
                  { text: 'Pagination', link: '/components/pagination' },
                  { text: 'Panel', link: '/components/panel' },
                  {
                    text: 'Progress Bar',
                    link: '/components/progress-bar',
                  },
                  { text: 'Radio', link: '/components/radio' },
                  { text: 'Reorder List', link: '/components/reorder-list' },
                  { text: 'Select', link: '/components/select' },
                  { text: 'Shell', link: '/components/shell' },
                  { text: 'Shell Panel', link: '/components/shell-panel' },
                  {
                    text: 'Sidebar Collapse Toggle',
                    link: '/components/sidebar-collapse-toggle',
                  },
                  { text: 'Skeleton', link: '/components/skeleton' },
                  { text: 'Slider', link: '/components/slider' },
                  { text: 'Spinner', link: '/components/spinner' },
                  { text: 'Stepper', link: '/components/stepper' },
                  { text: 'Switch', link: '/components/switch' },
                  {
                    text: 'Table of Contents',
                    link: '/components/table-of-contents',
                  },
                  { text: 'Tabs', link: '/components/tabs' },
                  { text: 'Text Input', link: '/components/text-input' },
                  { text: 'Toast', link: '/components/toast' },
                  { text: 'Toaster', link: '/components/toaster' },
                  { text: 'Tree', link: '/components/tree' },
                  { text: 'User Menu', link: '/components/user-menu' },
                  { text: 'Walkthrough', link: '/components/walkthrough' },
                ],
              },
              {
                text: 'Composables',
                items: [
                  {
                    text: 'useCommandPalette',
                    link: '/composables/use-command-palette',
                  },
                  {
                    text: 'useConfirm',
                    link: '/composables/use-confirm',
                  },
                  {
                    text: 'useContextMenu',
                    link: '/composables/use-context-menu',
                  },
                  {
                    text: 'useWalkthrough',
                    link: '/composables/use-walkthrough',
                  },
                  {
                    text: 'useShellSlot',
                    link: '/composables/use-shell-slot',
                  },
                  {
                    text: 'useSidebarVariant',
                    link: '/composables/use-sidebar-variant',
                  },
                  {
                    text: 'useStableId',
                    link: '/composables/use-stable-id',
                  },
                  {
                    text: 'useTheme',
                    link: '/composables/use-theme',
                  },
                  {
                    text: 'useToast',
                    link: '/composables/use-toast',
                  },
                ],
              },
              {
                text: 'Directives',
                items: [
                  { text: 'Tooltip', link: '/directives/tooltip' },
                  { text: 'Tour Step', link: '/directives/tour-step' },
                ],
              },
            ],
          },
          {
            text: 'Labs',
            collapsed: false,
            items: [{ text: 'Spreadsheet', link: '/labs/spreadsheet' }],
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

    /**
     * The component docs used to live in docs/ui/, under a site whose base is
     * already /ui/, so every page was published twice-prefixed
     * (/ui/ui/components/badge.html). They now sit where the sidebar always
     * said they were. GitHub Pages cannot issue a 301, so the old paths keep a
     * stub that points at the new one; see redirects.ts. Temporary, and safe to
     * delete once Search Console reports the doubled URLs gone.
     */
    buildEnd(siteConfig) {
      const n = writeLegacyRedirects(
        siteConfig.outDir,
        siteConfig.site.base,
        siteConfig.srcDir,
      )
      console.log(`[redirects] wrote ${n} stub(s) for the old /ui/ui/ paths`)
    },
  }),
)
