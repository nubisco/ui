import { IDefaultProps } from '@/types/Props.d'
import { EVariant } from '@/types/Variants.d'

enum EFileUploaderStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
}

interface IFileItem {
  file: File
  status: EFileUploaderStatus
  error?: string
}

interface IFileUploaderProps extends IDefaultProps {
  heading?: string
  description?: string
  buttonLabel?: string
  variant?: EVariant
  accept?: string
  multiple?: boolean
  maxSize?: number
  disabled?: boolean
}

export { EFileUploaderStatus, IFileItem, IFileUploaderProps }
