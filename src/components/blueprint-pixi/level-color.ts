// Map an audio level (0..1) to a green -> yellow -> red colour as a PixiJS
// numeric colour (0xRRGGBB). The same ramp the DOM path uses for wire levels,
// but returned as a number so the GPU layer never parses a CSS string per
// frame. Level <= 0.5 interpolates green -> yellow; above, yellow -> red.
export function levelToColorNumber(level: number): number {
  const l = Math.max(0, Math.min(1, level))
  const green = [34, 197, 94]
  const yellow = [250, 204, 21]
  const red = [239, 68, 68]
  let a: number[], b: number[], t: number
  if (l <= 0.5) {
    a = green
    b = yellow
    t = l * 2
  } else {
    a = yellow
    b = red
    t = (l - 0.5) * 2
  }
  const mix = (x: number, y: number): number => Math.round(x + (y - x) * t)
  return (
    (mix(a[0]!, b[0]!) << 16) | (mix(a[1]!, b[1]!) << 8) | mix(a[2]!, b[2]!)
  )
}
