<template>
  <div
    class="nb-blueprint-card"
    :class="{
      'nb-blueprint-card--selected': selected,
      'nb-blueprint-card--disabled': !enabled,
      'nb-blueprint-card--collapsed': collapsed,
      'nb-blueprint-card--has-port-labels-left': hasLabelsOnSide.left,
      'nb-blueprint-card--has-port-labels-right': hasLabelsOnSide.right,
    }"
    :data-card-id="id"
    :style="{
      '--nb-card-color': color || 'var(--nb-c-primary)',
      '--nb-card-glow': cardGlow,
    }"
    @mousedown="$emit('select', id)"
  >
    <!-- Input ports (left edge, outside clipping). When the card is
         collapsed, the individual pins still render (so wires can
         locate their target via [data-port]) but they're visually
         flattened and a single "combined" pin overlays them — the
         user sees one connection point per side, the wire layer still
         has per-port positions to draw to. -->
    <div class="nb-blueprint-card__ports nb-blueprint-card__ports--left">
      <div
        v-if="collapsed && inputPins.length > 0"
        class="nb-blueprint-card__port-combined nb-blueprint-card__port-combined--left"
        :class="{
          'nb-blueprint-card__port-combined--connected': anyInputConnected,
          'nb-blueprint-card__port-combined--active': anyInputActive,
        }"
        :title="`${inputPins.length} input${inputPins.length === 1 ? '' : 's'}`"
      />
      <div
        v-for="pin in inputPins"
        :key="pin.key"
        :data-port="`${id}:${pin.portId}`"
        :data-port-data-type="pin.port.dataType ?? 'any'"
        class="nb-blueprint-card__port nb-blueprint-card__port--left"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          `nb-blueprint-card__port--size-${pinSize(pin.port)}`,
          pin.port.required ? 'nb-blueprint-card__port--required' : '',
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
          isActive(pin.portId) ? 'nb-blueprint-card__port--active' : '',
        ]"
        :style="{ '--pin-color': pinColor(pin.port) }"
        :title="pinTitle(pin)"
        @mousedown.stop="
          onPortDown({ nodeId: id, portId: pin.portId, type: 'input' })
        "
        @mouseup.stop="
          onPortUp({ nodeId: id, portId: pin.portId, type: 'input' })
        "
      >
        <span v-if="pin.showLabel" class="nb-blueprint-card__port-label">{{
          pinLabel(pin)
        }}</span>
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
            @mousedown.stop
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
            @mousedown.stop
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
            @mousedown.stop
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
        v-if="collapsed && outputPins.length > 0"
        class="nb-blueprint-card__port-combined nb-blueprint-card__port-combined--right"
        :class="{
          'nb-blueprint-card__port-combined--connected': anyOutputConnected,
          'nb-blueprint-card__port-combined--active': anyOutputActive,
        }"
        :title="`${outputPins.length} output${outputPins.length === 1 ? '' : 's'}`"
      />
      <div
        v-for="pin in outputPins"
        :key="pin.key"
        :data-port="`${id}:${pin.portId}`"
        :data-port-data-type="pin.port.dataType ?? 'any'"
        class="nb-blueprint-card__port nb-blueprint-card__port--right"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          `nb-blueprint-card__port--size-${pinSize(pin.port)}`,
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
          isActive(pin.portId) ? 'nb-blueprint-card__port--active' : '',
        ]"
        :style="{ '--pin-color': pinColor(pin.port) }"
        :title="pinTitle(pin)"
        @mousedown.stop="
          onPortDown({ nodeId: id, portId: pin.portId, type: 'output' })
        "
        @mouseup.stop="
          onPortUp({ nodeId: id, portId: pin.portId, type: 'output' })
        "
      >
        <span v-if="pin.showLabel" class="nb-blueprint-card__port-label">{{
          pinLabel(pin)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type {
  IBlueprintCardProps,
  IBlueprintPort,
  IBlueprintPortChannel,
  TBlueprintPinDataType,
  TBlueprintPortShape,
} from './BlueprintCard.types'
import { NB_BLUEPRINT_CONTEXT } from './Blueprint.context'

const props = withDefaults(defineProps<IBlueprintCardProps>(), {
  color: undefined,
  enabled: true,
  selected: false,
  category: '',
  ports: () => [],
  connectedPorts: () => [],
  activePorts: () => [],
  x: 0,
  y: 0,
  removable: false,
  collapsed: false,
  status: 'none',
  preview: '',
  parameters: () => [],
  showPortLabels: false,
})

const emit = defineEmits<{
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

// When this card is rendered inside an NbBlueprint, the blueprint provides
// port handlers we call directly. This replaces the manual @port-mousedown
// / @port-mouseup forwarding that consumers used to need. Cards used
// outside an NbBlueprint (e.g. in docs or standalone demos) still emit
// the events so callers can wire them up by hand.
const blueprintCtx = inject(NB_BLUEPRINT_CONTEXT, null)

function onPortDown(data: {
  nodeId: string
  portId: string
  type: 'input' | 'output'
}) {
  emit('port-mousedown', data)
  blueprintCtx?.onPortDown(data)
}

function onPortUp(data: {
  nodeId: string
  portId: string
  type: 'input' | 'output'
}) {
  emit('port-mouseup', data)
  blueprintCtx?.onPortUp(data)
}

// ── Rendered pin projection ───────────────────────────────────────────
//
// One IBlueprintPort produces:
//   - one pin if `channels` is absent, or
//   - N pins if `channels` is present, one per channel, addressable as
//     `${port.id}/${channel.id}`.
// Connections always reference a specific pin id (never a "bundle"); this
// keeps the wire model unambiguous and makes it visually clear where each
// line lands.

interface IRenderedPin {
  key: string
  port: IBlueprintPort
  /** The id used in `data-port` and emitted to consumers. */
  portId: string
  /** Present when this pin is one channel of a multi-channel port. */
  channel?: IBlueprintPortChannel
  /** Whether to render the inline label next to this pin. */
  showLabel: boolean
}

function resolveShowLabel(port: IBlueprintPort): boolean {
  if (port.showLabel !== undefined) return port.showLabel
  if (props.showPortLabels === 'both') return true
  if (props.showPortLabels === 'left') return port.type === 'input'
  if (props.showPortLabels === 'right') return port.type === 'output'
  return false
}

function projectPins(direction: 'input' | 'output'): IRenderedPin[] {
  const result: IRenderedPin[] = []
  for (const port of props.ports) {
    if (port.type !== direction) continue
    const showLabel = resolveShowLabel(port)
    if (port.channels && port.channels.length > 0) {
      for (const channel of port.channels) {
        result.push({
          key: `${port.id}/${channel.id}`,
          port,
          portId: `${port.id}/${channel.id}`,
          channel,
          showLabel,
        })
      }
    } else {
      result.push({
        key: port.id,
        port,
        portId: port.id,
        showLabel,
      })
    }
  }
  return result
}

const inputPins = computed((): IRenderedPin[] => projectPins('input'))
const outputPins = computed((): IRenderedPin[] => projectPins('output'))

const hasLabelsOnSide = computed(() => ({
  left: inputPins.value.some((p) => p.showLabel),
  right: outputPins.value.some((p) => p.showLabel),
}))

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
const activeSet = computed(() => new Set(props.activePorts))

function isConnected(portId: string): boolean {
  return connectedSet.value.has(portId)
}

function isActive(portId: string): boolean {
  return activeSet.value.has(portId)
}

// Used by the collapsed-card combined-pin overlay so it lights up
// when ANY of the underlying pins is connected / active.
const anyInputConnected = computed(() =>
  inputPins.value.some((p) => connectedSet.value.has(p.portId)),
)
const anyInputActive = computed(() =>
  inputPins.value.some((p) => activeSet.value.has(p.portId)),
)
const anyOutputConnected = computed(() =>
  outputPins.value.some((p) => connectedSet.value.has(p.portId)),
)
const anyOutputActive = computed(() =>
  outputPins.value.some((p) => activeSet.value.has(p.portId)),
)

function pinTitle(pin: IRenderedPin): string {
  if (pin.channel) return `${pin.port.label} . ${pin.channel.label}`
  return pin.port.label
}

function pinLabel(pin: IRenderedPin): string {
  return pin.channel ? pin.channel.label : pin.port.label
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

// Default shape per dataType. The card looks up this map when a port
// doesn't provide an explicit `shape` override. Audio / general-flow
// types get the canonical pill (signal connectors); MIDI and control
// types get diamonds (event / sideband connectors); typed-data types
// (colour, asset) get sharp squares.
const PIN_SHAPES: Record<TBlueprintPinDataType, TBlueprintPortShape> = {
  geometry: 'pill',
  celestial: 'pill',
  lighting: 'pill',
  effect: 'pill',
  surface: 'pill',
  audio: 'pill',
  'audio:mono': 'pill',
  'audio:stereo': 'pill',
  'audio:bus': 'pill',
  midi: 'diamond',
  'midi:rechannelized': 'diamond',
  control: 'diamond',
  entity: 'pill',
  number: 'diamond',
  vector3: 'diamond',
  color: 'square',
  asset: 'square',
  any: 'pill',
}

/** Resolved colour for a single pin. Per-port `color` override beats
 *  the `dataType`-derived default. */
function pinColor(port: IBlueprintPort): string {
  return port.color ?? PIN_COLORS[port.dataType ?? 'any'] ?? PIN_COLORS.any
}

/** Resolved shape for a single pin. Per-port `shape` override beats
 *  the `dataType`-derived default. */
function pinShape(port: IBlueprintPort): string {
  return port.shape ?? PIN_SHAPES[port.dataType ?? 'any'] ?? 'pill'
}

/** Resolved size for a single pin. Default `'md'`. */
function pinSize(port: IBlueprintPort): string {
  return port.size ?? 'md'
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
  // `-webkit-` prefix REQUIRED for WKWebView (Safari), which ignores the
  // unprefixed property — the card was silently still selectable in the app.
  user-select: none;
  -webkit-user-select: none;
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

    &::before {
      opacity: 0;
    }

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

  // When ports on a side have inline labels, the body needs extra padding
  // so the title / params / slot don't sit on top of the labels.
  &--has-port-labels-left .nb-blueprint-card__body {
    padding-left: 38px;
  }

  &--has-port-labels-right .nb-blueprint-card__body {
    padding-right: 38px;
  }
}

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
  // Top / bottom inset gives the pins a comfortable gutter against
  // the card chrome — without it, plugins with many pins (e.g.
  // Youlean Loudness Meter, surround processors) push pins right
  // up against the card's top/bottom edges and they read as part
  // of the border. 12 px clears the title strip's drop shadow on
  // top and the rounded corner on the bottom.
  top: 12px;
  bottom: 12px;
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
      box-shadow 150ms;
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

  // Active: signal is flowing. A pulsing glow draws the eye to the live signal
  // path. The glow is a SEPARATE layer carrying a STATIC box-shadow, pulsed via
  // opacity + scale (both compositor-only) so it never repaints per frame.
  // Animating box-shadow directly (the old `nb-port-pulse`) forced a full-layer
  // repaint every frame and pinned the whole back canvas at ~5fps — see
  // docs/BUGS.md "animated box-shadow on connected ports".
  &--active::after {
    content: '';
    position: absolute;
    top: 50%;
    margin-top: -7px;
    width: 6px;
    height: 14px;
    border-radius: 3px;
    box-shadow:
      0 0 16px var(--pin-color, var(--nb-card-color)),
      0 0 24px var(--pin-color, var(--nb-card-color));
    animation: nb-port-glow 1.4s ease-in-out infinite;
    will-change: opacity, transform;
    pointer-events: none;
  }
  &--left.nb-blueprint-card__port--active::after {
    left: 0;
  }
  &--right.nb-blueprint-card__port--active::after {
    right: 0;
  }

  &:hover::before {
    border-color: var(--pin-color, var(--nb-card-color));
    background: var(--pin-color, var(--nb-card-color));
    box-shadow: 0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }

  // Sub-pin (one channel of a multi-channel port): slightly shorter pill so
  // a row of channel pins reads as a stack rather than four full-height pins.
  &--channel::before {
    height: 10px;
  }

  // ── Shape variants ─────────────────────────────────────────────
  // The default rendering above is a 6x14 rounded pill. The variants
  // below override the ::before geometry so a port can look like a
  // diamond, square, or small circle without changing its position
  // in the layout. Wires still anchor to the same pin centre.

  // Diamond: rotated square. ~10x10 visual footprint. Used for MIDI
  // / control / event-style ports where the user expects "discrete
  // signal" rather than "continuous flow".
  &--diamond::before {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    transform: rotate(45deg);
    // The border-radius shaving on left/right halves above doesn't
    // make sense for a rotated square; reset both edges.
    border: 1.5px solid var(--nb-c-text-muted, #3a4257);
  }
  &--left.nb-blueprint-card__port--diamond::before {
    margin-left: -2px;
  }
  &--right.nb-blueprint-card__port--diamond::before {
    margin-right: -2px;
  }

  // Square: sharp 10x10. For typed-data ports (colour, asset).
  &--square::before {
    width: 10px;
    height: 10px;
    border-radius: 0;
    border: 1.5px solid var(--nb-c-text-muted, #3a4257);
  }
  &--left.nb-blueprint-card__port--square::before {
    margin-left: -2px;
  }
  &--right.nb-blueprint-card__port--square::before {
    margin-right: -2px;
  }

  // Circle: small dot. For boolean / single-bit ports.
  &--circle::before {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--nb-c-text-muted, #3a4257);
  }
  &--left.nb-blueprint-card__port--circle::before {
    margin-left: -1px;
  }
  &--right.nb-blueprint-card__port--circle::before {
    margin-right: -1px;
  }

  // ── Size variants ──────────────────────────────────────────────
  // sm / md (default) / lg scale the pill / diamond / square / circle
  // uniformly. Channels (sub-pins of a multi-channel port) keep their
  // 10px height regardless of size; the size override applies to the
  // root pin only.
  &--size-sm::before {
    transform: scale(0.75);
  }
  &--size-lg::before {
    transform: scale(1.25);
  }
  // Diamond's existing rotate(45deg) needs to compose with size scale.
  &--diamond.nb-blueprint-card__port--size-sm::before {
    transform: scale(0.75) rotate(45deg);
  }
  &--diamond.nb-blueprint-card__port--size-lg::before {
    transform: scale(1.25) rotate(45deg);
  }
}

// Collapsed mode: the per-port pins still exist in DOM (so the wire
// layer can resolve their position via [data-port]) but their boxes
// flatten to zero height and the visible pip goes invisible. With
// flex `gap: 0`, every individual pin shares the same Y, so any
// wire targeting the card visually converges to one point. The
// `__port-combined` overlay below renders the single pin the user
// sees.
.nb-blueprint-card--collapsed {
  .nb-blueprint-card__ports {
    gap: 0;
  }
  .nb-blueprint-card__port {
    height: 0;
    overflow: visible;
    &::before {
      opacity: 0;
    }
  }
}

.nb-blueprint-card__port-combined {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 16px;
  background: var(--nb-c-layer-1, #101218);
  border: 1.5px solid var(--nb-c-text-muted, #3a4257);
  pointer-events: none;
  z-index: 5;
  transition:
    background 150ms,
    border-color 150ms,
    box-shadow 150ms;

  &--left {
    left: -1px;
    border-radius: 0 8px 8px 0;
    border-left: none;
  }
  &--right {
    right: -1px;
    border-radius: 8px 0 0 8px;
    border-right: none;
  }
  &--connected {
    border-color: var(--nb-card-color);
    background: var(--nb-card-color);
    box-shadow: 0 0 8px var(--nb-card-glow, rgba(139, 124, 255, 0.18));
  }
  // Compositor-only glow layer (see the per-port note above): static shadow,
  // pulsed by opacity + scale, no per-frame box-shadow repaint.
  &--active::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      0 0 16px var(--pin-color, var(--nb-card-color)),
      0 0 24px var(--pin-color, var(--nb-card-color));
    animation: nb-port-glow 1.4s ease-in-out infinite;
    will-change: opacity, transform;
    pointer-events: none;
  }
}

// Compositor-accelerated glow pulse: only `opacity` and `transform` change, so
// the pre-rendered shadow layer is composited (not repainted) each frame. This
// replaced `nb-port-pulse`, which animated `box-shadow` and repainted the layer
// every frame — the dominant cause of the back canvas running at ~5fps.
// scale peaks at 1 (native raster, crisp); the 0.72 trough + 0.35 opacity
// reproduce the old glow's swell-in / recede look without the paint cost.
@keyframes nb-port-glow {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.72);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

// ── Inline port label (next to the pin, inside the card body) ────────

.nb-blueprint-card__port-label {
  font-family: 'Geist Mono', 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 1;
  color: var(--nb-c-text-muted);
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: 0.02em;

  // Left ports: label sits to the right of the pin, inside the card body.
  .nb-blueprint-card__port--left & {
    margin-left: 10px;
  }

  // Right ports: label sits to the left of the pin (the .port has its pin
  // as ::before on its right edge, so we visually order via flex-direction).
  .nb-blueprint-card__port--right & {
    margin-right: 10px;
    order: -1;
  }
}
</style>
