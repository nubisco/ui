<template>
  <div class="docs-sidenav">
    <div class="docs-sidenav__find">
      <NbTextInput
        v-model="query"
        size="sm"
        type="search"
        placeholder="Find"
        aria-label="Find in navigation"
        autocomplete="off"
      >
        <template #leading>
          <NbIcon
            name="magnifying-glass"
            :size="16"
            class="docs-sidenav__find-icon"
            aria-hidden="true"
          />
        </template>
      </NbTextInput>
    </div>

    <p v-if="query && !groups.length" class="docs-sidenav__empty">
      Nothing matches "{{ query }}".
    </p>

    <section
      v-for="group in groups"
      :key="group.text"
      class="docs-sidenav__group"
    >
      <button
        type="button"
        class="docs-sidenav__heading"
        :aria-expanded="isOpen(group)"
        @click="toggle(group)"
      >
        <span>{{ group.text }}</span>
        <NbIcon
          name="caret-down"
          :size="14"
          class="docs-sidenav__caret"
          :class="{ 'is-open': isOpen(group) }"
          aria-hidden="true"
        />
      </button>
      <ul v-show="isOpen(group)" class="docs-sidenav__list">
        <template v-for="item in group.items" :key="item.text">
          <li v-if="item.link">
            <a
              :href="href(item.link)"
              class="docs-sidenav__link"
              :class="{ 'is-active': isActive(item.link) }"
              :aria-current="isActive(item.link) ? 'page' : undefined"
            >
              {{ item.text }}
            </a>
          </li>
          <li v-else class="docs-sidenav__sub">
            <span class="docs-sidenav__sub-title">{{ item.text }}</span>
            <ul class="docs-sidenav__list">
              <li v-for="child in item.items" :key="child.text">
                <a
                  :href="href(child.link)"
                  class="docs-sidenav__link docs-sidenav__link--nested"
                  :class="{ 'is-active': isActive(child.link) }"
                  :aria-current="isActive(child.link) ? 'page' : undefined"
                >
                  {{ child.text }}
                </a>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * The left navigation, in place of VitePress's own sidebar list.
 *
 * It reads the same `themeConfig.sidebar`, so the footer's previous and next
 * links and the mobile drawer keep working from one source. What it adds is
 * Carbon's shape: collapsible top-level groups that open on the section you
 * are in, a "Find" box that filters every group at once, and one active entry
 * for every tab of a split component page, which VitePress's exact-path match
 * cannot give.
 */
import { computed, ref, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

interface IItem {
  text: string
  link?: string
  items?: IItem[]
}

const { theme, site } = useData()
const route = useRoute()
const query = ref('')

const all = computed<IItem[]>(() => {
  const sidebar = theme.value.sidebar
  if (Array.isArray(sidebar)) return sidebar
  return sidebar?.['/'] ?? []
})

/** The path without base, extension or trailing index. */
function normal(path: string) {
  return path
    .replace(new RegExp(`^${site.value.base}`), '/')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
}

/**
 * A link to a tab route stands for the whole page: `/components/x/usage` is
 * active on `/components/x/code` too.
 */
function owner(link: string) {
  return /\/(usage|style|code|accessibility)$/.test(link)
    ? link.replace(/\/[^/]+$/, '')
    : link
}

const current = computed(() => normal(route.path))

function isActive(link?: string) {
  if (!link) return false
  const own = owner(link)
  return own === link
    ? current.value === link
    : current.value === own || current.value.startsWith(own + '/')
}

function contains(item: IItem): boolean {
  return isActive(item.link) || (item.items ?? []).some(contains)
}

function href(link?: string) {
  if (!link) return undefined
  return withBase(link + (site.value.cleanUrls ? '' : '.html'))
}

const groups = computed<IItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return all.value
  const match = (i: IItem) => i.text.toLowerCase().includes(q)
  return all.value
    .map((group) => {
      if (match(group)) return group
      const items = (group.items ?? [])
        .map((item) => {
          if (match(item)) return item
          const kids = (item.items ?? []).filter(match)
          return kids.length ? { ...item, items: kids } : null
        })
        .filter(Boolean) as IItem[]
      return items.length ? { ...group, items } : null
    })
    .filter(Boolean) as IItem[]
})

// Open state: the group holding the current page opens by itself; the rest
// remember what the reader did with them.
const toggled = ref<Record<string, boolean>>({})

watch(
  () => route.path,
  () => {
    for (const group of all.value)
      if (contains(group)) toggled.value[group.text] = true
  },
  { immediate: true },
)

function isOpen(group: IItem) {
  if (query.value.trim()) return true
  return toggled.value[group.text] ?? false
}

function toggle(group: IItem) {
  toggled.value[group.text] = !isOpen(group)
}
</script>

<style lang="scss" scoped>
.docs-sidenav {
  padding-bottom: calc(var(--nb-base-unit) * 4);

  &__find {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0 calc(var(--nb-base-unit) * -1) calc(var(--nb-base-unit) * 1.5);
    padding: calc(var(--nb-base-unit) * 2) var(--nb-base-unit)
      var(--nb-base-unit);
    background: var(--vp-sidebar-bg-color);
  }

  &__find-icon {
    margin-left: var(--nb-base-unit);
    color: var(--nb-c-text-subtle);
  }

  &__empty {
    margin: var(--nb-base-unit) 0;
    font-size: 0.875rem;
    color: var(--nb-c-text-subtle);
  }

  &__group + &__group {
    border-top: 1px solid var(--nb-c-layer-2);
  }

  &__heading {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: calc(var(--nb-base-unit) * 1.5) 0;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--nb-c-text);
    text-align: left;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: 2px;
    }
  }

  &__caret {
    color: var(--nb-c-text-subtle);
    transform: rotate(-90deg);
    transition: transform 0.15s ease;

    &.is-open {
      transform: none;
    }
  }

  &__list {
    list-style: none;
    margin: 0 0 var(--nb-base-unit);
    padding: 0;
  }

  &__sub-title {
    display: block;
    padding: var(--nb-base-unit) 0 calc(var(--nb-base-unit) * 0.5)
      calc(var(--nb-base-unit) * 1.5);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--nb-c-text-subtle);
  }

  &__link {
    position: relative;
    display: block;
    padding: 6px var(--nb-base-unit) 6px calc(var(--nb-base-unit) * 1.5);
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--nb-c-text-subtle);
    text-decoration: none;
    transition:
      color 0.15s ease,
      background 0.15s ease;

    &--nested {
      padding-left: calc(var(--nb-base-unit) * 3);
    }

    &:hover {
      color: var(--nb-c-text);
      background: var(--nb-c-layer-hover-1);
    }

    // Carbon marks the current page with a selected row and an edge; the edge
    // is the accent here.
    &.is-active {
      color: var(--nb-c-text);
      font-weight: 600;
      background: var(--nb-c-layer-2);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--nb-c-primary);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: -2px;
    }
  }
}
</style>
