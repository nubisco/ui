<template>
  <div :class="rootClasses">
    <NbLabel v-if="label">{{ label }}</NbLabel>

    <div :class="['nb-radio__group', `nb-radio__group--${direction}`]">
      <label
        v-for="option in options"
        :key="option.value"
        :class="optionClasses(option)"
      >
        <span class="nb-radio__control">
          <input
            type="radio"
            :name="name"
            :value="option.value"
            :checked="modelValue === option.value"
            :disabled="disabled || option.disabled"
            :readonly="readonly"
            class="nb-radio__input"
            @change="!readonly && $emit('update:modelValue', option.value)"
          />
          <span class="nb-radio__circle">
            <span v-if="modelValue === option.value" class="nb-radio__dot" />
          </span>
        </span>
        <span class="nb-radio__text">{{ option.label }}</span>
      </label>
    </div>

    <NbMessage v-if="error" variant="error" class="nb-radio__message">{{
      error
    }}</NbMessage>
    <NbMessage
      v-else-if="warning"
      variant="warning"
      class="nb-radio__message"
      >{{ warning }}</NbMessage
    >
    <NbMessage v-else-if="helper" variant="helper" class="nb-radio__message">{{
      helper
    }}</NbMessage>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ERadioDirection, IRadioProps, IRadioOption } from './Radio.d'

const props = withDefaults(defineProps<IRadioProps>(), {
  id: 'radio',
  direction: ERadioDirection.Vertical,
  disabled: false,
  readonly: false,
  error: undefined,
  warning: undefined,
  helper: undefined,
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const rootClasses = computed(() => [
  'nb-radio',
  {
    'nb-radio--error': !!props.error,
    'nb-radio--warning': !props.error && !!props.warning,
    'nb-radio--disabled': props.disabled,
    'nb-radio--readonly': props.readonly,
  },
])

function optionClasses(option: IRadioOption) {
  return [
    'nb-radio__option',
    {
      'nb-radio__option--disabled': props.disabled || option.disabled,
      'nb-radio__option--readonly': props.readonly,
    },
  ]
}
</script>

<style scoped lang="scss">
.nb-radio {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--nb-font-family-sans);

  // ── Group label ─────────────────────────────────────────────────────────────
  // NbLabel handles its own styling; gap above handles spacing

  // ── Options group ───────────────────────────────────────────────────────────
  &__group {
    display: flex;
    gap: 4px;

    &--vertical {
      flex-direction: column;
    }

    &--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 12px;
    }
  }

  // ── Single option row ────────────────────────────────────────────────────────
  &__option {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    min-height: 28px;

    &--disabled {
      opacity: var(--nb-field-disabled-opacity, 0.45);
      cursor: not-allowed;
      pointer-events: none;
    }

    &--readonly {
      cursor: default;
      pointer-events: none;
    }
  }

  // ── Custom control ───────────────────────────────────────────────────────────
  &__control {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // Native input: hidden but still focusable
  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  // ── Circle ───────────────────────────────────────────────────────────────────
  &__circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--nb-c-field-border);
    border-radius: 50%;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  // ── Dot (selected indicator) ──────────────────────────────────────────────────
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--nb-c-contrast);
    animation: nb-radio-pop 0.12s ease;
  }

  // ── Option label text ─────────────────────────────────────────────────────────
  &__text {
    font-size: var(--nb-font-size-14);
    color: var(--nb-c-text);
    line-height: 1.4;
  }

  // ── Message ───────────────────────────────────────────────────────────────────
  &__message {
    font-size: var(--nb-font-size-12);
  }

  // ── Hover ─────────────────────────────────────────────────────────────────────
  &__option:not(&__option--disabled):not(&__option--readonly):hover &__circle {
    border-color: var(--nb-c-primary);
  }

  // ── Focus ring ────────────────────────────────────────────────────────────────
  &__input:focus-visible ~ &__circle {
    box-shadow: 0 0 0 2px var(--nb-c-primary);
  }

  // ── Checked: dark border + dark dot ──────────────────────────────────────────
  &__input:checked ~ &__circle {
    border-color: var(--nb-c-contrast);
  }

  // ── Error state: danger border + danger dot ───────────────────────────────────
  &--error {
    .nb-radio__circle {
      border-color: var(--nb-c-danger);
    }

    .nb-radio__input:checked ~ .nb-radio__circle {
      border-color: var(--nb-c-danger);
    }

    .nb-radio__dot {
      background: var(--nb-c-danger);
    }

    .nb-radio__option:not(.nb-radio__option--disabled):hover .nb-radio__circle {
      border-color: color-mix(
        in srgb,
        var(--nb-c-danger) 80%,
        var(--nb-c-contrast)
      );
    }
  }

  // ── Disabled (group-level) ────────────────────────────────────────────────────
  &--disabled {
    .nb-radio__group {
      opacity: var(--nb-field-disabled-opacity, 0.45);
      pointer-events: none;
    }
  }

  // ── Read-only ─────────────────────────────────────────────────────────────────
  &--readonly {
    .nb-radio__circle {
      background: transparent;
    }

    .nb-radio__input:not(:checked) ~ .nb-radio__circle {
      border-color: color-mix(
        in srgb,
        var(--nb-c-field-border) 100%,
        transparent
      );
      opacity: 0.6;
    }
  }

  @keyframes nb-radio-pop {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
}
</style>
