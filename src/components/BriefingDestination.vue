<template>
  <div class="nb-briefing-destination">
    <div class="nb-briefing-destination__head">
      <NbIcon
        class="nb-briefing-destination__icon"
        :icon="ICONS[kind]"
        :size="20"
        aria-hidden="true"
      />
      <span class="nb-briefing-destination__label">
        <strong>{{ label || LABELS[kind] }}</strong>
        <span v-if="summary" class="nb-briefing-destination__summary">
          {{ summary }}
        </span>
        <span v-else class="nb-briefing-destination__summary">
          Not set up
        </span>
      </span>
      <NbButton
        v-if="testLabel"
        variant="ghost"
        size="sm"
        :loading="testing"
        :disabled="!configured"
        @click="emit('test')"
      >
        {{ testLabel }}
      </NbButton>
    </div>
    <div v-if="$slots.default" class="nb-briefing-destination__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as iconEnvelope from '@nubisco/ui/icons/envelope'
import * as iconSlack from '@nubisco/ui/icons/slack-logo'
import * as iconWebhook from '@nubisco/ui/icons/webhooks-logo'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import type { IBriefingDestinationProps } from './BriefingDestination.d'

withDefaults(defineProps<IBriefingDestinationProps>(), {
  label: '',
  summary: '',
  configured: false,
  testing: false,
  testLabel: 'Send a test',
})

const emit = defineEmits<{
  /** Send what the briefing would send now, marked as a test. */
  test: []
}>()

const ICONS = { slack: iconSlack, email: iconEnvelope, webhook: iconWebhook }
const LABELS = { slack: 'Slack', email: 'Email', webhook: 'Webhook' }
</script>

<style lang="scss">
@use '../styles/logic/radius' as radius;

.nb-briefing-destination {
  display: grid;
  gap: calc(var(--nb-base-unit) * 1.5);
  padding: calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  @include radius.standalone(control);
}

.nb-briefing-destination__head {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
}

.nb-briefing-destination__label {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--nb-base-unit);
  min-inline-size: 0;
}

.nb-briefing-destination__summary {
  color: var(--nb-c-text-muted);
  font-size: var(--nb-type-body-sm-size);
  overflow-wrap: anywhere;
}
</style>
