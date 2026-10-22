interface IVideoProps {
  /** The video file (MP4 with H.264 plays everywhere). */
  src: string
  /**
   * The still shown before the video loads, instead of it when motion is
   * reduced or data is being saved, and as the page's first paint.
   */
  poster: string
  /** A lighter cut for narrow screens, used below `mobileBreakpoint`. */
  mobileSrc?: string
  /** Width in px under which `mobileSrc` is chosen. */
  mobileBreakpoint?: number
  /**
   * What the video shows, for screen readers. Leave it empty for a decorative
   * loop: the video is then hidden from assistive technology.
   */
  label?: string
  /** Intrinsic size, so the space is reserved before anything loads. */
  width?: number
  height?: number
  /** How the video fills its box: cropped to fill, or shown whole. */
  fit?: 'cover' | 'contain'
  /** Loop the video. */
  loop?: boolean
  /** Accessible names of the play and pause control. */
  playLabel?: string
  pauseLabel?: string
}

export type { IVideoProps }
