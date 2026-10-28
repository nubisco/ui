<template>
  <nav
    class="nb-breadcrumbs"
    :class="{ 'nb-breadcrumbs--collapsed': collapsed }"
    aria-label="breadcrumb"
  >
    <!-- Brand prefix (title + subtitle) -->
    <span v-if="title || subtitle" class="nb-breadcrumbs__brand">
      <span v-if="title" class="nb-breadcrumbs__title">{{ title }}</span>
      <span v-if="subtitle" class="nb-breadcrumbs__subtitle">{{
        subtitle
      }}</span>
    </span>

    <!-- Separator between brand and crumbs (only when both exist) -->
    <NbIcon
      v-if="(title || subtitle) && hasCrumbs"
      name="caret-right"
      size="sm"
      class="nb-breadcrumbs__sep"
    />

    <!-- Crumbs: from `items`, or whatever the default slot renders -->
    <span v-if="hasCrumbs" class="nb-breadcrumbs__crumbs">
      <template v-if="items?.length">
        <span
          v-for="(item, index) in items"
          :key="index"
          :ref="(el) => (itemEls[index] = el as HTMLElement | null)"
          class="nb-breadcrumbs__item"
        >
          <span
            v-if="isCurrent(index)"
            class="nb-breadcrumbs__current"
            aria-current="page"
            >{{ item.label }}</span
          >
          <NbButton
            v-else-if="isInteractive(item)"
            class="nb-breadcrumbs__link"
            variant="link"
            :to="item.to"
            :href="item.href"
            :target="item.target"
            @click="onActivate(item, index, $event)"
            >{{ item.label }}</NbButton
          >
          <span v-else class="nb-breadcrumbs__parent">{{ item.label }}</span>

          <!-- The switcher is its own control beside the label, so a crumb that
               links still links, and the current crumb can still be switched.
               The list is NbSelect's, searchable, hung under the whole crumb. -->
          <NbSelect
            v-if="item.options?.length"
            class="nb-breadcrumbs__switcher"
            searchable
            selected-mark="check"
            :anchor="() => itemEls[index]"
            :model-value="currentOption(item)"
            :options="selectOptions(item)"
            :search-placeholder="item.searchPlaceholder ?? 'Find'"
            :no-results-label="item.noResultsLabel ?? 'No results'"
            @change="onSwitch(item, index, $event)"
          >
            <template #trigger="{ attrs }">
              <button
                type="button"
                class="nb-breadcrumbs__switch"
                v-bind="attrs"
                :aria-label="item.switchLabel ?? `Switch ${item.label}`"
              >
                <NbIcon :name="iconUpDown" :size="14" aria-hidden="true" />
              </button>
            </template>
          </NbSelect>
        </span>
      </template>
      <slot v-else />
    </span>
  </nav>
</template>

<script setup lang="ts">
import NbIcon from './Icon.vue'
import NbButton from './Button.vue'
import NbSelect from './Select.vue'
import * as iconUpDown from '@nubisco/ui/icons/caret-up-down'
import {
  useSlots,
  computed,
  getCurrentInstance,
  Comment,
  Fragment,
  Text,
  type VNode,
} from 'vue'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import type { IBreadcrumbItem, IBreadcrumbOption } from './Breadcrumbs.d'

const props = withDefaults(
  defineProps<{
    /** Text rendered before the subtitle in regular weight. */
    title?: string
    /** Text rendered after the title in bold weight. */
    subtitle?: string
    /**
     * How the trail fits a phone topbar. `'phone'` shows only the last crumb
     * there, on one line with an ellipsis, and drops the brand: the page you
     * are on is the one piece a 360px bar has room for. `'none'` (the default)
     * renders the full trail at every width.
     */
    collapse?: 'none' | 'phone'
    /**
     * The crumbs as data. Each one renders as a real link or button (see
     * `IBreadcrumbItem`), the current one as text with `aria-current="page"`.
     * When set, it replaces the default slot.
     */
    items?: IBreadcrumbItem[]
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    collapse: 'none',
    items: undefined,
  },
)

