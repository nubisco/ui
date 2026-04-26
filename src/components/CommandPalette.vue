<template>
  <Teleport to="body">
    <Transition name="nb-command-palette">
      <div
        v-if="state.isOpen"
        class="nb-command-palette__overlay"
        @click.self="state.close()"
      >
        <div class="nb-command-palette" @keydown="onKeydown">
          <!-- Search input -->
          <div class="nb-command-palette__input-row">
            <NbIcon
              name="magnifying-glass"
              :size="20"
              class="nb-command-palette__search-icon"
            />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="nb-command-palette__input"
              :placeholder="placeholder"
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <!-- Results -->
          <div
            v-if="groupedResults.length > 0"
            class="nb-command-palette__results"
          >
            <template v-for="group in groupedResults" :key="group.namespace">
              <div
                v-if="group.namespace"
                class="nb-command-palette__group-header"
              >
                {{ group.namespace }}
              </div>
              <div
                v-for="item in group.commands"
                :key="item.id"
                :class="[
                  'nb-command-palette__item',
                  {
                    'nb-command-palette__item--highlighted':
                      item.id === highlightedId,
                  },
                ]"
                @click="executeCommand(item)"
                @mouseenter="highlightedId = item.id"
              >
                <NbIcon
                  v-if="item.icon"
                  :name="item.icon"
                  :size="16"
                  class="nb-command-palette__item-icon"
                />
                <span class="nb-command-palette__item-label">{{
                  item.label
                }}</span>
                <span
                  v-if="item.shortcut"
                  class="nb-command-palette__item-shortcut"
                >
                  <kbd
                    v-for="(key, ki) in formatShortcutKeys(item.shortcut)"
                    :key="ki"
                    class="nb-command-palette__key"
                    >{{ key }}</kbd
                  >
                </span>
              </div>
            </template>
          </div>

          <!-- Empty state -->
          <div v-else-if="query" class="nb-command-palette__empty">
            No matching commands
          </div>
          <div v-else class="nb-command-palette__empty">
            Type to search commands
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  inject,
} from 'vue'
import type {
  ICommandPaletteProps,
  ICommand,
  ICommandPaletteState,
} from './CommandPalette.d'
import { NB_COMMAND_PALETTE_KEY } from '@/composables/useCommandPalette.composable'

const props = withDefaults(defineProps<ICommandPaletteProps>(), {
  openShortcut: 'Meta+k',
  placeholder: 'Search commands...',
  maxResults: 50,
})

const state = inject<ICommandPaletteState>(NB_COMMAND_PALETTE_KEY)!

const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const highlightedId = ref<string | null>(null)

// Fuzzy scoring
function fuzzyScore(text: string, pattern: string): number {
  const lower = text.toLowerCase()
  const pat = pattern.toLowerCase()

  // Exact prefix match scores highest
  if (lower.startsWith(pat)) return 1000 + (pat.length / lower.length) * 100

  // Word boundary match
  const words = lower.split(/[\s\-_./]+/)
  const wordStart = words.some((w) => w.startsWith(pat))
  if (wordStart) return 500

  // Substring match
  const subIdx = lower.indexOf(pat)
  if (subIdx >= 0) return 300 - subIdx

  // Fuzzy character-by-character forward scan
  let pi = 0
  let score = 0
  for (let i = 0; i < lower.length && pi < pat.length; i++) {
    if (lower[i] === pat[pi]) {
      score += 10
      // Bonus for consecutive matches
      if (i > 0 && lower[i - 1] === (pi > 0 ? pat[pi - 1] : '')) score += 5
      pi++
    }
  }
  return pi === pat.length ? score : -1
}

function scoreCommand(cmd: ICommand, pattern: string): number {
  let best = fuzzyScore(cmd.label, pattern)
  if (cmd.namespace) {
    best = Math.max(best, fuzzyScore(cmd.namespace, pattern) * 0.8)
  }
  if (cmd.keywords) {
    for (const kw of cmd.keywords) {
      best = Math.max(best, fuzzyScore(kw, pattern) * 0.7)
    }
  }
  return best
}

