import type { App } from 'vue'
import {
  NB_COMMAND_PALETTE_KEY,
  createCommandPaletteState,
} from '../composables/useCommandPalette.composable'

export const NbCommandPalettePlugin = {
  install(app: App) {
    const state = createCommandPaletteState()
    app.provide(NB_COMMAND_PALETTE_KEY, state)
  },
}
