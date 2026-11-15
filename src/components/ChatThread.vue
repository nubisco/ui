<template>
  <div
    class="nb-chat-thread"
    :class="{ 'nb-chat-thread--with-composer': composer }"
  >
    <div class="nb-chat-thread__viewport">
      <!-- role="log" is a polite live region already: a screen reader reads
           each message as it is added, without moving focus. It is focusable
           so the keyboard can scroll it. -->
      <div
        ref="logRef"
        class="nb-chat-thread__log"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        :aria-label="resolvedLabel"
        :aria-busy="working || undefined"
        tabindex="0"
        @scroll.passive="follow.onScroll"
      >
        <slot v-if="hasMessages" />
        <div v-else-if="$slots.empty" class="nb-chat-thread__empty">
          <slot name="empty" />
        </div>
        <div v-if="working" class="nb-chat-thread__working">
          <NbInlineLoading
            status="active"
            :label="resolvedWorkingLabel"
            :reserve-space="false"
          />
        </div>
      </div>
      <Transition name="nb-chat-thread-jump">
        <div v-if="follow.unseen.value" class="nb-chat-thread__jump">
          <NbButton
            variant="secondary"
            size="sm"
            :icon="iconArrowDown"
            class="nb-chat-thread__jump-button"
            @click="jumpToNewest"
            >{{ strings.jumpToNewest }}</NbButton
          >
        </div>
      </Transition>
    </div>

    <form
      v-if="composer"
      class="nb-chat-thread__composer"
      @submit.prevent="send"
    >
      <div class="nb-chat-thread__row">
        <!-- NbTextInput hands class, style and listeners to its textarea, so
             the layout box is this wrapper. -->
        <div
          class="nb-chat-thread__field"
          :style="{ '--nb-chat-thread-max-rows': String(maxRows) }"
        >
          <NbTextInput
            ref="fieldRef"
            v-model="draft"
            multiline
            :rows="1"
            :aria-label="resolvedComposerLabel"
            :placeholder="resolvedPlaceholder"
            :disabled="disabled"
            :enterkeyhint="phone ? 'enter' : 'send'"
            @keydown="onFieldKeydown"
          />
        </div>
        <div class="nb-chat-thread__actions">
          <NbButton
            v-if="working && stoppable"
            variant="secondary"
            :icon="iconStop"
            :label="resolvedStopLabel"
            tooltip-position="top"
            class="nb-chat-thread__stop"
            @click="emit('stop')"
          />
          <NbButton
            type="submit"
            variant="primary"
            :icon="iconSend"
            :label="resolvedSendLabel"
            tooltip-position="top"
            :disabled="disabled"
            :disabled-reason="disabled ? disabledReason : undefined"
            class="nb-chat-thread__send"
          />
        </div>
      </div>
      <!-- The reason is also the send button's tooltip and description. It
           is written out here too, because a phone has no hover. -->
      <p v-if="disabled && disabledReason" class="nb-chat-thread__reason">
        {{ disabledReason }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * A conversation: a log of messages that follows the newest one unless the
 * reader has scrolled up to read, and an optional composer.
 *
 * Enter sends and Shift+Enter breaks the line on a desktop. On a phone Enter
 * breaks the line, as a phone keyboard's return key promises, and the send
 * button sends.
 */
import { computed, nextTick, ref, useSlots } from 'vue'
import * as iconArrowDown from '@nubisco/ui/icons/arrow-down'
import * as iconSend from '@nubisco/ui/icons/paper-plane-right'
import * as iconStop from '@nubisco/ui/icons/stop'
import NbButton from './Button.vue'
import NbInlineLoading from './InlineLoading.vue'
import NbTextInput from './TextInput.vue'
import type { IChatThreadProps } from './ChatThread.d'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { useFollowNewest } from '@/composables/useFollowNewest.composable'
import { hasRenderableContent } from '@/utils/slotContent.helper'

const props = withDefaults(defineProps<IChatThreadProps>(), {
  label: undefined,
  working: false,
  workingLabel: undefined,
  composer: false,
  composerLabel: undefined,
  placeholder: undefined,
  disabled: false,
  disabledReason: undefined,
  stoppable: false,
  sendLabel: undefined,
  stopLabel: undefined,
  maxRows: 6,
})

const emit = defineEmits<{
  /**
   * The composer sent a message: its text, trimmed. The composer empties
   * itself after emitting. Nothing is sent while the text is blank or the
   * composer is disabled.
   */
  send: [text: string]
  /** The stop button was pressed. Only while `working` and `stoppable`. */
  stop: []
}>()

defineSlots<{
  /** The messages, oldest first: `NbChatMessage`s. */
  default?: () => unknown
  /** Shown in the log while there are no messages. */
  empty?: () => unknown
}>()

/** The composer's text (`v-model:draft`). */
const draft = defineModel<string>('draft', { default: '' })

const strings = useNbStrings()
const { phone } = usePhoneLayout()
const slots = useSlots()

const resolvedLabel = computed(
  () => props.label ?? strings.value.chatThreadLabel,
)
const resolvedWorkingLabel = computed(
  () => props.workingLabel ?? strings.value.chatThreadWorking,
)
const resolvedComposerLabel = computed(
  () => props.composerLabel ?? strings.value.chatThreadMessage,
)
const resolvedPlaceholder = computed(
  () => props.placeholder ?? strings.value.chatThreadPlaceholder,
)
const resolvedSendLabel = computed(
  () => props.sendLabel ?? strings.value.chatThreadSend,
)
const resolvedStopLabel = computed(
  () => props.stopLabel ?? strings.value.chatThreadStop,
)

const hasMessages = computed(() => {
  const content = slots.default?.()
  return content ? hasRenderableContent(content) : false
})

const logRef = ref<HTMLElement | null>(null)
const fieldRef = ref<{ focus: () => void } | null>(null)
const follow = useFollowNewest(logRef)

function jumpToNewest(): void {
  follow.scrollToEnd(true)
}

function send(): void {
  if (props.disabled) return
  const text = draft.value.trim()
  if (!text) return
  emit('send', text)
  draft.value = ''
  // Whoever sends is reading the newest message.
  void nextTick(() => follow.scrollToEnd())
}

function onFieldKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return
  // An input method composing a character uses Enter to confirm it.
  if (event.isComposing || event.keyCode === 229) return
  if (event.shiftKey || event.altKey) return
  // A phone keyboard's return key breaks the line. Cmd or Ctrl+Enter still
  // sends from a hardware keyboard.
  if (phone.value && !event.metaKey && !event.ctrlKey) return
  event.preventDefault()
  send()
}

