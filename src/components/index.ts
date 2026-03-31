import type { App } from 'vue'

const components: Record<string, any> = import.meta.glob('./**/*.vue', {
  eager: true,
})

export default {
  install(app: App) {
    Object.keys(components).forEach((key) => {
      if (key.includes('/labs/')) return

      const name = `Nb${key.replace(/(.+\/)(\w+)(\.vue)$/, '$2')}`
      const component = components[key]
      app.component(name, component.default)
    })
  },
}
