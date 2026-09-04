import type { VNodeChild } from 'vue'
import type { TModalSize } from './Modal.d'

/**
 * How hard the dialog leans on the user.
 *
 * `danger` is the default because the audited fleet's confirmations are
 * overwhelmingly destructive: deleting an environment and its content,
 * regenerating a client secret, clearing local storage, deleting someone
 * else's comment. Making the safe tone the default would mean every
 * destructive call site has to remember to opt in, which is exactly the
 * decision this component exists to remove.
 *
 * `neutral` is for a consequential but non-destructive commit (publishing,
 * inviting, transferring ownership): same button order, same focus rules, a
 * primary confirm instead of a red one.
 *
 * It also decides the ARIA role: `danger` renders `role="alertdialog"`
 * (an interruption, whose description is announced on entry), `neutral`
 * renders `role="dialog"`.
 */
type TConfirmTone = 'danger' | 'neutral'

interface IConfirmProps {
  /** Whether the dialog is on screen. `useConfirm()` drives this for you. */
  open?: boolean
  /**
   * The question, phrased as the action. "Delete environment", not
   * "Are you sure?". The title is the only line a hurried user reads.
   */
  title: string
  /**
   * What happens when they confirm, in one sentence. State the consequence
   * and its reach ("Every entry, release and API key in it is deleted"),
   * not the mechanics.
   */
  message?: string
  /**
   * The name of the exact record being acted on, rendered verbatim in its own
   * strip. This is the difference between "delete this environment?" and
   * "delete `production`?", and it is the single cheapest defence against a
   * confirmed mistake.
   */
  subject?: string
  /** What kind of thing `subject` is: "Environment", "Client", "Comment". */
  subjectLabel?: string
  /**
   * The confirm verb. Name the action ("Delete environment", "Regenerate
   * secret"), never "OK" or "Yes": the fleet uses Save, Done, Apply and
   * Create interchangeably, and a naked "Yes" makes the user re-read the
   * title to find out what they are agreeing to.
   */
  confirmLabel?: string
  /** The exit label. "Cancel" unless you are localising it. */
  cancelLabel?: string
  /** Destructive (`danger`, the default) or consequential (`neutral`). */
  tone?: TConfirmTone
  /**
   * Arms a type-to-confirm gate: the confirm button stays disabled until the
   * user types this string exactly (leading and trailing whitespace ignored,
   * case sensitive). Reserve it for actions whose blast radius is bigger than
   * the thing being clicked: an environment and all its content, a production
   * secret, a tenant. Usually the same value as `subject`.
   */
  typeToConfirm?: string
  /**
   * Overrides the gate's field label. Defaults to
   * `Type <typeToConfirm> to confirm`. Supply your own for i18n.
   */
  typeToConfirmLabel?: string
  /** Helper text under the gate field. */
  typeToConfirmHelper?: string
  /**
   * Pending state: the confirm button spins, both buttons and the gate field
   * lock, and Escape, the overlay and the close button stop dismissing. An
   * action that has already been fired cannot be un-fired by closing the
   * dialog, so the dialog refuses to lie about it.
   */
  busy?: boolean
  /**
   * The text of the pending line. It sits in a `role="status"` region that is
   * deliberately OUTSIDE the element `aria-describedby` points at: an
   * alertdialog announces its description on entry, and text inserted into
   * that same subtree a moment later is at the mercy of how the screen reader
   * merges the two. Kept separate, the pending line is an ordinary polite
   * update to a region that was empty, which is a case assistive technology
   * handles the same way everywhere.
   */
  busyLabel?: string
  /**
   * The finished beat: the work succeeded and the dialog is about to close.
   * Both buttons and the gate stay locked, and nothing dismisses, because the
   * question has already been answered. `useConfirm()` sets this for you, and
   * only when `successLabel` is supplied.
   */
  succeeded?: boolean
  /**
   * The line shown while `succeeded`. Leave it unset and there is no finished
   * beat at all: the dialog closes the moment the work returns. Set it
   * ("Environment deleted") when the action is slow enough that a dialog
   * vanishing on its own reads as a glitch rather than a result.
   */
  successLabel?: string
  /**
   * Failure text from the last attempt. Shown in the body; the dialog stays
   * open so the user can retry or cancel with the error still visible.
   */
  error?: string
  /** Dialog size, forwarded to NbModal. `sm` unless the body is unusually long. */
  size?: TModalSize
  /**
   * Extra selectors for popups that teleport out of the dialog and must not
   * be treated as "outside" it by the focus trap or by Escape. Our own
   * overlays are known already; this is for a third-party combobox whose
   * markup you cannot annotate with `[data-nb-confirm-floating]`.
   *
   * Use `registerConfirmFloatingSelector()` instead when the exemption
   * applies to every dialog in the application rather than this one.
   */
  floatingSelectors?: string[]
  /**
   * A class on the dialog's content region (the message, the subject strip,
   * the gate and the status line). The component's root is NbModal, which
   * teleports to `<body>`, so attribute fallthrough reaches nothing a
   * consumer can style: this is the hook that does.
   *
   * It is also the practical way to scope the `--nb-confirm-*` custom
   * properties, which are otherwise set on `:root` because a teleported node
   * inherits from `<body>` and not from the component that asked for it.
   */
  contentClass?: string
}

