import { ref, reactive, inject, type InjectionKey } from 'vue'
import type {
  ICommand,
  ICommandPaletteState,
} from '../components/CommandPalette.d'

export const NB_COMMAND_PALETTE_KEY: InjectionKey<ICommandPaletteState> =
  Symbol('nb-command-palette')

export function createCommandPaletteState(): ICommandPaletteState {
  const commands = reactive(new Map<string, ICommand>())
  const isOpen = ref(false)
  const activeContext = ref<string | undefined>(undefined)
  const searchFilter = ref<string | undefined>(undefined)

  function register(command: ICommand) {
    commands.set(command.id, command)
  }

  function registerMany(cmds: ICommand[]) {
    for (const cmd of cmds) {
      commands.set(cmd.id, cmd)
    }
  }

  function unregister(id: string) {
    commands.delete(id)
  }

  function open(filter?: string) {
    searchFilter.value = filter
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    searchFilter.value = undefined
  }

  function setContext(context: string | undefined) {
    activeContext.value = context
  }

  return reactive({
    commands,
    isOpen,
    activeContext,
    searchFilter,
    register,
    registerMany,
    unregister,
    open,
    close,
    setContext,
  }) as ICommandPaletteState
}

export function useCommandPalette(): ICommandPaletteState {
  const state = inject(NB_COMMAND_PALETTE_KEY)
  if (!state) {
    throw new Error(
      'useCommandPalette() requires NbCommandPalettePlugin to be installed. ' +
        'Call app.use(NbCommandPalettePlugin) in your app setup.',
    )
  }
  return state
}
