interface ICropRect {
  x: number
  y: number
  width: number
  height: number
}

enum EHandleName {
  TopLeft = 'top-left',
  Top = 'top',
  TopRight = 'top-right',
  Right = 'right',
  BottomRight = 'bottom-right',
  Bottom = 'bottom',
  BottomLeft = 'bottom-left',
  Left = 'left',
}

interface IImageCropperProps {
  image?: File
  cropAsCircle?: boolean
  outputAsCircle?: boolean
  lockAspectRatio?: boolean
  showPreview?: boolean
}

export { ICropRect, EHandleName, IImageCropperProps }
