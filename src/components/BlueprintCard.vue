.nb-blueprint-card__port-label { // A child of the port button, deliberately: a
sibling would need a wrapper, // and a wrapper is the third element per port
this change removed. It is // positioned outside the button's own box, and
getBoundingClientRect reports // only that box, so the label cannot drag the
wire endpoint with it, which // is the failure this component had before the pin
was isolated. position: absolute; top: 50%; transform: translateY(-50%);
font-size: 12px; line-height: 16px; color: var(--nb-c-text-subtle); white-space:
nowrap; pointer-events: none; font-variant-numeric: tabular-nums;
.nb-blueprint-card__port--left & { left: 100%; margin-left: 2px; }
.nb-blueprint-card__port--right & { right: 100%; margin-right: 2px; // Fixed
width, right-aligned, so a two-digit channel number cannot push // its pin out
of line with the one-digit ones. min-width: 1.6em; text-align: right; } }

<template>
  <div
    class="nb-blueprint-card"
    :class="[
      `nb-blueprint-card--density-${resolvedDensity}`,
      {
        'nb-blueprint-card--selected': selected,
        'nb-blueprint-card--disabled': !enabled,
        'nb-blueprint-card--collapsed': collapsed,
        'nb-blueprint-card--has-category': !!category,
        'nb-blueprint-card--has-port-labels-left': hasLabelsOnSide.left,
        'nb-blueprint-card--has-port-labels-right': hasLabelsOnSide.right,
        'nb-blueprint-card--dragging-wire': isWireDragging,
      },
    ]"
    :data-card-id="id"
    :style="{
      '--nb-card-color': color || 'var(--nb-c-primary)',
      '--nb-card-glow': cardGlow,
      '--nb-blueprint-port-count': portRows,
    }"
    tabindex="0"
    role="group"
    aria-roledescription="Graph node"
    :aria-label="cardAriaLabel"
    @mousedown="$emit('select', id)"
    @focus="$emit('select', id)"
    @keydown="onKeydown"
  >
    <!-- Input ports. ONE element per port.
         The button IS the pin: it carries [data-port], so it is what the wire
         layer measures, and it is what takes the click. It is drawn at the hit
         size (24x24) with the visible 8x16 pin painted by ::before, centred, so
         the element's centre and the pin's centre are the same point and the
         endpoint still lands on the mark the user aimed at.

         This used to be three elements (a slot, a button and a span), which put
         48 nodes in the tree for a 16-port card and made port lanes about a
         quarter of pan and zoom frame cost on a large session. Fill, level,
         stripes and the event pulse are all painted by two pseudo-elements
         instead of by nested boxes.

         When the card is collapsed the pins still render, so wires can locate
         their target via [data-port], but they stack onto one point and a
         combined pin overlays them. -->
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
      <button
        v-for="pin in inputPins"
        :key="pin.key"
        type="button"
        :data-port="`${id}:${pin.portId}`"
        :data-port-data-type="pin.port.dataType ?? 'any'"
        class="nb-blueprint-card__port nb-blueprint-card__port-hit nb-blueprint-card__port--left"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          `nb-blueprint-card__port--size-${pinSize(pin.port)}`,
          `nb-blueprint-card__port--${pinSignal(pin.port)}`,
          pin.port.required ? 'nb-blueprint-card__port--required' : '',
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
          isActive(pin.portId) ? 'nb-blueprint-card__port--active' : '',
          hasLevel(pin.portId) ? 'nb-blueprint-card__port--metered' : '',
          pingingPorts.has(pin.portId) ? 'nb-blueprint-card__port--ping' : '',
          targetClass(pin, 'input'),
        ]"
        :style="pinStyle(pin)"
        :title="pinTitle(pin)"
        :aria-label="pinAriaLabel(pin, 'input')"
        @mousedown.stop="
          onPortDown({
            nodeId: id,
            portId: pin.portId,
            type: 'input',
            dataType: pin.port.dataType,
          })
        "
        @mouseup.stop="
          onPortUp({
            nodeId: id,
            portId: pin.portId,
            type: 'input',
            dataType: pin.port.dataType,
          })
        "
        @keydown="
          onPortKeydown($event, {
            nodeId: id,
            portId: pin.portId,
            type: 'input',
            dataType: pin.port.dataType,
          })
        "
      >
        <span v-if="pin.showLabel" class="nb-blueprint-card__port-label">{{
          pinLabel(pin)
        }}</span>
      </button>
    </div>

    <!-- Inner wrapper (clips accent bar and glow to border-radius) -->
    <div class="nb-blueprint-card__inner">
      <div class="nb-blueprint-card__body">
        <!-- Header -->
        <div class="nb-blueprint-card__header">
          <button
            type="button"
            class="nb-blueprint-card__collapse"
            :title="collapsed ? 'Expand' : 'Collapse'"
            :aria-label="`${collapsed ? 'Expand' : 'Collapse'} ${title}`"
            :aria-expanded="!collapsed"
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
            </span>
            <span v-if="category" class="nb-blueprint-card__tag">{{
              displayCategory
            }}</span>
          </div>
          <svg
            v-if="status && status !== 'none'"
            class="nb-blueprint-card__status"
            :class="`nb-blueprint-card__status--${status}`"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            role="img"
            :aria-label="STATUS_LABELS[status]"
          >
            <title>{{ STATUS_LABELS[status] }}</title>
            <!-- Shape carries the meaning and colour reinforces it, so
                 the three states stay apart in greyscale, for a reader
                 with a colour vision deficiency, and at the canvas zoom
                 levels where a 6px dot was sub-pixel. -->
            <template v-if="status === 'valid'">
              <circle
                cx="8"
                cy="8"
                r="7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <polyline
                points="4.5 8.2 7 10.5 11.5 5.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </template>
            <template v-else-if="status === 'warning'">
              <path
                d="M8 1.5 15 14.5 1 14.5 Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <line
                x1="8"
                y1="6"
                x2="8"
                y2="10"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <circle cx="8" cy="12.2" r="0.9" fill="currentColor" />
            </template>
            <template v-else>
              <circle cx="8" cy="8" r="7" fill="currentColor" />
              <line
                x1="8"
                y1="4.5"
                x2="8"
                y2="9"
                stroke="var(--nb-c-surface)"
                stroke-width="1.8"
              />
              <circle cx="8" cy="11.4" r="1" fill="var(--nb-c-surface)" />
            </template>
          </svg>

          <label
            v-if="enabled !== undefined"
            class="nb-blueprint-card__toggle"
            @mousedown.stop
            @click.stop
          >
            <input
              type="checkbox"
              :checked="enabled"
              :aria-label="`Enable ${title}`"
              @change="
                $emit('toggle', id, ($event.target as HTMLInputElement).checked)
              "
            />
            <span class="nb-blueprint-card__toggle-track" />
          </label>

          <button
            v-if="removable"
            type="button"
            class="nb-blueprint-card__remove"
            title="Remove"
            :aria-label="`Remove ${title}`"
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

    <!-- Output ports. Mirror of the input column; see its comment for why a
         port is a single element. -->
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
      <button
        v-for="pin in outputPins"
        :key="pin.key"
        type="button"
        :data-port="`${id}:${pin.portId}`"
        :data-port-data-type="pin.port.dataType ?? 'any'"
        class="nb-blueprint-card__port nb-blueprint-card__port-hit nb-blueprint-card__port--right"
        :class="[
          `nb-blueprint-card__port--${pinShape(pin.port)}`,
          `nb-blueprint-card__port--size-${pinSize(pin.port)}`,
          `nb-blueprint-card__port--${pinSignal(pin.port)}`,
          pin.channel ? 'nb-blueprint-card__port--channel' : '',
          isConnected(pin.portId) ? 'nb-blueprint-card__port--connected' : '',
          isActive(pin.portId) ? 'nb-blueprint-card__port--active' : '',
          hasLevel(pin.portId) ? 'nb-blueprint-card__port--metered' : '',
          pingingPorts.has(pin.portId) ? 'nb-blueprint-card__port--ping' : '',
          targetClass(pin, 'output'),
        ]"
        :style="pinStyle(pin)"
        :title="pinTitle(pin)"
        :aria-label="pinAriaLabel(pin, 'output')"
        @mousedown.stop="
          onPortDown({
            nodeId: id,
            portId: pin.portId,
            type: 'output',
            dataType: pin.port.dataType,
          })
        "
        @mouseup.stop="
          onPortUp({
            nodeId: id,
            portId: pin.portId,
            type: 'output',
            dataType: pin.port.dataType,
          })
        "
        @keydown="
          onPortKeydown($event, {
            nodeId: id,
            portId: pin.portId,
            type: 'output',
            dataType: pin.port.dataType,
          })
        "
      >
        <span v-if="pin.showLabel" class="nb-blueprint-card__port-label">{{
          pinLabel(pin)
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onScopeDispose, ref, watch } from 'vue'
import type {
  IBlueprintCardProps,
  IBlueprintPort,
  IBlueprintPortChannel,
  TBlueprintCardStatus,
  TBlueprintDensity,
  TBlueprintPinDataType,
  TBlueprintPortShape,
  TBlueprintPortSignal,
} from './BlueprintCard.types'
import type { IBlueprintCardPortEvent } from './Blueprint.types'
import { NB_BLUEPRINT_CONTEXT } from './Blueprint.context'
import { useReducedMotion } from '../composables/useReducedMotion.composable'

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
  portLevels: () => ({}),
  density: undefined,
})

