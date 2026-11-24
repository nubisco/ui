import sdkTheme from '@nubisco/docs-sdk/theme'
import docDirectives from './directives'
import docComponents from './components'
// The category themes the App theming page switches between.
import './categories.scss'
import './home.css'
import { createI18n } from 'vue-i18n'
import enUS from '../../locales/en-US.json'
import ptPT from '../../locales/pt-PT.json'
import { rulersDirective } from './directives/rulers'
// NbCodeEditor's demos: Monaco's workers, wired the way an app wires them.
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker?worker'

// The docs are the escape hatch's own use case: every markdown demo names
// components in a template VitePress compiles at build time, so they have to
// be registered globally. Real apps use `@nubisco/ui/vite` instead and link
// only what they render.
import NubiscoUI from '../../../src/all'
import { NubiscoUILabs, NbCommandPalettePlugin } from '../../../src'

// Likewise, a documentation site legitimately renders every glyph it
// documents: the icon gallery and the flag picker are exactly the pages the
// full catalogues exist for.
import '@nubisco/ui/icons/all'
import '@nubisco/ui/flags/all'

/**
 * The shared Nubisco docs theme (layout, header, sidebar, outline, tabs,
 * controls) from `@nubisco/docs-sdk`, plus what only the component library's
 * docs have: live demos, the theme builder, the token viewer and the i18n the
 * demos use.
 */
export default {
  extends: sdkTheme,
  enhanceApp({ app }: { app: import('vue').App }) {
    if (typeof self !== 'undefined') {
      ;(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
        getWorker: (_id: string, label: string) =>
          label === 'json' ? new JsonWorker() : new EditorWorker(),
      }
    }
    app.directive('rulers', rulersDirective)
    app.use(docDirectives)
    app.use(docComponents)
    app.use(
      createI18n({
        legacy: false,
        locale: 'en-US',
        messages: {
          'en-US': enUS,
          'pt-PT': ptPT,
        },
      }),
    )
    app.use(NubiscoUI)
    app.use(NubiscoUILabs)
    app.use(NbCommandPalettePlugin)
  },
}
