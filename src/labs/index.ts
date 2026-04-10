/**
 * NubiscoUILabs — experimental components not yet production-ready.
 *
 * Import individually for tree-shaking:
 *   import { NbLiquidGlass } from '@nubisco/ui/labs'
 *
 * Or register all at once via the plugin:
 *   app.use(NubiscoUILabs)
 */
import type { App } from 'vue'
import NbLiquidGlass from './liquid-glass/LiquidGlass.vue'

export { NbLiquidGlass }
export type { TGlassShape } from './liquid-glass/displacement'

const NubiscoUILabs = {
  install(app: App) {
    app.component('NbLiquidGlass', NbLiquidGlass)
  },
}

export default NubiscoUILabs
