<template>
  <li
    ref="rootEl"
    class="nb-stepper__step"
    :class="[
      `nb-stepper__step--${status}`,
      { 'nb-stepper__step--clickable': isClickable },
    ]"
    :data-nb-step="componentInternalId"
    :data-status="status"
    :data-orientation="orientation"
    :aria-current="isCurrent ? 'step' : undefined"
  >
    <!-- The accessible name of a clickable step is its label and nothing
         else. Left to the button's own content it would be "Account Name and
         email Complete": the description and the visually hidden status word
         are both inside the click target. aria-labelledby pins the name to the
         label, aria-describedby keeps the other two available without
         welding them into it. The non-clickable <div> is left alone: it has no
         role, so its children are read in order, which is what we want. -->
    <component
      :is="isClickable ? 'button' : 'div'"
      :id="componentInternalId"
      class="nb-stepper__body"
      v-bind="
        isClickable
          ? {
              type: 'button',
              'data-nb-stepper-button': '',
              tabindex: index === tabbable ? 0 : -1,
              'aria-labelledby': labelId,
              'aria-describedby': describedBy,
            }
          : {}
      "
      @click="onSelect"
    >
      <span class="nb-stepper__marker" aria-hidden="true">
        <NbIcon v-if="markerIcon" :name="markerIcon" :size="markerIconSize" />
        <template v-else>{{ position }}</template>
      </span>

      <span class="nb-stepper__text">
        <span :id="labelId" class="nb-stepper__label">
          <slot name="label">{{ label }}</slot>
        </span>
        <!-- Wraps rather than truncates: a step that says "Optional" or
             "Two fields are still empty" is worth two lines. The step has a
             floor width instead, so the row scrolls before a label is
             squeezed into one word per line. -->
        <span
          v-if="description || $slots.description"
          :id="descriptionId"
          class="nb-stepper__description"
        >
          <slot name="description">{{ description }}</slot>
        </span>
        <!-- The status word, for screen readers only. Position ("2 of 5") is
             deliberately absent: the list already conveys it, and repeating it
             here would have every step announced twice over. -->
        <span :id="statusId" class="nb-stepper__status">{{ statusLabel }}</span>
      </span>
    </component>

    <!-- Drawn by the step it leaves, so a complete step colours the rule
         running to the next one. The last step's line is removed in CSS by
         :last-child rather than by a count: a step cannot know how many
         siblings it has until they have all mounted, and asking it to would
         mean the whole row rendered wrong for one tick. -->
    <span class="nb-stepper__line" aria-hidden="true" />
  </li>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, useSlots } from 'vue'
import { EStepStatus, IStepperStepProps } from './Stepper.d'
import { NB_STEPPER_CONTEXT, type TStepStatus } from './Stepper.context'
import { useStableId } from '@/composables/useStableId.composable'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IStepperStepProps>(), {
  id: undefined,
  label: '',
  description: undefined,
  complete: false,
  invalid: false,
  disabled: false,
})

const componentInternalId = useStableId(props)
const slots = useSlots()
const group = inject(NB_STEPPER_CONTEXT, null)
const rootEl = ref<HTMLElement | null>(null)

const disabled = computed(() => props.disabled)
// The element is handed over as a getter: at setup time the <li> does not
// exist yet, and the parent needs it later to sort the registry by document
// position rather than by the order these setups happened to run.
const unregister = group?.register({
  uid: componentInternalId,
  disabled,
  el: () => rootEl.value,
})
onUnmounted(() => unregister?.())

// Position in the DOM, not position in the registry. Everything below hangs
// off this number, so it is the one value that must never be a guess.
const index = computed(
  () => group?.order.value.indexOf(componentInternalId) ?? -1,
)
const isCurrent = computed(() => index.value === group?.current.value)

// One-based for the reader. A step rendered outside an NbStepper has no
// position to report, so it falls back to 1 rather than to 0.
const position = computed(() => (index.value < 0 ? 1 : index.value + 1))

