/**
 * The rail's expanded or collapsed state, as a person's preference.
 *
 * `NbShell`'s `sidebarVariant` is a plain prop, so every product that let people
 * collapse the rail built its own state, its own persistence and its own toggle,
 * and they disagreed: one reset the choice on every navigation, one derived the
 * variant from the route. docs/patterns/app-frame.md is explicit that switching
 * at runtime is "for a user preference, never for a route". This is that
 * preference, once.
 *
 * ```ts
 * const nav = useSidebarVariant({ storageKey: 'prelo.sidebar' })
 * ```
 * ```vue
 * <NbShell :sidebar-variant="nav.variant.value">
 *   <template #sidebar-bottom>
 *     <NbSidebarMenu>
 *       <NbSidebarCollapseToggle @toggle="nav.toggle" />
 *     </NbSidebarMenu>
 *   </template>
 * </NbShell>
 * ```
 *
 * Remembered per person, per product: the key is required and should be
 * namespaced, so two Nubisco products on one origin do not overwrite each
 * other's choice.
 */
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { TSidebarVariant } from '../components/Shell.d'

export interface ISidebarVariantOptions {
  /** localStorage key the preference is saved under. Namespace it per product. */
  storageKey: string
  /** What someone who has never chosen sees. `verbose` shows labels. */
  defaultVariant?: TSidebarVariant
}

export interface ISidebarVariantController {
  /** The current variant, for `NbShell`'s `sidebar-variant`. */
  variant: Ref<TSidebarVariant>
  isCompact: ComputedRef<boolean>
  toggle: () => void
  setVariant: (value: TSidebarVariant) => void
}

const VARIANTS: readonly TSidebarVariant[] = ['compact', 'verbose']

function isVariant(value: unknown): value is TSidebarVariant {
  return (
    typeof value === 'string' && (VARIANTS as readonly string[]).includes(value)
  )
}

/**
 * Storage can be missing (SSR, a sandboxed frame) or throw on access (a private
 * window, blocked site data). Either way the preference simply is not
 * remembered; the rail still works.
 */
function read(key: string): TSidebarVariant | null {
  try {
    const value = globalThis.localStorage?.getItem(key)
    // A stored value from an older build, or one edited by hand, is ignored
    // rather than passed to the shell as a variant it does not know.
    return isVariant(value) ? value : null
  } catch {
    return null
  }
}

function write(key: string, value: TSidebarVariant): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    /* not remembered; nothing else depends on it */
  }
}

export function useSidebarVariant(
  options: ISidebarVariantOptions,
): ISidebarVariantController {
  const variant = ref<TSidebarVariant>(
    read(options.storageKey) ?? options.defaultVariant ?? 'verbose',
  )

  watch(variant, (value) => write(options.storageKey, value))

  return {
    variant,
    isCompact: computed(() => variant.value === 'compact'),
    toggle: () => {
      variant.value = variant.value === 'compact' ? 'verbose' : 'compact'
    },
    setVariant: (value) => {
      if (isVariant(value)) variant.value = value
    },
  }
}
