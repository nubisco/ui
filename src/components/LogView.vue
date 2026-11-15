<template>
  <div class="nb-log-view" :class="{ 'nb-log-view--nowrap': !wrap }">
    <div v-if="copyable && lines.length" class="nb-log-view__toolbar">
      <NbCopyButton
        :text="copyText"
        :label="copyLabel"
        size="sm"
        class="nb-log-view__copy"
      />
    </div>
    <div class="nb-log-view__viewport">
      <!-- role="log" is polite by default. Turned off unless asked for: a
           busy log would talk over everything else on the page. Focusable so
           the keyboard can scroll it. -->
      <div
        ref="logRef"
        class="nb-log-view__log"
        role="log"
        :aria-live="announce ? 'polite' : 'off'"
        :aria-label="resolvedLabel"
        tabindex="0"
        @scroll.passive="follow.onScroll"
      >
        <p v-if="hiddenCount > 0" class="nb-log-view__hidden">
          {{ strings.logViewHidden(hiddenCount) }}
        </p>
        <div
          v-for="row in visibleRows"
          :key="row.key"
          class="nb-log-view__line"
          :class="row.level ? `nb-log-view__line--${row.level}` : undefined"
        >
          <time
            v-if="row.time"
            class="nb-log-view__time"
            :datetime="row.datetime"
            >{{ row.time }}</time
          >
          <span v-if="row.marker" class="nb-log-view__marker">{{
            row.marker
          }}</span>
          <span class="nb-log-view__text">{{ row.text }}</span>
        </div>
        <div v-if="!lines.length" class="nb-log-view__empty">
          <slot name="empty">{{ resolvedEmptyText }}</slot>
        </div>
      </div>
      <Transition name="nb-log-view-jump">
        <div v-if="follow.unseen.value" class="nb-log-view__jump">
          <NbButton
            variant="secondary"
            size="sm"
            :icon="iconArrowDown"
            class="nb-log-view__jump-button"
            @click="follow.scrollToEnd(true)"
            >{{ strings.jumpToNewest }}</NbButton
          >
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * A read-only log or terminal output. Monospace lines, each with an optional
 * time and an optional marker, following the newest line unless the reader
 * scrolled up. Only the newest `maxLines` are rendered, so a log that runs
 * for hours stays as quick as one that just started.
 */
import { computed, ref } from 'vue'
import * as iconArrowDown from '@nubisco/ui/icons/arrow-down'
import NbButton from './Button.vue'
import NbCopyButton from './CopyButton.vue'
import type { ILogLine, ILogViewProps, TLogLevel } from './LogView.d'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { useFollowNewest } from '@/composables/useFollowNewest.composable'

const props = withDefaults(defineProps<ILogViewProps>(), {
  maxLines: 1000,
  follow: true,
  wrap: true,
  copyable: true,
  label: undefined,
  announce: false,
  emptyText: undefined,
  locale: undefined,
})

defineSlots<{
  /** Shown while there are no lines, in place of `emptyText`. */
  empty?: () => unknown
}>()

const strings = useNbStrings()

const resolvedLabel = computed(() => props.label ?? strings.value.logViewLabel)
const resolvedEmptyText = computed(
  () => props.emptyText ?? strings.value.logViewEmpty,
)
const copyLabel = computed(() => strings.value.logViewCopy)

interface IRow {
  key: string | number
  text: string
  time: string
  datetime: string | undefined
  level: TLogLevel | undefined
  marker: string
}

// One formatter per locale, not one per line: a few thousand lines are
// formatted on every append.
const timeFormat = computed(
  () =>
    new Intl.DateTimeFormat(props.locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      // A log reads on a 24-hour clock in every locale: "AM" and "PM" add
      // width to every line and say nothing a reader of a log needs.
      hourCycle: 'h23',
    }),
)

