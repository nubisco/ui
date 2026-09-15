import type { TIconSource } from '@/types/Glyph.d'
export interface ICommand {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Phosphor icon name */
  icon?: TIconSource
  /** Namespace for grouping (e.g. "File", "Edit") */
  namespace?: string
  /** Keyboard shortcut display text (e.g. "Cmd+S") */
  shortcut?: string
  /** Function to execute when the command is invoked */
  handler: () => void | Promise<void>
  /** Context key: command only appears when this context is active */
  context?: string
  /** Additional search keywords */
  keywords?: string[]
}

/**
 * Results fetched for what the user has typed, rather than filtered from the
 * registered commands.
 *
 * Registered commands are a fixed list known up front, which is right for
 * actions and useless for content: an app cannot register a command per
 * ticket, document or customer. A suggester is asked on each keystroke and
 * returns commands built from whatever it found.
 *
 * Returned commands are shown as the suggester ordered them and are NOT put
 * through the palette's own fuzzy filter, because a result that matched on a
 * document's body has nothing in its label to match against and would be
 * dropped again the moment it arrived.
 */
export type TCommandSuggester = (
  query: string,
) => ICommand[] | Promise<ICommand[]>

export interface ICommandPaletteProps {
  /** Keyboard shortcut to open the palette (default: 'Meta+k') */
  openShortcut?: string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Maximum number of results to display */
  maxResults?: number
  /**
   * Optional source of query-driven results, merged in beside the registered
   * commands. Omitted, the palette behaves exactly as it always has.
   */
  suggest?: TCommandSuggester
  /**
   * How long to wait after a keystroke before asking the suggester, in
   * milliseconds. Default 150.
   */
  suggestDebounce?: number
}

export interface ICommandPaletteState {
  commands: Map<string, ICommand>
  isOpen: boolean
  activeContext: string | undefined
  searchFilter: string | undefined
  register: (command: ICommand) => void
  registerMany: (commands: ICommand[]) => void
  unregister: (id: string) => void
  open: (filter?: string) => void
  close: () => void
  setContext: (context: string | undefined) => void
}
