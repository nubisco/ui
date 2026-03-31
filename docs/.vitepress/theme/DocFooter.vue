<template>
  <footer :class="classes">
    <!-- Block-style prev/next navigation -->
    <nav v-if="prev || next" class="doc-footer__nav">
      <a
        v-if="prev"
        :href="prev.link"
        class="doc-footer__nav-item doc-footer__nav-item--prev"
      >
        <span class="doc-footer__nav-label">Previous</span>
        <span class="doc-footer__nav-title">{{ prev.text }}</span>
      </a>
      <span v-else class="doc-footer__nav-spacer" />

      <a
        v-if="next"
        :href="next.link"
        class="doc-footer__nav-item doc-footer__nav-item--next"
      >
        <span class="doc-footer__nav-label">Next</span>
        <span class="doc-footer__nav-title">{{ next.text }}</span>
      </a>
      <span v-else class="doc-footer__nav-spacer" />
    </nav>

    <!-- Footer bar: logo / edit link / copyright -->
    <div class="doc-footer__bar">
      <a href="/" class="doc-footer__brand">
        <img src="/nubisco-logo.svg" alt="Nubisco" class="doc-footer__logo" />
        <span class="doc-footer__brand-name">Nubisco</span>
      </a>

      <div class="doc-footer__meta">
        <a
          v-if="editLink"
          :href="editLink"
          target="_blank"
          rel="noreferrer"
          class="doc-footer__edit-link"
        >
          Edit this page on GitHub
        </a>
        <span class="doc-footer__copyright">
          Copyright &copy; 2026 Nubisco &middot; Released under the MIT License
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page, theme } = useData()

// ── Flatten sidebar into an ordered list of links ──────────────────────────
interface SidebarLink {
  text: string
  link: string
}

const classes = computed(() => {
  return {
    'doc-footer': true,
  }
})

function flattenSidebar(items: any[]): SidebarLink[] {
  const result: SidebarLink[] = []
  for (const item of items) {
    if (item.link) result.push({ text: item.text ?? '', link: item.link })
    if (item.items?.length) result.push(...flattenSidebar(item.items))
  }
  return result
}

const allLinks = computed<SidebarLink[]>(() => {
  const sidebar = theme.value.sidebar
  if (!sidebar) return []
  if (Array.isArray(sidebar)) return flattenSidebar(sidebar)
  // Object keyed by path prefix — merge all groups
  return Object.values(sidebar).flatMap((group: any) =>
    Array.isArray(group) ? flattenSidebar(group) : [],
  )
})

const currentPath = computed(() => {
  // page.relativePath looks like "ui/components/button.md"
  // sidebar links look like "/ui/components/button"
  return (
    '/' + page.value.relativePath.replace(/\.md$/, '').replace(/\/index$/, '/')
  )
})

const currentIndex = computed(() =>
  allLinks.value.findIndex(
    (l) => withBase(l.link) === withBase(currentPath.value),
  ),
)

const prev = computed(() =>
  currentIndex.value > 0 ? allLinks.value[currentIndex.value - 1] : null,
)
const next = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < allLinks.value.length - 1
    ? allLinks.value[currentIndex.value + 1]
    : null,
)

// ── Edit link ───────────────────────────────────────────────────────────────
const editLink = computed(() => {
  const pattern = theme.value.editLink?.pattern
  if (!pattern) return null
  return pattern.replace(':path', page.value.relativePath)
})
</script>

<style scoped>
.doc-footer {
  background: var(--nb-c-black);
  color: var(--nb-c-white);
  margin-top: 40px;
  border-top: none;
  padding: 40px;
}

/* ── Block prev/next navigation ──────────────────────────────────────────── */
.doc-footer__nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.doc-footer__nav-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  text-decoration: none;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.doc-footer__nav-item:hover {
  border-color: var(--nb-c-magenta);
  background: rgba(255, 255, 255, 0.08);
}

.doc-footer__nav-item--next {
  text-align: right;
}

.doc-footer__nav-spacer {
  display: block;
}

.doc-footer__nav-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.doc-footer__nav-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nb-c-white);
  line-height: 1.4;
}

/* ── Footer bar ──────────────────────────────────────────────────────────── */
.doc-footer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}

.doc-footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.doc-footer__logo {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.doc-footer__brand-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--nb-c-white);
}

.doc-footer__meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.doc-footer__edit-link {
  font-size: 12px;
  color: var(--nb-c-magenta);
  text-decoration: none;
}

.doc-footer__edit-link:hover {
  text-decoration: underline;
}

.doc-footer__copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
