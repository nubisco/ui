import type { IToastQueue } from '../composables/useToast.composable'

/**
 * Where the stack sits.
 *
 * The suffix is the inline edge, so it follows the document direction rather
 * than the screen: `-end` is the right in a left-to-right document and the
 * left in Arabic or Hebrew. The audit found five different breakpoint scales
 * and no shared idea of "the corner"; naming the edge logically is what stops
 * a right-to-left build from putting the stack on top of the shell rail.
 */
type TToasterPlacement =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'

interface IToasterProps {
  /**
   * Queue to render. Defaults to the shared `useToast()` queue.
   *
   * Pass one from `createToastQueue()` for anything that is not the
   * application's own stack: a docs demo, a test, a second host inside a
   * dialog. Two hosts rendering the same queue show and announce every
   * message twice, and both write to `queue.max`; the host warns about it in
   * development.
   *
   * It is read reactively, so binding a queue that is created after mount is
   * safe.
   */
  queue?: IToastQueue
  /**
   * Corner or edge the stack grows from. `bottom-end` keeps it clear of the
   * shell top bar, where the actions that raise most toasts live.
   */
  placement?: TToasterPlacement
  /**
   * Visible-slot cap. Extras wait in the queue and slide in as slots free up.
   *
   * The cap belongs to the queue, since admission happens in `push()` before
   * any host renders, so this prop writes through to `queue.max` and restores
   * the previous value when the host unmounts.
   *
   * There is deliberately **no default**. Leaving it off means the queue keeps
   * whatever cap it was built with, so `createToastQueue({ max: 2 })` rendered
   * by a bare `<NbToaster :queue="toast" />` shows two. A default here would
   * silently overrule every queue configured through `createToastQueue`, which
   * is the one place a consumer expects to set this. Set it on the prop only
   * when the host is the thing that knows better than the queue: a demo, a
   * dialog, a narrow viewport.
   *
   * The queue's own default, from `createToastQueue()`, is `3`.
   */
  max?: number
  /** Accessible name of the region landmark. */
  label?: string
  /**
   * Teleport target. Body keeps the stack out of every transformed ancestor.
   *
   * `false` turns the teleport off and renders the stack where the component
   * sits. That is the server-rendering answer: `<Teleport>` does not render
   * into its target on the server, it buffers into `ctx.teleports`, and an app
   * that does not write that buffer into the target hydrates a stack the
   * server never sent. Either splice `ctx.teleports.body` into your HTML
   * template, or pass `:to="false"` and mount the host at the app root.
   */
  to?: string | false
  /**
   * Keyboard shortcut that moves focus into the stack and back out again.
   * `'alt+t'` by default; pass `null` to remove it.
   *
   * Written as modifiers plus one key (`'alt+t'`, `'ctrl+shift+n'`). The
   * terminal key is matched on its physical position (`event.code`), not on
   * the character it produces, because Option on macOS is a character
   * modifier: Option+T types a dagger, never a `t`.
   *
   * Without a hotkey, the only route to a toast's action is to tab past the
   * rest of the document, which is a long way from wherever the user was, and
   * the countdown is running while they travel.
   */
  hotkey?: string | null
  /**
   * Spoken form of the hotkey, appended once to the announcement of a toast
   * that carries an action. Translate it with the rest of the interface, and
   * change it if you change `hotkey`: it is a promise made to somebody who
   * cannot see the stack, so it has to name a key that works.
   */
  hotkeyHint?: string
}

export type { IToasterProps, TToasterPlacement }