// Order matters. Disabled is a property of the flow, not of progress, so it
// wins over everything. Invalid beats current because a step the user is
// standing on with an error has to look wrong, not look normal.
const status = computed<TStepStatus>(() => {
  if (props.disabled) return EStepStatus.Disabled
  if (props.invalid) return EStepStatus.Invalid
  if (isCurrent.value) return EStepStatus.Current
  if (props.complete) return EStepStatus.Complete
  if (index.value >= 0 && index.value < (group?.current.value ?? 0))
    return EStepStatus.Complete
  return EStepStatus.Incomplete
})

const statusLabel = computed(() => group?.labels.value[status.value] ?? '')

const labelId = computed(() => `${componentInternalId}-label`)
const descriptionId = computed(() => `${componentInternalId}-description`)
const statusId = computed(() => `${componentInternalId}-status`)

const hasDescription = computed(
  () => Boolean(props.description) || Boolean(slots.description),
)

// Order is what a screen reader reads after the name: what the step needs,
// then where it stands. Never an id for an element that is not rendered.
const describedBy = computed(() =>
  [hasDescription.value ? descriptionId.value : null, statusId.value]
    .filter(Boolean)
    .join(' '),
)

const tabbable = computed(() => group?.tabbable.value ?? -1)

const isClickable = computed(
  () => group?.clickable(index.value, props.disabled) ?? false,
)

const markerIcon = computed(() => {
  if (status.value === EStepStatus.Complete) return 'check'
  if (status.value === EStepStatus.Invalid) return 'warning'
  return null
})

const markerIconSize = computed(() => (group?.size.value === 'sm' ? 12 : 14))

// Orientation is stamped onto the <li> rather than read off an ancestor
// class. A scoped stylesheet cannot reach an ancestor it does not own:
// `:global(.nb-stepper--horizontal) .nb-stepper__step` compiles down to a
// bare `.nb-stepper--horizontal` rule, because Vue's scoped transform keeps
// only the argument of :global() and throws the rest of the selector away.
// That silently moved every orientation rule, including the connector's
// geometry, onto the consumer's wrapper. The attribute keeps the layout
// inside the component that draws it, and the value still comes from the
// stepper, so a step can never disagree with the list it is in.
const orientation = computed(() => group?.orientation.value ?? 'horizontal')

function onSelect() {
  group?.select(index.value, props.disabled)
}
</script>

<style scoped lang="scss">
.nb-stepper__step {
  position: relative;
  display: flex;
  min-inline-size: 0;
}

// The body is the whole step: marker, label, description, and the click
// target when the step is one. Reset hard, because half the time it is a
// <button> and half the time it is a <div>, and they must not differ.
.nb-stepper__body {
  display: flex;
  gap: var(--nb-stepper-gap);
  align-items: flex-start;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
}

.nb-stepper__marker {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  inline-size: var(--nb-stepper-marker);
  block-size: var(--nb-stepper-marker);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-sm);
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
  font-size: var(--nb-stepper-marker-size);
  font-weight: var(--nb-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.nb-stepper__text {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-2);
  min-inline-size: 0;
  padding-block-start: var(--nb-spacing-2);
}

.nb-stepper__label {
  color: var(--nb-c-text-muted);
  font-size: var(--nb-stepper-label-size);
  // The type scale has no 500. Rather than hardcode one and break a branded
  // product that reweights its font, an idle label is regular and the two
  // states that must stand out are semibold.
  font-weight: var(--nb-font-weight-regular);
  line-height: 1.2;
  // No ellipsis. A truncated step label is a step nobody can identify, and
  // "Choose regi…" is worse than two lines. The floor width below is what
  // stops the wrapping from degenerating into one word per line.
  overflow-wrap: anywhere;
  transition: color 0.15s;
}

