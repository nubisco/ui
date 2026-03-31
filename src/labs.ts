import type { App } from 'vue'

const labsComponents: Record<string, any> = import.meta.glob(
  './components/labs/**/*.vue',
  { eager: true },
)

export default {
  install(app: App) {
    Object.keys(labsComponents).forEach((key) => {
      const name = `Nb${key.replace(/(.+\/)(\w+)(\.vue)$/, '$2')}`
      const component = labsComponents[key]
      app.component(name, component.default)
    })
  },
}
