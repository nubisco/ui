<template>
  <nav ref="barRef" role="menubar" class="nb-menubar" @keydown="onKeydown">
    <slot />
  </nav>
</template>

<script setup lang="ts">
import { ref, provide, reactive } from 'vue'
import type { IMenuBarProps } from './Menu.d'

withDefaults(defineProps<IMenuBarProps>(), {
  maxWidth: undefined,
})

const activeMenu = ref<string | null>(null)
const anyOpen = ref(false)

interface ITriggerEntry {
  id: string
  el: HTMLElement
  open: () => void
  close: () => void
}

const triggers = reactive<ITriggerEntry[]>([])

function registerTrigger(entry: ITriggerEntry) {
  const existing = triggers.findIndex((t) => t.id === entry.id)
  if (existing >= 0) {
    triggers[existing] = entry
  } else {
    triggers.push(entry)
  }
}

function unregisterTrigger(id: string) {
  const idx = triggers.findIndex((t) => t.id === id)
  if (idx >= 0) triggers.splice(idx, 1)
}

function setActiveMenu(id: string | null) {
  if (activeMenu.value && activeMenu.value !== id) {
    const prev = triggers.find((t) => t.id === activeMenu.value)
    prev?.close()
  }
  activeMenu.value = id
  anyOpen.value = id !== null
  if (id) {
    const entry = triggers.find((t) => t.id === id)
    entry?.open()
  }
}

function closeAll() {
  triggers.forEach((t) => t.close())
  activeMenu.value = null
  anyOpen.value = false
}

provide('nb-menubar', {
  activeMenu,
  anyOpen,
  setActiveMenu,
  closeAll,
  registerTrigger,
  unregisterTrigger,
})

function getTriggerElements(): HTMLElement[] {
  return triggers.map((t) => t.el)
}

function onKeydown(e: KeyboardEvent) {
  const triggerEls = getTriggerElements()
  const currentIdx = triggerEls.findIndex(
    (el) =>
      el === document.activeElement ||
      el.contains(document.activeElement as Node),
  )

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    const next = (currentIdx + 1) % triggerEls.length
    triggerEls[next]?.focus()
    if (anyOpen.value) {
      setActiveMenu(triggers[next].id)
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const prev = (currentIdx - 1 + triggerEls.length) % triggerEls.length
    triggerEls[prev]?.focus()
    if (anyOpen.value) {
      setActiveMenu(triggers[prev].id)
    }
  } else if (e.key === 'Escape') {
    closeAll()
    if (currentIdx >= 0) {
      triggerEls[currentIdx]?.focus()
    }
  }
}
</script>

<style scoped lang="scss">
.nb-menubar {
  display: flex;
  align-items: center;
  height: 32px;
  background: var(--nb-c-surface);
  padding: 0 8px;
  gap: 0;
  font-family: var(--nb-font-family-sans, sans-serif);
}
</style>