const emit = defineEmits<{
  /** A crumb was activated: the item, its index, and the click. */
  select: [item: IBreadcrumbItem, index: number, event: MouseEvent]
  /** An option was picked in a crumb's switcher: the crumb, the option, the crumb's index. */
  switch: [item: IBreadcrumbItem, option: IBreadcrumbOption, index: number]
}>()

// A `select` listener makes every crumb without a link a button, so a view
// can route all of them through one handler instead of a callback per item.
const instance = getCurrentInstance()
const listensForSelect = computed(() => !!instance?.vnode.props?.onSelect)

const currentIndex = computed(() => {
  const list = props.items ?? []
  const marked = list.findIndex((item) => item.current)
  return marked === -1 ? list.length - 1 : marked
})

function isCurrent(index: number): boolean {
  return index === currentIndex.value
}

function isInteractive(item: IBreadcrumbItem): boolean {
  return (
    item.to != null || !!item.href || !!item.onClick || listensForSelect.value
  )
}

function onActivate(item: IBreadcrumbItem, index: number, event: MouseEvent) {
  item.onClick?.(event)
  emit('select', item, index, event)
}

// Each crumb's element, read when its switcher opens, so the list hangs under
// the whole crumb and not under the small chevron. Not reactive: it is only
// read at that moment.
const itemEls: Array<HTMLElement | null> = []

const optionValue = (option: IBreadcrumbOption, position: number) =>
  option.value ?? position

function selectOptions(item: IBreadcrumbItem) {
  return (item.options ?? []).map((option, position) => ({
    label: option.label,
    value: optionValue(option, position),
    icon: option.icon,
  }))
}

/** The current option: the item's `value`, else the one named like the crumb. */
function currentOption(item: IBreadcrumbItem): string | number | null {
  if (item.value != null) return item.value
  const options = item.options ?? []
  const position = options.findIndex((option) => option.label === item.label)
  return position === -1 ? null : optionValue(options[position], position)
}

function onSwitch(
  item: IBreadcrumbItem,
  index: number,
  value: string | number | Array<string | number> | null,
) {
  const options = item.options ?? []
  const position = options.findIndex((o, i) => optionValue(o, i) === value)
  if (position === -1 || value === currentOption(item)) return
  const option = options[position]
  emit('switch', item, option, index)
  go(option)
}

/**
 * Goes where the option points: the router when there is one, else the page.
 * An option with neither only emits `switch`, for a trail that handles it.
 */
function go(option: IBreadcrumbOption) {
  const router = instance?.appContext.config.globalProperties.$router
  if (option.to != null) {
    if (router) router.push(option.to)
    else if (typeof option.to === 'string') window.location.assign(option.to)
  } else if (option.href) {
    window.location.assign(option.href)
  }
}

const slots = useSlots()

/**
 * Whether the slot renders ANYTHING, not merely whether it was passed.
 *
 * `!!slots.default?.()` is true for a slot that produces nothing: a `v-for`
 * over an empty list still returns a Fragment, and a `v-if` that fails still
 * returns a Comment placeholder. The separator between the brand and the crumbs
 * was drawn on that, so a view with no crumbs rendered "Nubisco CMS ›" with
 * nothing after the chevron.
 */
function rendersContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) return String(node.children ?? '').trim() !== ''
    if (node.type === Fragment)
      return rendersContent((node.children ?? []) as VNode[])
    return true
  })
}

const hasDefaultSlot = computed(() => rendersContent(slots.default?.() ?? []))
const hasCrumbs = computed(() => !!props.items?.length || hasDefaultSlot.value)

const { phone } = usePhoneLayout()

// Only with a crumb to show: a trail that is all brand keeps its brand.
const collapsed = computed(
  () => props.collapse === 'phone' && phone.value && hasCrumbs.value,
)
</script>

<style lang="scss" scoped>
@use '../styles/variables/breakpoints' as bp;

.nb-breadcrumbs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  line-height: 1;
}

.nb-breadcrumbs__brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3em;
}

.nb-breadcrumbs__title {
  font-weight: 400;
  color: var(--nb-c-text);
}

.nb-breadcrumbs__subtitle {
  font-weight: 700;
  color: var(--nb-c-text);
}

.nb-breadcrumbs__sep {
  color: var(--nb-c-text-subtle);
  flex-shrink: 0;
}

