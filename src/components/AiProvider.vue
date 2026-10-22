<template>
  <NbPanel class="nb-ai-provider">
    <header class="nb-ai-provider__header">
      <h2 class="nb-ai-provider__title">
        {{ title }} <NbAiLabel static size="sm" />
      </h2>
      <div v-if="$slots.default" class="nb-ai-provider__description">
        <slot />
      </div>
    </header>

    <div class="nb-ai-provider__row">
      <NbField v-slot="{ id }" label="Provider" orientation="stack">
        <NbSelect
          :id="id"
          :model-value="provider"
          :options="providers"
          :disabled="busy"
          @update:model-value="emit('update:provider', String($event))"
        />
      </NbField>
      <NbField
        v-slot="{ id }"
        label="Model"
        hint="Empty uses the provider's default."
        orientation="stack"
      >
        <NbTextInput
          :id="id"
          :model-value="model"
          :placeholder="defaultModels[provider] ?? ''"
          :disabled="busy"
          @update:model-value="emit('update:model', String($event ?? ''))"
        />
      </NbField>
    </div>

    <NbField
      v-slot="{ id }"
      label="API key"
      hint="Encrypted at rest and never sent back to the browser, so this field is always empty when the page loads."
      orientation="stack"
    >
      <NbTextInput
        :id="id"
        :model-value="apiKey"
        type="password"
        autocomplete="off"
        :placeholder="
          hasKey ? 'Stored. Type a new key to replace it.' : 'sk-...'
        "
        :disabled="busy"
        @update:model-value="emit('update:apiKey', String($event ?? ''))"
      />
    </NbField>

    <div class="nb-ai-provider__actions">
      <NbButton variant="primary" :loading="busy" @click="emit('save')">
        Save AI settings
      </NbButton>
      <NbButton
        v-if="hasKey"
        variant="ghost"
        :disabled="busy"
        @click="emit('remove')"
      >
        Remove key
      </NbButton>
    </div>
  </NbPanel>
</template>

<script setup lang="ts">
import NbAiLabel from './AiLabel.vue'
import NbButton from './Button.vue'
import NbField from './Field.vue'
import NbPanel from './Panel.vue'
import NbSelect from './Select.vue'
import NbTextInput from './TextInput.vue'
import type { IAiProviderProps } from './AiProvider.d'

withDefaults(defineProps<IAiProviderProps>(), {
  title: 'AI briefings',
  providers: () => [
    { label: 'Anthropic (Claude)', value: 'anthropic' },
    { label: 'OpenAI', value: 'openai' },
    { label: 'Google Gemini', value: 'gemini' },
  ],
  provider: 'anthropic',
  model: '',
  apiKey: '',
  defaultModels: () => ({}),
  hasKey: false,
  busy: false,
})

const emit = defineEmits<{
  'update:provider': [value: string]
  'update:model': [value: string]
  'update:apiKey': [value: string]
  /** Save the provider, the model, and the key when one was typed. */
  save: []
  /** Remove the stored key. */
  remove: []
}>()
</script>

<style lang="scss">
.nb-ai-provider {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
}

.nb-ai-provider__header {
  display: grid;
  gap: var(--nb-base-unit);
}

.nb-ai-provider__title {
  display: flex;
  align-items: center;
  gap: var(--nb-base-unit);
  margin: 0;
  font-size: var(--nb-type-heading-02-size);
}

.nb-ai-provider__description {
  color: var(--nb-c-text-muted);
  font-size: var(--nb-type-body-sm-size);
  max-inline-size: 70ch;

  p {
    margin: 0;
  }
}

.nb-ai-provider__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: calc(var(--nb-base-unit) * 1.5);
}

.nb-ai-provider__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nb-base-unit);
}
</style>
