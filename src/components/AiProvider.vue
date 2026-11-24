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
        <NbSelect
          v-if="modelOptions"
          :id="id"
          :model-value="model || null"
          :options="modelOptions"
          :placeholder="defaultPlaceholder"
          clear-label="Use the default"
          searchable
          clearable
          :disabled="busy"
          @update:model-value="emit('update:model', String($event ?? ''))"
        />
        <NbTextInput
          v-else
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
import { computed } from 'vue'
import type { IAiProviderProps } from './AiProvider.d'
import type { ISelectOption } from './Select.d'

const props = withDefaults(defineProps<IAiProviderProps>(), {
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
  models: undefined,
  hasKey: false,
  busy: false,
})

/**
 * The choices for the selected provider, or null to keep free text. A saved
 * model the list does not have (typed before the list existed, or since
 * retired) stays visible, so opening the page never drops it unseen.
 */
const modelOptions = computed<ISelectOption[] | null>(() => {
  const list = props.models?.[props.provider]
  if (!list || list.length === 0) return null
  const options: ISelectOption[] = list.map((m) => ({
    label: m.label,
    value: m.value,
  }))
  if (props.model && !list.some((m) => m.value === props.model)) {
    options.unshift({
      label: `${props.model} (not in the list)`,
      value: props.model,
    })
  }
  return options
})

/** "Default: Claude Haiku 5.5", what an empty model means. */
const defaultPlaceholder = computed(() => {
  const id = props.defaultModels[props.provider]
  if (!id) return "Provider's default"
  const label = props.models?.[props.provider]?.find(
    (m) => m.value === id,
  )?.label
  return `Default: ${label ?? id}`
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