.nb-breadcrumbs__crumbs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  color: var(--nb-c-text);
}

/* A trail of more than one crumb needs separators between them, not only
 * between the brand and the first. Without this "Home" and "Doodloop" render
 * as "Home Doodloop", which reads as one name rather than two levels.
 *
 * Drawn in CSS rather than as icon nodes because the crumbs arrive through a
 * slot: the component cannot interleave markup between children it does not
 * own without re-rendering them. Content, not a border, so it inherits the
 * text colour and scales with the font. */
.nb-breadcrumbs__crumbs > :not(:first-child)::before {
  content: '/';
  margin-inline-end: 0.35rem;
  color: var(--nb-c-text-subtle);
  font-weight: 400;
}

/* The page you are on is the one crumb at full strength. The levels above it
 * step back to the subtle text tier, so the eye lands on the current page and
 * the trail reads as the way there. Subtle rather than muted because muted sits
 * so close to the body text that a parent and the current crumb would look the
 * same. Subtle is held at WCAG AA on every layer and its hover, in both themes,
 * by `tests/layerContrast.test.ts`, so a muted crumb is still readable on any
 * surface the trail lands on.
 *
 * A linked crumb is not a coloured link: same weight as the trail, and the link
 * variant's underline on hover and keyboard focus is what says it can be
 * followed. Hover and focus also lift it to full strength, so the crumb you are
 * about to follow reads like the page it leads to. The current crumb stays
 * plain text. */
.nb-breadcrumbs__current {
  color: var(--nb-c-text);
}

.nb-breadcrumbs__parent {
  color: var(--nb-c-text-subtle);
}

.nb-breadcrumbs__link {
  --nb-button-link-color: var(--nb-c-text-subtle);

  &:hover:not(:disabled),
  &:focus-visible {
    --nb-button-link-color: var(--nb-c-text);
  }
}

/* A crumb is a name, and a name does not wrap. The link variant lets text wrap,
 * which is right in a paragraph, but in a tight topbar it broke a crumb over
 * two lines. Written with the item in the selector so it outranks the
 * button's own rule whatever order the two stylesheets load in. */
.nb-breadcrumbs__item {
  white-space: nowrap;
}

.nb-breadcrumbs__item > .nb-breadcrumbs__link {
  white-space: nowrap;
}

// The crumb and its switcher sit on one line.
.nb-breadcrumbs__item {
  display: inline-flex;
  align-items: center;
}

// The chevron: quiet until the crumb is pointed at, then at full strength like
// a linked crumb. A real button, with its own focus ring.
.nb-breadcrumbs__switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-inline-start: 0.15rem;
  padding: 2px;
  background: transparent;
  border: 0;
  border-radius: 4px;
  color: var(--nb-c-text-subtle);
  cursor: pointer;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--nb-c-text);
    background: color-mix(in srgb, var(--nb-c-text) 8%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: 1px;
  }

  // A fingertip, on a phone.
  @include bp.phone-touch {
    min-inline-size: 32px;
    min-block-size: 32px;
  }
}

// Phone, opted in: the last crumb alone, shrinking into an ellipsis rather
// than pushing the topbar's actions off screen. The class is only ever set by
// the component on a phone, so nothing here reaches a desktop.
.nb-breadcrumbs--collapsed {
  display: flex;
  min-width: 0;
  max-width: 100%;

  .nb-breadcrumbs__brand,
  .nb-breadcrumbs__sep {
    display: none;
  }

  .nb-breadcrumbs__crumbs {
    display: flex;
    min-width: 0;
  }

  .nb-breadcrumbs__crumbs > :not(:last-child) {
    display: none;
  }

  .nb-breadcrumbs__crumbs > :last-child {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &::before {
      content: none;
    }
  }

  // With a switcher the last crumb is the label and a chevron: the label gives
  // way to the ellipsis, the chevron keeps its place.
  .nb-breadcrumbs__crumbs > .nb-breadcrumbs__item:last-child {
    display: flex;
    align-items: center;
    overflow: visible;

    > :first-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nb-breadcrumbs__switcher {
      flex: none;
    }
  }
}
</style>
