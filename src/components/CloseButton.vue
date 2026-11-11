<template>
  <NbButton
    ref="buttonRef"
    class="nb-close-button"
    variant="ghost"
    :size="size"
    :icon="iconX"
    :label="resolvedLabel"
    :tooltip-position="tooltipPosition"
    :disabled="disabled"
    @click="emit('click', $event)"
  />
</template>

<script setup lang="ts">
import * as iconX from '@nubisco/ui/icons/x'
import { computed, ref } from 'vue'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import NbButton from './Button.vue'
import type { ICloseButtonProps } from './CloseButton.d'

/*
 * One close control for the whole library.
 *
 * Before this there were nine of them, in seven sizes from about 16px to 56px,
 * with four different hovers and three different focus colours: a toast's,
 * a banner's, a modal's corner square, a sheet's text glyph. Each was right
 * in isolation and together they told the user that closing a thing works
 * differently depending on what the thing is. It is a ghost icon-only
 * NbButton, so it hovers, focuses, disables and names itself exactly the way
 * every other icon button does, and only the two Carbon sizes are offered.
 */
const props = withDefaults(defineProps<ICloseButtonProps>(), {
  label: undefined,
  size: 'sm',
  disabled: false,
  tooltipPosition: 'bottom',
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const nbStrings = useNbStrings()
// The prop wins over the catalogue, so a caller that names what is being
// closed keeps its words, and an app that translated the catalogue gets its
// language everywhere else.
const resolvedLabel = computed(() => props.label ?? nbStrings.value.close)

const buttonRef = ref<InstanceType<typeof NbButton> | null>(null)

/** The rendered `<button>`, for a host that moves focus onto it. */
function el(): HTMLElement | null {
  const node = buttonRef.value?.$el
  return node instanceof HTMLElement ? node : null
}

defineExpose({ focus: () => el()?.focus(), el })
</script>
