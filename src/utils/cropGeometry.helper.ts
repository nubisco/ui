/**
 * The arithmetic behind `NbImageCropper`, kept out of the component so it can
 * be tested without a canvas.
 */

interface ISize {
  width: number
  height: number
}

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * How large to draw an image so it fits a box, keeping its proportions.
 *
 * @param image  The image's natural size.
 * @param box  The largest size it may be drawn at.
 */
export function fitImage(image: ISize, box: ISize): ISize {
  if (!image.width || !image.height || box.width <= 0 || box.height <= 0) {
    return { width: 0, height: 0 }
  }
  const aspect = image.width / image.height
  if (aspect > box.width / box.height) {
    return { width: box.width, height: box.width / aspect }
  }
  return { width: box.height * aspect, height: box.height }
}

/**
 * Where the crop area starts on a drawn image.
 *
 * `center` is half the image, centred, the cropper's long-standing default:
 * a picture to be cut down to one part of it. `full` is the whole image, for
 * a photograph whose edges only need trimming, such as a scanned page.
 * `square` (circle crops and a locked aspect ratio) is half the shorter side,
 * centred, whatever `initial` asks for, so a square never starts stretched.
 *
 * @param drawn  The size the image is drawn at.
 * @param initial  Where to start.
 * @param square  Whether the crop area must be square.
 */
export function initialCropRect(
  drawn: ISize,
  initial: 'center' | 'full',
  square: boolean,
): IRect {
  if (square) {
    const side = Math.min(drawn.width, drawn.height) * 0.5
    return {
      x: (drawn.width - side) / 2,
      y: (drawn.height - side) / 2,
      width: side,
      height: side,
    }
  }
  if (initial === 'full') {
    return { x: 0, y: 0, width: drawn.width, height: drawn.height }
  }
  return {
    x: drawn.width * 0.25,
    y: drawn.height * 0.25,
    width: drawn.width * 0.5,
    height: drawn.height * 0.5,
  }
}

/**
 * A pointer position in the canvas's own pixels.
 *
 * The canvas can be drawn at one size and shown at another (CSS shrinks it to
 * fit a narrow container), so a position measured on screen is scaled by the
 * ratio between the two. Without that, a drag on a shrunk canvas lands short
 * of where the finger is.
 *
 * @param client  The pointer position, in viewport pixels.
 * @param shown  The canvas's on-screen box (`getBoundingClientRect()`).
 * @param drawn  The canvas's own size (`canvas.width`, `canvas.height`).
 */
export function toCanvasPoint(
  client: { x: number; y: number },
  shown: { left: number; top: number; width: number; height: number },
  drawn: ISize,
): { x: number; y: number } {
  const sx = shown.width ? drawn.width / shown.width : 1
  const sy = shown.height ? drawn.height / shown.height : 1
  return { x: (client.x - shown.left) * sx, y: (client.y - shown.top) * sy }
}

/**
 * The same crop area on the image drawn at a new size, so resizing the window
 * keeps what the person chose.
 */
export function rescaleRect(rect: IRect, from: ISize, to: ISize): IRect {
  const sx = from.width ? to.width / from.width : 1
  const sy = from.height ? to.height / from.height : 1
  return {
    x: rect.x * sx,
    y: rect.y * sy,
    width: rect.width * sx,
    height: rect.height * sy,
  }
}
