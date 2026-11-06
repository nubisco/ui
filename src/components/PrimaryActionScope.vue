<template>
  <slot />
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { NB_PRIMARY_ACTION_SCOPE } from './PrimaryAction.context'

// Internal helper: wraps a header's actions slot and counts the filled primary
// buttons rendered in it. Renders no element, so the header's layout does not
// change. Not registered as a component: NbPanel, NbCard and NbPageHeader use
// it around their own `actions` slot.
const props = defineProps<{
  /** The component whose header this is, for the warning. */
  owner: string
}>()

let count = 0
let warned = false

function isDevelopment(): boolean {
  return !(
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
  )
}

provide(NB_PRIMARY_ACTION_SCOPE, {
  register() {
    count += 1
    if (count > 1 && !warned && isDevelopment()) {
      warned = true
      console.warn(
        `[${props.owner}] ${count} filled primary buttons in one header's actions slot. ` +
          'A header carries one primary action: step the others down to ' +
          '`tertiary` or `ghost`. See https://docs.nubisco.io/ui/principles/hierarchy',
      )
    }
    let counted = true
    return () => {
      if (!counted) return
      counted = false
      count -= 1
    }
  },
})
</script>