const emit = defineEmits<{
  select: [id: string]
  toggle: [id: string, enabled: boolean]
  remove: [id: string]
  'toggle-collapse': [id: string]
  'port-mousedown': [data: IBlueprintCardPortEvent]
  'port-mouseup': [data: IBlueprintCardPortEvent]
}>()

// When this card is rendered inside an NbBlueprint, the blueprint provides
// port handlers we call directly. This replaces the manual @port-mousedown
// / @port-mouseup forwarding that consumers used to need. Cards used
// outside an NbBlueprint (e.g. in docs or standalone demos) still emit
// the events so callers can wire them up by hand.
const blueprintCtx = inject(NB_BLUEPRINT_CONTEXT, null)

function onPortDown(data: IBlueprintCardPortEvent) {
  emit('port-mousedown', data)
  blueprintCtx?.onPortDown(data)
}

function onPortUp(data: IBlueprintCardPortEvent) {
  emit('port-mouseup', data)
  blueprintCtx?.onPortUp(data)
}

/**
 * Enter / Space on a focused pin. The first press arms a drag from that pin,
 * the second completes it on whatever pin is focused then, so the keyboard
 * walks the same two-step path the mouse does and goes through the same
 * handlers. Escape (see `onPortKeydown`) abandons it.
 */
function onPortActivate(data: IBlueprintCardPortEvent) {
  if (blueprintCtx?.dragOrigin?.value) onPortUp(data)
  else onPortDown(data)
}

