import { IDefaultProps } from '@/types/Props.d'

/**
 * Text scale of both the presentation text and the editor. `md` reads as a
 * body line, `lg` as a section heading, `xl` as a page/dialog title.
 */
type TInlineEditSize = 'md' | 'lg' | 'xl'

interface IInlineEditProps extends IDefaultProps {
  /** Current value. Updated live while editing; see `commit`/`cancel`. */
  modelValue: string
  /**
   * Accessible name of the field ("Item title"). Also names the edit
   * affordance for assistive tech, so it is required.
   */
  label: string
  /** Shown, muted, when the value is empty. */
  placeholder?: string
  size?: TInlineEditSize
  /** Blocks entering edit mode without changing the presentation. */
  disabled?: boolean
}

export type { IInlineEditProps, TInlineEditSize }
