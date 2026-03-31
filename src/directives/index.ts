import type { App } from 'vue'

type TDirectiveModule = { default: (app: App) => void }

const modules = import.meta.glob<TDirectiveModule>('./**/*.ts', { eager: true })

export default {
  install(app: App) {
    Object.values(modules).forEach((mod) => {
      if (typeof mod.default === 'function') {
        mod.default(app)
      }
    })
  },
}
