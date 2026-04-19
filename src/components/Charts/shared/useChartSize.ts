import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

interface IChartSize {
  width: number
  height: number
}

// Track the rendered size of a container element via ResizeObserver. SVG
// charts use this to fill their parent responsively without relying on
// fixed pixel widths.
const useChartSize = (
  el: Ref<HTMLElement | null>,
  fallback: IChartSize = { width: 480, height: 280 },
) => {
  const size = ref<IChartSize>({ ...fallback })
  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!el.value || typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      size.value = {
        width: Math.max(0, Math.round(width)),
        height: Math.max(0, Math.round(height)),
      }
    })
    observer.observe(el.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return size
}

export { useChartSize }
export type { IChartSize }
