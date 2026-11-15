import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { prefersReducedMotion } from './useReducedMotion.composable'

/**
 * How close to the end, in pixels, still counts as reading the newest entry.
 * A reader resting a few pixels above the end (a trackpad settling, a
 * rounding error on a zoomed page) is still following.
 */
const AT_END_SLACK = 24

/**
 * A scrolling log that follows its newest entry: the shared behaviour of
 * NbChatThread and NbLogView, kept internal.
 *
 * While the reader is at the end, anything added to the element (a message,
 * a line, more text streamed into the last message) keeps them at the end.
 * Once they scroll up to read, nothing moves under them, and `unseen` turns
 * true when something new arrives, so the host can offer a way back.
 *
 * It watches the DOM rather than a prop, so it sees content a slot renders
 * and text streamed into an existing node, which no prop would report.
 */
export function useFollowNewest(
  el: Ref<HTMLElement | null>,
  enabled: () => boolean = () => true,
) {
  /** The reader is at the end, so new content keeps them there. */
  const atEnd = ref(true)
  /** Something arrived while the reader was scrolled up. */
  const unseen = ref(false)

  function distanceFromEnd(node: HTMLElement): number {
    return node.scrollHeight - node.scrollTop - node.clientHeight
  }

  function onScroll(): void {
    const node = el.value
    if (!node) return
    atEnd.value = distanceFromEnd(node) <= AT_END_SLACK
    if (atEnd.value) unseen.value = false
  }

  /**
   * To the end. `smooth` is for a move the reader asked for (the jump
   * button), and falls back to instant under reduced motion. Following is
   * always instant, so streamed text never trails behind a running scroll.
   */
  function scrollToEnd(smooth = false): void {
    const node = el.value
    if (!node) return
    const top = node.scrollHeight
    if (typeof node.scrollTo === 'function')
      node.scrollTo({
        top,
        behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'instant',
      })
    else node.scrollTop = top
    atEnd.value = true
    unseen.value = false
  }

  function onContentChange(): void {
    if (!enabled()) return
    if (atEnd.value) scrollToEnd()
    else unseen.value = true
  }

  let mutations: MutationObserver | null = null
  let resizes: ResizeObserver | null = null

  onMounted(() => {
    const node = el.value
    if (!node) return
    if (enabled()) scrollToEnd()
    if (typeof MutationObserver !== 'undefined') {
      mutations = new MutationObserver(onContentChange)
      mutations.observe(node, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
    // A taller composer or a rotated phone shrinks the viewport: keep the
    // newest entry in view if it was.
    if (typeof ResizeObserver !== 'undefined') {
      resizes = new ResizeObserver(() => {
        if (enabled() && atEnd.value) scrollToEnd()
      })
      resizes.observe(node)
    }
  })

  onBeforeUnmount(() => {
    mutations?.disconnect()
    resizes?.disconnect()
  })

  return { atEnd, unseen, onScroll, scrollToEnd, onContentChange }
}
