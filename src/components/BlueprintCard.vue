<template>
  <div
    class="nb-blueprint-card"
    :class="{
      'nb-blueprint-card--selected': selected,
      'nb-blueprint-card--disabled': !enabled,
      'nb-blueprint-card--collapsed': collapsed,
    }"
    :data-card-id="id"
    :style="{
      '--nb-card-color': color || 'var(--nb-c-primary)',
      '--nb-card-glow': cardGlow,
    }"
    @mousedown="$emit('select', id)"
  >
    <!-- Input ports (left edge, outside clipping) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--left">
      <div
        v-for="pin in inputPins"
        :key="pin.key"
        :data-port="`${id}:${pin.portId}`"
        :data-channel-count="pin.channelCount"
        class="nb-blueprint-card__port nb-blueprint-card__port--left"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          pin.port.required ? 'nb-blueprint-card__port--required' : '',
          pin.channelCount ? 'nb-blueprint-card__port--bundle' : '',
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
        ]"
        :style="{ '--pin-color': pinColor(pin.port) }"
        :title="pinTitle(pin)"
        @mousedown.stop="
          $emit('port-mousedown', {
            nodeId: id,
            portId: pin.portId,
            type: 'input',
          })
        "
        @mouseup.stop="
          $emit('port-mouseup', {
            nodeId: id,
            portId: pin.portId,
            type: 'input',
          })
        "
      >
        <button
          v-if="pin.canToggleExpand"
          class="nb-blueprint-card__port-expand"
          :class="{
            'nb-blueprint-card__port-expand--open': isExpanded(pin.port.id),
          }"
          :title="
            isExpanded(pin.port.id) ? 'Collapse channels' : 'Expand channels'
          "
          @mousedown.stop
          @click.stop="toggleExpand(pin.port.id)"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline
              points="3 2 6 4.5 3 7"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Inner wrapper (clips accent bar and glow to border-radius) -->
    <div class="nb-blueprint-card__inner">
      <div class="nb-blueprint-card__body">
        <!-- Header -->
        <div class="nb-blueprint-card__header">
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

          <div class="nb-blueprint-card__title-group">
            <span class="nb-blueprint-card__name">
              {{ title }}
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
          <span v-if="preview" class="nb-blueprint-card__preview">{{
            preview
          }}</span>

          <div
            v-if="parameters && parameters.length"
            class="nb-blueprint-card__params"
          >
            <div
              v-for="param in parameters"
              :key="param.label"
              class="nb-blueprint-card__row"
            >
              <span class="nb-blueprint-card__row-label">{{
                param.label
              }}</span>
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
    </div>

    <!-- Output ports (right edge, outside clipping) -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--right">
      <div
        v-for="pin in outputPins"
        :key="pin.key"
        :data-port="`${id}:${pin.portId}`"
        :data-channel-count="pin.channelCount"
        class="nb-blueprint-card__port nb-blueprint-card__port--right"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          pin.channelCount ? 'nb-blueprint-card__port--bundle' : '',
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
        ]"
        :style="{ '--pin-color': pinColor(pin.port) }"
        :title="pinTitle(pin)"
        @mousedown.stop="
          $emit('port-mousedown', {
            nodeId: id,
            portId: pin.portId,
            type: 'output',
          })
        "
        @mouseup.stop="
          $emit('port-mouseup', {
            nodeId: id,
            portId: pin.portId,
            type: 'output',
          })
        "
      >
        <button
          v-if="pin.canToggleExpand"
          class="nb-blueprint-card__port-expand"
          :class="{
            'nb-blueprint-card__port-expand--open': isExpanded(pin.port.id),
          }"
          :title="
            isExpanded(pin.port.id) ? 'Collapse channels' : 'Expand channels'
          "
          @mousedown.stop
          @click.stop="toggleExpand(pin.port.id)"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline
              points="6 2 3 4.5 6 7"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  IBlueprintCardProps,
  IBlueprintPort,
  IBlueprintPortChannel,
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

// ── Bundle expand state (per-port, internal) ──────────────────────────
//
// Bundle ports start collapsed unless `port.defaultExpanded` is true. The
// state lives in the card so consumers don't need to track UI state, but
// it stays in sync if `defaultExpanded` flips on the source data.

