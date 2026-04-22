import { ref } from 'vue'

export function useContextMenu() {
  const isOpen = ref(false)
  const position = ref({ x: 0, y: 0 })

  function onContextMenu(e: MouseEvent) {
    e.preventDefault()
    position.value = { x: e.clientX, y: e.clientY }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function open(x: number, y: number) {
    position.value = { x, y }
    isOpen.value = true
  }

  return { isOpen, position, onContextMenu, open, close }
}
