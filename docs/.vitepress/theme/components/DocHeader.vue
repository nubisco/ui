<template>
  <header
    ref="hero"
    class="doc-header"
    :class="{ 'doc-header--plain': !tabs.length }"
  >
    <div class="doc-header__hero">
      <div class="doc-header__lead">
        <h1 class="doc-header__title">{{ title }}</h1>
        <div v-if="status || updatedLabel" class="doc-header__meta">
          <NbBadge v-if="status" :variant="statusVariant" size="sm">{{
            statusLabel
          }}</NbBadge>
          <span v-if="updatedLabel">Last updated {{ updatedLabel }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-if="intro" class="doc-header__intro" v-html="introHtml" />
      </div>

      <aside v-if="links.length" class="doc-header__side" aria-label="Links">
        <div class="doc-header__side-title">
          <img :src="withBase('/logo.svg')" alt="" width="20" height="20" />
          <span>Nubisco UI</span>
        </div>
        <ul class="doc-header__links">
          <li v-for="link in links" :key="link.href">
            <a
              :href="link.href"
              target="_blank"
              rel="noreferrer"
              class="doc-header__link"
            >
              <NbIcon :name="link.icon" :size="16" aria-hidden="true" />
              <span>{{ link.text }}</span>
            </a>
          </li>
        </ul>
      </aside>
    </div>
  </header>

  <!--
      The tab bar, and the compact title that joins it once the hero has
      scrolled away. The title is in the same row as the tabs and only grows
      in, so the bar keeps one height and nothing under it moves when it
      sticks.

      It is a sibling of the hero, not a child: a sticky element only sticks
      inside its parent, and the hero scrolls away.
    -->
  <div
    v-if="tabs.length"
    ref="bar"
    class="doc-header doc-header__bar"
    :class="{ 'is-stuck': stuck }"
  >
    <nav class="doc-header__tabs" aria-label="Page sections">
      <span class="doc-header__compact-title" :aria-hidden="!stuck">{{
        title
      }}</span>
      <component
        :is="tab.href ? 'a' : 'button'"
        v-for="tab in tabs"
        :key="tab.key"
        :href="tab.href"
        :type="tab.href ? undefined : 'button'"
        class="doc-header__tab"
        :class="{ 'is-active': tab.active }"
        :aria-current="tab.active && tab.href ? 'page' : undefined"
        :aria-pressed="tab.href ? undefined : tab.active"
        @click="onTab($event, tab)"
      >
        {{ tab.label }}
      </component>
      <span class="doc-header__tabs-end">
        <a
          v-for="link in links.slice(0, 1)"
          :key="link.href"
          :href="link.href"
          target="_blank"
          rel="noreferrer"
          class="doc-header__compact-link"
          :aria-label="link.text"
          :tabindex="stuck ? 0 : -1"
        >
          <NbIcon :name="link.icon" :size="18" aria-hidden="true" />
        </a>
      </span>
    </nav>
  </div>
</template>

<script setup lang="ts">
/**
 * The page header every documentation page wears, modelled on Carbon's.
 *
 * A large title, a status tag when the page declares one, the intro paragraph
 * and a block of links, then the tab bar. Once the hero scrolls under the
 * site header, the bar sticks with the title in a compact row above the tabs,
 * so a reader deep in a long page still knows which component and which tab
 * they are on.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData, useRouter, withBase } from 'vitepress'

export interface IDocHeaderTab {
  key: string
  label: string
  href?: string
  active: boolean
}

const props = defineProps<{
  title?: string
  intro?: string
  status?: string
  source?: string
  editLink?: string | null
  tabs: IDocHeaderTab[]
}>()

const emit = defineEmits<{ select: [key: string] }>()

const { site, page } = useData()
const router = useRouter()

const STATUS: Record<string, string> = {
  stable: 'green',
  beta: 'blue',
  experimental: 'purple',
  deprecated: 'red',
  draft: 'grey',
  labs: 'purple',
}
const statusLabel = computed(() => {
  const s = props.status ?? ''
  return s.charAt(0).toUpperCase() + s.slice(1)
})
const statusVariant = computed(
  () => (STATUS[(props.status ?? '').toLowerCase()] ?? 'grey') as 'grey',
)

const updatedLabel = computed(() =>
  page.value.lastUpdated
    ? new Date(page.value.lastUpdated).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '',
)

const links = computed(() => {
  const out: { href: string; text: string; icon: string }[] = []
  if (props.source)
    out.push({
      href: `https://github.com/nubisco/ui/blob/master/${props.source}`,
      text: 'Source on GitHub',
      icon: 'github-logo',
    })
  if (props.editLink)
    out.push({
      href: props.editLink,
      text: 'Edit this page',
      icon: 'pencil-simple',
    })
  if (props.source)
    out.push({
      href: 'https://github.com/nubisco/ui/issues/new',
      text: 'Report an issue',
      icon: 'bug',
    })
  return out
})

/*
 * The intro is one paragraph of inline Markdown carried in frontmatter, so it
 * can be shown on every tab of a page without repeating it in each file. Only
 * the inline forms an intro uses are handled: code, bold, emphasis and links.
 */
function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function href(url: string) {
  if (!url.startsWith('/')) return url
  const [path, hash] = url.split('#')
  const ext = site.value.cleanUrls || /\.\w+$/.test(path) ? '' : '.html'
  return withBase(path + ext) + (hash ? `#${hash}` : '')
}
const introHtml = computed(() => {
  const codes: string[] = []
  let s = escape(props.intro ?? '').replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${c}</code>`)
    return `\u0000${codes.length - 1}\u0000`
  })
  s = s
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, t, u) => `<a href="${href(u)}">${t}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])_([^_]+)_(?=[^\w]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)])
})