function onPortKeydown(event: KeyboardEvent, data: IBlueprintCardPortEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    onPortActivate(data)
    return
  }
  if (event.key === 'Escape' && blueprintCtx?.dragOrigin?.value) {
    event.preventDefault()
    event.stopPropagation()
    blueprintCtx.cancelPortDrag?.()
  }
}

// ── Density ───────────────────────────────────────────────────────────
//
// The canvas sets it once and every card inherits; a card's own prop wins.
// Density touches chrome only, never port geometry: a pin that moved when a
// view setting changed would take every wire attached to it along.
const resolvedDensity = computed<TBlueprintDensity>(
  () => props.density ?? blueprintCtx?.density?.value ?? 'default',
)

// ── Drop-target affordance ────────────────────────────────────────────
//
// While a wire is in flight every pin answers, in advance, whether it could
// accept it. Previously the answer only arrived on release, as either a wire
// or silence, and the user had to infer the rule from the silence.
const isWireDragging = computed(() => !!blueprintCtx?.dragOrigin?.value)

/**
 * Whether a wire leaving `from` could land on a port of `toType` carrying
 * `toDataType`. Undeclared and `'any'` types connect to anything, an exact
 * match connects, and a family matches its own members so `audio:mono` can
 * reach `audio:stereo` while `midi` cannot reach either.
 */
function arePinTypesCompatible(
  a: TBlueprintPinDataType | undefined,
  b: TBlueprintPinDataType | undefined,
): boolean {
  if (!a || !b || a === 'any' || b === 'any') return true
  if (a === b) return true
  return a.split(':')[0] === b.split(':')[0]
}

function targetClass(
  pin: IRenderedPin,
  type: 'input' | 'output',
): string | false {
  const origin = blueprintCtx?.dragOrigin?.value
  if (!origin) return false
  // The pin the drag started from is neither a target nor a non-target.
  if (origin.nodeId === props.id && origin.portId === pin.portId) return false
  const ok =
    origin.nodeId !== props.id &&
    origin.type !== type &&
    arePinTypesCompatible(origin.dataType, pin.port.dataType)
  return ok
    ? 'nb-blueprint-card__port--target-valid'
    : 'nb-blueprint-card__port--target-invalid'
}

// ── Signal level and event pings ──────────────────────────────────────
//
// A continuous port fills from the bottom in proportion to its level, so a
// quiet port looks quiet. The expanding ring is kept for genuinely discrete
// moments, the transition into active, rather than looping forever on
// every live port, where twenty live ports meant twenty identical rings and
// no information.
const reducedMotion = useReducedMotion()
const pingingPorts = ref(new Set<string>())
const pingTimers = new Map<string, ReturnType<typeof setTimeout>>()
const PING_MS = 320

watch(
  () => props.activePorts,
  (next, previous) => {
    if (reducedMotion.value) return
    const before = new Set(previous ?? [])
    for (const portId of next ?? []) {
      if (before.has(portId)) continue
      pingingPorts.value = new Set(pingingPorts.value).add(portId)
      clearTimeout(pingTimers.get(portId))
      pingTimers.set(
        portId,
        setTimeout(() => {
          const set = new Set(pingingPorts.value)
          set.delete(portId)
          pingingPorts.value = set
          pingTimers.delete(portId)
        }, PING_MS),
      )
    }
  },
  { deep: true },
)

onScopeDispose(() => {
  for (const timer of pingTimers.values()) clearTimeout(timer)
  pingTimers.clear()
})

/** Whether a consumer reported a signal level for this pin. A metered pin
 *  draws as a meter; an active pin without a level draws as a solid fill. */
function hasLevel(portId: string): boolean {
  return typeof props.portLevels?.[portId] === 'number'
}

/** Inline custom properties for one pin: its colour, and its level as a
 *  percentage the fill height reads. */
function pinStyle(pin: IRenderedPin): Record<string, string> {
  const style: Record<string, string> = { '--pin-color': pinColor(pin.port) }
  const level = props.portLevels?.[pin.portId]
  if (typeof level === 'number') {
    const clamped = Math.max(0, Math.min(1, level))
    style['--pin-level'] = `${(clamped * 100).toFixed(1)}%`
  }
  return style
}

// ── Labels and keyboard ───────────────────────────────────────────────

const STATUS_LABELS: Record<Exclude<TBlueprintCardStatus, 'none'>, string> = {
  valid: 'Valid',
  warning: 'Warning',
  error: 'Error',
}

