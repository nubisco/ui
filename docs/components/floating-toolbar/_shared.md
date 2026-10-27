<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

const editable = ref<HTMLElement | null>(null)
const selectionOpen = ref(false)
const selectionAnchor = shallowRef<{ getBoundingClientRect: () => DOMRect } | null>(null)

function onSelectionChange() {
  const selection = document.getSelection()
  const root = editable.value
  if (
    !root ||
    !selection ||
    selection.isCollapsed ||
    !selection.rangeCount ||
    !root.contains(selection.anchorNode)
  ) {
    selectionOpen.value = false
    return
  }
  const range = selection.getRangeAt(0)
  selectionAnchor.value = { getBoundingClientRect: () => range.getBoundingClientRect() }
  selectionOpen.value = true
}

function format(command: string) {
  document.execCommand(command)
}

onMounted(() => document.addEventListener('selectionchange', onSelectionChange))
onBeforeUnmount(() =>
  document.removeEventListener('selectionchange', onSelectionChange),
)
</script>
