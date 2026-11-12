import { computed, ref, watch, type ComputedRef } from 'vue'

/**
 * The entrance animation of a chart, opt-in through `animate`.
 *
 * The animation itself is CSS, so it runs on first render with nothing to do.
 * What CSS cannot do is run again when the data changes, because the same
 * elements are patched in place and a running or finished animation does not
 * restart. The chart folds `runKey` into the `key` of the elements it animates,
 * so a change of data replaces them and the entrance plays again.
 *
 * With `animate` off, `runKey` stays 0 for ever, so the keys, and therefore
 * the DOM, are exactly what the chart rendered before this existed.
 */
export function useChartEntrance(
  enabled: () => boolean,
  source: () => unknown,
): { runKey: ComputedRef<number> } {
  const run = ref(0)
  watch(
    source,
    () => {
      if (enabled()) run.value += 1
    },
    { deep: true },
  )
  return { runKey: computed(() => (enabled() ? run.value : 0)) }
}