function pinAriaLabel(pin: IRenderedPin, type: 'input' | 'output'): string {
  const state = isConnected(pin.portId) ? 'connected' : 'not connected'
  return `${pinTitle(pin)}, ${type}, ${state}`
}

const cardAriaLabel = computed(() => {
  const parts = [props.title]
  if (props.category) parts.push(props.category)
  if (props.status && props.status !== 'none')
    parts.push(STATUS_LABELS[props.status])
  parts.push(props.enabled ? 'enabled' : 'disabled')
  return parts.join(', ')
})

/** Arrow keys move the card, Shift for a coarse step. Routed through the
 *  blueprint so a nudge reports itself with the same `move` event a mouse
 *  drag does, rather than becoming a second way for positions to change. */
const NUDGE_STEP = 1
const NUDGE_STEP_COARSE = 10
const NUDGE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

function onKeydown(event: KeyboardEvent) {
  const delta = NUDGE_KEYS[event.key]
  if (!delta || !blueprintCtx?.nudge) return
  event.preventDefault()
  const step = event.shiftKey ? NUDGE_STEP_COARSE : NUDGE_STEP
  blueprintCtx.nudge(props.id, delta[0] * step, delta[1] * step)
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

// How many pin rows the taller of the two columns needs. The card uses it to
// set a min-height, so a card with more ports than chrome grows to hold them
// rather than letting them hang off its bottom edge. Compressing the pitch
// instead is the one thing that must not happen: the pitch is also the hit
// target's height.
const portRows = computed(() =>
  Math.max(inputPins.value.length, outputPins.value.length, 1),
)

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

// Default shape per dataType, consulted when a port sets no explicit `shape`.
// Every entry is the pill, deliberately. A pin is a target the user aims a
// wire at, and a target whose shape changes with its type is a target they
// have to re-learn per port, and the rotated and shrunken silhouettes made
// MIDI and control pins fiddlier to hit for no information the stripe pattern
// does not carry better. `shape` is still honoured when a consumer sets it
// explicitly; it is simply never derived.
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
  midi: 'pill',
  'midi:rechannelized': 'pill',
  control: 'pill',
  entity: 'pill',
  number: 'pill',
  vector3: 'pill',
  color: 'pill',
  asset: 'pill',
  any: 'pill',
}

