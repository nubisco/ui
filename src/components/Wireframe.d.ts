/**
 * One shape in a wireframe. A name, optionally followed by a count:
 * `'title'`, `'cards:3'`, `'chips:4'`. Unknown names are ignored, so a spec
 * written for a newer library still draws on an older one.
 */
type TWireframePart = string

/** A column of a row: how many of the 12 grid columns it spans, and what it holds, top to bottom. */
interface IWireframeColumn {
  span?: number
  parts: TWireframePart[]
  align?: 'start' | 'center' | 'end'
}

/** A layout, as rows of columns. */
interface IWireframeSpec {
  /** 'dark' for a section drawn on a dark band. */
  tone?: 'light' | 'dark'
  rows: IWireframeColumn[][]
}

interface IWireframeProps {
  spec: IWireframeSpec
  /** Accessible name, e.g. the block type's label. Without it the drawing is decorative. */
  label?: string
}

export { TWireframePart, IWireframeColumn, IWireframeSpec, IWireframeProps }