// ── Sticky state ──────────────────────────────────────────────────────────
const hero = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const stuck = ref(false)

/** Where the bar sticks: under the site header, or the local nav on narrow screens. */
function stickTop() {
  return bar.value ? parseFloat(getComputedStyle(bar.value).top) || 0 : 0
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * `--dock` runs from 0 (top of the page) to 1 (the bar is pinned under the
 * site header). It closes the inset around the hero and the bar together, so
 * the card turns into a band edge to edge and the two edges stay flush the
 * whole way. `--dock-late` brings the compact title in only near the end,
 * once the big title has left. Both are written straight to the element as
 * custom properties: going through reactive state would re-render the header
 * on every scroll frame.
 */
let frame = 0
function measure() {
  frame = 0
  if (!bar.value || !hero.value) return
  // The distance the bar has to travel to reach the site header, measured
  // from the hero's own bottom edge so it holds at any height.
  const travel = Math.max(
    1,
    hero.value.getBoundingClientRect().bottom + window.scrollY - stickTop(),
  )
  const dock = clamp(window.scrollY / travel)
  const late = clamp((dock - 0.6) / 0.4)

  const host = hero.value.parentElement
  host?.style.setProperty('--dock', dock.toFixed(3))
  host?.style.setProperty('--dock-late', late.toFixed(3))
  stuck.value = late > 0.5
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(measure)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  measure()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})

/**
 * Switching tab while the bar is stuck keeps it stuck: the new tab opens at
 * its own first line, under the bar, instead of jumping back to the top of
 * the hero.
 */