// Which data types carry a continuous quantity and which carry events. This
// is what the stripe pattern and the choice of activity treatment key off.
// A consumer's explicit `signal` beats it.
const PIN_SIGNALS: Record<TBlueprintPinDataType, TBlueprintPortSignal> = {
  geometry: 'analog',
  celestial: 'analog',
  lighting: 'analog',
  effect: 'analog',
  surface: 'analog',
  audio: 'analog',
  'audio:mono': 'analog',
  'audio:stereo': 'analog',
  'audio:bus': 'analog',
  midi: 'digital',
  'midi:rechannelized': 'digital',
  control: 'digital',
  entity: 'digital',
  number: 'analog',
  vector3: 'analog',
  color: 'digital',
  asset: 'digital',
  any: 'analog',
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

/** Whether a pin carries a continuous quantity or discrete events. Per-port
 *  `signal` override beats the `dataType`-derived default. */
function pinSignal(port: IBlueprintPort): TBlueprintPortSignal {
  return port.signal ?? PIN_SIGNALS[port.dataType ?? 'any'] ?? 'analog'
}
</script>

<style scoped lang="scss">
// ── Geometry ──────────────────────────────────────────────────────────
//
// Port geometry is declared once, here, as custom properties, because three
// separate things have to agree on it: the pin the user aims at, the hit
// target that takes the click, and the wire endpoint the canvas measures.
// When those three disagree the wire lands somewhere the pin is not, which is
// the failure mode this component spent a long time with.
//
//   --nb-blueprint-port-top    centre of the FIRST pin, from the card's top
//                              edge. Anchored to the top rather than centred
//                              in the card, so a pin never moves when the
//                              body grows a parameter row, a moving pin
//                              takes every wire attached to it along.
//   --nb-blueprint-port-pitch  centre-to-centre spacing, and also the height
//                              of each hit target, so adjacent targets tile
//                              exactly instead of overlapping.
.nb-blueprint-card {
  --nb-blueprint-port-width: 8px;
  --nb-blueprint-port-height: 16px;
  --nb-blueprint-port-pitch: 24px;
  // Centre of the first pin, measured from the card's top edge, so that it
  // lands on the middle of the header row. The header is the only part of the
  // card whose height is known from props, which is why this is a small set
  // of declared constants rather than something measured: a pin whose Y came
  // from layout would move whenever the body did.
  //   default, title only:      8 padding + 18 / 2
  //   default, title + category: 8 padding + (18 + 1 + 16) / 2
  //   compact (category hidden): 5 padding + 16 / 2
  --nb-blueprint-port-top: 17px;
  --nb-blueprint-port-hit: 24px;
  --nb-blueprint-rail-width: 3px;
  // Left padding for card chrome, clearing the identity rail. Bumped when
  // the card carries inline port labels on that side.
  --nb-blueprint-pad-left: calc(var(--nb-blueprint-rail-width) + 8px);
  --nb-blueprint-pad-right: 10px;

  position: relative;
  min-width: 176px;
  // Tall enough to contain its own port column: the last pin's bottom edge
  // plus a corner's worth of clearance. Cards with more ports than chrome
  // therefore grow, visibly, which is the honest outcome. The alternative,
  // squeezing the pitch to fit, would shrink the hit targets with it.
  min-height: calc(
    var(--nb-blueprint-port-top) + (var(--nb-blueprint-port-count, 1) - 1) *
      var(--nb-blueprint-port-pitch) + var(--nb-blueprint-port-height) / 2 + 8px
  );
  border-radius: var(--nb-radius-xs);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  cursor: grab;
  // `-webkit-` prefix REQUIRED for WKWebView (Safari), which ignores the
  // unprefixed property — the card was silently still selectable in the app.
  user-select: none;
  -webkit-user-select: none;
  // Hover and selection change colour only. The card used to lift on hover
  // with `transform: translateY(-1px)`, which moved its pins 1px off every
  // wire attached to it, because the wire layer resolves endpoints from pin
  // geometry and has no reason to re-measure on hover.
  transition:
    background 70ms linear,
    border-color 70ms linear,
    box-shadow 70ms linear;

  // Identity rail: the one place the node colour is painted as a block. It
  // takes the left edge rather than the top because a 3px top bar merges into
  // the border once the canvas is zoomed out, and because the ports vacated
  // this edge, they now sit outside the card.
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--nb-blueprint-rail-width);
    background: var(--nb-card-color);
    border-radius: var(--nb-radius-xs) 0 0 var(--nb-radius-xs);
    pointer-events: none;
    z-index: 2;
  }

  &:hover {
    background: var(--nb-c-surface-hover);
    border-color: var(--nb-c-layer-border-2);
  }

  &--selected {
    border-color: var(--nb-card-color);
    box-shadow: inset 0 0 0 1px var(--nb-card-color);
  }

  // A 2px ring, which is what the rest of the library uses and what the card
  // had no equivalent of: it was reachable by mouse only.
  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }

  &--disabled {
    opacity: 0.55;
  }

  &--collapsed {
    // Derived from the header's own chrome rather than guessed, because the
    // title is the only flexible column in that grid: any floor narrower than
    // the fixed parts collapses it to zero width and a collapsed card shows
    // just its chevron and toggle. The old 100px floor was narrower than the
    // chrome it had to hold, so that is precisely what happened, and hosts hit
    // it whenever they stopped passing their own min-width on collapse.
    //
    // chevron + status + toggle + the gaps between them + both paddings,
    // plus a readable amount of title.
    --nb-blueprint-collapsed-title: 72px;
    min-width: calc(
      var(--nb-blueprint-pad-left) + 16px + 8px +
        var(--nb-blueprint-collapsed-title) + 8px + 14px + 8px + 32px +
        var(--nb-blueprint-pad-right)
    );
    min-height: 0;
  }

  &--has-category {
    --nb-blueprint-port-top: 26px;
  }

  &--has-port-labels-left {
    --nb-blueprint-pad-left: 30px;
  }

  &--has-port-labels-right {
    --nb-blueprint-pad-right: 30px;
  }
}

.nb-blueprint-card__inner {
  position: relative;
  min-width: 0;
}

.nb-blueprint-card__body {
  position: relative;
  z-index: 1;
  min-width: 0;
}

// ── Header ────────────────────────────────────────────────────────────

.nb-blueprint-card__header {
  display: grid;
  grid-template-columns: 16px 1fr repeat(3, auto);
  align-items: center;
  gap: 8px;
  padding: 8px var(--nb-blueprint-pad-right) 8px var(--nb-blueprint-pad-left);
}

