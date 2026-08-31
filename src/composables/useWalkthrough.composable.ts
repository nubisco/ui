import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type {
  IWalkthrough,
  IWalkthroughController,
  IWalkthroughOptions,
  IWalkthroughStep,
  TWalkthroughOutcome,
} from '@/components/Walkthrough.d'
import { createDefaultWalkthroughStorage } from '@/utils/walkthroughStorage.helper'

const EMPTY_WALKTHROUGH: IWalkthrough = { id: '', version: 1, steps: [] }

/**
 * The walkthrough state machine, with no rendering attached.
 *
 * Splitting it from `<NbWalkthrough>` is what makes a tour startable from
 * places that have no template of their own — a help menu handler, a router
 * guard, an onboarding checklist — and makes the interesting behaviour
 * (version-gated auto-start, step advancement, persistence) testable without
 * mounting anything.
 *
 * @example
 * const tour = useWalkthrough(introTour)
 * onMounted(() => tour.maybeAutoStart())
 * // …later, from a "Show me around" menu item:
 * tour.restart()
 */
// #region useWalkthrough
export function useWalkthrough(
  source: MaybeRefOrGetter<IWalkthrough>,
  options: IWalkthroughOptions = {},
): IWalkthroughController {
  const storage = options.storage ?? createDefaultWalkthroughStorage()

  const walkthrough = computed<IWalkthrough>(
    () => toValue(source) ?? EMPTY_WALKTHROUGH,
  )
  const steps = computed<IWalkthroughStep[]>(
    () => walkthrough.value.steps ?? [],
  )
  const stepCount = computed(() => steps.value.length)

  const active = ref(false)
  const stepIndex = ref(0)

  const step = computed(() => steps.value[stepIndex.value])
  const isFirst = computed(() => stepIndex.value === 0)
  const isLast = computed(
    () => stepIndex.value >= Math.max(0, stepCount.value - 1),
  )

  function notifyStepChange() {
    const current = step.value
    if (current) options.onStepChange?.(current, stepIndex.value)
  }

  function start() {
    if (stepCount.value === 0) return
    stepIndex.value = 0
    active.value = true
    notifyStepChange()
  }

  function goTo(index: number) {
    if (!active.value) return
    const clamped = Math.min(Math.max(index, 0), stepCount.value - 1)
    if (clamped === stepIndex.value) return
    stepIndex.value = clamped
    notifyStepChange()
  }

  async function end(outcome: TWalkthroughOutcome) {
    const endedAt = stepIndex.value
    active.value = false
    await storage.set(walkthrough.value.id, {
      version: walkthrough.value.version,
      outcome,
      completedAt: new Date().toISOString(),
    })
    if (outcome === 'finish') options.onFinish?.(walkthrough.value)
    else options.onSkip?.(walkthrough.value, endedAt)
  }

  async function finish() {
    await end('finish')
  }

  async function skip() {
    await end('skip')
  }

  function next() {
    if (!active.value) return
    if (isLast.value) {
      void finish()
      return
    }
    goTo(stepIndex.value + 1)
  }

  function back() {
    if (!active.value || isFirst.value) return
    goTo(stepIndex.value - 1)
  }

  async function isCompleted(): Promise<boolean> {
    if (!walkthrough.value.id) return false
    const record = await storage.get(walkthrough.value.id)
    // `>=` rather than `===`: a user who has seen a newer version (rolled back
    // deploy, A/B branch) should not be re-shown an older one.
    return !!record && record.version >= walkthrough.value.version
  }

  async function reset() {
    if (!walkthrough.value.id) return
    await storage.remove(walkthrough.value.id)
  }

  async function restart() {
    await reset()
    start()
  }

  async function maybeAutoStart(): Promise<boolean> {
    if (active.value || stepCount.value === 0) return false
    if (await isCompleted()) return false
    start()
    return true
  }

  return {
    active,
    stepIndex,
    step,
    steps,
    stepCount,
    isFirst,
    isLast,
    walkthrough,
    start,
    restart,
    next,
    back,
    goTo,
    finish,
    skip,
    maybeAutoStart,
    isCompleted,
    reset,
  }
}
// #endregion useWalkthrough
