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
  /**
   * Where the crop area starts. `'center'` (the default) is half the image,
   * centred. `'full'` is the whole image, for a photograph whose edges only
   * need trimming, such as a scanned page. A square crop (`cropAsCircle`,
   * `lockAspectRatio`) always starts square.
   */
  initialCrop?: 'center' | 'full'
  /**
   * How large the image is drawn. `'fixed'` (the default) fits it in 700 by
   * 400 pixels. `'container'` fits it to the width the cropper is given, up to
   * 60% of the window's height, and follows that width as it changes, so it
   * fills a phone's screen.
   */
  fit?: 'fixed' | 'container'
}

export { ICropRect, EHandleName, IImageCropperProps }
