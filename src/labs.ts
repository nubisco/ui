import type { App } from 'vue'
import NbSpreadsheet from './components/Spreadsheet.vue'

const labsComponents: Record<string, any> = import.meta.glob(
  './components/labs/**/*.vue',
  { eager: true },
)

// Components that graduated out of labs. The plugin keeps registering them
// so an app that still calls `app.use(NubiscoUILabs)` renders them as before.
const graduated: Record<string, unknown> = { NbSpreadsheet }

export default {
  install(app: App) {
    Object.keys(labsComponents).forEach((key) => {
      const name = `Nb${key.replace(/(.+\/)(\w+)(\.vue)$/, '$2')}`
      const component = labsComponents[key]
      app.component(name, component.default)
    })
    for (const [name, component] of Object.entries(graduated)) {
      if (!app.component(name)) app.component(name, component as never)
    }
  },
}
