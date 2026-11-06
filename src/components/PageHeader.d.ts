import type { IActionGroupItem } from './ActionGroup.d'

export interface IPageHeaderProps {
  /**
   * The page's title, rendered as its one `<h1>` at the `heading-03` size and
   * a regular weight. Use the `title` slot for anything richer than a string
   * (an inline editor, say).
   */
  title?: string
  /**
   * The page's actions, rendered through `NbActionGroup` with
   * `overflow="phone"`: labelled buttons on a desktop, the main one as an
   * icon and the rest in one menu on a phone. One of them `primary` at most.
   * Use the `actions` slot instead for anything other than a list of
   * buttons.
   */
  actions?: IActionGroupItem[]
  /**
   * Stick to the top of the scroll container (the shell's main region) as the
   * page scrolls, with a surface and a rule under it. For record views, where
   * the title, the status and the actions should stay in reach.
   *
   * @default false
   */
  sticky?: boolean
}