/**
 * What `confirm()` accepts. Same shape as the component, minus the three
 * props the composable owns (`open`, `busy`, `error`), plus the work itself.
 */
interface IConfirmOptions extends Omit<
  IConfirmProps,
  'open' | 'busy' | 'error' | 'succeeded'
> {
  /**
   * The action to run when the user confirms. While the returned promise is
   * pending the dialog is locked, so the user cannot fire it twice; the
   * promise returned by `confirm()` resolves `true` only after it settles.
   *
   * If it rejects, the dialog stays open with the failure shown and nothing
   * resolves yet: the user retries or cancels (which resolves `false`).
   * Omit it and `confirm()` resolves as soon as the button is pressed.
   */
  onConfirm?: () => unknown | Promise<unknown>
  /**
   * Body content as a render function, for the cases `message` cannot carry:
   * a list of the things about to be deleted, a link to what will break, a
   * count that needs emphasis. It fills the component's default slot.
   *
   * ```ts
   * confirm({
   *   title: 'Delete environment',
   *   body: () => h('ul', items.map((i) => h('li', i.name))),
   * })
   * ```
   *
   * It renders inside the dialog's own Vue app, which is not your
   * application's: it has no router, no i18n and no provides. Resolve
   * anything you need from those before calling `confirm()` and close over
   * the result. Plain text belongs in `message`.
   */
  body?: () => VNodeChild
  /**
   * Turns a rejection from `onConfirm` into the text shown in the dialog.
   * Defaults to the error's `message`, falling back to `String(error)`.
   */
  formatError?: (error: unknown) => string
  /**
   * How long, in milliseconds, `onConfirm` is given to settle before the
   * dialog treats it as failed and shows `timeoutMessage`.
   *
   * A promise that never settles is the one state this dialog cannot recover
   * from on its own: cancel, confirm, the gate and the close control are all
   * locked while the work is in flight, precisely so nobody can fire a second
   * DELETE, which means a hung request leaves a dialog that cannot be
   * dismissed by any means. A timeout turns that into an error the user can
   * read, retry or cancel out of.
   *
   * It does not abort the work: nothing here can cancel a request it did not
   * make. The dialog stops waiting; the request may still land. Pass your own
   * AbortSignal inside `onConfirm` if the call has to be stopped too.
   *
   * Unset by default, because a long-running action that is genuinely
   * expected to take minutes should not be declared failed by a library
   * guess. Set it wherever the call has a service-level expectation.
   */
  timeout?: number
  /** The failure text used when `timeout` elapses. */
  timeoutMessage?: string
}

export type { IConfirmProps, IConfirmOptions, TConfirmTone }
