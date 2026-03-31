import type { App } from 'vue'

type DirectiveModule = { default: (app: App) => void }

const modules = import.meta.glob<DirectiveModule>('./**/*.ts', { eager: true })

export default {
  install(app: App) {
    Object.values(modules).forEach((mod) => {
      if (typeof mod.default === 'function') {
        mod.default(app)
      }
    })
  },
}