function asDate(value: ILogLine['time']): Date | null {
  if (value === undefined || value === null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function defaultMarker(level: TLogLevel | undefined): string {
  if (level === 'error') return strings.value.logViewError
  if (level === 'warning') return strings.value.logViewWarning
  return ''
}

function toRow(line: ILogLine | string, index: number): IRow {
  if (typeof line === 'string')
    return {
      key: index,
      text: line,
      time: '',
      datetime: undefined,
      level: undefined,
      marker: '',
    }
  const date = asDate(line.time)
  return {
    key: line.id ?? index,
    text: line.text,
    time: line.timeLabel ?? (date ? timeFormat.value.format(date) : ''),
    datetime: date?.toISOString(),
    level: line.level,
    marker: line.marker ?? defaultMarker(line.level),
  }
}

const start = computed(() =>
  props.maxLines > 0 ? Math.max(0, props.lines.length - props.maxLines) : 0,
)
const hiddenCount = computed(() => start.value)

// Keyed by absolute position, so appending (and the oldest line dropping
// off the top) leaves every other rendered line where it is.
const visibleRows = computed(() =>
  props.lines.slice(start.value).map((line, i) => toRow(line, start.value + i)),
)

// Everything, not only what is rendered: what was cut from the view for
// speed is still the log.
const copyText = computed(() =>
  props.lines
    .map((line, i) => {
      const row = toRow(line, i)
      return [row.time, row.marker, row.text].filter(Boolean).join(' ')
    })
    .join('\n'),
)

const logRef = ref<HTMLElement | null>(null)
const follow = useFollowNewest(logRef, () => props.follow)

defineExpose({
  /** Scrolls the log to the newest line. */
  scrollToNewest: () => follow.scrollToEnd(),
})
</script>

<style scoped lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

.nb-log-view {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
  @include radius.surface(panel);
  border: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  overflow: hidden;
}

// The copy button sits in the top corner on a strip of its own, so it never
// covers the first line.
.nb-log-view__toolbar {
  display: flex;
  justify-content: flex-end;
  flex: none;
  padding: var(--nb-spacing-4) var(--nb-spacing-4) 0;
}

.nb-log-view__viewport {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.nb-log-view__log {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: var(--nb-spacing-8) calc(var(--nb-base-unit) * 1.5);
  font-family: var(--nb-type-code-sm-family);
  font-size: var(--nb-type-code-sm-size);
  font-weight: var(--nb-type-code-sm-weight);
  line-height: var(--nb-type-code-sm-line-height);
  letter-spacing: var(--nb-type-code-sm-letter-spacing);
  color: var(--nb-c-text);
  tab-size: 4;

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }
}

.nb-log-view__hidden {
  margin: 0 0 var(--nb-spacing-4);
  font-family: var(--nb-type-body-sm-family);
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  letter-spacing: var(--nb-type-body-sm-letter-spacing);
  color: var(--nb-c-text-subtle);
}

// A line off screen skips layout and paint, so a long log costs about what
// its visible part does. The intrinsic size is one line, which is what most
// lines are.
.nb-log-view__line {
  display: flex;
  align-items: baseline;
  gap: var(--nb-spacing-8);
  min-width: 0;
  content-visibility: auto;
  contain-intrinsic-size: auto var(--nb-type-code-sm-line-height);
}

.nb-log-view__time {
  flex: none;
  color: var(--nb-c-text-subtle);
  font-variant-numeric: tabular-nums;
}

.nb-log-view__marker {
  flex: none;
  color: var(--nb-c-text-muted);
}

.nb-log-view__text {
  flex: 1 1 auto;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

// Error and warning colour the words, never the row: a filled row in a log
// reads as selected, and a log of errors would be a wall of red.
.nb-log-view__line--error {
  .nb-log-view__marker,
  .nb-log-view__text {
    color: var(--nb-c-text-error);
  }
}

.nb-log-view__line--warning {
  .nb-log-view__marker,
  .nb-log-view__text {
    color: var(--nb-c-text-warning);
  }
}

.nb-log-view__line--debug .nb-log-view__text {
  color: var(--nb-c-text-muted);
}

.nb-log-view--nowrap {
  .nb-log-view__line {
    width: max-content;
    min-width: 100%;
  }

  .nb-log-view__text {
    white-space: pre;
    overflow-wrap: normal;
  }
}

.nb-log-view__empty {
  font-family: var(--nb-type-body-sm-family);
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  letter-spacing: var(--nb-type-body-sm-letter-spacing);
  color: var(--nb-c-text-muted);
}

.nb-log-view__jump {
  position: absolute;
  inset-inline: 0;
  bottom: var(--nb-spacing-16);
  display: flex;
  justify-content: center;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.nb-log-view__jump-button {
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
}

@include motion.popover(nb-log-view-jump, translateY(4px));

// A phone keeps the time and marker on the line, and lets a long marker or
// time push the text under them rather than squeezing it to a sliver.
@include bp.phone {
  .nb-log-view:not(.nb-log-view--nowrap) .nb-log-view__line {
    flex-wrap: wrap;
    column-gap: var(--nb-spacing-8);
    row-gap: 0;
  }

  .nb-log-view:not(.nb-log-view--nowrap) .nb-log-view__text {
    flex-basis: 12ch;
  }
}
</style>
