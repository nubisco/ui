<template>
  <div class="nb-layout">
    <page-header :title="frontmatter.title" />

    <nav v-if="tabs.length" class="nb-layout__tabs" aria-label="Page sections">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="nb-layout__tab"
        :class="{ 'is-active': tab === activeTab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </nav>

    <main class="nb-layout__body">
      <Content />
    </main>

    <!-- Footer: prev/next navigation + meta -->
    <footer class="nb-layout__footer">
      <nav v-if="prev || next" class="nb-footer__nav">
        <a
          v-if="prev"
          :href="prev.link"
          class="nb-footer__nav-item nb-footer__nav-item--prev"
        >
          <span class="nb-footer__nav-label">Previous</span>
          <span class="nb-footer__nav-title">{{ prev.text }}</span>
        </a>
        <span v-else class="nb-footer__nav-spacer" />

        <a
          v-if="next"
          :href="next.link"
          class="nb-footer__nav-item nb-footer__nav-item--next"
        >
          <span class="nb-footer__nav-label">Next</span>
          <span class="nb-footer__nav-title">{{ next.text }}</span>
        </a>
        <span v-else class="nb-footer__nav-spacer" />
      </nav>

      <div class="nb-footer__bar">
        <a href="/" class="nb-footer__brand">
          <img src="/nubisco-logo.svg" alt="Nubisco" class="nb-footer__logo" />
          <span class="nb-footer__brand-name">Nubisco</span>
        </a>

        <div class="nb-footer__meta">
          <a
            v-if="editLink"
            :href="editLink"
            target="_blank"
            rel="noreferrer"
            class="nb-footer__edit-link"
          >
            Edit this page on GitHub
          </a>
          <span class="nb-footer__copyright">
            Copyright &copy; 2026 Nubisco &middot; Released under the MIT
            License
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, provide, watch } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter, page, theme } = useData()

const tabs = computed<string[]>(() => frontmatter.value.tabs ?? [])
const activeTab = ref<string>(tabs.value[0] ?? '')

watch(tabs, (next) => {
  activeTab.value = next[0] ?? ''
})

provide('nb-active-tab', activeTab)

// ── Footer: sidebar navigation ───────────────────────────────────────────
interface SidebarLink {
  text: string
  link: string
}

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
  return Object.values(sidebar).flatMap((group: any) =>
    Array.isArray(group) ? flattenSidebar(group) : [],
  )
})

const currentPath = computed(() => {
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

const editLink = computed(() => {
  const pattern = theme.value.editLink?.pattern
  if (!pattern) return null
  return pattern.replace(':path', page.value.relativePath)
})
</script>

<style lang="scss" scoped>
.nb-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__tabs {
    position: sticky;
    top: var(--vp-nav-height, 0px);
    z-index: var(--nb-zindex-titlebar);
    display: flex;
    background: var(--nb-c-black);
    padding: 0 calc(var(--nb-base-unit) * 4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__tab {
    appearance: none;
    position: relative;
    background: transparent;
    border: none;
    border-top: 3px solid transparent;
    color: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    font-size: 14px;
    letter-spacing: 0.01em;
    padding: calc(var(--nb-base-unit) * 2) calc(var(--nb-base-unit) * 2.5);
    transition:
      color 0.15s ease,
      background 0.15s ease,
      border-color 0.15s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
      background: rgba(255, 255, 255, 0.06);
    }

    &.is-active {
      border-top-color: var(--nb-c-primary, #5856a9);
      background: rgba(255, 255, 255, 0.14);
      color: var(--nb-c-white);
    }
  }

  &__body {
    flex: 1;
    padding: calc(var(--nb-base-unit) * 4);

    /* Content spacing: handle VitePress wrapper divs and markdown paragraphs */
    :deep(p) {
      margin-top: 0.5em;
      margin-bottom: 1.5em;
      line-height: 1.6;
    }

    :deep(h2) {
      margin-top: 1.5em;
      margin-bottom: 0.75em;
    }

    :deep(h3) {
      margin-top: 1.25em;
      margin-bottom: 0.5em;
    }

    :deep(ul),
    :deep(ol) {
      margin-bottom: 1.5em;
    }

    :deep(li) {
      margin-bottom: 0.5em;
    }

    :deep(table) {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5em;
      margin-bottom: 1.5em;

      thead tr {
        background: var(--nb-c-white);
      }

      th {
        font-weight: 600;
        text-align: left;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.07);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }

    /* Inline code — everywhere except inside syntax-highlighted fences */
    :deep(:not(pre) > code) {
      font-family: var(--nb-font-family-mono, 'Courier New', monospace);
      font-size: 0.875em;
      background: rgba(0, 0, 0, 0.06);
      color: var(--nb-c-text);
      padding: 2px 6px;
      border-radius: 4px;
    }

    :deep(blockquote) {
      margin-top: 1.5em;
      margin-bottom: 1.5em;
    }

    :deep(.custom-block) {
      margin-bottom: 1.5em;
    }

    :deep(pre) {
      margin-top: 1.5em;
      margin-bottom: 1.5em;
    }
  }

  &__footer {
    background: var(--nb-c-black);
    color: var(--nb-c-white);
    border-top: none;
    padding: 40px;
    margin-top: auto;
  }
}

/* ── Footer: prev/next navigation ────────────────────────────────────────── */
.nb-footer__nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
}

.nb-footer__nav-item {
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

  &:hover {
    border-color: var(--nb-c-magenta);
    background: rgba(255, 255, 255, 0.08);
  }

  &--next {
    text-align: right;
  }
}

.nb-footer__nav-spacer {
  display: block;
}

.nb-footer__nav-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.nb-footer__nav-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--nb-c-white);
  line-height: 1.4;
}

/* ── Footer: bar ─────────────────────────────────────────────────────────── */
.nb-footer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}

.nb-footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.nb-footer__logo {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nb-footer__brand-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--nb-c-white);
}

.nb-footer__meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nb-footer__edit-link {
  font-size: 12px;
  color: var(--nb-c-magenta);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.nb-footer__copyright {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
