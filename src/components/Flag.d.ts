import { ESizePixel } from '@/types/Size.d'
import type { TFlagSource } from '@/types/Glyph.d'

interface IFlagProps {
  /**
   * Country code, or a flag module. A string is resolved at runtime and needs
   * the catalogue (see `@nubisco/ui/flags/all`); a module is linked directly.
   */
  name?: TFlagSource
  /**
   * An explicitly imported flag module, for code the plugin cannot see
   * through: `import Portugal from '@nubisco/ui/flags/pt'`. Takes precedence
   * over `name`.
   */
  flag?: TFlagSource
  size?: ESizePixel | string | number
  clickable?: boolean
}

export { ESizePixel, IFlagProps }
export type { TFlagSource }
