<template>
  <div class="nb-shell">
    <!-- ═══ SIDEBAR ═══ -->
    <nav class="nb-shell__sidebar">
      <div class="nb-shell__sidebar-logo">
        <slot name="sidebar-logo" />
      </div>

      <div class="nb-shell__sidebar-nav">
        <slot name="sidebar-nav" />
      </div>

      <div class="nb-shell__sidebar-spacer" />

      <div class="nb-shell__sidebar-bottom">
        <slot name="sidebar-bottom" />
      </div>
    </nav>

    <!-- ═══ BODY (topbar + main) ═══ -->
    <div class="nb-shell__body">
      <div class="nb-shell__topbar">
        <div class="nb-shell__topbar-left">
          <slot name="topbar-left" />
        </div>
        <div class="nb-shell__topbar-right">
          <slot name="topbar-right" />
        </div>
      </div>

      <div v-if="hasFixedbarContent" class="nb-shell__fixedbar">
        <slot name="fixedbar" />
      </div>

      <main class="nb-shell__main">
        <slot />
      </main>
    </div>

    <!-- ═══ INSPECTOR (optional third column) ═══ -->
    <aside
      class="nb-shell__inspector"
      :class="{
        'nb-shell__inspector--visible': inspectorVisible,
        'nb-shell__inspector--expanded': inspectorVisible && inspectorExpanded,
      }"
    >
      <slot name="inspector" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Comment, Fragment, Text, computed, useSlots, type VNode } from 'vue'
import { IShellProps } from './Shell.d'

const slots = useSlots()

function hasRenderableContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text)
      return (
        typeof node.children === 'string' && node.children.trim().length > 0
      )
    if (node.type === Fragment) {
      return Array.isArray(node.children)
        ? hasRenderableContent(node.children as VNode[])
        : false
    }
    return true
  })
}

const hasFixedbarContent = computed(() => {
  const content = slots.fixedbar?.()
  return content ? hasRenderableContent(content) : false
})

withDefaults(defineProps<IShellProps>(), {
  inspectorVisible: false,
  inspectorExpanded: false,
})
</script>

<style scoped lang="scss">
// ── CSS variables — override on `.nb-shell` to theme per-app ──────────────────

.nb-shell {
  // Sidebar
  --nb-shell-sidebar-bg: #1a1a2e;
  --nb-shell-sidebar-width: 56px;

  // Sidebar links (consumed by NbSidebarLink via inheritance)
  --nb-shell-sidebar-link-color: rgba(255, 255, 255, 0.55);
  --nb-shell-sidebar-link-hover-bg: rgba(255, 255, 255, 0.08);
  --nb-shell-sidebar-link-hover-color: rgba(255, 255, 255, 0.9);
  --nb-shell-sidebar-link-active-bg: rgba(124, 58, 237, 0.25);
  --nb-shell-sidebar-link-active-color: #a78bfa;

  // Topbar
  --nb-shell-topbar-height: calc(var(--nb-base-unit) * 6.25);

  // Inspector
  --nb-shell-inspector-width: 560px;
  --nb-shell-inspector-expanded-width: 50vw;
  --nb-shell-inspector-border: 1px solid #e8e8f0;
  --nb-shell-inspector-bg: var(--nb-c-surface, #fff);

  // ── Layout ────────────────────────────────────────────────────────────────

  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--nb-c-surface-raised, #f5f6fa);
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

.nb-shell__sidebar {
  width: var(--nb-shell-sidebar-width);
  flex-shrink: 0;
  background: var(--nb-shell-sidebar-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
  height: 100%;
  overflow: visible; // required so tooltips overflow the sidebar edge
  z-index: 100;
}

.nb-shell__sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.nb-shell__sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
}

.nb-shell__sidebar-spacer {
  flex: 1;
}

.nb-shell__sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 0 8px 0.5rem;
}

// ── Body ───────────────────────────────────────────────────────────────────────

.nb-shell__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--nb-c-surface, #fff);
}

.nb-shell__topbar {
  flex-shrink: 0;
  height: var(--nb-shell-topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(var(--nb-base-unit) * 3);
  border-bottom: 1px solid var(--nb-c-border, #f0f0f8);
  background: var(--nb-c-surface, #fff);
  gap: 1rem;
}

.nb-shell__topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.nb-shell__topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.nb-shell__fixedbar {
  flex-shrink: 0;
  display: flex;
  padding: 0 calc(var(--nb-base-unit) * 3);
  border-bottom: 1px solid var(--nb-c-border, #f0f0f8);
  background: var(--nb-c-surface);
  gap: 1rem;
}

.nb-shell__main {
  flex: 1;
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

// ── Inspector ─────────────────────────────────────────────────────────────────

.nb-shell__inspector {
  width: 0;
  flex-shrink: 0;
  background: var(--nb-shell-inspector-bg);
  border-left: 0 solid transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition:
    width 0.2s ease,
    border-color 0.2s ease;

  &--visible {
    width: var(--nb-shell-inspector-width);
    border-left: var(--nb-shell-inspector-border);
  }

  &--expanded {
    width: var(--nb-shell-inspector-expanded-width);
  }
}
</style>
