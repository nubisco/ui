type TInspectorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type TSidebarVariant = 'compact' | 'verbose'
type TShellTopbar = 'auto' | 'always' | 'never'
type TShellCollapseAt = 'md' | 'lg' | 'none'

interface IShellProps {
  /**
   * Whether the inspector column is visible.
   *
   * Controlled or uncontrolled, on the same rule as `sidebarOpen` and
   * `inspectorWidth`: pass it (as `v-model:inspector-visible`) and the
   * application owns the state, leave it out and the shell owns it. Either way
   * `update:inspectorVisible` is emitted when the shell closes the inspector
   * itself, which happens on Escape and on the sheet's dismiss button below
   * `collapseAt`.
   *
   * The shell will always be able to close its own sheet: a shell given
   * `:inspector-visible="true"` with nothing listening for the update still
   * hides the overlay locally rather than leaving the user trapped behind it.
   * That override is scoped to the overlay and clears itself as soon as the
   * application sets the prop true again or the frame stops collapsing, so the
   * desktop column is untouched by it.
   * @default false
   */
  inspectorVisible?: boolean
  /**
   * When true the inspector takes ~50 % of the viewport width instead of the
   * default fixed width. Has no effect when `inspectorVisible` is false.
   * @default false
   */
  inspectorExpanded?: boolean
  /**
   * Controls the width of the inspector panel.
   * - xs: 288px
   * - sm: 360px
   * - md: 560px (current default, backwards compatible)
   * - lg: 50vw
   * - xl: 75vw
   * @default 'md'
   */
  inspectorSize?: TInspectorSize
  /**
   * Allow the user to resize the inspector by dragging its left edge (or by
   * focusing the handle and using the arrow keys), clamped between 288px (the
   * floor) and 50% of the current viewport. The upper clamp is re-evaluated
   * when the window resizes, so a width persisted on a wide monitor cannot
   * squeeze the body on a narrow one.
   * Double-clicking the handle resets to the `inspectorSize` default. Pair with
   * `v-model:inspector-width` to persist the chosen width; without it the shell
   * keeps the width itself, so `resizable` alone is a working control rather
   * than a handle that moves nothing.
   * @default false
   */
  resizable?: boolean
  /**
   * The user-chosen inspector width in pixels when `resizable` is on, as a
   * v-model (`v-model:inspector-width`). `null` means "use the `inspectorSize`
   * width", which is what a reset emits.
   *
   * Controlled or uncontrolled, decided once at setup by whether the prop was
   * passed at all:
   *
   * - passed (including as `null`): the application owns the width and the
   *   shell renders exactly what it is given. `update:inspectorWidth` is
   *   emitted on drag, on the arrow keys and on reset.
   * - omitted: the shell owns the width internally. The handle still works and
   *   still emits, so an application can listen without binding, but nothing
   *   has to be stored for the drag to do anything.
   */
  inspectorWidth?: number | null
  /**
   * Whether the main content area has padding.
   * Set to false for full-bleed content like viewports/canvases.
   * @default true
   */
  mainPadding?: boolean
  /**
   * Sidebar presentation mode.
   * - 'compact': narrow icon-only rail (56px). Use with NbSidebarLink. This is
   *   the default and matches the legacy behaviour.
   * - 'verbose': wider sidebar (240px) with full-width rows. Use with
   *   NbSidebarMenu, NbSidebarMenuGroup and NbSidebarMenuItem to render
   *   grouped, multi-level navigation with icons and labels.
   * @default 'compact'
   */
  sidebarVariant?: TSidebarVariant
  /**
   * When the topbar strip is rendered.
   *
   * - 'auto': rendered only when `topbar-left` or `topbar-right` has content,
   *   or a view has claimed one of them with `useShellSlot()`. An application
   *   that passes neither gets no empty 50px bar and no border line to hide
   *   from the outside.
   * - 'always': rendered unconditionally. This is what the shell did before
   *   the check existed; set it if a layout depends on the bar's height being
   *   reserved even while it is empty.
   * - 'never': never rendered, whatever the slots say. For a full-bleed route
   *   inside an application whose shell is declared once, further up.
   *
   * @default 'auto'
   */
  topbar?: TShellTopbar
  /**
   * Render the "skip to content" link as the shell's first focusable element.
   *
   * The shell is the only component that knows where the main region is, so it
   * is the only one that can wire a skip link without the application inventing
   * an id. It is visually hidden until focused, so the first Tab on any page
   * offers it and nothing else changes.
   *
   * Set to `false` only if the application already ships its own.
   * @default true
   */
  skipToContent?: boolean
  /**
   * Label for the skip link. Override for a localised application.
   * @default 'Skip to content'
   */
  skipToContentLabel?: string
  /**
   * The `id` put on the `<main>` element, and the skip link's target. Set it
   * when something outside the shell needs to address the main region by a
   * known id (a router scroll behaviour, an `aria-controls`). Defaults to a
   * per-instance stable id, so two shells on one page do not collide.
   */
  mainId?: string
  /**
   * Accessible name for the sidebar `<nav>` landmark. Two navigation landmarks
   * on a page (the rail plus in-page nav) are indistinguishable in a landmark
   * list without one.
   * @default 'Primary'
   */
  sidebarLabel?: string
  /**
   * Accessible name for the inspector `<aside>` landmark.
   * @default 'Inspector'
   */
  inspectorLabel?: string
  /**
   * The viewport width below which the frame stops being three columns.
   *
   * A 240px verbose rail plus a 288px inspector leaves nothing for the page on
   * a phone, and the frame is `height: 100dvh; overflow: hidden`, so there is
   * no scroll to escape into. Below this width the sidebar becomes an overlay
   * drawer behind a toggle button and the inspector becomes a full-screen
   * sheet over the content row, topbar included, carrying its own dismiss
   * button. The same thing happens at 200% browser zoom on a
   * laptop, because zoom shrinks the viewport in CSS pixels, which is the
   * WCAG 1.4.10 reflow case.
   *
   * - 'md': collapse below 672px. The default.
   * - 'lg': collapse below 1056px. For products whose rail is verbose and
   *   whose inspector is usually open.
   * - 'none': never collapse. The pre-3.3 layout, for a frame that is only
   *   ever shown on a desktop (an installed desktop build, a control room).
   *
   * @default 'md'
   */
  collapseAt?: TShellCollapseAt
  /**
   * Whether the navigation drawer is open at collapsed widths. Optional: pass
   * it (as `v-model:sidebar-open`) to drive the drawer from the application,
   * leave it out and the shell owns the state itself. Ignored above
   * `collapseAt`, where the sidebar is a permanent column.
   */
  sidebarOpen?: boolean
  /**
   * Accessible name for the button that opens the navigation drawer. The
   * button carries `aria-expanded`, so the label should name the thing, not
   * the action: "Navigation", not "Open navigation".
   * @default 'Navigation'
   */
  navToggleLabel?: string
  /**
   * Accessible name for the button that closes the inspector sheet below
   * `collapseAt`. The button is rendered only in that overlay state, where the
   * sheet covers the topbar and therefore any close control the product put
   * there.
   * @default 'Close inspector'
   */
  inspectorCloseLabel?: string
}

export {
  IShellProps,
  TInspectorSize,
  TSidebarVariant,
  TShellTopbar,
  TShellCollapseAt,
}
