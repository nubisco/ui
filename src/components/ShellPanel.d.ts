export type TShellPanelSize = 'collapsed' | 'default' | 'full'

export interface IShellPanelProps {
  /**
   * Current panel size. Use v-model:size for two-way binding.
   *
   * - collapsed: header only, no content, does not grow
   * - default: content visible. Sizing follows the `fluid` prop —
   *   `false` (the back-compat default) shares column space equally
   *   with sibling panels via `flex: 1 1 0%`; `true` uses `flex: 0 0
   *   auto` so the panel takes only the height its content needs.
   * - full: content visible, flex: 1, sibling panels collapse automatically
   *
   * @default 'default'
   */
  size?: TShellPanelSize
  /**
   * Panel title shown in the header.
   */
  title?: string
  /**
   * When true, a `default`-sized panel sizes to its content instead of
   * sharing column space equally with siblings. Right for inspectors
   * with multiple unrelated sections — a panel with two rows shouldn't
   * eat the same height as a panel with twenty.
   *
   * The `collapsed` and `full` sizes are unaffected (collapsed is
   * always header-only; full always fills).
   *
   * @default false
   */
  fluid?: boolean
  /**
   * Claim the parent's height and scroll internally. Same name and same
   * semantics as `fill` on NbDataTable: the panel becomes a flex item that
   * takes the space left in a bounded flex column, its header stays pinned,
   * and the content region gets the scrollbar.
   *
   * Like the table, it claims a height rather than creating one: an ancestor
   * has to bound it (a flex column with `min-height: 0`, which NbShell's
   * `bottom` region and inspector column already are).
   *
   * Wins over `fluid` when both are set, and has no effect on a `collapsed`
   * panel, which is header-only by definition.
   *
   * @default false
   */
  fill?: boolean
}
