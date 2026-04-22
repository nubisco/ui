export interface ICommand {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Phosphor icon name */
  icon?: string
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

export interface ICommandPaletteProps {
  /** Keyboard shortcut to open the palette (default: 'Meta+k') */
  openShortcut?: string
  /** Placeholder text for the search input */
  placeholder?: string
  /** Maximum number of results to display */
  maxResults?: number
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
