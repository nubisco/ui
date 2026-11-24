import type { IReadableFieldComponent } from '@/types/Props.d'

interface ICodeEditorProps extends IReadableFieldComponent {
  /**
   * The language to highlight, by its Monaco id: `xml` (SVG), `json`, `html`,
   * `css`, `markdown`, `javascript`, `typescript`, `yaml`, `sql` and so on.
   * Plain text by default.
   */
  language?: string
  /** Lines shown when the content is shorter. The editor never gets smaller. */
  rows?: number
  /**
   * Lines the editor grows to with its content before it scrolls. Set it equal
   * to `rows` for a box that never changes height.
   */
  maxRows?: number
  /** Shows line numbers in a gutter. */
  lineNumbers?: boolean
  /** Wraps long lines at the edge instead of scrolling sideways. */
  wrap?: boolean
  /**
   * Monaco construction options, merged over the editor's own, for what the
   * props above do not cover (`tabSize`, `minimap`, `folding`...). Typed
   * loosely so that the library does not need Monaco's types to compile.
   */
  options?: Record<string, unknown>
}

export { ICodeEditorProps }