.nb-blueprint-card__collapse {
  border: none;
  background: transparent;
  color: var(--nb-c-text-subtle);
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: var(--nb-radius-xs);
  transition: transform 110ms cubic-bezier(0, 0, 0.38, 0.9);

  .nb-blueprint-card--collapsed & {
    transform: rotate(-90deg);
  }

  &:hover {
    color: var(--nb-c-text);
    background: var(--nb-c-node-row-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-blueprint-card__title-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

// Type comes off four steps of the productive scale rather than the
// 13.5 / 11.5 / 10.5 / 9.5px it used to mix. Half-pixel type rasterises
// differently at each zoom level, and a canvas is a zooming surface.
.nb-blueprint-card__name {
  font-size: 14px;
  line-height: 18px;
  font-weight: 600;
  color: var(--nb-c-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

// The category is identity, not state, so it reads in neutral text. It used
// to be painted in the node colour, which was also the top bar, also every
// wired pin, and also the toggle: one hue meaning four things at once.
.nb-blueprint-card__tag {
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.32px;
  color: var(--nb-c-text-subtle);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Status ────────────────────────────────────────────────────────────
//
// A 14px glyph sized to the header row, not a 6px dot floated inside the
// title. Shape distinguishes the three states, so they survive greyscale, a
// colour vision deficiency, and the zoom levels where a 6px dot was
// sub-pixel; colour reinforces. The tokens are held to 3:1 on every surface
// a card paints, see the note in _theme.scss.
.nb-blueprint-card__status {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: block;

  &--valid {
    color: var(--nb-c-status-valid);
  }
  &--warning {
    color: var(--nb-c-status-warning);
  }
  &--error {
    color: var(--nb-c-status-error);
  }
}

// ── Toggle ────────────────────────────────────────────────────────────
//
// "Enabled" means the same thing on every card in the graph, so it is drawn
// in the theme accent rather than the node's own colour. The pill survives
// here because this is one of the two places a pill means something: the
// thumb slides along the track.
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

  input:focus-visible + .nb-blueprint-card__toggle-track {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

.nb-blueprint-card__toggle-track {
  width: 32px;
  height: 16px;
  border-radius: var(--nb-radius-pill);
  background: var(--nb-c-field-bg);
  border: 1px solid var(--nb-c-field-border);
  position: relative;
  transition:
    background 70ms linear,
    border-color 70ms linear;

  &::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--nb-c-text-subtle);
    top: 2px;
    left: 2px;
    transition:
      transform 110ms cubic-bezier(0, 0, 0.38, 0.9),
      background 70ms linear;
  }

  input:checked + & {
    background: var(--nb-c-primary);
    border-color: var(--nb-c-primary);

    &::after {
      transform: translateX(16px);
      background: var(--nb-c-white);
    }
  }
}

// ── Remove ────────────────────────────────────────────────────────────
//
// Still hover-revealed for the mouse, but a keyboard focus brings it back:
// at `opacity: 0` unconditionally it did not exist for keyboard users.
.nb-blueprint-card__remove {
  border: none;
  background: transparent;
  color: var(--nb-c-text-subtle);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  border-radius: var(--nb-radius-xs);
  opacity: 0;
  transition: opacity 70ms linear;

  .nb-blueprint-card:hover &,
  .nb-blueprint-card:focus-within & {
    opacity: 1;
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }

  &:hover {
    color: var(--nb-c-danger);
  }
}

// ── Preview and parameters ────────────────────────────────────────────

.nb-blueprint-card__preview {
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: var(--nb-c-text-subtle);
  font-family: 'Geist Mono', 'Fira Code', monospace;
  padding: 0 var(--nb-blueprint-pad-right) 8px var(--nb-blueprint-pad-left);
}

.nb-blueprint-card__params {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px var(--nb-blueprint-pad-right) 8px var(--nb-blueprint-pad-left);
  border-top: 1px solid var(--nb-c-border);
}

// Rows sit one layer deeper instead of carrying their own border. A 1px card
// border and a 1px row border stacked to a 2px stripe once the canvas zoomed
// past 1, and the old fill was `rgba(255, 255, 255, 0.015)`, a lightening
// film that is simply invisible on the light ramp.
.nb-blueprint-card__row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--nb-c-node-row-bg);
  border-radius: var(--nb-radius-xs);
}

.nb-blueprint-card__row-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--nb-c-text-subtle);
}

.nb-blueprint-card__row-value {
  font-family: 'Geist Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 16px;
  color: var(--nb-c-text);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.nb-blueprint-card__row-unit {
  font-style: normal;
  color: var(--nb-c-text-subtle);
  margin-left: 2px;
}

.nb-blueprint-card__row-bar {
  grid-column: 1 / -1;
  margin-top: 4px;
  height: 2px;
  background: var(--nb-c-field-bg);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: var(--bar-progress, 0%);
    background: var(--nb-card-color);
  }
}

.nb-blueprint-card__content {
  padding: 0 var(--nb-blueprint-pad-right) 8px var(--nb-blueprint-pad-left);
}

// ── Ports ─────────────────────────────────────────────────────────────
//
// The column is anchored to the card's TOP, not centred in its height. The
// old `top: 12px; bottom: 12px; justify-content: center` made a pin's Y a
// function of how tall the card happened to be, so expanding a card or adding
// a parameter row moved every wire attached to it, and two cards were only
// joined by a horizontal wire when they happened to be the same height.
.nb-blueprint-card__ports {
  position: absolute;
  top: calc(var(--nb-blueprint-port-top) - var(--nb-blueprint-port-pitch) / 2);
  display: flex;
  flex-direction: column;
  // Explicit, so the column's own box never depends on what is inside it.
  // Sized from content it collapsed to zero width whenever the slots left the
  // flow (collapsed cards), which moved the combined pin a full column across.
  width: var(--nb-blueprint-port-hit);
  z-index: 4;

  // Offset so the PIN sits flush outside the card while the hit target stays
  // centred on it. Centring is what keeps the element's centre and the pin's
  // centre identical, which is what keeps the wire endpoint on the mark. The
  // cost is that the target reaches a few pixels back over the card's padding,
  // which is empty by construction.
  &--left {
    left: calc(
      -1 * (var(--nb-blueprint-port-hit) + var(--nb-blueprint-port-width)) / 2 -
        1px
    );
  }

  &--right {
    right: calc(
      -1 * (var(--nb-blueprint-port-hit) + var(--nb-blueprint-port-width)) / 2 -
        1px
    );
  }
}

// The port. One element, drawn at the hit size, with the visible pin painted
// by ::before at the centre. The element's centre and the pin's centre are the
// same point, so the wire endpoint still lands on the mark.
//
// `--pin-fill` and `--pin-stroke` are the seam the states write to, and
// `--pin-layers` carries anything painted on top of the fill (the level meter,
// the digital stripes). Doing it with custom properties rather than a rule per
// combination is what lets fill, texture and level compose without either a
// nested element or a combinatorial explosion of selectors.
.nb-blueprint-card__port {
  --pin-w: var(--nb-blueprint-port-width);
  --pin-h: var(--nb-blueprint-port-height);
  --pin-fill: var(--nb-c-port-bg);
  --pin-stroke: var(--nb-c-port-border);
  --pin-layers: none;

  position: relative;
  flex-shrink: 0;
  width: var(--nb-blueprint-port-hit);
  height: var(--nb-blueprint-port-pitch);
  padding: 0;
  border: 0;
  background: none;
  overflow: visible;
  cursor: crosshair;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--pin-w);
    height: var(--pin-h);
    margin: calc(var(--pin-h) / -2) 0 0 calc(var(--pin-w) / -2);
    box-sizing: border-box;
    background-color: var(--pin-fill);
    background-image: var(--pin-layers);
    border: 1.5px solid var(--pin-stroke);
    transition:
      background-color 150ms,
      border-color 150ms,
      opacity 150ms;
  }

  // Flat face against the card, rounded on the outer end.
  &--left::before {
    border-radius: var(--nb-radius-xs) 0 0 var(--nb-radius-xs);
    border-right: none;
  }

  &--right::before {
    border-radius: 0 var(--nb-radius-xs) var(--nb-radius-xs) 0;
    border-left: none;
  }

  &:focus-visible {
    outline: none;

    &::before {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: 2px;
    }
  }

  // ── Sizes ──────────────────────────────────────────────────────
  &--size-sm {
    --pin-w: 6px;
    --pin-h: 12px;
  }

  &--size-lg {
    --pin-w: 10px;
    --pin-h: 20px;
  }

  &--channel {
    --pin-h: 12px;
  }

  // ── Shapes ─────────────────────────────────────────────────────
  &--square::before,
  &--circle::before {
    border: 1.5px solid var(--pin-stroke);
  }

  &--square {
    --pin-w: 10px;
    --pin-h: 10px;

    &::before {
      border-radius: var(--nb-radius-none);
    }
  }

  &--circle {
    --pin-w: 8px;
    --pin-h: 8px;

    &::before {
      border-radius: 50%;
    }
  }

  &--square#{&}--size-sm {
    --pin-w: 8px;
    --pin-h: 8px;
  }

  &--square#{&}--size-lg {
    --pin-w: 13px;
    --pin-h: 13px;
  }

  &--circle#{&}--size-sm {
    --pin-w: 6px;
    --pin-h: 6px;
  }

  &--circle#{&}--size-lg {
    --pin-w: 10px;
    --pin-h: 10px;
  }

  // ── States ─────────────────────────────────────────────────────
  &--required::before {
    border-width: 2px;
  }

  // Wired, but not necessarily carrying anything. Filled, and no halo: a halo
  // means signal, and a wired-but-silent port has none.
  &--connected {
    --pin-fill: var(--pin-color, var(--nb-card-color));
    --pin-stroke: var(--pin-color, var(--nb-card-color));
  }

  &:hover {
    --pin-fill: var(--pin-color, var(--nb-card-color));
    --pin-stroke: var(--pin-color, var(--nb-card-color));
  }

  // ── Analog and digital ─────────────────────────────────────────
  // Texture, not silhouette. The stripe colour flips with the fill underneath:
  // outline colour on a hollow pin, surface colour on a filled one. One colour
  // cannot do both, because on a free pin surface-on-surface is invisible.
  &--digital {
    --pin-layers: repeating-linear-gradient(
      -45deg,
      transparent 0 2px,
      var(--nb-c-port-border) 2px 4px
    );
  }

  &--digital#{&}--connected,
  &--digital#{&}--active {
    --pin-layers: repeating-linear-gradient(
      -45deg,
      transparent 0 2px,
      var(--nb-c-port-bg) 2px 4px
    );
  }

  // Metered: the pin becomes a meter. The fill is a hard-stopped gradient
  // rather than a nested element, which is what removes the third box per
  // port. It does mean the level steps rather than tweens; consumers already
  // quantise these values, and a tween on a per-frame value is a repaint
  // nobody asked for.
  &--metered {
    --pin-fill: var(--nb-c-port-bg);
    --pin-stroke: var(--pin-color, var(--nb-card-color));
    --pin-layers: linear-gradient(
      to top,
      var(--pin-color, var(--nb-card-color)) var(--pin-level, 0%),
      transparent var(--pin-level, 0%)
    );
  }

  &--metered#{&}--digital {
    --pin-layers:
      repeating-linear-gradient(
        -45deg,
        transparent 0 2px,
        var(--nb-c-port-bg) 2px 4px
      ),
      linear-gradient(
        to top,
        var(--pin-color, var(--nb-card-color)) var(--pin-level, 0%),
        transparent var(--pin-level, 0%)
      );
  }

  // Live with no level: filled, plus a static halo. Must not paint over a
  // metered pin, or the meter is drawn in the colour that just covered it.
  &--active:not(#{&}--metered) {
    --pin-fill: var(--pin-color, var(--nb-card-color));
    --pin-stroke: var(--pin-color, var(--nb-card-color));
  }

  &--active::before {
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--pin-color, var(--nb-card-color)) 45%,
        transparent
      );
  }

  // One pulse per event, digital only, in the pin's own colour.
  &--digital#{&}--ping::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--pin-w) + 6px);
    height: calc(var(--pin-h) + 6px);
    margin: calc((var(--pin-h) + 6px) / -2) 0 0 calc((var(--pin-w) + 6px) / -2);
    border: 1.5px solid var(--pin-color, var(--nb-card-color));
    border-radius: var(--nb-radius-xs);
    animation: nb-port-ping 320ms cubic-bezier(0, 0, 0.38, 0.9) 1;
    pointer-events: none;
  }

  // ── Drop targets ───────────────────────────────────────────────
  &--target-valid::before {
    border-color: var(--nb-c-focus-ring);
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--nb-c-focus-ring) 30%, transparent);
  }

  &--target-invalid::before {
    opacity: 0.3;
  }
}

