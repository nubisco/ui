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

// Re-export the tooltip's imperative dismiss API so consumers can
// nuke every visible tooltip on a view / route change (helpful in
// SPAs that don't use vue-router and so don't get the directive's
// built-in beforeEach cleanup).
export { dismissAllTooltips } from './ToolTip.directive'
