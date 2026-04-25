<template>
  <div
    class="nb-blueprint-card"
    :class="{
      'nb-blueprint-card--selected': selected,
      'nb-blueprint-card--disabled': !enabled,
      'nb-blueprint-card--collapsed': collapsed,
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
        :class="[
          `nb-blueprint-card__port--${pinShape(port)}`,
          port.required ? 'nb-blueprint-card__port--required' : '',
        ]"
        :style="{ '--pin-color': pinColor(port) }"
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
      >
        <span
          v-if="!collapsed"
          class="nb-blueprint-card__port-label nb-blueprint-card__port-label--input"
          >{{ port.label }}</span
        >
      </div>
    </div>

    <!-- Card body -->
    <div class="nb-blueprint-card__body">
      <div class="nb-blueprint-card__header">
        <!-- Collapse toggle -->
        <button
          class="nb-blueprint-card__collapse"
          :title="collapsed ? 'Expand' : 'Collapse'"
          @click.stop="$emit('toggle-collapse', id)"
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path
              :d="collapsed ? 'M2 1L6 4L2 7' : 'M1 2L4 6L7 2'"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Status indicator -->
        <span
          v-if="status && status !== 'none'"
          class="nb-blueprint-card__status"
          :class="`nb-blueprint-card__status--${status}`"
        />

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

      <template v-if="!collapsed">
        <span v-if="category" class="nb-blueprint-card__category">{{
          category
        }}</span>
        <span v-if="preview" class="nb-blueprint-card__preview">{{
          preview
        }}</span>
        <div v-if="$slots.default" class="nb-blueprint-card__content">
          <slot />
        </div>
      </template>
    </div>

    <!-- Output ports (right side) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--right">
      <div
        v-for="port in outputPorts"
        :key="port.id"
        :data-port="`${id}:${port.id}`"
        class="nb-blueprint-card__port"
        :class="[`nb-blueprint-card__port--${pinShape(port)}`]"
        :style="{ '--pin-color': pinColor(port) }"
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
      >
        <span
          v-if="!collapsed"
          class="nb-blueprint-card__port-label nb-blueprint-card__port-label--output"
          >{{ port.label }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  IBlueprintCardProps,
  IBlueprintPort,
  TBlueprintPinDataType,
} from './BlueprintCard.d'

const props = withDefaults(defineProps<IBlueprintCardProps>(), {
  color: undefined,
  enabled: true,
  selected: false,
  category: '',
  ports: () => [],
  x: 0,
  y: 0,
  removable: false,
  collapsed: false,
  status: 'none',
  preview: '',
})

defineEmits<{
  select: [id: string]
  toggle: [id: string, enabled: boolean]
  remove: [id: string]
  'toggle-collapse': [id: string]
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

// Pin visual style based on data type
const PIN_COLORS: Record<TBlueprintPinDataType, string> = {
  geometry: '#6366f1',
  celestial: '#f97316',
  lighting: '#f59e0b',
  effect: '#a855f7',
  surface: '#3b82f6',
  audio: '#22c55e',
  entity: '#ec4899',
  number: '#94a3b8',
  vector3: '#38bdf8',
  color: '#fb923c',
  asset: '#a78bfa',
  any: '#64748b',
}

const PIN_SHAPES: Record<
  TBlueprintPinDataType,
  'circle' | 'diamond' | 'square'
> = {
  geometry: 'circle',
  celestial: 'circle',
  lighting: 'circle',
  effect: 'circle',
  surface: 'circle',
  audio: 'circle',
  entity: 'circle',
  number: 'diamond',
  vector3: 'diamond',
  color: 'square',
  asset: 'square',
  any: 'circle',
}

function pinColor(port: IBlueprintPort): string {
  return PIN_COLORS[port.dataType ?? 'any'] ?? PIN_COLORS.any
}

function pinShape(port: IBlueprintPort): string {
  return PIN_SHAPES[port.dataType ?? 'any'] ?? 'circle'
}
</script>

<style scoped lang="scss">
.nb-blueprint-card {
  display: flex;
  align-items: stretch;
  min-width: 140px;
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
  &--collapsed {
    min-width: 100px;
    .nb-blueprint-card__body {
      padding: 4px 6px;
    }
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
  gap: 4px;
}

.nb-blueprint-card__collapse {
  border: none;
  background: transparent;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  padding: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 2px;

  &:hover {
    color: var(--nb-c-text);
    background: rgba(255, 255, 255, 0.06);
  }
}

.nb-blueprint-card__status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &--valid {
    background: #22c55e;
    box-shadow: 0 0 4px #22c55e;
  }
  &--warning {
    background: #f59e0b;
    box-shadow: 0 0 4px #f59e0b;
  }
  &--error {
    background: #ef4444;
    box-shadow: 0 0 4px #ef4444;
  }
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

.nb-blueprint-card__preview {
  display: block;
  font-size: 10px;
  color: var(--nb-c-text-muted);
  margin-top: 2px;
  font-family: 'Fira Code', monospace;
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
  opacity: 0;
  transition: opacity 0.1s;
  .nb-blueprint-card:hover & {
    opacity: 1;
  }
  &:hover {
    color: var(--nb-c-danger);
  }
}

// ── Ports ─────────────────────────────────────────────────────────────

.nb-blueprint-card__ports {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;

  &--left {
    padding-left: 0;
    margin-left: -5px;
    align-items: flex-start;
  }
  &--right {
    padding-right: 0;
    margin-right: -5px;
    align-items: flex-end;
  }
}

.nb-blueprint-card__port {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: crosshair;
  position: relative;

  // Pin shape (the dot/diamond/square)
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid var(--pin-color, var(--nb-c-border));
    transition:
      background 0.1s,
      transform 0.1s,
      box-shadow 0.1s;
  }

  &--circle::before {
    border-radius: 50%;
  }
  &--diamond::before {
    border-radius: 2px;
    transform: rotate(45deg);
    width: 8px;
    height: 8px;
  }
  &--square::before {
    border-radius: 2px;
  }

  &--required::before {
    border-width: 2px;
  }

  &:hover::before {
    background: var(--pin-color, var(--nb-card-color));
    box-shadow: 0 0 6px var(--pin-color, var(--nb-card-color));
    transform: scale(1.3);
  }
  &--diamond:hover::before {
    transform: rotate(45deg) scale(1.3);
  }
}

.nb-blueprint-card__port-label {
  font-size: 9px;
  color: var(--nb-c-text-subtle);
  white-space: nowrap;

  &--input {
    order: 1;
  } // label after pin on left side
  &--output {
    order: -1;
  } // label before pin on right side
}
</style>
