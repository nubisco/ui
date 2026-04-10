/**
 * Liquid glass displacement map generator.
 *
 * Implements Snell's Law refraction for 2D circular/squircle glass surfaces.
 * Outputs an RGBA data URL suitable for use as an SVG feDisplacementMap source.
 *
 * Assumptions (same as the reference implementation):
 *   - Ambient medium IOR = 1 (air)
 *   - One refraction event only
 *   - Incident rays are orthogonal to the background plane
 *   - Shape is radially symmetric
 */

export type TGlassShape = 'circle' | 'squircle' | 'concave' | 'lip'

export interface IDisplacementOptions {
  /** Pixel width of the element */
  width: number
  /** Pixel height of the element */
  height: number
  /** Glass shape profile */
  shape: TGlassShape
  /** Index of refraction for the glass medium (default 1.5) */
  ior: number
}

// ---------------------------------------------------------------------------
// Height (surface profile) functions
// All take a normalised radius r in [0, 1] and return height in [0, 1].
// ---------------------------------------------------------------------------

function heightCircle(r: number): number {
  const x = 1 - r
  return Math.sqrt(Math.max(0, 1 - x * x))
}

function heightSquircle(r: number): number {
  const x = 1 - r
  return Math.pow(Math.max(0, 1 - Math.pow(x, 4)), 0.25)
}

function heightConcave(r: number): number {
  return 1 - heightSquircle(r)
}

// Smootherstep blend for the lip profile
function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function heightLip(r: number): number {
  const blend = smootherstep(0.4, 0.7, r)
  return heightSquircle(r) * (1 - blend) + heightConcave(r) * blend
}

function getHeightFn(shape: TGlassShape): (r: number) => number {
  switch (shape) {
    case 'circle':
      return heightCircle
    case 'squircle':
      return heightSquircle
    case 'concave':
      return heightConcave
    case 'lip':
      return heightLip
  }
}

// ---------------------------------------------------------------------------
// Refraction via Snell's Law
// Returns the displacement magnitude (in normalised radius units) for a
// given normalised radius r from the centre of the lens.
// ---------------------------------------------------------------------------

function refractedDisplacement(
  r: number,
  ior: number,
  heightFn: (r: number) => number,
  samples = 128,
): number {
  const dr = 1 / samples
  // Surface normal slope: dh/dr (finite difference)
  const h0 = heightFn(Math.max(0, r - dr))
  const h1 = heightFn(Math.min(1, r + dr))
  const slope = (h1 - h0) / (2 * dr)

  // Surface normal (in the r-z plane): (-slope, 1) normalised
  const nLen = Math.sqrt(slope * slope + 1)
  const nr = -slope / nLen // radial component of normal
  // const nz = 1 / nLen  // z component (not needed below)

  // Incident ray: (0, 0, -1) — orthogonal to background
  // sin(θ1) = sin of angle between incident and normal = |nr|
  const sinTheta1 = Math.abs(nr)

  // Snell's law: sin(θ2) = sinTheta1 / ior
  const sinTheta2 = sinTheta1 / ior
  if (sinTheta2 >= 1) return 0 // total internal reflection

  const cosTheta1 = Math.sqrt(Math.max(0, 1 - sinTheta1 * sinTheta1))
  const cosTheta2 = Math.sqrt(Math.max(0, 1 - sinTheta2 * sinTheta2))

  // Angular deviation: how much the ray bends
  const deviation =
    Math.atan2(sinTheta1, cosTheta1) - Math.atan2(sinTheta2, cosTheta2)

  // Project deviation onto the radial axis, sign follows surface slope direction
  return Math.sign(slope) * Math.sin(deviation)
}

// ---------------------------------------------------------------------------
// Displacement map generation
// ---------------------------------------------------------------------------

const SAMPLES = 127 // SVG 8-bit precision: 0-255, neutral at 128

/**
 * Generates a displacement map canvas and returns it as a PNG data URL.
 * The map encodes radial displacement in R (X component) and G (Y component).
 * Neutral (no displacement) = 128 in both channels.
 */
export function buildDisplacementMap(opts: IDisplacementOptions): {
  dataUrl: string
  scale: number
} {
  const { width, height, shape, ior } = opts
  const heightFn = getHeightFn(shape)

  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(cx, cy)

  // Pre-compute displacement magnitudes along one radius
  const magnitudes = new Float32Array(SAMPLES)
  let maxMagnitude = 0

  for (let i = 0; i < SAMPLES; i++) {
    const r = i / (SAMPLES - 1)
    const mag = refractedDisplacement(r, ior, heightFn)
    magnitudes[i] = mag
    if (Math.abs(mag) > maxMagnitude) maxMagnitude = Math.abs(mag)
  }

  // Scale: maps the full [0, 255] range to actual pixel displacement.
  // feDisplacementMap scale attribute will be set to this value.
  const scale = maxMagnitude * radius

  // Render to canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const dx = (px - cx) / radius
      const dy = (py - cy) / radius
      const dist = Math.sqrt(dx * dx + dy * dy)

      const idx = (py * width + px) * 4

      if (dist > 1) {
        // Outside glass: neutral (no displacement)
        data[idx] = 128
        data[idx + 1] = 128
        data[idx + 2] = 128
        data[idx + 3] = 255
        continue
      }

      // Interpolate displacement magnitude for this radius
      const rNorm = dist * (SAMPLES - 1)
      const rFloor = Math.floor(rNorm)
      const rCeil = Math.min(rFloor + 1, SAMPLES - 1)
      const t = rNorm - rFloor
      const mag =
        maxMagnitude > 0
          ? ((1 - t) * magnitudes[rFloor] + t * magnitudes[rCeil]) /
            maxMagnitude
          : 0

      // Direction (unit vector from centre)
      const angle = dist > 0.001 ? Math.atan2(dy, dx) : 0
      const xComp = Math.cos(angle) * mag
      const yComp = Math.sin(angle) * mag

      data[idx] = Math.round(128 + xComp * 127)
      data[idx + 1] = Math.round(128 + yComp * 127)
      data[idx + 2] = 128
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  return { dataUrl: canvas.toDataURL('image/png'), scale }
}
