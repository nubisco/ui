<template>
  <li
    class="nb-notification-item"
    role="listitem"
    :class="[
      `nb-notification-item--${status}`,
      { 'nb-notification-item--unread': !read },
    ]"
  >
    <!-- role="listitem" above pairs with the explicit role="list" on the
         panel's <ul>: WebKit strips both when the list is styled with
         list-style: none, and a row that is not a list item is not counted in
         "list, 12 items". -->
    <!-- Everything that makes this row a control is in one binding object,
         and an inert row gets none of it: no `data-nb-notification-item` (so
         the panel's roving index never reaches it), no tabindex, no click
         handler, no `select`. An inert row is a paragraph, not a button with
         the label filed off. -->
    <component
      :is="tag"
      class="nb-notification-item__row"
      :class="{ 'nb-notification-item__row--static': !isControl }"
      v-bind="rowBindings"
    >
      <!-- The dot is decoration. The state itself is a word, because a colour
           and a 6px circle are not readable by a screen reader and not
           distinguishable by every sighted user either. -->
      <span class="nb-notification-item__marker" aria-hidden="true" />
      <span class="nb-notification-item__sr">{{
        read ? readLabel : unreadLabel
      }}</span>

      <span v-if="showMedia" class="nb-notification-item__media">
        <slot name="media">
          <NbIcon v-if="resolvedIcon" :name="resolvedIcon" :size="16" />
        </slot>
      </span>

      <span class="nb-notification-item__main">
        <span class="nb-notification-item__head">
          <span class="nb-notification-item__title">
            <slot name="title">{{ title }}</slot>
          </span>
          <time
            v-if="timeText"
            class="nb-notification-item__time"
            :datetime="dateTimeAttr"
            >{{ timeText }}</time
          >
        </span>
        <span
          v-if="body || $slots.default"
          class="nb-notification-item__body"
          data-nb-notification-body
        >
          <slot>{{ body }}</slot>
        </span>
      </span>
    </component>

    <!-- Outside the row, never inside it: a per-item control nested in a
         button or a link is invalid markup and unreachable by keyboard in
         some browsers. -->
    <span v-if="$slots.actions" class="nb-notification-item__actions">
      <slot name="actions" />
    </span>
  </li>
</template>

<script lang="ts">
// Types live in the sibling NotificationCenterItem.d.ts, the way the rest of
// the library declares them. They are re-exported here so `import type ...
// from '.../NotificationCenterItem.vue'` keeps resolving for anyone who
// already wrote that import.
export type {
  TNotificationStatus,
  TNotificationVariant,
  INotificationCenterItemProps,
} from './NotificationCenterItem.d'
</script>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue'
import NbIcon from './Icon.vue'
import type {
  INotificationCenterItemProps,
  TNotificationStatus,
} from './NotificationCenterItem.d'

const props = withDefaults(defineProps<INotificationCenterItemProps>(), {
  title: '',
  body: '',
  time: undefined,
  timeLabel: undefined,
  read: false,
  variant: 'neutral',
  icon: undefined,
  href: undefined,
  interactive: true,
  locale: undefined,
  unreadLabel: 'Unread',
  readLabel: 'Read',
})

const emit = defineEmits<{
  /**
   * The row was activated. Only a control row emits this: with
   * `interactive: false` and no `href` the row is not a control, so there is
   * nothing to activate and this event never fires. That is the point of the
   * prop, not a gap in it.
   */
  select: [event: Event]
}>()

const slots = useSlots()

const tag = computed(() => {
  if (props.href) return 'a'
  return props.interactive ? 'button' : 'div'
})

/**
 * A row is either a real control or it is inert. There is no third state.
 *
 * The previous version of this component split the difference: an inert row
 * was a bare `<div>` that still carried a tabindex and still emitted `select`
 * on Enter, Space and click. That is a focusable, activatable widget with no
 * role, no name and no value, which fails WCAG 4.1.2 Name, Role, Value, and
 * it made `interactive: false` mean the opposite of what it says. An `<a>`
 * (from `href`) and a `<button>` (the default) are named and roled by the
 * browser and fire `click` from the keyboard for free; a `<div>` is text.
 */
const isControl = computed(() => tag.value !== 'div')

/**
 * `data-nb-notification-item` is the panel's contract, not decoration: it is
 * what NbNotificationCenter's roving focus and its delegated activation both
 * look for. Putting it on an inert row is what made the row reachable, so an
 * inert row does not carry it.
 */
const rowBindings = computed(() =>
  isControl.value
    ? {
        'data-nb-notification-item': '',
        href: tag.value === 'a' ? props.href : undefined,
        type: tag.value === 'button' ? ('button' as const) : undefined,
        onClick: onActivate,
      }
    : {},
)

const STATUS_ICONS: Record<TNotificationStatus, string | null> = {
  neutral: null,
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  error: 'warning-circle',
}

/** One normalisation point for the deprecated `danger` spelling. */
const status = computed<TNotificationStatus>(() =>
  props.variant === 'danger' ? 'error' : props.variant,
)

const resolvedIcon = computed(() => {
  if (props.icon === null) return null
  return props.icon ?? STATUS_ICONS[status.value]
})

const showMedia = computed(() => Boolean(resolvedIcon.value || slots.media))

const asDate = computed(() => {
  if (props.time === undefined || props.time === null) return null
  const date = props.time instanceof Date ? props.time : new Date(props.time)
  return Number.isNaN(date.getTime()) ? null : date
})

const dateTimeAttr = computed(() => asDate.value?.toISOString())

// Largest unit that still describes the gap, formatted by Intl so "yesterday"
// and "2 hours ago" come out in the reader's language rather than in ours.
// Three products wrote three versions of this function; this is the one.
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

function relative(date: Date, locale?: string): string {
  const seconds = (date.getTime() - Date.now()) / 1000
  const magnitude = Math.abs(seconds)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (magnitude >= size || unit === 'second') {
      return format.format(Math.round(seconds / size), unit)
    }
  }
  return format.format(0, 'second')
}