@keyframes nb-port-ping {
  from {
    transform: scale(0.7);
    opacity: 0.9;
  }
  to {
    transform: scale(2);
    opacity: 0;
  }
}

// ── Collapsed ─────────────────────────────────────────────────────────
//
// The ports stay in the DOM so the wire layer can resolve their position via
// [data-port], but they stack on one point: every pin then shares the combined
// pin's centre, so wires targeting the card converge on the connection point
// the user can actually see.
.nb-blueprint-card--collapsed {
  .nb-blueprint-card__port {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
  }

  .nb-blueprint-card__port-label {
    opacity: 0;
  }
}

.nb-blueprint-card__port-combined {
  position: absolute;
  // Relative to the ports column, which already carries the port-top offset.
  top: calc(
    var(--nb-blueprint-port-pitch) / 2 - var(--nb-blueprint-port-height) / 2
  );
  // The lane is now wider than the pin (it holds the hit target), so the
  // combined pin centres in it rather than sitting against an edge.
  left: 50%;
  margin-left: calc(var(--nb-blueprint-port-width) / -2);
  width: var(--nb-blueprint-port-width);
  height: var(--nb-blueprint-port-height);
  background: var(--nb-c-port-bg);
  border: 1.5px solid var(--nb-c-port-border);
  pointer-events: none;
  z-index: 5;
  transition:
    background 150ms,
    border-color 150ms;

  &--left {
    border-radius: var(--nb-radius-xs) 0 0 var(--nb-radius-xs);
    border-right: none;
  }

  &--right {
    border-radius: 0 var(--nb-radius-xs) var(--nb-radius-xs) 0;
    border-left: none;
  }

  &--connected,
  &--active {
    border-color: var(--nb-card-color);
    background: var(--nb-card-color);
  }
}

