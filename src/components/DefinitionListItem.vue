<template>
  <div class="nb-definition-list__row">
    <dt class="nb-definition-list__term">
      <slot name="term">{{ term }}</slot>
    </dt>
    <dd class="nb-definition-list__value">
      <slot />
    </dd>
  </div>
</template>

<script setup lang="ts">
import type { IDefinitionListItemProps } from './DefinitionList.d'

withDefaults(defineProps<IDefinitionListItemProps>(), { term: '' })
</script>

<!-- Deliberately unstyled and unscoped: the row's layout belongs to the list,
     which owns the term column width, the density and the dividers. Giving the
     item its own scoped copy of those rules would mean two places to change
     when the layout does, and they would drift. -->
