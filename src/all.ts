import type { App } from 'vue'
import NubiscoUI, { type INubiscoUIOptions } from './main'
import components from './components/index'

/**
 * The escape hatch: everything the main plugin installs, plus every component
 * registered globally by name.
 *
 * Use this when you cannot add a bundler plugin, and only then: a page with no
 * build step, a CDN embed, a toolchain you do not control, or a template
 * compiled from a string at runtime. It links the entire component set into
 * the bundle, which is exactly the cost the compile-time resolution exists to
 * avoid, so it lives behind its own import rather than an option on the main
 * entry: choosing it is a decision someone wrote down.
 *
 * ```ts
 * import NubiscoUI from '@nubisco/ui/all'
 * import '@nubisco/ui/css'
 *
 * app.use(NubiscoUI)
 * ```
 *
 * Note that this registers components, not artwork. Icons and flags still
 * resolve per the rules in `NbIcon` and `NbFlag`; add
 * `import '@nubisco/ui/icons/all'` if the page also needs the full catalogue.
 */
export default {
  install(app: App, options: INubiscoUIOptions = {}) {
    app.use(NubiscoUI, { ...options })
    app.use(components)
  },
}

export * from './main'