defineExpose({
  /** Scrolls the log to the newest message. */
  scrollToNewest: () => follow.scrollToEnd(),
  /** Moves focus into the composer. */
  focus: () => fieldRef.value?.focus(),
})
</script>

<style scoped lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/variables/breakpoints' as bp;

.nb-chat-thread {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  height: 100%;
}

.nb-chat-thread__viewport {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.nb-chat-thread__log {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: calc(var(--nb-base-unit) * 1.5);
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: var(--nb-spacing-16);

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: -2px;
  }
}

.nb-chat-thread__empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
}

.nb-chat-thread__working {
  align-self: flex-start;
  color: var(--nb-c-text-muted);
}

.nb-chat-thread__jump {
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

.nb-chat-thread__jump-button {
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
}

@include motion.popover(nb-chat-thread-jump, translateY(4px));

.nb-chat-thread__composer {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-4);
  padding: calc(var(--nb-base-unit) * 1.5) var(--nb-spacing-16);
  border-top: 1px solid var(--nb-c-border);
}

// The buttons sit on the field's last line, where the caret is, and stay
// there as it grows.
.nb-chat-thread__row {
  display: flex;
  align-items: flex-end;
  gap: var(--nb-spacing-8);
}

.nb-chat-thread__field {
  flex: 1 1 auto;
  min-width: 0;

  // One row to start, growing with the text up to `maxRows` where the
  // browser sizes a field to its content, then scrolling.
  // The field's own 80px floor is for a form's comment box. Here it starts
  // as tall as the send button beside it.
  :deep(textarea.nb-text-input__field) {
    field-sizing: content;
    min-height: calc(var(--nb-base-unit) * 5);
    resize: none;
    max-height: calc(
      var(--nb-chat-thread-max-rows, 6) * var(--nb-type-body-md-line-height) +
        var(--nb-spacing-16)
    );
    overflow-wrap: anywhere;
  }
}

.nb-chat-thread__actions {
  display: flex;
  flex: none;
  gap: var(--nb-spacing-8);
}

.nb-chat-thread__reason {
  margin: 0;
  font-size: var(--nb-type-helper-text-size);
  line-height: var(--nb-type-helper-text-line-height);
  letter-spacing: var(--nb-type-helper-text-letter-spacing);
  color: var(--nb-c-text-muted);
  overflow-wrap: anywhere;
}

@include bp.phone {
  .nb-chat-thread__log {
    padding: calc(var(--nb-base-unit) * 1.5);
  }

  .nb-chat-thread__composer {
    padding: var(--nb-spacing-8) calc(var(--nb-base-unit) * 1.5);
  }
}
</style>