.nb-stepper__description {
  color: var(--nb-c-text-subtle);
  font-size: var(--nb-font-size-12);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

// Announced, never seen. The status word has no visual job: colour and glyph
// already carry it for a sighted reader.
.nb-stepper__status {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

// ── The connector ─────────────────────────────────────────────────────
.nb-stepper__line {
  position: absolute;
  background: var(--nb-c-border);
  transition: background 0.15s;
}

// The sequence ends at the last marker. Nothing follows it, so nothing joins
// to it.
.nb-stepper__step:last-child .nb-stepper__line {
  display: none;
}

// ── States ────────────────────────────────────────────────────────────
.nb-stepper__step--current {
  .nb-stepper__marker {
    border-color: var(--nb-c-primary);
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
  }

  .nb-stepper__label {
    color: var(--nb-c-text);
    font-weight: var(--nb-font-weight-semibold);
  }
}

.nb-stepper__step--complete {
  .nb-stepper__marker {
    border-color: var(--nb-c-primary);
    color: var(--nb-c-primary);
  }

  .nb-stepper__label {
    color: var(--nb-c-text);
  }

  // The rule leaving a complete step is the progress line itself.
  .nb-stepper__line {
    background: var(--nb-c-primary);
  }
}

.nb-stepper__step--invalid {
  .nb-stepper__marker {
    border-color: var(--nb-c-danger);
    color: var(--nb-c-danger);
  }

  .nb-stepper__label {
    color: var(--nb-c-danger);
    font-weight: var(--nb-font-weight-semibold);
  }
}

.nb-stepper__step--disabled {
  .nb-stepper__marker {
    border-color: var(--nb-c-component-disabled);
    background: var(--nb-c-surface);
    color: var(--nb-c-component-disabled);
  }

  .nb-stepper__label,
  .nb-stepper__description {
    color: var(--nb-c-component-disabled);
  }
}

// ── Interaction ───────────────────────────────────────────────────────
.nb-stepper__step--clickable .nb-stepper__body {
  cursor: pointer;

  &:hover .nb-stepper__label {
    color: var(--nb-c-primary);
    text-decoration: underline;
  }

  &:hover .nb-stepper__marker {
    border-color: var(--nb-c-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

// ── Orientation ───────────────────────────────────────────────────────
//
// Selected off the step's own `data-orientation`, written by the component
// from the value the parent provides. Never off an ancestor class: a scoped
// stylesheet has no scope id on the parent's wrapper, so the only way to
// reach it is `:global()`, and `:global(.x) .y` compiles to `.x`. The rules
// below are the connector's entire geometry and the row's floor width, so
// losing them loses the component.
.nb-stepper__step[data-orientation='horizontal'] {
  // Equal shares while there is room, and a floor once there is not. The list
  // above scrolls past that floor rather than compressing: five steps in a
  // 360px viewport would otherwise get about 70px each.
  flex: 1 1 0;
  min-inline-size: var(--nb-stepper-step-min);
  padding-inline-end: var(--nb-stepper-gap);

  // Logical, not physical. Under dir="rtl" the row runs right to left, so a
  // connector pinned with `left`/`right` is drawn on the side the sequence
  // came from and every marker overlaps the rule leaving the step before it.
  .nb-stepper__line {
    inset-block-start: calc(
      (var(--nb-stepper-marker) - var(--nb-stepper-line)) / 2
    );
    inset-inline: calc(var(--nb-stepper-marker) + var(--nb-stepper-gap)) 0;
    block-size: var(--nb-stepper-line);
  }

  // The label sits under the marker, not beside it. Beside it, a two-word
  // label would push the connector rules to different lengths and the row
  // would stop reading as an evenly spaced sequence.
  .nb-stepper__body {
    flex-direction: column;
    gap: var(--nb-spacing-8);
    inline-size: 100%;
  }

  .nb-stepper__text {
    padding-block-start: 0;
  }
}

.nb-stepper__step[data-orientation='vertical'] {
  padding-block-end: var(--nb-spacing-24);

  &:last-child {
    padding-block-end: 0;
  }

  .nb-stepper__line {
    inset-block: calc(var(--nb-stepper-marker) + var(--nb-spacing-4))
      var(--nb-spacing-4);
    inset-inline-start: calc(
      (var(--nb-stepper-marker) - var(--nb-stepper-line)) / 2
    );
    inline-size: var(--nb-stepper-line);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-stepper__marker,
  .nb-stepper__label,
  .nb-stepper__line {
    transition: none;
  }
}
</style>
