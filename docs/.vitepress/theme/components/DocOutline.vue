<template>
  <nav
    v-if="items.length > 1"
    class="doc-outline"
    aria-labelledby="doc-outline-title"
  >
    <p id="doc-outline-title" class="doc-outline__title">On this page</p>
    <div class="doc-outline__track">
      <span
        class="doc-outline__marker"
        :style="markerStyle"
        aria-hidden="true"
      />
      <ul ref="list" class="doc-outline__list">
        <li v-for="item in items" :key="item.id">
          <a
            :href="`#${item.id}`"
            class="doc-outline__link"
            :class="{ 'is-active': item.id === active }"
            :aria-current="item.id === active ? 'location' : undefined"
            @click="onClick($event, item.id)"
          >
            {{ item.text }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * "On this page": the page's sections, with an accent bar on a grey track
 * that follows the section being read, as Carbon's does.
 *
 * It reads the headings from the rendered page rather than from VitePress's
 * header data, because the layout hides inactive in-page tabs, and a section
 * the reader cannot see should not be offered as a place to go.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'

const props = defineProps<{
  /** The element whose `h2`s are listed. */
  root: HTMLElement | null
  /** Anything that changes which headings are visible (an in-page tab). */
  watchKey?: unknown
}>()

interface IItem {
  id: string
  text: string
  el: HTMLElement
}

const route = useRoute()
const items = ref<IItem[]>([])
const active = ref('')
const list = ref<HTMLElement | null>(null)
const marker = ref({ top: 0, height: 0 })

function collect() {
  const root = props.root
  if (!root) {
    items.value = []
    return
  }
  items.value = Array.from(root.querySelectorAll<HTMLElement>('h2[id]'))
    .filter((el) => el.offsetParent !== null)
    .map((el) => ({
      id: el.id,
      // The heading's own text, without VitePress's "#" anchor.
      text: Array.from(el.childNodes)
        .filter(
          (n) =>
            !(
              n instanceof HTMLElement && n.classList.contains('header-anchor')
            ),
        )
        .map((n) => n.textContent)
        .join('')
        .replace(/​/g, '')
        .trim(),
      el,
    }))
  update()
}

/** The sticky chrome above the content, so "in view" means below it. */
function offset() {
  const bar = document.querySelector<HTMLElement>('.doc-header__bar')
  if (bar) return bar.getBoundingClientRect().bottom + 24
  const nav = document.querySelector<HTMLElement>('.VPNav')
  return (nav?.getBoundingClientRect().bottom ?? 64) + 24
}

let frame = 0
function update() {
  frame = 0
  if (!items.value.length) return
  const line = offset()
  let current = items.value[0].id
  for (const item of items.value) {
    if (item.el.getBoundingClientRect().top <= line) current = item.id
    else break
  }
  // At the very bottom the last sections can never reach the line, so the
  // last one is current once the page cannot scroll any further.
  const atEnd =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2
  if (atEnd) current = items.value[items.value.length - 1].id
  active.value = current
  nextTick(placeMarker)
}

function placeMarker() {
  const link = list.value?.querySelector<HTMLElement>('.is-active')
  if (!link) return
  marker.value = { top: link.offsetTop, height: link.offsetHeight }
}

const markerStyle = computed(() => ({
  transform: `translateY(${marker.value.top}px)`,
  height: `${marker.value.height}px`,
}))

function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

function onClick(event: MouseEvent, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  const y = target.getBoundingClientRect().top + window.scrollY - offset() + 8
  window.scrollTo({ top: y, behavior: 'smooth' })
  history.replaceState(history.state, '', `#${id}`)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  nextTick(collect)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})

watch(
  () => [route.path, props.root, props.watchKey],
  () => {
    // Demos render client-side and move headings as they mount, so look
    // again once they have settled.
    nextTick(collect)
    setTimeout(collect, 300)
  },
)
</script>

<style lang="scss" scoped>
.doc-outline {
  font-size: 0.875rem;

  &__title {
    margin: 0 0 calc(var(--nb-base-unit) * 1.5);
    padding-left: calc(var(--nb-base-unit) * 2);
    font-weight: 600;
    color: var(--nb-c-text);
  }

  &__track {
    position: relative;

    // The grey track the marker runs on.
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--nb-c-layer-2);
    }
  }

  &__marker {
    position: absolute;
    left: 0;
    top: 0;
    width: 3px;
    background: var(--nb-c-primary);
    transition:
      transform 0.25s cubic-bezier(0.2, 0, 0.38, 0.9),
      height 0.25s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__link {
    display: block;
    padding: 6px 0 6px calc(var(--nb-base-unit) * 2);
    line-height: 1.4;
    color: var(--nb-c-text-subtle);
    text-decoration: none;
    transition: color 0.15s ease;

    &:hover {
      color: var(--nb-c-text);
    }

    &.is-active {
      color: var(--nb-c-text);
      font-weight: 600;
    }

    &:focus-visible {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: -2px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .doc-outline__marker {
    transition: none;
  }
}
</style>
