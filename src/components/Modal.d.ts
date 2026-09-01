import { ESizeShort } from '@/types/Size.d'

/**
 * Dialog size.
 *
 * `sm` | `md` | `lg` are the shared short scale. The two larger steps are
 * modal-only, so they are declared here rather than widened into `ESizeShort`,
 * which NbButton, NbDataTable, NbPagination and NbSlider also read.
 *
 * `xl` is a bigger fixed box: content-heavy dialogs that are still dialogs.
 * `immersive` approaches the viewport, for side-by-side comparison content
 * that a fixed width forces into cramped wrapping. It is not full-screen: it
 * keeps a margin all round, so the page behind stays visible and the dialog
 * still reads as something you are inside of, not somewhere you navigated to.
 */
type TModalSize = `${ESizeShort}` | 'xl' | 'immersive'

interface IModalProps {
  open?: boolean
  title?: string
  size?: TModalSize
  closeOnOverlay?: boolean
}

export { IModalProps, TModalSize }
