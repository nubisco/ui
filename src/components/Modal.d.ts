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

/** `dialog` for a place the user chose to go, `alertdialog` for an interruption. */
type TModalRole = 'dialog' | 'alertdialog'

interface IModalProps {
  open?: boolean
  title?: string
  size?: TModalSize
  closeOnOverlay?: boolean
  /**
   * ARIA role for the dialog box. `alertdialog` is for a surface that
   * interrupts to report a condition or ask for a decision that cannot wait
   * (NbConfirm's destructive tone uses it); screen readers announce its
   * description on entry rather than waiting to be asked.
   */
  role?: TModalRole
  /**
   * Id of the element that names the dialog. Defaults to the built-in title
   * when `title` or the header slot is used, so the common case needs nothing.
   * Pass your own when the accessible name lives inside the header slot.
   */
  labelledBy?: string
  /** Id of the element that describes the dialog, usually its body. */
  describedBy?: string
  /**
   * Marks the dialog `aria-busy` while work it started is in flight.
   */
  busy?: boolean
  /**
   * Disables the header close control. A dialog that has fired something
   * irreversible must not offer a control that pretends to undo it, and a
   * live button that does nothing is worse than a visibly unavailable one.
   */
  closeDisabled?: boolean
  /**
   * Whether Escape emits `close`. Escape is answered only by the topmost
   * open dialog either way, so a modal underneath keeps its state; set this
   * to `false` when a wrapper (NbConfirm) answers the key itself.
   */
  closeOnEscape?: boolean
  /**
   * Whether the dialog holds keyboard focus while it is open: focus moves to
   * the first control on open, Tab and Shift+Tab cycle within the dialog
   * instead of reaching the page behind it, and focus returns to whatever
   * opened the dialog on close.
   *
   * On by default, which is what `aria-modal="true"` already promises the
   * assistive technology reading this dialog. Set it to `false` only when a
   * wrapper runs its own trap (NbConfirm does, for its pending state and its
   * type-to-confirm gate); two traps on one surface fight over focus.
   */
  trapFocus?: boolean
  /**
   * Where focus lands when the dialog opens. A CSS selector resolved inside
   * the dialog, or a function returning the element.
   *
   * The default is the first focusable control, which in a dialog with a
   * header is the close button. That is a fine landing for a dialog you only
   * read, and the wrong one for a form: point this at the first field so the
   * user can start typing.
   *
   * ```vue
   * <NbModal :open="open" initial-focus=".name-field input" @close="..." />
   * ```
   *
   * Never point it at a destructive control. A dialog that opens with Delete
   * focused turns a stray Space into a deletion.
   */
  initialFocus?: string | (() => HTMLElement | null)
  /**
   * Extra selectors for popups that teleport out of the dialog but belong to
   * it, such as a third-party combobox list rendered to `<body>` by a control
   * inside the dialog. Focus landing inside one of these is not an escape.
   *
   * Our own teleported popups (NbSelect, NbMenu, NbDatePicker) are already
   * covered. Use `registerConfirmFloatingSelector()` to teach every dialog
   * about one instead of passing it per dialog.
   */
  floatingSelectors?: readonly string[]
}

export { IModalProps, TModalSize, TModalRole }
