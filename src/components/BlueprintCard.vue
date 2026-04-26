<template>
  <div
    class="nb-blueprint-card"
    :class="{
      'nb-blueprint-card--selected': selected,
      'nb-blueprint-card--disabled': !enabled,
      'nb-blueprint-card--collapsed': collapsed,
    }"
    :style="{
      '--nb-card-color': color || 'var(--nb-c-primary)',
      '--nb-card-glow': cardGlow,
    }"
    @mousedown.stop="$emit('select', id)"
  >
    <!-- Input ports (left edge) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--left">
      <div
        v-for="port in inputPorts"
        :key="port.id"
        :data-port="`${id}:${port.id}`"
        class="nb-blueprint-card__port"
        :class="[
          `nb-blueprint-card__port--${pinShape(port)}`,
          port.required ? 'nb-blueprint-card__port--required' : '',
          isConnected(port.id) ? 'nb-blueprint-card__port--connected' : '',
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
      ></div>
    </div>

    <!-- Card content -->
    <div class="nb-blueprint-card__body">
      <!-- Header -->
      <div class="nb-blueprint-card__header">
        <!-- Collapse chevron -->
        <button
          class="nb-blueprint-card__collapse"
          :title="collapsed ? 'Expand' : 'Collapse'"
          @click.stop="$emit('toggle-collapse', id)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </button>

        <!-- Title group -->
        <div class="nb-blueprint-card__title-group">
          <span class="nb-blueprint-card__name">
            {{ title }}
            <!-- Status indicator -->
            <span
              v-if="status && status !== 'none'"
              class="nb-blueprint-card__status"
              :class="`nb-blueprint-card__status--${status}`"
            />
          </span>
          <span v-if="category" class="nb-blueprint-card__tag">{{
            displayCategory
          }}</span>
        </div>

        <!-- Enable toggle -->
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

        <!-- Remove button -->
        <button
          v-if="removable"
          class="nb-blueprint-card__remove"
          title="Remove"
          @click.stop="$emit('remove', id)"
        >
          &times;
        </button>
      </div>

      <!-- Body (hidden when collapsed) -->
      <template v-if="!collapsed">
        <span v-if="preview" class="nb-blueprint-card__preview">{{
          preview
        }}</span>

        <!-- Structured parameter rows -->
        <div
          v-if="parameters && parameters.length"
          class="nb-blueprint-card__params"
        >
          <div
            v-for="param in parameters"
            :key="param.label"
            class="nb-blueprint-card__row"
          >
            <span class="nb-blueprint-card__row-label">{{ param.label }}</span>
            <span class="nb-blueprint-card__row-value">
              {{ param.value }}
              <em v-if="param.unit" class="nb-blueprint-card__row-unit">{{
                param.unit
              }}</em>
            </span>
            <div
              v-if="param.bar !== undefined"
              class="nb-blueprint-card__row-bar"
              :style="{ '--bar-progress': `${param.bar}%` }"
            />
          </div>
        </div>

        <div v-if="$slots.default" class="nb-blueprint-card__content">
          <slot />
        </div>
      </template>
    </div>

    <!-- Output ports (right edge) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--right">
      <div
        v-for="port in outputPorts"
        :key="port.id"
        :data-port="`${id}:${port.id}`"
        class="nb-blueprint-card__port"
        :class="[
          `nb-blueprint-card__port--${pinShape(port)}`,
          isConnected(port.id) ? 'nb-blueprint-card__port--connected' : '',
        ]"
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
      />
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
  connectedPorts: () => [],
  x: 0,
  y: 0,
  removable: false,
  collapsed: false,
  status: 'none',
  preview: '',
  parameters: () => [],
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

// Category display: append " · off" when disabled
const displayCategory = computed(() => {
  const base = props.category || ''
  if (!props.enabled && base) return `${base} \u00b7 off`
  return base
})

