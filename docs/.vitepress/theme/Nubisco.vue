<template>
  <div class="nb-layout">
    <DocHeader
      :title="frontmatter.title"
      :intro="frontmatter.intro"
      :status="frontmatter.status"
      :source="frontmatter.source"
      :edit-link="editLink"
      :tabs="headerTabs"
      @select="activeTab = $event"
    />

    <div class="nb-layout__main">
      <main ref="body" class="nb-layout__body">
        <Content />
      </main>
      <aside class="nb-layout__aside">
        <div class="nb-layout__aside-inner">
          <DocOutline :root="body" :watch-key="activeTab" />
        </div>
      </aside>
    </div>

    <!-- Footer: prev/next navigation + meta -->
    <footer class="nb-layout__footer">
      <nav v-if="prev || next" class="nb-footer__nav">
        <a
          v-if="prev"
          :href="withBase(prev.link)"
          class="nb-footer__nav-item nb-footer__nav-item--prev"
        >
          <span class="nb-footer__nav-label">Previous</span>
          <span class="nb-footer__nav-title">{{ prev.text }}</span>
        </a>
        <span v-else class="nb-footer__nav-spacer" />

        <a
          v-if="next"
          :href="withBase(next.link)"
          class="nb-footer__nav-item nb-footer__nav-item--next"
        >
          <span class="nb-footer__nav-label">Next</span>
          <span class="nb-footer__nav-title">{{ next.text }}</span>
        </a>
        <span v-else class="nb-footer__nav-spacer" />
      </nav>

      <div class="nb-footer__bar">
        <a :href="withBase('/')" class="nb-footer__brand">
          <NbNubiscoMark :size="24" class="nb-footer__logo" />
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
import DocHeader from './components/DocHeader.vue'
import type { IDocHeaderTab } from './components/DocHeader.vue'
import DocOutline from './components/DocOutline.vue'

const { frontmatter, page, theme, site } = useData()
const body = ref<HTMLElement | null>(null)

/*
 * Two kinds of tab.
 *
 * A component page is split into one route per tab (`/components/x/usage`,
 * `/code`, ...), and lists its siblings in `pageTabs`. Those tabs are links.
 *
 * A few other pages still switch sections in place, with `<doc-tab>` blocks
 * named in `tabs`. Those tabs are buttons, and the active one is provided to
 * the blocks below.
 */
const TAB_LABEL: Record<string, string> = {
  usage: 'Usage',
  style: 'Style',
  code: 'Code',
  accessibility: 'Accessibility',
}

const inPageTabs = computed<string[]>(() =>
  frontmatter.value.pageTabs ? [] : (frontmatter.value.tabs ?? []),
)
const activeTab = ref<string>(inPageTabs.value[0] ?? '')

watch(inPageTabs, (next) => {
  activeTab.value = next[0] ?? ''
})

provide('nb-active-tab', activeTab)

/** The page's folder, for a page split into tab routes. */
const tabDir = computed(() =>
  frontmatter.value.pageTabs
    ? '/' + page.value.relativePath.replace(/\/[^/]+\.md$/, '')
    : null,
)

const headerTabs = computed<IDocHeaderTab[]>(() => {
  const routeTabs: string[] = frontmatter.value.pageTabs ?? []
  if (routeTabs.length) {
    const ext = site.value.cleanUrls ? '' : '.html'
    return routeTabs.map((key) => ({
      key,
      label: TAB_LABEL[key] ?? key,
      href: withBase(`${tabDir.value}/${key}${ext}`),
      active: key === frontmatter.value.tab,
    }))
  }
  return inPageTabs.value.map((key) => ({
    key,
    label: key === 'Api' ? 'API' : key,
    active: key === activeTab.value,
  }))
})

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

// Every tab of a split page is the same entry in the sidebar, the one that
// links its first tab, so the footer offers the same neighbours on each.
const currentIndex = computed(() =>
  allLinks.value.findIndex((l) =>
    tabDir.value
      ? l.link.replace(/\/[^/]+$/, '') === tabDir.value
      : l.link === currentPath.value,
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
@use '../../../src/styles/variables' as v;

.nb-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  &__aside {
    display: none;
  }

  @media (min-width: 1280px) {
    &__main {
      grid-template-columns: minmax(0, 1fr) 15rem;
      column-gap: calc(var(--nb-base-unit) * 4);
    }

    &__aside {
      display: block;
      padding: calc(var(--nb-base-unit) * 6) calc(var(--nb-base-unit) * 3) 0 0;
    }

    &__aside-inner {
      position: sticky;
      // Under the site header and the page's own sticky bar.
      top: calc(var(--vp-nav-height, 64px) + 96px + 24px);
      max-height: calc(100vh - var(--vp-nav-height, 64px) - 140px);
      overflow-y: auto;
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

    /*
     * Section headings at Carbon's weight: large and regular rather than
     * large and bold, so a long page of them reads as a sequence of sections
     * and not as a sequence of shouts. The page title above is the one heavy
     * thing.
     */
    :deep(h2) {
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      font-size: 2rem;
      font-weight: 400;
      line-height: 1.25;
      letter-spacing: 0;
    }

    :deep(h3) {
      margin-top: 1.25em;
      margin-bottom: 0.5em;
      font-size: 1.375rem;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: 0;
    }

    :deep(ul),
    :deep(ol) {
      margin-bottom: 1.5em;
    }

    :deep(li) {
      margin-bottom: 0.5em;
    }

    /* Prose tables only. Component demos render their own tables (NbDataTable,
       NbSpreadsheet) whose scoped rules lose to this one on specificity
       (0,2,2 vs 0,2,0), which silently overrode their cell padding and made
       every density look identical. Anything carrying an `nb-` class styles
       itself. */
    :deep(table:not([class*='nb-'])) {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5em;
      margin-bottom: 1.5em;

      /*
       * Prose tables follow the theme.
       *
       * These were a literal `--nb-c-white` header row and two black-alpha
       * rules, all of which assume a light page: in dark mode the header row
       * stayed white under light text, and the row rules disappeared into the
       * background entirely.
       */
      thead tr {
        background: var(--nb-c-layer-1);
      }

      th {
        font-weight: 600;
        text-align: left;
        padding: 12px 16px;
        border-bottom: 1px solid var(--nb-c-border);
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--nb-c-layer-border-1);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }

    /* Inline code — everywhere except inside syntax-highlighted fences */
    :deep(:not(pre) > code) {
      font-family: var(--nb-font-family-mono, 'Courier New', monospace);
      font-size: 0.875em;
      // A tint of the surface, not of black: a black wash is invisible on a
      // dark page.
      background: var(--nb-c-layer-2);
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

/* On a phone the body takes the same 16px gutter as the page header above it,
   so the text lines up with the title instead of stepping in under it. */
@include v.phone {
  .nb-layout__body {
    padding: calc(var(--nb-base-unit) * 3) calc(var(--nb-base-unit) * 2);

    /* A prose table wider than the screen scrolls inside itself rather than
       widening the whole page sideways. */
    :deep(table:not([class*='nb-'])) {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }
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
