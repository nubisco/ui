<template>
  <NbSidebarMenuItem
    class="nb-sidebar-collapse-toggle"
    :label="label"
    :icon="isCompact ? iconExpand : iconCollapse"
    @click="emit('toggle')"
  />
</template>

<script setup lang="ts">
/**
 * The standard control for collapsing and expanding the rail.
 *
 * Products had each built this twice: an icon link for the collapsed rail and a
 * menu row for the expanded one, with their own labels and icons. It is one
 * NbSidebarMenuItem, which already renders as a labelled row when expanded and
 * as an icon with a flyout label when collapsed, so the toggle gets both from a
 * single element. Place it inside an NbSidebarMenu in #sidebar-bottom, and pair
 * it with useSidebarVariant() for the state.
 *
 * It holds no state of its own: it reads the variant NbShell provides, so its
 * label and icon can never disagree with the rail it sits in.
 */
import { computed, inject, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as iconCollapse from '@nubisco/ui/icons/caret-line-left'
import * as iconExpand from '@nubisco/ui/icons/caret-line-right'
import NbSidebarMenuItem from './SidebarMenuItem.vue'
import type { ISidebarCollapseToggleProps } from './SidebarCollapseToggle.d'

const props = withDefaults(defineProps<ISidebarCollapseToggleProps>(), {
  collapseLabel: undefined,
  expandLabel: undefined,
})

const emit = defineEmits<{
  /** The person asked to switch between collapsed and expanded. */
  toggle: []
}>()

const variant = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const isCompact = computed(() => variant.value === 'compact')

// Same resolution order as NbUserMenu: the host's catalogue under
// `sidebarCollapseToggle.*`, else the built-in string for the active language,
// else English. Unlike NbUserMenu this does not REQUIRE vue-i18n: a rail toggle
// should not add a hard dependency to every product, so without an i18n
// instance it falls back to the built-in English.
const BUILT_IN: Record<string, Record<string, string>> = {
  en: { COLLAPSE: 'Collapse sidebar', EXPAND: 'Expand sidebar' },
  pt: { COLLAPSE: 'Recolher barra lateral', EXPAND: 'Expandir barra lateral' },
}

/** The three pieces of vue-i18n this uses, so it can be absent. */
interface II18nLike {
  t: (key: string) => string
  te: (key: string) => boolean
  locale: { value: string }
}

function tryI18n(): II18nLike | null {
  try {
    return useI18n({ useScope: 'global' }) as unknown as II18nLike
  } catch {
    // No i18n instance installed: the built-in English applies.
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
