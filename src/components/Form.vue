<template>
  <NbGrid is="form" dir="col" gap="md" class="nb-form">
    <NbGrid is="h4" v-if="title" class="nb-form--header">
      {{ title }}
    </NbGrid>
    <NbGrid is="p" v-if="$slots.message" class="nb-form--message">
      <slot name="message" />
    </NbGrid>
    <NbGrid
      is="div"
      v-if="$slots.default"
      dir="col"
      gap="sm"
      class="nb-form--body"
    >
      <slot />
    </NbGrid>
    <NbGrid
      is="footer"
      v-if="$slots.footer"
      class="nb-form--footer"
      justify="end"
    >
      <slot name="footer" />
    </NbGrid>
  </NbGrid>
</template>

<script lang="ts" setup>
import { IFormProps } from './Form.d'

withDefaults(defineProps<IFormProps>(), {
  title: undefined,
})
</script>

<style lang="scss" scoped></style>