// Glow color at 18% alpha (derived from the accent color)
const cardGlow = computed(() => {
  const c = props.color
  if (!c || c.startsWith('var(')) return 'rgba(139, 124, 255, 0.18)'
  // Parse hex to rgba
  if (c.startsWith('#') && (c.length === 7 || c.length === 4)) {
    const hex =
      c.length === 4 ? `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}` : c
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.18)`
  }
  return 'rgba(139, 124, 255, 0.18)'
})

const connectedSet = computed(() => new Set(props.connectedPorts))

function isConnected(portId: string): boolean {
  return connectedSet.value.has(portId)
}

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
  position: relative;
  display: flex;
  align-items: stretch;
  min-width: 160px;
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    var(--nb-c-layer-2, #161922),
    var(--nb-c-layer-1, #101218)
  );
  border: 1px solid var(--nb-c-border);
  cursor: grab;
  user-select: none;
  overflow: hidden;
  transition:
    transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 200ms,
    box-shadow 200ms;

  // Top accent bar
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--nb-card-color);
    opacity: 0.7;
    z-index: 1;
  }

  // Radial glow at top
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 80px;
    background: radial-gradient(
      ellipse at top,
      var(--nb-card-glow),
      transparent 70%
    );
    pointer-events: none;
    opacity: 0.6;
    z-index: 0;
  }

  &:hover {
    transform: translateY(-1px);
    border-color: var(--nb-c-text-muted, #2e3447);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.04) inset,
      0 8px 24px -12px rgba(0, 0, 0, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &--selected {
    border-color: var(--nb-card-color);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.04) inset,
      0 0 0 1px var(--nb-card-color),
      0 0 24px -4px var(--nb-card-glow);
  }

  &--disabled {
    opacity: 0.55;
  }

  &--collapsed {
    min-width: 100px;
    .nb-blueprint-card__body {
      padding: 8px 10px;
    }
  }
}

// ── Body ──────────────────────────────────────────────────────────────

.nb-blueprint-card__body {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 10px 10px 10px;
  min-width: 0;
}

// ── Header ────────────────────────────────────────────────────────────

.nb-blueprint-card__header {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  align-items: center;
  gap: 8px;
}

.nb-blueprint-card__collapse {
  border: none;
  background: transparent;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 2px;
  transition: transform 200ms;

  .nb-blueprint-card--collapsed & {
    transform: rotate(-90deg);
  }

  &:hover {
    color: var(--nb-c-text);
  }
}

.nb-blueprint-card__title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.nb-blueprint-card__name {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--nb-c-text);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nb-blueprint-card__tag {
  font-family: 'Geist Mono', 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--nb-card-color);
  text-transform: uppercase;
  line-height: 1;
  opacity: 0.85;
}

// ── Status indicator ──────────────────────────────────────────────────

.nb-blueprint-card__status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;

  &--valid {
    background: #22c55e;
    box-shadow: 0 0 6px #22c55e;
  }
  &--warning {
    background: #f59e0b;
    box-shadow: 0 0 6px #f59e0b;
  }
  &--error {
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;
  }
}

// ── Toggle (compact, accent-tinted) ───────────────────────────────────

.nb-blueprint-card__toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.nb-blueprint-card__toggle-track {
  width: 28px;
  height: 16px;
  border-radius: 999px;
  background: var(--nb-c-component-inactive, #1d2230);
  border: 1px solid var(--nb-c-border, #232838);
  position: relative;
  transition:
    background 200ms,
    border-color 200ms;

  &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--nb-c-text-muted, #5a6479);
    top: 1px;
    left: 1px;
    transition:
      transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
      background 200ms;
  }

  input:checked + & {
    background: var(--nb-card-glow, rgba(139, 124, 255, 0.22));
    border-color: color-mix(in srgb, var(--nb-card-color) 50%, transparent);

    &::after {
      transform: translateX(12px);
      background: var(--nb-card-color);
      box-shadow: 0 0 8px var(--nb-card-glow);
    }
  }
}

// ── Remove button ─────────────────────────────────────────────────────

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

// ── Preview text ──────────────────────────────────────────────────────

.nb-blueprint-card__preview {
  display: block;
  font-size: 10px;
  color: var(--nb-c-text-muted);
  margin-top: 4px;
  font-family: 'Geist Mono', 'Fira Code', monospace;
}

// ── Parameter rows ────────────────────────────────────────────────────

.nb-blueprint-card__params {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.nb-blueprint-card__row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--nb-c-border);
  border-radius: 6px;
  font-size: 11.5px;
}

.nb-blueprint-card__row-label {
  font-family: 'Geist Mono', 'Fira Code', monospace;
  font-size: 10.5px;
  color: var(--nb-c-text-muted);
  letter-spacing: 0.02em;
}

.nb-blueprint-card__row-value {
  font-family: 'Geist Mono', 'Fira Code', monospace;
  font-size: 11.5px;
  color: var(--nb-c-text);
  text-align: right;
  font-variant-numeric: tabular-nums;
  grid-column: 3;
}

.nb-blueprint-card__row-unit {
  font-style: normal;
  color: var(--nb-c-text-muted);
  font-size: 10px;
  margin-left: 2px;
}

.nb-blueprint-card__row-bar {
  grid-column: 1 / -1;
  margin-top: 2px;
  height: 3px;
  border-radius: 999px;
  background: var(--nb-c-component-inactive, #1d2230);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: var(--bar-progress, 0%);
    background: var(--nb-card-color);
    border-radius: 999px;
    opacity: 0.7;
  }
}

// ── Custom slot content ───────────────────────────────────────────────

.nb-blueprint-card__content {
  margin-top: 6px;
}

// ── Ports ─────────────────────────────────────────────────────────────

.nb-blueprint-card__ports {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
  z-index: 2;

  &--left {
    margin-left: -6px;
    align-items: flex-start;
  }
  &--right {
    margin-right: -6px;
    align-items: flex-end;
  }
}

.nb-blueprint-card__port {
  display: flex;
  align-items: center;
  cursor: crosshair;
  position: relative;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    background: var(--nb-c-layer-1, #101218);
    border: 1.5px solid var(--nb-c-text-muted, #3a4257);
    transition:
      background 150ms,
      border-color 150ms,
      transform 150ms,
      box-shadow 150ms;
  }

  &--circle::before {
    border-radius: 50%;
  }
  &--diamond::before {
    border-radius: 2px;
    transform: rotate(45deg);
    width: 10px;
    height: 10px;
  }
  &--square::before {
    border-radius: 2px;
  }

  &--required::before {
    border-width: 2px;
  }

  // Connected state: filled with accent color + outer ring
  &--connected::before {
    border-color: var(--pin-color, var(--nb-card-color));
    background: var(--pin-color, var(--nb-card-color));
    box-shadow:
      0 0 0 3px var(--nb-c-layer-1, #101218),
      0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }

  &:hover::before {
    transform: scale(1.25);
    border-color: var(--pin-color, var(--nb-card-color));
    background: var(--pin-color, var(--nb-card-color));
    box-shadow: 0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }
  &--diamond:hover::before {
    transform: rotate(45deg) scale(1.25);
  }
}
</style>
