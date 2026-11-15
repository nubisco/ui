<template>
  <div
    class="nb-chat-message"
    :class="{
      'nb-chat-message--own': own,
      'nb-chat-message--with-avatar': picture !== undefined,
    }"
  >
    <!-- The name is beside it, so the avatar is decorative. -->
    <NbAvatar
      v-if="picture !== undefined"
      class="nb-chat-message__avatar"
      :name="author"
      :picture="picture"
      size="md"
      decorative
    />
    <div class="nb-chat-message__main">
      <div class="nb-chat-message__head">
        <span class="nb-chat-message__author">{{ author }}</span>
        <slot v-if="ai || $slots['ai-label']" name="ai-label">
          <NbAiLabel
            class="nb-chat-message__ai"
            variant="inline"
            size="sm"
            :explain="aiExplain"
          >
            <template v-if="$slots['ai-explain']" #explain>
              <slot name="ai-explain" />
            </template>
          </NbAiLabel>
        </slot>
        <time
          v-if="timeText"
          class="nb-chat-message__time"
          :datetime="dateTimeAttr"
          :title="timeTitle"
          >{{ timeText }}</time
        >
      </div>
      <div class="nb-chat-message__body">
        <slot>{{ text }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * One message in a conversation: author, optional avatar, time, an AI label
 * when a model wrote it, and the text. Used inside `NbChatThread`, whose log
 * announces each message as it arrives.
 */
import { computed } from 'vue'
import NbAvatar from './Avatar.vue'
import NbAiLabel from './AiLabel.vue'
import type { IChatMessageProps } from './ChatMessage.d'

const props = withDefaults(defineProps<IChatMessageProps>(), {
  picture: undefined,
  own: false,
  text: '',
  time: undefined,
  timeLabel: undefined,
  locale: undefined,
  ai: false,
  aiExplain: undefined,
})

defineSlots<{
  /** The message body, in place of `text`. */
  default?: () => unknown
  /** Rich content for the AI label's explanation, in place of `aiExplain`. */
  'ai-explain'?: () => unknown
  /**
   * Replaces the AI label outright, for one that needs more than an
   * explanation (`revertable`, `plain-available`, actions). Rendered after
   * the author's name, with or without `ai`.
   */
  'ai-label'?: () => unknown
}>()

const asDate = computed(() => {
  if (props.time === undefined || props.time === null) return null
  const date = props.time instanceof Date ? props.time : new Date(props.time)
  return Number.isNaN(date.getTime()) ? null : date
})

const dateTimeAttr = computed(() => asDate.value?.toISOString())

// A time of day, not "2 minutes ago": a conversation is read in order, and
// a clock time stays true however long the page is left open. It needs no
// clock to agree, so it renders the same on a server and in the browser.
const timeText = computed(() => {
  if (props.timeLabel) return props.timeLabel
  if (!asDate.value) return ''
  return new Intl.DateTimeFormat(props.locale, { timeStyle: 'short' }).format(
    asDate.value,
  )
})

const timeTitle = computed(() =>
  asDate.value
    ? new Intl.DateTimeFormat(props.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(asDate.value)
    : undefined,
)
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

/*
 * Everyone else's messages start at the line's start on the plain surface,
 * with a border. The viewer's own end at the line's end on the accent
 * surface. Place and surface tell the sides apart, and neither is a status
 * colour, so an error or a warning inside a message still reads as one.
 */
.nb-chat-message {
  display: flex;
  align-items: flex-start;
  gap: var(--nb-spacing-8);
  max-width: min(85%, 48rem);
  min-width: 0;
  align-self: flex-start;

  &--own {
    flex-direction: row-reverse;
    align-self: flex-end;
  }
}

.nb-chat-message__avatar {
  flex: none;
}

.nb-chat-message__main {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-4);
  min-width: 0;
  padding: var(--nb-spacing-8) calc(var(--nb-base-unit) * 1.5);
  // A small container, so it takes the popover corner: square in the square
  // appearance, a gentle round in the rounded one, never a capsule.
  @include radius.surface(popover);
  border: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);

  .nb-chat-message--own & {
    border-color: transparent;
    background: var(--nb-c-surface-accent);
  }
}

.nb-chat-message__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--nb-spacing-8);
  row-gap: var(--nb-spacing-2);
  min-width: 0;
}

.nb-chat-message__author {
  min-width: 0;
  font-size: var(--nb-type-heading-compact-size);
  font-weight: var(--nb-type-heading-compact-weight);
  line-height: var(--nb-type-heading-compact-line-height);
  letter-spacing: var(--nb-type-heading-compact-letter-spacing);
  overflow-wrap: anywhere;
}

.nb-chat-message__time {
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  letter-spacing: var(--nb-type-body-sm-letter-spacing);
  color: var(--nb-c-text-subtle);
  white-space: nowrap;
}

// Long text wraps, a long URL or a hash breaks anywhere rather than pushing
// the message wider than the thread, and the author's line breaks are kept.
.nb-chat-message__body {
  min-width: 0;
  font-size: var(--nb-type-body-compact-size);
  line-height: var(--nb-type-body-md-line-height);
  letter-spacing: var(--nb-type-body-compact-letter-spacing);
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  // Rich content brings its own block layout.
  :slotted(*) {
    white-space: normal;
  }

  :slotted(pre),
  :slotted(code) {
    white-space: pre-wrap;
  }
}

// A phone gives the message nearly the whole line: 85% of 360px is too
// narrow to read a paragraph in.
@include bp.phone {
  .nb-chat-message {
    max-width: 92%;
  }
}
</style>