const filteredCommands = computed(() => {
  const allCommands = Array.from(state.commands.values())

  // Filter by active context
  const contextFiltered = allCommands.filter(
    (cmd) => !cmd.context || cmd.context === state.activeContext,
  )

  if (!query.value) return contextFiltered.slice(0, props.maxResults)

  const scored = contextFiltered
    .map((cmd) => ({ cmd, score: scoreCommand(cmd, query.value) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, props.maxResults)

  return scored.map((s) => s.cmd)
})

interface ICommandGroup {
  namespace: string
  commands: ICommand[]
}

const groupedResults = computed<ICommandGroup[]>(() => {
  const groups = new Map<string, ICommand[]>()
  for (const cmd of filteredCommands.value) {
    const ns = cmd.namespace ?? ''
    if (!groups.has(ns)) groups.set(ns, [])
    groups.get(ns)!.push(cmd)
  }
  // Sort groups alphabetically by namespace, commands alphabetically within each group
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([namespace, commands]) => ({
      namespace,
      commands: commands.sort((a, b) => a.label.localeCompare(b.label)),
    }))
})

// Flat list follows the sorted group order for arrow key navigation
const flatResults = computed(() =>
  groupedResults.value.flatMap((g) => g.commands),
)

function executeCommand(cmd: ICommand) {
  state.close()
  query.value = ''
  cmd.handler()
}

function onKeydown(e: KeyboardEvent) {
  // Escape always dismisses, regardless of result state
  if (e.key === 'Escape') {
    e.preventDefault()
    state.close()
    query.value = ''
    return
  }

  const items = flatResults.value
  if (!items.length) return

  const currentIdx = items.findIndex((c) => c.id === highlightedId.value)

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0
    highlightedId.value = items[next].id
    scrollToHighlighted()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1
    highlightedId.value = items[prev].id
    scrollToHighlighted()
  } else if (e.key === 'Enter' && highlightedId.value) {
    e.preventDefault()
    const cmd = items.find((c) => c.id === highlightedId.value)
    if (cmd) executeCommand(cmd)
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = document.querySelector('.nb-command-palette__item--highlighted')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

// Reset state on open
watch(
  () => state.isOpen,
  (val) => {
    if (val) {
      query.value = state.searchFilter ?? ''
      highlightedId.value = null
      nextTick(() => {
        inputRef.value?.focus()
        // Highlight first result after query settles
        nextTick(() => {
          if (flatResults.value.length > 0) {
            highlightedId.value = flatResults.value[0].id
          }
        })
      })
      document.body.style.overflow = 'hidden'
    } else {
      query.value = ''
      document.body.style.overflow = ''
    }
  },
)

// Keep highlighted in bounds when results change
watch(filteredCommands, (cmds) => {
  if (cmds.length > 0 && !cmds.find((c) => c.id === highlightedId.value)) {
    highlightedId.value = cmds[0].id
  } else if (cmds.length === 0) {
    highlightedId.value = null
  }
})

const keySymbols: Record<string, string> = {
  cmd: '⌘',
  meta: '⌘',
  shift: '⇧',
  alt: '⌥',
  option: '⌥',
  ctrl: '⌃',
  control: '⌃',
}

function formatShortcutKeys(shortcut: string): string[] {
  return shortcut.split('+').map((part) => {
    const lower = part.trim().toLowerCase()
    return keySymbols[lower] || part.trim()
  })
}

// Global keyboard shortcut
function parseShortcut(shortcut: string): {
  key: string
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
} {
  const parts = shortcut.toLowerCase().split('+')
  return {
    key: parts[parts.length - 1],
    meta: parts.includes('meta') || parts.includes('cmd'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  // Escape always dismisses, regardless of focus state
  if (e.key === 'Escape' && state.isOpen) {
    e.preventDefault()
    state.close()
    query.value = ''
    return
  }

  const shortcut = parseShortcut(props.openShortcut)
  const keyMatch = e.key.toLowerCase() === shortcut.key
  const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey
  const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey
  const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
  const altMatch = shortcut.alt ? e.altKey : !e.altKey

  if (keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch) {
    e.preventDefault()
    if (state.isOpen) {
      state.close()
    } else {
      state.open()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss">
.nb-command-palette__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: var(--nb-zindex-command-palette, 326);
}

.nb-command-palette {
  width: 100%;
  max-width: 640px;
  max-height: 480px;
  background: var(--nb-c-layer-3);
  border: 1px solid var(--nb-c-layer-border-3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nb-command-palette__input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--nb-c-layer-border-3);
}

.nb-command-palette__search-icon {
  flex-shrink: 0;
  color: var(--nb-c-text-muted);
}

.nb-command-palette__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 18px;
  font-weight: 400;
  color: var(--nb-c-text);
  font-family: var(--nb-font-family-sans, sans-serif);
  outline: none;
  line-height: 1.4;

  &::placeholder {
    color: var(--nb-c-text-subtle);
  }
}

.nb-command-palette__results {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 0;
}

.nb-command-palette__group-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--nb-c-text-muted);
  padding: 8px 16px 4px;
}

.nb-command-palette__item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 16px;
  cursor: pointer;
  transition: background 0.08s;

  &:hover,
  &--highlighted {
    background: var(--nb-c-layer-hover-3);
  }
}

.nb-command-palette__item-icon {
  flex-shrink: 0;
  color: var(--nb-c-text-muted);
}

.nb-command-palette__item-label {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--nb-c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-command-palette__item-shortcut {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
}

.nb-command-palette__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--nb-font-family-sans, sans-serif);
  color: var(--nb-c-text-muted);
  background: var(--nb-c-layer-hover-3);
  border: 1px solid var(--nb-c-layer-border-3);
  border-radius: 4px;
  box-sizing: border-box;
}

.nb-command-palette__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--nb-c-text-subtle);
}

// Transitions
.nb-command-palette-enter-active,
.nb-command-palette-leave-active {
  transition: opacity 0.15s ease;

  .nb-command-palette {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
}

.nb-command-palette-enter-from {
  opacity: 0;

  .nb-command-palette {
    opacity: 0;
    transform: scale(0.97) translateY(-8px);
  }
}

.nb-command-palette-leave-to {
  opacity: 0;

  .nb-command-palette {
    opacity: 0;
    transform: scale(0.97) translateY(-8px);
  }
}
</style>
