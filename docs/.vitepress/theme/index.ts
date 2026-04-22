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

import NubiscoUI, { NubiscoUILabs, NbCommandPalettePlugin } from '../../../src'

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
