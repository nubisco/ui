<template>
  <div
    class="nb-blueprint-card"
    :class="{
      'nb-blueprint-card--selected': selected,
      'nb-blueprint-card--disabled': !enabled,
    }"
    :style="{ '--nb-card-color': color || 'var(--nb-c-primary)' }"
    @mousedown.stop="$emit('select', id)"
  >
    <!-- Color indicator -->
    <div class="nb-blueprint-card__indicator" />

    <!-- Input ports (left side) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--left">
      <div
        v-for="port in inputPorts"
        :key="port.id"
        :data-port="`${id}:${port.id}`"
        class="nb-blueprint-card__port"
        :title="port.label"
        @mousedown.stop="
          $emit('port-mousedown', {
            nodeId: id,
            portId: port.id,
            type: 'input',
          })
        "
        @mouseup.stop="
          $emit('port-mouseup', { nodeId: id, portId: port.id, type: 'input' })
        "
      />
    </div>

    <!-- Card body -->
    <div class="nb-blueprint-card__body">
      <div class="nb-blueprint-card__header">
        <span class="nb-blueprint-card__title">{{ title }}</span>
        <label
          v-if="enabled !== undefined"
          class="nb-blueprint-card__toggle"
          @click.stop
        >
          <input
            type="checkbox"
            :checked="enabled"
            @change="
              $emit('toggle', id, ($event.target as HTMLInputElement).checked)
            "
          />
          <span class="nb-blueprint-card__toggle-track" />
        </label>
        <button
          v-if="removable"
          class="nb-blueprint-card__remove"
          title="Remove"
          @click.stop="$emit('remove', id)"
        >
          &times;
        </button>
      </div>
      <span v-if="category" class="nb-blueprint-card__category">{{
        category
      }}</span>
      <div v-if="$slots.default" class="nb-blueprint-card__content">
        <slot />
      </div>
    </div>

    <!-- Output ports (right side) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--right">
      <div
        v-for="port in outputPorts"
        :key="port.id"
        :data-port="`${id}:${port.id}`"
        class="nb-blueprint-card__port"
        :title="port.label"
        @mousedown.stop="
          $emit('port-mousedown', {
            nodeId: id,
            portId: port.id,
            type: 'output',
          })
        "
        @mouseup.stop="
          $emit('port-mouseup', { nodeId: id, portId: port.id, type: 'output' })
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IBlueprintCardProps, IBlueprintPort } from './BlueprintCard.d'

const props = withDefaults(defineProps<IBlueprintCardProps>(), {
  color: undefined,
  enabled: true,
  selected: false,
  category: '',
  ports: () => [],
  x: 0,
  y: 0,
  removable: false,
})

defineEmits<{
  select: [id: string]
  toggle: [id: string, enabled: boolean]
  remove: [id: string]
  'port-mousedown': [
    data: { nodeId: string; portId: string; type: 'input' | 'output' },
  ]
  'port-mouseup': [
    data: { nodeId: string; portId: string; type: 'input' | 'output' },
  ]
}>()

const inputPorts = computed((): IBlueprintPort[] =>
  props.ports.filter((p) => p.type === 'input'),
)
const outputPorts = computed((): IBlueprintPort[] =>
  props.ports.filter((p) => p.type === 'output'),
)
</script>

<style scoped lang="scss">
.nb-blueprint-card {
  display: flex;
  align-items: stretch;
  min-width: 120px;
  border-radius: 6px;
  background: var(--nb-c-surface);
  border: 1.5px solid var(--nb-c-border);
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.12s,
    box-shadow 0.12s;

  &:hover {
    border-color: var(--nb-c-text-muted);
  }

  &--selected {
    border-color: var(--nb-card-color);
    box-shadow: 0 0 0 1.5px var(--nb-card-color);
  }

  &--disabled {
    opacity: 0.5;
  }
}

.nb-blueprint-card__indicator {
  width: 4px;
  flex-shrink: 0;
  border-radius: 6px 0 0 6px;
  background: var(--nb-card-color);
}

.nb-blueprint-card__body {
  flex: 1;
  padding: 6px 8px;
  min-width: 0;
}

.nb-blueprint-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nb-blueprint-card__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--nb-c-text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nb-blueprint-card__category {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--nb-c-text-subtle);
  margin-top: 1px;
}

.nb-blueprint-card__content {
  margin-top: 4px;
}

.nb-blueprint-card__toggle {
  display: flex;
  align-items: center;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.nb-blueprint-card__toggle-track {
  width: 24px;
  height: 14px;
  border-radius: 7px;
  background: var(--nb-c-component-inactive);
  position: relative;
  transition: background 0.15s;

  &::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: 2px;
    transition: transform 0.15s;
  }

  input:checked + & {
    background: var(--nb-card-color);

    &::after {
      transform: translateX(10px);
    }
  }
}

.nb-blueprint-card__remove {
  border: none;
  background: transparent;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;

  &:hover {
    color: var(--nb-c-danger);
  }
}

// ── Ports ─────────────────────────────────────────────────────────────

.nb-blueprint-card__ports {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;

  &--left {
    padding-left: 0;
    margin-left: -5px;
  }
  &--right {
    padding-right: 0;
    margin-right: -5px;
  }
}

.nb-blueprint-card__port {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--nb-c-component-plain);
  border: 1.5px solid var(--nb-c-border);
  cursor: crosshair;
  transition:
    background 0.1s,
    transform 0.1s;

  &:hover {
    background: var(--nb-card-color);
    transform: scale(1.4);
  }
}
</style>
