import type { App } from 'vue'

const components: Record<string, any> = import.meta.glob('./**/*.vue', {
  eager: true,
})

/**
 * Register Documentation Components
 *
 * @param {App<Element>} app
 */
export default {
  install(app: App<Element>) {
    Object.keys(components).forEach((key) => {
      const name = `${key.replace(/(.*\/)(\w+)(\.vue)$/, '$2')}`
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase()

      const component = components[key]
      app.component(name, component.default)
    })
  },
}