// ── Inline port labels ────────────────────────────────────────────────
//
// Drawn inside the card, as a sibling of the pin. They are deliberately not
// inside the pin's box: the wire layer measures that box, so a label sharing
// it moved every endpoint on the card by half a label's width.
.nb-blueprint-card__port-label {
  font-size: 12px;
  line-height: 16px;
  color: var(--nb-c-text-subtle);
  white-space: nowrap;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
  margin: 0 4px;

  .nb-blueprint-card__ports--right & {
    // Fixed width, right-aligned, so a two-digit channel number cannot push
    // its pin out of line with the one-digit ones.
    min-width: 1.6em;
    text-align: right;
  }
}

// ── Density ───────────────────────────────────────────────────────────
//
// Chrome only. Port geometry is untouched on purpose: a pin that moved when a
// view setting changed would drag every wire attached to it along.
.nb-blueprint-card--density-compact {
  min-width: 132px;

  .nb-blueprint-card__header {
    padding-top: 5px;
    padding-bottom: 5px;
  }

  .nb-blueprint-card__name {
    font-size: 12px;
    line-height: 16px;
  }

  .nb-blueprint-card__tag {
    display: none;
  }

  .nb-blueprint-card__params {
    padding-top: 5px;
    padding-bottom: 5px;
  }

  .nb-blueprint-card__row {
    padding: 2px 8px;
  }

  // The category line is hidden at this density, so the header is a single
  // 16px row whatever the card carries.
  &.nb-blueprint-card--has-category,
  & {
    --nb-blueprint-port-top: 13px;
  }
}

// ── Reduced motion ────────────────────────────────────────────────────
//
// The card schedules no ping when the preference is set (see the watcher in
// the script); this is the belt to that braces, and it also stills the
// collapse chevron and the toggle thumb.
@media (prefers-reduced-motion: reduce) {
  .nb-blueprint-card,
  .nb-blueprint-card__collapse,
  .nb-blueprint-card__toggle-track,
  .nb-blueprint-card__toggle-track::after,
  .nb-blueprint-card__port {
    transition: none;
  }

  .nb-blueprint-card__port--ping::after {
    display: none;
  }
}
</style>
