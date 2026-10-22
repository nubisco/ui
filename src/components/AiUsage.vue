<template>
  <NbPanel class="nb-ai-usage">
    <header class="nb-ai-usage__header">
      <h2 class="nb-ai-usage__title">{{ title }}</h2>
      <p class="nb-ai-usage__description">
        What has been asked of your provider over the last {{ days }} days. Your
        provider bills you directly, so these are our records, not an invoice:
        check the provider console for the authoritative figure.
      </p>
    </header>

    <p v-if="!hasKey" class="nb-ai-usage__empty">
      No key yet, so nothing has been sent to a provider.
    </p>
    <p v-else-if="loading" class="nb-ai-usage__empty">Loading usage...</p>
    <NbDefinitionList v-else :items="items" dividers />

    <slot />
  </NbPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NbDefinitionList from './DefinitionList.vue'
import NbPanel from './Panel.vue'
import type { IAiUsageProps } from './AiUsage.d'

const props = withDefaults(defineProps<IAiUsageProps>(), {
  title: 'Usage and cost',
  days: 30,
  hasKey: false,
  loading: false,
  requests: 0,
  requestsLabel: 'Requests',
  cacheHits: null,
  inputTokens: 0,
  outputTokens: 0,
  estimatedCostUsd: null,
  unpricedModels: () => [],
  pricingVerifiedOn: '',
})

/** 1.2k, 3.4M: the same rounding in every product. */
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

/**
 * Sub-cent totals are the normal case early on, and rounding them to $0.00
 * reads as "this is free" rather than "this is very cheap".
 */
function formatUsd(n: number): string {
  if (n > 0 && n < 0.01) return '<$0.01'
  return `$${n.toFixed(2)}`
}

const items = computed(() => [
  {
    term: props.requestsLabel,
    value: `${props.requests.toLocaleString()} (requests that reached your provider)`,
  },
  ...(props.cacheHits === null
    ? []
    : [
        {
          term: 'Served from cache',
          value: `${props.cacheHits.toLocaleString()} (free: a question already answered)`,
        },
      ]),
  {
    term: 'Tokens',
    value: `${formatTokens(props.inputTokens + props.outputTokens)} (${formatTokens(props.inputTokens)} in, ${formatTokens(props.outputTokens)} out)`,
  },
  {
    term: 'Estimated cost',
    value:
      props.estimatedCostUsd === null
        ? `n/a: no published price on file for ${props.unpricedModels.join(', ') || 'this model'}`
        : `${formatUsd(props.estimatedCostUsd)} at list prices${props.pricingVerifiedOn ? ` as of ${props.pricingVerifiedOn}` : ''}`,
  },
])
</script>

<style lang="scss">
.nb-ai-usage {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
  align-content: start;
}

.nb-ai-usage__header {
  display: grid;
  gap: var(--nb-base-unit);
}

.nb-ai-usage__title {
  margin: 0;
  font-size: var(--nb-type-heading-02-size);
}

.nb-ai-usage__description,
.nb-ai-usage__empty {
  margin: 0;
  max-inline-size: 70ch;
  color: var(--nb-c-text-muted);
  font-size: var(--nb-type-body-sm-size);
}
</style>
