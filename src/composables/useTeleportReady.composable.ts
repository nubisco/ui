import { inject, onMounted, ref, type InjectionKey, type Ref } from 'vue'

/**
 * Teleports that survive server rendering.
 *
 * During SSR, Vue does not write a `<Teleport>`'s children where the component
 * sits: it collects them into `ctx.teleports` for the server to inject into the
 * target. A prerenderer that never injects that buffer (vite-ssg is one) sends
 * a page without it, and the browser then hydrates the teleport against
 * whatever the target's first child happens to be. For `to="body"` that is the
 * app's own root element, so hydration reports a mismatch and can replace it.
 *
 * An app that renders on the server opts in with
 * `app.use(NubiscoUI, { ssr: true })`. Every teleport in the library then stays
 * DISABLED (rendered in place, on the server and in the browser alike) until
 * the component has mounted, and only then moves its content to the target.
 * Server and browser markup match, and a closed overlay's content is an empty
 * placeholder, so nothing visible moves.
 *
 * Without the option nothing changes: teleports are enabled from the first
 * render, exactly as before. Components mounted after the app has hydrated
 * (opened later, or on another page) teleport at once as well.
 */

export interface INbHydration {
  /** True until the app's `mount()` has finished hydrating the server markup. */
  pending: Ref<boolean>
}

export const NB_HYDRATION: InjectionKey<INbHydration> = Symbol.for(
  '@nubisco/ui:hydration',
)

/** Whether this component's `<Teleport>` may move its content to the target yet. */
export function useTeleportReady(): Ref<boolean> {
  const hydration = inject(NB_HYDRATION, null)
  const ready = ref(!hydration || !hydration.pending.value)
  if (!ready.value) {
    onMounted(() => {
      ready.value = true
    })
  }
  return ready
}