const expandedPortIds = ref<Set<string>>(
  new Set(props.ports.filter((p) => p.defaultExpanded).map((p) => p.id)),
)

watch(
  () =>
    props.ports.map((p) => `${p.id}:${p.defaultExpanded ? 1 : 0}`).join('|'),
  () => {
    const next = new Set(expandedPortIds.value)
    for (const p of props.ports) {
      if (!p.channels) {
        next.delete(p.id)
      } else if (p.defaultExpanded && !next.has(p.id)) {
        next.add(p.id)
      }
    }
    expandedPortIds.value = next
  },
)

function isExpanded(portId: string): boolean {
  return expandedPortIds.value.has(portId)
}

function toggleExpand(portId: string) {
  const next = new Set(expandedPortIds.value)
  if (next.has(portId)) next.delete(portId)
  else next.add(portId)
  expandedPortIds.value = next
}

// ── Rendered pin projection ───────────────────────────────────────────
//
// A "rendered pin" is one DOM-level pin element. A regular port produces
// one pin. A bundle port produces either one bundle pin (collapsed) or
// N sub-pins (expanded), with port ids of the form `${port.id}/${channel.id}`.

interface IRenderedPin {
  key: string
  port: IBlueprintPort
  /** The id used in `data-port` and emitted to consumers. */
  portId: string
  /** Present on collapsed bundle pins (drives the channel-count badge). */
  channelCount?: number
  /** Present on sub-pins of an expanded bundle. */
  channel?: IBlueprintPortChannel
  /** Whether this pin owns the expand/collapse toggle. */
  canToggleExpand: boolean
}

function projectPins(direction: 'input' | 'output'): IRenderedPin[] {
  const result: IRenderedPin[] = []
  for (const port of props.ports) {
    if (port.type !== direction) continue

    if (port.channels && port.channels.length > 0 && isExpanded(port.id)) {
      port.channels.forEach((channel, i) => {
        result.push({
          key: `${port.id}/${channel.id}`,
          port,
          portId: `${port.id}/${channel.id}`,
          channel,
          canToggleExpand: i === 0,
        })
      })
    } else if (port.channels && port.channels.length > 0) {
      result.push({
        key: port.id,
        port,
        portId: port.id,
        channelCount: port.channels.length,
        canToggleExpand: true,
      })
    } else {
      result.push({
        key: port.id,
        port,
        portId: port.id,
        canToggleExpand: false,
      })
    }
  }
  return result
}

const inputPins = computed((): IRenderedPin[] => projectPins('input'))
const outputPins = computed((): IRenderedPin[] => projectPins('output'))

