interface ISidebarLinkProps {
  /**
   * Target route. When vue-router is installed, the link renders as a
   * `<RouterLink>` and accepts any value valid for its `to` prop (string path or
   * location object). Without vue-router, a string `to` falls back to a plain
   * `<a>` and an object `to` falls back to a `<button>` that emits `click`.
   */
  to?: string | Record<string, unknown>
  /** External href — renders as a plain `<a>`. Used when `to` is not set. */
  href?: string
  /**
   * Tooltip text shown to the right of the sidebar on hover.
   *
   * @deprecated Use the `v-nb-tooltip` directive instead. This prop renders a
   * CSS-only `::after` chip that is hover-only (a keyboard user tabbing the
   * sidebar gets nothing), gives the link no accessible name, cannot flip or
   * clamp against the viewport, and is fixed to the right of the anchor, so it
   * is clipped by any sidebar that is not the shell's own. It works only on
   * this one component, which is why three apps rebuilt the affordance by hand
   * for their topbars. `v-nb-tooltip="{ body: 'Settings' }"` replaces it and
   * additionally names the link for assistive technology. The prop still works
   * and is not scheduled for removal, but new code should not use it.
   * See /ui/directives/tooltip.
   */
  tooltip?: string
  /** Marks the link as the currently active route. */
  active?: boolean
  /** Prevents interaction. */
  disabled?: boolean
  /**
   * Applies a danger (red) hover style — use for destructive actions like
   * sign-out.
   */
  danger?: boolean
}

export { ISidebarLinkProps }
