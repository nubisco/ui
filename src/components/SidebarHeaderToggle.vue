<template>
  <button
    v-nb-tooltip="{ body: label, aria: 'none', position: 'right' }"
    type="button"
    class="nb-sidebar-header-toggle"
    :class="{ 'nb-sidebar-header-toggle--edge': isEdge }"
    :aria-label="label"
    :aria-expanded="!isCompact"
    @click="emit('toggle')"
  >
    <NbIcon :name="glyph" :size="isEdge ? 14 : 18" />
  </button>
</template>

<script setup lang="ts">
/**
 * An icon-only rail toggle for NbShell's `sidebar-header-action` slot, beside
 * the brand rather than at the bottom of the rail.
 *
 * The opt-in sibling of NbSidebarCollapseToggle: same contract (no state of its
 * own, reads the variant NbShell provides, emits `toggle`), same labels and
 * translation keys, so a product can move between the two without touching its
 * state or its catalogue. It also reads the slot's position from the shell, so
 * it draws itself as a bordered tab when the shell hangs it on the rail edge.
 */
import { computed, inject, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as iconSidebar from '@nubisco/ui/icons/sidebar-simple'
import * as iconCaretLeft from '@nubisco/ui/icons/caret-left'
import * as iconCaretRight from '@nubisco/ui/icons/caret-right'
import NbIcon from './Icon.vue'
import type { ISidebarHeaderToggleProps } from './SidebarHeaderToggle.d'
import type { TSidebarHeaderActionPosition } from './Shell.d'

const props = withDefaults(defineProps<ISidebarHeaderToggleProps>(), {
  collapseLabel: undefined,
  expandLabel: undefined,
  icon: undefined,
})

const emit = defineEmits<{
  /** The person asked to switch between collapsed and expanded. */
  toggle: []
}>()

const variant = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const position = inject<Ref<TSidebarHeaderActionPosition>>(
  'nb-shell-sidebar-header-action-position',
  ref('end') as Ref<TSidebarHeaderActionPosition>,
)
const isCompact = computed(() => variant.value === 'compact')
const isEdge = computed(() => position.value === 'edge')

const glyph = computed(() => {
  if (props.icon) return props.icon
  if (!isEdge.value) return iconSidebar
  return isCompact.value ? iconCaretRight : iconCaretLeft
})

// Shares NbSidebarCollapseToggle's keys on purpose: one catalogue entry covers
// whichever toggle a product uses.
const BUILT_IN: Record<string, Record<string, string>> = {
  en: { COLLAPSE: 'Collapse sidebar', EXPAND: 'Expand sidebar' },
  pt: { COLLAPSE: 'Recolher barra lateral', EXPAND: 'Expandir barra lateral' },
}

interface II18nLike {
  t: (key: string) => string
  te: (key: string) => boolean
  locale: { value: string }
}

function tryI18n(): II18nLike | null {
  try {
    return useI18n({ useScope: 'global' }) as unknown as II18nLike
  } catch {
    return null
  }
}
const i18n = tryI18n()

function t(key: 'COLLAPSE' | 'EXPAND'): string {
  const full = `sidebarCollapseToggle.${key}`
  if (i18n?.te(full)) return i18n.t(full)
  const lang = String(i18n?.locale.value ?? 'en')
    .toLowerCase()
    .split('-')[0]
  return BUILT_IN[lang]?.[key] ?? BUILT_IN.en[key]
}

const label = computed(() =>
  isCompact.value
    ? (props.expandLabel ?? t('EXPAND'))
    : (props.collapseLabel ?? t('COLLAPSE')),
)
</script>

<style scoped lang="scss">
.nb-sidebar-header-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--nb-radius-md);
  background: transparent;
  color: var(--nb-shell-sidebar-link-color);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    background: var(--nb-shell-sidebar-link-hover-bg);
    color: var(--nb-shell-sidebar-link-hover-color);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

// The tab on the rail's border sits over the page as much as over the rail,
// so it carries its own surface instead of the rail's transparent one.
.nb-sidebar-header-toggle--edge {
  width: 24px;
  height: 24px;
  border: 1px solid var(--nb-c-border);
  border-radius: 999px;
  background: var(--nb-c-surface);
  color: var(--nb-c-text-secondary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 15%);

  &:hover {
    background: var(--nb-c-surface-raised);
    color: var(--nb-c-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-sidebar-header-toggle {
    transition: none;
  }
}
</style>