async function onTab(event: MouseEvent, tab: IDocHeaderTab) {
  if (!tab.href) {
    emit('select', tab.key)
    keepPlace()
    return
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
    return
  event.preventDefault()
  const wasStuck = stuck.value
  await router.go(tab.href)
  if (wasStuck) keepPlace()
}

function keepPlace() {
  requestAnimationFrame(() => {
    if (!bar.value || !hero.value) return
    // The scroll position at which the bar has just reached its sticky top.
    const heroBottom =
      hero.value.getBoundingClientRect().bottom + window.scrollY
    const y = heroBottom - stickTop()
    if (window.scrollY > y) window.scrollTo({ top: y })
  })
}
</script>

<style lang="scss" scoped>
@use '../../../../src/styles/variables' as v;

/*
 * Carbon's structure, in Nubisco's tokens: the header is a layer-1 card on
 * the layer-0 page, divided from it by a hairline, and the only colour in it
 * is the accent on the active tab.
 *
 * At the top of the page the card is inset by `--doc-inset`, so the ground
 * shows around it. The hero and the bar close that inset together, on the one
 * `--dock` curve the script writes, and end as a band edge to edge. The text
 * does not move while they do: each side's padding takes up what its margin
 * gives.
 */
.doc-header {
  --doc-inset: calc(var(--nb-base-unit) * 2);

  color: var(--nb-c-text);

  // The hairline closes whichever comes last: the tab bar, or the hero on a
  // page without tabs.
  &--plain &__hero,
  &__bar {
    border-bottom: 1px solid var(--nb-c-layer-2);
  }

  &__hero {
    // The card is the hero and the bar, not the whole header: the root stays
    // clear so the ground shows in the inset.
    background: var(--nb-c-layer-1);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: calc(var(--nb-base-unit) * 4);
    align-items: end;
    // The top inset stays fixed: it changes the card's height, and that
    // height is what `--dock` is measured against.
    margin: var(--doc-inset) calc((1 - var(--dock, 0)) * var(--doc-inset)) 0;
    // The left edge lines up with the tab labels below, which sit one tab
    // padding in from the bar.
    padding: calc(var(--nb-base-unit) * 6)
      calc(var(--nb-base-unit) * 3 + var(--dock, 0) * var(--doc-inset))
      calc(var(--nb-base-unit) * 3)
      calc(var(--nb-base-unit) * 5 + var(--dock, 0) * var(--doc-inset));
  }

  &__title {
    margin: 0;
    font-size: clamp(2.25rem, 4.2vw, 3.5rem);
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.015em;
    color: var(--nb-c-text);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: calc(var(--nb-base-unit) * 1.5);
    margin-top: calc(var(--nb-base-unit) * 2);
    font-size: 0.875rem;
    color: var(--nb-c-text-muted);
  }

  &__intro {
    max-width: 44rem;
    margin: calc(var(--nb-base-unit) * 5) 0 0;
    font-size: 1.25rem;
    line-height: 1.5;
    color: var(--nb-c-text);

    :deep(code) {
      font-family: var(--nb-font-family-mono, monospace);
      font-size: 0.85em;
      background: var(--nb-c-layer-2);
      padding: 1px 6px;
      border-radius: 4px;
    }

    :deep(a) {
      color: var(--vp-c-brand-1);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  &__side {
    min-width: 13rem;
    padding-bottom: calc(var(--nb-base-unit) * 0.5);
  }

  &__side-title {
    display: flex;
    align-items: center;
    gap: var(--nb-base-unit);
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: calc(var(--nb-base-unit) * 1.5);
  }

  &__links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--nb-base-unit);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: var(--nb-base-unit);
    font-size: 0.9rem;
    color: var(--vp-c-brand-1);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  /* ── The bar ─────────────────────────────────────────────────────────── */
  &__bar {
    position: sticky;
    top: var(--vp-nav-height, 64px);
    z-index: 20;
    background: var(--nb-c-layer-1);
    margin: 0 calc((1 - var(--dock, 0)) * var(--doc-inset));
    padding: 0 calc(var(--dock, 0) * var(--doc-inset));
  }

  // The compact title sits in the tab row and grows in near the end of the
  // dock, so the bar is one row at every point and nothing under it moves.
  &__compact-title {
    flex: none;
    align-self: center;
    overflow: hidden;
    max-width: calc(var(--dock-late, 0) * 16rem);
    margin-right: calc(var(--dock-late, 0) * var(--nb-base-unit) * 3);
    opacity: var(--dock-late, 0);
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__tabs {
    display: flex;
    align-items: stretch;
    padding: 0 calc(var(--nb-base-unit) * 3);
    overflow-x: auto;
    scrollbar-width: none;
  }

  &__tab {
    appearance: none;
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: none;
    min-height: calc(var(--nb-base-unit) * 6);
    padding: 0 calc(var(--nb-base-unit) * 2);
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 0.95rem;
    color: var(--nb-c-text-subtle);
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s ease;

    // Carbon draws a hairline under every tab and the accent under the
    // current one. Both sit on the bar's bottom edge.
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: var(--nb-c-layer-2);
      transition:
        background 0.15s ease,
        height 0.15s ease;
    }

    &:hover {
      color: var(--nb-c-text);

      &::after {
        background: var(--nb-c-layer-border-1);
      }
    }

    &.is-active {
      color: var(--nb-c-text);
      font-weight: 600;

      &::after {
        height: 3px;
        background: var(--nb-c-primary);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: -2px;
    }
  }

  &__tabs-end {
    margin-left: auto;
    display: flex;
    align-items: center;
    padding-left: calc(var(--nb-base-unit) * 2);
  }

  &__compact-link {
    display: inline-flex;
    padding: calc(var(--nb-base-unit) * 0.75);
    color: var(--nb-c-text);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease;

    .is-stuck & {
      opacity: 1;
      pointer-events: auto;
    }
  }
}

/* Below VitePress's own breakpoint the site header scrolls away and the local
   nav (the "Menu" row) is what stays at the top, so the bar sticks under it. */
@media (max-width: 959px) {
  .doc-header__bar {
    top: 48px;
  }
}

@include v.phone {
  .doc-header {
    // No ground to show around the card on a phone.
    --doc-inset: 0px;

    &__hero {
      grid-template-columns: minmax(0, 1fr);
      gap: calc(var(--nb-base-unit) * 3);
      padding: calc(var(--nb-base-unit) * 4) calc(var(--nb-base-unit) * 2)
        calc(var(--nb-base-unit) * 2);
    }

    &__intro {
      margin-top: calc(var(--nb-base-unit) * 3);
      font-size: 1.075rem;
    }

    &__side-title {
      display: none;
    }

    &__links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--nb-base-unit) calc(var(--nb-base-unit) * 2.5);
    }

    &__link {
      white-space: nowrap;
    }

    // On a phone the tab row is the whole bar, with no compact title: the
    // name is already in the local nav's breadcrumb.
    &__compact-title {
      display: none;
    }

    &__tabs {
      padding: 0 var(--nb-base-unit);
    }

    &__tabs-end {
      display: none;
    }
  }
}
</style>
