import DefaultTheme from 'vitepress/theme'
import { enhanceAppWithTabs } from '../plugins/tabs/components'
import docDirectives from './directives'
import docComponents from './components'
import './custom.css'
import { createI18n } from 'vue-i18n'
import enUS from '../../locales/en-US.json'
import ptPT from '../../locales/pt-PT.json'
import Nubisco from './Nubisco.vue'
import { rulersDirective } from './directives/rulers'

import '@nubisco/ui/styles'
// import '@nubisco/ui/dist/ui.css'

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

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: import('vue').App }) {
    enhanceAppWithTabs(app)
    app.directive('rulers', rulersDirective)
    app.use(docDirectives)
    app.use(docComponents)
    app.component('nubisco', Nubisco)
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
