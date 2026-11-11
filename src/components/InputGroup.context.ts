import {
  computed,
  inject,
  type ComputedRef,
  type InjectionKey,
  getCurrentInstance,
} from 'vue'

/** The control-height scale fields and buttons share. */
export type TInputGroupSize = 'xs' | 'sm' | 'md' | 'lg'

/**
 * What `NbInputGroup` hands the fields inside it.
 *
 * The group owns the label and the message, so the controls in its row are
 * bare and their boxes line up on one row. A field reads this to take the
 * group's size, its validation state and its message, and the first field to
 * ask takes the id the group's `<label for>` points at.
 *
 * Lives in a `.ts` rather than a `.d.ts` because the key is a runtime value.
 */
export interface IInputGroupContext {
  size: ComputedRef<TInputGroupSize>
  disabled: ComputedRef<boolean>
  /** `error` or `warning` while the group shows one, else undefined. */
  status: ComputedRef<'error' | 'warning' | undefined>
  /** The id of the group's message, for the fields' `aria-describedby`. */
  describedBy: ComputedRef<string | undefined>
  /**
   * The id the group's label points at, given to the first field that asks
   * and `undefined` to every field after it.
   */
  claimControlId: () => string | undefined
}

export const NB_INPUT_GROUP_CONTEXT: InjectionKey<IInputGroupContext> =
  Symbol.for('@nubisco/ui:input-group-context')

interface IGroupedFieldProps {
  id?: string
  size?: TInputGroupSize
  disabled?: boolean
  label?: string
  helper?: string
  error?: string | boolean
  warning?: string | boolean
}

const OWN_TEXT = ['label', 'helper', 'error', 'warning'] as const

/**
 * A field's view of the group it sits in, or of no group at all.
 *
 * Every value falls back to the field's own prop, so a field outside a group
 * behaves exactly as it did. Inside one, the group's size and disabled state
 * win: a group is one control, and a field one size off its button would
 * defeat the point of putting them together.
 */
export function useInputGroupField(props: IGroupedFieldProps, autoId: string) {
  const group = inject(NB_INPUT_GROUP_CONTEXT, null)
  // Claimed once, during setup, so render order decides which field the
  // label belongs to and it never moves between fields afterwards.
  const claimedId = group?.claimControlId()

  const id = computed(() => props.id ?? claimedId ?? autoId)
  const size = computed<TInputGroupSize>(
    () => group?.size.value ?? props.size ?? 'md',
  )
  const disabled = computed(() => !!props.disabled || !!group?.disabled.value)
  const status = computed(() => group?.status.value)
  const describedBy = computed(() => group?.describedBy.value)

  /*
   * Inside a group the group owns the label and the message, so a field
   * draws neither of its own. A field given one anyway would otherwise
   * show a second label, or an error the group does not know about, so say
   * which prop is being ignored and where it belongs.
   */
  if (
    group &&
    !(typeof process !== 'undefined' && process.env.NODE_ENV === 'production')
  ) {
    const ignored = OWN_TEXT.filter((key) => !!props[key])
    if (ignored.length > 0) {
      const name =
        (getCurrentInstance()?.type as { __name?: string } | undefined)
          ?.__name ?? 'field'
      console.warn(
        `[NbInputGroup] ${name} ignores its own ${ignored.join(', ')} inside a ` +
          'group. Pass them to NbInputGroup, which labels and describes the ' +
          'whole control.',
      )
    }
  }

  return { grouped: !!group, id, size, disabled, status, describedBy }
}