// Category display: append " · off" when disabled
const displayCategory = computed(() => {
  const base = props.category || ''
  if (!props.enabled && base) return `${base} · off`
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
  if (connectedSet.value.has(portId)) return true
  // A bundle (collapsed) pin should look connected if any of its sub-channels
  // are connected; a sub-pin should look connected if the bundle id is.
  const slash = portId.indexOf('/')
  if (slash > 0) {
    return connectedSet.value.has(portId.slice(0, slash))
  }
  for (const id of connectedSet.value) {
    const i = id.indexOf('/')
    if (i > 0 && id.slice(0, i) === portId) return true
  }
  return false
}

function pinTitle(pin: IRenderedPin): string {
  if (pin.channel) return `${pin.port.label} . ${pin.channel.label}`
  if (pin.channelCount) return `${pin.port.label} (${pin.channelCount} ch)`
  return pin.port.label
}

// Pin visual style based on data type
const PIN_COLORS: Record<TBlueprintPinDataType, string> = {
  geometry: '#6366f1',
  celestial: '#f97316',
  lighting: '#f59e0b',
  effect: '#a855f7',
  surface: '#3b82f6',
  audio: '#22c55e',
  'audio:mono': '#22c55e',
  'audio:stereo': '#10b981',
  'audio:bus': '#059669',
  midi: '#a855f7',
  'midi:rechannelized': '#9333ea',
  control: '#94a3b8',
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
  'audio:mono': 'circle',
  'audio:stereo': 'circle',
  'audio:bus': 'circle',
  midi: 'diamond',
  'midi:rechannelized': 'diamond',
  control: 'diamond',
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
  min-width: 160px;
  border-radius: 10px;
  background:
    linear-gradient(
      to bottom,
      var(--nb-card-color) 0,
      var(--nb-card-color) 3px,
      transparent 3px
    ),
    linear-gradient(
      180deg,
      var(--nb-c-layer-2, #161922),
      var(--nb-c-layer-1, #101218)
    );
  border: 1px solid var(--nb-c-border);
  cursor: grab;
  user-select: none;
  transition:
    transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 200ms,
    box-shadow 200ms;

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
    box-shadow: 0 0 12px -2px var(--nb-card-glow);

    // Hide top accent bar when selected (the full border replaces it)
    &::before {
      opacity: 0;
    }

    // Keep accent border color even when hovered
    &:hover {
      border-color: var(--nb-card-color);
    }
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

// Inner wrapper no longer needed for clipping (card itself clips now)
.nb-blueprint-card__inner {
  position: relative;
  min-width: 0;
}

// ── Body ──────────────────────────────────────────────────────────────

.nb-blueprint-card__body {
  position: relative;
  z-index: 1;
  padding: 10px;
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

// ── Ports (semicircles inside the card, flush with card border) ───────

.nb-blueprint-card__ports {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  z-index: 4;

  &--left {
    left: -1px;
  }
  &--right {
    right: -1px;
  }
}

.nb-blueprint-card__port {
  position: relative;
  display: flex;
  align-items: center;
  cursor: crosshair;

  &::before {
    content: '';
    width: 6px;
    height: 14px;
    flex-shrink: 0;
    background: var(--nb-c-layer-1, #101218);
    border: 1.5px solid var(--nb-c-text-muted, #3a4257);
    transition:
      background 150ms,
      border-color 150ms,
      box-shadow 150ms,
      height 150ms;
  }

  // Left port: flat on left (flush with card border), rounded on right (inside card)
  &--left::before {
    border-radius: 0 7px 7px 0;
    border-left: none;
  }

  // Right port: flat on right (flush with card border), rounded on left (inside card)
  &--right::before {
    border-radius: 7px 0 0 7px;
    border-right: none;
  }

  &--required::before {
    border-width: 2px;
  }

  // Connected state: filled with accent color
  &--connected::before {
    border-color: var(--pin-color, var(--nb-card-color));
    background: var(--pin-color, var(--nb-card-color));
    box-shadow: 0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }

  &:hover::before {
    border-color: var(--pin-color, var(--nb-card-color));
    background: var(--pin-color, var(--nb-card-color));
    box-shadow: 0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }

  // ── Bundle pin (collapsed): taller, with channel-count badge ──────
  &--bundle::before {
    height: 22px;
  }

  &--bundle::after {
    content: attr(data-channel-count);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'Geist Mono', 'Fira Code', monospace;
    font-size: 9px;
    font-weight: 600;
    line-height: 1;
    color: var(--pin-color, var(--nb-c-text-muted));
    pointer-events: none;
  }

  &--bundle.nb-blueprint-card__port--left::after {
    left: 9px;
  }

  &--bundle.nb-blueprint-card__port--right::after {
    right: 9px;
  }

  &--bundle.nb-blueprint-card__port--connected::after {
    color: var(--nb-c-layer-1, #101218);
  }

  // ── Sub-pin (expanded channel): shorter pill ──────────────────────
  &--channel::before {
    height: 10px;
  }
}

// ── Expand/collapse toggle for bundle ports ──────────────────────────

.nb-blueprint-card__port-expand {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: none;
  background: transparent;
  color: var(--nb-c-text-muted, #5a6479);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  opacity: 0;
  transition:
    opacity 150ms,
    color 150ms,
    transform 150ms;

  .nb-blueprint-card:hover & {
    opacity: 0.7;
  }

  &:hover {
    opacity: 1;
    color: var(--pin-color, var(--nb-card-color));
  }

  // Position: just inside the card, opposite the card border
  .nb-blueprint-card__port--left & {
    left: 14px;
  }

  .nb-blueprint-card__port--right & {
    right: 14px;
    transform: translateY(-50%) scaleX(-1);
  }

  &--open {
    opacity: 0.85;
    transform: translateY(-50%) rotate(90deg);

    .nb-blueprint-card__port--right & {
      transform: translateY(-50%) rotate(-90deg);
    }
  }
}
</style>
