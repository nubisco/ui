interface ISparklineProps {
  data: number[]
  color?: string
  height?: number | string
  width?: number | string
  strokeWidth?: number
  fill?: boolean
  smooth?: boolean
  /**
   * Draws the line in from the left when the sparkline first renders and when
   * its data changes. Off by default. Disabled under `prefers-reduced-motion:
   * reduce`.
   */
  animate?: boolean
}

export type { ISparklineProps }
