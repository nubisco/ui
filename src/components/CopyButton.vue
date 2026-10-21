<template>
  <span class="nb-copy-button">
    <NbButton
      v-nb-tooltip="{ body: copied ? copiedLabel : label, aria: 'none' }"
      :aria-label="copied ? copiedLabel : label"
      class="nb-copy-button__button"
      :class="{ 'nb-copy-button__button--copied': copied }"
      variant="ghost"
      :size="size"
      :icon="copied ? iconCheck : iconCopy"
      @click.stop.prevent="copy"
      @pointerdown.stop
      @mousedown.stop
      @dblclick.stop
    />
    <!-- The tooltip names the button. This says what happened, once, to a
         screen reader that cannot see the icon change. -->
    <span class="nb-copy-button__status" role="status">
      {{ copied ? copiedLabel : '' }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import * as iconCopy from '@nubisco/ui/icons/copy'
import * as iconCheck from '@nubisco/ui/icons/check'
import NbButton from './Button.vue'
import type { ICopyButtonProps } from './CopyButton.d'

const props = withDefaults(defineProps<ICopyButtonProps>(), {
  label: 'Copy',
  copiedLabel: 'Copied',
  size: 'xs',
  duration: 1500,
})

const emit = defineEmits<{
  /** The text is on the clipboard. */
  copied: [text: string]
  /** The browser refused. The host decides how to say so. */
  error: [error: unknown]
}>()

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

/**
 * The async clipboard API where the page is allowed it, and the old
 * selection copy where it is not (plain http on a LAN address, an iframe
 * without the permission), so the button works wherever the page does.
 */
async function writeText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through to the selection copy.
    }
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand?.('copy') ?? false
  area.remove()
  if (!ok) throw new Error('The browser did not allow copying.')
}

async function copy(): Promise<void> {
  try {
    await writeText(props.text)
  } catch (error) {
    emit('error', error)
    return
  }
  copied.value = true
  emit('copied', props.text)
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => (copied.value = false), props.duration)
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<style lang="scss">
.nb-copy-button {
  display: inline-flex;
  align-items: center;
}

// The checkmark is the confirmation, so it is green and unfilled, hovered or
// not: a hover fill would turn it into a white tick on a purple block. Deep
// enough to outrank the button's own scoped ghost and hover rules.
.nb-copy-button .nb-button.nb-copy-button__button--copied {
  &,
  &:hover:not(:disabled),
  &:active:not(:disabled) {
    background: transparent;
    color: var(--nb-c-success);
  }
}

.nb-copy-button__status {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
