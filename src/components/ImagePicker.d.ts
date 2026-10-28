import { IDefaultProps } from '@/types/Props.d'

/** Why a file was turned away before it reached `pick`. */
type TImagePickerRejection = 'type' | 'size'

interface IImagePickerProps extends IDefaultProps {
  /**
   * The current image, as a URL or a data URL. Empty or omitted shows the empty
   * drop target. The picker never reads the file it emits into this on its
   * own: the consumer uploads, then passes the result back here, so what is
   * shown is always what the consumer holds.
   */
  src?: string
  /** What the image shows, for a screen reader. Empty marks it decorative. */
  alt?: string
  /** Text in the empty drop target. */
  label?: string
  /** Text over the picker while a file is dragged onto it. */
  dropLabel?: string
  /** Accessible name of the button that picks a replacement for the image. */
  replaceLabel?: string
  /** What the remove button is called: its tooltip and its accessible name. */
  removeLabel?: string
  /** File types the picker takes, as for `<input accept>`. Images by default. */
  accept?: string
  /** Largest file taken, in bytes. A larger file is rejected, not emitted. */
  maxSize?: number
  /**
   * Shows the remove button (a trash can, top right, on hover and on focus)
   * while there is an image. On by default: wherever someone adds a picture,
   * they usually want a way to take it away. Turn it off where the picture is
   * not the person's to remove.
   */
  removable?: boolean
  /**
   * Keeps the remove button on screen but unavailable, for an app that allows
   * removal only sometimes (a logo that cannot go while invoices use it).
   * Has no effect with `removable` off.
   */
  removeDisabled?: boolean
  /** Covers the picker with a spinner and blocks it, while the consumer uploads. */
  loading?: boolean
  disabled?: boolean
  /** Width of the box. A number is pixels, a string is any CSS length. */
  size?: number | string
  /** Shape of the box, as a CSS `aspect-ratio`. Square by default. */
  ratio?: string
  /**
   * How the image sits in the box. `contain` shows all of it, which is what a
   * logo needs. `cover` fills the box and crops, which suits a photo.
   */
  fit?: 'contain' | 'cover'
}

export { IImagePickerProps, TImagePickerRejection }
