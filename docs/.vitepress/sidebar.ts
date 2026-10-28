import type { DefaultTheme } from 'vitepress'

/**
 * The left navigation, grouped the way Carbon groups its own: getting
 * started, the foundations every component is built from, the components
 * themselves (one flat, alphabetical list, the way a reader looks one up),
 * then the composables and directives that sit beside them, the patterns that
 * combine them, and the cross-cutting guidelines.
 *
 * A component's entry links its Usage tab. The navigation treats every tab
 * of that page as the same entry, so it stays highlighted on Code and
 * Accessibility too.
 */
export const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting started',
    items: [
      { text: 'Introduction', link: '/introduction' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'What ships in your bundle', link: '/bundling' },
      { text: 'Upgrading', link: '/upgrading' },
      { text: 'Showcase', link: '/showcase' },
    ],
  },
  {
    text: 'Foundations',
    items: [
      /*
       * `/theme-builder` is deliberately NOT linked here yet.
       *
       * The page works and is tested end to end, but its flow needs design
       * work before it is put in front of readers: it presents the palette,
       * the role mapping and the contrast report all at once, with no
       * sequence to follow. It stays reachable by URL so that work can
       * continue against a real page.
       */
      { text: 'Theming', link: '/theming' },
      { text: 'App theming', link: '/app-theming' },
      { text: 'Colors', link: '/principles/color' },
      { text: 'Typography', link: '/principles/typography' },
      { text: 'Design Tokens', link: '/design-tokens' },
      { text: 'Layout and breakpoints', link: '/principles/layout' },
      { text: 'Spacing and rhythm', link: '/principles/spacing' },
      { text: 'Motion', link: '/principles/motion' },
      { text: 'Data visualisation', link: '/principles/data-visualisation' },
      { text: 'Z-Index', link: '/principles/z-index' },
    ],
  },
  {
    text: 'Components',
    items: [
      { text: 'Accordion', link: '/components/accordion/usage' },
      { text: 'Action Group', link: '/components/action-group/usage' },
      { text: 'AI Briefings', link: '/components/ai-briefings/usage' },
      { text: 'AI Label', link: '/components/ai-label/usage' },
      { text: 'Avatar', link: '/components/avatar/usage' },
      { text: 'Back To Top', link: '/components/back-to-top/usage' },
      { text: 'Badge', link: '/components/badge/usage' },
      { text: 'Banner', link: '/components/banner/usage' },
      {
        text: 'Blueprint',
        items: [
          { text: 'Overview', link: '/components/blueprint/usage' },
          {
            text: 'Background',
            link: '/components/blueprint/background/usage',
          },
          { text: 'Card', link: '/components/blueprint/card/usage' },
          { text: 'Controls', link: '/components/blueprint/controls/usage' },
          { text: 'Minimap', link: '/components/blueprint/minimap/usage' },
        ],
      },
      { text: 'Board', link: '/components/board/usage' },
      { text: 'Brand Marks', link: '/components/nubisco-mark/usage' },
      { text: 'Button', link: '/components/button/usage' },
      { text: 'Calendar', link: '/components/calendar/usage' },
      { text: 'Card Grid', link: '/components/card-grid/usage' },
      {
        text: 'Charts',
        items: [
          { text: 'Overview', link: '/components/charts/overview' },
          { text: 'Bar', link: '/components/charts/bar/usage' },
          { text: 'Color', link: '/components/charts/color/usage' },
          { text: 'Gantt', link: '/components/charts/gantt/usage' },
          {
            text: 'Interpolation',
            link: '/components/charts/interpolation/usage',
          },
          { text: 'Line', link: '/components/charts/line/usage' },
          { text: 'Pie', link: '/components/charts/pie/usage' },
          { text: 'Sparkline', link: '/components/charts/sparkline/usage' },
        ],
      },
      { text: 'Checkbox', link: '/components/checkbox/usage' },
      { text: 'Color Strip', link: '/components/color-strip/usage' },
      { text: 'Command Palette', link: '/components/command-palette/usage' },
      { text: 'Confirm', link: '/components/confirm/usage' },
      { text: 'Copy Button', link: '/components/copy-button/usage' },
      { text: 'Data Table', link: '/components/data-table/usage' },
      { text: 'Date Picker', link: '/components/date-picker/usage' },
      { text: 'Definition List', link: '/components/definition-list/usage' },
      { text: 'Drag Handle', link: '/components/drag-handle/usage' },
      { text: 'Empty State', link: '/components/empty-state/usage' },
      { text: 'Field', link: '/components/field/usage' },
      { text: 'File Uploader', link: '/components/file-uploader/usage' },
      { text: 'Flag', link: '/components/flag/usage' },
      { text: 'Floating Toolbar', link: '/components/floating-toolbar/usage' },
      { text: 'Grid', link: '/components/grid/usage' },
      { text: 'Icon', link: '/components/icon/usage' },
      { text: 'Image Cropper', link: '/components/image-cropper/usage' },
      { text: 'Image Picker', link: '/components/image-picker/usage' },
      { text: 'Info Hint', link: '/components/info-hint/usage' },
      { text: 'Inline Edit', link: '/components/inline-edit/usage' },
      { text: 'Inline Loading', link: '/components/inline-loading/usage' },
      { text: 'JSON Tree', link: '/components/json-tree/usage' },
      { text: 'Label', link: '/components/label/usage' },
      { text: 'Menu', link: '/components/menu/usage' },
      { text: 'Menu Bar', link: '/components/menu-bar/usage' },
      { text: 'Message', link: '/components/message/usage' },
      { text: 'Modal', link: '/components/modal/usage' },
      {
        text: 'Notification Center',
        link: '/components/notification-center/usage',
      },
      { text: 'Number Input', link: '/components/number-input/usage' },
      { text: 'Pagination', link: '/components/pagination/usage' },
      { text: 'Panel', link: '/components/panel/usage' },
      { text: 'Progress Bar', link: '/components/progress-bar/usage' },
      { text: 'Radio', link: '/components/radio/usage' },
      { text: 'Reorder List', link: '/components/reorder-list/usage' },
      { text: 'Select', link: '/components/select/usage' },
      { text: 'Shell', link: '/components/shell/usage' },
      { text: 'Shell Panel', link: '/components/shell-panel/usage' },
      {
        text: 'Sidebar Collapse Toggle',
        link: '/components/sidebar-collapse-toggle/usage',
      },
      {
        text: 'Sidebar Header Toggle',
        link: '/components/sidebar-header-toggle/usage',
      },
      { text: 'Sidebar Status', link: '/components/sidebar-status/usage' },
      { text: 'Skeleton', link: '/components/skeleton/usage' },
      { text: 'Slider', link: '/components/slider/usage' },
      { text: 'Spinner', link: '/components/spinner/usage' },
      { text: 'Stat', link: '/components/stat/usage' },
      { text: 'Stepper', link: '/components/stepper/usage' },
      { text: 'Suggestion List', link: '/components/suggestion-list/usage' },
      { text: 'Switch', link: '/components/switch/usage' },
      {
        text: 'Table of Contents',
        link: '/components/table-of-contents/usage',
      },
      { text: 'Tabs', link: '/components/tabs/usage' },
      { text: 'Text Input', link: '/components/text-input/usage' },
      { text: 'Toast', link: '/components/toast/usage' },
      { text: 'Toaster', link: '/components/toaster/usage' },
      { text: 'Tree', link: '/components/tree/usage' },
      { text: 'User Menu', link: '/components/user-menu/usage' },
      { text: 'Video', link: '/components/video/usage' },
      { text: 'Walkthrough', link: '/components/walkthrough/usage' },
      { text: 'Wireframe', link: '/components/wireframe/usage' },
    ],
  },
  {
    text: 'Composables',
    items: [
      { text: 'useCommandPalette', link: '/composables/use-command-palette' },
      { text: 'useConfirm', link: '/composables/use-confirm' },
      { text: 'useContextMenu', link: '/composables/use-context-menu' },
      { text: 'useShellSlot', link: '/composables/use-shell-slot' },
      { text: 'useSidebarVariant', link: '/composables/use-sidebar-variant' },
      { text: 'useStableId', link: '/composables/use-stable-id' },
      { text: 'useTheme', link: '/composables/use-theme' },
      { text: 'useToast', link: '/composables/use-toast' },
      { text: 'useWalkthrough', link: '/composables/use-walkthrough' },
    ],
  },
  {
    text: 'Directives',
    items: [
      { text: 'Tooltip', link: '/directives/tooltip' },
      { text: 'Tour Step', link: '/directives/tour-step' },
    ],
  },
  {
    text: 'Patterns',
    items: [
      { text: 'The app frame', link: '/patterns/app-frame' },
      { text: 'Building a form', link: '/patterns/forms' },
      { text: 'Building an inspector', link: '/patterns/inspectors' },
      { text: 'Dialogs and confirmation', link: '/patterns/dialogs' },
      {
        text: 'Disabled and read-only',
        link: '/patterns/disabled-and-read-only',
      },
      { text: 'Empty states', link: '/patterns/empty-states' },
      { text: 'Loading and progress', link: '/patterns/loading' },
      { text: 'Notifications', link: '/patterns/notifications' },
      { text: 'Status indicators', link: '/patterns/status-indicators' },
      { text: 'Team management', link: '/patterns/team-management' },
    ],
  },
  {
    text: 'Guidelines',
    items: [
      { text: 'Accessibility', link: '/accessibility/overview' },
      { text: 'Keyboard interaction', link: '/accessibility/keyboard' },
      { text: 'Colour and contrast', link: '/accessibility/color-contrast' },
      { text: 'Writing style', link: '/content/writing-style' },
      { text: 'Types, Interfaces & Enums', link: '/conventions/types' },
    ],
  },
  {
    text: 'Labs',
    items: [{ text: 'Spreadsheet', link: '/labs/spreadsheet' }],
  },
]
