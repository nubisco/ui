import { ESizeShort } from '@/types/Size.d'

interface IModalProps {
  open?: boolean
  title?: string
  size?: ESizeShort
  closeOnOverlay?: boolean
}

export { IModalProps }
