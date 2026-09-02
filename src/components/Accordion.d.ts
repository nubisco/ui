/**
 * How the accordion's chevron is placed relative to its title.
 *
 *   - `'end'` (default): chevron on the trailing edge, so every title starts
 *     on the same line as the type around it. This is what a reader scans.
 *   - `'start'`: chevron ahead of the title, which makes the accordion read as
 *     a tree rather than as a list of sections. Reach for it only when the
 *     content really is hierarchical; for prose and documentation it makes the
 *     titles ragged against everything else on the page.
 */
export type TAccordionAlign = 'start' | 'end'

/** Row height. `md` is the default; `sm` is for dense panels, `lg` for pages
 *  whose content is mostly the accordion. */
export type TAccordionSize = 'sm' | 'md' | 'lg'

export interface IAccordionProps {
  /**
   * Ids of the open items. Use `v-model` for two-way binding.
   *
   * Always an array, including when `multiple` is false, so a consumer's
   * binding does not change shape when they change their mind about how many
   * sections may be open. With `multiple` false the array holds zero or one id.
   */
  modelValue?: string[]
  /**
   * Allow more than one item open at a time. Default false, which is the safer
   * starting point: it keeps the page short, which is the reason to reach for
   * an accordion in the first place.
   */
  multiple?: boolean
  /**
   * Drop the outer border and the side padding, so titles and chevrons sit
   * flush with the rules that divide them. For accordions inside a panel or a
   * sidebar, where the extra inset would misalign them against the content
   * above and put two rule lines close together.
   */
  flush?: boolean
  /** Chevron placement. See `TAccordionAlign`. */
  align?: TAccordionAlign
  /** Row height. */
  size?: TAccordionSize
  /**
   * Outline level the headers announce, 2 to 6. Default 3.
   *
   * The headers are `role="heading"` with `aria-level` rather than `<h3>`
   * elements. Two reasons, and the second is why it is not simply an `<h3>`:
   *
   *   - The right level depends on where the accordion sits in the page, and
   *     only the page knows that.
   *   - A bare `<h3>` inherits any `some-container h3 { margin }` rule the host
   *     has, and an element selector inside a class beats a component's own
   *     scoped class rule. That is not a fight a component can win, so it does
   *     not enter it.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

export interface IAccordionItemProps {
  /**
   * Stable identifier, used in `modelValue`. Generated when omitted, but an
   * accordion whose open state is persisted or driven from outside needs ids
   * that survive a re-render, so pass one.
   */
  id?: string
  /** The header text. A plain string; use the `title` slot for anything else. */
  title?: string
  /** Optional icon name, rendered before the title. */
  icon?: string
  /** Short text after the title, for a count or a status. */
  meta?: string
  /** Non-interactive: the header renders muted and cannot be toggled. */
  disabled?: boolean
}
