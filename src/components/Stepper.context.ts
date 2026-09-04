import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { EStepStatus, IStepperLabels } from './Stepper.d'

/**
 * One step's entry in the parent's registry.
 *
 * `el` is a getter rather than an element because a step registers during
 * `setup()`, before its `<li>` exists. The parent calls it once the DOM is
 * there, which is how the registry can be re-sorted into document order.
 */
export interface IStepperEntry {
  uid: string
  disabled: ComputedRef<boolean>
  el: () => HTMLElement | null
}

/**
 * What an `NbStepperStep` needs from the `NbStepper` around it.
 *
 * Lives in a `.ts` rather than the `.d.ts` beside it because `Symbol()` is a
 * runtime value, matching `Accordion.context.ts`.
 */
export interface IStepperContext {
  /** Index of the current step. */
  current: Readonly<Ref<number>>
  /** Furthest index reached, which is the boundary `navigable` opens up. */
  furthest: Readonly<Ref<number>>
  orientation: Readonly<Ref<string>>
  size: Readonly<Ref<string>>
  navigable: Readonly<Ref<boolean>>
  labels: ComputedRef<Required<IStepperLabels>>
  /**
   * Registered step ids in **document order**, which is the single source of
   * every step's number and derived status. Mount order is not document order
   * once a step is added, removed or moved after the first render.
   */
  order: Readonly<Ref<string[]>>
  /** Index of the one step that holds `tabindex="0"`, or -1 when none does. */
  tabbable: ComputedRef<number>
  /** Add a step and get back its remover. */
  register: (entry: IStepperEntry) => () => void
  /** Whether a step at `index` may be clicked back to. */
  clickable: (index: number, disabled: boolean) => boolean
  /** Move to a step. Ignored unless `clickable` agrees. */
  select: (index: number, disabled: boolean) => void
}

/** Status resolution shared by the step and its tests. */
export type TStepStatus = `${EStepStatus}`

export const NB_STEPPER_CONTEXT: InjectionKey<IStepperContext> =
  Symbol('NB_STEPPER_CONTEXT')
