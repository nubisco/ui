import { ESizePixel } from '@/types/Size.d'

interface IFlagProps {
  name: string
  size?: ESizePixel | string | number
  clickable?: boolean
}

export { ESizePixel, IFlagProps }