// `relative()` reads the clock, and a server and a browser do not read the
// same one: a row rendered as "just now" on the server is "2 minutes ago" by
// the time the client hydrates, and Vue reports the mismatch and patches the
// text. So the relative form waits for the client. Until then the row shows
// the absolute time in the same locale, which is a true statement at both
// ends and needs no clock to agree.
//
// `timeLabel` skips all of this: a string the host formatted itself is the
// host's problem and is rendered identically at both ends.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const absolute = computed(() =>
  asDate.value
    ? new Intl.DateTimeFormat(props.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(asDate.value)
    : '',
)

const timeText = computed(() => {
  if (props.timeLabel) return props.timeLabel
  if (!asDate.value) return ''
  return mounted.value ? relative(asDate.value, props.locale) : absolute.value
})

// Bound only on a control row. Buttons and links already turn Enter, and
// Space on a button, into a click, so there is no key handling here and no
// synthesised activation anywhere in this component.
function onActivate(event: Event) {
  emit('select', event)
}
</script>

<style lang="scss">
.nb-notification-item {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--nb-c-layer-border-3);

  &:last-child {
    border-bottom: 0;
  }
}

.nb-notification-item__row {
  display: flex;
  align-items: flex-start;
  gap: var(--nb-spacing-8);
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: var(--nb-spacing-10) var(--nb-spacing-12);
  border: 0;
  background: none;
  font-family: inherit;
  font-size: var(--nb-font-size-13);
  color: var(--nb-c-text);
  text-align: left;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }
}

button.nb-notification-item__row,
a.nb-notification-item__row {
  cursor: pointer;

  &:hover {
    background: var(--nb-c-layer-hover-3);
  }
}

// No pointer, no hover ground, no focus ring: an inert row must not look
// like a thing that answers, because looking like one is the same lie in
// pixels that a tabindex is in the accessibility tree.
.nb-notification-item__row--static {
  cursor: default;
}

.nb-notification-item__marker {
  flex: none;
  width: 6px;
  height: 6px;
  margin-top: 6px;
  border-radius: 50%;
  background: transparent;
}

.nb-notification-item--unread {
  background: color-mix(in srgb, var(--nb-c-primary) 6%, transparent);

  .nb-notification-item__marker {
    background: var(--nb-c-primary);
  }

  .nb-notification-item__title {
    font-weight: var(--nb-font-weight-semibold);
    color: var(--nb-c-text);
  }
}

.nb-notification-item__media {
  flex: none;
  display: flex;
  margin-top: 1px;
  color: var(--nb-c-text-muted);
}

.nb-notification-item--info .nb-notification-item__media {
  color: var(--nb-c-info);
}
.nb-notification-item--success .nb-notification-item__media {
  color: var(--nb-c-success);
}
.nb-notification-item--warning .nb-notification-item__media {
  color: var(--nb-c-warning);
}
/* The value is `error`; the token that colours it is --nb-c-danger, which is
   what this library calls that colour role. Word and token disagree on
   purpose: the API follows the status vocabulary, the CSS follows the token
   set, and neither is renamed to please the other. */
.nb-notification-item--error .nb-notification-item__media {
  color: var(--nb-c-danger);
}

.nb-notification-item__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.nb-notification-item__head {
  display: flex;
  align-items: baseline;
  gap: var(--nb-spacing-8);
  justify-content: space-between;
}

.nb-notification-item__title {
  min-width: 0;
  font-weight: var(--nb-font-weight-regular);
  color: var(--nb-c-text-muted);
  overflow-wrap: anywhere;
}

.nb-notification-item__time {
  flex: none;
  font-size: var(--nb-font-size-11);
  color: var(--nb-c-text-subtle);
  white-space: nowrap;
}

.nb-notification-item__body {
  color: var(--nb-c-text-muted);
  font-size: var(--nb-font-size-12);
  line-height: var(--nb-line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nb-notification-item__actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  padding-right: var(--nb-spacing-8);
}

.nb-notification-item__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Unread is carried by three cues on purpose (a tint, a dot, a heavier
   title) and Windows high contrast removes two of them: the tint is a
   background and the dot is a filled shape, and backgrounds and fills are
   both replaced by the user's palette. That would have left the weight, which
   is not a reliable difference, and the visually hidden word, which only a
   reader hears. So the dot is redrawn as a bordered shape the mode keeps and
   the row gains a marked leading edge. */
@media (forced-colors: active) {
  .nb-notification-item--unread {
    background: Canvas;
  }

  .nb-notification-item--unread .nb-notification-item__marker {
    background: Highlight;
    border: 1px solid CanvasText;
    forced-color-adjust: none;
  }

  .nb-notification-item--unread .nb-notification-item__row {
    border-left: 3px solid Highlight;
    /* Keeps the text where the read rows put it. */
    padding-left: calc(var(--nb-spacing-12) - 3px);
  }

  .nb-notification-item {
    border-bottom-color: CanvasText;
  }
}
</style>
