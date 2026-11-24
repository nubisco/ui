import { describe, expect, it } from 'vitest'
import {
  fitImage,
  initialCropRect,
  rescaleRect,
  toCanvasPoint,
} from '../src/utils/cropGeometry.helper'

describe('fitImage', () => {
  it('fits a tall photograph to the height of the box', () => {
    expect(
      fitImage({ width: 3000, height: 4000 }, { width: 700, height: 400 }),
    ).toEqual({
      width: 300,
      height: 400,
    })
  })

  it('fits a wide photograph to the width of the box', () => {
    expect(
      fitImage({ width: 4000, height: 2000 }, { width: 350, height: 600 }),
    ).toEqual({
      width: 350,
      height: 175,
    })
  })

  it('draws nothing for an image or a box with no size', () => {
    expect(
      fitImage({ width: 0, height: 10 }, { width: 100, height: 100 }),
    ).toEqual({ width: 0, height: 0 })
    expect(
      fitImage({ width: 10, height: 10 }, { width: 0, height: 100 }),
    ).toEqual({ width: 0, height: 0 })
  })
})

describe('initialCropRect', () => {
  const drawn = { width: 300, height: 400 }

  it('starts on half the image, centred, by default', () => {
    expect(initialCropRect(drawn, 'center', false)).toEqual({
      x: 75,
      y: 100,
      width: 150,
      height: 200,
    })
  })

  it('starts on the whole image when asked, for a page that only needs its edges trimmed', () => {
    expect(initialCropRect(drawn, 'full', false)).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 400,
    })
  })

  it('keeps a square crop square, whatever the start', () => {
    expect(initialCropRect(drawn, 'full', true)).toEqual({
      x: 75,
      y: 125,
      width: 150,
      height: 150,
    })
  })
})

describe('toCanvasPoint', () => {
  it('scales a touch on a canvas shrunk to fit a phone', () => {
    // Drawn at 700 wide, shown at 350: a touch 100px in is 200px on the canvas.
    const point = toCanvasPoint(
      { x: 116, y: 60 },
      { left: 16, top: 10, width: 350, height: 200 },
      { width: 700, height: 400 },
    )
    expect(point).toEqual({ x: 200, y: 100 })
  })

  it('is unchanged when the canvas is shown at its own size', () => {
    expect(
      toCanvasPoint(
        { x: 50, y: 50 },
        { left: 0, top: 0, width: 300, height: 400 },
        { width: 300, height: 400 },
      ),
    ).toEqual({ x: 50, y: 50 })
  })
})

describe('rescaleRect', () => {
  it('keeps the chosen area when the image is drawn at a new size', () => {
    expect(
      rescaleRect(
        { x: 30, y: 40, width: 150, height: 200 },
        { width: 300, height: 400 },
        { width: 150, height: 200 },
      ),
    ).toEqual({ x: 15, y: 20, width: 75, height: 100 })
  })
})
