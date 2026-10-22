<template>
  <NbPanel
    :class="['nb-briefing', { 'nb-briefing--with-preview': hasPreview }]"
  >
    <header class="nb-briefing__header">
      <div class="nb-briefing__heading">
        <h3 class="nb-briefing__title">{{ title }}</h3>
        <span v-if="status" class="nb-briefing__status">{{ status }}</span>
      </div>
      <NbSwitch
        v-if="enabled !== undefined"
        :model-value="enabled"
        :name="`${id}-enabled`"
        :label="`Run ${title}`"
        hide-label
        :disabled="busy"
        @update:model-value="emit('update:enabled', Boolean($event))"
      />
    </header>

    <div class="nb-briefing__body">
      <div class="nb-briefing__main">
        <div v-if="$slots.description" class="nb-briefing__description">
          <slot name="description" />
        </div>

        <div v-if="aiWriting !== undefined" class="nb-briefing__ai">
          <NbSwitch
            :model-value="aiWriting"
            :name="`${id}-ai`"
            label="Written by AI"
            hide-label
            :disabled="busy"
            @update:model-value="emit('update:aiWriting', Boolean($event))"
          />
          <span class="nb-briefing__ai-text">
            <strong>Written by AI</strong> <NbAiLabel static size="sm" />
            <span class="nb-briefing__ai-hint">
              Off, it is the plain version built from the facts.
            </span>
          </span>
        </div>

        <slot />

        <section v-if="$slots.destinations" class="nb-briefing__destinations">
          <h4 class="nb-briefing__subtitle">Destinations</h4>
          <slot name="destinations" />
        </section>

        <div v-if="$slots.actions" class="nb-briefing__actions">
          <slot name="actions" />
        </div>
      </div>

      <aside v-if="hasPreview" class="nb-briefing__aside">
        <slot name="preview" />
        <slot name="runs" />
      </aside>
    </div>
  </NbPanel>
</template>

<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import NbAiLabel from './AiLabel.vue'
import NbPanel from './Panel.vue'
import NbSwitch from './Switch.vue'
import type { IBriefingProps } from './Briefing.d'

withDefaults(defineProps<IBriefingProps>(), {
  enabled: undefined,
  aiWriting: undefined,
  status: '',
  busy: false,
})

const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:aiWriting': [value: boolean]
}>()

const slots = useSlots()
const id = useId()
const hasPreview = computed(() => Boolean(slots.preview || slots.runs))
</script>

<style lang="scss">
.nb-briefing {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
  container-type: inline-size;
}

.nb-briefing__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--nb-base-unit) * 2);
}

.nb-briefing__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--nb-base-unit);
}

.nb-briefing__title {
  margin: 0;
  font-size: var(--nb-type-heading-02-size);
}

.nb-briefing__status,
.nb-briefing__description {
  color: var(--nb-c-text-muted);
  font-size: var(--nb-type-body-sm-size);

  p {
    margin: 0;
  }
}

.nb-briefing__description {
  max-inline-size: 70ch;
}

// Settings on the left at a form's measure, what they produce beside them.
// A container query, so it follows the panel rather than the window.
.nb-briefing__body {
  display: grid;
  gap: calc(var(--nb-base-unit) * 3);
  align-items: start;
}

@container (min-width: 900px) {
  .nb-briefing--with-preview .nb-briefing__body {
    grid-template-columns: minmax(0, 40rem) minmax(0, 1fr);
  }

  // The preview follows the scroll, so it is still in view beside the
  // Preview button at the foot of a long form.
  .nb-briefing--with-preview .nb-briefing__aside {
    position: sticky;
    top: calc(var(--nb-base-unit) * 2);
  }
}

.nb-briefing__main,
.nb-briefing__aside,
.nb-briefing__destinations {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
  min-inline-size: 0;
}

// A form's measure, with or without a preview beside it, so a briefing's
// destinations do not stretch across a wide panel.
.nb-briefing__main {
  max-inline-size: 40rem;
}

.nb-briefing__subtitle {
  margin: 0;
  font-size: var(--nb-type-heading-01-size);
}

.nb-briefing__ai {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--nb-base-unit) * 1.5);
}

.nb-briefing__ai-text {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 var(--nb-base-unit);

  .nb-briefing__ai-hint {
    flex-basis: 100%;
    color: var(--nb-c-text-muted);
    font-size: var(--nb-type-body-sm-size);
  }
}

.nb-briefing__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nb-base-unit);
}
</style>
