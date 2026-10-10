import { computed, inject, type InjectionKey, type Ref } from 'vue'

/**
 * What the frame is doing with its layout, for content inside it.
 *
 * A product could not tell whether NbShell had collapsed or whether its
 * inspector had become a sheet, so it could not make room for the sheet's own
 * dismiss button or drop a close control the frame already supplies. The two
 * answers are computed in the shell anyway: this hands them down.
 */
export interface IShellLayout {
  /** True while the frame runs its single-column, drawer layout. */
  collapsed: Readonly<Ref<boolean>>
  /** True while the inspector is a sheet over the content, not a column. */
  inspectorOverlay: Readonly<Ref<boolean>>
}

export const NB_SHELL_LAYOUT_KEY: InjectionKey<IShellLayout> =
  Symbol('nb-shell-layout')

/**
 * The layout of the nearest NbShell.
 *
 * Outside a shell both answers are false, which is the desktop answer, so a
 * component that asks still renders sensibly in a docs preview or a test.
 */
export function useShellLayout(): IShellLayout {
  const provided = inject(NB_SHELL_LAYOUT_KEY, null)
  if (provided) return provided
  const off = computed(() => false)
  return { collapsed: off, inspectorOverlay: off }
}
